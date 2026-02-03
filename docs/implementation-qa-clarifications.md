# Agent Eval Tool v1 — Implementation Q&A Clarifications

*Captured February 2026*

These answers clarify key architectural decisions and correct assumptions from the initial planning phase.

---

## Q1: Where does the test case data actually come from for your demo?

**Answer**: Real agents will be referenced in Treasure Data using TDX agent commands similar to those used in the **Agent-eval-new** project.

**Implementation Reference**: Agent-eval-new project patterns for TDX integration.

---

## Q2: What story are you telling in the demo?

**Answer**: *"Watch me run `tdx agent test`, then review results in this UI."*

This is a live demonstration showing the complete workflow:
1. Select an agent from TDX
2. Execute test cases via `tdx agent test "{agentPath}"`
3. Review results in the Eval Tool UI
4. Rate and annotate responses

**Implementation Reference**: Agent-eval-new project for UX flow and command patterns.

---

## Q3: Is the Trace format the actual format TDX produces, or was it invented?

**Answer**: No, the Trace interface in the initial plan was conceptual.

**Implementation Reference**: Agent-eval-new project for the actual TDX output format. The data models must be updated to match real TDX trace structures.

---

## Q4: Is V1 truly offline (just reviewing pre-captured data), or does it need live TDX access?

**Answer**: **V1 is connected to TDX.** This is not an offline tool.

**Implementation Reference**:
- [Rapid AI Prototyping Starter Pack](https://treasure-data.atlassian.net/wiki/spaces/PROD/pages/4750312018/Rapid+AI+Prototyping+Starter+Pack)
- TDX connection patterns including:
  - `TD_API_KEY`
  - `TD_LLM_BASE_URL`
  - `TD_AGENT_ID`

---

## Q5: How do you actually get ground truth queries into the system?

**Answer**: Ground truth handling varies by prompt type:

| Prompt Type | Ground Truth Approach |
|-------------|----------------------|
| **Deterministic** | Manually created fake ground truth with verifiable answers |
| **Probabilistic/Opinionated** | Hardcoded in `config.yaml` OR left blank for reviewer interpretation |

**Examples**:
- Deterministic: *"How many people purchased a car on Jan 1st, 2024?"* → Ground truth: specific count
- Probabilistic: *"What's the best marketing strategy?"* → Ground truth: blank/reviewer-interpreted

**Critical Requirement**: If ground truth in `config.yaml` is empty or blank, **the app must not break**. Graceful handling of missing ground truth is required.

---

## Q6: Is V1 a mockup with static data, or a working prototype with real TDX output?

**Answer**: **V1 is a working prototype** with the following requirements:

| Capability | Description |
|------------|-------------|
| **Live Agent Calls** | Successfully call agents through TDX |
| **Test Execution** | Run test cases using `tdx agent test` command |
| **Local Storage** | Persistent storage (SQLite or similar) for reviewer feedback and eval results |

This is NOT a mockup. This is a functional tool that:
1. Connects to real TDX agents
2. Executes real test cases
3. Captures and persists human evaluations locally

---

## Architecture Implications

These clarifications require the following changes to the original plan:

### Changed: Data Layer
- ~~Local JSON files~~ → **SQLite database** for evaluation persistence
- Static YAML import → **Live TDX command execution**

### Changed: Backend Requirements
- ~~No separate Express server~~ → **Backend capability needed** for TDX command execution
- Next.js API routes must support shell command execution or use a proper backend service

### Changed: Network Requirements
- ~~Works offline~~ → **Requires network access** to TDX/LLM APIs

### Added: Project References
- **Agent-eval-new**: Primary reference for TDX integration patterns
- **Rapid AI Prototyping Starter Pack**: API connection patterns

### Added: Ground Truth Handling
- Support for blank/null ground truth values
- Graceful UI handling when ground truth is absent
- Reviewer-interpreted evaluation for subjective prompts