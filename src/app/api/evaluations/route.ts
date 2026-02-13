import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationsByRunId, getTestCasesByRunId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testRunId = searchParams.get('testRunId');
  const ratingFilter = searchParams.get('rating');

  console.log(`[API] GET /api/evaluations - testRunId: ${testRunId}, rating: ${ratingFilter}`);

  // Validate testRunId
  if (!testRunId) {
    return NextResponse.json(
      { error: 'testRunId query parameter is required' },
      { status: 400 }
    );
  }

  // Get evaluations for the test run
  const evaluations = getEvaluationsByRunId(testRunId);
  const testCases = getTestCasesByRunId(testRunId);

  // Create a map of test cases by ID for quick lookup
  const testCaseMap = new Map(testCases.map((tc) => [tc.id, tc]));

  // Combine evaluations with their test cases
  let results = evaluations.map((evaluation) => ({
    evaluation,
    testCase: testCaseMap.get(evaluation.testCaseId) || null,
  }));

  // Apply rating filter if provided
  if (ratingFilter) {
    if (ratingFilter === 'unrated') {
      results = results.filter((r) => r.evaluation.rating === null);
    } else if (ratingFilter === 'pass' || ratingFilter === 'fail') {
      results = results.filter((r) => r.evaluation.rating === ratingFilter);
    }
  }

  console.log(`[API] Returning ${results.length} evaluations`);

  return NextResponse.json({
    evaluations: results,
    count: results.length,
    summary: {
      total: evaluations.length,
      pass: evaluations.filter((e) => e.rating === 'pass').length,
      fail: evaluations.filter((e) => e.rating === 'fail').length,
      unrated: evaluations.filter((e) => e.rating === null).length,
    },
  });
}
