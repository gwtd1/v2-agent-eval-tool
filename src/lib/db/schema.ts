export const SCHEMA = `
CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_path TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  raw_output TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  test_run_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ground_truth TEXT,
  agent_response TEXT,
  traces TEXT,
  llm_judge_result TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('true', 'false') OR rating IS NULL),
  notes TEXT DEFAULT '',
  duration_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_cases_run ON test_cases(test_run_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_case ON evaluations(test_case_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_rating ON evaluations(rating);
`;
