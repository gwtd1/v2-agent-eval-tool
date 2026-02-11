# V2 Implementation Plan: gwtd1 Tasks

## Overview

This document outlines the implementation plan for the three V2 roadmap tasks assigned to developer **gwtd1**:

| ID | Category | Requirement | Current State |
|----|----------|-------------|---------------|
| D2 | TDX | LLM as a judge results in evaluation UI frame | Only agent output visible, no LLM judging results |
| D3 | UI | Make LLM as a judge results click-to-view | Not implemented (depends on D2) |
| D6 | UI + BE | Query TDX project name/agent after user provides API key | Hardcoded to `tdx_default_gregwilliams` |

---

## Recommended Implementation Order

### Order: D2 → D3 → D6

**Rationale:**

1. **D2 before D3**: D3 has an explicit dependency on D2. The click-to-view functionality requires the LLM-as-a-judge results to exist in the UI first.

2. **D2 + D3 together**: These tasks are tightly coupled and share the same UI context (ConversationView/EvaluationPanel). Completing them sequentially while the codebase context is fresh reduces context-switching overhead.

3. **D6 last**: While D6 is foundational for multi-user support, it's independent of the LLM judging features. The current hardcoded setup works for development and doesn't block D2/D3 implementation. D6 can be implemented after the core evaluation enhancement is complete.

---

## Task 1: D2 - LLM as a Judge Results in Evaluation UI Frame

### Objective
Display LLM-as-a-judge evaluation results in the UI below the agent response, allowing reviewers to see automated assessment alongside manual evaluation.

### Current State Analysis

**Existing Architecture:**
- `src/app/review/page.tsx` - Three-panel review layout
- `src/components/panels/ConversationView.tsx` - Center panel displays: Prompt, Agent Response, Ground Truth
- `src/lib/tdx/parser.ts` - Parses TDX CLI output including `TestResult.status` (pass/fail/error)
- `src/lib/types/tdx.ts` - Defines `TestResult` interface with status, details, duration, error fields
- Database schema includes `test_cases.traces` field (currently unused, marked "deferred to V2")

**Data Flow Gap:**
The TDX `test.yml` files contain `criteria` fields that define expected outcomes, and TDX agent test returns pass/fail status, but this data is not surfaced in the UI.

### Implementation Approach

**Phase 1: Data Capture**
- Modify `src/lib/tdx/parser.ts` to extract LLM-as-a-judge evaluation details from TDX test output
- Capture: verdict (pass/fail), reasoning/explanation, confidence score (if available), criteria matched
- Store in a new field or leverage the existing `test_cases.traces` column

**Phase 2: Database Schema Update**
- Add `llm_evaluation` field to `test_cases` table (JSON structure) or utilize `traces` field
- Structure should include:
  ```
  {
    verdict: 'pass' | 'fail' | 'partial',
    reasoning: string,
    criteria_results: [{ criterion: string, met: boolean, explanation: string }],
    confidence: number (optional),
    model_used: string (optional)
  }
  ```

**Phase 3: API Updates**
- Modify `GET /api/evaluations/[id]` to include LLM evaluation data with test case response
- Ensure backward compatibility for test runs without LLM evaluation data

**Phase 4: UI Integration**
- Create new component `LlmJudgeResults.tsx` in `src/components/panels/`
- Add as a collapsible section in `ConversationView.tsx` below Agent Response
- Display: Overall verdict badge, reasoning text, individual criteria results
- Styling: Distinct visual treatment (different background color, clear labeling)

### Key Files to Modify
- `src/lib/tdx/parser.ts` - Add LLM evaluation extraction
- `src/lib/db/schema.ts` - Schema update for LLM eval storage
- `src/lib/db/queries.ts` - Query updates for new data
- `src/app/api/evaluations/[id]/route.ts` - Include LLM eval in response
- `src/components/panels/ConversationView.tsx` - Integrate LlmJudgeResults component
- New: `src/components/panels/LlmJudgeResults.tsx`

### Dependencies
- Understanding of TDX agent test output format for LLM judging
- Confirmation of what data TDX currently returns for pass/fail determinations

### Acceptance Criteria
- LLM-as-a-judge results appear below agent response in the evaluation UI
- Results include verdict, reasoning, and criteria breakdown
- Historical test runs without LLM data display gracefully (empty state or "N/A")

---

## Task 2: D3 - Make LLM as a Judge Results Click-to-View

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

## Task 3: D6 - Query TDX Project Name/Agent After User Provides API Key

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

| Task | Estimated Complexity | Key Challenge |
|------|---------------------|---------------|
| D2 | Medium | Understanding TDX output format for LLM judge data |
| D3 | Low | Dependent on D2 completion; straightforward UI state |
| D6 | Medium-High | TDX API integration, security considerations |

### Suggested Sprint Allocation
- **Sprint 1**: D2 (LLM results data capture + UI display)
- **Sprint 2**: D3 (Click-to-view) + Begin D6 (API key input, project discovery)
- **Sprint 3**: D6 completion (agent path resolution, testing)

---

## Open Questions

1. **D2**: What specific fields does TDX return for LLM-as-a-judge evaluations? Need sample output.
2. **D2**: Should we call TDX LLM API directly, or rely on TDX agent test output?
3. **D3**: Should we track whether manual rating occurred before/after viewing LLM results?
4. **D6**: What TDX API endpoint returns available projects for an API key?
5. **D6**: Are there rate limits or caching considerations for project/agent listing?

---

## Success Metrics

- **D2**: 100% of test cases with LLM evaluations display results in UI
- **D3**: Reviewers submit ratings before revealing LLM results >80% of the time
- **D6**: App works with 3+ different user API keys without code changes

---

*Document created: 2026-02-10*
*Author: gwtd1*
*Status: Planning*