/**
 * Utility functions for formatting and processing trace data
 */

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

/**
 * Format trace content with syntax highlighting for different content types
 */
export function formatTraceContent(content: string, language?: string): string {
  if (!content) return '';

  // For JSON content, attempt to pretty-print
  if (language === 'json' || isJsonString(content)) {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If parsing fails, return original content
      return content;
    }
  }

  // For other content, return as-is with basic formatting
  return content;
}

/**
 * Check if a string is valid JSON
 */
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that don't support clipboard API
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch {
      console.error('Failed to copy to clipboard');
      return false;
    }
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): {
  relative: string;
  absolute: string;
  time: string;
} {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  let relative: string;
  if (diffMinutes < 1) {
    relative = 'Just now';
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    relative = `${hours}h ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    relative = `${days}d ago`;
  }

  return {
    relative,
    absolute: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  };
}

/**
 * Extract search keywords from trace content for highlighting
 */
export function extractSearchKeywords(traces: ChatHistoryEntry[], searchQuery: string): string[] {
  if (!searchQuery.trim()) return [];

  const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
  return keywords;
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length || !text) return text;

  let highlighted = text;
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Export traces to different formats
 */
export function exportTraces(traces: ChatHistoryEntry[], format: 'json' | 'text' | 'csv'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(traces, null, 2);

    case 'text':
      return traces.map((trace, index) => {
        const timestamp = new Date(trace.at).toISOString();
        let content = '';

        if (trace.input) {
          content = `User: ${trace.input}`;
        } else if (trace.tool) {
          content = `Tool: ${trace.tool.functionName}\nArguments: ${trace.tool.functionArguments}\nResult: ${trace.tool.content}`;
        } else if (trace.content) {
          content = `Agent: ${trace.content}`;
        }

        return `Step ${index + 1} (${timestamp}):\n${content}\n${'='.repeat(50)}`;
      }).join('\n\n');

    case 'csv':
      const headers = ['Step', 'Timestamp', 'Type', 'Content', 'Status'];
      const rows = traces.map((trace, index) => {
        const timestamp = new Date(trace.at).toISOString();
        let type = '';
        let content = '';
        let status = '';

        if (trace.input) {
          type = 'User Input';
          content = trace.input;
        } else if (trace.tool) {
          type = 'Tool Call';
          content = `${trace.tool.functionName}: ${trace.tool.content}`;
          status = trace.tool.status;
        } else if (trace.content) {
          type = 'Agent Response';
          content = trace.content;
        }

        // Escape CSV content
        const escapeCsv = (str: string) => {
          if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          index + 1,
          timestamp,
          type,
          escapeCsv(content),
          status
        ].join(',');
      });

      return [headers.join(','), ...rows].join('\n');

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Calculate performance metrics from traces
 */
export function calculateTraceMetrics(traces: ChatHistoryEntry[]): {
  totalSteps: number;
  toolCalls: number;
  averageStepTime: number;
  totalDuration: number;
  errorCount: number;
} {
  if (!traces.length) {
    return {
      totalSteps: 0,
      toolCalls: 0,
      averageStepTime: 0,
      totalDuration: 0,
      errorCount: 0
    };
  }

  const toolCalls = traces.filter(t => t.tool).length;
  const errorCount = traces.filter(t => t.tool?.status !== 'OK').length;

  // Calculate timing metrics if timestamps are available
  const timestamps = traces.map(t => new Date(t.at).getTime()).sort((a, b) => a - b);
  const totalDuration = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;
  const averageStepTime = totalDuration / Math.max(traces.length - 1, 1);

  return {
    totalSteps: traces.length,
    toolCalls,
    averageStepTime: Math.round(averageStepTime),
    totalDuration,
    errorCount
  };
}