'use client';

import { TestCase } from '@/lib/types/test-case';

interface ConversationViewProps {
  testCase: TestCase | null;
}

export function ConversationView({ testCase }: ConversationViewProps) {
  if (!testCase) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a test case to view details
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Prompt Section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Prompt
        </h3>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-gray-900 whitespace-pre-wrap">{testCase.prompt}</p>
        </div>
      </section>

      {/* Agent Response Section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Agent Response
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap">
            {testCase.agentResponse || 'No response recorded'}
          </p>
        </div>
      </section>

      {/* Ground Truth Section - placed at bottom to require scrolling */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Ground Truth
        </h3>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-gray-900 whitespace-pre-wrap">
            {testCase.groundTruth || 'No ground truth provided'}
          </p>
        </div>
      </section>
    </div>
  );
}
