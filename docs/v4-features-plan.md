# Agent Eval Tool V4 - Features Planning Document

This document captures ideation, research, and implementation details for future V4 features of the Agent Evaluation Tool.

## Overview

The Agent Eval Tool V4 will enhance user experience through improved performance, better UX for trace viewing, enhanced test case management, streamlined API key configuration, and system transparency features.

---

## Feature #1: API vs TDX CLI Performance Optimization

**Status:** Research Complete ✅
**Priority:** High
**Estimated Impact:** 3-5x performance improvement

### Problem Statement

Currently, the app uses TDX CLI subprocess execution to discover projects and agents for user selection. This approach has performance limitations and reliability concerns due to subprocess overhead and text parsing.

### Research Findings

#### Current Implementation Analysis
- **Process:** Landing page → `/api/agents` → `tdx agent list --format json` → Parse output → Group by project
- **Performance:** ~500-1500ms per request
- **Limitations:**
  - Subprocess spawn overhead
  - Text parsing complexity
  - Project grouping inferred from file paths
  - No real-time updates capability

#### Available TD LLM API Endpoints
```typescript
// Project listing
GET https://llm-api.us01.treasuredata.com/api/projects
Headers: {
  'Authorization': 'TD1 {TD_API_KEY}',
  'Content-Type': 'application/vnd.api+json'
}

// Agent listing
GET https://llm-api.us01.treasuredata.com/api/agents
Optional: ?filter[projectId]={project_id}
```

#### Performance Comparison
| Approach | Latency | Process |
|----------|---------|---------|
| **TDX CLI (Current)** | ~500-1500ms | Subprocess → CLI → API → Parse → Group |
| **Direct API (Proposed)** | ~100-300ms | Parallel HTTP → Native JSON → Group |

**Performance Improvement: 3-5x faster**

### Implementation Plan

#### Phase 1: API Integration
```typescript
// src/app/api/agents/route.ts - New implementation
export async function GET() {
  const baseUrl = process.env.TD_LLM_BASE_URL || 'https://llm-api.us01.treasuredata.com';

  // Parallel API calls for optimal performance
  const [projectsResp, agentsResp] = await Promise.all([
    fetch(`${baseUrl}/api/projects`, {
      headers: {
        'Authorization': `TD1 ${process.env.TD_API_KEY}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }),
    fetch(`${baseUrl}/api/agents`, {
      headers: {
        'Authorization': `TD1 ${process.env.TD_API_KEY}`,
        'Content-Type': 'application/vnd.api+json'
      }
    })
  ]);

  const projects = await projectsResp.json();
  const agents = await agentsResp.json();

  // Group agents by actual project relationships (not path inference)
  const agentsByProject = groupAgentsByProject(projects.data, agents.data);

  return NextResponse.json({
    agents: agents.data,
    projects: projects.data,
    byProject: agentsByProject
  });
}
```

#### Phase 2: Data Relationship Improvements
- Use proper `project_id` relationships instead of path-based inference
- Implement real project metadata display
- Add project descriptions and additional context

#### Phase 3: Error Handling Enhancement
```typescript
// Replace TDX CLI exit codes with HTTP status handling
if (!projectsResp.ok) {
  throw new Error(`Projects API failed: ${projectsResp.status} ${projectsResp.statusText}`);
}

