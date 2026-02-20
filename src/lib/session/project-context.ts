/**
 * Simple in-memory project context storage for single-user application
 * In a multi-user environment, this would use session cookies or database storage
 */

let currentProject: string | null = null;

export function getCurrentProject(): string | null {
  return currentProject || process.env.TDX_PROJECT || null;
}

export function setCurrentProject(project: string | null): void {
  currentProject = project;
}

export function clearCurrentProject(): void {
  currentProject = null;
}

export function getProjectSource(): 'session' | 'environment' | 'none' {
  if (currentProject) return 'session';
  if (process.env.TDX_PROJECT) return 'environment';
  return 'none';
}