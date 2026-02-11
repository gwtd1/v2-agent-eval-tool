import { exec } from 'child_process';
import { promisify } from 'util';

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

  // If we have a project, set context first then run test with full path
  if (projectName) {
    // TDX requires full path: agents/<project>/<agent>
    const fullPath = `agents/${escapedProject}/${escapedAgent}`;
    const command = `tdx use llm_project "${escapedProject}" && tdx agent test "${fullPath}"`;
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
 * Initialize TDX agent test file (creates test.yml)
 */
export async function initTdxAgentTest(agentPath: string): Promise<TdxCommandResult> {
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

  // If we have a project, set context first then run test-init with full path
  if (projectName) {
    const fullPath = `agents/${escapedProject}/${escapedAgent}`;
    const command = `tdx use llm_project "${escapedProject}" && tdx agent test-init "${fullPath}"`;
    return executeTdxCommand(command, {
      timeout: 60000, // 1 minute for init
    });
  }

  // No project context - just run the test-init
  return executeTdxCommand(`tdx agent test-init "${escapedAgent}"`, {
    timeout: 60000, // 1 minute for init
  });
}
