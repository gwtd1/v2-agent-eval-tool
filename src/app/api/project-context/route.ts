import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProject, setCurrentProject, getProjectSource } from '@/lib/session/project-context';

/**
 * GET /api/project-context
 * Returns the current project context (from session or environment)
 */
export async function GET() {
  console.log('[API] GET /api/project-context - Getting current project context');

  const project = getCurrentProject();
  const source = getProjectSource();

  return NextResponse.json({
    project,
    source,
  });
}

/**
 * POST /api/project-context
 * Sets the project context for the current session
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/project-context - Setting project context');

  let body: { project?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { project } = body;

  // Validate project parameter
  if (project !== null && (typeof project !== 'string' || !project.trim())) {
    return NextResponse.json(
      { error: 'project must be a non-empty string or null' },
      { status: 400 }
    );
  }

  // Set current project context
  setCurrentProject(project || null);

  console.log(`[API] Project context set to: ${getCurrentProject() || 'default'}`);

  return NextResponse.json({
    success: true,
    project: getCurrentProject(),
    message: `Project context ${getCurrentProject() ? `set to '${getCurrentProject()}'` : 'cleared'}`,
  });
}