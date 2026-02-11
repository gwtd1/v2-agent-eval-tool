'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Evaluation } from '@/lib/types/evaluation';
import { TestCase } from '@/lib/types/test-case';

interface EvaluationWithTestCase {
  evaluation: Evaluation;
  testCase: TestCase | null;
}

interface EvaluationContextState {
  testRunId: string | null;
  evaluations: EvaluationWithTestCase[];
  selectedTestCaseId: string | null;
  isLoading: boolean;
  error: string | null;
  llmResultsVisibility: Record<string, boolean>;
}

interface EvaluationContextActions {
  setTestRun: (testRunId: string) => Promise<void>;
  selectTestCase: (testCaseId: string) => void;
  updateRating: (evaluationId: string, rating: 'pass' | 'fail') => Promise<void>;
  updateNotes: (evaluationId: string, notes: string) => Promise<void>;
  toggleLlmResultsVisibility: (testCaseId: string) => void;
}

type EvaluationContextValue = EvaluationContextState & EvaluationContextActions;

const EvaluationContext = createContext<EvaluationContextValue | null>(null);

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}

interface EvaluationProviderProps {
  children: ReactNode;
}

export function EvaluationProvider({ children }: EvaluationProviderProps) {
  const [state, setState] = useState<EvaluationContextState>({
    testRunId: null,
    evaluations: [],
    selectedTestCaseId: null,
    isLoading: false,
    error: null,
    llmResultsVisibility: {},
  });

  const setTestRun = useCallback(async (testRunId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Retry logic: fetch evaluations up to 3 times with 500ms delay
      // This handles race conditions where DB writes may not be fully committed
      const maxAttempts = 3;
      const retryDelay = 500;
      let evaluations: EvaluationWithTestCase[] = [];
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(`/api/evaluations?testRunId=${testRunId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch evaluations');
          }

          const data = await response.json();
          evaluations = data.evaluations as EvaluationWithTestCase[];

          // If we got evaluations, we're done
          if (evaluations.length > 0) {
            console.log(`[EvaluationContext] Fetched ${evaluations.length} evaluations on attempt ${attempt}`);
            break;
          }

          // If no evaluations and not last attempt, wait and retry
          if (attempt < maxAttempts) {
            console.log(`[EvaluationContext] No evaluations found, retrying in ${retryDelay}ms (attempt ${attempt}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          if (attempt < maxAttempts) {
            console.log(`[EvaluationContext] Fetch failed, retrying in ${retryDelay}ms (attempt ${attempt}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      // If we still have no evaluations after all retries, log warning
      if (evaluations.length === 0) {
        console.warn(`[EvaluationContext] No evaluations found after ${maxAttempts} attempts for testRunId: ${testRunId}`);
        if (lastError) {
          throw lastError;
        }
      }

      setState((prev) => ({
        ...prev,
        testRunId,
        evaluations,
        selectedTestCaseId: evaluations.length > 0 ? evaluations[0].evaluation.testCaseId : null,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  const selectTestCase = useCallback((testCaseId: string) => {
    setState((prev) => ({ ...prev, selectedTestCaseId: testCaseId }));
  }, []);

  const updateRating = useCallback(async (evaluationId: string, rating: 'pass' | 'fail') => {
    console.log(`[EvaluationContext] updateRating called: ${evaluationId}, rating: ${rating}`);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[EvaluationContext] API error:`, response.status, errorData);
        throw new Error(errorData.error || 'Failed to update rating');
      }

      const data = await response.json();
      console.log(`[EvaluationContext] API success:`, data);

      setState((prev) => ({
        ...prev,
        evaluations: prev.evaluations.map((e) =>
          e.evaluation.id === evaluationId
            ? { ...e, evaluation: { ...e.evaluation, rating } }
            : e
        ),
      }));
      console.log(`[EvaluationContext] State updated with rating: ${rating}`);
    } catch (error) {
      console.error('[EvaluationContext] Failed to update rating:', error);
    }
  }, []);

  const updateNotes = useCallback(async (evaluationId: string, notes: string) => {
    // Optimistically update the UI
    setState((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((e) =>
        e.evaluation.id === evaluationId
          ? { ...e, evaluation: { ...e.evaluation, notes } }
          : e
      ),
    }));

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }, []);

  const toggleLlmResultsVisibility = useCallback((testCaseId: string) => {
    setState((prev) => ({
      ...prev,
      llmResultsVisibility: {
        ...prev.llmResultsVisibility,
        [testCaseId]: !prev.llmResultsVisibility[testCaseId],
      },
    }));
  }, []);

  const value: EvaluationContextValue = {
    ...state,
    setTestRun,
    selectTestCase,
    updateRating,
    updateNotes,
    toggleLlmResultsVisibility,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}
