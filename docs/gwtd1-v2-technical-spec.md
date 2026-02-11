# Technical Implementation Specification: gwtd1 V2 Features

## Document Overview

This technical specification provides detailed implementation guidance for the three V2 features assigned to gwtd1:
- **D2**: LLM as a Judge Results in Evaluation UI Frame
- **D3**: Make LLM as a Judge Results Click-to-View
- **D6**: Query TDX Project Name/Agent After User Provides API Key

**Reference Sources:**
- TDX CLI Documentation: https://tdx.treasuredata.com/commands/agent.html
- agent-eval-new project architecture patterns
- Existing agent-eval-tool-v1 codebase

---

## Architecture Context

### Current Stack (agent-eval-tool-v1)
- **Frontend**: Next.js 14.2.35, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **TDX Integration**: CLI-based via child_process

### Reference Architecture (agent-eval-new)
- **Backend**: Python async with aiohttp
- **TDX Integration**: Direct LLM API calls (not CLI)
- **Evaluation**: Two-phase (Generate + Evaluate) with dedicated evaluator agent

### Key Insight
The agent-eval-new project uses **direct LLM API calls** rather than TDX CLI for evaluation. This approach provides:
- Access to chat history and conversation details
- Ability to call a dedicated evaluator agent
- Structured JSON responses for judge results

---

## TDX Integration Reference

### TDX CLI Commands (from documentation)

| Command | Purpose | Usage |
|---------|---------|-------|
| `tdx agent list` | List agents in project | `tdx agent list --format json` |
| `tdx agent show` | Display agent details | `tdx agent show <agent-name>` |
| `tdx agent test` | Run automated tests | `tdx agent test <agent-name>` |
| `tdx agent pull` | Export agents to local files | `tdx agent pull` |
| `tdx agent push` | Import local files to project | `tdx agent push` |

### TDX Project Structure
```
agents/
└── {project-name}/
    ├── tdx.json                # Project configuration
    └── {agent-name}/
        ├── prompt.md           # System prompt
        ├── agent.yml           # Agent configuration
        ├── starter_message.md  # Optional starter message
        └── test.yml            # Test definitions
```

### LLM API Endpoints (from agent-eval-new)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chats` | POST | Create new chat session |
| `/api/chats/{id}/continue` | POST | Send message to chat |
| `/api/chats/{id}/history` | GET | Retrieve conversation history |
| `/api/agents/{id}` | GET | Get agent definition |
| `/api/projects` | GET | List accessible projects |

### API Authentication
```
Header: Authorization: TD1 {api_key}
Content-Type: application/vnd.api+json
```

### Environment-Specific API URLs
```
Development:  https://llm-api-development.us01.treasuredata.com/api
Staging:      https://llm-api-staging.us01.treasuredata.com/api
Production:   https://llm-api.treasuredata.com/api
Production JP: https://llm-api.treasuredata.co.jp/api
Production EU: https://llm-api.eu01.treasuredata.com/api
```

---

## Feature D2: LLM as a Judge Results in Evaluation UI Frame

### Objective
Display LLM-as-a-judge evaluation results in the UI below the agent response.

### Technical Approach

The agent-eval-new project implements LLM-as-a-judge using a **dedicated evaluator agent**. We will adapt this pattern for the web UI.

#### Option A: Use TDX Agent Test Output (Simpler)
Parse existing `tdx agent test` output which already includes pass/fail verdicts from the built-in judge.

#### Option B: Call Evaluator Agent Directly (Richer Data)
Call the LLM API with an evaluator agent to get detailed reasoning, following agent-eval-new patterns.

**Recommendation**: Start with Option A, enhance with Option B in future iterations.

---

### Implementation Details

#### 1. Data Model Updates

