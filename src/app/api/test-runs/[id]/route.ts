import { NextRequest, NextResponse } from 'next/server';
import { getTestRun, getTestCasesByRunId, deleteTestRun } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[API] GET /api/test-runs/${id}`);

  const testRun = getTestRun(id);

  if (!testRun) {
    return NextResponse.json(
      { error: 'Test run not found' },
      { status: 404 }
    );
  }

  const testCases = getTestCasesByRunId(id);

  return NextResponse.json({
    testRun,
    testCases,
    testCaseCount: testCases.length,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[API] DELETE /api/test-runs/${id}`);

  const deleted = deleteTestRun(id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Test run not found or already deleted' },
      { status: 404 }
    );
  }

  console.log(`[API] Test run ${id} deleted (cascading to test cases and evaluations)`);

  return NextResponse.json({
    success: true,
    message: 'Test run and all associated data deleted',
  });
}
