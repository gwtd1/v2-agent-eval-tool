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
}

interface EvaluationContextActions {
  setTestRun: (testRunId: string) => Promise<void>;
  selectTestCase: (testCaseId: string) => void;
  updateRating: (evaluationId: string, rating: 'true' | 'false') => Promise<void>;
  updateNotes: (evaluationId: string, notes: string) => Promise<void>;
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
  });

  const setTestRun = useCallback(async (testRunId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/evaluations?testRunId=${testRunId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch evaluations');
      }

      const data = await response.json();
      const evaluations = data.evaluations as EvaluationWithTestCase[];

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

  const updateRating = useCallback(async (evaluationId: string, rating: 'true' | 'false') => {
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rating');
      }

      setState((prev) => ({
        ...prev,
        evaluations: prev.evaluations.map((e) =>
          e.evaluation.id === evaluationId
            ? { ...e, evaluation: { ...e.evaluation, rating } }
            : e
        ),
      }));
    } catch (error) {
      console.error('Failed to update rating:', error);
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

  const value: EvaluationContextValue = {
    ...state,
    setTestRun,
    selectTestCase,
    updateRating,
    updateNotes,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}
