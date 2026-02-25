'use client';

import { useState } from 'react';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { formatTraceContent, copyToClipboard, formatTimestamp } from '@/utils/traceFormatters';

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

interface ToolCallTabsProps {
  toolCall: ToolCallInfo;
  timestamp: string;
  stepNumber: number;
}

type TabType = 'input' | 'output' | 'metadata' | 'timing';

interface TabInfo {
  id: TabType;
  label: string;
  icon: string;
  count?: number;
}

export function ToolCallTabs({ toolCall, timestamp, stepNumber }: ToolCallTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopy = async (content: string, type: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const timeInfo = formatTimestamp(timestamp);

  const tabs: TabInfo[] = [
    { id: 'input', label: 'Input', icon: '📥' },
    { id: 'output', label: 'Output', icon: '📤' },
    { id: 'metadata', label: 'Metadata', icon: '📋' },
    { id: 'timing', label: 'Timing', icon: '⏱️' }
  ];

  const getTabContent = (tab: TabType) => {
    switch (tab) {
      case 'input':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Function Name:</h4>
                <button
                  onClick={() => handleCopy(toolCall.functionName, 'functionName')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ClipboardIcon className="w-3 h-3" />
                  <span>{copySuccess === 'functionName' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <code className="text-sm font-mono text-blue-700">{toolCall.functionName}</code>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Function Arguments:</h4>
                <button
                  onClick={() => handleCopy(toolCall.functionArguments, 'arguments')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ClipboardIcon className="w-3 h-3" />
                  <span>{copySuccess === 'arguments' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3 max-h-96 overflow-auto">
                <pre className="text-sm font-mono text-gray-800">
                  {formatTraceContent(toolCall.functionArguments, 'json')}
                </pre>
              </div>
            </div>

            {toolCall.targetFunction && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Target Function:</h4>
                <div className="bg-blue-50 rounded-md p-3">
                  <code className="text-sm font-mono text-blue-800">{toolCall.targetFunction}</code>
                </div>
              </div>
            )}
          </div>
        );

      case 'output':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Tool Result:</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    toolCall.status === 'OK'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {toolCall.status}
                  </span>
                  <button
                    onClick={() => handleCopy(toolCall.content, 'output')}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <ClipboardIcon className="w-3 h-3" />
                    <span>{copySuccess === 'output' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-3 max-h-96 overflow-auto">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                  {toolCall.content}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-md p-3">
                <h5 className="text-sm font-medium text-blue-900 mb-1">Output Length</h5>
                <div className="text-lg font-mono text-blue-700">{toolCall.content.length} chars</div>
              </div>
              <div className="bg-green-50 rounded-md p-3">
                <h5 className="text-sm font-medium text-green-900 mb-1">Status</h5>
                <div className="text-lg font-mono text-green-700">{toolCall.status}</div>
              </div>
            </div>
          </div>
        );

      case 'metadata':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Tool Call ID</h5>
                <div className="bg-gray-50 rounded-md p-2">
                  <code className="text-xs font-mono text-gray-600">
                    {toolCall.id || 'N/A'}
                  </code>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Step Number</h5>
                <div className="bg-gray-50 rounded-md p-2">
                  <code className="text-xs font-mono text-gray-600">
                    {stepNumber}
                  </code>
                </div>
              </div>
            </div>

            {toolCall.toolTarget && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Tool Target Information</h5>
                <div className="bg-blue-50 rounded-md p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Type:</span>
                      <span className="text-sm text-blue-600">{toolCall.toolTarget.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Name:</span>
                      <span className="text-sm text-blue-600">{toolCall.toolTarget.name}</span>
                    </div>
                    {toolCall.toolTarget.id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">ID:</span>
                        <code className="text-xs font-mono text-blue-500">
                          {toolCall.toolTarget.id}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-700">Raw Tool Call Data</h5>
                <button
                  onClick={() => handleCopy(JSON.stringify(toolCall, null, 2), 'rawData')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ClipboardIcon className="w-3 h-3" />
                  <span>{copySuccess === 'rawData' ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-auto">
                <pre className="text-xs font-mono text-gray-600">
                  {JSON.stringify(toolCall, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        );

      case 'timing':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-md p-3">
                <h5 className="text-sm font-medium text-blue-900 mb-1">Timestamp</h5>
                <div className="text-sm font-mono text-blue-700">{timeInfo.time}</div>
                <div className="text-xs text-blue-600 mt-1">{timeInfo.relative}</div>
              </div>
              <div className="bg-green-50 rounded-md p-3">
                <h5 className="text-sm font-medium text-green-900 mb-1">Date</h5>
                <div className="text-sm font-mono text-green-700">{timeInfo.absolute}</div>
              </div>
              <div className="bg-purple-50 rounded-md p-3">
                <h5 className="text-sm font-medium text-purple-900 mb-1">Step</h5>
                <div className="text-lg font-mono text-purple-700">#{stepNumber}</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">ISO Timestamp</h5>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-700">{timestamp}</code>
                  <button
                    onClick={() => handleCopy(timestamp, 'timestamp')}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <ClipboardIcon className="w-3 h-3" />
                    <span>{copySuccess === 'timestamp' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">Performance Metrics</h5>
              <div className="bg-yellow-50 rounded-md p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-yellow-800">Arguments Size:</span>
                    <div className="text-lg font-mono text-yellow-700">
                      {toolCall.functionArguments.length} bytes
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-yellow-800">Result Size:</span>
                    <div className="text-lg font-mono text-yellow-700">
                      {toolCall.content.length} bytes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Content not available</div>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-0" aria-label="Tool call details">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {getTabContent(activeTab)}
      </div>
    </div>
  );
}