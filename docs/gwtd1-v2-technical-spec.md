# Technical Implementation Specification: gwtd1 V2 Features

## Document Overview

This technical specification provides detailed implementation guidance for the V2 features assigned to gwtd1:

**Core Features:**
- **D2**: LLM as a Judge Results in Evaluation UI Frame
- **D3**: Make LLM as a Judge Results Click-to-View
- **D6**: Query TDX Project Name/Agent After User Provides API Key

**New Features (added 2026-02-11):**
- **D18**: Change Rating to Pass/Fail with Thumbs Up/Down Buttons
- **D19**: Display Complete Agent Response in Evaluation
- **D20**: Show TDX Execution Logs During Test Runs
- **D21**: Fix Evaluation Results Storage and Display (Bug)

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

#### Option A: Use TDX Agent Test Output (Parser-Based)
Parse existing `tdx agent test` output which already includes pass/fail verdicts from the built-in judge.
- **Reasoning Quality**: Basic (e.g., "The agent's response contains 'True'...")

#### Option B: Call Evaluator Agent Directly (Rich Evaluation) ✅ SELECTED
Call the LLM API with a dedicated evaluator agent to get detailed reasoning, following agent-eval-new patterns.
- **Reasoning Quality**: Rich (e.g., "The agent explicitly responded with 'True' and provided accurate historical details...")
- **Evaluator Agent ID**: `019ae82f-b843-79f5-95c6-c7968262b2c2` (from agent-eval-new)

**Implementation: Option B - Evaluator Agent Direct Call**

| Aspect | Option A (TDX CLI Output) | Option B (Evaluator Agent) ✅ |
|--------|---------------------------|------------------------------|
| Data Source | Parse `tdx agent test` CLI output | Call LLM API with dedicated evaluator agent |
| Reasoning Quality | Basic | Rich, contextual analysis |
| Implementation | Parser-based extraction | API client + evaluator agent integration |
| Reference | TDX CLI built-in judge | agent-eval-new evaluator |

---

### Implementation Details

#### 1. Data Model Updates

**New TypeScript Interface** (`src/lib/llm/types.ts`):

The data model is simplified to match the 6 required UI output fields:

```typescript
interface LlmJudgeResult {
  // Core evaluation output
  verdict: 'pass' | 'fail';
  reasoning: string;           // Rich evaluation text from evaluator agent

  // Conversation context
  conversationUrl: string;     // Chat link for click-to-view

  // Test identification
  testNumber: number;          // Current test index (1-based)
  totalTests: number;          // Total tests in run
  testName: string;            // Test case name from test.yml
  prompt: string;              // Test case prompt/user input

  // Metadata
  evaluatedAt: string;         // ISO timestamp
  evaluatorAgentId?: string;   // Agent ID used for evaluation
}
```

**Required UI Output Fields:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `verdict` | `'pass' \| 'fail'` | Pass/fail status | `'pass'` |
| `reasoning` | `string` | Rich evaluation text | `"✓ PASS: The agent explicitly responded with 'True' and provided accurate historical details..."` |
| `conversationUrl` | `string` | Link to chat conversation | `"https://console-next.us01.treasuredata.com/app/af/..."` |
| `testNumber` / `totalTests` | `number` | Position indicator | `1` / `5` → "1/5" |
| `testName` | `string` | Name of the test case | `"Check factual statement accuracy"` |
| `prompt` | `string` | Test case prompt/user input | `"Is it true that the company was founded in 1998?"` |

#### 2. Database Schema Update

**Migration for test_cases table**:
```sql
-- Add dedicated column for LLM judge result
ALTER TABLE test_cases ADD COLUMN llm_judge_result TEXT;
```

