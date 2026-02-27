import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { generateTestCases, formatTestCasesAsYaml } from '../llm/testGenerator';

const execAsync = promisify(exec);

export interface TdxCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TdxExecutorOptions {
  timeout?: number;
  cwd?: string;
}

const DEFAULT_TIMEOUT = 120000; // 2 minutes

export interface ToolCallInfo {
  id?: string;
  functionName: string;
  functionArguments: string;
  content: string;           // Tool result
  status: string;            // "OK" or error
  targetFunction?: string;   // e.g., "READ_TEXT"
  toolTarget?: {
    id?: string;
    type: string;            // e.g., "TextKnowledgeBase"
    name: string;
  };
}

export interface ChatHistoryEntry {
  input?: string;   // User message
  content?: string; // Agent response
  tool?: ToolCallInfo; // Tool call details
  at: string;       // ISO timestamp
}

export interface ChatHistoryResult {
  entries: ChatHistoryEntry[];
  exitCode: number;
  error?: string;
}

/**
 * Execute a TDX CLI command
 */
export async function executeTdxCommand(
  command: string,
  options: TdxExecutorOptions = {}
): Promise<TdxCommandResult> {
  const { timeout = DEFAULT_TIMEOUT, cwd } = options;
  const startTime = Date.now();

  console.log(`[TDX] Executing: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd,
      env: {
        ...process.env,
        // Ensure TDX picks up the API key from environment
        TD_API_KEY: process.env.TD_API_KEY,
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[TDX] Completed in ${duration}ms, exit code: 0`);

    if (stderr) {
      console.warn(`[TDX] stderr: ${stderr}`);
    }

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const execError = error as { stdout?: string; stderr?: string; code?: number; message?: string };
    const exitCode = execError.code || 1;

    console.log(`[TDX] Completed in ${duration}ms, exit code: ${exitCode}`);
    console.log(`[TDX] stdout:\n${execError.stdout || '(empty)'}`);
    console.error(`[TDX] stderr:\n${execError.stderr || execError.message || '(empty)'}`);

    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || 'Unknown error',
      exitCode,
    };
  }
}

/**
 * List all available TDX agents
 */
export async function listTdxAgents(): Promise<TdxCommandResult> {
  return executeTdxCommand('tdx agent list --format json');
}

/**
 * Execute TDX agent test
 */
