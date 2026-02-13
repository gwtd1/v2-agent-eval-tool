export interface Agent {
  id: string;
  name: string;
  path: string;
  project: string;
}

export interface AgentsResponse {
  agents: Agent[];
  byProject: Record<string, Agent[]>;
  count: number;
}

export interface TestResponse {
  testRunId: string;
  status: 'completed' | 'failed';
  testCaseCount?: number;
  error?: string;
  rawOutput?: string;
  needsTestFile?: boolean;
  autoRecoveryAttempted?: boolean;
}
