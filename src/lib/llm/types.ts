export interface LlmJudgeResult {
  verdict: 'pass' | 'fail';
  reasoning: string;
  conversationUrl: string;
  testNumber: number;
  totalTests: number;
  testName: string;
  prompt: string;
  evaluatedAt: string;
  evaluatorAgentId?: string;
}

export interface EvaluatorInput {
  conversationHistory: string;
  criteria: string;
  testName: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatCreateResponse {
  id: string;
  agentId: string;
  createdAt: string;
}

export interface ChatContinueResponse {
  id: string;
  messages: ChatMessage[];
}

export interface ChatHistoryResponse {
  id: string;
  messages: ChatMessage[];
}
