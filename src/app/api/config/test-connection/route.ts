import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/utils/environmentDetection';

/**
 * Test API connection with provided credentials
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

    // Determine the API URL to test against
    const testUrl = baseUrl
      ? (baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`)
      : 'https://llm-api.us01.treasuredata.com/api';

    // Test the connection by making a simple API call
    const testResponse = await fetch(`${testUrl}/agents`, {
      headers: {
        'Authorization': `TD1 ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('[API] Test connection failed:', testResponse.status, errorText);

      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key or insufficient permissions' },
          { status: 401 }
        );
      }

      if (testResponse.status === 403) {
        return NextResponse.json(
          { error: 'API key does not have required permissions' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Connection test failed (${testResponse.status})` },
        { status: 400 }
      );
    }

    const data = await testResponse.json();

    return NextResponse.json({
      success: true,
      apiUrl: testUrl,
      agentCount: data.data?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Test connection error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to Treasure Data API. Please check your internet connection and API URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Connection test failed due to an unexpected error' },
      { status: 500 }
    );
  }
}