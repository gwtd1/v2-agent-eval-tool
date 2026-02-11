import { getDb, closeDb } from '../src/lib/db/client';
import {
  createTestRun,
  getTestRun,
  createTestCase,
  getTestCasesByRunId,
  createEvaluation,
  getEvaluationByTestCaseId
} from '../src/lib/db/queries';

console.log('Testing database operations...\n');

// Initialize database
const db = getDb();
console.log('✓ Database initialized\n');

// Create a test run
const testRun = createTestRun({
  agentId: 'test-agent',
  agentPath: 'agents/test/test-agent',
  executedAt: new Date().toISOString(),
  status: 'pending',
  rawOutput: null
});
console.log('✓ Created test run:', testRun.id);

// Retrieve the test run
const retrieved = getTestRun(testRun.id);
console.log('✓ Retrieved test run:', retrieved?.id);
console.log('  Status:', retrieved?.status);
console.log('  Agent:', retrieved?.agentId);

// Create a test case
const testCase = createTestCase({
  testRunId: testRun.id,
  prompt: 'What is 2 + 2?',
  groundTruth: '4',
  agentResponse: null,
  traces: null,
  llmJudgeResult: null
});
console.log('\n✓ Created test case:', testCase.id);

// Get test cases by run
const testCases = getTestCasesByRunId(testRun.id);
console.log('✓ Found', testCases.length, 'test case(s) for run');

// Create an evaluation
const evaluation = createEvaluation({
  testCaseId: testCase.id,
  rating: 'true',
  notes: 'Correct answer'
});
console.log('\n✓ Created evaluation:', evaluation.id);

// Get evaluation by test case
const foundEval = getEvaluationByTestCaseId(testCase.id);
console.log('✓ Found evaluation for test case');
console.log('  Rating:', foundEval?.rating);
console.log('  Notes:', foundEval?.notes);

console.log('\n✓ All database operations working correctly!');

closeDb();
console.log('✓ Database closed');
