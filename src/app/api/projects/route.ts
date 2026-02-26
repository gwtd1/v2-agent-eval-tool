import { NextResponse } from 'next/server';
import { createTdLlmClient } from '@/lib/api/llm-client';

/**
 * Projects API endpoint with server-side pagination support
 * GET /api/projects?page=0&limit=50 - Returns paginated projects
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  console.log(`[API] GET /api/projects - page=${page}, limit=${limit}`);

  try {
    console.log('[API] Fetching projects with server-side pagination...');
    const startTime = Date.now();

    // Create API client
    const client = createTdLlmClient();

    // Try server-side pagination first
    try {
      const projects = await client.getProjectsPaginated(page, limit);
      const duration = Date.now() - startTime;
      console.log(`[API] Server-side pagination successful: ${projects.length} projects in ${duration}ms`);

      return NextResponse.json({
        projects: projects,
        page: page,
        limit: limit,
        count: projects.length,
        hasMore: projects.length === limit, // If we got exactly limit, there might be more
        method: 'direct_api',
        pagination: 'server_side',
        performance: {
          duration_ms: duration,
          approach: 'server_side_pagination'
        }
      });
    } catch (paginationError) {
      console.warn('[API] Server-side pagination failed, falling back to client-side:', paginationError);

      // Fallback: Client-side pagination
      const allProjects = await client.getProjects();
      const offset = page * limit;
      const paginatedProjects = allProjects.slice(offset, offset + limit);
      const hasMore = offset + limit < allProjects.length;

      const duration = Date.now() - startTime;
      console.log(`[API] Client-side pagination fallback: ${paginatedProjects.length} projects in ${duration}ms`);

      return NextResponse.json({
        projects: paginatedProjects,
        page: page,
        limit: limit,
        total: allProjects.length,
        count: paginatedProjects.length,
        hasMore: hasMore,
        method: 'direct_api',
        pagination: 'client_side_fallback',
        performance: {
          duration_ms: duration,
          approach: 'client_side_pagination'
        }
      });
    }

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