export interface TdxEvaluationResult {
  backend: 'tdx';
  project: string;
  agent: string;
  status: 'pass' | 'fail' | 'error' | 'needs_test_file';
  tests: TestResult[];
  rawOutput?: string;
  chatLinks?: string[];
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'error';
  details: string;
  duration?: number;
  error?: string;
}
