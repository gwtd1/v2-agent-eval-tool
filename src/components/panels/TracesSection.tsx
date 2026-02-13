'use client';

import { useState } from 'react';
import { TraceFlowDiagram } from './TraceFlowDiagram';

interface TracesSectionProps {
  traces: string | null;
  agentName?: string;
}

/**
 * Parse traces to count entries and tool calls
 */
function getTraceCounts(tracesJson: string): { entries: number; toolCalls: number } {
  try {
    const entries = JSON.parse(tracesJson) as Array<{ tool?: unknown }>;
    const toolCalls = entries.filter(e => e.tool !== undefined).length;
    return { entries: entries.length, toolCalls };
  } catch {
    return { entries: 0, toolCalls: 0 };
  }
}

export function TracesSection({ traces, agentName }: TracesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!traces) {
    return null;
  }

  const { entries, toolCalls } = getTraceCounts(traces);

  if (entries === 0) {
    return null;
  }

  return (
    <section>
      {/* Header - Expandable */}
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
            T
          </span>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Conversation Traces
          </h3>
          <span className="text-xs text-gray-400 font-normal normal-case">
            ({entries} {entries === 1 ? 'entry' : 'entries'}
            {toolCalls > 0 && `, ${toolCalls} tool ${toolCalls === 1 ? 'call' : 'calls'}`})
          </span>
        </div>
        <button
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          type="button"
        >
          {isExpanded ? 'Hide' : 'Show'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Flow Diagram */}
      {isExpanded && (
        <div className="rounded-lg border border-indigo-100 bg-white p-4 overflow-auto">
          <TraceFlowDiagram traces={traces} agentName={agentName} />
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 p-3">
          <p className="text-sm text-indigo-600 text-center">
            Click to view conversation flow diagram
          </p>
        </div>
      )}
    </section>
  );
}
