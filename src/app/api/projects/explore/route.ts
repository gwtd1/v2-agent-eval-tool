import { NextResponse } from 'next/server';
import { createTdLlmClient } from '@/lib/api/llm-client';

export interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  agentCount: number;
  agents: Array<{
    id: string;
    name: string;
    project_id: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectExplorerResponse {
  projects: ProjectDetails[];
  totalProjects: number;
  totalAgents: number;
  performance: {
    duration_ms: number;
    approach: string;
  };
  apiStatus: 'connected' | 'error';
  timestamp: string;
  suggestions?: string[];
}

export async function GET() {
  console.log('[API] GET /api/projects/explore - Fetching detailed project data');
  const startTime = Date.now();

  try {
    // Use the TD LLM API client from Feature #1
    const client = createTdLlmClient();
    console.log('[API] Created TD LLM client, fetching projects and agents...');

    // Use parallel API calls for optimal performance
    const { projects, agents } = await client.getProjectsAndAgents();
    console.log(`[API] Fetched ${projects.length} projects and ${agents.length} agents`);

    // Enhance projects with agent details and counts
    const projectDetails: ProjectDetails[] = projects.map(project => {
      const projectAgents = agents.filter(agent => agent.attributes?.projectId === project.id);

      return {
        id: project.id,
        name: project.attributes?.name || 'Unnamed Project',
        description: project.attributes?.description || null,
        agentCount: projectAgents.length,
        agents: projectAgents.map(agent => ({
          id: agent.id,
          name: agent.attributes?.name || 'Unnamed Agent',
          project_id: agent.attributes?.projectId || agent.project_id
        })),
        created_at: project.attributes?.createdAt || project.created_at,
        updated_at: project.attributes?.updatedAt || project.updated_at
      };
    });

    // Sort by agent count (most agents first) and then by name
    projectDetails.sort((a, b) => {
      if (a.agentCount !== b.agentCount) {
        return b.agentCount - a.agentCount;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    const duration = Date.now() - startTime;
    console.log(`[API] Project exploration completed in ${duration}ms`);
    console.log(`[API] Found ${projectDetails.length} projects with ${agents.length} total agents`);

    const response: ProjectExplorerResponse = {
      projects: projectDetails,
      totalProjects: projects.length,
      totalAgents: agents.length,
      performance: {
        duration_ms: duration,
        approach: 'parallel_api_calls'
      },
      apiStatus: 'connected',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Project exploration failed after ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isAuthError = errorMessage.includes('401') || errorMessage.includes('unauthorized');
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('ENOTFOUND');

    let suggestions: string[] = [];

    if (isAuthError) {
      suggestions = [
        'Verify your TD_API_KEY is valid and not expired',
        'Ensure your API key has project listing permissions',
        'Try regenerating your API key in Treasure Data console'
      ];
    } else if (isNetworkError) {
      suggestions = [
        'Check your internet connection',
        'Verify TD_LLM_BASE_URL configuration',
        'Check if Treasure Data API is accessible from your network'
      ];
    } else {
      suggestions = [
        'Verify TD_API_KEY is set in environment variables',
        'Check TD_LLM_BASE_URL configuration',
        'Ensure your API key has required permissions',
        'Try setting USE_DIRECT_API=false to use TDX CLI fallback'
      ];
    }

    const errorResponse: ProjectExplorerResponse = {
      projects: [],
      totalProjects: 0,
      totalAgents: 0,
      performance: {
        duration_ms: duration,
        approach: 'failed_api_call'
      },
      apiStatus: 'error',
      timestamp: new Date().toISOString(),
      suggestions
    };

    return NextResponse.json({
      ...errorResponse,
      error: errorMessage
    }, { status: 500 });
  }
}