**JSON Structure in Database** (matches `LlmJudgeResult` interface):
```json
{
  "verdict": "pass",
  "reasoning": "✓ PASS: The agent explicitly responded with 'True' and provided accurate historical details about the founding of the organization, correctly identifying the establishment date and key founders.",
  "conversationUrl": "https://console-next.us01.treasuredata.com/app/af/chats/019ae82f-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "testNumber": 1,
  "totalTests": 5,
  "testName": "Check factual statement accuracy",
  "prompt": "Is it true that the company was founded in 1998?",
  "evaluatedAt": "2026-02-10T15:30:00Z",
  "evaluatorAgentId": "019ae82f-b843-79f5-95c6-c7968262b2c2"
}
```

#### 3. API Integration (Option B - Evaluator Agent)

**Evaluator Agent Configuration:**
- **Agent ID**: `019ae82f-b843-79f5-95c6-c7968262b2c2`
- **Source**: agent-eval-new project

**API Endpoints (LLM API):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chats` | POST | Create new chat session with evaluator agent |
| `/api/chats/{id}/continue` | POST | Send evaluation prompt with conversation history |
| `/api/chats/{id}/history` | GET | Retrieve evaluation response |

**New File: `src/lib/llm/evaluator.ts`**
```typescript
const EVALUATOR_AGENT_ID = '019ae82f-b843-79f5-95c6-c7968262b2c2';

interface EvaluatorInput {
  conversationHistory: string;  // Formatted agent chat history
  criteria: string;             // Evaluation criteria from test.yml
  testName: string;             // Test case name
}

interface EvaluatorOutput {
  verdict: 'pass' | 'fail';
  reasoning: string;            // Rich evaluation text
}

async function evaluateWithLlm(
  input: EvaluatorInput,
  apiKey: string,
  environment: string
): Promise<EvaluatorOutput> {
  // 1. Create chat with evaluator agent
  const chatSession = await createChat(EVALUATOR_AGENT_ID, apiKey, environment);

  // 2. Send formatted prompt with conversation + criteria
  const prompt = formatEvaluationPrompt(input);
  await continueChat(chatSession.id, prompt, apiKey, environment);

  // 3. Retrieve and parse JSON response
  const history = await getChatHistory(chatSession.id, apiKey, environment);
  const lastMessage = history.messages[history.messages.length - 1];

  // 4. Return structured result
  return parseEvaluatorResponse(lastMessage.content);
}
```

#### 4. Evaluator Prompt Template

**File: `src/lib/llm/prompts.ts`** (adapted from agent-eval-new):

```
<conversation_history>
{formatted_agent_conversation}
</conversation_history>

<test_name>
{test_name}
</test_name>

<criteria>
{evaluation_criteria}
</criteria>

Evaluate the agent's response against the criteria above.