export async function executeTdxAgentTest(agentPath: string): Promise<TdxCommandResult> {
  // Extract project and agent from path (format: "project/agent" or "agents/project/agent")
  const parts = agentPath.split('/');
  let projectName: string;
  let agentName: string;

  if (parts.length >= 3 && parts[0] === 'agents') {
    // Format: agents/project/agent
    projectName = parts[1];
    agentName = parts[2];
  } else if (parts.length >= 2) {
    // Format: project/agent
    projectName = parts[0];
    agentName = parts[1];
  } else {
    // Just agent name - try to run without project context
    agentName = agentPath;
    projectName = '';
  }

  // Escape for shell safety
  const escapedAgent = agentName.replace(/"/g, '\\"');
  const escapedProject = projectName.replace(/"/g, '\\"');

  // If we have a project, run test with full path
  // TDX automatically detects project from agent path - no need to set project context explicitly
  if (projectName) {
    // TDX requires full path: agents/<project>/<agent>
    const fullPath = `agents/${escapedProject}/${escapedAgent}`;
    // Clear stale TDX session context before running test to prevent "Project not found" errors
    const command = `tdx use --clear && tdx agent test "${fullPath}"`;

    console.log(`[TDX Executor] Executing: ${command}`);
    console.log(`[TDX Executor] Clearing context and auto-detecting project from path: ${fullPath}`);

    return executeTdxCommand(command, {
      timeout: 300000, // 5 minutes for test execution
    });
  }

  // No project context - just run the test
  return executeTdxCommand(`tdx agent test "${escapedAgent}"`, {
    timeout: 300000, // 5 minutes for test execution
  });
}

/**
 * Get agent details
 */
export async function getTdxAgentDetails(agentPath: string): Promise<TdxCommandResult> {
  const escapedPath = agentPath.replace(/"/g, '\\"');
  return executeTdxCommand(`tdx agent show "${escapedPath}" --format json`);
}

/**
 * Check if TDX CLI is available
 */
export async function checkTdxAvailable(): Promise<boolean> {
  const result = await executeTdxCommand('tdx --version');
  return result.exitCode === 0;
}

/**
 * Execute TDX chat command to get actual agent response
 * Uses: tdx chat --new "<prompt>" --agent "<project/agent>"
 */
export async function executeTdxChat(
  agentPath: string,
  prompt: string
): Promise<TdxCommandResult> {
  // Extract project and agent from path
  const parts = agentPath.split('/');
  let projectName: string;
  let agentName: string;

  if (parts.length >= 3 && parts[0] === 'agents') {
    projectName = parts[1];
    agentName = parts[2];
  } else if (parts.length >= 2) {
    projectName = parts[0];
    agentName = parts[1];
  } else {
    agentName = agentPath;
    projectName = '';
  }

  // Escape for shell safety - escape single quotes for the prompt
  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const agentIdentifier = projectName ? `${projectName}/${agentName}` : agentName;
  const escapedAgent = agentIdentifier.replace(/"/g, '\\"');

  // Build command: tdx chat --new '<prompt>' --agent "<agent>"
  const command = `tdx chat --new '${escapedPrompt}' --agent "${escapedAgent}"`;

  console.log(`[TDX Chat] Executing for agent: ${agentIdentifier}`);

  return executeTdxCommand(command, {
    timeout: 120000, // 2 minutes for chat response
  });
}

/**
 * Initialize TDX agent test file (creates test.yml)
 *
 * This function handles the full auto-recovery flow:
 * 1. If agent not pulled locally → run `tdx agent pull`
 * 2. Read agent's prompt.md to understand its purpose
 * 3. Generate meaningful test cases using LLM based on the prompt
 * 4. Create test.yml with agent-specific test cases
 *
 * Note: TDX CLI does not have a `test-init` command, so we create the file directly.
 * The test.yml file is stored locally and read by `tdx agent test`.
 */
export async function initTdxAgentTest(
  agentPath: string,
  apiKey?: string
): Promise<TdxCommandResult> {
  // Extract project and agent from path (format: "project/agent" or "agents/project/agent")
  const parts = agentPath.split('/');
  let projectName: string;
  let agentName: string;

  if (parts.length >= 3 && parts[0] === 'agents') {
    // Format: agents/project/agent
    projectName = parts[1];
    agentName = parts[2];
  } else if (parts.length >= 2) {
    // Format: project/agent
    projectName = parts[0];
    agentName = parts[1];
  } else {
    // Just agent name - cannot create test.yml without project context
    return {
      stdout: '',
      stderr: 'Cannot create test.yml: agent path must include project (e.g., "project/agent")',
      exitCode: 1,
    };
  }

  // Construct the local file path
  const agentDir = path.join(process.cwd(), 'agents', projectName, agentName);
  const testYmlPath = path.join(agentDir, 'test.yml');

  console.log(`[TDX] Initializing test for agent: ${projectName}/${agentName}`);

  // Check if agent directory exists locally, if not pull from TDX
  if (!fs.existsSync(agentDir)) {
    console.log(`[TDX] Agent directory not found locally, pulling from TDX: ${agentDir}`);

    // Pull agent from TDX: tdx agent pull <project> <agent-name>
    const pullResult = await executeTdxCommand(
      `tdx agent pull "${projectName}" "${agentName}"`,
      { timeout: 60000 } // 1 minute for pull
    );

    if (pullResult.exitCode !== 0) {
      console.error(`[TDX] Failed to pull agent: ${pullResult.stderr}`);
      return {
        stdout: pullResult.stdout,
        stderr: `Failed to pull agent from TDX: ${pullResult.stderr}`,
        exitCode: 1,
      };
    }

    console.log(`[TDX] Successfully pulled agent: ${projectName}/${agentName}`);

    // Verify directory now exists after pull
    if (!fs.existsSync(agentDir)) {
      return {
        stdout: '',
        stderr: `Agent pull succeeded but directory not found: ${agentDir}`,
        exitCode: 1,
      };
    }
  }

  // Check if test.yml already exists
  if (fs.existsSync(testYmlPath)) {
    console.log(`[TDX] test.yml already exists at: ${testYmlPath}`);
    return {
      stdout: `test.yml already exists at ${testYmlPath}`,
      stderr: '',
      exitCode: 0,
    };
  }

  // Read the agent's prompt.md to understand its purpose
  const promptPath = path.join(agentDir, 'prompt.md');
  let agentPrompt = '';

  if (fs.existsSync(promptPath)) {
    try {
      agentPrompt = fs.readFileSync(promptPath, 'utf8');
      console.log(`[TDX] Read prompt.md (${agentPrompt.length} chars)`);
    } catch (error) {
      console.warn(`[TDX] Could not read prompt.md: ${error}`);
    }
  }

  let testYmlContent: string;

  // Generate test cases using LLM if API key is available and we have a prompt
  if (apiKey && agentPrompt) {
    console.log(`[TDX] Generating test cases using LLM for agent: ${agentName}`);
    try {
      const testCases = await generateTestCases(agentName, agentPrompt, apiKey);
      testYmlContent = formatTestCasesAsYaml(agentName, testCases);
      console.log(`[TDX] Generated ${testCases.length} test cases using LLM`);
    } catch (error) {
      console.error(`[TDX] Failed to generate test cases with LLM: ${error}`);
      console.log(`[TDX] Falling back to basic template`);
      testYmlContent = generateBasicTemplate(agentName);
    }
  } else {
    console.log(`[TDX] No API key or prompt available, using basic template`);
    testYmlContent = generateBasicTemplate(agentName);
  }

  // Write test.yml
  console.log(`[TDX] Creating test.yml at: ${testYmlPath}`);
  try {
    fs.writeFileSync(testYmlPath, testYmlContent, 'utf8');
    console.log(`[TDX] Successfully created test.yml at: ${testYmlPath}`);
    return {
      stdout: `Successfully created test.yml at ${testYmlPath}`,
      stderr: '',
      exitCode: 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TDX] Failed to create test.yml: ${errorMessage}`);
    return {
      stdout: '',
      stderr: `Failed to create test.yml: ${errorMessage}`,
      exitCode: 1,
    };
  }
}

/**
 * Generate a basic test.yml template when LLM generation is not available.
 */
function generateBasicTemplate(agentName: string): string {
  return `# Test cases for ${agentName}
# Add your test cases below
# Documentation: https://tdx.treasuredata.com/commands/agent.html

tests:
  - name: "Basic test"
    user_input: "Hello"
    criteria: "Agent responds appropriately"
`;
}

/**
 * Extract thread ID from TD Console conversation URL
 * URL format: https://console-next.../tc/019c4f29-04ab-79d8-8573-a9dfbf11f3b1
 */
export function extractThreadIdFromUrl(conversationUrl: string): string | null {
  const match = conversationUrl.match(/\/tc\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Execute TDX LLM history command to get conversation history
 * Uses: tdx llm history <thread_id> --json
 *
 * This retrieves the exact conversation from a previous test run,
 * avoiding the need to create a new chat session.
 */
export async function executeTdxLlmHistory(chatId: string): Promise<ChatHistoryResult> {
  // Escape the chatId for shell safety
  const escapedChatId = chatId.replace(/[^a-f0-9-]/gi, '');

  const result = await executeTdxCommand(`tdx llm history ${escapedChatId} --json`, {
    timeout: 30000, // 30 seconds should be enough for history fetch
  });

  if (result.exitCode === 0) {
    try {
      const entries = JSON.parse(result.stdout) as ChatHistoryEntry[];
      return { entries, exitCode: 0 };
    } catch (parseError) {
      return {
        entries: [],
        exitCode: 1,
        error: `Failed to parse JSON response: ${parseError}`,
      };
    }
  }

  return {
    entries: [],
    exitCode: result.exitCode,
    error: result.stderr || 'Unknown error',
  };
}
