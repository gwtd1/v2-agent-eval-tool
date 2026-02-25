'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TraceSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  totalTraces: number;
  filteredCount: number;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: '📄', color: 'gray' },
  { id: 'user', label: 'User', icon: '👤', color: 'blue' },
  { id: 'agent', label: 'Agent', icon: '🤖', color: 'purple' },
  { id: 'tool', label: 'Tools', icon: '🔧', color: 'green' },
  { id: 'error', label: 'Errors', icon: '❌', color: 'red' }
];

const TIME_RANGE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'last_5m', label: 'Last 5 min' },
  { id: 'last_hour', label: 'Last hour' },
  { id: 'custom', label: 'Custom range' }
];

export function TraceSearch({
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFiltersChange,
  totalTraces,
  filteredCount
}: TraceSearchProps) {
  const [timeRange, setTimeRange] = useState('all');

  const handleFilterToggle = (filterId: string) => {
    if (filterId === 'all') {
      onFiltersChange([]);
    } else {
      const newFilters = selectedFilters.includes(filterId)
        ? selectedFilters.filter(f => f !== filterId)
        : [...selectedFilters, filterId];
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    onFiltersChange([]);
    onSearchChange('');
    setTimeRange('all');
  };

  const hasActiveFilters = selectedFilters.length > 0 || searchQuery.trim() || timeRange !== 'all';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search traces by content, function names, or results..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Showing {filteredCount} of {totalTraces} traces
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-gray-600">Type:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isSelected = option.id === 'all'
              ? selectedFilters.length === 0
              : selectedFilters.includes(option.id);

            return (
              <button
                key={option.id}
                onClick={() => handleFilterToggle(option.id)}
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? `bg-${option.color}-100 text-${option.color}-800 border border-${option.color}-200`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {isSelected && option.id !== 'all' && (
                  <XMarkIcon className="w-3 h-3 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Range Filter */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-gray-600">Time range:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setTimeRange(option.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === option.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Search Options */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          Advanced search options
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-3">
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Case sensitive search</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Use regular expressions</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Search in function arguments</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Include error messages only</span>
            </label>
          </div>
        </div>
      </details>

      {/* Search Suggestions */}
      {searchQuery.trim() && (
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 mb-2">Search suggestions:</div>
          <div className="flex flex-wrap gap-1">
            {['error', 'function', 'result', 'status:OK', 'status:ERROR'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSearchChange(suggestion)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}