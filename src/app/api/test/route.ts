import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db/client';
import {
  createTestRun,
  createTestCase,
  createEvaluation,
  updateTestRunStatus,
  updateTestCaseLlmJudgeResult,
} from '@/lib/db/queries';
import { executeTdxAgentTest, initTdxAgentTest, executeTdxLlmHistory, extractThreadIdFromUrl } from '@/lib/tdx/executor';
import { extractTestCasesFromOutput, parseAgentPath, readTestYamlForAgent } from '@/lib/tdx/parser';
import { evaluateWithLlm } from '@/lib/llm/evaluator';
import type { TestCase } from '@/lib/types';

/**
 * Detect if test failure is due to missing test.yml file
 */
function detectNeedsTestFile(stdout: string, stderr: string): boolean {
  const combined = `${stdout}\n${stderr}`.toLowerCase();
  return (
    combined.includes('no test') ||
    combined.includes('test.yml not found') ||
    combined.includes('missing test') ||
    combined.includes('no tests found') ||
    combined.includes('test file not found') ||
    combined.includes('cannot find test')
  );
}

/**
 * Detect if TDX output contains valid test results
 * TDX returns exit code 1 when tests run but some fail - this is still a successful execution
 */
function containsValidTestResults(stdout: string): boolean {
  // Look for test summary section which indicates tests actually ran
  const hasTestSummary = stdout.includes('Test Summary') || stdout.includes('Total:');
  // Look for individual test markers
  const hasTestCases = /Test\s+\d+\/\d+:/.test(stdout);
  // Look for pass/fail indicators
  const hasResults = /[✓✔]\s*PASS:|[✗✘×]\s*FAIL:/.test(stdout);

  return hasTestSummary || (hasTestCases && hasResults);
}

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/test - Starting test execution');

  // Parse request body
  let body: { agentPath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate agentPath
  const { agentPath } = body;
  if (!agentPath || typeof agentPath !== 'string') {
    return NextResponse.json(
      { error: 'agentPath is required and must be a string' },
      { status: 400 }
    );
  }

  if (!agentPath.includes('/')) {
    return NextResponse.json(
      { error: 'agentPath must be in format "project/agent" or "agents/project/agent"' },
      { status: 400 }
    );
  }

  const { project, agent } = parseAgentPath(agentPath);
  const agentId = `${project}/${agent}`;

  console.log(`[API] Testing agent: ${agentPath}`);

  // Create test run with "running" status
  const testRun = createTestRun({
    agentId,
    agentPath,
    executedAt: new Date().toISOString(),
    status: 'running',
    rawOutput: null,
  });

  console.log(`[API] Created test run: ${testRun.id}`);

  try {
    // Execute TDX test (5-min timeout is set in executor)
    let result = await executeTdxAgentTest(agentPath);
    let autoRecoveryAttempted = false;

    console.log(`[API] TDX test completed with exit code: ${result.exitCode}`);

    if (result.exitCode !== 0) {
      // Check if we have valid test results despite non-zero exit code
      // TDX returns exit code 1 when tests run but some fail - this is a successful execution
      const hasValidResults = containsValidTestResults(result.stdout);

      if (hasValidResults) {
        console.log('[API] Exit code non-zero but valid test results found - continuing with parsing');
        // Continue processing - don't treat as failure
      } else {
        // Check if it's a "needs test file" situation
        const needsTestFile = detectNeedsTestFile(result.stdout, result.stderr);

        if (needsTestFile) {
          console.log('[API] Test file missing, attempting to create via tdx agent test-init');
          autoRecoveryAttempted = true;

          // Try to create test file
          const initResult = await initTdxAgentTest(agentPath);

          if (initResult.exitCode === 0) {
            console.log('[API] Test file created, retrying test execution');
            // Retry the test
            result = await executeTdxAgentTest(agentPath);
            console.log(`[API] Retry TDX test completed with exit code: ${result.exitCode}`);
          } else {
            console.error('[API] Failed to create test file:', initResult.stderr);
          }
        }

        // Check again for valid results after potential retry
        const hasValidResultsAfterRetry = containsValidTestResults(result.stdout);

        // If still no valid results after potential retry, return error
        if (result.exitCode !== 0 && !hasValidResultsAfterRetry) {
          updateTestRunStatus(testRun.id, 'failed', result.stderr || result.stdout);
          return NextResponse.json({
            testRunId: testRun.id,
            status: 'failed',
            error: result.stderr || 'Test execution failed',
            rawOutput: result.stdout,
            needsTestFile: needsTestFile && !autoRecoveryAttempted,
            autoRecoveryAttempted,
          });
        }
      }
    }

    // Parse test output and create test cases + evaluations in a transaction
    const parsedCases = extractTestCasesFromOutput(result.stdout);
    console.log(`[API] Parsed ${parsedCases.length} test cases`);

    // Read test.yml to get user_input and criteria for each test case
    const testYamlData = readTestYamlForAgent(agentPath);
    console.log(`[API] Read ${testYamlData.size} entries from test.yml`);

    // Store test name mapping for LLM evaluation
    const testNameMap = new Map<string, string>();

    // Fetch actual agent responses using tdx llm history for each test case
    // This retrieves the exact response from the test run conversation (not a new session)
    console.log(`[API] Fetching actual agent responses for ${parsedCases.length} test cases via chat history`);
    const agentResponses = new Map<string, string>();

    for (let i = 0; i < parsedCases.length; i++) {
      const pc = parsedCases[i];

      console.log(`[API] Fetching response ${i + 1}/${parsedCases.length}: ${pc.name}`);

      // Use chatLink to get the thread ID and fetch history
      if (pc.chatLink) {
        const threadId = extractThreadIdFromUrl(pc.chatLink);
        if (threadId) {
          try {
            const historyResult = await executeTdxLlmHistory(threadId);
            if (historyResult.exitCode === 0 && historyResult.entries.length > 0) {
              // Find the agent response (entry with 'content' field, not 'input')
              const agentEntry = historyResult.entries.find(e => e.content !== undefined);
              if (agentEntry?.content) {
                agentResponses.set(pc.name, agentEntry.content);
                console.log(`[API] Got response for ${pc.name}: ${agentEntry.content.substring(0, 100)}...`);
              } else {
                console.warn(`[API] No agent response found in history for ${pc.name}`);
              }
            } else {
              console.warn(`[API] Failed to get history for ${pc.name}: ${historyResult.error || 'empty history'}`);
            }
          } catch (error) {
            console.error(`[API] Error fetching history for ${pc.name}:`, error);
          }
        } else {
          console.warn(`[API] Could not extract thread ID from chatLink for ${pc.name}: ${pc.chatLink}`);
        }
      } else {
        console.warn(`[API] No chatLink available for ${pc.name}, using parsed response`);
      }
    }

    const createdTestCases = withTransaction(() => {
      const testCases: TestCase[] = [];
      for (let i = 0; i < parsedCases.length; i++) {
        const pc = parsedCases[i];
        // Use user_input from test.yml as prompt
        const yamlData = testYamlData.get(pc.name);
        const prompt = yamlData?.userInput || pc.prompt;
        // Use actual agent response from tdx chat, fallback to parsed response
        const agentResponse = agentResponses.get(pc.name) || pc.agentResponse;
        // Use criteria from test.yml as ground truth
        const groundTruth = yamlData?.criteria || pc.groundTruth;
        const testCase = createTestCase({
          testRunId: testRun.id,
          prompt,
          groundTruth,
          agentResponse,
          traces: null,
          llmJudgeResult: null,
          chatLink: pc.chatLink || null,
        });

        // Create initial evaluation (unrated)
        createEvaluation({
          testCaseId: testCase.id,
          rating: null,
          notes: '',
        });

        testCases.push(testCase);
        testNameMap.set(testCase.id, pc.name);
      }
      return testCases;
    });

    // LLM-as-a-Judge evaluation
    const apiKey = process.env.TD_API_KEY;
    let completedLlmEvaluations = 0;

    if (apiKey) {
      console.log(`[API] Starting LLM evaluation for ${createdTestCases.length} test cases`);
      const totalTests = createdTestCases.length;

      for (let i = 0; i < createdTestCases.length; i++) {
        const testCase = createdTestCases[i];
        const testNumber = i + 1;
        const testName = testNameMap.get(testCase.id) || `Test ${testNumber}`;

        console.log(`[API] LLM evaluation ${testNumber}/${totalTests}: Starting ${testName}`);

        try {
          // Build conversation history
          const conversationHistory = `User: ${testCase.prompt}\n\nAssistant: ${testCase.agentResponse || '[No response]'}`;

          // Use ground truth as criteria
          const criteria = testCase.groundTruth || 'Evaluate if the response is helpful, accurate, and addresses the user query appropriately.';

          const llmResult = await evaluateWithLlm(
            {
              conversationHistory,
              criteria,
              testName,
              testNumber,
              totalTests,
              prompt: testCase.prompt,
            },
            apiKey
          );

          // Update test case with LLM result
          const updatedTestCase = updateTestCaseLlmJudgeResult(testCase.id, llmResult);
          if (updatedTestCase) {
            completedLlmEvaluations++;
            console.log(`[API] LLM evaluation ${testNumber}/${totalTests} complete: ${testName} -> ${llmResult.verdict}`);
          } else {
            console.error(`[API] LLM evaluation ${testNumber}/${totalTests} FAILED TO SAVE: ${testName}`);
          }
        } catch (error) {
          console.error(`[API] LLM evaluation ${testNumber}/${totalTests} error for ${testName}:`, error);
          // Continue with other test cases even if one fails
        }
      }

      console.log(`[API] All LLM evaluations complete: ${completedLlmEvaluations}/${totalTests} saved`);
    } else {
      console.log('[API] Skipping LLM evaluation - TD_API_KEY not set');
    }

    // Ensure all writes are flushed to SQLite before responding
    // This small delay allows any pending write operations to complete
    console.log('[API] Flushing database writes...');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update test run status AFTER flush
    updateTestRunStatus(testRun.id, 'completed', result.stdout);

    console.log(`[API] Test run completed successfully: ${testRun.id} (${createdTestCases.length} test cases, ${completedLlmEvaluations} LLM evaluations)`);

    return NextResponse.json({
      testRunId: testRun.id,
      status: 'completed',
      testCaseCount: createdTestCases.length,
      llmEvaluationCount: completedLlmEvaluations,
      testCases: createdTestCases,
    });
  } catch (error) {
    console.error('[API] Test execution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateTestRunStatus(testRun.id, 'failed', errorMessage);

    return NextResponse.json(
      {
        testRunId: testRun.id,
        status: 'failed',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
