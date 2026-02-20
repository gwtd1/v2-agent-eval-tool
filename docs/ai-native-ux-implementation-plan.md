# AI-Native UX Implementation Plan
## Agent Eval Tool - Claude Integration Strategy

### Executive Summary

This document outlines the strategy to transform the Agent Eval Tool from a slow, dropdown-driven interface into an AI-native conversational experience. Based on research of the AI Suites codebase, we can leverage the Anthropic Claude Agent SDK with Treasure Data's LLM proxy to create a chat-driven evaluation interface that eliminates the current 10+ minute wait times for project/agent selection.

---

## Current UX Problems

### Unacceptable Performance
- **Project loading**: 10 minutes to load project dropdown
- **Agent loading**: Additional 10 minutes after project selection
- **Total wait time**: 20+ minutes before users can start evaluation
- **User friction**: Dropdown navigation doesn't match TDX Claude's AI-native feel

### Architecture Limitations
- **Synchronous TDX CLI calls**: No caching or background loading
- **Blocking UI**: Users wait for complete data load before any interaction
- **No context awareness**: App doesn't remember user preferences or patterns
- **Manual selection**: Forces users through slow dropdown workflows

---

## Research Findings: AI Suites Architecture

### Core Enabling Technology: Auth Proxy Pattern

Based on analysis of `/Users/greg.williams/PycharmProjects/ai-suites`, the key enabler is a local HTTP-to-HTTPS translation proxy:

```typescript
// /electron/services/auth-proxy.ts
// Local proxy on random port (e.g., http://127.0.0.1:54321)
// Translates authentication headers:
// Anthropic SDK sends:   x-api-key: {key}
// TD proxy expects:      Authorization: TD1 {key}

// Allows standard Anthropic SDK to work with TD's LLM proxy
ANTHROPIC_BASE_URL=http://127.0.0.1:54321
```

**Why this matters**: This proxy pattern enables using the official Anthropic Claude Agent SDK with Treasure Data's LLM infrastructure seamlessly.

### Streaming Chat Architecture

```typescript
// /electron/services/chat-session-manager.ts
interface ChatSession {
  sessionId: string;
  query: Query | null;           // Can interrupt/stop
  state: SessionState;           // idle/streaming/interrupted
  messageQueue: StreamingMessage[];
  resolveNext: ((msg: StreamingMessage | null) => void) | null;
}

// Streaming content types:
type StreamSegment =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall };
```

### AI-Native UX Patterns

The AI Suites system achieves AI-native feel through:

1. **Real-time streaming**: Content appears as Claude thinks
2. **Thinking visualization**: Users see Claude's reasoning process
3. **Tool call awareness**: Visual feedback for function calls
4. **Skill detection**: JSON output in code fences triggers UI updates
5. **Context persistence**: Conversations survive app restarts
6. **Multi-parser fallback**: SDK → keyword parser → demo mode

### Key Components

#### IPC API Surface
```typescript
// /electron/preload.ts - Exposed as window.aiSuites
const aiSuitesAPI = {
  chat: {
    startSession(): Promise<{ success: boolean; sessionId?: string }>
    sendToSession(content: string): Promise<{ success: boolean }>
    stopSession(): Promise<void>
    onStream(callback: (event: ChatStreamEvent) => void): () => void
  },
  settings: {
    get(): Promise<Record<string, unknown>>
    set(settings: Record<string, unknown>): Promise<void>
    testConnection(): Promise<{ success: boolean; error?: string }>
  }
};
```

#### State Management with Zustand
```typescript
// /src/stores/chatStore.ts (1700+ lines)
interface ChatState {
  sessionId: string | null;
  sessionActive: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingSegments: StreamSegment[];

  startSession(): Promise<boolean>
  sendMessage(content: string): Promise<void>
  handleStreamEvent(event: ChatStreamEvent): void
  finalizeStream(): void
}
```

