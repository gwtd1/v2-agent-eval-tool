'use client';

import { useState, useCallback } from 'react';

export type SectionVariant = 'prompt' | 'response' | 'traces' | 'evaluation' | 'ground-truth';

interface ExpandableSectionProps {
  title: string;
  badge: string;
  variant: SectionVariant;
  count?: string;
  statusBadge?: React.ReactNode;
  isExpandable?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

const variantStyles: Record<SectionVariant, {
  headerBg: string;
  headerHover: string;
  badgeBg: string;
  badgeText: string;
  buttonText: string;
  buttonHover: string;
}> = {
  prompt: {
    headerBg: 'bg-blue-50',
    headerHover: 'hover:bg-blue-100',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-600',
    buttonText: 'text-blue-600',
    buttonHover: 'hover:text-blue-800',
  },
  response: {
    headerBg: 'bg-emerald-50',
    headerHover: 'hover:bg-emerald-100',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-600',
    buttonText: 'text-emerald-600',
    buttonHover: 'hover:text-emerald-800',
  },
  traces: {
    headerBg: 'bg-indigo-50',
    headerHover: 'hover:bg-indigo-100',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-600',
    buttonText: 'text-indigo-600',
    buttonHover: 'hover:text-indigo-800',
  },
  evaluation: {
    headerBg: 'bg-purple-50',
    headerHover: 'hover:bg-purple-100',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-600',
    buttonText: 'text-purple-600',
    buttonHover: 'hover:text-purple-800',
  },
  'ground-truth': {
    headerBg: 'bg-amber-50',
    headerHover: 'hover:bg-amber-100',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-600',
    buttonText: 'text-amber-600',
    buttonHover: 'hover:text-amber-800',
  },
};

export function ExpandableSection({
  title,
  badge,
  variant,
  count,
  statusBadge,
  isExpandable = false,
  defaultExpanded = true,
  onToggle,
  children,
  headerAction,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const styles = variantStyles[variant];

  const handleToggle = useCallback(() => {
    if (!isExpandable) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  }, [isExpandable, isExpanded, onToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isExpandable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [isExpandable, handleToggle]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${styles.headerBg} ${
          isExpandable ? `cursor-pointer ${styles.headerHover} transition-colors` : ''
        }`}
        onClick={isExpandable ? handleToggle : undefined}
        onKeyDown={isExpandable ? handleKeyDown : undefined}
        role={isExpandable ? 'button' : undefined}
        tabIndex={isExpandable ? 0 : undefined}
        aria-expanded={isExpandable ? isExpanded : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Badge Circle */}
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${styles.badgeBg} ${styles.badgeText} text-xs font-semibold`}
          >
            {badge}
          </span>
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {/* Count */}
          {count && (
            <span className="text-xs text-gray-500">({count})</span>
          )}
          {/* Status Badge */}
          {statusBadge}
        </div>

        {/* Right side: either header action or expand/collapse button */}
        {isExpandable ? (
          <button
            type="button"
            className={`flex items-center gap-1.5 text-sm ${styles.buttonText} ${styles.buttonHover}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            aria-label={isExpanded ? 'Hide' : 'Show'}
          >
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          headerAction
        )}
      </div>

      {/* Content */}
      {(!isExpandable || isExpanded) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </section>
  );
}
