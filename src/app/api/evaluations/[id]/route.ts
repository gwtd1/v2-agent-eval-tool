import { NextRequest, NextResponse } from 'next/server';
import { getEvaluation, updateEvaluation, getTestCase } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[API] GET /api/evaluations/${id}`);

  const evaluation = getEvaluation(id);

  if (!evaluation) {
    return NextResponse.json(
      { error: 'Evaluation not found' },
      { status: 404 }
    );
  }

  const testCase = getTestCase(evaluation.testCaseId);

  return NextResponse.json({
    evaluation,
    testCase,
  });
}

async function handleUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  method: string
) {
  const { id } = await params;
  console.log(`[API] ${method} /api/evaluations/${id}`);

  // Parse request body
  let body: { rating?: string | null; notes?: string; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate rating if provided
  if (body.rating !== undefined) {
    if (body.rating !== null && body.rating !== 'true' && body.rating !== 'false') {
      return NextResponse.json(
        { error: 'rating must be "true", "false", or null' },
        { status: 400 }
      );
    }
  }

  // Validate notes if provided
  if (body.notes !== undefined && typeof body.notes !== 'string') {
    return NextResponse.json(
      { error: 'notes must be a string' },
      { status: 400 }
    );
  }

  // Validate durationMs if provided
  if (body.durationMs !== undefined) {
    if (typeof body.durationMs !== 'number' || body.durationMs < 0) {
      return NextResponse.json(
        { error: 'durationMs must be a positive number' },
        { status: 400 }
      );
    }
  }

  // Validate "false" rating requires notes (V1 rule)
  if (body.rating === 'false') {
    const existingEval = getEvaluation(id);
    const notes = body.notes ?? existingEval?.notes ?? '';
    if (!notes.trim()) {
      return NextResponse.json(
        { error: 'Notes are required when rating is "false"' },
        { status: 400 }
      );
    }
  }

  // Update the evaluation
  const updated = updateEvaluation(id, {
    rating: body.rating as 'true' | 'false' | null | undefined,
    notes: body.notes,
    durationMs: body.durationMs,
  });

  if (!updated) {
    return NextResponse.json(
      { error: 'Evaluation not found' },
      { status: 404 }
    );
  }

  console.log(`[API] Evaluation ${id} updated`);

  return NextResponse.json({
    evaluation: updated,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context, 'PATCH');
}
