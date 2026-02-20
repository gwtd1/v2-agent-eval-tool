V2-roadmap.md

# V2 Agent Eval Tool Roadmap
## Summary


The Agent Eval Tool is an app framework that uses manual human-in-the-loop evaluation and LLM-as-a-judge methodology to assess agent performance and accuracy. The tool integrates with TDX (Treasure Data) to manage test cases, execute evaluations, and provide comprehensive analysis of agent responses against ground truth data. V2 roadmap focuses on enhancing the user interface to display conversation traces and LLM evaluation results, improving data export capabilities, and streamlining test case management through CSV-to-YAML conversion. Future versions (V3) will expand functionality with manual test case creation, cloud deployment, advanced analytics including error clustering, and multi-reviewer support.


## V2 Features
| ID  | Category | Developer     | Requirement                                                                                 | Status    | Notes                                                                                                                                                      |
|-----|----------|---------------|---------------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| D1  | UI + BE  | gwtd1         | Show conversation traces in evaluation                                                      | Completed | Expandable TracesSection shows user inputs, agent responses, and tool calls with full details                                                              |
| D2  | TDX      | gwtd1         | LLM as a judge results in evaluation UI frame                                               | Completed | Currently only see the agent output, not the LLM-as-a-judge results                                                                                        |
| D3  | UI       | gwtd1         | Make LLM as a judge results click-to-view                                                   | Completed | Dependency on D2; Currently they do not appear at all                                                                                                      |
| D4  | UI       | gwtd1         | Export data filtering by rating (False or True)                                             | Completed | V1 exports all evaluations, filter for FALSE test cases                                                                                                    |
| D5  | TDX      | tushar-fde-ai | manual input where claude code converts csv to yml file                                     |           | Create a TDX command to upload csv to add test cases to eval.yaml; Currently only TR and Honda have ground truth in csv                                    |
| D6  | UI + BE  | gwtd1         | Query TDX project name/agent after user provides api key                                    | Completed | V1 is hardcoded for TDX project name is tdx_default_gregwilliams                                                                                           |
| D18 | UI       | gwtd1         | Change rating to Pass/Fail with thumbs up/down buttons                                      | Completed | Replace numeric/star rating with binary Pass/Fail; Use thumbs up/down icons for manual evaluation input                                                    |
| D19 | UI + BE  | gwtd1         | Display complete agent response in evaluation                                               | Completed | Agent response section must return and display the entire response, not truncated                                                                          |
| D21 | Bug      | gwtd1         | Fix evaluation results storage and display                                                  | Completed | Results show repeated "Round 1/1: Sending user input..." but don't store/display properly; Investigate data flow                                           |
| D22 | Bug      | gwtd1         | Fix test.yml creation for agents without one                                                | Completed | Feature for creating test.yml for an agent that doesn't have one currently is broken                                                                       |
| D23 | UI       | gwtd1         | Remove Evaluation Chat Button "view evaluation Conversation" from eval dropdown             | Completed | Remove "Evaluation Chat" and "View evaluation conversation" both button and text from the evaluation dropdown menu                                         |
| D26 | UI       | gwtd1         | Traces are converted to mermaid code and mermaid chart shown to user instead of text traces | Completed | When manual human evaluator clicks into the conversation traces a mermaid chart of the flow of traces appears for the user to view instead of text traces  |


## Requirements Explanation
### D1: Show conversation traces in evaluation
The user shall see the traces from the use case. Example: tool calls, sub agent calls, conversations


### D2: LLM as a judge results in evaluation UI frame
The user shall see LLM-as-a-judge results in the UI below the agent response


### D3: Make LLM as a judge results click-to-view
The user shall click a button to view the LLM-as-a-judge results so the results do not bias the evaluator


### D4: Export data filtering by rating (False or True)
The user shall be able to filter the output from the evaluation by for only false ratings