// Better error messages for API failures
catch (error) {
  console.error('[API] Failed to fetch projects/agents:', error);
  // Fallback to TDX CLI if API fails
  return fallbackToTdxCli();
}
```

#### Phase 4: Migration Strategy
1. **Feature Flag Implementation**: Add `USE_DIRECT_API` environment variable
2. **A/B Testing**: Compare performance between API and CLI approaches
3. **Gradual Migration**: Default to API, keep TDX CLI as fallback
4. **Performance Monitoring**: Validate 3-5x improvement claims
5. **Complete Migration**: Remove TDX CLI dependency for agent listing

### Benefits

#### Performance Benefits
- **3-5x faster response times** - Direct HTTP vs subprocess execution
- **Parallel execution** - Fetch projects and agents simultaneously
- **No subprocess overhead** - Eliminates spawn/exec latency
- **Better caching potential** - HTTP responses can be cached in memory
- **Real-time data access** - No CLI output parsing delays

#### User Experience Benefits
- **Faster UI responsiveness** - Agent dropdown populates quicker
- **Better project grouping** - Uses actual project metadata vs path inference
- **Improved reliability** - Native HTTP error handling vs CLI stderr parsing
- **Live updates potential** - Future server-sent events support

#### Developer Experience Benefits
- **Better error handling** - HTTP status codes vs parsing CLI stderr
- **Type safety** - Direct JSON schema vs text parsing
- **Easier debugging** - Network tab inspection vs subprocess logging
- **Reduced complexity** - Remove CLI subprocess management code

### Implementation Files

```
src/app/api/agents/route.ts           - Replace TDX CLI with direct API calls
src/lib/api/llm-client.ts            - New TD LLM API client module
src/components/agent/AgentSelector.tsx - Update to handle new data structure
src/lib/tdx/executor.ts              - Keep as fallback for other operations
```

### Environment Configuration

```bash
# .env.local - Updated configuration
TD_API_KEY=1/your_api_key_here
TD_LLM_BASE_URL=https://llm-api.us01.treasuredata.com  # Production
# TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com  # Development
USE_DIRECT_API=true  # Feature flag for migration
```

### Risk Mitigation

- **Maintain TDX CLI fallback** for edge cases and compatibility
- **Comprehensive error handling** for API authentication and network failures
- **Performance monitoring** to validate improvement claims
- **Gradual rollout** with feature flag to enable safe testing
- **Rollback plan** if API approach encounters issues

### Success Metrics

- **Latency reduction:** Target 3-5x improvement (500-1500ms → 100-300ms)
- **Error rate reduction:** Better error handling should reduce failed requests
- **User satisfaction:** Faster agent dropdown population
- **Developer velocity:** Simplified debugging and maintenance

### Next Steps

1. Create new TD LLM API client module
2. Implement feature flag in environment configuration
3. Build parallel API calling logic
4. Add comprehensive error handling
5. Implement A/B testing framework
6. Monitor performance improvements
7. Plan migration timeline

---

## Feature #2: Expandable Trace UI with Improved UX

**Status:** Research Complete ✅
**Priority:** Medium
**Estimated Impact:** Enhanced user experience for debugging and trace analysis

### Problem Statement

Currently, the trace visualization shows an SVG flowchart with truncated text and no drill-down capabilities. Users cannot see full tool call arguments, complete responses, or detailed execution context, limiting their ability to understand agent behavior and debug issues.

### Current Implementation Analysis

#### Trace Data Structure
```typescript
interface ChatHistoryEntry {
  input?: string;           // User message
  content?: string;         // Agent response
  tool?: ToolCallInfo;      // Tool call details
  at: string;              // ISO timestamp
}

interface ToolCallInfo {
  id?: string;
  functionName: string;
  functionArguments: string;  // JSON as string
  content: string;            // Tool result
  status: string;             // "OK" or error
  targetFunction?: string;    // e.g., "READ_TEXT"
  toolTarget?: {
    id?: string;
    type: string;            // e.g., "TextKnowledgeBase"
    name: string;
  };
}
```

#### Current UI Components
- **TracesSection.tsx**: Expandable wrapper with count badge
- **TraceFlowDiagram.tsx**: SVG visualization with colored nodes and animated arrows
- **Interactive Features**: Hover effects, node highlighting, legend
- **Current Limitations**:
  - Text truncation (tool results limited to 25 chars)
  - No clickable drill-down
  - No copy-to-clipboard functionality
  - No search/filter within traces

### Proposed UX Enhancements

#### 1. Expandable Trace Cards
Replace truncated SVG nodes with expandable card interface:
```
┌─ Trace Step Card ──────────────────────────────┐
│ [🔽] User Input (Step 1)              ⏱ 12:34 │
├─────────────────────────────────────────────────┤
│ Preview: "What is the capital of France?"       │
│ ⚡ Expand to see full content                    │
└─────────────────────────────────────────────────┘

┌─ Expanded View ────────────────────────────────┐
│ [🔼] User Input (Step 1)              ⏱ 12:34 │
├─────────────────────────────────────────────────┤
│ Full Content:                                   │
│ "What is the capital of France? Please include │
│ population data and historical context."       │
│                                     [📋 Copy]  │
└─────────────────────────────────────────────────┘
```

#### 2. Tabbed Interface for Complex Steps
For tool calls with multiple data points:
```
┌─ Tool Call: Search Knowledge Base ─────────────┐
│ [Input] [Output] [Metadata] [Timing]           │
├─────────────────────────────────────────────────┤
│ Input Tab:                                      │
│ Function: READ_TEXT                             │
│ Arguments: {                                    │
│   "query": "France capital",                   │
│   "knowledge_base": "geography_kb"             │
│ }                                   [📋 Copy]  │
└─────────────────────────────────────────────────┘
```

#### 3. Timeline View
Show conversation flow with time indicators:
```
12:34:01 ─── User Input
12:34:02 ─┬─ Tool Call: Search KB
12:34:03 ─├─ Tool Result: "Paris..."
12:34:04 ─├─ Tool Call: Get Population
12:34:05 ─├─ Tool Result: "2.1M..."
12:34:06 ─┴─ Agent Response: "Paris is..."
```

#### 4. Search and Filter Interface
```
┌─ Trace Filters ────────────────────────────────┐
│ 🔍 Search: [france        ] [🔍]               │
│ Filter: [All] [User] [Agent] [Tools] [Errors]  │
│ Time:   [All] [Last 5m] [Custom Range]         │
└─────────────────────────────────────────────────┘
```

#### 5. Syntax Highlighting
- **JSON**: Highlight function arguments and tool results
- **Text**: Highlight user queries and agent responses
- **Status**: Color-coded success/error indicators
- **Timestamps**: Relative time display (5s ago, 2m ago)

### Implementation Strategy

#### Phase 1: Expandable Cards
```typescript
// New component: TraceCacheCard.tsx
interface TraceCardProps {
  step: ChatHistoryEntry;
  stepNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}