#### Multi-Parser Skill Dispatch
```typescript
// When message finishes, system:
// 1. Detects skill output in named code fences
const skillResult = detectSkillOutput(fullText);

// 2. Routes to appropriate store
switch (skillResult.skillName) {
  case 'campaign-brief':
    useBriefStore.updateBriefFromAI(skillResult.data);
    break;
  case 'blueprints':
    useBlueprintStore.addBlueprints(skillResult.data);
    break;
}

// 3. Fallback to keyword parsing if no skill detected
```

---

## Proposed AI-Native Transformation

### Vision: Conversational Evaluation Interface

Replace slow dropdowns with natural language interaction:

#### Current UX (20+ minute workflow):
```
1. User opens app → 10 min wait for projects
2. User selects project → 10 min wait for agents
3. User selects agent → finally ready to test
```

#### AI-Native UX (immediate workflow):
```
User: "Test email agents in Creative Studio"

Claude: "I'll help you test email agents in TD-Managed: Creative Studio.
Found 2 email-related agents:
• Email Campaign Generator
• Email Template Builder

Which would you like to test, or shall I test both?"

User: "Test the campaign generator with 5 cases"

Claude: "Starting evaluation of Email Campaign Generator...
🤔 Analyzing agent capabilities...
🔧 Running test case 1: Basic email generation...
✓ Test 1 PASSED: Generated personalized email with proper structure
🔧 Running test case 2: Missing required fields...
✗ Test 2 FAILED: Missing required personalization tokens
..."
```

### Core Benefits

1. **Zero wait time**: Chat loads instantly with pre-cached context
2. **Natural interaction**: "Test the email agent" vs dropdown navigation
3. **Real-time feedback**: See evaluation progress as it happens
4. **Context awareness**: "Run those same tests again" remembers selections
5. **Error recovery**: "Creative Studio isn't responding, try Brand Guidelines"
6. **Intelligent suggestions**: Based on usage patterns and agent capabilities

---

## Implementation Strategy

### Phase 1: Foundation Infrastructure (1-2 weeks)

#### 1.1 Claude Agent SDK Integration
```typescript
// New: src/lib/claude/client.ts
export class ClaudeEvalClient {
  private authProxy: AuthProxy;
  private sdk: ClaudeAgent;

  async init(apiKey: string, proxyUrl: string) {
    this.authProxy = new AuthProxy(proxyUrl);
    this.sdk = new ClaudeAgent({
      baseURL: this.authProxy.localUrl,
      apiKey: apiKey
    });
  }

  async chatWithContext(message: string, context: EvalContext) {
    const systemPrompt = buildEvalSystemPrompt(context);
    return this.sdk.chat(message, { systemPrompt });
  }
}
```

#### 1.2 Auth Proxy Implementation
```typescript
// New: src/lib/claude/auth-proxy.ts
export class AuthProxy {
  private server: http.Server;
  private localPort: number;

  constructor(private targetProxyUrl: string) {}

  async start(): Promise<string> {
    // Create local HTTP server that translates auth headers
    // Returns: http://127.0.0.1:{randomPort}
  }

  private translateRequest(req: IncomingMessage): RequestOptions {
    // Transform: x-api-key → Authorization: TD1 {key}
  }
}
```

#### 1.3 System Prompt for Evaluation Context
```typescript
const EVAL_SYSTEM_PROMPT = `You are an AI assistant for the Agent Evaluation Tool. You help users:

1. Select TDX projects and agents conversationally
2. Run agent evaluations with real-time feedback
3. Interpret test results and provide insights

AVAILABLE CONTEXT:
Projects: ${context.projects.map(p => p.name).join(', ')}
Current project: ${context.currentProject || 'none'}
Available agents: ${context.agents.map(a => a.name).join(', ')}
Recent selections: ${context.recentSelections}

