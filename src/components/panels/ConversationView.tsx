'use client';

import { TestCase } from '@/lib/types/test-case';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import { LlmJudgeResults } from './LlmJudgeResults';
import { TracesSection } from './TracesSection';

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

interface ContentDisplayProps {
  content: string;
}

function ContentDisplay({ content }: ContentDisplayProps) {
  const isCode = isCodeLike(content);
  const formattedContent = isCode ? formatContent(content) : content;

  return (
    <p
      className={`text-sm text-gray-700 whitespace-pre-wrap break-words ${
        isCode ? 'font-mono bg-gray-50 rounded p-3 border border-gray-100' : ''
      }`}
    >
      {formattedContent}
    </p>
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
        <ExpandableSection
          title="Prompt"
          badge="P"
          variant="prompt"
        >
          <ContentDisplay content={testCase.prompt} />
        </ExpandableSection>

        {/* Agent Response Section */}
        <ExpandableSection
          title="Agent Response"
          badge="R"
          variant="response"
          headerAction={
            testCase.chatLink && (
              <a
                href={testCase.chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View Full Conversation
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )
          }
        >
          {testCase.agentResponse ? (
            <ContentDisplay content={testCase.agentResponse} />
          ) : (
            <p className="text-gray-500 italic">No response recorded</p>
          )}
        </ExpandableSection>

        {/* Conversation Traces Section */}
        <TracesSection traces={testCase.traces} />

        {/* LLM Evaluation Section */}
        <LlmJudgeResults result={testCase.llmJudgeResult} testCaseId={testCase.id} />

        {/* Ground Truth Section */}
        <ExpandableSection
          title="Ground Truth"
          badge="G"
          variant="ground-truth"
        >
          {hasGroundTruth ? (
            <ContentDisplay content={testCase.groundTruth!} />
          ) : (
            <p className="text-gray-400 text-center text-sm">
              N/A - No ground truth provided for this test case
            </p>
          )}
        </ExpandableSection>
      </div>
    </div>
  );
}
