# PRD: Agent Eval Tool v1

**Product**: Agent Eval Tool v1
**Author**: Greg Williams
**Status**: Draft
**Date**: February 2026

---

## 1. Problem Statement

CLI-based agent evaluation has significant limitations:
- Not accessible to non-engineers (PMs, QA, customers)
- High overhead in tuning automated LLM judges
- No centralized interface for reviewing agent outputs
- Human expertise is lost—explanations aren't captured systematically

**Core Insight**: *"There is no better tradeoff for evals than simple human error analysis."*

---

## 2. Solution

A web-based Human-in-the-Loop evaluation tool that:
1. Executes agent tests via TDX
2. Presents results in a reviewable format
3. Captures expert ratings and explanations
4. Persists evaluations for future analysis

---

## 3. Target Users

| User | Need |
|------|------|
| **Product Managers** | Review agent behavior without CLI knowledge |
| **Engineers** | Quickly assess agent quality during development |
| **QA Teams** | Systematically evaluate agent outputs |
| **Customers** | Validate agent performance on their use cases |

---

## 4. Core Concept: The Benevolent Dictator

From evaluation research (Hamel Husain, Shreya Shankar):

> The "benevolent dictator" is a domain expert who provides the final judgment on agent quality. This person gives a **binary response** (good/bad) and has the ability to write **additional explanation logic** for triaging test cases.

**V1 enables this role** by providing:
- Binary rating interface (Good/Bad)
- Free-text notes for expert explanations
- Rapid navigation to maintain review flow

---

## 5. Evaluation Philosophy

### What Automation Can Do
- Execute test batches (30+ prompts per cycle)
- Catch formatting errors
- Flag obvious orchestration failures

### What Automation Cannot Do
- Judge subjective or ambiguous responses
- Understand nuanced business context
- Provide the "stamp of approval" on agent behavior

### The Human Role
- Review each test case output
- Make binary pass/fail determination
- Explain **why** something failed (patterns reveal improvement opportunities)
- Fill gaps that automation cannot address

---

## 6. Ground Truth Strategy

| Prompt Type | Ground Truth Source | V1 Handling |
|-------------|---------------------|-------------|
| **Deterministic** | Data Workbench queries, known values | Hardcoded in config.yaml |
| **Probabilistic** | Expert judgment required | Left blank; reviewer interprets |

**Requirement**: App must handle missing ground truth gracefully—no crashes, clear "N/A" display.

**V1 Ground Truth Display**:
- Format: Simple string/number only (complex formats deferred to V2)
- Location: Center panel, but user must scroll to view (prevents evaluation bias)
- No copy-to-clipboard button

---

## 7. Platform Architecture

```
TDX (Agent Execution) → Agent Eval Tool (Human Review) → Evaluation Reports
```

### Key Constraints
- **Unidirectional data flow**: TDX → Eval Tool (no write-back)
- **TDX remains primary execution environment**
- **Eval Tool is the presentation layer** for human review

### V1 Behavioral Constraints

| Behavior | V1 Rule |
|----------|---------|
| Test runs per agent | One test run per agent per session |
| Rating changes | Can change Good↔Bad, cannot clear to unrated |
| "Bad" rating | Must include explanation notes |
| Session persistence | Starts fresh each session |
| Export scope | Current test run only |

### Empty State Messages

| Scenario | Message |
|----------|---------|
| No agents in project | "No agents found in this project" |
| No test cases | Use TDX to create agent.yaml |
| All reviewed | "All agents have been reviewed!" |
| Connection failure | "Connection Error" |

---

## 8. Functional Requirements

### 8.1 Must Have (V1)

| ID | Requirement | Rationale |
|----|-------------|-----------|
| F1 | Select agent from TDX project | Connects to real agents |
| F2 | Execute `tdx agent test` from UI | Removes CLI dependency |
| F3 | Display test case list | Navigate multiple prompts |
| F4 | Binary rating (Good/Bad) | Core evaluation action |
| F5 | Free-text notes | Capture expert explanations |
| F6 | Persist evaluations locally | Retain work across sessions |
| F7 | Export to CSV | Enable downstream analysis |
| F8 | Handle blank ground truth | Support probabilistic prompts |

### 8.2 V2-agent-eval-tool
- Run locally 
- test with real use cases 
- TR and Michaels for test cases 
- setup a md file to look into the schema through TDX for a specific project 
  - would be a new file in the repo

| ID | Requirement                                           | Reason                                                                                                                  |
|----|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| D1 | Show conversation traces                              | Use API call to conversation or Look into using TDX to chat with agent and refactor to return traces                    |
| D2 | LLM as a judge output                                 | Currently only see the agent output                                                                                     |
| D3 | LLM as a judge results click-to-view                  | Currenly they do not appear at all                                                                                      |
| D4 | Export filtering by rating                            | V1 exports all evaluations, filter for FALSE test cases                                                                 |
| D5 | hacky input where claude code converts csv to yml file | Create a TDX command to upload csv to add test cases to eval.yaml; Currently only TR and Honda have ground truth in csv |
| D6 | Query the project name from TDX for agents | V1 is hardcoded for TDX project name is tdx_default_gregwilliams and we need to update this for V2 to query tdx         |


