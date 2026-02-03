# Agent Eval Tool - Project Planning Prompt

## Project Overview

I am building a new prototype application for the agent eval tool. I would like to plan the build of this app. Create a new docs directory. In this docs directory write a plan for building this app and name it appropriately.

**Important:** Do not write any code. Do not execute any code. This is a planning prompt only.

---

## Documentation References

Read the following documentation from Treasure Data to understand the implementation and product details in further detail:

### 1. Rapid AI Prototyping Starter Pack
**URL**: https://treasure-data.atlassian.net/wiki/spaces/PROD/pages/4750312018/Rapid+AI+Prototyping+Starter+Pack

**Full Context from Document:**

This document establishes the foundational patterns for building TD prototypes with Claude Code and TDX.

**Prerequisites & Tooling:**
- Claude Code installation required
- TDX CLI installed and configured
- Optional: Figma MCP for design extraction

**Authentication Pattern:**
- Use Master API Key from console-development.us01.treasuredata.com
- Agent ID retrieved from Agent Foundry
- Model recommendation: Opus 4.5 with thinking mode enabled

**API Integration Pattern:**
```
TD_API_KEY=your-api-key
TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com
TD_AGENT_ID=your-agent-id
```

**Chat Session Flow:**
1. POST `/api/chats` with JSON:API format to create session
2. POST `/api/chats/{chatId}/continue` with user input
3. Returns streaming SSE responses

**Environment Endpoints:**
| Environment | Base URL |
|-------------|----------|
| Development US | llm-api-development.us01.treasuredata.com |
| Development EU | llm-api-development.eu01.treasuredata.com |
| Staging US | llm-api-staging.us01.treasuredata.com |
| Staging JP | llm-api-staging.treasuredata.co.jp |

**Security Compliance (Approved by Security Team):**
1. Must use basic auth (shared password acceptable for short-lived apps)
2. No hardcoded passwords
3. Use only dummy data (e.g., "Acme Inc.")
4. Must not capture end-user data

**Deployment Pattern:**
- Vercel hobby account for hosting
- Password protection via middleware with SITE_PASSWORD env var
- POST form submission only (never GET)
- Hash cookie tokens with salt, use httpOnly/secure/sameSite flags

---

### 2. DRAFT: Opportunity Assessment - Eval Tool
**URL**: https://treasure-data.atlassian.net/wiki/spaces/~71202095bc5d7d584c4b84877e0ac4de82324e/pages/4765057189/DRAFT+Opportunity+Assessment+-+Eval+Tool

**Full Context from Document:**

This assessment establishes the philosophical and methodological foundation for agent evaluation.

**Core Framework - The Evaluation Lifecycle:**

1. **Writing Requirements**
   - Every agent needs documentation (PRD, ARD, or equivalent)
   - Must define: purpose, success metrics, data requirements, guardrails
   - Requirements serve dual purpose: human validation AND LLM-as-judge criteria

2. **Build Agent**
   - Write system prompts manually (not delegated to LLMs)
   - Forces humans to clarify assumptions and externalize requirements
   - Use GitHub for version control (Agent Foundry lacks this feature)

3. **Ground Truth Test Cases**
   - Truth must be established before evaluation can begin
   - Sources: knowledge bases, trusted web sources
   - **Key Insight**: Use existing Data Workbench queries as ground truth
   - Write prompts explaining business use cases, compare results

4. **LLM as a Judge**
   - Catches formatting errors and orchestration issues
   - **Critical Warning**: Cannot be sole evaluator—human judgment required
   - Issues can go undetected without human oversight

5. **Error Analysis**
   - "No better tradeoff for evals than simple human error analysis"
   - Objective prompts: use ground truth for true/false determination
   - Subjective prompts: require domain expert ("benevolent dictator")
   - Binary response with ability to write explanation logic

6. **Expert Critique/Explanation**
   - Experts provide best judgment on agent correctness
   - Explanations reveal patterns that improve the agent
   - Detail is crucial for systematic improvement

