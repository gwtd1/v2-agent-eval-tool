import type { LlmJudgeResult, EvaluatorInput } from './types';
import { EVALUATOR_AGENT_ID, getApiUrl, buildConversationUrl } from './config';
import { formatEvaluationPrompt, parseEvaluatorResponse } from './prompts';

const REQUEST_TIMEOUT = 60000; // 60 seconds for LLM responses

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
  input?: string;  // User message
  content?: string;  // Assistant message
  at: string;
}

interface ChatHistoryResponse {
  data: ChatHistoryMessage[];
}

/**
 * Create a new chat session with the evaluator agent.
 * Uses JSON:API format as required by TD LLM API.
 */
export async function createChat(apiKey: string): Promise<{ id: string; agentId: string }> {
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
          agentId: EVALUATOR_AGENT_ID,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create chat: ${response.status} ${errorText}`);
  }

  const result: ChatCreateApiResponse = await response.json();
  return {
    id: result.data.id,
    agentId: result.data.attributes.agentId,
  };
}

/**
 * Continue an existing chat with a new message.
 * Uses 'input' field as required by TD LLM API.
 */
export async function continueChat(
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
 * Get chat history to retrieve the assistant's response.
 */
export async function getChatHistory(
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
 * Extract the assistant's response text from chat history.
 * History format: { data: [{ input: "user msg" }, { content: "assistant msg" }, ...] }
 */
function extractAssistantResponse(history: ChatHistoryResponse): string {
  // Find messages with 'content' field (assistant responses)
  const assistantMessages = history.data.filter(
    msg => msg.content !== undefined
  );

  if (assistantMessages.length === 0) {
    return '';
  }

  // Get content from the last assistant message
  const lastAssistant = assistantMessages[assistantMessages.length - 1];
  return lastAssistant.content || '';
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

export interface EvaluateTestCaseInput {
  conversationHistory: string;
  criteria: string;
  testName: string;
  testNumber: number;
  totalTests: number;
  prompt: string;
}

/**
 * Main function to evaluate a single test case using the LLM judge.
 */
export async function evaluateWithLlm(
  input: EvaluateTestCaseInput,
  apiKey: string
): Promise<LlmJudgeResult> {
  const evaluatorInput: EvaluatorInput = {
    conversationHistory: input.conversationHistory,
    criteria: input.criteria,
    testName: input.testName,
  };

  const evaluationPrompt = formatEvaluationPrompt(evaluatorInput);

  // Create a new chat session
  const chat = await createChat(apiKey);

  // Send the evaluation prompt
  await continueChat(chat.id, evaluationPrompt, apiKey);

  // Poll for the assistant's response (the continue endpoint is async)
  let responseContent = '';
  const maxAttempts = 60; // 60 seconds max wait
  const pollInterval = 1000; // 1 second between polls

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const history = await getChatHistory(chat.id, apiKey);
    responseContent = extractAssistantResponse(history);

    if (responseContent) {
      break;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  if (!responseContent) {
    throw new Error('Timeout waiting for evaluator response after 60 seconds');
  }

  // Parse the response
  const { verdict, reasoning } = parseEvaluatorResponse(responseContent);

  return {
    verdict,
    reasoning,
    conversationUrl: buildConversationUrl(chat.id),
    testNumber: input.testNumber,
    totalTests: input.totalTests,
    testName: input.testName,
    prompt: input.prompt,
    evaluatedAt: new Date().toISOString(),
    evaluatorAgentId: EVALUATOR_AGENT_ID,
  };
}

export interface TestCaseForEvaluation {
  id: string;
  testName: string;
  prompt: string;
  agentResponse: string | null;
  groundTruth: string | null;
}

/**
 * Batch evaluation for multiple test cases.
 */
export async function evaluateTestCases(
  testCases: TestCaseForEvaluation[],
  apiKey: string,
  onProgress?: (current: number, total: number, testName: string) => void
): Promise<Map<string, LlmJudgeResult>> {
  const results = new Map<string, LlmJudgeResult>();
  const totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testNumber = i + 1;

    if (onProgress) {
      onProgress(testNumber, totalTests, testCase.testName);
    }

    try {
      // Build conversation history from the test case
      const conversationHistory = buildConversationHistory(testCase);

      // Use ground truth as criteria, or a default if not available
      const criteria = testCase.groundTruth || 'Evaluate if the response is helpful, accurate, and addresses the user query appropriately.';

      const result = await evaluateWithLlm(
        {
          conversationHistory,
          criteria,
          testName: testCase.testName,
          testNumber,
          totalTests,
          prompt: testCase.prompt,
        },
        apiKey
      );

      results.set(testCase.id, result);
    } catch (error) {
      // Store error as a failed result
      console.error(`[LLM Evaluator] Error evaluating test case ${testCase.testName}:`, error);

      results.set(testCase.id, {
        verdict: 'fail',
        reasoning: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        conversationUrl: '',
        testNumber,
        totalTests,
        testName: testCase.testName,
        prompt: testCase.prompt,
        evaluatedAt: new Date().toISOString(),
        evaluatorAgentId: EVALUATOR_AGENT_ID,
      });
    }
  }

  return results;
}

/**
 * Build a conversation history string from a test case.
 */
function buildConversationHistory(testCase: TestCaseForEvaluation): string {
  const parts: string[] = [];

  parts.push(`User: ${testCase.prompt}`);

  if (testCase.agentResponse) {
    parts.push(`Assistant: ${testCase.agentResponse}`);
  } else {
    parts.push('Assistant: [No response]');
  }

  return parts.join('\n\n');
}
