'use client';

import { useEffect, useState } from 'react';
import { Agent, AgentsResponse } from '@/lib/types';

interface AgentSelectorProps {
  onAgentSelect: (agentPath: string | null) => void;
  disabled?: boolean;
}

export function AgentSelector({ onAgentSelect, disabled = false }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [byProject, setByProject] = useState<Record<string, Agent[]>>({});
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<AgentsResponse['performance'] | null>(null);
  const [method, setMethod] = useState<AgentsResponse['method'] | null>(null);

  useEffect(() => {
    loadInitialProjects();
  }, []);

  // Load initial projects only (not agents)
  async function loadInitialProjects() {
    try {
      const response = await fetch('/api/projects');

      if (response.status === 503) {
        throw new Error('TDX CLI not available. Please ensure tdx is installed and in PATH.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setAllProjects(data.projects || []);
      setPerformance(data.performance);
      setMethod(data.method);

      // Log performance info for debugging
      if (data.performance) {
        console.log(`[AgentSelector] Loaded ${data.count || 0} projects using ${data.method} in ${data.performance.duration_ms}ms`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch agents for a specific project
  const fetchProjectAgents = async (projectId: string, projectName: string) => {
    if (!projectId) {
      setByProject({ ...byProject, [projectName]: [] });
      return;
    }

    setIsLoadingAgents(true);
    try {
      const response = await fetch(`/api/agents?projectId=${encodeURIComponent(projectId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project agents');
      }

      const data: AgentsResponse = await response.json();

      // Update byProject with the new agents for this project
      setByProject(prev => ({
        ...prev,
        [projectName]: data.agents
      }));

      console.log(`[AgentSelector] Loaded ${data.agents.length} agents for project: ${projectName}`);
    } catch (err) {
      console.error(`[AgentSelector] Failed to fetch agents for project ${projectName}:`, err);
      setByProject({ ...byProject, [projectName]: [] });
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // Handle project selection and trigger agent loading
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setSelectedProject('');
      setSelectedProjectName('');
      setSelectedAgent('');
      onAgentSelect(null);
      return;
    }

    // Find the project object to get both ID and name
    const selectedProjectObj = allProjects.find(p =>
      (p.attributes?.name || p.name || 'Unnamed Project') === selectedValue
    );

    if (selectedProjectObj) {
      const projectId = selectedProjectObj.id;
      const projectName = selectedProjectObj.attributes?.name || selectedProjectObj.name || 'Unnamed Project';

      setSelectedProject(projectId);
      setSelectedProjectName(projectName);
      setSelectedAgent('');
      onAgentSelect(null);

      // Fetch agents for the selected project
      fetchProjectAgents(projectId, projectName);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentPath = e.target.value;
    setSelectedAgent(agentPath);
    onAgentSelect(agentPath || null);
  };

  const projects = allProjects.map(p => p.attributes?.name || p.name || 'Unnamed Project').sort();
  const projectAgents = selectedProjectName ? byProject[selectedProjectName] || [] : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (allProjects.length === 0 && !isLoading) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <p className="text-yellow-800 text-sm">
          No projects found. Check your API key permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Performance Indicator for Feature #1 */}
      {performance && method && (
        <div className={`text-xs px-2 py-1 rounded-md ${
          method === 'direct_api'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {method === 'direct_api' ? (
            <>
              ⚡ Fast API mode: Loaded in {performance.duration_ms}ms
              {performance.duration_ms < 300 && ' (3-5x faster)'}
            </>
          ) : (
            <>
              🐌 CLI fallback: Loaded in {performance.duration_ms}ms
              <span className="ml-1 text-xs opacity-75">(enable USE_DIRECT_API for faster loading)</span>
            </>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="project-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project
        </label>
        <select
          id="project-select"
          value={selectedProjectName}
          onChange={handleProjectChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="agent-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Agent
        </label>
        <select
          id="agent-select"
          value={selectedAgent}
          onChange={handleAgentChange}
          disabled={disabled || !selectedProject || isLoadingAgents}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {isLoadingAgents ? 'Loading agents...' : 'Select Agent'}
          </option>
          {projectAgents.map((agent) => (
            <option key={agent.path} value={agent.path}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
