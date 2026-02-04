'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Evaluation } from '@/lib/types/evaluation';
import { TestCase } from '@/lib/types/test-case';

interface EvaluationWithTestCase {
  evaluation: Evaluation;
  testCase: TestCase | null;
}

type FilterType = 'all' | 'pending' | 'reviewed';

interface TestCaseListProps {
  evaluations: EvaluationWithTestCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TestCaseList({ evaluations, selectedId, onSelect }: TestCaseListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredEvaluations = useMemo(() => {
    switch (filter) {
      case 'pending':
        return evaluations.filter((e) => e.evaluation.rating === null);
      case 'reviewed':
        return evaluations.filter((e) => e.evaluation.rating !== null);
      default:
        return evaluations;
    }
  }, [evaluations, filter]);

  const reviewed = evaluations.filter((e) => e.evaluation.rating !== null).length;
  const pending = evaluations.filter((e) => e.evaluation.rating === null).length;
  const total = evaluations.length;

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: total },
    { key: 'pending', label: 'Pending', count: pending },
    { key: 'reviewed', label: 'Reviewed', count: reviewed },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Test Cases</h2>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-1">
          {filterButtons.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Test Case List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEvaluations.map(({ evaluation, testCase }) => {
          const isSelected = evaluation.testCaseId === selectedId;
          const badgeVariant = evaluation.rating === null ? 'pending' : evaluation.rating;
          const displayIndex = evaluations.findIndex(
            (e) => e.evaluation.testCaseId === evaluation.testCaseId
          );

          return (
            <button
              key={evaluation.id}
              onClick={() => onSelect(evaluation.testCaseId)}
              className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 font-mono">
                    #{displayIndex + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                    {testCase?.prompt?.slice(0, 60) || 'Unknown test case'}
                    {(testCase?.prompt?.length ?? 0) > 60 ? '...' : ''}
                  </p>
                </div>
                <Badge variant={badgeVariant}>
                  {evaluation.rating === 'true'
                    ? 'True'
                    : evaluation.rating === 'false'
                    ? 'False'
                    : 'Pending'}
                </Badge>
              </div>
            </button>
          );
        })}

        {filteredEvaluations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {filter === 'all' ? (
              <p>No test cases found</p>
            ) : filter === 'pending' ? (
              <div>
                <p className="font-medium text-green-600">All done!</p>
                <p className="text-sm mt-1">All test cases have been reviewed.</p>
              </div>
            ) : (
              <p>No reviewed test cases yet</p>
            )}
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">
            {reviewed}/{total} reviewed
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              reviewed === total && total > 0 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: total > 0 ? `${(reviewed / total) * 100}%` : '0%' }}
          />
        </div>
        {reviewed === total && total > 0 && (
          <p className="text-xs text-green-600 font-medium mt-2 text-center">
            ✓ All test cases reviewed!
          </p>
        )}
      </div>
    </div>
  );
}
