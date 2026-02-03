import type { TdxEvaluationResult, TestResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ParsedAgent {
  id: string;
  name: string;
  path: string;
  project: string;
}

export interface ParsedTestCase {
  name: string;
  prompt: string;
  groundTruth: string | null;
  agentResponse: string | null;
  status: 'pass' | 'fail' | 'error';
  error?: string;
  chatLink?: string;
}

/**
 * Parse TDX agent list output
 * Handles both JSON and text formats
 */
export function parseAgentListOutput(output: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed.map((agent) => ({
        id: agent.id || agent.name,
        name: agent.name,
        path: agent.path || `agents/${agent.project}/${agent.name}`,
        project: agent.project || extractProjectFromPath(agent.path),
      }));
    }
  } catch {
    // Not JSON, parse as text
  }

  // Parse text output format
  // Expected format: "agents/{project}/{agent-name}" or similar listings
  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers or empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
      continue;
    }

    // Try to extract agent path pattern
    const pathMatch = trimmed.match(/agents\/([^/]+)\/([^/\s]+)/);
    if (pathMatch) {
      const [fullPath, project, name] = pathMatch;
      agents.push({
        id: `${project}/${name}`,
        name,
        path: fullPath,
        project,
      });
      continue;
    }

    // Try project/agent format
    const simpleMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
    if (simpleMatch) {
      const [, project, name] = simpleMatch;
      agents.push({
        id: `${project}/${name}`,
        name,
        path: `agents/${project}/${name}`,
        project,
      });
    }
  }

  return agents;
}

/**
 * Parse TDX agent test output into structured test results
 */
export function parseTestOutput(output: string, agentPath: string): TdxEvaluationResult {
  const startTime = new Date().toISOString();
  const { project, agent } = parseAgentPath(agentPath);

  // Initialize result structure
  const result: TdxEvaluationResult = {
    backend: 'tdx',
    project,
    agent,
    status: 'pass',
    tests: [],
    rawOutput: output,
    chatLinks: [],
    startTime,
  };

  // Try parsing as JSON first (some TDX versions may output JSON)
  try {
    const parsed = JSON.parse(output);
    if (parsed.tests || parsed.results) {
      return parseJsonTestOutput(parsed, result);
    }
  } catch {
    // Not JSON, parse as text
  }

  // Parse text output
  const testCases = parseTextTestOutput(output);
  result.tests = testCases;

  // Determine overall status
  if (testCases.some((t) => t.status === 'error')) {
    result.status = 'error';
  } else if (testCases.some((t) => t.status === 'fail')) {
    result.status = 'fail';
  } else if (testCases.length === 0) {
    result.status = 'needs_test_file';
  }

  // Extract chat links
  const linkMatches = output.matchAll(/https:\/\/[^\s]+chat[^\s]*/g);
  result.chatLinks = Array.from(linkMatches, (m) => m[0]);

  result.endTime = new Date().toISOString();
  result.duration = new Date(result.endTime).getTime() - new Date(startTime).getTime();

  return result;
}

/**
 * Parse JSON format test output
 */
function parseJsonTestOutput(
  parsed: Record<string, unknown>,
  result: TdxEvaluationResult
): TdxEvaluationResult {
  const tests = (parsed.tests || parsed.results || []) as Array<Record<string, unknown>>;

  result.tests = tests.map((test) => ({
    name: (test.name || test.id || 'Unknown') as string,
    status: normalizeStatus(test.status as string),
    details: (test.details || test.message || test.response || '') as string,
    duration: test.duration as number | undefined,
    error: test.error as string | undefined,
  }));

  if (parsed.status) {
    result.status = normalizeOverallStatus(parsed.status as string);
  }

  if (parsed.chatLinks || parsed.chat_links) {
    result.chatLinks = (parsed.chatLinks || parsed.chat_links) as string[];
  }

  result.endTime = new Date().toISOString();
  result.duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();

  return result;
}

