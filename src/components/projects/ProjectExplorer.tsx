'use client';

import { useEffect, useState } from 'react';

interface ProjectDetails {
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

interface ProjectExplorerData {
  projects: ProjectDetails[];
  totalProjects: number;
  totalAgents: number;
  performance: {
    duration_ms: number;
    approach: string;
  };
  apiStatus: 'connected' | 'error';
  timestamp: string;
  error?: string;
  suggestions?: string[];
}

export function ProjectExplorer() {
  const [data, setData] = useState<ProjectExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      console.log('[ProjectExplorer] Fetching project data...');
      const startTime = Date.now();

      try {
        const response = await fetch('/api/projects/explore');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch projects');
        }

        setData(result);
        const clientDuration = Date.now() - startTime;
        console.log(`[ProjectExplorer] Data loaded in ${clientDuration}ms (API: ${result.performance?.duration_ms}ms)`);

      } catch (err) {
        console.error('[ProjectExplorer] Failed to fetch projects:', err);
        setData({
          projects: [],
          totalProjects: 0,
          totalAgents: 0,
          performance: { duration_ms: Date.now() - startTime, approach: 'failed' },
          apiStatus: 'error',
          timestamp: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'An error occurred',
          suggestions: ['Check your network connection', 'Verify API configuration']
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const handleProjectToggle = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-6 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.apiStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-red-500 text-xl">❌</span>
            <h3 className="text-red-800 font-medium">Failed to Load Projects</h3>
          </div>

          <p className="text-red-700 mb-4">
            {data?.error || 'Unable to fetch project data from Treasure Data API'}
          </p>

          {data?.suggestions && data.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-red-700 font-medium">Troubleshooting suggestions:</p>
              <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                {data.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 text-xs text-red-500">
            Response time: {data?.performance?.duration_ms}ms
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with summary stats */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Available Projects</h2>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            data.performance.duration_ms < 300
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            ⚡ {data.performance.duration_ms}ms
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-blue-600">{data.totalProjects}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-green-600">{data.totalAgents}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-purple-600">
              {data.projects.filter(p => p.agentCount > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </div>
      </div>

      {/* Projects grid */}
      {data.projects.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-xl mb-2">📂</div>
          <p className="text-yellow-800 font-medium">No projects found</p>
          <p className="text-yellow-600 text-sm mt-1">
            Your API key may not have access to any projects, or all projects may be empty.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.projects.map(project => (
            <div
              key={project.id}
              className="border rounded-lg hover:shadow-md transition-all duration-200 bg-white"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => handleProjectToggle(project.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.agentCount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        📊 {project.agentCount} agents
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-gray-600 mt-2">{project.description}</p>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>ID: {project.id}</span>
                      <span>Created: {formatDate(project.created_at)}</span>
                      {project.updated_at && (
                        <span>Updated: {formatDate(project.updated_at)}</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <span className="text-gray-400">
                      {expandedProject === project.id ? '🔼' : '🔽'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded agent list */}
              {expandedProject === project.id && (
                <div className="px-6 pb-6 border-t bg-gray-50">
                  <div className="pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">
                      Agents ({project.agents.length})
                    </h4>

                    {project.agents.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">No agents in this project</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {project.agents.map(agent => (
                          <div
                            key={agent.id}
                            className="bg-white border rounded-md p-3 hover:shadow-sm transition-shadow"
                          >
                            <div className="font-medium text-sm text-gray-800">{agent.name}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {agent.id}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer with metadata */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            API Status: <span className="font-medium text-green-600">✅ Connected</span>
          </div>
          <div>
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}