7. **Clustering Labels**
   - LLMs excel at taxonomizing human explanations
   - Cluster errors into annotated categories
   - Prioritizes critical failures for systematic resolution

8. **Prompt Improvements**
   - LLM suggests optimizations based on identified failures
   - Restarts testing pipeline from LLM-as-a-judge stage

**Reference**: Hamel Husain and Shreya Shankar's eval framework (hamel.dev/blog/posts/evals-faq/)

---

### 3. Agent Eval Tool Roadmap
**URL**: https://treasure-data.atlassian.net/wiki/spaces/~71202095bc5d7d584c4b84877e0ac4de82324e/pages/4767449193/DRAFT+Roadmap+-+Agent+Eval+Tool

**Full Context from Document:**

**Problem Statement:**
- CLI-based evaluation has significant limitations
- High overhead in tuning automated judges
- Need accessible platform for non-engineers

**Solution Vision:**
Human Agent Eval Tool - an internal web platform transitioning evaluation to Human-in-the-Loop framework.

**Target Users:**
- Product Managers
- Engineers
- QA Teams
- Customers

**Centralized Evaluation Lifecycle:**
1. Requirement-driven documentation
2. Automated execution of large-scale test batches (30+ prompts via TDX)
3. Streamlined annotation interface for experts

**Key Technical Approaches:**
- Ground-truth data sourced from Data Workbench queries
- LLMs cluster human critiques into actionable error taxonomies
- Transform subjective feedback into structured prompt optimizations

**Future Milestones:**
- Collaborative reporting
- Productized evaluation packages for consistent deployment
- Contextual memory database for synthesizing customer feedback
- Self-correction mechanisms

---

### 4. Eval Interview Notes
**URL**: https://treasure-data.atlassian.net/wiki/spaces/~71202095bc5d7d584c4b84877e0ac4de82324e/pages/4767449215/Eval+Interview+Notes

**Full Context from Document:**

**Wenzheng Discussion (01/29) - Evaluation Strategy & UI Integration:**

*Integration Philosophy:*
- Human intervention essential for visual evaluations
- Agents efficient for text-based outputs
- Human intuition superior for rich media and complex visual responses

*Reporting Requirements:*
- Formal Evaluation Reports required regardless of evaluator type
- Must track system performance over time

*Human-Centric Tasks:*
- Humans manually check each development iteration
- Provide final quality "stamp of approval"
- Fill process steps that cannot be automated

*Platform Architecture:*
- **TDX**: Primary agent execution environment
- **Data Pipeline**: TDX uploads to dedicated Evals Product
- **Presentation Layer**: Evals Product for granular test case review
- **Unidirectional Communication**: TDX → Evals (no write-back)

---

**Tushar Discussion (01/28) - Scaling and Automation Framework:**

*Operational Philosophy:*
- Must remain Human-in-the-Loop
- Urgent need to automate repetitive manual labor
- Goal: Productize evaluation packages (inspired by Honda Agent Evaluation Framework)

*Scale Requirements:*
- **30+ prompts** per evaluation cycle minimum
- No manual typing of prompts
- YAML files store test case batches
- API key connectivity for automated batch execution
- System auto-saves prompts and generates responses
- Only "Error Analysis" left for humans

*Ground Truth Strategy:*
- Leverage existing Data Workbench queries
- Queries from both TD and Customer Data Engineers
- CDP integration to pull queries automatically
- **50 queries minimum** per customer for robust evaluation

---

**Dilyan Discussion (01/27) - Feedback Loops & Contextual Memory:**

*Feedback-Driven Evolution:*
- Real-world customer usage must inform evaluation
- Structured HITL mechanism translates interactions to improvements

*Self-Correction Architecture:*
- Users flag incorrect responses in chat interface
- Users provide clarification within their instance
- Feedback routed to dedicated Context Database
- Common Feedback File as persistent reference
- Creates long-term "memory" for the system

---

