'use client';

import type { LlmJudgeResult } from '@/lib/llm/types';
import { useEvaluation } from '@/context/EvaluationContext';
import { ExpandableSection } from '@/components/ui/ExpandableSection';

interface LlmJudgeResultsProps {
  result: LlmJudgeResult | null;
  testCaseId: string;
}

function VerdictBadge({ verdict }: { verdict: 'pass' | 'fail' }) {
  const isPass = verdict === 'pass';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isPass
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {isPass ? 'Pass' : 'Fail'}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
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
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-purple-50">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold">
          L
        </span>
        <h3 className="text-sm font-semibold text-gray-900">LLM Evaluation</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 text-center">
          No LLM evaluation available
        </p>
      </div>
    </section>
  );
}

interface ExpandedViewProps {
  result: LlmJudgeResult;
}

function ExpandedView({ result }: ExpandedViewProps) {
  return (
    <div className="space-y-4">
      {/* Verdict */}
      <Section label="Verdict">
        <VerdictBadge verdict={result.verdict} />
      </Section>

      {/* Reasoning */}
      <Section label="Reasoning">
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 rounded-lg p-3">
          {result.reasoning}
        </p>
      </Section>

      {/* Evaluated timestamp */}
      <div className="pt-3 border-t border-purple-100">
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
    return <EmptyState />;
  }

  const handleToggle = (expanded: boolean) => {
    // Only toggle if state is changing
    if (expanded !== isVisible) {
      toggleLlmResultsVisibility(testCaseId);
    }
  };

  return (
    <ExpandableSection
      title="LLM Evaluation"
      badge="L"
      variant="evaluation"
      isExpandable={true}
      defaultExpanded={isVisible}
      onToggle={handleToggle}
      statusBadge={<VerdictBadge verdict={result.verdict} />}
    >
      <ExpandedView result={result} />
    </ExpandableSection>
  );
}

export { LoadingSpinner as LlmJudgeLoadingSpinner };
