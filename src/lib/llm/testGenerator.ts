import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GeneratedTestCase {
  name: string;
  user_input: string;
  criteria: string;
}

/**
 * Build the prompt for generating test cases.
 * Keep it concise to get faster responses.
 */
function buildTestGenerationPrompt(agentName: string, agentPrompt: string): string {
  // Truncate prompt if too long to speed up processing
  const truncatedPrompt = agentPrompt.length > 1000
    ? agentPrompt.substring(0, 1000) + '...[truncated]'
    : agentPrompt;

  return `Generate 3 test cases for this agent. Return ONLY YAML, no other text.

Agent: ${agentName}
Purpose: ${truncatedPrompt}

Output format:
tests:
  - name: "Test Name"
    user_input: "User message"
    criteria: "Pass criteria"
  - name: "Test Name 2"
    user_input: "User message"
    criteria: "Pass criteria"
  - name: "Test Name 3"
    user_input: "User message"
    criteria: "Pass criteria"`;
}

/**
 * Parse the LLM response to extract test cases.
 */
function parseTestCasesFromResponse(response: string): GeneratedTestCase[] {
  // Try to extract YAML content
  let yamlContent = response;

  // Remove markdown code blocks if present
  const codeBlockMatch = response.match(/```(?:yaml|yml)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    yamlContent = codeBlockMatch[1];
  }

  // Simple YAML parsing for our specific format
  const testCases: GeneratedTestCase[] = [];

  // Match test case blocks more flexibly
  const testBlocks = yamlContent.split(/\n\s*-\s*name:/i);

  for (let i = 1; i < testBlocks.length; i++) {
    const block = '- name:' + testBlocks[i];

    const nameMatch = block.match(/name:\s*["']?([^"'\n]+)["']?/i);
    const inputMatch = block.match(/user_input:\s*["']?([^"'\n]+)["']?/i);
    const criteriaMatch = block.match(/criteria:\s*["']?([^"'\n]+)["']?/i);

    if (nameMatch && inputMatch && criteriaMatch) {
      testCases.push({
        name: nameMatch[1].trim().replace(/^["']|["']$/g, ''),
        user_input: inputMatch[1].trim().replace(/^["']|["']$/g, ''),
        criteria: criteriaMatch[1].trim().replace(/^["']|["']$/g, ''),
      });
    }
  }

  return testCases;
}

/**
 * Generate test cases for an agent based on its prompt using TDX CLI.
 * Uses tdx chat command which is more reliable than the API.
 */
export async function generateTestCases(
  agentName: string,
  agentPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _apiKey: string
): Promise<GeneratedTestCase[]> {
  console.log(`[TestGenerator] Generating test cases for agent: ${agentName}`);

  const generationPrompt = buildTestGenerationPrompt(agentName, agentPrompt);

  // Escape the prompt for shell - use base64 encoding to avoid escaping issues
  const base64Prompt = Buffer.from(generationPrompt).toString('base64');

  // Use tdx chat with the evaluator agent (or any capable agent)
  // Decode base64 prompt and pass to tdx chat
  const command = `echo "${base64Prompt}" | base64 -d | tdx chat --new --agent "tdx_default_gregwilliams/tdx-agent-evaluator"`;

  console.log(`[TestGenerator] Executing tdx chat command`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minutes
      env: {
        ...process.env,
        TD_API_KEY: process.env.TD_API_KEY,
      },
    });

    if (stderr && !stderr.includes('Session')) {
      console.warn(`[TestGenerator] stderr: ${stderr}`);
    }

    console.log(`[TestGenerator] Received response (${stdout.length} chars)`);

    // Parse the response
    const testCases = parseTestCasesFromResponse(stdout);

    if (testCases.length === 0) {
      console.warn(`[TestGenerator] Failed to parse test cases from: ${stdout.substring(0, 300)}...`);
      throw new Error('Failed to parse test cases from LLM response');
    }

    console.log(`[TestGenerator] Generated ${testCases.length} test cases`);
    return testCases;
  } catch (error) {
    const err = error as { code?: number; message?: string };
    console.error(`[TestGenerator] Command failed: ${err.message}`);
    throw new Error(`Test generation failed: ${err.message}`);
  }
}

/**
 * Format test cases as YAML content for test.yml file.
 */
export function formatTestCasesAsYaml(
  agentName: string,
  testCases: GeneratedTestCase[]
): string {
  const lines = [
    `# Test cases for ${agentName}`,
    `# Auto-generated based on agent prompt`,
    `# Documentation: https://tdx.treasuredata.com/commands/agent.html`,
    ``,
    `tests:`,
  ];

  for (const tc of testCases) {
    lines.push(`  - name: "${escapeYamlString(tc.name)}"`);
    lines.push(`    user_input: "${escapeYamlString(tc.user_input)}"`);
    lines.push(`    criteria: "${escapeYamlString(tc.criteria)}"`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Escape special characters in YAML strings.
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
