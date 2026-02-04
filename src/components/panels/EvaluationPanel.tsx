'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Textarea } from '@/components/ui/Textarea';
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

const RATING_OPTIONS = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
];

// Debounce delay for auto-saving notes
const NOTES_SAVE_DELAY = 500;

export function EvaluationPanel({
  evaluation,
  onRate,
  onNotesChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: EvaluationPanelProps) {
  // Local state for notes to enable immediate UI updates
  const [localNotes, setLocalNotes] = useState(evaluation?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local notes when evaluation changes
  useEffect(() => {
    setLocalNotes(evaluation?.notes || '');
  }, [evaluation?.id, evaluation?.notes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced save handler
  const debouncedSave = useCallback(
    (notes: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onNotesChange(notes);
        setIsSaving(false);
      }, NOTES_SAVE_DELAY);
    },
    [onNotesChange]
  );

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setLocalNotes(newNotes);
    debouncedSave(newNotes);
  };

  // Save immediately on blur
  const handleNotesBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (localNotes !== evaluation?.notes) {
      onNotesChange(localNotes);
    }
    setIsSaving(false);
  };

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-gray-500">Select a test case to evaluate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Evaluation</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Rate the agent&apos;s response
        </p>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Rating Section */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating
          </label>
          <RadioGroup
            name="rating"
            options={RATING_OPTIONS}
            value={evaluation.rating}
            onChange={(value) => onRate(value as 'true' | 'false')}
          />
          {evaluation.rating && (
            <p className="mt-2 text-xs text-gray-500">
              Rated as{' '}
              <span
                className={`font-medium ${
                  evaluation.rating === 'true' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {evaluation.rating === 'true' ? 'True' : 'False'}
              </span>
            </p>
          )}
        </section>

        {/* Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            {isSaving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                Saving...
              </span>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            id="notes"
            rows={6}
            placeholder="Add notes about this evaluation..."
            value={localNotes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
          />
          <p className="mt-1 text-xs text-gray-400">
            Notes auto-save as you type
          </p>
        </section>

        {/* Keyboard Shortcuts Hint */}
        <section className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center pt-3">
            <span className="block mb-1">Keyboard shortcuts:</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">→</kbd>
              <span className="mx-1">navigate</span>
            </span>
            <span className="mx-2">|</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">T</kbd>
              <span className="mx-1">True</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">F</kbd>
              <span className="mx-1">False</span>
            </span>
          </p>
        </section>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex-1"
          >
            ← Previous
          </Button>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!hasNext}
            className="flex-1"
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
