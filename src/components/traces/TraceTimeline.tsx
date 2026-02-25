'use client';

import { useMemo } from 'react';
import { ClipboardIcon, UserIcon, WrenchIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { formatTimestamp, copyToClipboard, highlightSearchTerms } from '@/utils/traceFormatters';
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

interface TraceTimelineProps {
  traces: ChatHistoryEntry[];
  searchQuery?: string;
  selectedFilters?: string[];
  onExport?: (format: 'json' | 'text' | 'csv') => void;
}

interface TimelineEvent {
  step: ChatHistoryEntry;
  stepNumber: number;
  type: 'user' | 'agent' | 'tool';
  timestamp: Date;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  preview: string;
  duration?: number; // milliseconds from previous event
}

function createTimelineEvents(traces: ChatHistoryEntry[]): TimelineEvent[] {
  return traces.map((step, index) => {
    const timestamp = new Date(step.at);
    let event: Omit<TimelineEvent, 'duration'>;

    if (step.input) {
      event = {
        step,
        stepNumber: index + 1,
        type: 'user',
        timestamp,
        icon: UserIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'User Input',
        preview: step.input.length > 80 ? `${step.input.substring(0, 80)}...` : step.input
      };
    } else if (step.tool) {
      event = {
        step,
        stepNumber: index + 1,
        type: 'tool',
        timestamp,
        icon: WrenchIcon,
        iconBg: step.tool.status === 'OK' ? 'bg-green-100' : 'bg-red-100',
        iconColor: step.tool.status === 'OK' ? 'text-green-600' : 'text-red-600',
        title: `Tool Call: ${step.tool.functionName}`,
        preview: step.tool.content.length > 80 ? `${step.tool.content.substring(0, 80)}...` : step.tool.content
      };
    } else {
      event = {
        step,
        stepNumber: index + 1,
        type: 'agent',
        timestamp,
        icon: CpuChipIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        title: 'Agent Response',
        preview: step.content ? (step.content.length > 80 ? `${step.content.substring(0, 80)}...` : step.content) : 'No content'
      };
    }

    // Calculate duration from previous event
    let duration: number | undefined;
    if (index > 0) {
      const previousTimestamp = new Date(traces[index - 1].at);
      duration = timestamp.getTime() - previousTimestamp.getTime();
    }

    return { ...event, duration };
  });
}

export function TraceTimeline({ traces, searchQuery = '', selectedFilters = [], onExport }: TraceTimelineProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const timelineEvents = useMemo(() => createTimelineEvents(traces), [traces]);

  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents;

    // Apply type filters
    if (selectedFilters.length > 0 && !selectedFilters.includes('all')) {
      filtered = filtered.filter(event => selectedFilters.includes(event.type));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/);
      filtered = filtered.filter(event => {
        const searchText = [
          event.title,
          event.preview,
          event.step.input,
          event.step.content,
          event.step.tool?.functionName,
          event.step.tool?.content
        ].filter(Boolean).join(' ').toLowerCase();

        return searchTerms.every(term => searchText.includes(term));
      });
    }

    return filtered;
  }, [timelineEvents, selectedFilters, searchQuery]);

  const handleCopy = async (content: string, id: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const renderEventContent = (event: TimelineEvent) => {
    const searchTerms = searchQuery.trim() ? searchQuery.toLowerCase().split(/\s+/) : [];

    if (event.step.tool) {
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Function:</span> {event.step.tool.functionName}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Status:</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
              event.step.tool.status === 'OK'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {event.step.tool.status}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Result:</span>
            <div
              className="mt-1 text-gray-600"
              dangerouslySetInnerHTML={{
                __html: highlightSearchTerms(event.preview, searchTerms)
              }}
            />
          </div>
        </div>
      );
    }

    const content = event.step.input || event.step.content || '';
    return (
      <div
        className="text-sm text-gray-600"
        dangerouslySetInnerHTML={{
          __html: highlightSearchTerms(content, searchTerms)
        }}
      />
    );
  };

  const getFullContent = (event: TimelineEvent): string => {
    if (event.step.input) return event.step.input;
    if (event.step.tool) return event.step.tool.content;
    if (event.step.content) return event.step.content;
    return '';
  };

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">No traces match your search criteria</div>
        <div className="text-sm">Try adjusting your search terms or filters</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Conversation Timeline</h3>
          <span className="text-sm text-gray-500">
            {filteredEvents.length} of {timelineEvents.length} steps
          </span>
        </div>

        {onExport && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Export:</span>
            <button
              onClick={() => onExport('json')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              JSON
            </button>
            <button
              onClick={() => onExport('text')}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Text
            </button>
            <button
              onClick={() => onExport('csv')}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              CSV
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul className="space-y-6">
          {filteredEvents.map((event, index) => {
            const timeInfo = formatTimestamp(event.step.at);
            const isLast = index === filteredEvents.length - 1;

            return (
              <li key={`${event.stepNumber}-${event.timestamp.getTime()}`} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-4 top-12 -bottom-6 w-0.5 bg-gray-200" />
                )}

                <div className="flex items-start space-x-4">
                  {/* Event icon */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${event.iconBg} relative z-10`}>
                    <event.icon className={`w-4 h-4 ${event.iconColor}`} />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {event.title} (Step {event.stepNumber})
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span>{timeInfo.time}</span>
                          <span>{timeInfo.relative}</span>
                          {event.duration && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                              +{formatDuration(event.duration)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(getFullContent(event), `event-${event.stepNumber}`)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <ClipboardIcon className="w-3 h-3" />
                        <span>{copySuccess === `event-${event.stepNumber}` ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="mt-2">
                      {renderEventContent(event)}
                    </div>

                    {/* Additional tool call details */}
                    {event.step.tool && event.step.tool.functionArguments && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Show function arguments
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap font-mono text-gray-700">
                            {JSON.stringify(JSON.parse(event.step.tool.functionArguments), null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Timeline Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{timelineEvents.length}</div>
          <div className="text-sm text-gray-600">Total Steps</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {timelineEvents.filter(e => e.type === 'user').length}
          </div>
          <div className="text-sm text-gray-600">User Inputs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {timelineEvents.filter(e => e.type === 'tool').length}
          </div>
          <div className="text-sm text-gray-600">Tool Calls</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {timelineEvents.filter(e => e.type === 'agent').length}
          </div>
          <div className="text-sm text-gray-600">Agent Responses</div>
        </div>
      </div>
    </div>
  );
}