## Project Constraints and Requirements

### Deployment Considerations
Remember the first iteration of this project will be a local version of this app, not a version hosted in the cloud with Vercel, but please keep this in mind when organizing the folder structure of this app.

### Core Functionality Focus
The first iteration of the agent eval tool will be highly focused on human error analysis. We will start by making the assumption that the agent is already built and the requirements and test cases of an agent have already been written.

---

## Application Requirements

### Primary Function
The app will be focused on a UI that allows for human error analysis to review a test case, the traces from an agent and the response. Once the reviewer has read this, they can rate the conversation as good or bad. The reviewer will then be able to add notes to the review if necessary.

### Future Considerations
Do not worry about annotation functionality in the first iteration but keep the UI elements in the UI for placement.

---

## UI/UX Specifications

### Layout Structure
On the left side of the UI the user can view all test cases and agents that need to be reviewed. User can select from this list. Or the user can select a next or back button on the right side of the screen in order to quickly move back and forth during review and get into a good user flow.

### Navigation Flow
- Left panel: List of test cases and agents for review
- Right panel: Next/back buttons for quick navigation
- Main area: Review interface for test cases, traces, and responses
- Rating system: Good/bad conversation rating
- Notes section: Optional reviewer notes

---

## Reference Materials

### UI Layout References
Use the following image as a reference for the UI layout I am looking to build: `/Users/greg.williams/Library/Application Support/JetBrains/PyCharm2025.2/scratches/images/eval-2.png`

**Analysis of eval-2.png (Three-Panel Evaluation Interface):**
- **Left Panel**: "All Test Messages" list with thread IDs, creation/update timestamps, selection highlighting
- **Center Panel**: Conversation view with Human message, Tool Call (ID + name), Tool Response, and AI response sections
- **Right Panel**: "Rate Conversation" (Good/Bad radio buttons), Notes textarea, Add Tags section, "Update Annotation" button, Back/Next navigation

Use the following image as a reference of how the field is organizing evals to testing agent for a better understanding of UX and function: `/Users/greg.williams/Library/Application Support/JetBrains/PyCharm2025.2/scratches/images/eval-1.png`

**Analysis of eval-1.png (Evaluation Framework Spreadsheet):**
- **Columns**: ID, Prompt (User Input), Complexity (Low/Medium/High), Vagueness Type (Specific/Truly Vague/Business Vague), Signal Category, Technical Logic & Success Criteria, Agent Response, Ground Truth
- **Test Case IDs**: TC-001 through TC-022+
- **Categories**: Web Browsing, Leads, Ownership, Email, Intent, Service, Cross-Shopping, Config/Exclusion, Finance, Lifecycle, Affinity, Behavior, Data Quality, Multi-Channel, Comparison

---

## Project Dictionary

Understand the project dictionary below for future implementations that will take features from past projects:

### Agent-eval-new
- Synced to Wensheng's eval-cli repo but uses button to select tdx agents and call tdx commands
- UI on top of tdx
- **UX Flow:**
  - Select a project
  - Choose an agent
  - Run test through tdx
- **Buttons:**
  - `bg-yellow-600` button (Create test.yml): Calls direct file creation (no TDX command - creates test.yml file directly) - **Incorrect implementation**
  - `bg-primary` button (Run test): Calls `tdx agent test "{agentPath}"` - **Correct implementation**

### Manual-error-analysis-eval
- Pure chat bot which uses tdx chat to directly connect to claude
- Does not understand tdx commands
- ONLY communicates with Claude through tdx commands

### Test-chat-ui
- Calls agent through tdx
- UI for calling the fact-checker agent
- Calls a specific agent from agent foundry
- **Input Requirements:**
  - API key
  - Agent ID
  - LLM url
  - Local url: http://localhost:3000/chat

---

## Final Instructions

Do not write any code and do not implement any code. Use the context provided about the project to create a plan. Put this plan into a new folder called docs within a new project called agent-eval-tool-v1.