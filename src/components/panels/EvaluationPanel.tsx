'use client';

import { Button } from '@/components/ui/Button';
import { Evaluation } from '@/lib/types/evaluation';

interface EvaluationPanelProps {
  evaluation: Evaluation | null;
  onRate: (rating: 'true' | 'false') => void;
  onNotesChange: (notes: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function EvaluationPanel({
  evaluation,
  onRate,
  onNotesChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: EvaluationPanelProps) {
  if (!evaluation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a test case to evaluate
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Evaluation</h2>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Rating Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => onRate('true')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                evaluation.rating === 'true'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-700'
              }`}
            >
              True
            </button>
            <button
              onClick={() => onRate('false')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                evaluation.rating === 'false'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-700'
              }`}
            >
              False
            </button>
          </div>
        </section>

        {/* Notes Section */}
        <section>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add notes about this evaluation..."
            value={evaluation.notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </section>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!hasNext}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