### D5: manual input where claude code converts csv to yml file
The user shall manually input use cases and ground truth to test.yaml in claude tdx for a new agent. This will be used for customers that already have test cases and ground truth in csv files


### D6: Query TDX project name/agent after user provides api key
The user shall enter an api key and select the correct project name and agent from tdx


### D18: Change rating to Pass/Fail with thumbs up/down buttons
The user shall evaluate agent responses using a binary Pass/Fail rating system instead of numeric ratings. The UI shall display thumbs up (Pass) and thumbs down (Fail) buttons for intuitive manual evaluation input.


### D19: Display complete agent response in evaluation
The user shall see the complete agent response in the evaluation UI. Currently the UI shows "Response contains 'True'" instead of the actual agent response. This seems to be hardcoded. The UI needs to show the agents true response.


The agent response section must return and render the entire response from the agent without truncation.


### D21: Fix evaluation results storage and display
Bug: When running evaluations, results show repeated "Round 1/1: Sending user input..." messages but evaluation data is not being stored or displayed correctly in the UI. Investigation needed to trace data flow from TDX execution through storage to UI rendering.


### D22: Fix test.yml creation for agents without one
Bug: The feature for creating a test.yml file for an agent that doesn't currently have one is broken. Users should be able to generate a test.yml template for any agent.


### D23: Remove Evaluation Chat options from eval dropdown
The user shall not see "Evaluation Chat" text and the "View evaluation conversation" button in the evaluation dropdown menu. Remove Evaluation Chat Button "view evaluation Conversation" from eval dropdown. Remove "Evaluation Chat" text and "View evaluation conversation" both button and text from the evaluation dropdown menu


### D26: Display traces as Mermaid flowchart
The user shall see conversation traces visualized as a Mermaid flowchart instead of raw text. When the evaluator clicks to view conversation traces, the system shall:
1. Parse the trace data (user input, tool calls, tool results, agent response)
2. Convert the trace flow into Mermaid diagram code
3. Render an interactive flowchart showing the sequence: User Input → Agent → Tool Calls → Tool Results → Final Response
#### Example from animal-sounds agent
Example trace flow:
```mermaid
sequenceDiagram                                                                               
     participant User                                                                          
     participant Agent                                                                         
     participant Tool as call-test-tkb<br/>(TextKnowledgeBase)                                 
                                                                                               
     User->>Agent: "Dog"                                                                       
     Agent->>Tool: READ_TEXT<br/>functionArguments: {}                                         
     Tool-->>Agent: "The cow goes 'Moooooo'..."<br/>status: OK                                 
     Agent-->>User: "rrruuuffff"                                                               
                                                                                               
 Or as a flowchart:                                                                            
                                                                                               
 flowchart TD                                                                                  
     A[👤 User Input<br/>"Dog"] --> B[🤖 Agent]                                                
     B --> C{Tool Call}                                                                        
     C --> D[📚 call-test-tkb<br/>TextKnowledgeBase: test-tkb<br/>Function: READ_TEXT]         
     D --> E[Tool Result<br/>"The cow goes 'Moooooo'..."]                                      
     E --> F[🤖 Agent Processing]                                                              
     F --> G[💬 Final Response<br/>"rrruuuffff"]
```
## V3 Features


| ID  | Category | Developer | Requirement                                        | Status    | Notes                                                                                              |
|-----|----------|-----------|---------------------------------------------------|-----------|----------------------------------------------------------------------------------------------------|
| E1  | UI       | gwtd1     | Consistent click behaviors for expandable sections | Completed | Unify "Show" button and "^" toggle button designs across Conversation Traces and LLM Evaluation   |
| E2  | UI       | gwtd1     | Consistent section heading design                  | Completed | Standardize Prompt, Agent Response, Traces, LLM Evaluation, Ground Truth headings with colors     |
| E3  | UI       | gwtd1     | Human evaluation UI redesign                       | Completed | Modern facelift for 3-pane evaluation layout; research design options before implementation       |