**New TypeScript Interface** (`src/lib/types/llmJudge.ts`):
```typescript
interface LlmJudgeResult {
  verdict: 'pass' | 'fail' | 'partial' | 'error';
  score: number;              // 0.0 - 1.0
  reasoning: {
    plan: string;             // Evaluator's approach
    thinking: string;         // Step-by-step analysis
    conclusion: string;       // Final determination
  };
  criteriaResults: CriteriaResult[];
  evaluatorModel: string;     // e.g., "claude-sonnet-4-5"
  evaluatedAt: string;        // ISO timestamp
}

interface CriteriaResult {
  criteriaName: string;
  criteriaText: string;
  passed: boolean;
  score: number;
  explanation: string;
}
```

**Reference from agent-eval-new** (`/evaluator_lib/models.py`):
```python
@dataclass
class ValidationResult:
    type: str
    criteria_name: str
    passed: bool
    score: float
    plan: str
    thinking: str
    reason: str
```

#### 2. Database Schema Update

**Migration for test_cases table**:
```sql
-- Option 1: Add dedicated column
ALTER TABLE test_cases ADD COLUMN llm_judge_result TEXT;

-- Option 2: Use existing traces column (already exists, unused)
-- Store as JSON in traces field
```

**JSON Structure in Database**:
```json
{
  "verdict": "pass",
  "score": 1.0,
  "reasoning": {
    "plan": "I will verify the response against the ground truth criteria...",
    "thinking": "The agent correctly identified...",
    "conclusion": "The response meets all specified criteria."
  },
  "criteriaResults": [
    {
      "criteriaName": "accuracy",
      "criteriaText": "Response must match expected output format",
      "passed": true,
      "score": 1.0,
      "explanation": "Response format matches expected structure."
    }
  ],
  "evaluatorModel": "claude-sonnet-4-5",
  "evaluatedAt": "2026-02-10T15:30:00Z"
}
```

#### 3. TDX Integration Enhancement

**Approach A: Parse TDX Test Output**

The current `tdx agent test` command returns pass/fail status. Enhance parsing in `src/lib/tdx/parser.ts`:

```typescript
// Current structure from test.yml
interface TestYamlCase {
  name: string;
  user_input: string;
  criteria: string;          // Evaluation criteria text
  expected_output?: string;  // Optional ground truth
}

// Enhanced parsing to extract judge results
function extractLlmJudgeResult(
  testOutput: string,
  testYamlCase: TestYamlCase
): LlmJudgeResult {
  // Parse TDX test output for:
  // - Pass/fail verdict
  // - Criteria matching
  // - Any reasoning provided
}
```

**Approach B: Direct Evaluator Call**

Create new API client for LLM evaluation following agent-eval-new patterns:

**New file: `src/lib/llm/evaluator.ts`**
```typescript
const EVALUATOR_AGENT_ID = '019ae82f-b843-79f5-95c6-c7968262b2c2'; // From agent-eval-new
const DEV_API_URL = 'https://llm-api-development.us01.treasuredata.com/api';

interface EvaluatorInput {
  conversationHistory: string;  // Formatted chat history
  criteria: string;             // Evaluation criteria
  context?: Record<string, string>;  // Additional context variables
}

async function evaluateWithLlm(
  input: EvaluatorInput,
  apiKey: string
): Promise<LlmJudgeResult> {
  // 1. Create chat with evaluator agent
  // 2. Send formatted prompt with conversation + criteria
  // 3. Parse JSON response
  // 4. Return structured result
}
```

**Prompt Template** (from agent-eval-new `/evaluator_lib/evaluation/criteria.py`):
```
<conversation_history>
{formatted_history}
</conversation_history>

<criteria>
{criteria_text}
</criteria>

Rubric: Boolean judgement: Either 1 for perfectly follows criteria,
or 0 for does not follow criteria.

Return your evaluation as JSON:
{
  "plan": "your evaluation approach",
  "thinking": "step-by-step analysis",
  "score": 0 or 1,
  "reason": "final determination"
}
```

#### 4. API Route Updates

