'use client';

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  onPrev: () => void;
  onNext: () => void;
  onRateTrue?: () => void;
  onRateFalse?: () => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in the review interface
 *
 * Shortcuts:
 * - ArrowLeft / j: Previous test case
 * - ArrowRight / k: Next test case
 * - t / g: Rate as True (Good)
 * - f / b: Rate as False (Bad)
 */
export function useKeyboardNavigation({
  onPrev,
  onNext,
  onRateTrue,
  onRateFalse,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
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
          if (onRateTrue) {
            event.preventDefault();
            onRateTrue();
          }
          break;
        case 'f':
        case 'b':
          if (onRateFalse) {
            event.preventDefault();
            onRateFalse();
          }
          break;
      }
    },
    [enabled, onPrev, onNext, onRateTrue, onRateFalse]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}
