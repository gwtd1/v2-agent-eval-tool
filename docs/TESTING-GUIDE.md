# Testing Guide: Agent Eval Tool v1

**Document Type**: Testing Strategy & Checklists
**Status**: Living Document
**Last Updated**: February 2026

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Automated Tests](#2-automated-tests)
3. [Manual Testing During Implementation](#3-manual-testing-during-implementation)
4. [End-to-End Testing](#4-end-to-end-testing)
5. [Test Data & Fixtures](#5-test-data--fixtures)
6. [Regression Testing](#6-regression-testing)

---

## 1. Testing Philosophy

### 1.1 Test Pyramid

```
         /\
        /  \      E2E Tests (Few)
       /----\     - Full user flows
      /      \    - Real TDX integration
     /--------\   Integration Tests (Some)
    /          \  - API routes
   /------------\ - Database operations
  /              \
 /________________\ Unit Tests (Many)
                    - Parsers
                    - Utilities
                    - Pure functions
```

### 1.2 When to Test

| Phase | Test Type | Focus |
|-------|-----------|-------|
| During Development | Unit + Manual | Individual functions work correctly |
| Feature Complete | Integration | Components work together |
| Pre-Release | E2E + Manual | Full user workflows succeed |
| Post-Release | Regression | No regressions introduced |

---

## 2. Automated Tests

### 2.1 Setup

```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to package.json scripts
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### 2.2 Unit Tests

#### Parser Tests (`src/lib/tdx/__tests__/parser.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { parseAgentListOutput, parseTestOutput, parseAgentPath } from '../parser';

describe('parseAgentPath', () => {
  it('parses full agent path', () => {
    const result = parseAgentPath('agents/my-project/my-agent');
    expect(result).toEqual({ project: 'my-project', agent: 'my-agent' });
  });

  it('parses simple project/agent format', () => {
    const result = parseAgentPath('my-project/my-agent');
    expect(result).toEqual({ project: 'my-project', agent: 'my-agent' });
  });

  it('handles agent name only', () => {
    const result = parseAgentPath('my-agent');
    expect(result).toEqual({ project: 'default', agent: 'my-agent' });
  });
});

describe('parseAgentListOutput', () => {
  it('parses JSON output', () => {
    const json = JSON.stringify([
      { name: 'agent1', project: 'proj1', path: 'agents/proj1/agent1' }
    ]);
    const result = parseAgentListOutput(json);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('agent1');
  });

  it('parses text output', () => {
    const text = 'agents/proj1/agent1\nagents/proj1/agent2';
    const result = parseAgentListOutput(text);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for invalid input', () => {
    const result = parseAgentListOutput('');
    expect(result).toEqual([]);
  });
});

describe('parseTestOutput', () => {
  it('handles empty output', () => {
    const result = parseTestOutput('', 'test/agent');
    expect(result.status).toBe('needs_test_file');
    expect(result.tests).toEqual([]);
  });

  it('extracts test cases from output', () => {
    const output = `
Test 1: Check greeting
Prompt: Say hello
Response: Hello there!
Status: PASS
    `;
    const result = parseTestOutput(output, 'test/agent');
    expect(result.tests.length).toBeGreaterThan(0);
  });
});
```

#### Database Query Tests (`src/lib/db/__tests__/queries.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb } from '../client';
import {
  createTestRun,
  getTestRun,
  createTestCase,
  createEvaluation,
  updateEvaluation,
} from '../queries';

describe('Database Queries', () => {
  beforeEach(() => {
    // Use in-memory database for tests
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    closeDb();
  });

  describe('Test Runs', () => {
    it('creates and retrieves a test run', () => {
      const run = createTestRun({
        agentId: 'test-agent',
        agentPath: 'project/test-agent',
        executedAt: new Date().toISOString(),
        status: 'pending',
        rawOutput: null,
      });

      expect(run.id).toBeDefined();
      expect(run.agentId).toBe('test-agent');

      const retrieved = getTestRun(run.id);
      expect(retrieved).toEqual(run);
    });
  });

  describe('Evaluations', () => {
    it('creates evaluation with null rating', () => {
      const run = createTestRun({
        agentId: 'test',
        agentPath: 'p/test',
        executedAt: new Date().toISOString(),
        status: 'completed',
        rawOutput: null,
      });

      const testCase = createTestCase({
        testRunId: run.id,
        prompt: 'Test prompt',
        groundTruth: null,
        agentResponse: 'Response',
        traces: null,
      });

      const evaluation = createEvaluation({
        testCaseId: testCase.id,
        rating: null,
        notes: '',
      });

      expect(evaluation.rating).toBeNull();
    });

    it('updates evaluation rating', () => {
      // ... setup ...
      const updated = updateEvaluation(evaluation.id, { rating: 'good' });
      expect(updated?.rating).toBe('good');
    });
  });
});
```

### 2.3 Integration Tests

#### API Route Tests (`src/app/api/__tests__/agents.test.ts`)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GET } from '../agents/route';

// Mock TDX executor
vi.mock('@/lib/tdx/executor', () => ({
  checkTdxAvailable: vi.fn().mockResolvedValue(true),
  listTdxAgents: vi.fn().mockResolvedValue({
    stdout: JSON.stringify([
      { name: 'agent1', project: 'proj1', path: 'agents/proj1/agent1' }
    ]),
    stderr: '',
    exitCode: 0,
  }),
}));

describe('GET /api/agents', () => {
  it('returns list of agents', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agents).toHaveLength(1);
    expect(data.agents[0].name).toBe('agent1');
  });
});
```

### 2.4 Running Automated Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/lib/tdx/__tests__/parser.test.ts

# Run with coverage
npm run test:coverage

# Run only unit tests
npm test -- --testPathPattern="__tests__"
```

---

## 3. Manual Testing During Implementation

### 3.1 Phase-by-Phase Checklist

#### Phase 1: Foundation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Database initializes | Run `npx tsx scripts/test-db.ts` | "All database operations working correctly!" | |
| Database persists | Restart app, check data exists | Data preserved | |
| TypeScript compiles | Run `npm run build` | No errors | |

#### Phase 2: TDX Integration

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| TDX CLI available | Run `tdx --version` in terminal | Version displayed | |
| Agent list works | `curl http://localhost:3000/api/agents` | JSON with agents array | |
| Agent list handles no TDX | Unset TD_API_KEY, call API | 401 or 503 error with message | |
| Test execution works | POST to `/api/test` with valid agent | Test run created | |
| Test handles bad agent | POST with invalid agent path | Error response, no crash | |
| Null ground truth | Test case with no ground truth | Parses without error | |

#### Phase 3: Core UI Layout

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Three panels render | Navigate to /review | All 3 panels visible | |
| Responsive at 1280px | Resize browser to 1280px | Panels readable | |
| Left panel scrolls | Add 50+ test cases | Scrollable, no overflow | |

#### Phase 4: Core UI Components

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Test case list shows items | Load test run | Cases listed with IDs | |
| Selection highlights | Click test case | Visual highlight, center updates | |
| Rating saves | Click Good/Bad | Persists on refresh | |
| Notes save on blur | Type notes, click away | Notes saved | |
| Navigation works | Click Next/Back | Correct case shown | |
| Filter works | Select "Pending" filter | Only unrated cases shown | |
| Progress updates | Rate an item | Progress counter changes | |

#### Phase 5: Agent Selection

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Projects load | Open app | Project dropdown populated | |
| Agents filter | Select project | Only project agents shown | |
| Run button enables | Select agent | Button becomes clickable | |
| Loading state shows | Click Run | Spinner/loading indicator | |
| Navigates on success | Test completes | Redirected to /review | |
| Error displays | Test fails | Error message shown | |

#### Phase 6: Data Persistence & Export

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Data persists | Rate items, close browser, reopen | Ratings preserved | |
| Export button works | Click Export | File downloads | |
| CSV format correct | Open exported file | Valid CSV with headers | |
| JSON export works | Export as JSON | Valid JSON structure | |

#### Phase 7: Keyboard Navigation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Arrow keys navigate | Press → and ← | Moves between cases | |
| G rates Good | Press G | Rating set to Good | |
| B rates Bad | Press B | Rating set to Bad | |
| N focuses notes | Press N | Cursor in notes field | |
| Esc blurs | Press Esc in notes | Focus returns to panel | |
| Shortcuts disabled in input | Type in notes | G/B don't trigger rating | |

### 3.2 Quick Verification Commands

```bash
# Check app builds
npm run build

# Start dev server
npm run dev

# Test database manually
npx tsx scripts/test-db.ts

# Test API endpoint
curl http://localhost:3000/api/agents | jq

# Test with specific agent
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"agentPath": "project/agent-name"}'
```

---

## 4. End-to-End Testing

### 4.1 E2E Test Scenarios

#### Scenario 1: Complete Review Flow

**Preconditions**: TDX configured, agent with test cases exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000 | Home page loads |
| 2 | Select project from dropdown | Agents filter to project |
| 3 | Select agent | Run Test button enables |
| 4 | Click Run Test | Loading state shows |
| 5 | Wait for completion | Redirected to /review |
| 6 | Verify test cases loaded | Left panel shows cases |
| 7 | Click first test case | Prompt/response display |
| 8 | Rate as Good | Rating saved |
| 9 | Press → key | Next case selected |
| 10 | Rate as Bad, add notes | Both saved |
| 11 | Check progress | Shows "2/X reviewed" |
| 12 | Click Export | CSV downloads |
| 13 | Verify CSV content | Contains ratings and notes |

#### Scenario 2: Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Unset TD_API_KEY | |
| 2 | Try to list agents | Error message displayed |
| 3 | Set invalid API key | |
| 4 | Try to run test | Auth error displayed |
| 5 | Set valid key, use bad agent path | |
| 6 | Run test | "Agent not found" error |

#### Scenario 3: Data Persistence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete partial review | Some rated, some pending |
| 2 | Close browser completely | |
| 3 | Reopen app | |
| 4 | Navigate to /review | Previous ratings intact |
| 5 | Check progress counter | Matches previous session |

#### Scenario 4: Edge Cases

| Test | Steps | Expected |
|------|-------|----------|
| Empty ground truth | Test case with null ground truth | "Not available" displayed |
| Long response | Response with 5000+ chars | Scrollable, readable |
| Special characters | Prompt with `<script>` tags | Escaped, no XSS |
| Concurrent saves | Rapidly change ratings | All changes saved |
| 50+ test cases | Load large test run | Performant, scrollable |

### 4.2 E2E Test Automation (Optional)

Using Playwright:

```typescript
// e2e/review-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete review flow', async ({ page }) => {
  await page.goto('/');

  // Select agent
  await page.selectOption('[data-testid="project-select"]', 'my-project');
  await page.selectOption('[data-testid="agent-select"]', 'my-agent');

  // Run test
  await page.click('[data-testid="run-test-btn"]');
  await page.waitForURL('/review');

  // Verify test cases loaded
  const testCases = page.locator('[data-testid="test-case-item"]');
  await expect(testCases).toHaveCount.greaterThan(0);

  // Rate first case
  await testCases.first().click();
  await page.click('[data-testid="rating-good"]');

  // Verify saved
  await page.reload();
  await expect(page.locator('[data-testid="rating-good"]')).toBeChecked();
});
```

---

## 5. Test Data & Fixtures

### 5.1 Sample Test Fixtures

```typescript
// test/fixtures/test-cases.ts
export const sampleTestCases = [
  {
    prompt: 'How many users signed up in January 2024?',
    groundTruth: '1,247',
    agentResponse: 'Based on the data, 1,247 users signed up in January 2024.',
  },
  {
    prompt: 'What is the best marketing strategy for Q2?',
    groundTruth: null, // Probabilistic - no ground truth
    agentResponse: 'I recommend focusing on social media campaigns...',
  },
  {
    prompt: 'Create a segment for high-value customers',
    groundTruth: 'SELECT * FROM customers WHERE lifetime_value > 10000',
    agentResponse: 'Here is the segment query:\n```sql\nSELECT * FROM customers WHERE lifetime_value > 10000\n```',
  },
];

export const sampleTdxOutput = `
Test 1: User count query
Prompt: How many users signed up in January 2024?
Response: Based on the data, 1,247 users signed up in January 2024.
Ground Truth: 1,247
Status: PASS

Test 2: Marketing strategy
Prompt: What is the best marketing strategy for Q2?
Response: I recommend focusing on social media campaigns...
Ground Truth: (none)
Status: PASS
`;
```

### 5.2 Seeding Test Data

```typescript
// scripts/seed-test-data.ts
import { createTestRun, createTestCase, createEvaluation } from '../src/lib/db/queries';

const testCases = [
  { prompt: 'Test 1', groundTruth: 'Answer 1', response: 'Response 1' },
  { prompt: 'Test 2', groundTruth: null, response: 'Response 2' },
  { prompt: 'Test 3', groundTruth: 'Answer 3', response: 'Wrong response' },
];

const run = createTestRun({
  agentId: 'demo-agent',
  agentPath: 'demo/demo-agent',
  executedAt: new Date().toISOString(),
  status: 'completed',
  rawOutput: 'Demo test output',
});

for (const tc of testCases) {
  const testCase = createTestCase({
    testRunId: run.id,
    prompt: tc.prompt,
    groundTruth: tc.groundTruth,
    agentResponse: tc.response,
    traces: null,
  });

  createEvaluation({
    testCaseId: testCase.id,
    rating: null,
    notes: '',
  });
}

console.log(`Seeded ${testCases.length} test cases for run ${run.id}`);
```

---

## 6. Regression Testing

### 6.1 Regression Checklist

Run before each release:

- [ ] All automated tests pass
- [ ] App builds without errors
- [ ] Database migrations run cleanly
- [ ] Agent list API returns data
- [ ] Test execution creates records
- [ ] Three-panel layout renders correctly
- [ ] Rating persists across refresh
- [ ] Notes save on blur
- [ ] Keyboard shortcuts work
- [ ] Export produces valid file
- [ ] No console errors in browser
- [ ] Performance acceptable with 50+ cases

### 6.2 Performance Benchmarks

| Metric | Target | How to Test |
|--------|--------|-------------|
| Initial load | < 2s | Lighthouse |
| Navigation | < 100ms | Manual timing |
| Save rating | < 200ms | Network tab |
| Load 50 cases | < 3s | Manual timing |
| Export 100 cases | < 5s | Manual timing |

---

## Appendix: Test Command Reference

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific pattern
npm test -- --testPathPattern="parser"

# Run in watch mode
npm test -- --watch

# E2E tests (if Playwright configured)
npx playwright test

# Build verification
npm run build

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

---

*This testing guide should be updated as new features are added and new edge cases are discovered.*
