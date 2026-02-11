'use client';

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  onPrev: () => void;
  onNext: () => void;
  onRatePass?: () => void;
  onRateFail?: () => void;
  onFocusNotes?: () => void;
  onToggleLlmResults?: () => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in the review interface
 *
 * Shortcuts:
 * - ArrowLeft / j: Previous test case
 * - ArrowRight / k: Next test case
 * - t / g: Rate as Pass (Good)
 * - f / b: Rate as Fail (Bad)
 * - n: Focus notes textarea
 * - l: Toggle LLM evaluation visibility
 * - Escape: Blur active element (return to navigation mode)
 */
export function useKeyboardNavigation({
  onPrev,
  onNext,
  onRatePass,
  onRateFail,
  onFocusNotes,
  onToggleLlmResults,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape always works - blur active element to return to navigation mode
      if (event.key === 'Escape') {
        event.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Don't trigger other shortcuts when typing in inputs
      if (isInInput) {
        return;
      }

      // Convert to lowercase for case-insensitive letter matching
      const key = event.key.toLowerCase();

      switch (key) {
        case 'arrowleft':
        case 'j':
          event.preventDefault();
          onPrev();
          break;
        case 'arrowright':
        case 'k':
          event.preventDefault();
          onNext();
          break;
        case 't':
        case 'g':
          if (onRatePass) {
            event.preventDefault();
            onRatePass();
          }
          break;
        case 'f':
        case 'b':
          if (onRateFail) {
            event.preventDefault();
            onRateFail();
          }
          break;
        case 'n':
          if (onFocusNotes) {
            event.preventDefault();
            onFocusNotes();
          }
          break;
        case 'l':
          if (onToggleLlmResults) {
            event.preventDefault();
            onToggleLlmResults();
          }
          break;
      }
    },
    [enabled, onPrev, onNext, onRatePass, onRateFail, onFocusNotes, onToggleLlmResults]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}