### V3 Requirements Explanation


### E1: Consistent click behaviors for expandable sections
The Conversation Traces section uses a "Show" button while the LLM Evaluation section uses a "^" toggle button. These perform the same expand/collapse action but have different designs. The UI should use a consistent button style, icon, and interaction pattern across all expandable sections in the application.


**Acceptance Criteria:**
- All expandable sections use the same button component
- Consistent icon (chevron or similar) for expand/collapse state
- Same hover, active, and disabled states across buttons


### E2: Consistent section heading design
The sections "Prompt", "Agent Response", "Conversation Traces", "LLM Evaluation", and "Ground Truth" in the middle evaluation pane have inconsistent designs. Some use a circle with a single letter (P, R, G), while others don't. The headings should have a unified design language with distinct colors to differentiate each section type.


**Acceptance Criteria:**
- Remove circular letter badges or apply consistently to all sections
- Each section type has a unique, distinguishable color scheme
- Typography (font size, weight, spacing) is consistent across all headings
- Clear visual hierarchy between section headers and content


### E3: Human evaluation UI redesign
The three-pane human evaluation page needs a visual refresh to look modern yet simple. Before implementation, research and present 3-5 design reference links for review. The redesign should address color palette, typography, spacing, and overall visual consistency.


**Acceptance Criteria:**
- Research phase: Present design references for approval
- Implementation phase: Update colors, fonts, and spacing
- Maintain usability and accessibility standards
- Responsive design considerations


## V4 Features


| ID   | Category | Developer | Requirement                            | Status | Notes                                                                                    |
|------|----------|-----------|----------------------------------------|--------|------------------------------------------------------------------------------------------|
| D7   | UI + BE  | gwtd1     | Manual test case creation              |        | Create test cases directly from the UI without editing YAML files                        |
| D8   | Infra    | gwtd1     | Cloud deployment                       |        | Host app in cloud so anyone can use with an API key; consider Vercel or AWS              |
| D9   | UI       | gwtd1     | Response truncation with "Show more"   |        | Truncate long test cases/responses with expandable "Show more" button                    |
| D10  | UI + BE  | gwtd1     | Upload test cases from document        |        | Upload button for testcases and ground truth files; support CSV, JSON formats            |
| D11  | BE       | gwtd1     | LLM-based error clustering             |        | Post-MVP analytics to detect common agent issues from evaluation notes using LLM         |
| D12  | UI + BE  | gwtd1     | Tagging/labeling system                |        | Tag test cases with labels for categorization; requires taxonomy design                  |
| D13  | BE       | gwtd1     | Zod schema validation for API requests |        | Replace manual validation with Zod schemas for type-safe API request validation          |
| D14  | BE       | gwtd1     | Full service API layer architecture    |        | Refactor from CRUD in route handlers to proper service layer with separation of concerns |
| D15  | BE       | gwtd1     | Structured JSON logging for production |        | Replace console.log with structured JSON logging for production observability            |
| D16  | BE       | gwtd1     | Multi-reviewer support                 |        | Add reviewerId field to support multiple evaluators per test run                         |
| D17  | UI       | gwtd1     | Pagination for Previous Test Runs      |        | Add scroll or pagination to test runs list on intro screen                               |
| D20  | UI + BE  | gwtd1     | Show TDX execution logs during tests   |        | Stream TDX CLI logs to UI when running tests; show real-time execution feedback          |
| D25  | Infra    | gwtd1     | Cloud storage for test.yml             |        | Store test.yml for each agent in cloud storage for remote access                         |
| D27  | UI + BE  | gwtd1     | TDX Project Selector Dropdown          | Demo   | Add project dropdown to switch between TDX LLM projects without CLI commands             |
| D28  | BE       | gwtd1     | Filesystem-safe path handling          | Completed | Convert special characters in project/agent names (colons → underscores) for local paths |
| D28b | BE       | gwtd1     | TDX_PROJECT env var support            | Completed | Allow setting project context via environment variable for project switching             |
| D28c | BE       | gwtd1     | Fix JSON parsing for mixed TDX output  | Completed | Extract JSON array from TDX output that contains status messages before JSON             |
| D29  | BE       | gwtd1     | TDX built-in evaluation integration    | Completed | Use TDX's PASS/FAIL evaluation results instead of calling external LLM API               |
| D30  | BE       | gwtd1     | Dynamic project context API            | Completed | API endpoint to set/get current project context at runtime (for D27 UI support)          |
| D31  | BE       | gwtd1     | Project list API endpoint              | Completed | `/api/projects` endpoint to fetch available TDX LLM projects via `tdx llm projects`      |
| D32  | Github   | gwtd1     | Setup Slack logging for PRs and merges |        | Log all github activity to slack channel                                                 |


