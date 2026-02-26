import { NextResponse } from 'next/server';
import { createTdLlmClient } from '@/lib/api/llm-client';

/**
 * Projects-only API endpoint for separate loading pattern
 * GET /api/projects - Returns only projects without agents
 */
export async function GET() {
  console.log('[API] GET /api/projects - Fetching projects only');

  try {
    console.log('[API] Fetching projects...');
    const startTime = Date.now();

    // Create API client
    const client = createTdLlmClient();

    // Fetch only projects (no agents)
    const projects = await client.getProjects();

    const duration = Date.now() - startTime;
    console.log(`[API] Fetched ${projects.length} projects in ${duration}ms`);

    return NextResponse.json({
      projects: projects,
      count: projects.length,
      method: 'direct_api',
      performance: {
        duration_ms: duration,
        approach: 'projects_only_fetch'
      }
    });

  } catch (error) {
    console.error('[API] Projects fetch failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';

    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        details: errorMessage,
        suggestion: 'Check your API key and network connection'
      },
      { status: 500 }
    );
  }
}