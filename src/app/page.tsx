'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TestRun } from '@/lib/types/test-case';
import { AgentSelector, TestRunner } from '@/components/agent';

export default function Home() {
  const router = useRouter();
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentPath, setSelectedAgentPath] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestRuns() {
      try {
        const response = await fetch('/api/test-runs');
        if (!response.ok) {
          throw new Error('Failed to fetch test runs');
        }
        const data = await response.json();
        setTestRuns(data.testRuns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestRuns();
  }, []);

  const handleTestComplete = (testRunId: string) => {
    router.push(`/review?testRunId=${testRunId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Evaluation Tool</h1>
              <p className="mt-1 text-gray-600">Review and rate agent responses</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                🏠 Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Run New Evaluation Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Run New Evaluation</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <AgentSelector onAgentSelect={setSelectedAgentPath} />
              <TestRunner
                agentPath={selectedAgentPath}
                onComplete={handleTestComplete}
              />
            </div>
          </div>
        </section>

        {/* Previous Test Runs Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Test Runs</h2>

          {isLoading && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading test runs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!isLoading && !error && testRuns.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No test runs found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Run an agent evaluation to create test runs.
              </p>
            </div>
          )}

          {!isLoading && !error && testRuns.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {testRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/review?testRunId=${run.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{run.agentId}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(run.executedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : run.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : run.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {run.status}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono">{run.id}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
