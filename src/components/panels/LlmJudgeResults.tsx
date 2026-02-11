'use client';

import type { LlmJudgeResult } from '@/lib/llm/types';
import { useEvaluation } from '@/context/EvaluationContext';

interface LlmJudgeResultsProps {
  result: LlmJudgeResult | null;
  testCaseId: string;
}

function VerdictBadge({ verdict }: { verdict: 'pass' | 'fail' }) {
  const isPass = verdict === 'pass';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPass
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isPass ? 'Pass' : 'Fail'}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="ml-2 text-sm text-gray-500">Evaluating...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500 text-center">
        No LLM evaluation available
      </p>
    </div>
  );
}

interface CollapsedViewProps {
  onReveal: () => void;
}

function CollapsedView({ onReveal }: CollapsedViewProps) {
  return (
    <div
      onClick={onReveal}
      className="rounded-lg p-4 border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <p className="text-gray-400 text-center text-sm">
        LLM Evaluation hidden — Press L to toggle
      </p>
    </div>
  );
}

interface ExpandedViewProps {
  result: LlmJudgeResult;
}

function ExpandedView({ result }: ExpandedViewProps) {
  return (
    <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
      <div className="mb-3">
        <span className="text-xs text-gray-500">
          Test {result.testNumber}/{result.totalTests}
        </span>
      </div>

      {/* Test Name */}
      <Section label="Test Name">
        <p className="text-sm text-gray-900">{result.testName}</p>
      </Section>

      {/* Prompt */}
      <Section label="Prompt">
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded p-2 border border-purple-100">
          {result.prompt}
        </p>
      </Section>

      {/* Verdict */}
      <Section label="Verdict">
        <VerdictBadge verdict={result.verdict} />
      </Section>

      {/* Reasoning */}
      <Section label="Reasoning">
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded p-2 border border-purple-100 max-h-48 overflow-y-auto">
          {result.reasoning}
        </p>
      </Section>

      {/* Conversation URL */}
      {result.conversationUrl && (
        <Section label="Evaluation Chat">
          <a
            href={result.conversationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:text-purple-800 hover:underline inline-flex items-center"
          >
            View evaluation conversation
            <svg
              className="ml-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </Section>
      )}

      {/* Evaluated timestamp */}
      <div className="mt-3 pt-3 border-t border-purple-200">
        <p className="text-xs text-gray-400">
          Evaluated at {new Date(result.evaluatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function LlmJudgeResults({ result, testCaseId }: LlmJudgeResultsProps) {
  const { llmResultsVisibility, toggleLlmResultsVisibility } = useEvaluation();
  const isVisible = llmResultsVisibility[testCaseId] ?? false;

  if (!result) {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">
          LLM Evaluation
        </h3>
        <EmptyState />
      </div>
    );
  }

  const handleToggle = () => toggleLlmResultsVisibility(testCaseId);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-purple-900">
          LLM Evaluation
        </h3>
        <button
          onClick={handleToggle}
          className="text-gray-400 hover:text-gray-600 text-sm px-1"
          aria-label={isVisible ? 'Collapse LLM evaluation' : 'Expand LLM evaluation'}
        >
          {isVisible ? 'v' : '^'}
        </button>
      </div>
      {isVisible ? (
        <ExpandedView result={result} />
      ) : (
        <CollapsedView onReveal={handleToggle} />
      )}
    </div>
  );
}

export { LoadingSpinner as LlmJudgeLoadingSpinner };
