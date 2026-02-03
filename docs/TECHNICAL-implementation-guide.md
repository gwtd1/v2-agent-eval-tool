# Technical Implementation Guide: Agent Eval Tool v1

**Document Type**: Technical Specification
**Date**: February 2026
**Status**: Implementation Ready

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Eval Tool v1                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │◄──►│  API Routes  │◄──►│   SQLite     │      │
│  │   (Next.js)  │    │  (Next.js)   │    │   Database   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                                    │
│         │                   ▼                                    │
│         │            ┌──────────────┐                           │
│         │            │  TDX CLI     │                           │
│         │            │  Execution   │                           │
│         │            └──────────────┘                           │
│         │                   │                                    │
└─────────│───────────────────│────────────────────────────────────┘
          │                   │
          │                   ▼
          │            ┌──────────────┐
          │            │  TDX / LLM   │
          │            │    APIs      │
          │            └──────────────┘
          │
          ▼
    ┌──────────────┐
    │   Browser    │
    └──────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14+ (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Database | SQLite | via better-sqlite3 or Prisma |
| State | React Context + useReducer | - |
| Runtime | Node.js | 20+ |

---

## 2. Environment Configuration

### 2.1 Required Environment Variables

```env
# TDX Configuration
TD_API_KEY=your-master-api-key
TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com
TD_AGENT_ID=your-default-agent-id

# Database
DATABASE_PATH=./data/evaluations.db

# Optional
NODE_ENV=development
```

### 2.2 Environment Endpoints Reference

| Environment | LLM API Base URL |
|-------------|------------------|
| Development US | `https://llm-api-development.us01.treasuredata.com` |
| Development EU | `https://llm-api-development.eu01.treasuredata.com` |
| Staging US | `https://llm-api-staging.us01.treasuredata.com` |
| Staging JP | `https://llm-api-staging.treasuredata.co.jp` |

---

## 3. Directory Structure

```
agent-eval-tool-v1/
├── docs/                           # Documentation
│   ├── PRD-agent-eval-tool-v1.md
│   ├── TECHNICAL-implementation-guide.md
│   └── ...
├── prompts/                        # Claude Code prompts
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Home / Agent selection
│   │   ├── layout.tsx              # Root layout
│   │   ├── review/
│   │   │   └── page.tsx            # Three-panel review interface
│   │   └── api/
│   │       ├── agents/
│   │       │   └── route.ts        # GET: List agents
│   │       ├── test/
│   │       │   └── route.ts        # POST: Execute tdx agent test
│   │       └── evaluations/
│   │           ├── route.ts        # GET/POST: List/Create evaluations
│   │           └── [id]/
│   │               └── route.ts    # GET/PUT: Single evaluation
│   ├── components/
│   │   ├── agent/
│   │   │   ├── AgentSelector.tsx   # Project + Agent dropdowns
│   │   │   └── TestRunner.tsx      # Run test button + status
│   │   ├── panels/
│   │   │   ├── TestCaseList.tsx    # Left panel
│   │   │   ├── ConversationView.tsx # Center panel
│   │   │   └── EvaluationPanel.tsx # Right panel
│   │   ├── layout/
│   │   │   └── ThreePanel.tsx      # Three-column layout wrapper
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── RadioGroup.tsx
│   │       ├── Textarea.tsx
│   │       └── Badge.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts           # SQLite connection
│   │   │   ├── schema.ts           # Table definitions
│   │   │   └── queries.ts          # CRUD operations
│   │   ├── tdx/
│   │   │   ├── executor.ts         # Shell command execution
│   │   │   └── parser.ts           # Parse TDX output
│   │   ├── types/
│   │   │   ├── test-case.ts        # TestCase interface
│   │   │   ├── evaluation.ts       # Evaluation interface
│   │   │   └── tdx.ts              # TDX response types
│   │   └── utils/
│   │       ├── keyboard.ts         # Keyboard shortcut handlers
│   │       └── export.ts           # CSV export utilities
│   └── context/
│       └── EvaluationContext.tsx   # Global state
├── data/                           # SQLite database location
│   └── .gitkeep
├── public/
│   └── ...
├── .env.local                      # Environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## 4. TDX Output Format

**IMPORTANT**: TDX returns raw text output (not JSON). The output must be parsed.

### 4.1 Parsed Structure

```typescript
// From Agent-eval-new project analysis
interface TdxEvaluationResult {
  backend: 'tdx';
  project: string;           // e.g., "tdx_default_gregwilliams"
  agent: string;             // e.g., "fact-checker"
  status: 'pass' | 'fail' | 'error' | 'needs_test_file';
  tests: TestResult[];       // Array of individual test results
  rawOutput?: string;        // Original TDX CLI output
  chatLinks?: string[];      // Links to chat sessions
  startTime: string;         // ISO timestamp
  endTime?: string;          // ISO timestamp
  duration?: number;         // milliseconds
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'error';
  details: string;
  duration?: number;
  error?: string;
}
```

### 4.2 Agent Path Format

**Format**: `agents/{PROJECT_NAME}/{AGENT_NAME}`

**Example**: `agents/tdx_default_gregwilliams/language-detector`

**Parsing**:
- Project ID: First directory after `agents/`
- Agent ID: Second directory after `agents/`

---

## 5. V1 Behavioral Constraints

| Behavior | V1 Rule |
|----------|---------|
| Test runs per agent | One test run per agent per session |
| Rating changes | Can change Good↔Bad, cannot clear to unrated |
| "Bad" rating | **Must include explanation notes** |
| Session persistence | Starts fresh each session |
| Export scope | Current test run only |
| Ground truth format | String/number only |
| Ground truth display | User must scroll to view (prevents bias) |
| Auto-save | Not implemented in V1 |

### Empty State Messages

| Scenario | Message |
|----------|---------|
| No agents in project | "No agents found in this project" |
| No test cases | Use TDX to create agent.yaml |
| All reviewed | "All agents have been reviewed!" |
| Connection failure | "Connection Error" |

---

## 6. Database Schema

### 6.1 Tables

**test_runs**
```sql
CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_path TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'pending' | 'running' | 'completed' | 'failed'
  raw_output TEXT,       -- Full TDX CLI text output (parsed, not JSON)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**test_cases**
```sql
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  test_run_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ground_truth TEXT,          -- Can be NULL
  agent_response TEXT,
  traces TEXT,                -- JSON string
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_run_id) REFERENCES test_runs(id)
);
```

**evaluations**
```sql
CREATE TABLE evaluations (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL,
  rating TEXT,                -- 'good' | 'bad' | NULL
  notes TEXT DEFAULT '',
  reviewer_id TEXT,
  duration_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
);
```

### 6.2 Indexes

```sql
CREATE INDEX idx_test_cases_run ON test_cases(test_run_id);
CREATE INDEX idx_evaluations_case ON evaluations(test_case_id);
CREATE INDEX idx_evaluations_rating ON evaluations(rating);
```

---

## 7. API Routes Specification

### 7.1 GET /api/agents

List available TDX agents.

**Response**:
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    path: string;
    project: string;
  }>
}
```

**Implementation**: Execute `tdx agent list` and parse output.

---

### 7.2 POST /api/test

Execute agent test via TDX.

**Request**:
```typescript
{
  agentPath: string;  // e.g., "project/agent-name"
}
```

**Response**:
```typescript
{
  testRunId: string;
  status: 'completed' | 'failed';
  testCaseCount: number;
  error?: string;
}
```

**Implementation**:
1. Execute `tdx agent test "{agentPath}"`
2. Parse output (reference Agent-eval-new for format)
3. Store in SQLite
4. Return summary

---

### 7.3 GET /api/evaluations

List evaluations with optional filters.

**Query Parameters**:
- `testRunId`: Filter by test run
- `rating`: Filter by rating ('good' | 'bad' | 'pending')

**Response**:
```typescript
{
  evaluations: Array<{
    id: string;
    testCaseId: string;
    rating: 'good' | 'bad' | null;
    notes: string;
    testCase: {
      prompt: string;
      groundTruth: string | null;
      agentResponse: string;
    }
  }>
}
```

---

### 7.4 PUT /api/evaluations/[id]

Update a single evaluation.

**Request**:
```typescript
{
  rating?: 'good' | 'bad' | null;
  notes?: string;
  durationMs?: number;
}
```

**Response**:
```typescript
{
  id: string;
  updated: true;
}
```

---

## 8. Component Specifications

### 8.1 AgentSelector

**Props**: None (uses internal state)

**State**:
- `selectedProject: string | null`
- `selectedAgent: string | null`
- `agents: Agent[]`
- `loading: boolean`

**Behavior**:
1. On mount, fetch agents from `/api/agents`
2. Group agents by project
3. First dropdown: Select project
4. Second dropdown: Select agent (filtered by project)
5. Enable "Run Test" when agent selected

---

### 8.2 TestRunner

**Props**:
- `agentPath: string`
- `onComplete: (testRunId: string) => void`

**State**:
- `status: 'idle' | 'running' | 'complete' | 'error'`
- `error: string | null`

**Behavior**:
1. On click, POST to `/api/test`
2. Show loading spinner during execution
3. On success, call `onComplete` with test run ID
4. On error, display error message

---

### 8.3 TestCaseList

**Props**:
- `testCases: TestCase[]`
- `evaluations: Map<string, Evaluation>`
- `selectedId: string | null`
- `onSelect: (id: string) => void`

**Behavior**:
1. Render scrollable list of test case IDs
2. Show status badge (pending/good/bad) per item
3. Highlight selected item
4. Filter controls: All / Pending / Completed
5. Progress indicator: "X/Y reviewed"

---

### 8.4 ConversationView

**Props**:
- `testCase: TestCase | null`

**Behavior**:
1. If null, show empty state
2. Render sections:
   - **Human**: User prompt
   - **AI**: Agent response
   - **Ground Truth**: Expected result (or "Not available")
3. Monospace font for code/JSON in responses
4. Clear visual distinction: Human (blue), AI (green)
5. Note: Trace display deferred to V2

---

### 8.5 EvaluationPanel

**Props**:
- `evaluation: Evaluation | null`
- `onUpdate: (update: Partial<Evaluation>) => void`
- `onNavigate: (direction: 'prev' | 'next') => void`
- `hasNext: boolean`
- `hasPrev: boolean`

**Behavior**:
1. Good/Bad radio buttons (large, accessible)
2. Notes textarea (auto-save on blur)
3. Ground truth display
4. Tags placeholder (disabled)
5. Back/Next buttons
6. Keyboard shortcuts active when focused

---

## 9. Implementation Phases

---

### Phase 1: Foundation (Days 1-3)

**Objective**: Project setup with database and basic structure.

**Tasks**:

| Task | Details |
|------|---------|
| 1.1 | Initialize Next.js 14 project with TypeScript |
| 1.2 | Configure Tailwind CSS |
| 1.3 | Set up directory structure per Section 3 |
| 1.4 | Install SQLite dependency (better-sqlite3 or Prisma) |
| 1.5 | Create database schema per Section 4 |
| 1.6 | Implement `lib/db/client.ts` - database connection |
| 1.7 | Implement `lib/db/queries.ts` - CRUD operations |
| 1.8 | Create TypeScript interfaces in `lib/types/` |
| 1.9 | Set up environment variables (.env.local) |

**Deliverables**:
- Running Next.js app with database initialized
- Types defined for TestCase, Evaluation, TDXTrace
- Database CRUD operations functional

**Validation**:
- Can create/read/update evaluations via direct function calls
- Database persists across app restarts

---

### Phase 2: TDX Integration (Days 4-6)

**Objective**: Execute TDX commands and parse output.

**Reference**:
- TDX Documentation: https://tdx.treasuredata.com/
- Agent-eval-new project for command patterns and output format

**Tasks**:

| Task | Details |
|------|---------|
| 2.1 | Implement `lib/tdx/executor.ts` - shell command execution |
| 2.2 | Implement `lib/tdx/parser.ts` - parse TDX output to types |
| 2.3 | Create `/api/agents/route.ts` - list available agents |
| 2.4 | Create `/api/test/route.ts` - execute tdx agent test |
| 2.5 | Check for agent.yaml; generate via TDX commands if not present |
| 2.6 | Handle TDX errors gracefully |
| 2.7 | Handle null/empty ground truth in parsing |
| 2.8 | Store test results in SQLite |

**Key Implementation Notes**:

```typescript
// lib/tdx/executor.ts pattern
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function executeTdxTest(agentPath: string) {
  // Command pattern from Agent-eval-new
  const command = `tdx agent test "${agentPath}"`;

  const { stdout, stderr } = await execAsync(command);

  // Parse output - structure TBD from Agent-eval-new
  return parseTestOutput(stdout);
}
```

**Deliverables**:
- API route that executes `tdx agent test`
- Parsed test cases stored in database
- Agent listing functional

**Validation**:
- POST to `/api/test` with valid agent path returns test cases
- GET to `/api/agents` returns agent list
- Null ground truth doesn't crash parser

---

### Phase 3: Core UI - Layout (Days 7-8)

**Objective**: Build the three-panel review interface structure.

**Tasks**:

| Task | Details |
|------|---------|
| 3.1 | Create `ThreePanel.tsx` layout component |
| 3.2 | Create `TestCaseList.tsx` skeleton |
| 3.3 | Create `ConversationView.tsx` skeleton |
| 3.4 | Create `EvaluationPanel.tsx` skeleton |
| 3.5 | Set up `/review/page.tsx` route |
| 3.6 | Create `EvaluationContext.tsx` for state |
| 3.7 | Wire up panel communication via Context |

**Layout Specification**:
```css
/* Three-panel grid */
.three-panel {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  height: 100vh;
}
```

**Deliverables**:
- Three-panel layout rendering correctly
- Panels communicate via Context
- Navigation to /review works

**Validation**:
- All three panels visible at correct widths
- State changes in one panel reflect in others

---

### Phase 4: Core UI - Components (Days 9-10)

**Objective**: Implement full functionality of each panel.

**Tasks**:

| Task | Details |
|------|---------|
| 4.1 | Implement TestCaseList with filtering |
| 4.2 | Implement ConversationView with prompt/response display |
| 4.3 | Implement EvaluationPanel with rating/notes |
| 4.4 | Create reusable UI components (Button, RadioGroup, etc.) |
| 4.5 | Add progress indicator to TestCaseList |
| 4.6 | Handle "No ground truth" display gracefully |
| 4.7 | Style components with Tailwind |

**Deliverables**:
- Fully functional three-panel interface
- All UI interactions working
- Proper styling applied

**Validation**:
- Can navigate through test cases
- Can rate Good/Bad and save notes
- Ground truth displays correctly (or "N/A")

---

### Phase 5: Agent Selection Flow (Days 11-12)

**Objective**: Build the agent selection and test execution UI.

**Tasks**:

| Task | Details |
|------|---------|
| 5.1 | Create AgentSelector component |
| 5.2 | Create TestRunner component |
| 5.3 | Implement home page (`/page.tsx`) with selection flow |
| 5.4 | Add loading states during test execution |
| 5.5 | Handle and display TDX errors |
| 5.6 | Navigate to /review on test completion |

**Deliverables**:
- Complete flow: Select → Run → Review
- Error handling for failed tests
- Loading indicators during execution

**Validation**:
- Can select agent from dropdown
- Can execute test and see loading state
- Automatically navigates to review on success

---

### Phase 6: Data Persistence & Export (Days 13-14)

**Objective**: Implement auto-save and export functionality.

**Tasks**:

| Task | Details |
|------|---------|
| 6.1 | Implement auto-save on rating change |
| 6.2 | Implement auto-save on notes blur |
| 6.3 | Create `/api/evaluations/route.ts` endpoints |
| 6.4 | Create `/api/evaluations/[id]/route.ts` endpoint |
| 6.5 | Implement `lib/utils/export.ts` for CSV generation |
| 6.6 | Add export button to UI |
| 6.7 | Track review duration (time spent per case) |

**Export Format**:
```csv
test_case_id,prompt,ground_truth,agent_response,rating,notes,reviewer,duration_ms,timestamp
TC-001,"Create segment...",13196,"SELECT...",good,"Correct approach",greg,45000,2026-02-02T10:30:00Z
```

**Deliverables**:
- Evaluations persist across sessions
- CSV export functional
- Duration tracking working

**Validation**:
- Refresh browser, evaluations still present
- Export produces valid CSV
- Duration recorded correctly

---

### Phase 7: Keyboard Navigation (Day 15)

**Objective**: Implement keyboard shortcuts for power users.

**Tasks**:

| Task | Details |
|------|---------|
| 7.1 | Create `lib/utils/keyboard.ts` hook |
| 7.2 | Implement arrow key navigation (←/→ or J/K) |
| 7.3 | Implement G for Good, B for Bad |
| 7.4 | Implement N for focus notes |
| 7.5 | Implement Esc to blur and return to navigation |
| 7.6 | Add keyboard shortcut hints to UI |

**Deliverables**:
- Full keyboard navigation functional
- Visual hints for shortcuts

**Validation**:
- Can complete full review without mouse
- Shortcuts work in correct contexts

---

### Phase 8: Polish & Testing (Day 16)

**Objective**: Error handling, edge cases, and final polish.

**Tasks**:

| Task | Details |
|------|---------|
| 8.1 | Add loading states for all async operations |
| 8.2 | Add error boundaries |
| 8.3 | Handle empty test case lists |
| 8.4 | Test with 30+ test cases for performance |
| 8.5 | Add placeholder UI for deferred features (tags, annotation) |
| 8.6 | Final styling pass |
| 8.7 | Test full flow end-to-end |

**Deliverables**:
- Production-ready prototype
- All edge cases handled
- Performance acceptable at scale

**Validation**:
- No crashes on error conditions
- 30+ test cases load quickly
- Full demo flow works smoothly

---

## 10. Testing Checklist

### Functional Tests

- [ ] Agent list loads from TDX
- [ ] Test execution works with valid agent
- [ ] Test execution handles invalid agent gracefully
- [ ] Test cases display in list
- [ ] Conversation view renders prompt and response
- [ ] Null ground truth displays as "N/A"
- [ ] Rating saves to database
- [ ] Notes save on blur
- [ ] Navigation (Next/Prev) works
- [ ] Filter (All/Pending/Completed) works
- [ ] Export produces valid CSV
- [ ] Data persists across browser refresh

### Keyboard Tests

- [ ] ← moves to previous test case
- [ ] → moves to next test case
- [ ] G sets rating to Good
- [ ] B sets rating to Bad
- [ ] N focuses notes field
- [ ] Esc blurs notes

### Performance Tests

- [ ] 30+ test cases load in < 2 seconds
- [ ] Navigation responds in < 100ms
- [ ] No memory leaks during extended session

---

## 11. Reference Implementation

### TDX Documentation

**URL**: https://tdx.treasuredata.com/

**Reference for**:
1. TDX CLI commands and syntax
2. agent.yaml generation and structure
3. Test case creation via TDX commands

### Agent-eval-new Project

**Extract from this project**:
1. Exact `tdx agent test` command syntax
2. TDX output JSON structure
3. Trace format and field names
4. Error response format

### Rapid AI Prototyping Starter Pack

**Reference for**:
1. Environment variable patterns
2. API authentication
3. Security compliance

---

## 12. Post-Implementation

### Handoff Documentation

After implementation, create:
1. README.md with setup instructions
2. .env.example with required variables
3. Demo script for teammate presentation

### Known Limitations

Document for V2 consideration:
- No conversation traces (tool calls, intermediate steps)
- No manual test case creation (V1 uses TDX commands to generate agent.yaml)
- No historical test run viewing/comparison
- No auto-save (manual save only)
- No response truncation ("Show more")
- No session continuity ("Resume where you left off")
- No export filtering by rating
- No "remember last selection" for agents
- No complex ground truth formats (string/number only)
- Single-user only (no collaboration)
- Local storage only (no cloud sync)
- No annotation/highlighting
- No tagging taxonomy
- No LLM-based clustering

### Reference Documentation

- `/docs/implementation-qa-clarifications.md` — Initial architecture decisions
- `/docs/implementation-qa-round2.md` — UI/UX and behavior clarifications

---

*This technical guide provides the complete specification for implementing Agent Eval Tool v1. Follow phases sequentially, validate each phase before proceeding, and reference Agent-eval-new for TDX-specific implementation details.*