TOOLS AVAILABLE:
- set_project_context(project: string): Switch to different TDX project
- list_agents(project?: string): Get agents for project
- run_tdx_test(agent: string, testCases?: string[]): Execute agent evaluation
- get_test_history(agent: string): View previous evaluation results

When users ask to "test" or "evaluate" agents, use run_tdx_test.
When users ask to "switch projects", use set_project_context.
Provide conversational, helpful responses with technical depth when appropriate.

Always confirm selections before running tests that take time.`;
```

#### 1.4 Basic Chat Interface
```typescript
// New: src/components/ai/ChatInterface.tsx
export function ChatInterface({ onAgentSelected }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingSegments, setStreamingSegments] = useState<StreamSegment[]>([]);

  const handleUserMessage = async (input: string) => {
    const userMsg = { type: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    setIsStreaming(true);
    const context = await buildEvaluationContext();

    try {
      const stream = await claudeClient.streamChatWithContext(input, context);

      for await (const event of stream) {
        switch (event.type) {
          case 'content':
            appendStreamingContent(event.content);
            break;
          case 'thinking':
            appendThinkingContent(event.content);
            break;
          case 'tool_call':
            handleToolCall(event.toolCall);
            break;
          case 'tool_result':
            updateToolResult(event.toolUseId, event.result);
            break;
        }
      }
    } finally {
      setIsStreaming(false);
      finalizeStreamingMessage();
    }
  };

  return (
    <div className="chat-interface">
      <ChatMessageList
        messages={messages}
        streamingSegments={streamingSegments}
        isStreaming={isStreaming}
      />
      <ChatInput
        onSubmit={handleUserMessage}
        disabled={isStreaming}
        placeholder="Ask me to test agents, switch projects, or run evaluations..."
      />
    </div>
  );
}
```

### Phase 2: AI-Powered Selection Interface (1 week)

#### 2.1 Replace Dropdown with Conversational UI
```typescript
// Enhanced: src/components/agent/AIChatSelector.tsx
export function AIChatSelector({ onSelection }: Props) {
  const { projects, agents, isLoading } = useProjectAgentData();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      type: 'assistant',
      content: `Hi! I can help you select and test TDX agents. I have access to ${projects.length} projects with ${agents.length} total agents.\n\nTry saying:\n• "Show me Creative Studio agents"\n• "Test the email agent with 5 cases"\n• "Switch to Brand Guidelines project"`
    }
  ]);

  const handleSelection = useCallback((selection: AgentSelection) => {
    // Validate selection against available data
    const isValid = validateSelection(selection, { projects, agents });
    if (isValid) {
      onSelection(selection);
    } else {
      // Handle invalid selection gracefully
      addAssistantMessage("I couldn't find that agent/project. Let me show you what's available...");
    }
  }, [projects, agents, onSelection]);

  return (
    <div className="ai-chat-selector">
      <ChatInterface
        initialMessages={chatHistory}
        onAgentSelected={handleSelection}
        context={{ projects, agents, recentSelections: getRecentSelections() }}
      />
    </div>
  );
}
```

#### 2.2 Selection Parsing and Validation
```typescript
// New: src/lib/claude/selection-parser.ts
export interface AgentSelection {
  project: string;
  agent: string;
  testCases?: string[];
  evaluationMode?: 'manual' | 'llm-judge' | 'both';
}

export function parseSelectionFromResponse(response: string): AgentSelection | null {
  // Look for structured output in code fences
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as AgentSelection;
    } catch (e) {
      console.warn('Failed to parse JSON selection:', e);
    }
  }

  // Fallback to keyword extraction
  return extractSelectionFromText(response);
}

function extractSelectionFromText(text: string): AgentSelection | null {
  // Extract project mentions: "Creative Studio", "TD-Managed: Creative Studio"
  const projectMatch = text.match(/(?:project[:\s]+)?["']?([^"'\n]+Creative Studio[^"'\n]*)["']?/i);

  // Extract agent mentions: "email agent", "Email Campaign Generator"
  const agentMatch = text.match(/(?:agent[:\s]+)?["']?([^"'\n]*(?:email|campaign|generator)[^"'\n]*)["']?/i);

  if (projectMatch && agentMatch) {
    return {
      project: projectMatch[1].trim(),
      agent: agentMatch[1].trim()
    };
  }

  return null;
}
```

