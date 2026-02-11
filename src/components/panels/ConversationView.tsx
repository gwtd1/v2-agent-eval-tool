'use client';

import { TestCase } from '@/lib/types/test-case';
import { LlmJudgeResults } from './LlmJudgeResults';

interface ConversationViewProps {
  testCase: TestCase | null;
}

/**
 * Detect if content looks like code or JSON
 */
function isCodeLike(content: string): boolean {
  if (!content) return false;

  // Check for JSON
  const trimmed = content.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for SQL-like content
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return true;
  }

  // Check for code patterns
  if (
    trimmed.includes('function ') ||
    trimmed.includes('const ') ||
    trimmed.includes('let ') ||
    trimmed.includes('import ') ||
    trimmed.includes('export ') ||
    /^\s*def\s+\w+/.test(trimmed) ||
    /^\s*class\s+\w+/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

/**
 * Format JSON content for display
 */
function formatContent(content: string): string {
  if (!content) return content;

  const trimmed = content.trim();

  // Try to pretty-print JSON
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, return as-is
    }
  }

  return content;
}

interface ContentBlockProps {
  content: string;
  variant: 'prompt' | 'response' | 'ground-truth';
}

function ContentBlock({ content, variant }: ContentBlockProps) {
  const isCode = isCodeLike(content);
  const formattedContent = isCode ? formatContent(content) : content;

  const bgColors = {
    prompt: 'bg-blue-50 border-blue-100',
    response: 'bg-gray-50 border-gray-200',
    'ground-truth': 'bg-amber-50 border-amber-100',
  };

  return (
    <div className={`rounded-lg p-4 border ${bgColors[variant]}`}>
      <p
        className={`text-gray-900 whitespace-pre-wrap break-words ${
          isCode ? 'font-mono text-sm' : ''
        }`}
      >
        {formattedContent}
      </p>
    </div>
  );
}

export function ConversationView({ testCase }: ConversationViewProps) {
  if (!testCase) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="mt-2 text-gray-500">Select a test case to view details</p>
        </div>
      </div>
    );
  }

  const hasGroundTruth = testCase.groundTruth !== null && testCase.groundTruth !== '';

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Prompt Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
              P
            </span>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Prompt
            </h3>
          </div>
          <ContentBlock content={testCase.prompt} variant="prompt" />
        </section>

        {/* Agent Response Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
              R
            </span>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Agent Response
            </h3>
          </div>
          {testCase.agentResponse ? (
            <ContentBlock content={testCase.agentResponse} variant="response" />
          ) : (
            <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
              <p className="text-gray-500 italic">No response recorded</p>
            </div>
          )}
        </section>

        {/* LLM Evaluation Section */}
        <section>
          <LlmJudgeResults result={testCase.llmJudgeResult} testCaseId={testCase.id} />
        </section>

        {/* Ground Truth Section - placed at bottom to require scrolling (per PRD) */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-medium">
              G
            </span>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Ground Truth
            </h3>
            {!hasGroundTruth && (
              <span className="text-xs text-gray-400 font-normal normal-case">
                (not available)
              </span>
            )}
          </div>
          {hasGroundTruth ? (
            <ContentBlock content={testCase.groundTruth!} variant="ground-truth" />
          ) : (
            <div className="rounded-lg p-4 border border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-400 text-center text-sm">
                N/A — No ground truth provided for this test case
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