/**
 * Parse text format test output
 */
function parseTextTestOutput(output: string): TestResult[] {
  const tests: TestResult[] = [];
  const lines = output.split('\n');

  let currentTest: Partial<TestResult> | null = null;
  let collectingDetails = false;
  let details: string[] = [];

  for (const line of lines) {
    // Look for test case markers
    const testMatch = line.match(/(?:Test|Case|Scenario)[\s:#]*(.+?)(?:\s*[-:]\s*(pass|fail|error))?$/i);
    if (testMatch) {
      // Save previous test if exists
      if (currentTest && currentTest.name) {
        currentTest.details = details.join('\n').trim();
        tests.push(currentTest as TestResult);
      }

      currentTest = {
        name: testMatch[1].trim(),
        status: testMatch[2] ? normalizeStatus(testMatch[2]) : 'pass',
        details: '',
      };
      details = [];
      collectingDetails = true;
      continue;
    }

    // Look for pass/fail indicators
    const statusMatch = line.match(/\b(PASS|FAIL|ERROR|SUCCESS|FAILED)\b/i);
    if (statusMatch && currentTest) {
      currentTest.status = normalizeStatus(statusMatch[1]);
    }

    // Look for error messages
    const errorMatch = line.match(/(?:Error|Exception|Failed):\s*(.+)/i);
    if (errorMatch && currentTest) {
      currentTest.error = errorMatch[1].trim();
      currentTest.status = 'error';
    }

    // Collect response/details
    if (collectingDetails && currentTest) {
      // Look for response content
      if (line.includes('Response:') || line.includes('Agent:') || line.includes('AI:')) {
        details.push(line);
      } else if (line.trim() && !line.startsWith('---') && !line.startsWith('===')) {
        details.push(line);
      }
    }

    // Look for prompt/question patterns to create test cases
    const promptMatch = line.match(/(?:Prompt|Question|User|Human):\s*(.+)/i);
    if (promptMatch && !currentTest) {
      currentTest = {
        name: promptMatch[1].substring(0, 50).trim(),
        status: 'pass',
        details: '',
      };
      details = [];
      collectingDetails = true;
    }
  }

  // Save last test
  if (currentTest && currentTest.name) {
    currentTest.details = details.join('\n').trim();
    tests.push(currentTest as TestResult);
  }

  return tests;
}

/**
 * Parse test cases from TDX CLI output for database storage
 * Handles the TDX CLI output format:
 *   Test 1/8: Test Name
 *     Round 1/1... ✓ (2.1s)
 *     Evaluating... ✓ (6.7s)
 *   ✓ PASS: Evaluation reasoning...
 *   Conversation URL: https://...
 */
export function extractTestCasesFromOutput(output: string): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];
  const lines = output.split('\n');

  let currentCase: Partial<ParsedTestCase> | null = null;
  let evaluationReason: string[] = [];

  const saveCase = () => {
    if (currentCase && currentCase.name) {
      // Use evaluation reason as the "response" since TDX doesn't output the actual prompt/response
      const evaluationText = evaluationReason.join(' ').trim();
      testCases.push({
        name: currentCase.name,
        prompt: currentCase.name, // Use test name as prompt placeholder
        groundTruth: null,
        agentResponse: evaluationText || null, // Use evaluation as response info
        status: currentCase.status || 'pass',
        error: currentCase.error,
        chatLink: currentCase.chatLink,
      });
    }
    evaluationReason = [];
  };

  for (const line of lines) {
    // Detect new test case: "Test 1/8: Test Name" or "Test 2/8: Another Test"
    const testMatch = line.match(/^Test\s+(\d+\/\d+):\s*(.+?)$/i);
    if (testMatch) {
      saveCase();
      currentCase = {
        name: testMatch[2].trim(),
        status: 'pass', // Default, will be updated by PASS/FAIL line
      };
      continue;
    }

    // Detect status and evaluation: "✓ PASS: reason" or "✗ FAIL: reason"
    const passMatch = line.match(/[✓✔]\s*PASS:\s*(.*)$/i);
    if (passMatch && currentCase) {
      currentCase.status = 'pass';
      if (passMatch[1]) {
        evaluationReason.push(passMatch[1].trim());
      }
      continue;
    }

    const failMatch = line.match(/[✗✘×]\s*FAIL:\s*(.*)$/i);
    if (failMatch && currentCase) {
      currentCase.status = 'fail';
      if (failMatch[1]) {
        evaluationReason.push(failMatch[1].trim());
        currentCase.error = failMatch[1].trim();
      }
      continue;
    }

    // Detect chat/conversation link
    const linkMatch = line.match(/(?:Conversation|Chat)\s*URL:\s*(https:\/\/[^\s]+)/i);
    if (linkMatch && currentCase) {
      currentCase.chatLink = linkMatch[1];
      continue;
    }

    // Also try to catch bare URLs on their own line after a test
    const bareUrlMatch = line.match(/^\s*(https:\/\/console[^\s]+)/);
    if (bareUrlMatch && currentCase) {
      currentCase.chatLink = bareUrlMatch[1];
      continue;
    }
  }

  // Save last case
  saveCase();

  return testCases;
}