### V4 Requirements Explanation


### D27: TDX Project Selector Dropdown
The user shall be able to switch between TDX LLM projects directly from the app UI without running CLI commands. Currently, the app only shows agents from the default TDX project. Users working with multiple projects (e.g., "TD-Managed: Creative Studio") must manually run `tdx use llm_project` in the terminal to switch contexts.


**Implementation Details:**
1. **New API endpoint**: `/api/projects` - Fetches available projects via `tdx llm projects` command
2. **Project selector component**: Add dropdown above the existing Agent Selector on the landing page
3. **Project context switching**: When user selects a project, execute `tdx use llm_project "<project-name>"`
4. **Agent list refresh**: After project switch, automatically refresh the agent list to show agents from the selected project
5. **Persist selection**: Optionally store the selected project in localStorage or .env for session persistence


**TDX Commands Used:**
- `tdx llm projects` - List all available LLM projects
- `tdx use llm_project "<project-name>"` - Switch the active project context
- `tdx agent list --format json` - List agents (respects current project context)


**UI Flow:**
1. User opens app landing page
2. Project dropdown shows all available TDX projects (fetched from `tdx llm projects`)
3. User selects "TD-Managed: Creative Studio" from dropdown
4. App executes `tdx use llm_project "TD-Managed: Creative Studio"`
5. Agent dropdown refreshes to show agents from selected project
6. User selects agent and runs evaluation as normal


**Acceptance Criteria:**
- Project dropdown appears on landing page above Agent Selector
- Dropdown lists all projects from `tdx llm projects` output
- Selecting a project switches context and refreshes agent list
- Loading states shown during project switch and agent refresh
- Error handling for failed project switches
- Current project displayed clearly in UI


### D28: Filesystem-safe path handling (COMPLETED)
TDX CLI converts special characters in project and agent names to filesystem-safe equivalents when creating local directories. The app must handle this conversion to correctly locate agent files (test.yml, prompt.md, etc.).


**Problem:**
- TDX API returns project name: `TD-Managed: Creative Studio`
- TDX CLI creates local folder: `agents/TD-Managed_ Creative Studio/` (colon → underscore)
- App was building paths with colons, causing "file not found" errors


**Implementation Details:**


1. **Add helper function in `src/lib/tdx/executor.ts`** (after DEFAULT_TIMEOUT constant):
```typescript
/**
* Convert project name to filesystem-safe folder name
* TDX CLI replaces colons with underscores in folder names
*/
function toFilesystemSafeName(name: string): string {
 return name.replace(/:/g, '_');
}
```


2. **Update `executeTdxAgentTest()` in executor.ts** - Use safe names for local path:
```typescript
// After extracting projectName and agentName:
const safeProject = toFilesystemSafeName(projectName);
const safeAgent = toFilesystemSafeName(agentName);


// Build path with safe names:
const fullPath = `agents/${safeProject}/${safeAgent}`;
// But use original name (with colons) for tdx use command:
const command = `tdx use llm_project "${escapedProject}" && tdx agent test "${fullPath}"`;
```


