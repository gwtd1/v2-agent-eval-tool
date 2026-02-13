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
| D20 | UI + BE  | gwtd1         | Show TDX execution logs during test runs                                                    |           | Stream TDX CLI logs to UI when user clicks "Run Test"; Show commands like `tdx use llm_project` and `tdx agent test`                                       |
| D21 | Bug      | gwtd1         | Fix evaluation results storage and display                                                  | Completed | Results show repeated "Round 1/1: Sending user input..." but don't store/display properly; Investigate data flow                                           |
| D22 | Bug      | gwtd1         | Fix test.yml creation for agents without one                                                | Completed | Feature for creating test.yml for an agent that doesn't have one currently is broken                                                                       |
| D23 | UI       | gwtd1         | Remove Evaluation Chat Button "view evaluation Conversation" from eval dropdown             | Completed | Remove "Evaluation Chat" and "View evaluation conversation" both button and text from the evaluation dropdown menu                                         |
| D26 | UI       | gwtd1         | Traces are converted to mermaid code and mermaid chart shown to user instead of text traces |           | When manual human evaluator clicks into the conversation traces a mermaid chart of the flow of traces appears for the user to view instead of text traces  |

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

### D20: Show TDX execution logs during test runs
The user shall see real-time TDX execution logs in the UI when running tests. Currently, clicking "Run Test" provides no feedback while the agent executes. The UI shall stream or display TDX CLI output including commands like `[TDX] Executing: tdx use llm_project "project_name" && tdx agent test "agents/project/agent-name"`.

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
                                                                                                                                                       
### V3-agent-eval-tool
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
| D17 | Pagination for Previous Test Runs         | The Previous Test Runs need a scroll or pagination on the intro screen                        |
| D25 | Cloud storage for test.yml                | Store test.yml for each agent in the cloud so it can be called remotely                       |

