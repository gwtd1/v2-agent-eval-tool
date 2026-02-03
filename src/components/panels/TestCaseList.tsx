'use client';

import { Badge } from '@/components/ui/Badge';
import { Evaluation } from '@/lib/types/evaluation';
import { TestCase } from '@/lib/types/test-case';

interface EvaluationWithTestCase {
  evaluation: Evaluation;
  testCase: TestCase | null;
}

interface TestCaseListProps {
  evaluations: EvaluationWithTestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TestCaseList({ evaluations, selectedId, onSelect }: TestCaseListProps) {
  const reviewed = evaluations.filter((e) => e.evaluation.rating !== null).length;
  const total = evaluations.length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Test Cases</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {evaluations.map(({ evaluation, testCase }) => {
          const isSelected = evaluation.testCaseId === selectedId;
          const badgeVariant = evaluation.rating === null ? 'pending' : evaluation.rating;

          return (
            <button
              key={evaluation.id}
              onClick={() => onSelect(evaluation.testCaseId)}
              className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-100 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                  {testCase?.prompt?.slice(0, 50) || 'Unknown test case'}
                  {(testCase?.prompt?.length ?? 0) > 50 ? '...' : ''}
                </span>
                <Badge variant={badgeVariant}>
                  {evaluation.rating === 'true' ? 'True' : evaluation.rating === 'false' ? 'False' : 'Pending'}
                </Badge>
              </div>
            </button>
          );
        })}

        {evaluations.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No test cases found
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{reviewed}/{total}</span> reviewed
        </div>
        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: total > 0 ? `${(reviewed / total) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