**Modify `GET /api/evaluations/[id]`** (`src/app/api/evaluations/[id]/route.ts`):

```typescript
// Current response
{
  evaluation: { id, rating, notes, ... },
  testCase: { prompt, agentResponse, groundTruth, ... }
}

// Enhanced response
{
  evaluation: { id, rating, notes, ... },
  testCase: { prompt, agentResponse, groundTruth, ... },
  llmJudgeResult: {
    verdict: 'pass',
    score: 1.0,
    reasoning: { ... },
    criteriaResults: [ ... ]
  }
}
```

**New endpoint for on-demand evaluation**:

`POST /api/evaluations/[id]/llm-judge`
- Triggers LLM evaluation for a specific test case
- Useful for re-evaluation or cases without initial judge result
- Stores result in database

#### 5. UI Component Implementation

**New component: `src/components/panels/LlmJudgeResults.tsx`**

```typescript
interface LlmJudgeResultsProps {
  result: LlmJudgeResult | null;
  isLoading?: boolean;
  onRequestEvaluation?: () => void;
}

// Visual structure:
// ┌─────────────────────────────────────┐
// │ 🤖 LLM Evaluation                   │
// ├─────────────────────────────────────┤
// │ Verdict: ✅ PASS (Score: 1.0)       │
// ├─────────────────────────────────────┤
// │ Reasoning:                          │
// │ "The agent correctly identified..." │
// ├─────────────────────────────────────┤
// │ Criteria Results:                   │
// │ ✅ accuracy (1.0)                   │
// │ ✅ format (1.0)                     │
// └─────────────────────────────────────┘
```

**Integration in ConversationView.tsx**:

```typescript
// Current layout:
// - Prompt section
// - Agent Response section
// - Ground Truth section

// New layout:
// - Prompt section
// - Agent Response section
// - LLM Judge Results section (NEW)
// - Ground Truth section
```

#### 6. Data Flow Diagram

```
Test Execution (existing):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ POST /test  │────▶│ TDX agent   │────▶│ Parse       │
│             │     │ test        │     │ output      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Extract LLM │
                                        │ judge data  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Store in    │
                                        │ test_cases  │
                                        └─────────────┘

UI Display (new):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ GET         │────▶│ Query DB    │────▶│ Return with │
│ /evaluation │     │             │     │ llmJudge    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Render in   │
                                        │ UI panel    │
                                        └─────────────┘
```

---

## Feature D3: Make LLM as a Judge Results Click-to-View

### Objective
Hide LLM judge results behind a click interaction to prevent biasing the human evaluator.

### Technical Approach

Implement collapsed/expanded state for the LlmJudgeResults component with state management in EvaluationContext.

---

### Implementation Details

#### 1. State Management

**Update `src/context/EvaluationContext.tsx`**:

```typescript
interface EvaluationContextState {
  // Existing state...
  testRunId: string | null;
  selectedTestCaseId: string | null;
  evaluations: Evaluation[];

  // New state for D3
  llmResultsVisibility: Record<string, boolean>;  // testCaseId -> isVisible

  // Actions
  toggleLlmResultsVisibility: (testCaseId: string) => void;
  resetLlmResultsVisibility: () => void;
}
```

**Behavior Rules**:
1. Default state: hidden (false)
2. Reset to hidden when navigating to different test case
3. Persist visibility state only during current session
4. Optional: Track reveal timing for analytics

#### 2. Component State Logic

**Update `LlmJudgeResults.tsx`**:

```typescript
interface LlmJudgeResultsProps {
  result: LlmJudgeResult | null;
  testCaseId: string;
}

function LlmJudgeResults({ result, testCaseId }: LlmJudgeResultsProps) {
  const { llmResultsVisibility, toggleLlmResultsVisibility } = useEvaluation();
  const isVisible = llmResultsVisibility[testCaseId] ?? false;

  if (!result) {
    return <EmptyState message="No LLM evaluation available" />;
  }

  if (!isVisible) {
    return (
      <CollapsedView
        hasResult={true}
        onReveal={() => toggleLlmResultsVisibility(testCaseId)}
      />
    );
  }

  return (
    <ExpandedView
      result={result}
      onHide={() => toggleLlmResultsVisibility(testCaseId)}
    />
  );
}
```

