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

| ID  | Category | Developer | Requirement                                        | Status | Notes                                                                                              |
|-----|----------|-----------|---------------------------------------------------|--------|----------------------------------------------------------------------------------------------------|
| E1  | UI       | gwtd1     | Consistent click behaviors for expandable sections |        | Unify "Show" button and "^" toggle button designs across Conversation Traces and LLM Evaluation   |
| E2  | UI       | gwtd1     | Consistent section heading design                  |        | Standardize Prompt, Agent Response, Traces, LLM Evaluation, Ground Truth headings with colors     |
| E3  | UI       | gwtd1     | Human evaluation UI redesign                       |        | Modern facelift for 3-pane evaluation layout; research design options before implementation       |

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

| ID  | Category | Developer | Requirement                            | Status | Notes                                                                                    |
|-----|----------|-----------|----------------------------------------|--------|------------------------------------------------------------------------------------------|
| D7  | UI + BE  | gwtd1     | Manual test case creation              |        | Create test cases directly from the UI without editing YAML files                        |
| D8  | Infra    | gwtd1     | Cloud deployment                       |        | Host app in cloud so anyone can use with an API key; consider Vercel or AWS             |
| D9  | UI       | gwtd1     | Response truncation with "Show more"   |        | Truncate long test cases/responses with expandable "Show more" button                    |
| D10 | UI + BE  | gwtd1     | Upload test cases from document        |        | Upload button for testcases and ground truth files; support CSV, JSON formats           |
| D11 | BE       | gwtd1     | LLM-based error clustering             |        | Post-MVP analytics to detect common agent issues from evaluation notes using LLM        |
| D12 | UI + BE  | gwtd1     | Tagging/labeling system                |        | Tag test cases with labels for categorization; requires taxonomy design                 |
| D13 | BE       | gwtd1     | Zod schema validation for API requests |        | Replace manual validation with Zod schemas for type-safe API request validation         |
| D14 | BE       | gwtd1     | Full service API layer architecture    |        | Refactor from CRUD in route handlers to proper service layer with separation of concerns|
| D15 | BE       | gwtd1     | Structured JSON logging for production |        | Replace console.log with structured JSON logging for production observability           |
| D16 | BE       | gwtd1     | Multi-reviewer support                 |        | Add reviewerId field to support multiple evaluators per test run                        |
| D17 | UI       | gwtd1     | Pagination for Previous Test Runs      |        | Add scroll or pagination to test runs list on intro screen                              |
| D20 | UI + BE  | gwtd1     | Show TDX execution logs during tests   |        | Stream TDX CLI logs to UI when running tests; show real-time execution feedback         |
| D25 | Infra    | gwtd1     | Cloud storage for test.yml             |        | Store test.yml for each agent in cloud storage for remote access                        |

