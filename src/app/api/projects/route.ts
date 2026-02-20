import { NextResponse } from 'next/server';
import { checkTdxAvailable, executeTdxCommand } from '@/lib/tdx/executor';
import { getCurrentProject } from '@/lib/session/project-context';

export async function GET() {
  console.log('[API] GET /api/projects - Fetching project list');

  // Check TDX CLI availability
  const tdxAvailable = await checkTdxAvailable();
  if (!tdxAvailable) {
    console.error('[API] TDX CLI not available');
    return NextResponse.json(
      { error: 'TDX CLI not available. Please ensure tdx is installed and in PATH.' },
      { status: 503 }
    );
  }

  // Execute tdx llm projects command
  const result = await executeTdxCommand('tdx llm projects');

  if (result.exitCode !== 0) {
    console.error('[API] TDX llm projects failed:', result.stderr);
    return NextResponse.json(
      { error: 'Failed to list projects', details: result.stderr },
      { status: 500 }
    );
  }

  // Parse the project list output (simple line-based format)
  const projects = parseProjectListOutput(result.stdout);
  console.log(`[API] Found ${projects.length} projects`);

  // Get current project for indicating which one is selected
  const currentProject = getCurrentProject();

  return NextResponse.json({
    projects,
    currentProject,
    count: projects.length,
  });
}

/**
 * Parse TDX project list output into structured format
 * Expected formats:
 * - "tdx_default_username"
 * - "TD-Managed: Creative Studio"
 * - Project names may have various formats
 */
function parseProjectListOutput(output: string): Array<{ name: string; type: string }> {
  const projects: Array<{ name: string; type: string }> = [];
  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers, empty lines, or status messages
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('Project') ||
      trimmed.toLowerCase().includes('loading') ||
      trimmed.toLowerCase().includes('fetching')
    ) {
      continue;
    }

    // Determine project type based on naming convention
    let type = 'personal';
    if (trimmed.startsWith('TD-Managed:') || trimmed.includes('Managed')) {
      type = 'managed';
    } else if (trimmed.includes('_default_')) {
      type = 'personal';
    }

    projects.push({
      name: trimmed,
      type,
    });
  }

  return projects;
}