# Agent Eval Tool v1 — Development Plan

*Authored by Opus 4.5 | February 2026*
*Updated with Implementation Clarifications*

---

## 1. Executive Summary

The Agent Eval Tool v1 is a **working prototype** that connects to TDX to execute agent tests and provides a human review interface for error analysis. It serves as the **presentation layer** in Treasure Data's evaluation ecosystem.

**Core Premise**: Automated evaluation (LLM-as-judge) is necessary but insufficient. The irreplaceable value lies in human expert critique—the "benevolent dictator" model where domain experts provide binary pass/fail ratings with detailed explanations that reveal systematic failure patterns.

**V1 Scope**: A functional prototype that:
- Connects to real TDX agents
- Executes test cases via `tdx agent test` command
- Displays results for human review
- Persists evaluations in local SQLite database

**Demo Narrative**: *"Watch me run `tdx agent test`, then review results in this UI."*

---

## 2. Strategic Context

### 2.1 The Evaluation Philosophy

From the Opportunity Assessment, the evaluation lifecycle follows this sequence:

```
Requirements → Agent Build → Ground Truth → LLM Judge → Human Error Analysis → Clustering → Prompt Improvement
```

V1 covers steps 4-5: **Test Execution + Human Error Analysis**.

### 2.2 Platform Architecture Position

Per the Interview Notes, the system architecture is:

```
TDX (Agent Execution) → Data Pipeline → Evals Product (This Tool) → Reports
```

Key constraint: **Unidirectional data flow**. TDX pushes data to the Eval Tool. The Eval Tool does not write back to TDX.

### 2.3 Scale Requirements

From stakeholder interviews:
- **30+ prompts** per evaluation cycle (minimum)
- **50+ ground truth queries** per customer implementation
- Zero manual prompt typing during evaluation
- Human effort reserved for Error Analysis only

---

## 3. V1 Feature Scope

### 3.1 In Scope

| Feature | Description |
|---------|-------------|
| **TDX Agent Selection** | Select agents from TDX projects |
| **Test Execution** | Run `tdx agent test "{agentPath}"` from UI |
| **Test Case List** | Left panel displaying all test cases requiring review |
 | **Conversation View** | Center panel showing prompt, response, and ground truth |
| **Binary Rating** | Good/Bad radio buttons for pass/fail determination |
| **Expert Notes** | Free-text area for critique and explanation |
| **Navigation** | Next/Previous buttons for rapid sequential review |
| **SQLite Storage** | Local database for evaluation persistence |
| **Data Export** | Export evaluations to JSON/CSV |
| **Progress Tracking** | Visual indicator of reviewed vs. pending items |

### 3.2 Deferred (V2+)

| Feature | Reason for Deferral |
|---------|---------------------|
| Conversation Traces | Complexity for V1; prompt+response sufficient |
| Manual Test Case Creation | V1 uses TDX commands; UI-based creation in V2 |
| Annotation/Highlighting | Complexity; V2 feature |
| Tags/Labels | Requires taxonomy design |
| Collaborative Review | Multi-user architecture needed |
| LLM Clustering | Post-MVP analytics feature |

### 3.3 Out of Scope

- Manual test case creation (V1 uses TDX commands to generate agent.yaml)
- System prompt editing
- LLM-as-judge automation
- Cloud deployment (V1 is local)

---

## 4. Technical Architecture

### 4.1 Technology Selection

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ | TD standard per Prototyping Starter Pack |
| Styling | Tailwind CSS | Project dictionary consistency |
| State | React Context + useReducer | Sufficient for prototype |
| Database | SQLite (better-sqlite3 or Prisma) | Local persistence for evaluations |
| TDX Integration | Shell execution via API routes | Execute `tdx agent test` commands |
| Runtime | Node.js 20+ | Next.js requirement |

### 4.2 TDX Connection