// Features:
- Collapsible content with preview
- Full content display on expand
- Copy-to-clipboard functionality
- Responsive text wrapping
```

#### Phase 2: Tabbed Tool Call Interface
```typescript
// Enhanced ToolCallDisplay.tsx
interface ToolCallTabsProps {
  toolCall: ToolCallInfo;
  activeTab: 'input' | 'output' | 'metadata' | 'timing';
  onTabChange: (tab: string) => void;
}

// Features:
- Syntax highlighted JSON
- Formatted tool arguments
- Result status indicators
- Performance timing data
```

#### Phase 3: Timeline and Search
```typescript
// New TraceTimeline.tsx component
interface TimelineProps {
  traces: ChatHistoryEntry[];
  searchQuery: string;
  filters: TraceFilter;
}

// Features:
- Chronological visualization
- Search highlighting
- Filter by step type
- Export timeline as JSON/text
```

### Benefits

#### User Experience
- **Better Debugging**: Full visibility into tool call arguments and results
- **Improved Understanding**: Clear step-by-step conversation flow
- **Faster Analysis**: Search and filter specific interactions
- **Enhanced Copying**: Easy copy of prompts, responses, and tool data

#### Developer Benefits
- **Detailed Error Context**: Full error messages and stack traces visible
- **Performance Analysis**: Timing data for each step
- **Tool Call Debugging**: Complete function arguments and responses
- **Export Capabilities**: Copy traces for external analysis

### Technical Implementation Files
```
src/components/traces/TraceCard.tsx           - Expandable card component
src/components/traces/ToolCallTabs.tsx       - Tabbed tool call interface
src/components/traces/TraceTimeline.tsx      - Timeline visualization
src/components/traces/TraceSearch.tsx        - Search and filter interface
src/hooks/useTraceExpansion.tsx              - State management for expanded cards
src/utils/traceFormatters.ts                 - Syntax highlighting utilities
```

### Success Metrics
- **User Engagement**: Increased trace section usage
- **Support Efficiency**: Reduced debugging time for failed tests
- **User Satisfaction**: Better understanding of agent behavior
- **Feature Adoption**: Copy-to-clipboard and export usage

---

## Feature #3: Multi-Test Case Input Interface

**Status:** Research Complete ✅
**Priority:** Medium
**Estimated Impact:** Improved test coverage and user control over test scenarios

### Problem Statement

Currently, when test.yml doesn't exist, the system either auto-generates test cases via LLM or creates a basic template with one test case. Users have no ability to input multiple custom test cases directly, limiting their control over test scenarios and reducing test coverage for specific use cases.

### Current Implementation Analysis

#### Test.yml Auto-Recovery Flow
```typescript
// Current detection in /src/app/api/test/route.ts
function detectNeedsTestFile(stdout: string, stderr: string): boolean {
  const combined = `${stdout}\n${stderr}`.toLowerCase();
  return (
    combined.includes('no test') ||
    combined.includes('test.yml not found') ||
    combined.includes('missing test') ||
    // ... more patterns
  );
}
```

#### Current Test Case Structure
```yaml
# Required YAML format
tests:
  - name: "Test description"
    user_input: "Actual prompt to send"
    criteria: "Expected behavior/outcome"
```

#### Auto-Generation Logic
1. **LLM-Based Generation** (preferred if API key available):
   - Detects agent type from name/prompt keywords
   - Generates 3-4 relevant test cases
   - Uses predefined templates per agent type (math, language, fact-check, etc.)

2. **Basic Template** (fallback):
   - Creates single generic test case
   - Requires manual editing

### Proposed Multi-Test Case Input Interface

#### 1. Modal Interface Design
```
┌─ Create Test Cases ────────────────────────────────────┐
│ Agent: animals-sounds                                  │
│ Project: TD-Managed Creative Studio                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Test Case 1                           [➖ Remove]      │
│ ┌─ Name ──────────────────────────────────────────────┐│
│ │ Dog sound test                                      ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─ User Input ─────────────────────────────────────────┐│
│ │ Dog                                                  ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─ Expected Criteria ──────────────────────────────────┐│
│ │ Agent responds with dog sound like Woof or Bark     ││
│ └─────────────────────────────────────────────────────┘│
│                                                        │
│ Test Case 2                           [➖ Remove]      │
│ ┌─ Name ──────────────────────────────────────────────┐│
│ │ Cat sound test                                      ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─ User Input ─────────────────────────────────────────┐│
│ │ Cat                                                  ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─ Expected Criteria ──────────────────────────────────┐│
│ │ Agent responds with cat sound like Meow             ││
│ └─────────────────────────────────────────────────────┘│
│                                                        │
│ [➕ Add Test Case]                                     │
│                                                        │
│ ┌─ Preview test.yml ──────────────────────────────────┐│
│ │ tests:                                              ││
│ │   - name: "Dog sound test"                          ││
│ │     user_input: "Dog"                               ││
│ │     criteria: "Agent responds with..."              ││
│ │   - name: "Cat sound test"                          ││
│ │     user_input: "Cat"                               ││
│ │     criteria: "Agent responds with..."              ││
│ └─────────────────────────────────────────────────────┘│
│                                                        │
│              [Cancel] [Create test.yml]                │
└────────────────────────────────────────────────────────┘
```

#### 2. Dynamic Form Management
```typescript
interface TestCaseInput {
  name: string;
  userInput: string;
  criteria: string;
  id: string; // for React key management
}

