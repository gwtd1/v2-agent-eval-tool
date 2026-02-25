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
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<AgentsResponse['performance'] | null>(null);
  const [method, setMethod] = useState<AgentsResponse['method'] | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      const startTime = Date.now();
      try {
        const response = await fetch('/api/agents');

        if (response.status === 503) {
          throw new Error('TDX CLI not available. Please ensure tdx is installed and in PATH.');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }

        const data: AgentsResponse = await response.json();
        setAgents(data.agents);
        setByProject(data.byProject);
        setAllProjects(data.projects || []);
        setPerformance(data.performance);
        setMethod(data.method);

        // Log performance info for debugging
        if (data.performance) {
          console.log(`[AgentSelector] Loaded agents using ${data.method} in ${data.performance.duration_ms}ms`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const project = e.target.value;
    setSelectedProject(project);
    setSelectedAgent('');
    onAgentSelect(null);
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentPath = e.target.value;
    setSelectedAgent(agentPath);
    onAgentSelect(agentPath || null);
  };

  const projects = allProjects.map(p => p.attributes?.name || p.name || 'Unnamed Project').sort();
  const projectAgents = selectedProject ? byProject[selectedProject] || [] : [];

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

  if (agents.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <p className="text-yellow-800 text-sm">
          No agents found. Create agents using TDX CLI.
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
          value={selectedProject}
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
          disabled={disabled || !selectedProject}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Agent</option>
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
