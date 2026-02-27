'use client';

import { useState } from 'react';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import { TraceCard } from './TraceCard';
import { TraceTimeline } from './TraceTimeline';
import { TraceSearch } from './TraceSearch';
import { useTraceExpansion } from '@/hooks/useTraceExpansion';
import { exportTraces } from '@/utils/traceFormatters';
import {
  ViewColumnsIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

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

interface ExpandableTracesSectionProps {
  traces: string | null;
  agentName?: string;
}

type ViewMode = 'cards' | 'timeline';

/**
 * Parse traces JSON string into typed array
 */
function parseTraces(tracesJson: string): ChatHistoryEntry[] {
  try {
    const parsed = JSON.parse(tracesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse traces to count entries and tool calls
 */
function getTraceCounts(tracesJson: string): { entries: number; toolCalls: number; errors: number } {
  try {
    const entries = JSON.parse(tracesJson) as ChatHistoryEntry[];
    const toolCalls = entries.filter(e => e.tool !== undefined).length;
    const errors = entries.filter(e => e.tool?.status !== 'OK').length;
    return { entries: entries.length, toolCalls, errors };
  } catch {
    return { entries: 0, toolCalls: 0, errors: 0 };
  }
}

/**
 * Filter traces based on search query and filters
 */
function filterTraces(traces: ChatHistoryEntry[], searchQuery: string, selectedFilters: string[]): ChatHistoryEntry[] {
  let filtered = [...traces];

  // Apply type filters
  if (selectedFilters.length > 0) {
    filtered = filtered.filter(trace => {
      if (selectedFilters.includes('user') && trace.input) return true;
      if (selectedFilters.includes('agent') && trace.content && !trace.tool) return true;
      if (selectedFilters.includes('tool') && trace.tool) return true;
      if (selectedFilters.includes('error') && trace.tool?.status !== 'OK') return true;
      return false;
    });
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const searchTerms = searchQuery.toLowerCase().split(/\s+/);
    filtered = filtered.filter(trace => {
      const searchText = [
        trace.input,
        trace.content,
        trace.tool?.functionName,
        trace.tool?.content,
        trace.tool?.functionArguments
      ].filter(Boolean).join(' ').toLowerCase();

      return searchTerms.every(term => searchText.includes(term));
    });
  }

  return filtered;
}

export function ExpandableTracesSection({ traces, agentName }: ExpandableTracesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Parse traces and calculate counts early to determine filteredTraces length for hook
  const parsedTraces = traces ? parseTraces(traces) : [];
  const { entries, toolCalls, errors } = traces ? getTraceCounts(traces) : { entries: 0, toolCalls: 0, errors: 0 };
  const filteredTraces = filterTraces(parsedTraces, searchQuery, selectedFilters);

  // React hooks must be called unconditionally
  const {
    toggleCard,
    isCardExpanded,
    toggleAll,
    expansionStats
  } = useTraceExpansion(filteredTraces.length);

  // Early returns after all hooks
  if (!traces) {
    return null;
  }

  if (entries === 0) {
    return null;
  }

  // Build count string for header
  const countParts = [`${entries} ${entries === 1 ? 'step' : 'steps'}`];
  if (toolCalls > 0) {
    countParts.push(`${toolCalls} tool ${toolCalls === 1 ? 'call' : 'calls'}`);
  }
  if (errors > 0) {
    countParts.push(`${errors} ${errors === 1 ? 'error' : 'errors'}`);
  }
  const countString = countParts.join(', ');

  const handleExport = (format: 'json' | 'text' | 'csv') => {
    try {
      const exportData = exportTraces(filteredTraces, format);
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' :
             format === 'csv' ? 'text/csv' : 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traces-${agentName || 'agent'}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderCardView = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAll}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {expansionStats.allExpanded ? (
              <>
                <ArrowsPointingInIcon className="w-4 h-4" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="w-4 h-4" />
                <span>Expand All</span>
              </>
            )}
          </button>

          <span className="text-sm text-gray-500">
            {expansionStats.expandedCount} of {expansionStats.totalCount} expanded
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
          >
            <ClockIcon className="w-4 h-4" />
            <span>Timeline View</span>
          </button>
        </div>
      </div>

      {/* Trace Cards */}
      <div className="space-y-3">
        {filteredTraces.map((trace, index) => (
          <TraceCard
            key={`${index}-${trace.at}`}
            step={trace}
            stepNumber={index + 1}
            isExpanded={isCardExpanded(index)}
            onToggle={() => toggleCard(index)}
          />
        ))}
      </div>
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setViewMode('cards')}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <ViewColumnsIcon className="w-4 h-4" />
          <span>Card View</span>
        </button>
      </div>

      <TraceTimeline
        traces={filteredTraces}
        searchQuery={searchQuery}
        selectedFilters={selectedFilters}
        onExport={handleExport}
      />
    </div>
  );

  return (
    <ExpandableSection
      title="Conversation Traces"
      badge="T"
      variant="traces"
      count={countString}
      isExpandable={true}
      defaultExpanded={isExpanded}
      onToggle={setIsExpanded}
    >
      <div className="space-y-4">
        {/* Search and Filters */}
        <TraceSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
          totalTraces={parsedTraces.length}
          filteredCount={filteredTraces.length}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ViewColumnsIcon className="w-4 h-4" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span>Timeline</span>
              </button>
            </div>

            {filteredTraces.length !== parsedTraces.length && (
              <span className="text-sm text-orange-600">
                Filtered: {filteredTraces.length} of {parsedTraces.length} traces
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Export:</span>
            <button
              onClick={() => handleExport('json')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              JSON
            </button>
            <span>•</span>
            <button
              onClick={() => handleExport('text')}
              className="text-green-600 hover:text-green-800 underline"
            >
              Text
            </button>
            <span>•</span>
            <button
              onClick={() => handleExport('csv')}
              className="text-purple-600 hover:text-purple-800 underline"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Content */}
        {filteredTraces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">No traces match your search criteria</div>
            <div className="text-sm">Try adjusting your search terms or filters</div>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? renderCardView() : renderTimelineView()}
          </>
        )}
      </div>
    </ExpandableSection>
  );
}