#### 3. UI States

**Collapsed State**:
```
┌─────────────────────────────────────┐
│ 🤖 LLM Evaluation Available         │
│                                     │
│    [ Reveal Assessment ]            │
│                                     │
│ ⚠️ View after forming your opinion  │
└─────────────────────────────────────┘
```

**Expanded State**:
```
┌─────────────────────────────────────┐
│ 🤖 LLM Evaluation           [Hide]  │
├─────────────────────────────────────┤
│ Verdict: ✅ PASS                    │
│ Score: 1.0                          │
├─────────────────────────────────────┤
│ Reasoning:                          │
│ "The agent correctly..."            │
└─────────────────────────────────────┘
```

#### 4. Keyboard Shortcut

**Update `src/lib/utils/keyboard.ts`**:

```typescript
// Existing shortcuts
const SHORTCUTS = {
  ARROW_UP: 'Navigate to previous test case',
  ARROW_DOWN: 'Navigate to next test case',
  T: 'Rate as True',
  F: 'Rate as False',
  N: 'Focus notes',
  ESC: 'Blur notes',

  // New shortcut
  L: 'Toggle LLM results visibility',
};
```

#### 5. Analytics Tracking (Optional)

**Track evaluation workflow**:

```typescript
interface EvaluationAnalytics {
  testCaseId: string;
  ratedBeforeReveal: boolean;      // Did user rate before viewing LLM results?
  revealedAt: string | null;       // When was LLM result revealed?
  ratedAt: string | null;          // When was manual rating submitted?
  agreedWithLlm: boolean | null;   // Did manual rating match LLM verdict?
}
```

This data helps measure:
- Evaluator independence (% who rate before revealing)
- LLM-human agreement rate
- Potential bias patterns

---

## Feature D6: Query TDX Project Name/Agent After User Provides API Key

### Objective
Replace hardcoded project name (`tdx_default_gregwilliams`) with dynamic project/agent discovery based on user-provided API key.

### Technical Approach

Use TDX CLI and/or LLM API to discover accessible projects and agents for a given API key.

---

### Implementation Details

#### 1. API Key Management

**New component: `src/components/agent/ApiKeyInput.tsx`**

```typescript
interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string, environment: Environment) => void;
  currentKey?: string;
}

type Environment = 'dev' | 'staging' | 'prod' | 'prod-jp' | 'prod-eu01';

// UI Structure:
// ┌─────────────────────────────────────────┐
// │ TDX Configuration                       │
// ├─────────────────────────────────────────┤
// │ Environment: [Dev ▼]                    │
// │                                         │
// │ API Key: [••••••••••••••••] [Change]    │
// │                                         │
// │ Status: ✅ Connected                    │
// └─────────────────────────────────────────┘
```

**Security Considerations**:
- Store in sessionStorage (not localStorage)
- Never log API keys
- Mask in UI after entry
- Clear on session end

#### 2. Environment Configuration

**Update `src/lib/config/environments.ts`**:

```typescript
const ENVIRONMENTS = {
  dev: {
    name: 'Development',
    apiUrl: 'https://llm-api-development.us01.treasuredata.com/api',
    consoleUrl: 'https://console-development.us01.treasuredata.com',
  },
  staging: {
    name: 'Staging',
    apiUrl: 'https://llm-api-staging.us01.treasuredata.com/api',
    consoleUrl: 'https://console-staging.us01.treasuredata.com',
  },
  prod: {
    name: 'Production (US)',
    apiUrl: 'https://llm-api.treasuredata.com/api',
    consoleUrl: 'https://console.treasuredata.com',
  },
  'prod-jp': {
    name: 'Production (Japan)',
    apiUrl: 'https://llm-api.treasuredata.co.jp/api',
    consoleUrl: 'https://console.treasuredata.co.jp',
  },
  'prod-eu01': {
    name: 'Production (EU)',
    apiUrl: 'https://llm-api.eu01.treasuredata.com/api',
    consoleUrl: 'https://console.eu01.treasuredata.com',
  },
};
```

#### 3. Project Discovery API

**New endpoint: `POST /api/projects`**

```typescript
// Request
{
  apiKey: string;
  environment: Environment;
}

// Response
{
  projects: [
    {
      id: string;
      name: string;
      agentCount: number;
    }
  ]
}
```

**Implementation Options**:

**Option A: TDX CLI**
```bash
# Set API key for command
TD_API_KEY={user_key} tdx agent list --format json

# Parse output to extract projects
```

**Option B: LLM API Direct Call**
```typescript
// GET /api/projects with TD1 auth header
const response = await fetch(`${apiUrl}/projects`, {
  headers: {
    'Authorization': `TD1 ${apiKey}`,
    'Content-Type': 'application/vnd.api+json',
  },
});
```

#### 4. Agent Discovery API

**Update `GET /api/agents`** to accept dynamic API key:

```typescript
// Request (query params or headers)
GET /api/agents?environment=dev
Header: X-TD-API-Key: {user_api_key}

// Response (unchanged structure, dynamic data)
{
  agents: {
    "project-name": [
      { id: "...", name: "Agent 1", model: "claude-sonnet-4-5" },
      { id: "...", name: "Agent 2", model: "claude-sonnet-4-5" }
    ]
  }
}
```

**Backend implementation**:

```typescript
// src/app/api/agents/route.ts
export async function GET(request: Request) {
  const apiKey = request.headers.get('X-TD-API-Key');
  const { searchParams } = new URL(request.url);
  const environment = searchParams.get('environment') || 'dev';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  // Option A: Call TDX CLI with custom API key
  const agents = await listAgentsWithKey(apiKey, environment);

  // Option B: Call LLM API directly
  const agents = await fetchAgentsFromApi(apiKey, environment);

  return NextResponse.json({ agents });
}
```

#### 5. State Management for API Key

**Create `src/context/AuthContext.tsx`**:

```typescript
interface AuthContextState {
  apiKey: string | null;
  environment: Environment;
  isConnected: boolean;
  projects: Project[];

  setApiKey: (key: string, env: Environment) => Promise<void>;
  clearApiKey: () => void;
  validateConnection: () => Promise<boolean>;
}

// Persist to sessionStorage
const AUTH_STORAGE_KEY = 'tdx_auth';
```

#### 6. Updated Agent Selector Flow

**Modify `src/components/agent/AgentSelector.tsx`**:

```typescript
// Current flow:
// 1. Fetch agents from /api/agents (uses env var)
// 2. Display project/agent dropdowns

// New flow:
// 1. Check AuthContext for API key
// 2. If no key, show ApiKeyInput
// 3. If key exists, fetch agents with key
// 4. Display project/agent dropdowns
// 5. Allow key change via settings
```

**UI Flow**:

```
┌─────────────────────────────────────────┐
│ Step 1: Configure Connection            │
├─────────────────────────────────────────┤
│ Environment: [Development ▼]            │
│ API Key: [________________________]     │
│                     [Connect]           │
└─────────────────────────────────────────┘
            │
            ▼ (on successful connection)
┌─────────────────────────────────────────┐
│ Step 2: Select Agent                    │
├─────────────────────────────────────────┤
│ ✅ Connected to Development             │
│                                         │
│ Project: [my-project ▼]                 │
│ Agent:   [audience-agent ▼]             │
│                                         │
│              [Run Tests]                │
└─────────────────────────────────────────┘
```