3. **Update `initTdxAgentTest()` in executor.ts** - Same pattern for agent directory paths:
```typescript
const safeProject = toFilesystemSafeName(projectName);
const safeAgent = toFilesystemSafeName(agentName);
const agentDir = path.join(process.cwd(), 'agents', safeProject, safeAgent);
```


4. **Add helper function in `src/lib/tdx/parser.ts`** (before `readTestYamlForAgent`):
```typescript
/**
* Convert path to filesystem-safe version (colons → underscores)
*/
function toFilesystemSafePath(pathStr: string): string {
 return pathStr.replace(/:/g, '_');
}
```


5. **Update `readTestYamlForAgent()` in parser.ts**:
```typescript
export function readTestYamlForAgent(agentPath: string): Map<string, TestYamlData> {
 const safePath = toFilesystemSafePath(agentPath);
 const testYamlPath = path.join(process.cwd(), safePath, 'test.yml');
 // ... rest of function
}
```


**Key Insight:** Use original names (with colons) when calling TDX CLI commands, but use safe names (with underscores) when accessing local filesystem paths.


**Dependency:** Required for D27 (Project Selector) to work with projects that have special characters in names.


### D28b: TDX_PROJECT environment variable support (COMPLETED)
Allow setting the TDX project context via environment variable, enabling project switching without UI (prerequisite for D27).


**Problem:**
- `tdx use llm_project` only sets session-level context
- Node.js app spawns separate processes that don't inherit terminal session context
- App always used default project regardless of terminal context


**Implementation Details:**


1. **Add to `.env.example`**:
```bash
# TDX Project (optional) - sets the LLM project context for agent listing
# Examples: "tdx_default_gregwilliams", "TD-Managed: Creative Studio"
TDX_PROJECT=
```


2. **Update `listTdxAgents()` in `src/lib/tdx/executor.ts`**:
```typescript
export async function listTdxAgents(): Promise<TdxCommandResult> {
 const project = process.env.TDX_PROJECT;


 if (project) {
   // Set project context before listing agents
   const escapedProject = project.replace(/"/g, '\\"');
   return executeTdxCommand(`tdx use llm_project "${escapedProject}" && tdx agent list --format json`);
 }


 return executeTdxCommand('tdx agent list --format json');
}
```


3. **Update `parseAgentArray()` in `src/lib/tdx/parser.ts`** - Use TDX_PROJECT as default:
```typescript
function parseAgentArray(agents: Array<Record<string, unknown>>): ParsedAgent[] {
 // Use TDX_PROJECT env var as default if no project in agent data
 const defaultProject = process.env.TDX_PROJECT || 'tdx_default_gregwilliams';


 return agents.map((agent) => {
   const project = (agent.project as string) || extractProjectFromPath(agent.path as string) || defaultProject;
   // ... rest of mapping
 });
}
```


4. **Update `parseAgentPath()` in parser.ts** - Same pattern:
```typescript
export function parseAgentPath(agentPath: string): { project: string; agent: string } {
 const defaultProject = process.env.TDX_PROJECT || 'tdx_default_gregwilliams';
 // ... matching logic
 return { project: defaultProject, agent: agentPath };
}
```


5. **Update `extractProjectFromPath()` in parser.ts** - Return empty to allow env fallback:
```typescript
function extractProjectFromPath(path: string): string {
 const match = path?.match(/agents\/([^/]+)/);
 if (match) return match[1];
 return ''; // Return empty to allow fallback to TDX_PROJECT env var
}
```


**Usage:** Set `TDX_PROJECT=TD-Managed: Creative Studio` in `.env.local`, restart dev server.


### D28c: Fix JSON parsing for mixed TDX output (COMPLETED)
TDX CLI outputs status messages before JSON when project context is set. Parser must extract JSON from mixed output.


