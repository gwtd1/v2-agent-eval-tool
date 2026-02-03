export interface TestCase {
  id: string;
  testRunId: string;
  prompt: string;
  groundTruth: string | null;
  agentResponse: string | null;
  traces: string | null; // JSON string, deferred to V2
  createdAt: string;
}

export interface TestRun {
  id: string;
  agentId: string;
  agentPath: string;
  executedAt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  rawOutput: string | null;
  createdAt: string;
}
