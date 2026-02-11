import { v4 as uuidv4 } from 'uuid';
import { getDb } from './client';
import type { TestRun, TestCase, Evaluation, CreateEvaluationInput, UpdateEvaluationInput } from '../types';
import type { LlmJudgeResult } from '../llm/types';

// Helper to convert snake_case DB rows to camelCase
function toCamelCase<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result as T;
}

// Helper to parse LLM judge result JSON
function parseTestCaseRow(row: Record<string, unknown>): TestCase {
  const testCase = toCamelCase<TestCase>(row);
  // Parse llmJudgeResult from JSON string
  if (testCase.llmJudgeResult && typeof testCase.llmJudgeResult === 'string') {
    try {
      testCase.llmJudgeResult = JSON.parse(testCase.llmJudgeResult as unknown as string);
    } catch {
      testCase.llmJudgeResult = null;
    }
  }
  return testCase;
}

// Test Runs
export function createTestRun(data: Omit<TestRun, 'id' | 'createdAt'>): TestRun {
  const db = getDb();
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO test_runs (id, agent_id, agent_path, executed_at, status, raw_output)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.agentId, data.agentPath, data.executedAt, data.status, data.rawOutput);
  return getTestRun(id)!;
}

export function getTestRun(id: string): TestRun | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM test_runs WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? toCamelCase<TestRun>(row) : undefined;
}

export function getAllTestRuns(): TestRun[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM test_runs ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<TestRun>(row));
}

export function updateTestRunStatus(id: string, status: TestRun['status'], rawOutput?: string): void {
  const db = getDb();
  if (rawOutput !== undefined) {
    const stmt = db.prepare('UPDATE test_runs SET status = ?, raw_output = ? WHERE id = ?');
    stmt.run(status, rawOutput, id);
  } else {
    const stmt = db.prepare('UPDATE test_runs SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }
}

/**
 * Hard delete a test run and all associated test cases and evaluations.
 * Cascade delete is configured in the schema, so this will automatically
 * remove all associated records.
 */
export function deleteTestRun(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM test_runs WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Test Cases
export function createTestCase(data: Omit<TestCase, 'id' | 'createdAt'>): TestCase {
  const db = getDb();
  const id = uuidv4();
  const llmJudgeResultJson = data.llmJudgeResult ? JSON.stringify(data.llmJudgeResult) : null;
  const stmt = db.prepare(`
    INSERT INTO test_cases (id, test_run_id, prompt, ground_truth, agent_response, traces, llm_judge_result)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.testRunId, data.prompt, data.groundTruth, data.agentResponse, data.traces, llmJudgeResultJson);
  return getTestCase(id)!;
}

export function getTestCasesByRunId(testRunId: string): TestCase[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM test_cases WHERE test_run_id = ? ORDER BY created_at ASC');
  const rows = stmt.all(testRunId) as Record<string, unknown>[];
  return rows.map((row) => parseTestCaseRow(row));
}

export function getTestCase(id: string): TestCase | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM test_cases WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? parseTestCaseRow(row) : undefined;
}

export function updateTestCase(id: string, data: Partial<Pick<TestCase, 'agentResponse' | 'traces'>>): TestCase | undefined {
  const db = getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.agentResponse !== undefined) {
    updates.push('agent_response = ?');
    values.push(data.agentResponse);
  }
  if (data.traces !== undefined) {
    updates.push('traces = ?');
    values.push(data.traces);
  }

  if (updates.length === 0) return getTestCase(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE test_cases SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getTestCase(id);
}

export function updateTestCaseLlmJudgeResult(id: string, result: LlmJudgeResult): TestCase | undefined {
  const db = getDb();
  const resultJson = JSON.stringify(result);
  const stmt = db.prepare('UPDATE test_cases SET llm_judge_result = ? WHERE id = ?');
  const updateResult = stmt.run(resultJson, id);

  // Verify write succeeded
  if (updateResult.changes === 0) {
    console.error(`[DB] Failed to update llm_judge_result for test case: ${id} - no rows affected`);
    return undefined;
  }

  console.log(`[DB] Updated llm_judge_result for test case: ${id}`);
  return getTestCase(id);
}

// Evaluations
export function createEvaluation(data: CreateEvaluationInput): Evaluation {
  const db = getDb();
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO evaluations (id, test_case_id, rating, notes)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, data.testCaseId, data.rating, data.notes);
  return getEvaluation(id)!;
}

export function getEvaluation(id: string): Evaluation | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM evaluations WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Evaluation>(row) : undefined;
}

export function getEvaluationByTestCaseId(testCaseId: string): Evaluation | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM evaluations WHERE test_case_id = ?');
  const row = stmt.get(testCaseId) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Evaluation>(row) : undefined;
}

export function updateEvaluation(id: string, data: UpdateEvaluationInput): Evaluation | undefined {
  const db = getDb();
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: unknown[] = [];

  if (data.rating !== undefined) {
    updates.push('rating = ?');
    values.push(data.rating);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }
  if (data.durationMs !== undefined) {
    updates.push('duration_ms = ?');
    values.push(data.durationMs);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE evaluations SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getEvaluation(id);
}

export function getEvaluationsByRunId(testRunId: string): Evaluation[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT e.* FROM evaluations e
    JOIN test_cases tc ON e.test_case_id = tc.id
    WHERE tc.test_run_id = ?
    ORDER BY e.created_at ASC
  `);
  const rows = stmt.all(testRunId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Evaluation>(row));
}