Provide your assessment in the following JSON format:
{
  "verdict": "pass" or "fail",
  "reasoning": "Detailed explanation of why the response passes or fails the criteria. Include specific evidence from the conversation."
}
```

**Example Output:**
```json
{
  "verdict": "pass",
  "reasoning": "✓ PASS: The agent explicitly responded with 'True' and provided accurate historical details about the founding of the organization, correctly identifying the establishment date as 1998 and the key founders as Dr. Smith and Dr. Johnson."
}
```

#### 5. API Route Updates

**Modify `GET /api/evaluations/[id]`** (`src/app/api/evaluations/[id]/route.ts`):

```typescript
// Enhanced response with LlmJudgeResult
{
  evaluation: { id, rating, notes, ... },
  testCase: { prompt, agentResponse, groundTruth, ... },
  llmJudgeResult: {
    verdict: 'pass',
    reasoning: '✓ PASS: The agent explicitly responded...',
    conversationUrl: 'https://console-next.us01.treasuredata.com/app/af/...',
    testNumber: 1,
    totalTests: 5,
    testName: 'Check factual statement accuracy',
    evaluatedAt: '2026-02-10T15:30:00Z',
    evaluatorAgentId: '019ae82f-b843-79f5-95c6-c7968262b2c2'
  }
}
```

**Modify `POST /api/test/route.ts`** - Integrate evaluator call after agent test:
- After running `tdx agent test`, call evaluator agent for each test case
- Store both agent response and LLM judge result

#### 6. UI Component Implementation

**New component: `src/components/panels/LlmJudgeResults.tsx`**

```typescript
interface LlmJudgeResultsProps {
  result: LlmJudgeResult | null;
  isLoading?: boolean;
}
```

**UI Wireframe** (matching required output fields):

```
┌─────────────────────────────────────────────────────┐
│ 🤖 LLM Evaluation                    Test 1/5      │
├─────────────────────────────────────────────────────┤
│ Test Name: Check factual statement accuracy         │
├─────────────────────────────────────────────────────┤
│ Prompt:                                             │
│ "Is it true that the company was founded in 1998?" │
├─────────────────────────────────────────────────────┤
│ Verdict: ✓ PASS                                     │
├─────────────────────────────────────────────────────┤
│ Reasoning:                                          │
│ The agent explicitly responded with "True" and      │
│ provided accurate historical details about the      │
│ founding of the organization, correctly identifying │
│ the establishment date and key founders...          │
├─────────────────────────────────────────────────────┤
│ 🔗 View Conversation                                │
└─────────────────────────────────────────────────────┘
```

**Component Structure:**

```typescript
function LlmJudgeResults({ result, isLoading }: LlmJudgeResultsProps) {
  if (isLoading) return <LoadingSpinner />;
  if (!result) return <EmptyState message="No LLM evaluation available" />;

  return (
    <div className="llm-judge-panel">
      {/* Header with test number */}
      <Header>
        <span>🤖 LLM Evaluation</span>
        <span>Test {result.testNumber}/{result.totalTests}</span>
      </Header>

      {/* Test name */}
      <Section label="Test Name">{result.testName}</Section>

      {/* Test prompt */}
      <Section label="Prompt">{result.prompt}</Section>

      {/* Verdict badge */}
      <Section label="Verdict">
        <VerdictBadge verdict={result.verdict} />
      </Section>

      {/* Rich reasoning text */}
      <Section label="Reasoning">
        <ReasoningText>{result.reasoning}</ReasoningText>
      </Section>

      {/* Clickable conversation link */}
      <ConversationLink href={result.conversationUrl} />
    </div>
  );
}
```

**Integration in ConversationView.tsx**:

```typescript
// New layout order:
// 1. Prompt section
// 2. Agent Response section
// 3. LLM Judge Results section (NEW)
// 4. Ground Truth section
```

#### 7. Data Flow Diagram

**Test Execution Flow (Option B):**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ POST /test   │────▶│ TDX agent    │────▶│ Get agent    │
│ (run tests)  │     │ test         │     │ response     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┘
                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Create chat  │────▶│ Send eval    │────▶│ Parse JSON   │
│ with         │     │ prompt +     │     │ response     │
│ evaluator    │     │ history      │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┘
                     ▼
┌──────────────┐     ┌──────────────┐
│ Store in     │────▶│ Return to    │
│ test_cases   │     │ UI           │
│ table        │     │              │
└──────────────┘     └──────────────┘
```

**UI Display Flow:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ GET         │────▶│ Query DB    │────▶│ Return with │
│ /evaluation │     │ (includes   │     │ llmJudge    │
│             │     │ llm_judge)  │     │ result      │
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

## Feature D18: Change Rating to Pass/Fail with Thumbs Up/Down Buttons

### Objective
Replace numeric/star rating system with binary Pass/Fail evaluation using intuitive thumbs up/down icons for manual evaluations.

### Technical Approach

Refactor the rating component to use a binary Pass/Fail system with thumbs up/down buttons instead of the current rating approach.

---

### Implementation Details

#### 1. Data Model Updates

**Update Rating Type** (`src/lib/types/index.ts`):

```typescript
// Current (to be replaced)
rating: number | null;  // e.g., 1-5 scale

// New
rating: 'pass' | 'fail' | null;  // Binary rating
```

