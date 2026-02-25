import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/utils/environmentDetection';
import { createTdLlmClientWithCredentials } from '@/lib/api/llm-client';

/**
 * Test API connection with provided credentials using the correct TD LLM API
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, baseUrl } = await request.json();

    // Validate input
    const validation = validateApiKey(apiKey);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Determine the correct API URL
    const finalBaseUrl = baseUrl || 'https://llm-api.us01.treasuredata.com';

    // Create TD LLM client with provided credentials
    const client = createTdLlmClientWithCredentials(apiKey, finalBaseUrl);

    console.log(`[API] Testing connection to ${finalBaseUrl} with API key ${apiKey.substring(0, 8)}...`);

    // Test the connection by fetching projects
    const startTime = Date.now();
    const projects = await client.getProjects();
    const duration = Date.now() - startTime;

    console.log(`[API] Connection test successful! Fetched ${projects.length} projects in ${duration}ms`);

    return NextResponse.json({
      success: true,
      apiUrl: finalBaseUrl,
      projectCount: projects.length,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      message: `Successfully connected! Found ${projects.length} projects.`
    });

  } catch (error) {
    console.error('[API] Test connection error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Parse common TD API errors
    if (errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your TD API key and try again.' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('403')) {
      return NextResponse.json(
        { error: 'API key does not have required permissions. Please ensure your API key has access to projects and agents.' },
        { status: 403 }
      );
    }

    if (errorMessage.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to Treasure Data API. Please check your internet connection and API URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: `Connection test failed: ${errorMessage}`,
        details: 'Please verify your API key and base URL are correct.'
      },
      { status: 500 }
    );
  }
}