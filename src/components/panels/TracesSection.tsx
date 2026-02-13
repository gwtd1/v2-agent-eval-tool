'use client';

import { useState } from 'react';

interface ToolCallInfo {
  id?: string;
  functionName: string;
  functionArguments: string;
  content: string;
  status: string;
  targetFunction?: string;
  toolTarget?: {
    id?: string;
    type: string;
    name: string;
  };
}

interface ChatHistoryEntry {
  input?: string;
  content?: string;
  tool?: ToolCallInfo;
  at: string;
}

interface TracesSectionProps {
  traces: string | null;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Truncate long content for preview
 */
function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Parse and deduplicate traces
 */
function parseTraces(tracesJson: string): ChatHistoryEntry[] {
  try {
    const entries = JSON.parse(tracesJson) as ChatHistoryEntry[];

    // Deduplicate based on content and timestamp
    const seen = new Set<string>();
    return entries.filter(entry => {
      const key = `${entry.at}-${entry.input || ''}-${entry.content || ''}-${entry.tool?.functionName || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * Render a single trace entry
 */
function TraceEntry({ entry, index }: { entry: ChatHistoryEntry; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine entry type
  const isUserInput = entry.input !== undefined;
  const isAgentResponse = entry.content !== undefined && !entry.tool;
  const isToolCall = entry.tool !== undefined;

  const getBadge = () => {
    if (isUserInput) return { label: 'User', color: 'bg-blue-100 text-blue-700' };
    if (isToolCall) return { label: 'Tool', color: 'bg-purple-100 text-purple-700' };
    if (isAgentResponse) return { label: 'Agent', color: 'bg-green-100 text-green-700' };
    return { label: 'Entry', color: 'bg-gray-100 text-gray-700' };
  };

  const badge = getBadge();
  const content = entry.input || entry.content || '';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {isToolCall && entry.tool && (
            <span className="text-sm text-gray-600 font-mono">
              {entry.tool.functionName}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {formatTimestamp(entry.at)}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Preview (collapsed) */}
      {!isExpanded && content && (
        <div className="px-3 py-2 text-sm text-gray-600">
          {truncateContent(content)}
        </div>
      )}

      {/* Full Content (expanded) */}
      {isExpanded && (
        <div className="px-3 py-3 space-y-3">
          {/* User Input or Agent Content */}
          {(entry.input || entry.content) && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                {isUserInput ? 'Input' : 'Content'}
              </div>
              <div className="bg-white border border-gray-100 rounded p-2 text-sm whitespace-pre-wrap break-words font-mono">
                {entry.input || entry.content}
              </div>
            </div>
          )}

          {/* Tool Call Details */}
          {isToolCall && entry.tool && (
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Function</div>
                <div className="bg-purple-50 border border-purple-100 rounded p-2 text-sm font-mono">
                  {entry.tool.functionName}
                </div>
              </div>

              {entry.tool.functionArguments && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Arguments</div>
                  <div className="bg-white border border-gray-100 rounded p-2 text-sm whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                    {entry.tool.functionArguments}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Result
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    entry.tool.status === 'OK'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {entry.tool.status}
                  </span>
                </div>
                <div className="bg-white border border-gray-100 rounded p-2 text-sm whitespace-pre-wrap break-words font-mono max-h-60 overflow-y-auto">
                  {entry.tool.content || '(no result)'}
                </div>
              </div>

              {entry.tool.targetFunction && (
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Target: <span className="font-mono">{entry.tool.targetFunction}</span></span>
                  {entry.tool.toolTarget && (
                    <span>Type: <span className="font-mono">{entry.tool.toolTarget.type}</span></span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TracesSection({ traces }: TracesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!traces) {
    return null;
  }

  const entries = parseTraces(traces);

  if (entries.length === 0) {
    return null;
  }

  // Count tool calls
  const toolCallCount = entries.filter(e => e.tool !== undefined).length;

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
            ({entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            {toolCallCount > 0 && `, ${toolCallCount} tool ${toolCallCount === 1 ? 'call' : 'calls'}`})
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

      {/* Traces Content */}
      {isExpanded && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <TraceEntry key={`${entry.at}-${index}`} entry={entry} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 p-3">
          <p className="text-sm text-indigo-600 text-center">
            Click to view conversation history and tool calls
          </p>
        </div>
      )}
    </section>
  );
}