interface TestCaseFormState {
  testCases: TestCaseInput[];
  agentPath: string;
  isValid: boolean;
  previewYaml: string;
}

// Form Actions
- addTestCase(): Add new empty test case
- removeTestCase(id): Remove specific test case
- updateTestCase(id, field, value): Update field value
- validateForm(): Check required fields
- generatePreview(): Create YAML preview
```

#### 3. Integration with Existing Flow
```typescript
// Modified auto-recovery in /src/app/api/test/route.ts
if (detectNeedsTestFile(result.stdout, result.stderr)) {
  // Check if user wants manual input vs auto-generation
  return NextResponse.json({
    status: 'failed',
    needsTestFile: true,
    showTestCaseInput: true, // NEW: Trigger UI modal
    agentPath,
    error: 'Test file missing - would you like to create test cases?'
  });
}
```

### Advanced Features

#### 1. Test Case Templates
```typescript
// Predefined templates for quick start
const TEST_TEMPLATES = {
  qa: [
    { name: "Basic question", userInput: "What is...?", criteria: "Provides accurate answer" },
    { name: "Complex query", userInput: "Explain the relationship between...", criteria: "Detailed explanation with examples" }
  ],
  sentiment: [
    { name: "Positive text", userInput: "I love this product!", criteria: "Detects positive sentiment" },
    { name: "Negative text", userInput: "This is terrible", criteria: "Detects negative sentiment" }
  ]
  // ... more templates by agent type
};
```

#### 2. Validation and Error Prevention
```typescript
// Real-time validation
interface ValidationState {
  testCases: {
    [id: string]: {
      name: boolean;      // Required, non-empty
      userInput: boolean; // Required, non-empty
      criteria: boolean;  // Optional but recommended
    }
  };
  global: {
    duplicateNames: string[];    // Check for duplicate test names
    minimumTests: boolean;       // At least 1 test required
    validYaml: boolean;          // Generated YAML is valid
  };
}
```

#### 3. Import/Export Capabilities
```typescript
// Import existing test.yml for editing
function importExistingTests(agentPath: string): TestCaseInput[] {
  // Read existing test.yml and convert to form format
}

// Export to different formats
function exportTestCases(testCases: TestCaseInput[], format: 'yaml' | 'json' | 'csv') {
  // Generate downloadable file
}
```

### Implementation Strategy

#### Phase 1: Basic Modal Interface
```typescript
// New component: TestCaseInputModal.tsx
interface Props {
  isOpen: boolean;
  agentPath: string;
  onClose: () => void;
  onSave: (testCases: TestCaseInput[]) => void;
}

// Features:
- Dynamic test case addition/removal
- Form validation
- Real-time YAML preview
- Save to test.yml and retry test
```

#### Phase 2: Enhanced UX
```typescript
// Enhanced features:
- Test case templates by agent type
- Import existing test.yml for editing
- Duplicate test case detection
- Auto-suggest criteria based on user input
- Drag-and-drop reordering
```

#### Phase 3: Advanced Management
```typescript
// Advanced features:
- Test case versioning
- A/B testing different test sets
- Performance benchmarking per test case
- Export/import test suites
- Collaborative test case sharing
```

### Integration Points

#### Modified API Response
```typescript
// Updated TestResponse in /src/lib/types/agent.ts
interface TestResponse {
  testRunId: string;
  status: 'completed' | 'failed' | 'needs_test_input'; // NEW status
  testCaseCount?: number;
  error?: string;
  rawOutput?: string;
  needsTestFile?: boolean;
  showTestCaseInput?: boolean; // NEW: Trigger manual input UI
  autoRecoveryAttempted?: boolean;
  suggestedTestCases?: TestCaseInput[]; // NEW: LLM-generated suggestions
}
```

#### Updated Test Runner Flow
```typescript
// Modified TestRunner.tsx
if (response.showTestCaseInput) {
  setShowTestCaseModal(true);
  setSuggestedTestCases(response.suggestedTestCases || []);
}
```

### Benefits

#### User Benefits
- **Complete Control**: Define exact test scenarios they want
- **Better Coverage**: Create comprehensive test suites
- **Domain Expertise**: Leverage user knowledge of agent behavior
- **Custom Criteria**: Define precise success criteria

#### Development Benefits
- **Reduced LLM Dependency**: Less reliance on auto-generation
- **Better Testing**: More targeted and relevant test cases
- **User Engagement**: Active participation in test creation
- **Flexibility**: Support diverse agent types and use cases

### Technical Implementation Files
```
src/components/testing/TestCaseInputModal.tsx    - Main modal interface
src/components/testing/TestCaseForm.tsx          - Individual test case form
src/hooks/useTestCaseManager.tsx                 - State management
src/utils/testCaseValidation.ts                  - Form validation logic
src/utils/yamlGenerator.ts                       - YAML generation utilities
```

### Success Metrics
- **Test Case Quality**: Improved pass rates with user-defined tests
- **User Adoption**: Percentage using manual input vs auto-generation
- **Test Coverage**: Average number of test cases per agent
- **User Satisfaction**: Feedback on control and flexibility

---

## Feature #4: Landing Page API Key Configuration Popup

**Status:** Research Complete ✅
**Priority:** High
**Estimated Impact:** Streamlined first-time user experience and reduced setup friction

### Problem Statement

Currently, new users must manually set up `.env.local` files and navigate to settings to configure API keys. This creates friction in the first-time user experience and leads to confusion when features don't work due to missing API key configuration.

### Current Implementation Analysis

#### API Key Storage Mechanisms
```typescript
// Current storage locations:
1. Environment Variables (.env.local):
   - TD_API_KEY=1/your_api_key_here
   - TD_LLM_BASE_URL=https://llm-api.us01.treasuredata.com