**Database Migration**:
```sql
-- Convert existing numeric ratings to pass/fail
-- Assuming positive ratings (e.g., >= 3) = pass, else fail
UPDATE evaluations
SET rating = CASE
  WHEN rating >= 3 THEN 'pass'
  WHEN rating IS NOT NULL THEN 'fail'
  ELSE NULL
END;
```

#### 2. UI Component Updates

**Update Rating Component** (`src/components/RatingButtons.tsx` or equivalent):

```typescript
interface RatingButtonsProps {
  value: 'pass' | 'fail' | null;
  onChange: (rating: 'pass' | 'fail') => void;
  disabled?: boolean;
}

function RatingButtons({ value, onChange, disabled }: RatingButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onChange('pass')}
        className={`rating-btn ${value === 'pass' ? 'active-pass' : ''}`}
        disabled={disabled}
        aria-label="Pass"
      >
        <ThumbsUpIcon className={value === 'pass' ? 'text-green-500' : 'text-gray-400'} />
        <span>Pass</span>
      </button>
      <button
        onClick={() => onChange('fail')}
        className={`rating-btn ${value === 'fail' ? 'active-fail' : ''}`}
        disabled={disabled}
        aria-label="Fail"
      >
        <ThumbsDownIcon className={value === 'fail' ? 'text-red-500' : 'text-gray-400'} />
        <span>Fail</span>
      </button>
    </div>
  );
}
```

**UI Wireframe**:
```
┌─────────────────────────────────────┐
│ Manual Evaluation                   │
├─────────────────────────────────────┤
│                                     │
│   [ 👍 Pass ]      [ 👎 Fail ]      │
│                                     │
│ Notes: [________________________]   │
│        [________________________]   │
│                                     │
└─────────────────────────────────────┘
```

#### 3. Keyboard Shortcuts

**Update keyboard shortcuts**:
- Keep `T` for Pass (True/Thumbs up)
- Keep `F` for Fail (False/Thumbs down)

#### 4. API Updates

**Update `PUT /api/evaluations/[id]`**:
```typescript
// Request body
{
  rating: 'pass' | 'fail';
  notes?: string;
}

// Validation
if (!['pass', 'fail'].includes(rating)) {
  return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
}
```

### Key Files to Modify
- `src/lib/types/index.ts` - Update rating type definition
- `src/components/panels/RatingPanel.tsx` or equivalent - Replace rating UI
- `src/app/api/evaluations/[id]/route.ts` - Update validation
- `src/lib/db/schema.ts` - Migration for rating column

### Acceptance Criteria
- Rating displays as thumbs up (Pass) and thumbs down (Fail) buttons
- Visual feedback when a rating is selected (green for pass, red for fail)
- Keyboard shortcuts T/F continue to work
- Existing evaluations are migrated to new format

---

## Feature D19: Display Complete Agent Response in Evaluation

### Objective
Ensure the agent response section returns and displays the complete response from the agent without truncation.

### Technical Approach

Investigate and fix any truncation occurring in the data flow from TDX execution through storage to UI rendering.

---

### Implementation Details

#### 1. Data Flow Analysis

**Potential Truncation Points:**
1. TDX CLI output capture (child_process buffer limits)
2. Database column size limits
3. API response size limits
4. Frontend rendering truncation

#### 2. TDX Executor Updates

**Check `src/lib/tdx/executor.ts`**:

```typescript
// Current: May have buffer limits
const { stdout, stderr } = await execAsync(command);

// Fix: Increase buffer size and capture full output
const { stdout, stderr } = await execAsync(command, {
  maxBuffer: 1024 * 1024 * 10, // 10MB buffer
  encoding: 'utf8',
});
```

#### 3. Database Schema Verification

**Verify `test_cases.agent_response` column**:
```sql
-- Ensure TEXT type (not VARCHAR with limit)
-- SQLite TEXT can store up to 2^31-1 bytes
ALTER TABLE test_cases MODIFY agent_response TEXT;
```

