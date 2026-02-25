'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing trace card expansion state
 */
export function useTraceExpansion(totalTraces: number) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  // Toggle individual card expansion
  const toggleCard = useCallback((cardIndex: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  }, []);

  // Toggle all cards
  const toggleAll = useCallback(() => {
    if (expandAll) {
      setExpandedCards(new Set());
      setExpandAll(false);
    } else {
      const allIndices = Array.from({ length: totalTraces }, (_, i) => i);
      setExpandedCards(new Set(allIndices));
      setExpandAll(true);
    }
  }, [expandAll, totalTraces]);

  // Check if a card is expanded
  const isCardExpanded = useCallback((cardIndex: number): boolean => {
    return expandedCards.has(cardIndex);
  }, [expandedCards]);

  // Expand specific cards by indices
  const expandCards = useCallback((indices: number[]) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      indices.forEach(index => newSet.add(index));
      return newSet;
    });
  }, []);

  // Collapse specific cards by indices
  const collapseCards = useCallback((indices: number[]) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      indices.forEach(index => newSet.delete(index));
      return newSet;
    });
  }, []);

  // Collapse all cards
  const collapseAll = useCallback(() => {
    setExpandedCards(new Set());
    setExpandAll(false);
  }, []);

  // Expand all cards
  const expandAllCards = useCallback(() => {
    const allIndices = Array.from({ length: totalTraces }, (_, i) => i);
    setExpandedCards(new Set(allIndices));
    setExpandAll(true);
  }, [totalTraces]);

  // Get expansion statistics
  const expansionStats = useMemo(() => {
    return {
      expandedCount: expandedCards.size,
      totalCount: totalTraces,
      allExpanded: expandedCards.size === totalTraces && totalTraces > 0,
      noneExpanded: expandedCards.size === 0,
      partiallyExpanded: expandedCards.size > 0 && expandedCards.size < totalTraces
    };
  }, [expandedCards.size, totalTraces]);

  return {
    // State
    expandedCards,
    expandAll,
    expansionStats,

    // Individual card actions
    toggleCard,
    isCardExpanded,

    // Bulk actions
    toggleAll,
    expandCards,
    collapseCards,
    collapseAll,
    expandAllCards
  };
}