/**
 * Parse agent path into project and agent name
 */
export function parseAgentPath(agentPath: string): { project: string; agent: string } {
  // Handle "agents/{project}/{agent}" format
  const fullMatch = agentPath.match(/agents\/([^/]+)\/([^/]+)/);
  if (fullMatch) {
    return { project: fullMatch[1], agent: fullMatch[2] };
  }

  // Handle "{project}/{agent}" format
  const simpleMatch = agentPath.match(/([^/]+)\/([^/]+)/);
  if (simpleMatch) {
    return { project: simpleMatch[1], agent: simpleMatch[2] };
  }

  // Just agent name
  return { project: 'default', agent: agentPath };
}

/**
 * Extract project from agent path
 */
function extractProjectFromPath(path: string): string {
  const match = path?.match(/agents\/([^/]+)/);
  return match ? match[1] : 'default';
}

/**
 * Normalize status string to valid status
 */
function normalizeStatus(status: string): 'pass' | 'fail' | 'error' {
  const lower = status?.toLowerCase() || '';
  if (lower.includes('pass') || lower.includes('success')) return 'pass';
  if (lower.includes('fail')) return 'fail';
  return 'error';
}

/**
 * Normalize overall status
 */
function normalizeOverallStatus(
  status: string
): 'pass' | 'fail' | 'error' | 'needs_test_file' {
  const lower = status?.toLowerCase() || '';
  if (lower.includes('needs') || lower.includes('missing')) return 'needs_test_file';
  if (lower.includes('pass') || lower.includes('success')) return 'pass';
  if (lower.includes('fail')) return 'fail';
  return 'error';
}

interface TestYamlEntry {
  name: string;
  user_input: string;
  criteria?: string;
}

interface TestYamlFile {
  tests: TestYamlEntry[];
}

export interface TestYamlData {
  userInput: string;
  criteria: string;
}

/**
 * Read test.yml file for an agent and return a map of test name to user_input and criteria
 */
export function readTestYamlForAgent(agentPath: string): Map<string, TestYamlData> {
  const testYamlPath = path.join(process.cwd(), agentPath, 'test.yml');
  const map = new Map<string, TestYamlData>();

  try {
    const content = fs.readFileSync(testYamlPath, 'utf-8');
    const parsed = yaml.load(content) as TestYamlFile;

    for (const test of parsed.tests || []) {
      if (test.name && test.user_input) {
        map.set(test.name, {
          userInput: test.user_input,
          criteria: test.criteria || '',
        });
      }
    }
  } catch (e) {
    console.warn(`Could not read test.yml for ${agentPath}:`, e);
  }

  return map;
}