### Phase 3: Streaming Evaluation Experience (2 weeks)

#### 3.1 Real-Time Test Execution UI
```typescript
// New: src/components/evaluation/StreamingEvalView.tsx
export function StreamingEvalView({ agent, testCases }: Props) {
  const [evalState, setEvalState] = useState<EvalStreamState>({
    phase: 'initializing',
    thinking: '',
    currentTest: null,
    completedTests: [],
    toolCalls: [],
    llmJudgeResults: []
  });

  const startEvaluation = async () => {
    setEvalState(s => ({ ...s, phase: 'starting' }));

    const stream = claudeClient.streamEvaluation({
      agent,
      testCases,
      instruction: `Run comprehensive evaluation of ${agent.name}. For each test case:
      1. Execute the test using TDX CLI
      2. Analyze the agent's response
      3. Provide detailed pass/fail reasoning
      4. Suggest improvements if the test fails

      Show your thinking process and provide real-time updates.`
    });

    for await (const event of stream) {
      switch (event.type) {
        case 'thinking':
          setEvalState(s => ({
            ...s,
            thinking: s.thinking + event.content,
            phase: 'analyzing'
          }));
          break;

        case 'tool_call':
          if (event.tool === 'run_tdx_test') {
            setEvalState(s => ({
              ...s,
              phase: 'testing',
              currentTest: {
                name: event.input.testCase,
                status: 'running',
                startTime: new Date()
              },
              toolCalls: [...s.toolCalls, {
                id: event.toolUseId,
                tool: event.tool,
                input: event.input,
                status: 'running'
              }]
            }));
          }
          break;

        case 'tool_result':
          const toolCall = evalState.toolCalls.find(tc => tc.id === event.toolUseId);
          if (toolCall) {
            // Parse TDX test result
            const testResult = parseTdxTestResult(event.result);

            setEvalState(s => ({
              ...s,
              currentTest: null,
              completedTests: [...s.completedTests, {
                ...s.currentTest!,
                status: testResult.status,
                result: testResult,
                endTime: new Date()
              }],
              toolCalls: s.toolCalls.map(tc =>
                tc.id === event.toolUseId
                  ? { ...tc, result: event.result, status: 'completed' }
                  : tc
              )
            }));
          }
          break;

        case 'content':
          // LLM judge analysis
          const judgeResult = parseLLMJudgeOutput(event.content);
          if (judgeResult) {
            setEvalState(s => ({
              ...s,
              llmJudgeResults: [...s.llmJudgeResults, judgeResult]
            }));
          }
          break;
      }
    }

    setEvalState(s => ({ ...s, phase: 'completed' }));
  };

  return (
    <div className="streaming-eval-view">
      <EvalPhaseIndicator phase={evalState.phase} />

      {evalState.thinking && (
        <ThinkingBlock
          content={evalState.thinking}
          isActive={evalState.phase === 'analyzing'}
        />
      )}

      <TestProgress
        currentTest={evalState.currentTest}
        completedTests={evalState.completedTests}
        totalTests={testCases.length}
      />

      <ToolCallsList
        calls={evalState.toolCalls}
        onCallExpand={handleToolCallExpand}
      />

      <LLMJudgeResults
        results={evalState.llmJudgeResults}
        isStreaming={evalState.phase !== 'completed'}
      />
    </div>
  );
}
```

