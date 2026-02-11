'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { TestResponse } from '@/lib/types';

interface TestRunnerProps {
  agentPath: string | null;
  onComplete: (testRunId: string) => void;
}

type Status = 'idle' | 'running' | 'complete' | 'error';

interface ErrorDetails {
  rawOutput?: string;
  stderr?: string;
  needsTestFile?: boolean;
  autoRecoveryAttempted?: boolean;
}

export function TestRunner({ agentPath, onComplete }: TestRunnerProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunTest = async () => {
    if (!agentPath) return;

    setStatus('running');
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);

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
        // Store error details for display
        setErrorDetails({
          rawOutput: data.rawOutput,
          stderr: data.error,
          needsTestFile: data.needsTestFile,
          autoRecoveryAttempted: data.autoRecoveryAttempted,
        });
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
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">
                {errorDetails?.needsTestFile
                  ? 'Test file missing'
                  : errorDetails?.autoRecoveryAttempted
                    ? 'Test failed after auto-recovery attempt'
                    : 'Test execution failed'}
              </p>
              <p className="text-red-600 text-sm mt-1">{error}</p>

              {errorDetails?.autoRecoveryAttempted && (
                <p className="text-red-500 text-xs mt-1">
                  Auto-recovery was attempted but the test still failed.
                </p>
              )}
            </div>
          </div>

          {errorDetails?.rawOutput && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>

              {showDetails && (
                <div className="mt-2 bg-red-100 rounded p-2 overflow-x-auto">
                  <pre className="text-xs text-red-800 whitespace-pre-wrap break-words">
                    {errorDetails.rawOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRunTest}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