2. Browser localStorage:
   - td_api_key: Runtime API key override
   - td_proxy_url: LLM endpoint override
```

#### Current Configuration Flow
```
New User Journey (Current):
1. Clone repository
2. Copy .env.local.example to .env.local
3. Edit file with API key
4. Start development server
5. Navigate to settings manually
6. Test connection
7. Use application features

Gaps:
- No automatic detection of missing configuration
- No guided setup flow
- API key entered twice (file + UI)
- No validation until user tries to use features
```

#### Current Settings UI
- **Modal**: ApiKeyConfig.tsx with password input, region selector
- **Validation**: Test connection button with TD LLM API
- **Storage**: Saves to localStorage for session persistence

### Proposed Landing Page Popup Solution

#### 1. Automatic Detection Logic
```typescript
// New detection in page.tsx or layout component
interface ApiKeyStatus {
  hasEnvKey: boolean;      // process.env.TD_API_KEY exists
  hasStorageKey: boolean;  // localStorage.getItem('td_api_key') exists
  isValid: boolean;        // passed connection test
  needsSetup: boolean;     // show popup
}

function detectApiKeyStatus(): ApiKeyStatus {
  // Check environment variables (server-side)
  // Check localStorage (client-side)
  // Determine if popup should be shown
}
```

#### 2. First-Time Setup Modal
```
┌─ Welcome to Agent Eval Tool ──────────────────────────┐
│                                                       │
│ 🚀 Let's get you set up!                             │
│                                                       │
│ To use this tool, you need a Treasure Data API key.  │
│                                                       │
│ ┌─ Step 1: Get Your API Key ────────────────────────┐ │
│ │ 1. Visit console.treasuredata.com                 │ │
│ │ 2. Navigate to API Keys section                   │ │
│ │ 3. Copy your API key (starts with "1/")          │ │
│ │    [🔗 Open TD Console]                          │ │
│ └────────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─ Step 2: Enter API Key ───────────────────────────┐ │
│ │ TD API Key *                                      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ 1/your_api_key_here                            │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │ [👁 Show]  Region: [US Production ▼]             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─ Connection Test ──────────────────────────────────┐ │
│ │ [🔄 Testing...] ✅ Connection successful!         │ │
│ └────────────────────────────────────────────────────┘ │
│                                                       │
│ [ ] Remember this setting                            │
│ [ ] Create .env.local file automatically             │
│                                                       │
│                      [Skip Setup] [Complete Setup]   │
└───────────────────────────────────────────────────────┘
```

#### 3. Persistent Configuration Options
```typescript
interface ConfigurationOptions {
  saveToEnvFile: boolean;    // Create/update .env.local
  saveToStorage: boolean;    // Save to localStorage
  skipFuturePrompts: boolean; // Don't show popup again
  rememberSession: boolean;   // Keep for browser session
}

// Persistence strategy
if (options.saveToEnvFile) {
  // Server-side API call to create/update .env.local
  await fetch('/api/config/env', {
    method: 'POST',
    body: JSON.stringify({ TD_API_KEY: apiKey })
  });
}