#### 3.2 Enhanced Tool Definitions
```typescript
// New: src/lib/claude/eval-tools.ts
export const EVAL_TOOLS = [
  {
    name: 'set_project_context',
    description: 'Switch to a different TDX LLM project',
    parameters: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project name (e.g., "TD-Managed: Creative Studio")'
        }
      },
      required: ['project']
    }
  },
  {
    name: 'list_agents',
    description: 'List agents available in current or specified project',
    parameters: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Optional project name to list agents for'
        },
        filter: {
          type: 'string',
          description: 'Optional filter for agent names (e.g., "email", "campaign")'
        }
      }
    }
  },
  {
    name: 'run_tdx_test',
    description: 'Execute TDX agent test cases and return results',
    parameters: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description: 'Agent name or path'
        },
        testCases: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific test case names to run (optional, runs all if not specified)'
        },
        evaluationMode: {
          type: 'string',
          enum: ['manual', 'llm-judge', 'both'],
          description: 'How to evaluate results'
        }
      },
      required: ['agent']
    }
  },
  {
    name: 'analyze_test_results',
    description: 'Analyze and provide insights on test execution results',
    parameters: {
      type: 'object',
      properties: {
        results: {
          type: 'object',
          description: 'Test execution results from run_tdx_test'
        },
        focusAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific areas to focus analysis on'
        }
      },
      required: ['results']
    }
  }
];
```

#### 3.3 Tool Implementation Handlers
```typescript
// New: src/lib/claude/tool-handlers.ts
export class EvalToolHandlers {
  constructor(
    private tdxExecutor: TdxExecutor,
    private projectContext: ProjectContextManager
  ) {}

  async handleSetProjectContext(params: { project: string }) {
    try {
      await this.projectContext.setProject(params.project);
      const agents = await this.tdxExecutor.listAgents();

      return {
        success: true,
        message: `Switched to project: ${params.project}`,
        agents: agents.map(a => a.name),
        agentCount: agents.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: 'Try listing available projects first or check project name spelling'
      };
    }
  }

  async handleRunTdxTest(params: {
    agent: string;
    testCases?: string[];
    evaluationMode?: string
  }) {
    const startTime = new Date();

    try {
      // Start TDX test execution
      const result = await this.tdxExecutor.executeTest(params.agent, {
        testCases: params.testCases,
        timeout: 300000 // 5 minute timeout
      });

      // Parse results for structured output
      const parsedResults = this.parseTestResults(result);

      return {
        success: true,
        agent: params.agent,
        executionTime: Date.now() - startTime.getTime(),
        results: parsedResults,
        summary: this.generateTestSummary(parsedResults),
        rawOutput: result.stdout
      };
    } catch (error) {
      return {
        success: false,
        agent: params.agent,
        error: error.message,
        suggestion: this.generateErrorSuggestion(error),
        executionTime: Date.now() - startTime.getTime()
      };
    }
  }

  private parseTestResults(result: TdxCommandResult): ParsedTestResults {
    // Enhanced version of existing parser with more detailed extraction
    const testCases = extractTestCasesFromOutput(result.stdout);

    return {
      totalTests: testCases.length,
      passCount: testCases.filter(t => t.status === 'pass').length,
      failCount: testCases.filter(t => t.status === 'fail').length,
      errorCount: testCases.filter(t => t.status === 'error').length,
      testCases: testCases.map(tc => ({
        ...tc,
        llmEvaluation: tc.tdxEvaluation,
        conversationUrl: tc.chatLink
      }))
    };
  }

  private generateTestSummary(results: ParsedTestResults): string {
    const { totalTests, passCount, failCount, errorCount } = results;
    const successRate = ((passCount / totalTests) * 100).toFixed(1);

    return `Executed ${totalTests} tests: ${passCount} passed (${successRate}%), ${failCount} failed, ${errorCount} errors`;
  }

  private generateErrorSuggestion(error: Error): string {
    if (error.message.includes('not found')) {
      return 'Agent may not exist in current project. Try listing available agents first.';
    }
    if (error.message.includes('timeout')) {
      return 'Test execution took too long. Consider reducing test case count or checking agent performance.';
    }
    if (error.message.includes('permission')) {
      return 'Check API key permissions and project access rights.';
    }
    return 'Check TDX CLI availability and project context.';
  }
}
```