**Problem:**
- When using `tdx use llm_project && tdx agent list --format json`, output is:
```
Session llm_project set to: TD-Managed: Creative Studio (session: 59539)
Tip: Use 'tdx use --clear' to clear session overrides
- Resolving project 'TD-Managed: Creative Studio'...
- Fetching agents...
[
 {"name":"TD-Managed: Brand Guideline",...},
 ...
]
```
- `JSON.parse(output)` fails because of text before JSON array
- App was returning 0 agents despite successful TDX command


**Implementation Details:**


Update `parseAgentListOutput()` in `src/lib/tdx/parser.ts`:
```typescript
export function parseAgentListOutput(output: string): ParsedAgent[] {
 const agents: ParsedAgent[] = [];


 // Try parsing as JSON first
 try {
   const parsed = JSON.parse(output);
   if (Array.isArray(parsed)) {
     return parseAgentArray(parsed);
   }
 } catch {
   // Not pure JSON, try to extract JSON array from the output
   // TDX may output status messages before the JSON
   const jsonMatch = output.match(/\[[\s\S]*\]/);
   if (jsonMatch) {
     try {
       const parsed = JSON.parse(jsonMatch[0]);
       if (Array.isArray(parsed)) {
         return parseAgentArray(parsed);
       }
     } catch {
       // JSON extraction failed, fall through to text parsing
     }
   }
 }


 // ... text parsing fallback
}
```


**Key Insight:** Use regex `/\[[\s\S]*\]/` to find and extract the JSON array from mixed output.


### D29: TDX built-in evaluation integration (COMPLETED)
Use TDX's built-in LLM-as-a-judge evaluation results (from `✓ PASS:` and `✗ FAIL:` output) instead of calling an external LLM API. This eliminates the need for separate API credentials and reduces evaluation latency.


**Problem:**
- Original implementation called external LLM API via `evaluateWithLlm()` function
- Required valid `TD_API_KEY` with LLM API access (different from TDX CLI access)
- Users getting `401 Unauthorized: Invalid credentials` errors
- TDX already performs LLM evaluation and outputs results in test output