if (options.saveToStorage) {
  localStorage.setItem('td_api_key', apiKey);
  localStorage.setItem('setup_completed', 'true');
}
```

#### 4. Smart Detection Flow
```typescript
// Component: SetupDetectionProvider.tsx
function useApiKeySetup() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'detect' | 'input' | 'test' | 'complete'>('detect');

  useEffect(() => {
    // Check on app load
    const checkSetupStatus = async () => {
      const hasEnv = await checkEnvironmentKey();
      const hasStorage = checkLocalStorageKey();
      const skipSetup = localStorage.getItem('skip_setup') === 'true';

      if (!hasEnv && !hasStorage && !skipSetup) {
        setNeedsSetup(true);
      }
    };

    checkSetupStatus();
  }, []);
}
```

### Advanced Features

#### 1. .env.local File Management
```typescript
// New API endpoint: /api/config/env-file
export async function POST(request: Request) {
  const { apiKey, baseUrl } = await request.json();

  const envContent = `# Treasure Data Configuration
TD_API_KEY=${apiKey}
TD_LLM_BASE_URL=${baseUrl || 'https://llm-api.us01.treasuredata.com'}
DATABASE_URL="./data/agent-eval.db"
NODE_ENV=development
`;

  try {
    fs.writeFileSync('.env.local', envContent);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create .env.local file'
    });
  }
}
```

#### 2. Environment Detection
```typescript
// Detect different deployment contexts
interface EnvironmentContext {
  platform: 'local' | 'vercel' | 'docker' | 'cloudrun';
  canWriteEnvFile: boolean;
  recommendedStorage: 'env' | 'localStorage' | 'both';
}

function detectEnvironment(): EnvironmentContext {
  if (process.env.VERCEL) return { platform: 'vercel', canWriteEnvFile: false, recommendedStorage: 'localStorage' };
  if (process.env.DOCKER) return { platform: 'docker', canWriteEnvFile: false, recommendedStorage: 'env' };
  return { platform: 'local', canWriteEnvFile: true, recommendedStorage: 'both' };
}
```

#### 3. Guided Setup Wizard
```typescript
// Multi-step setup flow
const SETUP_STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'apikey', title: 'API Key', component: ApiKeyStep },
  { id: 'test', title: 'Test Connection', component: TestStep },
  { id: 'storage', title: 'Save Settings', component: StorageStep },
  { id: 'complete', title: 'Complete', component: CompleteStep }
];

function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({});

  return (
    <Modal>
      <StepProgress steps={SETUP_STEPS} current={currentStep} />
      <StepComponent data={setupData} onNext={handleNext} onBack={handleBack} />
    </Modal>
  );
}
```

### Implementation Strategy

#### Phase 1: Basic Popup Detection
```typescript
// New components:
src/components/setup/ApiKeySetupModal.tsx     - Main modal interface
src/components/setup/SetupDetection.tsx      - Detection logic
src/hooks/useSetupDetection.tsx              - Setup state management
src/app/api/config/env-file/route.ts         - .env.local file creation
```

#### Phase 2: Enhanced UX
```typescript
// Enhanced features:
- Multi-step wizard interface
- Environment-aware recommendations
- Automatic TD Console link generation
- Setup progress persistence
```

#### Phase 3: Advanced Configuration
```typescript
// Advanced features:
- Multiple API key management
- Region-specific configuration
- Team/organization setup
- Import/export configuration
```

### Integration with Current System

#### Modified Page Layout
```typescript
// Updated layout.tsx or page.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SetupDetectionProvider>
          <ApiKeySetupModal />
          {children}
        </SetupDetectionProvider>
      </body>
    </html>
  );
}
```

#### Backwards Compatibility
```typescript
// Maintain existing settings UI
// New popup is additive, doesn't replace settings
// Users can still manually configure via settings
// Environment variables still take precedence
```

### Benefits

#### User Experience
- **Faster Onboarding**: Setup in under 2 minutes
- **Guided Process**: Step-by-step instructions
- **Immediate Validation**: Test connection before proceeding
- **Flexible Storage**: Choose environment variables or session storage

#### Developer Benefits
- **Reduced Support**: Fewer setup-related issues
- **Better Adoption**: Lower barrier to entry
- **Clear Feedback**: Users know when setup is incomplete
- **Environment Agnostic**: Works in different deployment contexts

### Technical Implementation Files
```
src/components/setup/ApiKeySetupModal.tsx         - Main setup modal
src/components/setup/SetupWizard.tsx             - Multi-step wizard
src/hooks/useSetupDetection.tsx                  - Detection and state logic
src/app/api/config/env-file/route.ts             - Environment file creation
src/utils/environmentDetection.ts                - Platform detection utilities
src/contexts/SetupContext.tsx                    - Setup state management
```

### Success Metrics
- **Completion Rate**: Percentage of users completing setup
- **Time to First Success**: Duration from landing to working feature
- **Support Reduction**: Decreased setup-related questions
- **User Satisfaction**: Feedback on first-time experience

---

## Feature #5: System Transparency via TDX Log Display

**Status:** Research Complete ✅
**Priority:** Low-Medium
**Estimated Impact:** Enhanced debugging capabilities and system understanding

### Problem Statement

Users currently have limited visibility into how the system processes their requests, making it difficult to understand agent behavior, debug failures, or optimize their test cases. The question is whether exposing TDX execution logs helps users understand "how the system is thinking" and improves their experience.

### Current Implementation Analysis

#### TDX Logging Infrastructure
```typescript
// Current logging in /src/lib/tdx/executor.ts
console.log(`[TDX] Executing: ${command}`);
console.log(`[TDX] Completed in ${duration}ms, exit code: 0`);
console.warn(`[TDX] stderr: ${stderr}`);
console.error(`[TDX] stderr:\n${execError.stderr}`);

