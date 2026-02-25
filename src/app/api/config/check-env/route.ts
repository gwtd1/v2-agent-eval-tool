import { NextResponse } from 'next/server';

/**
 * Check if API key is configured in environment variables
 */
export async function GET() {
  try {
    const hasEnvKey = !!process.env.TD_API_KEY && process.env.TD_API_KEY !== 'your-master-api-key';
    const hasBaseUrl = !!process.env.TD_LLM_BASE_URL;

    return NextResponse.json({
      hasEnvKey,
      hasBaseUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Check env error:', error);
    return NextResponse.json(
      { error: 'Failed to check environment configuration' },
      { status: 500 }
    );
  }
}