# UI 
| ID | Requirement                                           | Reason                                                                       |
|----|-------------------------------------------------------|------------------------------------------------------------------------------|
| D3 | LLM as a judge results click-to-view                  | Dependency on D2; Currently they do not appear at all                        |
| D4 | Export filtering by rating                            | V1 exports all evaluations, filter for FALSE test cases                      |

# TDX 
| ID | Requirement                                           | Reason                                                                                                                  |
|----|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| D2 | LLM as a judge output                                 | Currently only see the agent output                                                                                     |
| D5 | hacky input where claude code converts csv to yml file | Create a TDX command to upload csv to add test cases to eval.yaml; Currently only TR and Honda have ground truth in csv |


# UI + BE 
| ID | Requirement                                           | Reason                                                                                                           |
|----|-------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| D1 | Show conversation traces                               | Use API call to conversation or Look into using TDX to chat with agent and refactor to return traces             |
| D6 | Query the project name from TDX for agents | V1 is hardcoded for TDX project name is tdx_default_gregwilliams and we need to update this for V2 to query tdx  |

 
                                                                                                                                                       
### 8.3 V3-agent-eval-tool
| ID  | Requirement                               | Notes                                                                                         |
|-----|-------------------------------------------|-----------------------------------------------------------------------------------------------|
| D7  | Manual test case creation                 | test cases can be written from the UI                                                         |
| D8  | Cloud deployment                          | app is hosted in the cloud so anyone can use the tool with an api key                         |
| D9  | Response truncation ("Show more")         | if agent test cases or responses are too long we can use "show more" button to hide text      |
| D10 | upload input  from a doc                  | click a button to upload testcases and ground truth; Currently TR and Honda have ground truth |
| D11 | LLM-based error clustering                | Post-MVP analytics to detect common issues with agents from eval notes                        |
| D12 | Tagging/labeling system                   | Requires taxonomy design                                                                      |
| D13 | Zod schema validation for API requests    | Complex API functionality - V1 uses manual validation with early returns                      |
| D14 | Full service API layer architecture       | V1 keeps simple CRUD in route handlers                                                        |
| D15 | Structured JSON logging for production    | V1 uses console logging for development                                                       |
| D16 | Multi-reviewer support (reviewerId field) | V1 is single-user; field removed for simplicity                                               |
| D17 | Pagination for Previous Test Runs         | The Previous Test Runs need a scroll or pagination on the into screen                         |


---

## 9. User Experience

### 9.1 Workflow

```
1. Select Project → 2. Select Agent → 3. Run Test → 4. Review Results → 5. Export
```

### 9.2 Review Interface (Three-Panel Layout)

| Panel | Purpose |
|-------|---------|
| **Left** | Test case list with status indicators |
| **Center** | Conversation view (prompt, response, ground truth) |
| **Right** | Evaluation controls (rating, notes, navigation) |

### 9.3 Keyboard-First Design

Reviewers should enter "flow state" without touching the mouse:
- Arrow keys: Navigate test cases
- G/B: Rate Good/Bad
- N: Focus notes
- Esc: Return to navigation

---

## 10. Scale Requirements

From stakeholder interviews:

| Metric | Target |
|--------|--------|
| Prompts per eval cycle | 30+ minimum |
| Ground truth queries per customer | 50+ minimum |
| Time per review | < 60 seconds |
| Manual typing during eval | Zero |

---

## 11. Success Metrics

### Launch Criteria
- [ ] Successfully execute `tdx agent test` from UI
- [ ] Review 30+ test cases without performance degradation
- [ ] Persist evaluations across browser refresh
- [ ] Export complete evaluation set to CSV

### Quality Indicators
- Reviewer can complete full batch in single session
- No confusion about current state or next action
- Expert notes capture actionable patterns

---

## 12. Out of Scope

- Manual test case creation (V1 uses TDX commands to generate agent.yaml)
- System prompt editing
- LLM-as-judge automation
- Cloud deployment
- Write-back to TDX

---

## 13. Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| TDX CLI access | Platform Team | Available |
| Agent Foundry agents | Agent Teams | Available |
| agent.yaml with test cases | TDX CLI | Auto-generated via TDX commands if not present |

---

## 14. References

### External Documentation
- [TDX Documentation](https://tdx.treasuredata.com/)
- [Opportunity Assessment - Eval Tool](https://treasure-data.atlassian.net/wiki/spaces/~71202095bc5d7d584c4b84877e0ac4de82324e/pages/4765057189)
- [Eval Interview Notes](https://treasure-data.atlassian.net/wiki/spaces/~71202095bc5d7d584c4b84877e0ac4de82324e/pages/4767449215)
- [Hamel Husain's Eval Framework](https://hamel.dev/blog/posts/evals-faq/)
- Agent-eval-new project (TDX integration patterns)

### Internal Documentation
- `/docs/implementation-qa-clarifications.md` — Initial Q&A decisions
- `/docs/implementation-qa-round2.md` — UI/UX and behavior clarifications

---

*This PRD defines the minimum viable product for human-centric agent evaluation. The focus is intentional: enable domain experts to efficiently review agent outputs and capture their expertise in a structured format.*