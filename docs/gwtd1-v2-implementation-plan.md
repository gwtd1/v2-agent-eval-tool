# V2 Implementation Plan: gwtd1 Tasks

## Overview

This document outlines the implementation plan for the V2 roadmap tasks assigned to developer **gwtd1**:

### Core Features
| ID | Category | Requirement | Current State |
|----|----------|-------------|---------------|
| D2 | TDX | LLM as a judge results in evaluation UI frame | Only agent output visible, no LLM judging results |
| D3 | UI | Make LLM as a judge results click-to-view | Not implemented (depends on D2) |
| D6 | UI + BE | Query TDX project name/agent after user provides API key | Hardcoded to `tdx_default_gregwilliams` |

### New Features (added 2026-02-11)
| ID | Category | Requirement | Current State |
|----|----------|-------------|---------------|
| D18 | UI | Change rating to Pass/Fail with thumbs up/down buttons | Current uses True/False boolean |
| D19 | UI + BE | Display complete agent response in evaluation | Response may be truncated |
| D20 | UI + BE | Show TDX execution logs during test runs | No feedback during test execution |
| D21 | Bug | Fix evaluation results storage and display | Results not storing/displaying properly |

---

## Recommended Implementation Order

### Order: D21 → D18 → D19 → D20 → D2 → D3 → D6

**Rationale:**

1. **D21 first (Bug Fix)**: This is a blocking bug that prevents proper evaluation flow. Must be fixed before other features can be tested effectively.

2. **D18 second (Pass/Fail Rating)**: Quick UI enhancement that improves the evaluation experience. Low complexity, high user impact.

3. **D19 third (Complete Response)**: Ensures agent responses display fully, which is foundational for accurate evaluations.

4. **D20 fourth (TDX Logs)**: Improves user feedback during test execution. Can be developed independently.

5. **D2 fifth (LLM Judge Results)**: Core feature for automated evaluation display. Requires D21 bug fix to work properly.

6. **D3 sixth (Click-to-View)**: Depends on D2 completion. Straightforward UI state management.

7. **D6 last (Dynamic API Key)**: Independent feature for multi-user support. Current hardcoded setup works for development.

---

## Task 1: D21 - Fix Evaluation Results Storage and Display (Bug)

### Objective
Investigate and fix the bug where evaluation results show repeated "Round 1/1: Sending user input..." messages but data is not stored or displayed correctly in the UI.

### Priority: HIGH (Blocking)
This bug must be fixed first as it prevents proper testing of other features.

### Current State Analysis

**Observed Symptoms:**
- UI shows repeated "Round 1/1: Sending user input..." messages
- Evaluation appears to run but results don't persist
- Data not displaying correctly in evaluation UI

**Suspected Root Causes:**
1. TDX output parsing failure in `src/lib/tdx/parser.ts`
2. Database write failure in API route
3. Frontend state not refreshing after test completion
4. Async/await issues in data flow

### Implementation Approach

**Phase 1: Diagnostic Logging**
- Add console logs at each step of data flow
- Log TDX CLI output before parsing
- Log parsed results after extraction
- Log database write results
- Log API responses

**Phase 2: Root Cause Identification**
- Run agent test with diagnostic logs
- Trace where data is lost or corrupted
- Compare expected vs actual output at each step

**Phase 3: Fix Implementation**
- Apply targeted fix based on root cause
- May involve parser regex updates, async handling, or state management

### Key Files to Investigate
- `src/lib/tdx/executor.ts` - Command execution
- `src/lib/tdx/parser.ts` - Output parsing
- `src/app/api/test/route.ts` - Test execution endpoint
- `src/context/EvaluationContext.tsx` - Frontend state

### Acceptance Criteria
- [ ] Evaluation results are stored correctly in database
- [ ] Results display properly in evaluation UI
- [ ] No repeated/duplicate log messages
- [ ] Data persists after test completion

---

## Task 2: D18 - Change Rating to Pass/Fail with Thumbs Up/Down

### Objective
Replace the current rating system with binary Pass/Fail evaluation using intuitive thumbs up/down icons.

### Current State Analysis

**Existing Implementation:**
- Uses True/False boolean rating
- Keyboard shortcuts: T (True), F (False)

**Proposed Changes:**
- Change terminology to Pass/Fail
- Add thumbs up/down icons for visual clarity
- Maintain existing keyboard shortcuts

### Implementation Approach

**Phase 1: Data Model**
- Update rating type in `src/lib/types/index.ts` to use `'pass' | 'fail' | null`
- Backward compatible with existing boolean storage

**Phase 2: UI Component**
- Update rating buttons with thumbs up/down icons
- Green highlight for Pass, red for Fail
- Clear visual feedback on selection