---

## API Integration Requirements

### Environment Variables
```bash
# Required for Claude integration
TD_API_KEY=your_treasure_data_api_key
TD_LLM_PROXY_URL=https://llm-proxy.us01.treasuredata.com

# Optional configuration
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TIMEOUT_MS=60000

# Existing TDX configuration (unchanged)
TDX_PROJECT=your_default_project
```

### Package Dependencies
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.0",
    "zustand": "^4.4.1",
    "react-markdown": "^8.0.7",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

---

## File Structure Changes

### New Files to Create
```
src/lib/claude/
├── client.ts                    # ClaudeEvalClient main class
├── auth-proxy.ts               # Local HTTP-to-HTTPS proxy
├── tool-handlers.ts            # Tool implementation handlers
├── eval-tools.ts               # Tool definitions for Claude
├── selection-parser.ts         # Parse agent/project selections
├── context-builder.ts          # Build system prompt context
└── stream-processor.ts         # Handle streaming events

src/components/ai/
├── ChatInterface.tsx           # Main chat component
├── ChatMessage.tsx             # Individual message display
├── ChatInput.tsx               # Message input with send button
├── ThinkingBlock.tsx           # Thinking process visualization
├── ToolCallDisplay.tsx         # Tool execution progress
└── AIChatSelector.tsx          # AI-powered selector replacement

src/components/evaluation/
├── StreamingEvalView.tsx       # Real-time evaluation UI
├── EvalPhaseIndicator.tsx      # Current phase display
├── TestProgress.tsx            # Test execution progress
└── LLMJudgeResults.tsx         # Enhanced judge results

src/stores/
├── chatStore.ts                # Chat state management
├── evalStore.ts                # Evaluation session state
└── claudeStore.ts              # Claude client state

src/app/api/claude/
├── chat/route.ts               # Chat endpoint
├── stream/route.ts             # Streaming endpoint
└── tools/route.ts              # Tool execution endpoint
```

### Modified Files
```
src/components/agent/AgentSelector.tsx    # Add AI chat option toggle
src/app/page.tsx                          # Integrate AIChatSelector
src/lib/tdx/executor.ts                   # Add Claude integration hooks
package.json                              # Add new dependencies
.env.example                              # Add Claude config examples
```

---

## Testing Strategy

### Phase 1 Testing (Foundation)
- [ ] Auth proxy correctly translates TD authentication
- [ ] Claude client connects and responds to basic queries
- [ ] Chat interface renders and handles user input
- [ ] Streaming events display correctly in UI

### Phase 2 Testing (Selection)
- [ ] Agent/project selection parsing works accurately
- [ ] Invalid selections handled gracefully
- [ ] Context awareness works (remembers recent selections)
- [ ] Fallback to dropdown if AI selection fails

### Phase 3 Testing (Evaluation)
- [ ] Real-time test execution updates correctly
- [ ] Tool call results parsed and displayed
- [ ] LLM judge analysis integrates seamlessly
- [ ] Error handling for failed test executions

### Integration Testing
- [ ] End-to-end: "Test email agent" → evaluation completion
- [ ] Performance: Response times under 2 seconds for chat
- [ ] Reliability: Graceful degradation if Claude API unavailable
- [ ] Security: API key handling and validation

---

## Success Metrics

### Performance Improvements
- **Project/agent selection**: From 20+ minutes → under 10 seconds
- **First response**: Chat loads and responds within 2 seconds
- **Context switching**: Project changes complete in under 5 seconds
- **Evaluation feedback**: Real-time updates every 1-2 seconds during tests

