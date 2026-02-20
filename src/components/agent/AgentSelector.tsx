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
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const project = e.target.value;

    // Don't switch if same project is selected
    if (project === selectedProject) return;

    setIsProjectSwitching(true);
    setError(null);

    try {
      // Set project context via API
      const response = await fetch('/api/project-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project: project || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to set project context');
      }

      // Update local state
      setSelectedProject(project);
      setSelectedAgent('');
      onAgentSelect(null);

      // Refresh agent list with new project context
      await fetchAgents();

      console.log(`[UI] Switched to project: ${project || 'default'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch projects');
      console.error('[UI] Project switch failed:', err);
    } finally {
      setIsProjectSwitching(false);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentPath = e.target.value;
    setSelectedAgent(agentPath);
    onAgentSelect(agentPath || null);
  };

  const projects = Object.keys(byProject).sort();
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
      <div>
        <label
          htmlFor="project-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project {isProjectSwitching && <span className="text-blue-600">(switching...)</span>}
        </label>
        <select
          id="project-select"
          value={selectedProject}
          onChange={handleProjectChange}
          disabled={disabled || isProjectSwitching}
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
          disabled={disabled || !selectedProject || isProjectSwitching}
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