**Phase 3: API Validation**
- Update API to accept 'pass'/'fail' values
- Map to existing database storage

### Key Files to Modify
- `src/lib/types/index.ts` - Rating type
- `src/components/panels/RatingPanel.tsx` - UI component
- `src/app/api/evaluations/[id]/route.ts` - API validation

### Acceptance Criteria
- [ ] Rating displays as thumbs up (Pass) and thumbs down (Fail)
- [ ] Visual feedback when rating is selected
- [ ] Keyboard shortcuts T/F continue to work
- [ ] Existing evaluations display correctly

---

## Task 3: D19 - Display Complete Agent Response

### Objective
Ensure the agent response section displays the complete response without truncation.

### Current State Analysis

**Potential Truncation Points:**
1. TDX CLI buffer limits (child_process)
2. Database column constraints
3. API response limits
4. Frontend rendering

### Implementation Approach

**Phase 1: Buffer Limits**
- Increase `maxBuffer` in TDX executor to 10MB
- Ensure full stdout capture

**Phase 2: Database Verification**
- Verify TEXT column type for agent_response
- SQLite TEXT supports up to 2GB

**Phase 3: Frontend Display**
- Add scrollable container for long responses
- Use `whitespace-pre-wrap` for formatting

### Key Files to Modify
- `src/lib/tdx/executor.ts` - Buffer size
- `src/components/panels/ConversationView.tsx` - Display with scroll

### Acceptance Criteria
- [ ] Full agent response captured from TDX
- [ ] Complete response stored in database
- [ ] API returns full response
- [ ] UI displays with scroll for long content

---

## Task 4: D20 - Show TDX Execution Logs During Test Runs

### Objective
Stream real-time TDX execution logs to the UI when users run tests.

### Current State Analysis

**Current Behavior:**
- User clicks "Run Test"
- No feedback until test completes
- User doesn't see progress or TDX commands

**Proposed Behavior:**
- Display real-time log stream
- Show TDX commands being executed
- Show progress (e.g., "Round 1/5: Sending user input...")

### Implementation Approach

**Phase 1: Server-Sent Events Endpoint**
- Create `/api/test/stream` SSE endpoint
- Stream TDX process stdout/stderr in real-time

**Phase 2: Frontend Log Component**
- Create `TestRunLogs.tsx` component
- Auto-scrolling log display
- Hide/show toggle

**Phase 3: Integration**
- Connect log component to test runner UI
- Display during test execution

### Key Files to Create/Modify
- New: `src/app/api/test/stream/route.ts`
- New: `src/components/TestRunLogs.tsx`
- `src/app/page.tsx` - Integration

### Acceptance Criteria
- [ ] Real-time logs displayed during test execution
- [ ] TDX commands visible to user
- [ ] Progress updates shown
- [ ] Auto-scroll with hide/show option

---

## Task 5: D2 - LLM as a Judge Results in Evaluation UI Frame

> **Note:** This task should be implemented after D21 bug fix is complete to ensure proper data flow.

### Objective
Display LLM-as-a-judge evaluation results in the UI below the agent response, allowing reviewers to see automated assessment alongside manual evaluation.

### Implementation Decision: Option B (Evaluator Agent Direct Call)

**Selected Approach:** Call the LLM API with a dedicated evaluator agent to get rich, contextual evaluation reasoning.

| Aspect | Option A (Rejected) | Option B (Selected) |
|--------|---------------------|---------------------|
| Data Source | Parse TDX CLI output | Call LLM API with evaluator agent |
| Reasoning Quality | Basic | Rich, contextual |
| Reference | TDX CLI built-in judge | agent-eval-new evaluator |

**Evaluator Agent ID:** `019ae82f-b843-79f5-95c6-c7968262b2c2` (from agent-eval-new)

### Required UI Output Fields

The implementation must display these 5 fields:
1. **Verdict** - pass/fail status with visual badge
2. **Reasoning text** - Rich evaluation text (e.g., "The agent explicitly responded with 'True' and provided accurate historical details...")
3. **Conversation URL** - Clickable link to chat conversation
4. **Test number** - Position indicator (e.g., "1/5")
5. **Test name** - Name of the test case

### Current State Analysis

**Existing Architecture:**
- `src/app/review/page.tsx` - Three-panel review layout
- `src/components/panels/ConversationView.tsx` - Center panel displays: Prompt, Agent Response, Ground Truth
- Database schema includes `test_cases.traces` field (currently unused, marked "deferred to V2")

### Implementation Approach (Option B)

**Phase 1: LLM API Integration**
- Create `src/lib/llm/types.ts` - Define `LlmJudgeResult` interface
- Create `src/lib/llm/evaluator.ts` - LLM API client for evaluator agent
- Create `src/lib/llm/prompts.ts` - Evaluation prompt templates

