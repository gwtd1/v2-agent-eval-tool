'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { TestResponse } from '@/lib/types';

interface TestRunnerProps {
  agentPath: string | null;
  onComplete: (testRunId: string) => void;
}

type Status = 'idle' | 'running' | 'complete' | 'error';

export function TestRunner({ agentPath, onComplete }: TestRunnerProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    if (!agentPath) return;

    setStatus('running');
    setError(null);

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentPath }),
      });

      const data: TestResponse = await response.json();

      if (!response.ok || data.status === 'failed') {
        throw new Error(data.error || 'Test execution failed');
      }

      setStatus('complete');
      onComplete(data.testRunId);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const isDisabled = !agentPath || status === 'running';

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRunTest}
        disabled={isDisabled}
        className="w-full"
      >
        {status === 'running' ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Running Test...
          </span>
        ) : (
          'Run Test'
        )}
      </Button>

      {status === 'error' && error && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-3">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={handleRunTest}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
