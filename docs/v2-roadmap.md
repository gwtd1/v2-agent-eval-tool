# V2 Agent Eval Tool Roadmap 
## Summary

The Agent Eval Tool is an app framework that uses manual human-in-the-loop evaluation and LLM-as-a-judge methodology to assess agent performance and accuracy. The tool integrates with TDX (Treasure Data) to manage test cases, execute evaluations, and provide comprehensive analysis of agent responses against ground truth data. V2 roadmap focuses on enhancing the user interface to display conversation traces and LLM evaluation results, improving data export capabilities, and streamlining test case management through CSV-to-YAML conversion. Future versions (V3) will expand functionality with manual test case creation, cloud deployment, advanced analytics including error clustering, and multi-reviewer support.

## Items
| ID | Category | Developer     | Requirement                                              | Notes                                                                                                                   |
|----|----------|---------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| D3 | UI       | gwtd1         | Make LLM as a judge results click-to-view                | Dependency on D2; Currently they do not appear at all                                                                   |
| D4 | UI       |               | Export data filtering by rating (False or True)          | V1 exports all evaluations, filter for FALSE test cases                                                                 |
| D2 | TDX      | gwtd1         | LLM as a judge results in evaluation UI frame            | Currently only see the agent output, not the LLM-as-a-judge results                                                     |
| D5 | TDX      | tushar-fde-ai | manual input where claude code converts csv to yml file  | Create a TDX command to upload csv to add test cases to eval.yaml; Currently only TR and Honda have ground truth in csv |
| D1 | UI + BE  |               | Show conversation traces in evaluation                   | Use API call to conversation or Look into using TDX to chat with agent and refactor to return traces                    |
| D6 | UI + BE  | gwtd1         | Query TDX project name/agent after user provides api key | V1 is hardcoded for TDX project name is tdx_default_gregwilliams                                                        |

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
| D17 | Pagination for Previous Test Runs         | The Previous Test Runs need a scroll or pagination on the into screen                         |