**Phase 2: Database Schema Update**
- Add `llm_judge_result` column to `test_cases` table
- Store JSON matching `LlmJudgeResult` interface

**Phase 3: API Integration**
- Modify `POST /api/test/route.ts` to call evaluator agent after each test
- Update `GET /api/evaluations/[id]` to include LLM judge result

**Phase 4: UI Integration**
- Create `src/components/panels/LlmJudgeResults.tsx` with new wireframe layout
- Display: test number, test name, verdict badge, reasoning text, conversation link
- Integrate into `ConversationView.tsx`

### Key Files to Modify
- New: `src/lib/llm/types.ts` - LlmJudgeResult interface
- New: `src/lib/llm/evaluator.ts` - Evaluator agent API client
- New: `src/lib/llm/prompts.ts` - Prompt templates
- `src/lib/db/schema.ts` - Add llm_judge_result column
- `src/app/api/test/route.ts` - Integrate evaluator call
- `src/app/api/evaluations/[id]/route.ts` - Include LLM eval in response
- `src/components/panels/ConversationView.tsx` - Integrate LlmJudgeResults component
- New: `src/components/panels/LlmJudgeResults.tsx`

### Dependencies
- LLM API access with valid API key
- Access to evaluator agent (ID: `019ae82f-b843-79f5-95c6-c7968262b2c2`)
- Network access to LLM API endpoints

### Acceptance Criteria
- LLM-as-a-judge results appear below agent response in the evaluation UI
- All 5 required fields are displayed: verdict, reasoning, conversation URL, test number, test name
- Rich reasoning text from evaluator agent (not basic TDX CLI output)
- Clickable conversation link opens in new tab
- Historical test runs without LLM data display gracefully (empty state)

---

## Task 6: D3 - Make LLM as a Judge Results Click-to-View

### Objective
Hide LLM-as-a-judge results behind a click interaction to prevent biasing the human evaluator's manual assessment.

### Current State Analysis

**Design Consideration:**
The purpose of human-in-the-loop evaluation is to gather unbiased human judgment. If LLM-as-a-judge results are immediately visible, reviewers may anchor to the automated verdict rather than forming independent assessments.

**Existing Patterns:**
- Ground Truth is already positioned below the fold in `ConversationView.tsx` to encourage reading the agent response first
- The UI uses collapsible sections and progressive disclosure patterns

### Implementation Approach

**Phase 1: State Management**
- Add `showLlmResults` state to `EvaluationContext.tsx` (per-test-case or global toggle)
- Reset to hidden state when navigating to a new test case (enforce fresh evaluation)

**Phase 2: UI Component Update**
- Modify `LlmJudgeResults.tsx` (created in D2) to support collapsed/expanded states
- Collapsed state shows: "View LLM Evaluation" button with subtle icon
- Expanded state shows: Full LLM results with "Hide" option
- Consider showing a neutral indicator that LLM eval exists without revealing the verdict

**Phase 3: Interaction Design**
- Primary CTA: "Reveal LLM Assessment" button (action-oriented language)
- Optional: Track whether reviewer rated before or after viewing LLM results (analytics field)
- Optional: Keyboard shortcut for reveal (e.g., "L" key)

**Phase 4: Visual Design**
- Collapsed: Muted appearance, doesn't draw attention
- Expanded: Clear visual hierarchy, verdict badge prominent
- Transition: Smooth animation for expand/collapse

### Key Files to Modify
- `src/components/panels/LlmJudgeResults.tsx` - Add collapse/expand functionality
- `src/context/EvaluationContext.tsx` - Add visibility state management
- `src/lib/utils/keyboard.ts` - Optional: Add "L" shortcut for reveal

### Acceptance Criteria
- LLM-as-a-judge results are hidden by default
- User must click to reveal the automated assessment
- State resets when navigating between test cases
- Interaction is intuitive and non-disruptive to evaluation workflow

---

## Task 7: D6 - Query TDX Project Name/Agent After User Provides API Key

### Objective
Replace hardcoded TDX project name (`tdx_default_gregwilliams`) with dynamic project/agent selection based on user-provided API key.

### Current State Analysis

**Existing Architecture:**
- `src/components/agent/AgentSelector.tsx` - Dropdown for project/agent selection
- `src/app/api/agents/route.ts` - Calls `listTdxAgents()` to fetch available agents
- `src/lib/tdx/executor.ts` - Uses `TD_API_KEY` environment variable for authentication
- Agent paths are constructed as: `agents/tdx_default_gregwilliams/{project}/{agent}/`

**Hardcoded Elements:**
- Project root directory: `tdx_default_gregwilliams`
- `.env.local` contains a single `TD_API_KEY`
- No UI for entering/switching API keys

