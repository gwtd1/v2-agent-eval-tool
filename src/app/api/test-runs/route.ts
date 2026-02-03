import { NextResponse } from 'next/server';
import { getAllTestRuns } from '@/lib/db/queries';

export async function GET() {
  console.log('[API] GET /api/test-runs - Fetching all test runs');

  const testRuns = getAllTestRuns();

  console.log(`[API] Returning ${testRuns.length} test runs`);

  return NextResponse.json({
    testRuns,
    count: testRuns.length,
  });
}
