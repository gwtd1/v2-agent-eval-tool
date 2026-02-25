export interface Agent {
  id: string;
  name: string;
  path: string;
  project: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentsResponse {
  agents: Agent[];
  byProject: Record<string, Agent[]>;
  count: number;
  // New fields for Feature #1: API Performance Optimization
  projects?: Project[];
  method?: 'direct_api' | 'tdx_cli_fallback';
  performance?: {
    duration_ms: number;
    approach: 'parallel_http_calls' | 'subprocess_execution';
  };
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