**TDX Output Format (what we're parsing):**
```
Test 1/3: basic_email_generation
 Round 1/1... ✓ (14.7s)
 Evaluating... ✓ (13.0s)
✗ FAIL: While the agent correctly called text_in_form with proper structure, it failed to include personalization...
Conversation URL: https://console-next.us01.treasuredata.com/.../tc/019c599a-62b5-75a1-9dca-2a809b0f1e75


Test 2/3: missing_required_fields
 Round 1/1... ✓ (9.7s)
 Evaluating... ✓ (10.1s)
✓ PASS: The agent correctly called text_in_form with an error message stating required fields are mandatory...
Conversation URL: https://console-next.us01.treasuredata.com/.../tc/019c599a-d13c-7b61-89e5-711c5204f84c
```


**Implementation Details:**


1. **Add `tdxEvaluation` field to `ParsedTestCase` interface in `src/lib/tdx/parser.ts`**:
```typescript
export interface ParsedTestCase {
 name: string;
 prompt: string;
 groundTruth: string | null;
 agentResponse: string | null;
 status: 'pass' | 'fail' | 'error';
 error?: string;
 chatLink?: string;
 /** TDX's built-in evaluation reasoning (from PASS:/FAIL: output) */
 tdxEvaluation?: string;
}
```


2. **Update `saveCase()` function inside `extractTestCasesFromOutput()`**:
```typescript
const saveCase = () => {
 if (currentCase && currentCase.name) {
   // TDX evaluation reasoning from PASS:/FAIL: lines
   const evaluationText = evaluationReason.join(' ').trim();
   testCases.push({
     name: currentCase.name,
     prompt: currentCase.name,
     groundTruth: null,
     agentResponse: null, // Will be populated from chat history
     status: currentCase.status || 'pass',
     error: currentCase.error,
     chatLink: currentCase.chatLink,
     tdxEvaluation: evaluationText || undefined,  // NEW FIELD
   });
 }
 evaluationReason = [];
};
```


3. **Replace LLM evaluation loop in `src/app/api/test/route.ts`**:


Remove the import:
```typescript
// DELETE: import { evaluateWithLlm } from '@/lib/llm/evaluator';
```


Replace the entire LLM evaluation section (approximately lines 239-290) with:
```typescript
// Use TDX's built-in evaluation results (from PASS:/FAIL: output)
let completedLlmEvaluations = 0;
const totalTests = createdTestCases.length;


console.log(`[API] Applying TDX evaluation results for ${totalTests} test cases`);


for (let i = 0; i < createdTestCases.length; i++) {
 const testCase = createdTestCases[i];
 const testNumber = i + 1;
 const testName = testNameMap.get(testCase.id) || `Test ${testNumber}`;
 const parsedCase = parsedCases[i];


 // Check if we have TDX evaluation data
 if (parsedCase && parsedCase.tdxEvaluation) {
   const llmResult = {
     verdict: parsedCase.status === 'pass' ? 'pass' : 'fail' as 'pass' | 'fail',
     reasoning: parsedCase.tdxEvaluation,
     conversationUrl: parsedCase.chatLink || '',
     testNumber,
     totalTests,
     testName,
     prompt: testCase.prompt,
     evaluatedAt: new Date().toISOString(),
     evaluatorAgentId: 'tdx-builtin', // Indicates source
   };


   const updatedTestCase = updateTestCaseLlmJudgeResult(testCase.id, llmResult);
   if (updatedTestCase) {
     completedLlmEvaluations++;
     console.log(`[API] TDX evaluation ${testNumber}/${totalTests}: ${testName} -> ${llmResult.verdict}`);
   }
 } else {
   console.warn(`[API] No TDX evaluation found for ${testName}`);
 }
}


console.log(`[API] All TDX evaluations applied: ${completedLlmEvaluations}/${totalTests} saved`);
```


**Benefits:**
- No external LLM API credentials required for evaluation
- Faster test completion (no additional API calls)
- Evaluation reasoning comes from the same LLM that executed the test
- `evaluatorAgentId: 'tdx-builtin'` allows UI to show evaluation source


### D30: Dynamic project context API
API endpoint to dynamically set and get the current TDX project context at runtime. This supports D27 (Project Selector UI) by allowing the frontend to change projects without server restart.


**Proposed Implementation:**
1. **GET `/api/project-context`** - Returns current project (from `TDX_PROJECT` env or session)
2. **POST `/api/project-context`** - Sets project context for the session
3. **Session storage** - Store selected project in server-side session or memory cache
4. **Agent list integration** - `listTdxAgents()` reads from session context


**Technical Considerations:**
- Cannot modify `.env.local` at runtime (requires restart)
- Use in-memory store or session cookies for per-user project selection
- Consider localStorage sync for multi-tab support


**Acceptance Criteria:**
- API returns current project context
- API accepts project name and stores for session
- Agent list reflects selected project
- Project selection persists across page refreshes (within session)


### D31: Project list API endpoint
New API endpoint to fetch available TDX LLM projects for populating the project selector dropdown (D27).


**Proposed Implementation:**
```typescript
// GET /api/projects
export async function GET() {
 const result = await executeTdxCommand('tdx llm projects --json');
 // Parse and return project list
}
```


**Response Format:**
```json
{
 "projects": [
   { "name": "tdx_default_gregwilliams", "type": "personal" },
   { "name": "TD-Managed: Creative Studio", "type": "managed" }
 ],
 "currentProject": "TD-Managed: Creative Studio"
}
```


**TDX Command:** `tdx llm projects` (may need `--json` flag if available)


**Acceptance Criteria:**
- Returns list of all accessible TDX LLM projects
- Indicates which project is currently selected
- Handles errors (auth issues, TDX not available)
- Response suitable for populating dropdown UI