**Reference**: [Rapid AI Prototyping Starter Pack](https://treasure-data.atlassian.net/wiki/spaces/PROD/pages/4750312018/Rapid+AI+Prototyping+Starter+Pack)

**Environment Variables Required**:
```env
TD_API_KEY=your-master-key
TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com
TD_AGENT_ID=your-agent-id
```

**Implementation Reference**: Agent-eval-new project for TDX command patterns.

### 4.3 Directory Structure

```
agent-eval-tool-v1/
├── docs/                        # Planning and documentation
├── prompts/                     # Claude Code prompts
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # Main evaluation interface
│   │   ├── layout.tsx           # Root layout
│   │   └── api/
│   │       ├── agents/          # TDX agent listing
│   │       ├── test/            # Execute tdx agent test
│   │       └── evaluations/     # CRUD for evaluations
│   ├── components/
│   │   ├── panels/
│   │   │   ├── TestCaseList.tsx
│   │   │   ├── ConversationView.tsx
│   │   │   └── EvaluationPanel.tsx
│   │   ├── agent/
│   │   │   ├── AgentSelector.tsx
│   │   │   └── TestRunner.tsx
│   │   ├── ui/                  # Shared UI primitives
│   │   └── layout/
│   │       └── ThreePanel.tsx
│   ├── lib/
│   │   ├── db/                  # SQLite database utilities
│   │   ├── tdx/                 # TDX command execution
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Helper functions
│   └── prisma/                  # Database schema (if using Prisma)
│       └── schema.prisma
├── data/                        # SQLite database file location
├── public/                      # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

### 4.4 Data Models

**IMPORTANT**: TDX returns raw text output (not JSON). The following structures are parsed from TDX CLI output.

**TDX Evaluation Result (parsed from `tdx agent test` output)**
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

**Agent Path Format**: `agents/{PROJECT_NAME}/{AGENT_NAME}`

Example: `agents/tdx_default_gregwilliams/language-detector`

**Evaluation (SQLite Schema)**
```typescript
interface Evaluation {
  id: string;                      // UUID
  testCaseId: string;
  agentId: string;
  rating: 'good' | 'bad' | null;
  notes: string;
  reviewerId?: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;               // Time spent reviewing (ms)
}
```

### 4.5 Ground Truth Handling

Ground truth varies by prompt type:

| Prompt Type | Ground Truth | Example |
|-------------|--------------|---------|
| **Deterministic** | Specific value in config.yaml | "How many people purchased a car on Jan 1st, 2024?" → 1,247 |
| **Probabilistic** | Blank or placeholder | "What's the best marketing strategy?" → (reviewer interprets) |

**Critical Requirement**: If `groundTruth` is empty, null, or missing in config.yaml, the app **must not break**. The UI should gracefully display "No ground truth available" or similar.

### 4.6 V1 Behavioral Constraints

| Behavior | V1 Rule |
|----------|---------|
| Test runs per agent | One test run per agent per session |
| Rating changes | Can change Good↔Bad, cannot clear to unrated |
| "Bad" rating | Must include explanation notes |
| Session persistence | Starts fresh each session (no memory) |
| Export scope | Current test run only |
| Ground truth format | String/number only (no complex types) |
| Ground truth display | User must scroll to view (prevents bias) |

### 4.7 Empty State Messages

| Scenario | Message |
|----------|---------|
| No agents in project | "No agents found in this project" |
| No test cases | Use TDX to create agent.yaml |
| All reviewed | "All agents have been reviewed!" |
| Connection failure | "Connection Error" |

---

## 5. User Interface Design

### 5.1 Agent Selection & Test Execution

Before the three-panel review interface, users must:

1. **Select Project** → dropdown of available TDX projects
2. **Select Agent** → dropdown of agents in selected project
3. **Run Test** → button that executes `tdx agent test "{agentPath}"`
4. **View Results** → transition to three-panel review interface

**Reference**: Agent-eval-new project UX flow.

### 5.2 Three-Panel Layout

Based on the eval-2.png reference:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Agent Eval Tool v1                              [Agent: xyz] [Progress] │
├────────────────┬─────────────────────────────────┬───────────────────────┤
│                │                                 │                       │
│  TEST CASES    │      CONVERSATION VIEW          │   EVALUATION          │
│                │                                 │                       │
│  ┌──────────┐  │  ┌─────────────────────────┐   │  Rate Conversation    │
│  │ TC-001   │  │  │ Human                   │   │  ○ Good    ○ Bad      │
│  │ TC-002 ● │  │  │ "Create a segment..."   │   │                       │
│  │ TC-003   │  │  └─────────────────────────┘   │  ┌─────────────────┐  │
│  │ TC-004   │  │                                 │  │ Notes           │  │
│  │ TC-005   │  │  ┌─────────────────────────┐   │  │                 │  │
│  │ ...      │  │  │ AI Response             │   │  │                 │  │
│  └──────────┘  │  │ "Tours are available..." │   │  └─────────────────┘  │
│                │  └─────────────────────────┘   │                       │
│  [Filter ▼]    │                                 │  Ground Truth:        │
│                │  ┌─────────────────────────┐   │  [value or N/A]       │
│  ○ All         │  │ Ground Truth            │   │                       │
│  ○ Pending     │  │ 1,247                   │   │  Tags (placeholder)   │
│  ○ Completed   │  └─────────────────────────┘   │  [+ Add Tags]         │
│                │                                 │                       │
│                │                                 │  ┌──────┐  ┌──────┐  │
│                │                                 │  │ Back │  │ Next │  │
│                │                                 │  └──────┘  └──────┘  │
│                │                                 │                       │
└────────────────┴─────────────────────────────────┴───────────────────────┘
```

### 5.3 Component Specifications

**Left Panel: TestCaseList**
- Scrollable list of test case IDs
- Shows: ID, completion status indicator
- Click to select; highlights active
- Filter controls: All / Pending / Completed
- Progress indicator: "15/30 reviewed"

**Center Panel: ConversationView**
- Shows user prompt (Human section)
- Shows agent response (AI section)
- Clear visual distinction: Human (blue), AI (green)
- Monospace font for code/JSON in responses
- Ground truth display (or "Not available" if blank)
- Note: Trace display deferred to V2

**Right Panel: EvaluationPanel**
- Large, accessible Good/Bad radio buttons
- Textarea for notes (auto-saves on blur)
- Ground truth reference display
- Disabled tags section with "Coming Soon" tooltip
- Back/Next navigation (keyboard: ← →)

### 5.4 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← / K | Previous test case |
| → / J | Next test case |
| G | Rate as Good |
| B | Rate as Bad |
| N | Focus notes field |
| Esc | Blur notes, return to navigation |

---

## 6. Data Flow

### 6.1 Test Execution Flow

```
1. User selects agent from TDX project
2. User clicks "Run Test" button
3. API route executes: tdx agent test "{agentPath}"
4. TDX returns test results (traces, responses)
5. Results parsed and stored in SQLite
6. UI displays test cases for review
```

**Reference**: Agent-eval-new project for `tdx agent test` command implementation.

### 6.2 Evaluation Persistence (SQLite)

```
1. User rates test case and adds notes
2. On navigation or blur, app auto-saves to SQLite
3. Evaluations table stores: testCaseId, rating, notes, timestamps
4. SQLite file persists locally between sessions
```

### 6.3 Export Process

```
1. User triggers export (button or Cmd+E)
2. App queries SQLite for all evaluations
3. Joins with test case data
4. Generates summary statistics
5. Outputs to CSV/JSON file
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Days 1-3)
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up SQLite with Prisma or better-sqlite3
- [ ] Create database schema for evaluations
- [ ] Define TypeScript interfaces (reference Agent-eval-new for TDX format)

### Phase 2: TDX Integration (Days 4-6)
- [ ] Implement TDX environment configuration
- [ ] Create API route for agent listing
- [ ] Create API route for `tdx agent test` execution
- [ ] Parse TDX output into database-ready format
- [ ] Handle ground truth edge cases (null/empty)

### Phase 3: Core UI (Days 7-10)
- [ ] Create three-panel layout component
- [ ] Implement AgentSelector component
- [ ] Implement TestCaseList component
- [ ] Implement ConversationView component
- [ ] Implement EvaluationPanel component
- [ ] Wire up panel communication via Context

### Phase 4: Data Layer (Days 11-13)
- [ ] Implement SQLite read/write operations
- [ ] Implement auto-save for evaluations
- [ ] Add progress tracking state
- [ ] Create export functionality
- [ ] Add keyboard navigation

### Phase 5: Polish (Days 14-16)
- [ ] Add loading states and error handling
- [ ] Implement filter functionality
- [ ] Add placeholder UI for deferred features
- [ ] Test with real TDX agents
- [ ] Test with 30+ test cases for performance

---

## 8. Implementation References

### 8.1 Agent-eval-new Project

**Use for**:
- TDX agent command patterns (`tdx agent test "{agentPath}"`)
- Actual TDX output format (traces, responses)
- UX flow (Select Project → Choose Agent → Run Test)
- Button styling conventions (`bg-primary`, `bg-yellow-600`)

**Critical**: Extract the exact TDX response structure from this project before implementing data models.

### 8.2 Rapid AI Prototyping Starter Pack

**Use for**:
- TDX API connection patterns
- Environment variable configuration
- Authentication (API Key, Agent ID, LLM URL)
- Security compliance guidelines

**Link**: https://treasure-data.atlassian.net/wiki/spaces/PROD/pages/4750312018/Rapid+AI+Prototyping+Starter+Pack

---

## 9. Success Criteria

### 9.1 Functional Requirements

- [ ] Connect to TDX and list available agents
- [ ] Execute `tdx agent test` from the UI
- [ ] Display prompt and response for each test case
- [ ] Handle blank/null ground truth gracefully
- [ ] Load and display 30+ test cases without performance issues
- [ ] Complete a full review (rate + notes) in under 60 seconds
- [ ] Navigate between cases with keyboard only
- [ ] Persist evaluations in SQLite across browser refresh
- [ ] Export all evaluations to CSV

### 9.2 UX Requirements

- [ ] Clear agent selection flow before review
- [ ] Reviewer can enter "flow state" with rapid navigation
- [ ] No confusion about current state or next action
- [ ] Clear visual feedback on save/error states
- [ ] Readable display of prompt and response
- [ ] Graceful "No ground truth" display

### 9.3 Technical Requirements

- [ ] Requires network access (TDX connection)
- [ ] < 100ms response for navigation
- [ ] SQLite database for persistent storage
- [ ] Graceful handling of TDX errors

---

## 10. Future Considerations

### V2 Features (Post-MVP)

1. **Conversation Traces**: Display tool calls, tool responses, and intermediate steps
2. **Manual Test Case Creation**: UI-based test case authoring (V1 uses TDX commands)
3. **Historical Test Runs**: View and compare previous test runs
4. **Auto-Save**: Save evaluations automatically on change
5. **Response Truncation**: "Show more" expansion for long responses
6. **Session Continuity**: "Resume where you left off" prompt
7. **Export Filtering**: Filter exports by rating, date, etc.
8. **Remember Selection**: Persist last selected project/agent
9. **Complex Ground Truth**: Support SQL, JSON, multi-line formats
10. **Annotation System**: Highlight specific text in responses
11. **Tagging & Labels**: Taxonomy for error categorization
12. **Multi-Reviewer**: Collaborative evaluation with conflict resolution
13. **Analytics Dashboard**: Charts, trends, pass rates over time
14. **LLM Clustering**: Auto-categorize errors based on explanations

### Cloud Deployment

When ready for Vercel deployment, follow Starter Pack guidelines:
- Password protection via middleware
- Environment variables for API keys
- Dummy data only in deployed version
- No customer PII

---

## 11. Appendix

### A. Key Reference Documents

1. **Rapid AI Prototyping Starter Pack** — TDX connection patterns, security rules
2. **Agent-eval-new Project** — TDX command patterns, output formats, UX flow
3. **Opportunity Assessment** — Evaluation philosophy, the "benevolent dictator" model
4. **Roadmap** — Scale targets, future milestones
5. **Interview Notes** — Architecture decisions, stakeholder requirements
6. **Implementation Q&A Clarifications** — Key decisions documented in `/docs/implementation-qa-clarifications.md`
7. **Implementation Q&A Round 2** — UI/UX and behavior clarifications in `/docs/implementation-qa-round2.md`

### B. External References

- TDX Documentation: https://tdx.treasuredata.com/
- Hamel Husain's Eval Framework: https://hamel.dev/blog/posts/evals-faq/

### C. Design Assets

- eval-2.png: Three-panel UI reference
- eval-1.png: Test case structure reference

---

*This plan provides the foundation for building Agent Eval Tool v1 as a working prototype. The tool connects to TDX for live agent testing, displays results for human review, and persists evaluations locally in SQLite. The focus is intentional: enable human experts to efficiently review agent outputs and capture their expertise in a structured format that will power future improvements.*