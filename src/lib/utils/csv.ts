import { Evaluation } from '@/lib/types/evaluation';
import { TestCase } from '@/lib/types/test-case';

interface EvaluationWithTestCase {
  evaluation: Evaluation;
  testCase: TestCase | null;
}

/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Doubles any existing quotes
 */
function escapeCSVValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if we need to escape
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r') || stringValue.includes('"')) {
    // Double any quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts evaluation data to CSV format
 */
export function evaluationsToCSV(evaluations: EvaluationWithTestCase[]): string {
  const headers = [
    'Test Case ID',
    'Prompt',
    'Agent Response',
    'Ground Truth',
    'Rating',
    'Notes',
    'Evaluated At',
  ];

  const rows = evaluations.map(({ evaluation, testCase }) => [
    escapeCSVValue(evaluation.testCaseId),
    escapeCSVValue(testCase?.prompt),
    escapeCSVValue(testCase?.agentResponse),
    escapeCSVValue(testCase?.groundTruth),
    escapeCSVValue(evaluation.rating),
    escapeCSVValue(evaluation.notes),
    escapeCSVValue(evaluation.updatedAt),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Downloads CSV data as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Exports evaluations to a CSV file and triggers download
 */
export function exportEvaluationsToCSV(
  evaluations: EvaluationWithTestCase[],
  testRunId: string
): void {
  const csvContent = evaluationsToCSV(evaluations);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `evaluations-${testRunId}-${timestamp}.csv`;
  downloadCSV(csvContent, filename);
}
