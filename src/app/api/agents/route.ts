import { NextResponse } from 'next/server';
import { checkTdxAvailable, listTdxAgents } from '@/lib/tdx/executor';
import { parseAgentListOutput } from '@/lib/tdx/parser';
import { getCurrentProject } from '@/lib/session/project-context';

export async function GET() {
  console.log('[API] GET /api/agents - Fetching agent list');

  // Check TDX CLI availability
  const tdxAvailable = await checkTdxAvailable();
  if (!tdxAvailable) {
    console.error('[API] TDX CLI not available');
    return NextResponse.json(
      { error: 'TDX CLI not available. Please ensure tdx is installed and in PATH.' },
      { status: 503 }
    );
  }

  // Get current project context and execute tdx agent list
  const currentProject = getCurrentProject();
  const result = await listTdxAgents(currentProject || undefined);

  if (result.exitCode !== 0) {
    console.error('[API] TDX agent list failed:', result.stderr);
    return NextResponse.json(
      { error: 'Failed to list agents', details: result.stderr },
      { status: 500 }
    );
  }

  // Parse the output
  const agents = parseAgentListOutput(result.stdout);
  console.log(`[API] Found ${agents.length} agents`);

  // Group agents by project
  const agentsByProject: Record<string, typeof agents> = {};
  for (const agent of agents) {
    if (!agentsByProject[agent.project]) {
      agentsByProject[agent.project] = [];
    }
    agentsByProject[agent.project].push(agent);
  }

  return NextResponse.json({
    agents,
    byProject: agentsByProject,
    count: agents.length,
  });
}
