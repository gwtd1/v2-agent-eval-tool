import { NextResponse } from 'next/server';
import { checkTdxAvailable, listTdxAgents } from '@/lib/tdx/executor';
import { parseAgentListOutput } from '@/lib/tdx/parser';
import {
  createTdLlmClient,
  transformApiDataToAgents,
  groupAgentsByProject
} from '@/lib/api/llm-client';

/**
 * Feature Flag: Use direct API calls instead of TDX CLI
 * Set USE_DIRECT_API=true to enable new API approach
 * Falls back to TDX CLI if API fails or flag is false
 */
const USE_DIRECT_API = process.env.USE_DIRECT_API === 'true';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  console.log(`[API] GET /api/agents - projectId: ${projectId || 'all'}`);
  console.log(`[API] Direct API mode: ${USE_DIRECT_API}`);

  // Try direct API approach first if enabled
  if (USE_DIRECT_API) {
    const apiResult = await tryDirectApiApproach(projectId);
    if (apiResult) {
      return apiResult;
    }
    // API failed, fall through to TDX CLI fallback
    console.warn('[API] Direct API approach failed, falling back to TDX CLI');
  }

  // TDX CLI fallback approach (original implementation)
  return await fallbackToTdxCli(projectId);
}

/**
 * Direct API approach - 3-5x performance improvement
 * Project-specific or all agents depending on projectId parameter
 */
async function tryDirectApiApproach(projectId: string | null): Promise<NextResponse | null> {
  try {
    console.log(`[API] Attempting direct TD LLM API approach for project: ${projectId || 'all'}`);
    const startTime = Date.now();

    // Create API client
    const client = createTdLlmClient();

    if (projectId) {
      // Project-specific agent loading
      const [projects, agents] = await Promise.all([
        client.getProjects(), // Still need projects for metadata
        client.getAgents(projectId) // Filtered agents for this project
      ]);

      const transformedAgents = transformApiDataToAgents(projects, agents);
      const agentsByProject = groupAgentsByProject(projects, agents);

      const duration = Date.now() - startTime;
      console.log(`[API] Project-specific API completed in ${duration}ms`);
      console.log(`[API] Found ${transformedAgents.length} agents for project ${projectId}`);

      return NextResponse.json({
        agents: transformedAgents,
        byProject: agentsByProject,
        projects: projects,
        projectId: projectId,
        count: transformedAgents.length,
        method: 'direct_api',
        performance: {
          duration_ms: duration,
          approach: 'project_filtered_fetch'
        }
      });
    } else {
      // Load all agents (legacy behavior for backward compatibility)
      const { projects, agents } = await client.getProjectsAndAgents();

      const transformedAgents = transformApiDataToAgents(projects, agents);
      const agentsByProject = groupAgentsByProject(projects, agents);

      const duration = Date.now() - startTime;
      console.log(`[API] Direct API completed in ${duration}ms`);
      console.log(`[API] Found ${transformedAgents.length} agents across ${Object.keys(agentsByProject).length} projects`);

      return NextResponse.json({
        agents: transformedAgents,
        byProject: agentsByProject,
        projects: projects,
        count: transformedAgents.length,
        method: 'direct_api',
        performance: {
          duration_ms: duration,
          approach: 'parallel_http_calls'
        }
      });
    }

  } catch (error) {
    console.error('[API] Direct API approach failed:', error);

    // Don't return error response here - let it fall back to CLI
    return null;
  }
}

/**
 * TDX CLI fallback approach (original implementation)
 * Maintained for compatibility and error recovery
 */
async function fallbackToTdxCli(projectId: string | null): Promise<NextResponse> {
  console.log(`[API] Using TDX CLI fallback approach for project: ${projectId || 'all'}`);
  const startTime = Date.now();

  // Check TDX CLI availability
  const tdxAvailable = await checkTdxAvailable();
  if (!tdxAvailable) {
    console.error('[API] TDX CLI not available');
    return NextResponse.json(
      {
        error: 'TDX CLI not available. Please ensure tdx is installed and in PATH.',
        suggestion: 'Try enabling USE_DIRECT_API=true for API-based agent listing'
      },
      { status: 503 }
    );
  }

  // Execute tdx agent list
  const result = await listTdxAgents();

  if (result.exitCode !== 0) {
    console.error('[API] TDX agent list failed:', result.stderr);
    return NextResponse.json(
      {
        error: 'Failed to list agents',
        details: result.stderr,
        suggestion: 'Try enabling USE_DIRECT_API=true for API-based agent listing'
      },
      { status: 500 }
    );
  }

  // Parse the output
  const agents = parseAgentListOutput(result.stdout);
  console.log(`[API] Found ${agents.length} agents`);

  // Group agents by project (path-based inference)
  const agentsByProject: Record<string, typeof agents> = {};
  for (const agent of agents) {
    if (!agentsByProject[agent.project]) {
      agentsByProject[agent.project] = [];
    }
    agentsByProject[agent.project].push(agent);
  }

  const duration = Date.now() - startTime;
  console.log(`[API] TDX CLI completed in ${duration}ms`);

  // Filter agents by project if projectId is specified
  let filteredAgents = agents;
  let filteredAgentsByProject = agentsByProject;

  if (projectId) {
    // Note: CLI fallback doesn't have clean project filtering
    // This is a limitation of the TDX CLI approach
    console.warn(`[API] TDX CLI doesn't support project filtering for project: ${projectId}`);
    console.warn('[API] Consider enabling USE_DIRECT_API=true for project-specific agent loading');
  }

  return NextResponse.json({
    agents: filteredAgents,
    byProject: filteredAgentsByProject,
    projectId: projectId,
    count: filteredAgents.length,
    method: 'tdx_cli_fallback',
    performance: {
      duration_ms: duration,
      approach: 'subprocess_execution'
    }
  });
}