### Implementation Approach

**Phase 1: API Key Input UI**
- Create `ApiKeyInput.tsx` component for secure API key entry
- Position on home page before agent selection
- Store key in session storage (not localStorage for security)
- Show masked key with option to change

**Phase 2: TDX API Integration**
- Research TDX API endpoints for listing available projects given an API key
- Options:
  - Use `tdx project list` CLI command
  - Direct API call to TDX project endpoint
- Modify `executor.ts` to accept API key as parameter rather than environment variable

**Phase 3: Dynamic Project Discovery**
- Create new API endpoint: `GET /api/projects?apiKey=xxx` (or POST for security)
- Returns list of accessible projects for the given API key
- Update `AgentSelector.tsx` to fetch projects dynamically

**Phase 4: Agent Path Resolution**
- Modify agent path construction to use selected project
- Update `POST /api/test` to accept project context
- Ensure test execution uses correct project scope

**Phase 5: State Persistence**
- Store selected project/API key association in session
- Allow switching between different projects/keys
- Clear state on logout/session end

### Key Files to Modify
- New: `src/components/agent/ApiKeyInput.tsx`
- `src/components/agent/AgentSelector.tsx` - Dynamic project loading
- `src/lib/tdx/executor.ts` - Accept API key parameter
- `src/app/api/agents/route.ts` - Accept API key, return project-scoped agents
- New: `src/app/api/projects/route.ts` - List projects for API key
- `src/app/page.tsx` - Integrate API key input flow

### Security Considerations
- Never log or persist API keys in plain text
- Use HTTPS for all API communications
- Consider API key validation before storing
- Session-based storage (cleared on tab close)

### Dependencies
- TDX API documentation for project listing endpoints
- Understanding of TDX authentication scopes (what can an API key access?)

### Acceptance Criteria
- User can enter their own TDX API key
- System queries and displays available projects for that key
- User can select project and agent from their accessible resources
- Selected context persists during session
- Works for users with different TDX accounts/permissions

---

## Implementation Timeline Summary

| Task | ID | Estimated Complexity | Key Challenge |
|------|-----|---------------------|---------------|
| 1 | D21 | Medium | Root cause diagnosis in data flow |
| 2 | D18 | Low | Simple UI refactor |
| 3 | D19 | Low | Buffer limits and display |
| 4 | D20 | Medium | SSE streaming implementation |
| 5 | D2 | Medium | LLM API integration with evaluator agent |
| 6 | D3 | Low | Dependent on D2; straightforward UI state |
| 7 | D6 | Medium-High | TDX API integration, security considerations |

### Suggested Sprint Allocation
- **Sprint 1**: D21 (Bug fix - blocking) + D18 (Pass/Fail rating)
- **Sprint 2**: D19 (Complete response) + D20 (TDX logs)
- **Sprint 3**: D2 (LLM judge results) + D3 (Click-to-view)
- **Sprint 4**: D6 (Dynamic API key/project selection)

---

## Open Questions

### Bug Fix (D21)
1. **D21**: What is the exact TDX CLI output format for the language-detector agent?
2. **D21**: Are there differences in output format between single-round and multi-round tests?

### New Features (D18-D20)
3. **D18**: Should existing True/False ratings be migrated to Pass/Fail or kept as-is?
4. **D19**: What is the maximum expected agent response size?
5. **D20**: Should logs persist after test completion or clear on next run?

### Core Features (D2, D3, D6)
6. **D2**: What specific fields does TDX return for LLM-as-a-judge evaluations? Need sample output.
7. **D2**: Should we call TDX LLM API directly, or rely on TDX agent test output?
8. **D3**: Should we track whether manual rating occurred before/after viewing LLM results?
9. **D6**: What TDX API endpoint returns available projects for an API key?
10. **D6**: Are there rate limits or caching considerations for project/agent listing?

---

## Success Metrics

### Bug Fix
- **D21**: Evaluations run and store/display correctly for all test agents

### New Features
- **D18**: All evaluations use Pass/Fail rating with thumbs icons
- **D19**: Agent responses display in full without truncation
- **D20**: Users see real-time feedback during test execution

### Core Features
- **D2**: 100% of test cases with LLM evaluations display results in UI
- **D3**: Reviewers submit ratings before revealing LLM results >80% of the time
- **D6**: App works with 3+ different user API keys without code changes

---

*Document created: 2026-02-10*
*Updated: 2026-02-11*
*Author: gwtd1*
*Status: Planning*
*D2 Implementation: Option B (Evaluator Agent Direct Call) - Selected*
*Version: 1.1 - Added D18, D19, D20, D21 features and revised implementation order*