// Captured data:
- Command execution strings
- Timing information (milliseconds)
- Exit codes and status
- Full stdout/stderr output
- Error messages and warnings
```

#### Current Visibility Levels
| Information Tier | Current Access | Content |
|-----------------|---------------|---------|
| **User Interface** | Visible | Status, error messages, test results |
| **Expandable Details** | On-demand | Raw output when "Show Details" clicked |
| **Console Logs** | Developer only | Command strings, timing, debug info |
| **Log Files** | File system | Structured JSON logs by category |

#### What's Currently Hidden vs Exposed
**Exposed to Users:**
- Test execution status (running/completed/failed)
- Final test results (pass/fail per case)
- Error messages in user-friendly format
- Raw TDX output in expandable sections

**Hidden from Users:**
- Specific TDX CLI commands executed
- Execution timing breakdowns
- Internal retry logic and recovery attempts
- Tool call sequences and responses
- Database operations and caching

### Research: User Value of System Transparency

#### Persona Analysis

**1. End Users (Non-Technical)**
```
Profile: Business users testing AI agents
Needs:
- Simple pass/fail results
- Clear error explanations
- Next steps when tests fail

Value of TDX logs: LOW
- Too technical and overwhelming
- Focus should be on outcomes, not process
- Prefer simplified status messages
```

**2. Agent Developers (Technical)**
```
Profile: Building and debugging AI agents
Needs:
- Understand why tests failed
- Debug agent prompt issues
- Optimize tool call sequences
- Validate agent behavior

Value of TDX logs: HIGH
- Want to see exact commands executed
- Need timing information for performance
- Want full tool call traces
- Benefit from error details
```

**3. Platform Administrators (Operations)**
```
Profile: Managing agent testing infrastructure
Needs:
- System health monitoring
- Performance troubleshooting
- Usage pattern analysis
- Error rate tracking

Value of TDX logs: MEDIUM
- Need aggregated metrics, not individual logs
- Want operational dashboards
- Prefer structured data over raw logs
```

### Proposed Progressive Disclosure Solution

#### 1. Three-Tier Information Architecture
```
Tier 1: User-Friendly Status (Always Visible)
┌─ Test Status ────────────────────────────────┐
│ ✅ Test Complete - 3/4 tests passed         │
│ 🔄 Running test case 2/4...                 │
│ ❌ Test failed - Connection timeout         │
└──────────────────────────────────────────────┘

Tier 2: Execution Summary (Expandable)
┌─ Execution Details ──────────────────────────┐
│ [🔽 Show Details]                           │
│                                              │
│ 📊 Performance:                             │
│ • Total time: 45.2s                         │
│ • Test execution: 32.1s                     │
│ • LLM evaluation: 13.1s                     │
│                                              │
│ 🛠 System Status:                           │
│ • API connection: ✅ Healthy                │
│ • Agent response: ✅ Complete               │
│ • Trace extraction: ✅ 12 steps captured   │
└──────────────────────────────────────────────┘

Tier 3: Technical Logs (Debug Mode)
┌─ System Logs ────────────────────────────────┐
│ [🔽 Show System Logs] (Advanced)            │
│                                              │
│ 12:34:01 [TDX] Executing: tdx agent test... │
│ 12:34:02 [TDX] Completed in 1547ms, exit 0 │
│ 12:34:02 [API] Extracting thread ID from... │
│ 12:34:03 [TDX] Executing: tdx llm history..│
│ 12:34:04 [TDX] Retrieved 8 conversation...  │
│                              [📋 Copy All] │
└──────────────────────────────────────────────┘
```

#### 2. Smart Context-Aware Display
```typescript
interface LogDisplayContext {
  userType: 'enduser' | 'developer' | 'admin';
  errorState: boolean;
  debugMode: boolean;
  requestedDetail: 'summary' | 'full' | 'technical';
}

function determineLogVisibility(context: LogDisplayContext): LogLevel {
  // End users: Only show logs on errors, simplified format
  if (context.userType === 'enduser') {
    return context.errorState ? 'error-summary' : 'status-only';
  }

  // Developers: Show execution details, full logs on demand
  if (context.userType === 'developer') {
    return context.debugMode ? 'full-technical' : 'execution-summary';
  }

  // Admins: Show structured data, metrics focus
  return 'operational-metrics';
}
```

#### 3. Enhanced Debug Mode
```
Debug Mode UI (For Technical Users):
┌─ Debug Console ──────────────────────────────────────┐
│ [🔄 Real-time] [📊 Metrics] [💾 Export Logs]       │
├──────────────────────────────────────────────────────┤
│ ┌─ Timeline ─────────────────────────────────────────┐ │
│ │ 12:34:01 ─── Test Start                           │ │
│ │ 12:34:01 ├── TDX Command: tdx agent test...       │ │
│ │ 12:34:02 ├── Test Execution (1547ms)              │ │
│ │ 12:34:02 ├── Extract Thread ID                    │ │
│ │ 12:34:03 ├── TDX History: tdx llm history...      │ │
│ │ 12:34:04 ├── Parse 8 conversation steps           │ │
│ │ 12:34:05 └── LLM Evaluation (3 cases)             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Filters ─────────────────────────────────────────┐ │
│ │ [All] [Errors] [Performance] [TDX] [API] [DB]    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Log Stream (Live) ───────────────────────────────┐ │
│ │ [TDX] 12:34:01 Executing: tdx agent test         │ │
│ │       "agents/animals-sounds/animals-sounds"      │ │
│ │ [TDX] 12:34:02 Completed in 1547ms, exit code: 0 │ │
│ │ [API] 12:34:02 Parsing test output...            │ │
│ │ [API] 12:34:02 Found 3 test cases               │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Implementation Strategy

