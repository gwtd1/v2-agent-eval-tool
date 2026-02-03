import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db/client';
import {
  createTestRun,
  createTestCase,
  createEvaluation,
  updateTestRunStatus,
} from '@/lib/db/queries';
import { executeTdxAgentTest } from '@/lib/tdx/executor';
import { extractTestCasesFromOutput, parseAgentPath, readTestYamlForAgent } from '@/lib/tdx/parser';

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
    const result = await executeTdxAgentTest(agentPath);

    console.log(`[API] TDX test completed with exit code: ${result.exitCode}`);

    if (result.exitCode !== 0) {
      // Test execution failed
      updateTestRunStatus(testRun.id, 'failed', result.stderr || result.stdout);
      return NextResponse.json({
        testRunId: testRun.id,
        status: 'failed',
        error: result.stderr || 'Test execution failed',
        rawOutput: result.stdout,
      });
    }

    // Parse test output and create test cases + evaluations in a transaction
    const parsedCases = extractTestCasesFromOutput(result.stdout);
    console.log(`[API] Parsed ${parsedCases.length} test cases`);

    // Read test.yml to get user_input and criteria for each test case
    const testYamlData = readTestYamlForAgent(agentPath);
    console.log(`[API] Read ${testYamlData.size} entries from test.yml`);

    const createdTestCases = withTransaction(() => {
      const testCases = [];
      for (const pc of parsedCases) {
        // Use user_input from test.yml as prompt, criteria as agentResponse
        const yamlData = testYamlData.get(pc.name);
        const prompt = yamlData?.userInput || pc.prompt;
        const agentResponse = yamlData?.criteria || pc.agentResponse;
        const testCase = createTestCase({
          testRunId: testRun.id,
          prompt,
          groundTruth: pc.groundTruth,
          agentResponse,
          traces: null,
        });

        // Create initial evaluation (unrated)
        createEvaluation({
          testCaseId: testCase.id,
          rating: null,
          notes: '',
        });

        testCases.push(testCase);
      }
      return testCases;
    });

    // Update test run status
    updateTestRunStatus(testRun.id, 'completed', result.stdout);

    console.log(`[API] Test run completed successfully: ${testRun.id}`);

    return NextResponse.json({
      testRunId: testRun.id,
      status: 'completed',
      testCaseCount: createdTestCases.length,
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
