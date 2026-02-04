'use client';

import { Suspense, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThreePanel } from '@/components/layout/ThreePanel';
import { TestCaseList } from '@/components/panels/TestCaseList';
import { ConversationView } from '@/components/panels/ConversationView';
import { EvaluationPanel } from '@/components/panels/EvaluationPanel';
import { EvaluationProvider, useEvaluation } from '@/context/EvaluationContext';
import { useKeyboardNavigation } from '@/lib/utils/keyboard';

function ReviewContentInner() {
  const searchParams = useSearchParams();
  const testRunId = searchParams.get('testRunId');

  const {
    evaluations,
    selectedTestCaseId,
    isLoading,
    error,
    setTestRun,
    selectTestCase,
    updateRating,
    updateNotes,
  } = useEvaluation();

  useEffect(() => {
    if (testRunId) {
      setTestRun(testRunId);
    }
  }, [testRunId, setTestRun]);

  const selectedIndex = useMemo(() => {
    return evaluations.findIndex((e) => e.evaluation.testCaseId === selectedTestCaseId);
  }, [evaluations, selectedTestCaseId]);

  const selectedEvaluation = selectedIndex >= 0 ? evaluations[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) {
      selectTestCase(evaluations[selectedIndex - 1].evaluation.testCaseId);
    }
  }, [selectedIndex, evaluations, selectTestCase]);

  const handleNext = useCallback(() => {
    if (selectedIndex < evaluations.length - 1) {
      selectTestCase(evaluations[selectedIndex + 1].evaluation.testCaseId);
    }
  }, [selectedIndex, evaluations, selectTestCase]);

  const handleRate = useCallback((rating: 'true' | 'false') => {
    if (selectedEvaluation) {
      updateRating(selectedEvaluation.evaluation.id, rating);
    }
  }, [selectedEvaluation, updateRating]);

  const handleNotesChange = useCallback((notes: string) => {
    if (selectedEvaluation) {
      updateNotes(selectedEvaluation.evaluation.id, notes);
    }
  }, [selectedEvaluation, updateNotes]);

  // Keyboard navigation
  useKeyboardNavigation({
    onPrev: handlePrev,
    onNext: handleNext,
    onRateTrue: () => handleRate('true'),
    onRateFalse: () => handleRate('false'),
    enabled: !isLoading && evaluations.length > 0,
  });

  if (!testRunId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Test Run Selected</h1>
          <p className="text-gray-600">Please provide a testRunId query parameter.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ThreePanel
      left={
        <TestCaseList
          evaluations={evaluations}
          selectedId={selectedTestCaseId}
          onSelect={selectTestCase}
        />
      }
      center={
        <ConversationView testCase={selectedEvaluation?.testCase ?? null} />
      }
      right={
        <EvaluationPanel
          evaluation={selectedEvaluation?.evaluation ?? null}
          onRate={handleRate}
          onNotesChange={handleNotesChange}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < evaluations.length - 1}
        />
      }
    />
  );
}

function ReviewContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ReviewContentInner />
    </Suspense>
  );
}

export default function ReviewPage() {
  return (
    <EvaluationProvider>
      <ReviewContent />
    </EvaluationProvider>
  );
}