#### 4. API Response Handling

**Update response serialization**:
```typescript
// Ensure no truncation in JSON response
return NextResponse.json({
  testCase: {
    ...testCase,
    agentResponse: testCase.agent_response, // Full content
  }
});
```

#### 5. Frontend Display

**Update `ConversationView.tsx`**:
```typescript
// Current: May truncate long content
<div className="agent-response">{agentResponse}</div>

// Fix: Allow scrollable full content
<div className="agent-response overflow-auto max-h-96">
  <pre className="whitespace-pre-wrap">{agentResponse}</pre>
</div>
```

### Key Files to Modify
- `src/lib/tdx/executor.ts` - Increase buffer limits
- `src/lib/db/schema.ts` - Verify column types
- `src/app/api/evaluations/[id]/route.ts` - Ensure full response returned
- `src/components/panels/ConversationView.tsx` - Display full content with scroll

### Acceptance Criteria
- Full agent response is captured during test execution
- Complete response is stored in database
- API returns complete response without truncation
- UI displays full response with appropriate scrolling

---

## Feature D20: Show TDX Execution Logs During Test Runs

### Objective
Stream TDX CLI execution logs to the UI when users run tests, providing feedback during agent execution.

### Technical Approach

Implement real-time log streaming from TDX CLI execution to the frontend using Server-Sent Events (SSE) or WebSocket.

---

### Implementation Details

#### 1. Server-Sent Events Endpoint

**New endpoint: `GET /api/test/stream`**:

```typescript
// src/app/api/test/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (message: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: message })}\n\n`));
      };

      // Execute TDX with streaming output
      const process = spawn('tdx', ['agent', 'test', agentPath]);

      process.stdout.on('data', (data) => {
        sendLog(data.toString());
      });

      process.stderr.on('data', (data) => {
        sendLog(`[ERROR] ${data.toString()}`);
      });

      process.on('close', (code) => {
        sendLog(`[COMPLETE] Exit code: ${code}`);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### 2. Frontend Log Display Component

**New component: `src/components/TestRunLogs.tsx`**:

```typescript
interface TestRunLogsProps {
  isRunning: boolean;
  testRunId: string | null;
}

function TestRunLogs({ isRunning, testRunId }: TestRunLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning || !testRunId) return;

    const eventSource = new EventSource(`/api/test/stream?runId=${testRunId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev, data.log]);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [isRunning, testRunId]);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="test-logs bg-gray-900 text-green-400 font-mono text-sm p-4 rounded max-h-64 overflow-auto">
      {logs.map((log, i) => (
        <div key={i} className="log-line">{log}</div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}
```

**UI Wireframe**:
```
┌─────────────────────────────────────────────────────┐
│ Test Execution Logs                          [Hide] │
├─────────────────────────────────────────────────────┤
│ [TDX] Executing: tdx use llm_project "project"      │
│ [TDX] Running agent test: agents/project/agent      │
│ Round 1/5: Sending user input...                    │
│ Round 1/5: Received response (245 tokens)           │
│ Round 2/5: Sending user input...                    │
│ ▌                                                   │
└─────────────────────────────────────────────────────┘
```

#### 3. Integration with Test Execution

**Update `POST /api/test`**:
```typescript
// Return stream URL for client to connect
return NextResponse.json({
  testRunId: newRunId,
  streamUrl: `/api/test/stream?runId=${newRunId}`,
  status: 'started'
});
```

### Key Files to Modify
- New: `src/app/api/test/stream/route.ts` - SSE endpoint
- `src/app/api/test/route.ts` - Return stream info
- New: `src/components/TestRunLogs.tsx` - Log display component
- `src/app/page.tsx` or test runner UI - Integrate log component

### Acceptance Criteria
- User sees real-time TDX execution logs when clicking "Run Test"
- Logs show TDX commands being executed
- Logs show progress (e.g., "Round 1/5: Sending user input...")
- Logs auto-scroll as new content arrives
- User can hide/show log panel

---

## Feature D21: Fix Evaluation Results Storage and Display (Bug)

### Objective
Investigate and fix the bug where evaluation results show repeated "Round 1/1: Sending user input..." messages but data is not stored or displayed correctly.

### Technical Approach

Debug the data flow from TDX execution through storage to UI rendering to identify where results are being lost.

---

### Implementation Details

#### 1. Symptoms Analysis

**Observed Behavior:**
- UI shows repeated "Round 1/1: Sending user input..." messages
- Results appear to run but don't persist
- Evaluation data not displaying in UI

**Potential Root Causes:**
1. TDX output parsing failure
2. Database write failure
3. API response formatting error
4. Frontend state not updating

#### 2. Debugging Steps

**Step 1: Add Logging to TDX Executor**
```typescript
// src/lib/tdx/executor.ts
export async function runAgentTest(agentPath: string) {
  console.log('[DEBUG] Starting agent test:', agentPath);

  const { stdout, stderr } = await execAsync(command);
  console.log('[DEBUG] TDX stdout:', stdout);
  console.log('[DEBUG] TDX stderr:', stderr);

  const parsed = parseTdxOutput(stdout);
  console.log('[DEBUG] Parsed results:', JSON.stringify(parsed, null, 2));

  return parsed;
}
```

**Step 2: Verify Database Writes**
```typescript
// src/app/api/test/route.ts
const result = await db.run(
  'INSERT INTO test_cases (test_run_id, prompt, agent_response, ...) VALUES (?, ?, ?, ...)',
  [testRunId, prompt, agentResponse, ...]
);
console.log('[DEBUG] DB insert result:', result);

// Verify with immediate read
const verification = await db.get('SELECT * FROM test_cases WHERE id = ?', [result.lastID]);
console.log('[DEBUG] Verification read:', verification);
```

**Step 3: Check API Response**
```typescript
// src/app/api/evaluations/[id]/route.ts
console.log('[DEBUG] Returning evaluation:', JSON.stringify(response, null, 2));
return NextResponse.json(response);
```

**Step 4: Frontend State Debugging**
```typescript
// src/context/EvaluationContext.tsx
useEffect(() => {
  console.log('[DEBUG] Evaluations state updated:', evaluations);
}, [evaluations]);
```

#### 3. Common Fixes

**Parser Not Handling Output Format:**
```typescript
// src/lib/tdx/parser.ts
export function parseTdxOutput(output: string): TestResult[] {
  // Handle edge cases
  if (!output || output.trim() === '') {
    console.warn('[WARN] Empty TDX output');
    return [];
  }

  // Check for known patterns
  const lines = output.split('\n');
  // ... parsing logic
}
```

**Async/Await Issues:**
```typescript
// Ensure all database operations complete
await Promise.all(
  testCases.map(tc =>
    db.run('INSERT INTO test_cases ...', [...])
  )
);
```

**State Update After Mutation:**
```typescript
// Force refresh after test completion
const runTest = async () => {
  await api.runTest(agentId);
  await fetchEvaluations(); // Refresh state
};
```

### Key Files to Investigate
- `src/lib/tdx/executor.ts` - TDX command execution
- `src/lib/tdx/parser.ts` - Output parsing
- `src/app/api/test/route.ts` - Test execution endpoint
- `src/lib/db/operations.ts` - Database operations
- `src/context/EvaluationContext.tsx` - Frontend state

### Debugging Checklist
- [ ] Add console logging at each step of data flow
- [ ] Verify TDX CLI returns expected output format
- [ ] Confirm database writes succeed with verification reads
- [ ] Check API responses contain expected data
- [ ] Verify frontend state updates after API calls
- [ ] Test with simple/known-good agent to isolate issue

### Acceptance Criteria
- Evaluation results are stored correctly in database
- Results display properly in evaluation UI
- No repeated/duplicate log messages
- Data persists after test completion

---

## Implementation Checklist

### D21: Fix Evaluation Results Storage and Display (Bug) - PRIORITY

- [ ] Add debugging logs throughout data flow
- [ ] Identify root cause of storage/display failure
- [ ] Implement fix
- [ ] Verify with end-to-end test
- [ ] Remove debug logging (or convert to proper logging)

### D18: Pass/Fail Rating with Thumbs Up/Down

- [ ] Update rating type definition in `src/lib/types/index.ts`
- [ ] Create/update rating buttons component with thumbs icons
- [ ] Update API validation for pass/fail values
- [ ] Create database migration for existing ratings
- [ ] Update keyboard shortcuts documentation
- [ ] Test rating submission and persistence

### D19: Complete Agent Response Display

- [ ] Increase TDX executor buffer size
- [ ] Verify database column allows full text storage
- [ ] Ensure API returns complete response
- [ ] Update UI to display full content with scroll
- [ ] Test with large agent responses

### D20: TDX Execution Logs Display

- [ ] Create SSE streaming endpoint `/api/test/stream`
- [ ] Modify TDX executor to stream output
- [ ] Create `TestRunLogs.tsx` component
- [ ] Integrate log display into test runner UI
- [ ] Add hide/show toggle for log panel
- [ ] Test real-time streaming behavior

### D2: LLM Judge Results Display (Option B - Evaluator Agent)

- [ ] Create `src/lib/llm/types.ts` - Define `LlmJudgeResult` interface with 6 required fields:
  - verdict (pass/fail)
  - reasoning (rich text)
  - conversationUrl (clickable link)
  - testNumber/totalTests (position indicator)
  - testName
  - prompt (test case prompt/user input)
- [ ] Create `src/lib/llm/evaluator.ts` - LLM API client for evaluator agent
  - Implement `createChat()` with evaluator agent ID `019ae82f-b843-79f5-95c6-c7968262b2c2`
  - Implement `continueChat()` to send evaluation prompt
  - Implement `getChatHistory()` to retrieve response
  - Implement `parseEvaluatorResponse()` for JSON extraction
- [ ] Create `src/lib/llm/prompts.ts` - Evaluation prompt templates
- [ ] Update `POST /api/test/route.ts` - Integrate evaluator call after agent test
- [ ] Update database schema - Add `llm_judge_result` column to `test_cases` table
- [ ] Update `GET /api/evaluations/[id]` - Include LLM judge result in response
- [ ] Create/Update `src/components/panels/LlmJudgeResults.tsx` with new layout:
  - Test number header (n/total)
  - Test name display
  - Prompt display (test case prompt/user input)
  - Verdict badge (pass/fail with icon)
  - Rich reasoning text block
  - Clickable conversation URL link
- [ ] Integrate component into `ConversationView.tsx`
- [ ] Add loading state during evaluation
- [ ] Handle error states gracefully

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
| LLM API access | Evaluator agent calls (D2 Option B) | **Required** |
| Evaluator agent ID | `019ae82f-b843-79f5-95c6-c7968262b2c2` | From agent-eval-new |

**D2 Option B Requirements:**
- Valid API key with access to LLM API endpoints
- Access to evaluator agent (ID: `019ae82f-b843-79f5-95c6-c7968262b2c2`)
- Network access to LLM API (environment-specific URLs)

---

## References

- TDX Agent Commands: https://tdx.treasuredata.com/commands/agent.html
- agent-eval-new evaluator: `/evaluator_lib/evaluation/criteria.py`
- agent-eval-new API client: `/evaluator_lib/api/client.py`
- agent-eval-new models: `/evaluator_lib/models.py`

---

*Document Version: 1.2*
*Created: 2026-02-10*
*Updated: 2026-02-11*
*Author: gwtd1*
*Status: Technical Specification*
*D2 Implementation: Option B (Evaluator Agent Direct Call) - Selected*
*Changes: Added D18, D19, D20, D21 technical specifications*