### User Experience Improvements
- **Conversation flow**: Natural language replaces dropdown navigation
- **Context awareness**: App remembers user patterns and preferences
- **Real-time feedback**: Users see progress during long-running evaluations
- **Error recovery**: Intelligent suggestions when things go wrong
- **Learning curve**: New users can start testing without learning UI

### Technical Benefits
- **Caching intelligence**: Smart background loading based on usage
- **API efficiency**: Batch operations and optimistic updates
- **Extensibility**: Easy to add new evaluation modes and analysis types
- **Maintainability**: Clean separation between chat logic and evaluation logic

---

## Risk Mitigation

### Technical Risks

**Risk**: Claude API availability or rate limits
**Mitigation**: Fallback to original dropdown interface, request queuing

**Risk**: Auth proxy security concerns
**Mitigation**: Local-only proxy, no external network access, secure credential handling

**Risk**: Streaming performance with large responses
**Mitigation**: Response chunking, lazy loading, progress indicators

**Risk**: Tool call failures during evaluation
**Mitigation**: Retry logic, graceful degradation, detailed error messages

### UX Risks

**Risk**: Users prefer traditional UI over chat
**Mitigation**: Toggle option to switch between chat and dropdown interfaces

**Risk**: AI responses too verbose or unclear
**Mitigation**: Prompt engineering, response templates, user feedback integration

**Risk**: Learning curve for chat interface
**Mitigation**: Guided onboarding, example prompts, progressive disclosure

---

## Implementation Timeline

### Week 1-2: Foundation Infrastructure
- [ ] Set up Claude Agent SDK integration
- [ ] Implement auth proxy for TD LLM access
- [ ] Create basic chat interface components
- [ ] Set up streaming message pipeline
- [ ] Add tool definition framework

### Week 3: AI-Powered Selection
- [ ] Build conversational project/agent selector
- [ ] Implement context-aware system prompts
- [ ] Add selection parsing and validation
- [ ] Create toggle between chat and dropdown interfaces

### Week 4-5: Streaming Evaluation
- [ ] Integrate TDX test execution with Claude
- [ ] Build real-time evaluation UI components
- [ ] Add thinking visualization and progress tracking
- [ ] Implement tool call status and result display

### Week 6: Polish and Testing
- [ ] Comprehensive testing of all user flows
- [ ] Performance optimization and caching
- [ ] Error handling and graceful degradation
- [ ] Documentation and user guide creation

---

## Future Enhancements

### Advanced AI Features (V2)
- **Evaluation insights**: "This agent consistently fails on edge cases"
- **Test case generation**: "Generate 10 test cases for email personalization"
- **Performance analysis**: "Compare this agent's performance over time"
- **Recommendation engine**: "Based on your usage, you might want to test the Brand Guidelines agent"

### Integration Expansions (V3)
- **Voice commands**: "Hey Claude, test the email agent"
- **Slack integration**: Post evaluation results to team channels
- **Dashboard analytics**: Visual insights across all evaluations
- **Multi-user collaboration**: Share evaluation sessions and insights

### Enterprise Features (V4)
- **Custom evaluation criteria**: Domain-specific pass/fail logic
- **Batch evaluation**: Test multiple agents simultaneously
- **Regression testing**: Automatic re-evaluation on agent updates
- **Compliance reporting**: Audit trails and governance features

---

## Conclusion

This AI-native transformation will fundamentally change how users interact with the Agent Eval Tool. By leveraging the same Claude integration patterns used in AI Suites, we can eliminate the current 20+ minute wait times and replace them with an intelligent, conversational interface that feels natural and responsive.

The three-phase implementation approach ensures we can deliver incremental value while building toward a comprehensive AI-native experience. The auth proxy pattern is the key enabler that makes this transformation possible with minimal architectural changes to the existing Next.js application.

Users will go from fighting slow dropdowns to having natural conversations: "Test the email agent with 5 cases and show me detailed reasoning for any failures." This matches the AI-native experience they expect from TDX Claude and positions the Agent Eval Tool as a modern, intelligent evaluation platform.