#### Phase 1: User Type Detection
```typescript
// New hook: useUserType.tsx
function useUserType(): UserType {
  const [userType, setUserType] = useState<UserType>('enduser');

  useEffect(() => {
    // Detect based on:
    // 1. LocalStorage preference
    // 2. URL parameters (?debug=true)
    // 3. API key permissions level
    // 4. User behavior patterns
  }, []);

  return userType;
}
```

#### Phase 2: Progressive Disclosure Components
```typescript
// New components for log display
src/components/debug/LogViewer.tsx           - Main log display
src/components/debug/DebugConsole.tsx       - Advanced debug interface
src/components/debug/ExecutionTimeline.tsx  - Timeline visualization
src/components/ui/ProgressiveDisclosure.tsx - Expandable sections
```

#### Phase 3: Real-Time Log Streaming
```typescript
// WebSocket or Server-Sent Events for live logs
interface LogStreamEvent {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'tdx' | 'api' | 'db' | 'app';
  message: string;
  metadata?: Record<string, any>;
  requestId: string;
}

// Live updates during test execution
function useLogStream(requestId: string) {
  const [logs, setLogs] = useState<LogStreamEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/logs/stream/${requestId}`);
    eventSource.onmessage = (event) => {
      const logEvent = JSON.parse(event.data);
      setLogs(prev => [...prev, logEvent]);
    };
  }, [requestId]);
}
```

### Benefits Analysis

#### For Technical Users (High Value)
**Debugging Capabilities:**
- See exact TDX commands executed
- Understand timing bottlenecks
- Trace tool call sequences
- Identify configuration issues

**System Understanding:**
- Learn how agent testing works
- Understand error conditions
- Optimize test case design
- Troubleshoot environment issues

**Developer Productivity:**
- Faster issue resolution
- Better test case design
- Understanding of system limitations
- Reduced support requests

#### For End Users (Low Value, Potential Negative)
**Potential Issues:**
- Information overload
- Technical complexity barrier
- Confusion about system status
- Distraction from core tasks

**Mitigation Strategies:**
- Default to simple status display
- Require explicit opt-in for technical details
- Provide guided explanations for technical terms
- Focus on actionable information

#### For Operations (Medium Value)
**System Monitoring:**
- Performance metrics visibility
- Error pattern identification
- Resource usage tracking
- User behavior insights

### Recommendation: Conditional Implementation

#### Recommendation Summary
**Implement Progressive Disclosure with Smart Defaults**

1. **Default (End Users)**: Simple status messages only
2. **On-Demand (Errors)**: Show relevant details when tests fail
3. **Opt-In (Technical)**: Full debug mode for developers
4. **Advanced (Operations)**: Structured metrics and monitoring

#### Implementation Priority
```
Phase 1 (High Priority):
- Enhanced error reporting with context
- Expandable execution summaries
- Performance timing display

Phase 2 (Medium Priority):
- Debug mode toggle for technical users
- Real-time execution progress
- Log filtering and search

Phase 3 (Lower Priority):
- Live log streaming
- Operational dashboards
- Advanced analytics
```

#### Success Criteria
```
Metrics to Track:
- User satisfaction scores by persona type
- Error resolution time (for technical users)
- Support ticket reduction
- Debug mode adoption rate
- Feature usage patterns

Goals:
- Improve debugging efficiency by 50% for technical users
- Maintain simple UX for non-technical users
- Reduce setup/configuration support requests by 30%
```

### Technical Implementation Files
```
src/components/debug/DebugModeToggle.tsx      - Debug mode activation
src/components/debug/LogViewer.tsx            - Progressive log display
src/components/debug/ExecutionSummary.tsx    - Performance metrics
src/hooks/useDebugMode.tsx                    - Debug state management
src/utils/logFormatting.ts                    - Log formatting utilities
src/app/api/logs/stream/route.ts              - Real-time log streaming
```

### Final Recommendation

**Answer to "Do we need to show TDX logs to users?"**

**Yes, but conditionally and progressively:**

1. **For End Users**: No by default - keep simple status messages
2. **For Errors**: Yes - show relevant details to help resolution
3. **For Technical Users**: Yes - full debug mode with detailed logs
4. **For Operations**: Yes - structured metrics and monitoring

The key is **progressive disclosure** that adapts to user needs and context, rather than a one-size-fits-all approach.

---

*Last Updated: 2026-02-25*
*Document Version: 2.0*
*Research Complete: All features documented and analyzed*