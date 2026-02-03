# Agent Eval Tool v1 — Implementation Q&A Round 2

*Captured February 2026*

These answers clarify UI/UX behavior, data handling, and edge cases for V1 implementation.

---

## TDX Integration

### Q1: agent.yaml Generation
**Question**: What is the specific TDX command to generate agent.yaml?

**Answer**: TDX is an AI assistant that can help determine the appropriate commands. The app should use TDX commands to create agent.yaml if not present. Reference TDX documentation at https://tdx.treasuredata.com/ for specific commands.

**From Agent-eval-new Analysis**: Test files (test.yml) are created programmatically using Node.js `fs` module, not via a TDX CLI command. The app creates template files directly.

---

### Q2: TDX Output Format
**Question**: What is the JSON structure returned by `tdx agent test`?

**Answer** (from Agent-eval-new project analysis):

TDX returns **raw text output** (not JSON) that must be parsed. The parsed structure is:

```typescript
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

**Key Implementation Notes**:
- TDX CLI returns plain text, not JSON
- Output is buffered completely, then parsed (not streamed)
- Parser identifies test results using patterns: `Test 1/5:`, `Running test:`, status keywords
- 80% pass threshold for overall status determination

---

### Q3: Agent Listing
**Question**: How do we get the list of available agents?

**Answer**: Reference TDX documentation. From Agent-eval-new analysis:
- Use `tdx profile list` to list profiles
- Use `tdx profile current` to get current profile
- Agents are discovered by scanning the `agents/` directory structure

---

### Q15: Project Structure
**Question**: How are TDX projects and agents organized?

**Answer** (from Agent-eval-new project analysis):

**Three-level hierarchy with path format**: `agents/{PROJECT_NAME}/{AGENT_NAME}`

```
agents/
└── {PROJECT_NAME}/          # e.g., "tdx_default_gregwilliams"
    ├── tdx.json             # Contains: { "llm_project": "..." }
    ├── {AGENT_NAME}/        # e.g., "language-detector"
    │   ├── agent.yml        # Agent configuration
    │   ├── test.yml         # Test cases
    │   └── prompt.md        # Optional prompt file
```

**IDs used**:
- Project ID: First level directory name
- Agent ID: Second level directory name
- Agent Path: `agents/{PROJECT_NAME}/{AGENT_NAME}`

**Only one current version** of each agent (no versioning in V1).

---

## UI/UX Behavior

### Q4: Test Execution Flow
**Question**: What happens during test execution?

**Answer**: Show a loading indicator while test runs. Default timeout is 5 minutes. Specific loading screen details to be determined during implementation.

---

### Q5: Empty States
**Question**: What should the UI display in various scenarios?

| Scenario | Display |
|----------|---------|
| No agents available in TDX | "No agents found in this project" |
| Selected agent has no test cases | Use TDX to create agent.yaml for that agent |
| All test cases reviewed (100%) | "All agents have been reviewed!" |
| TDX connection fails | "Connection Error" |

---

### Q6: Ground Truth Display
**Question**: How should ground truth be displayed?

**Answer**:
- **Format**: Simple string/number only for V1 (complex formats deferred to V2)
- **Copy button**: No
- **Location**: Center panel (ConversationView), but **user must scroll to view it**
- **Rationale**: If user sees ground truth before evaluating, it could bias their judgment

---

## Data & Persistence

### Q7: Test Run History
**Question**: How are test runs handled?

**Answer**:
- Running a new test creates a **new test run** (does not overwrite)
- **Historical test runs**: Deferred to V2 (user can only run test once in V1)
- **Data retention**: Persists forever in V1 (no cleanup)

---

### Q8: Evaluation Uniqueness
**Question**: How are evaluations tied to test runs?

**Answer**:
- User can only evaluate an agent **once** in V1
- Evaluations tied to **agent ID + test case ID**
- No re-evaluation of previous test runs in V1

---

### Q9: Auto-Save
**Question**: How should auto-save work?

**Answer**: **No auto-save for V1**. Keep it simple. Add auto-save to V2 features.

---

## Edge Cases & Error Handling

### Q10: Rating State
**Question**: What rating behaviors are allowed?

| Action | Allowed in V1? |
|--------|----------------|
| Clear a rating (return to unrated) | No |
| Change rating (Good ↔ Bad) | Yes |
| Submit notes without rating | No |
| Submit "Bad" without explanation | **No** - must include notes |

**Important**: Remind user they cannot submit a rating of "Bad" without an explanation note.

---

### Q11: Large Responses
**Question**: How to handle long agent responses?

**Answer**: **No truncation or scroll limits for V1**. Show full content. Add truncation with "Show more" expansion to V2.

---

### Q12: Session Continuity
**Question**: Should the app remember position in review?

**Answer**: **No session continuity for V1**. Always starts from beginning. Add "Resume where you left off" to V2.

---

## Export

### Q13: Export Scope
**Question**: What data is included in CSV export?

**Answer**:
- **V1**: Current test run only
- **V2**: Add ability to export across all test runs
- **V2**: Add filtering (e.g., only "Bad" ratings)

---

### Q14: Export Fields
**Question**: Should export include full agent response?

**Answer**: **Yes, full agent response for V1**. Add truncation option to V2.

---

## Agent Selection

### Q16: Default Selection
**Question**: Should app remember last selected project/agent?

**Answer**: **No, start fresh each session for V1**. Add session persistence to V2.

---

## Summary: V2 Features Identified

These features were explicitly deferred to V2 based on Q&A:

1. Historical test run viewing/comparison
2. Auto-save functionality
3. Clear rating (return to unrated)
4. Response truncation with "Show more"
5. Ground truth truncation
6. Session continuity ("Resume where you left off")
7. Export across all test runs
8. Export filtering by rating
9. Export truncation option
10. Remember last selected project/agent
11. Complex ground truth formats (SQL, JSON, multi-line)