#### 7. Test Execution Update

**Modify `POST /api/test`**:

```typescript
// Request body
{
  agentId: string;      // Agent UUID
  projectId?: string;   // Optional project context
  apiKey: string;       // User's API key
  environment: string;  // Target environment
}

// Backend changes:
// 1. Use provided API key instead of env var
// 2. Resolve agent path dynamically
// 3. Execute TDX commands with user context
```

#### 8. Data Flow Diagram

```
Authentication Flow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User enters │────▶│ Validate    │────▶│ Store in    │
│ API key     │     │ with API    │     │ session     │
└─────────────┘     └─────────────┘     └─────────────┘

Project Discovery:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Fetch       │────▶│ TDX CLI or  │────▶│ Display     │
│ projects    │     │ LLM API     │     │ in dropdown │
└─────────────┘     └─────────────┘     └─────────────┘

Test Execution:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Run test    │────▶│ Pass API    │────▶│ Execute     │
│ with agent  │     │ key to      │     │ TDX test    │
└─────────────┘     │ backend     │     └─────────────┘
                    └─────────────┘
```

---

## Implementation Checklist

### D2: LLM Judge Results Display

- [ ] Define `LlmJudgeResult` TypeScript interface
- [ ] Update database schema (add column or use traces)
- [ ] Enhance TDX parser to extract judge data
- [ ] Update `GET /api/evaluations/[id]` response
- [ ] Create `LlmJudgeResults.tsx` component
- [ ] Integrate component into `ConversationView.tsx`
- [ ] Add loading and error states
- [ ] Test with various judge result formats

### D3: Click-to-View LLM Results

- [ ] Add visibility state to `EvaluationContext`
- [ ] Implement collapsed/expanded views
- [ ] Add reveal button with appropriate UX
- [ ] Reset visibility on test case navigation
- [ ] Add keyboard shortcut (L key)
- [ ] Optional: Add analytics tracking

### D6: Dynamic API Key/Project Selection

- [ ] Create `ApiKeyInput.tsx` component
- [ ] Create `AuthContext.tsx` for state management
- [ ] Define environment configuration
- [ ] Create `POST /api/projects` endpoint
- [ ] Update `GET /api/agents` for dynamic keys
- [ ] Modify `AgentSelector.tsx` flow
- [ ] Update `POST /api/test` for dynamic execution
- [ ] Implement session storage for key persistence
- [ ] Add connection status indicator
- [ ] Test with multiple environments

---

## Testing Strategy

### Unit Tests
- Parser functions for LLM judge data extraction
- State management for visibility toggle
- API key validation logic

### Integration Tests
- Full flow: API key → project discovery → agent selection → test execution
- LLM judge data persistence and retrieval
- Click-to-reveal state management across navigation

### Manual Testing
- Various TDX test output formats
- Multiple environment connections
- Edge cases: invalid API keys, network errors, empty results

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TDX output format changes | Version detection, fallback parsing |
| API key security exposure | Session storage, no logging, masking |
| LLM API rate limits | Request throttling, caching |
| Evaluator agent unavailability | Graceful degradation, manual-only mode |

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| TDX CLI installed | Agent listing, test execution | Required |
| LLM API access | Evaluator agent calls (D2 Option B) | Optional |
| Evaluator agent ID | `019ae82f-b843-79f5-95c6-c7968262b2c2` | From agent-eval-new |

---

## References

- TDX Agent Commands: https://tdx.treasuredata.com/commands/agent.html
- agent-eval-new evaluator: `/evaluator_lib/evaluation/criteria.py`
- agent-eval-new API client: `/evaluator_lib/api/client.py`
- agent-eval-new models: `/evaluator_lib/models.py`

---

*Document Version: 1.0*
*Created: 2026-02-10*
*Author: gwtd1*
*Status: Technical Specification*
