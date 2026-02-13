import { getApiUrl } from './config';

const REQUEST_TIMEOUT = 90000; // 90 seconds for test generation

// Use a general-purpose agent for test generation
// This agent should be capable of understanding prompts and generating test cases
const TEST_GENERATOR_AGENT_ID = '019ae82f-b843-79f5-95c6-c7968262b2c2';

interface GeneratedTestCase {
  name: string;
  user_input: string;
  criteria: string;
}

interface ChatCreateApiResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      agentId: string;
      createdAt: string;
    };
  };
}

interface ChatHistoryMessage {
  input?: string;
  content?: string;
  at: string;
}

interface ChatHistoryResponse {
  data: ChatHistoryMessage[];
}

/**
 * Fetch with timeout support.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Create a new chat session for test generation.
 */
async function createChat(apiKey: string): Promise<{ id: string }> {
  const url = `${getApiUrl()}/chats`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `TD1 ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'chats',
        attributes: {
          agentId: TEST_GENERATOR_AGENT_ID,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create chat: ${response.status} ${errorText}`);
  }

  const result: ChatCreateApiResponse = await response.json();
  return { id: result.data.id };
}

/**
 * Continue chat with a message.
 */
async function continueChat(
  chatId: string,
  message: string,
  apiKey: string
): Promise<void> {
  const url = `${getApiUrl()}/chats/${chatId}/continue`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `TD1 ${apiKey}`,
    },
    body: JSON.stringify({
      input: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to continue chat: ${response.status} ${errorText}`);
  }
}

/**
 * Get chat history.
 */
async function getChatHistory(
  chatId: string,
  apiKey: string
): Promise<ChatHistoryResponse> {
  const url = `${getApiUrl()}/chats/${chatId}/history`;

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `TD1 ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get chat history: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Extract assistant response from history.
 */
function extractAssistantResponse(history: ChatHistoryResponse): string {
  const assistantMessages = history.data.filter(
    msg => msg.content !== undefined
  );

  if (assistantMessages.length === 0) {
    return '';
  }

  const lastAssistant = assistantMessages[assistantMessages.length - 1];
  return lastAssistant.content || '';
}

/**
 * Build the prompt for generating test cases.
 */
function buildTestGenerationPrompt(agentName: string, agentPrompt: string): string {
  return `You are a test case generator. Given an AI agent's system prompt, generate 3 meaningful test cases to evaluate the agent's performance.

## Agent Name
${agentName}

## Agent System Prompt
${agentPrompt}

## Task
Generate exactly 3 test cases that will meaningfully evaluate this agent's core capabilities. Each test case should:
1. Test a specific capability mentioned in the agent's prompt
2. Have a clear, specific user input (not just "Hello")
3. Have measurable evaluation criteria

## Output Format
Return ONLY valid YAML in this exact format, with no additional text before or after:

tests:
  - name: "Test Name 1"
    user_input: "The actual user message to send to the agent"
    criteria: "Specific criteria to evaluate if the response is correct"
  - name: "Test Name 2"
    user_input: "The actual user message to send to the agent"
    criteria: "Specific criteria to evaluate if the response is correct"
  - name: "Test Name 3"
    user_input: "The actual user message to send to the agent"
    criteria: "Specific criteria to evaluate if the response is correct"

Generate test cases that actually test the agent's stated purpose, not generic greetings.`;
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
  const testMatches = yamlContent.matchAll(
    /-\s*name:\s*["']?([^"'\n]+)["']?\s*\n\s*user_input:\s*["']?([^"'\n]+(?:\n(?!\s*criteria:)[^"'\n]*)*)["']?\s*\n\s*criteria:\s*["']?([^"'\n]+(?:\n(?!\s*-\s*name:)[^"'\n]*)*)["']?/gi
  );

  for (const match of testMatches) {
    testCases.push({
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      user_input: match[2].trim().replace(/^["']|["']$/g, ''),
      criteria: match[3].trim().replace(/^["']|["']$/g, ''),
    });
  }

  return testCases;
}

/**
 * Generate test cases for an agent based on its prompt.
 */
export async function generateTestCases(
  agentName: string,
  agentPrompt: string,
  apiKey: string
): Promise<GeneratedTestCase[]> {
  console.log(`[TestGenerator] Generating test cases for agent: ${agentName}`);

  const generationPrompt = buildTestGenerationPrompt(agentName, agentPrompt);

  // Create chat session
  const chat = await createChat(apiKey);
  console.log(`[TestGenerator] Created chat session: ${chat.id}`);

  // Send the generation prompt
  await continueChat(chat.id, generationPrompt, apiKey);

  // Poll for response
  let responseContent = '';
  const maxAttempts = 90;
  const pollInterval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const history = await getChatHistory(chat.id, apiKey);
    responseContent = extractAssistantResponse(history);

    if (responseContent) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  if (!responseContent) {
    throw new Error('Timeout waiting for test generation response');
  }

  console.log(`[TestGenerator] Received response, parsing test cases`);

  // Parse the response
  const testCases = parseTestCasesFromResponse(responseContent);

  if (testCases.length === 0) {
    console.warn(`[TestGenerator] Failed to parse test cases from response: ${responseContent.substring(0, 200)}...`);
    throw new Error('Failed to parse test cases from LLM response');
  }

  console.log(`[TestGenerator] Generated ${testCases.length} test cases`);
  return testCases;
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
