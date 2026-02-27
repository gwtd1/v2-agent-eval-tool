'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { formatTraceContent, copyToClipboard } from '@/utils/traceFormatters';

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

interface TraceCardProps {
  step: ChatHistoryEntry;
  stepNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function getStepType(step: ChatHistoryEntry): {
  type: 'user' | 'agent' | 'tool';
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
} {
  if (step.input) {
    return {
      type: 'user',
      label: 'User Input',
      icon: '👤',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900'
    };
  } else if (step.tool) {
    return {
      type: 'tool',
      label: `Tool Call: ${step.tool.functionName}`,
      icon: '🔧',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900'
    };
  } else {
    return {
      type: 'agent',
      label: 'Agent Response',
      icon: '🤖',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900'
    };
  }
}

function getPreviewContent(step: ChatHistoryEntry): string {
  if (step.input) {
    return step.input.length > 50 ? `${step.input.substring(0, 50)}...` : step.input;
  } else if (step.tool) {
    return step.tool.content.length > 50 ? `${step.tool.content.substring(0, 50)}...` : step.tool.content;
  } else if (step.content) {
    return step.content.length > 50 ? `${step.content.substring(0, 50)}...` : step.content;
  }
  return 'No content available';
}

function getFullContent(step: ChatHistoryEntry): { label: string; content: string; language?: string } {
  if (step.input) {
    return { label: 'User Message', content: step.input };
  } else if (step.tool) {
    return {
      label: 'Tool Result',
      content: step.tool.content,
      language: 'json'
    };
  } else if (step.content) {
    return { label: 'Agent Response', content: step.content };
  }
  return { label: 'Content', content: 'No content available' };
}

export function TraceCard({ step, stepNumber, isExpanded, onToggle }: TraceCardProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const stepInfo = getStepType(step);
  const previewContent = getPreviewContent(step);
  const fullContent = getFullContent(step);
  const timestamp = new Date(step.at);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  const handleCopy = async (content: string, type: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg mb-3 ${stepInfo.bgColor}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{stepInfo.icon}</span>
          <div className="text-left">
            <div className={`font-medium ${stepInfo.textColor}`}>
              {stepInfo.label} (Step {stepNumber})
            </div>
            <div className="text-sm text-gray-500">
              {timeAgo} • {timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isExpanded && (
            <div className="text-sm text-gray-600 max-w-md truncate">
              {previewContent}
            </div>
          )}
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{fullContent.label}:</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(fullContent.content, 'content')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ClipboardIcon className="w-3 h-3" />
                  <span>{copySuccess === 'content' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {formatTraceContent(fullContent.content, fullContent.language)}
              </pre>
            </div>

            {/* Tool Call Details */}
            {step.tool && (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-700">Function Arguments:</h5>
                    <button
                      onClick={() => handleCopy(step.tool!.functionArguments, 'arguments')}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ClipboardIcon className="w-3 h-3" />
                      <span>{copySuccess === 'arguments' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {formatTraceContent(step.tool.functionArguments, 'json')}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      step.tool.status === 'OK'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {step.tool.status}
                    </span>
                  </div>
                  {step.tool.targetFunction && (
                    <div>
                      <span className="font-medium text-gray-700">Target Function:</span>
                      <span className="ml-2 text-gray-600">{step.tool.targetFunction}</span>
                    </div>
                  )}
                </div>

                {step.tool.toolTarget && (
                  <div className="bg-blue-50 rounded-md p-3">
                    <h6 className="font-medium text-blue-900 mb-2">Tool Target:</h6>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Type:</span>
                        <span className="ml-2 text-blue-600">{step.tool.toolTarget.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Name:</span>
                        <span className="ml-2 text-blue-600">{step.tool.toolTarget.name}</span>
                      </div>
                      {step.tool.toolTarget.id && (
                        <div>
                          <span className="font-medium text-blue-700">ID:</span>
                          <span className="ml-2 text-blue-600 font-mono">{step.tool.toolTarget.id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}