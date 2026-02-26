/**
 * Setup Debugging Utilities
 *
 * Provides debugging tools for troubleshooting the API key setup modal
 * and related setup functionality.
 */

export interface SetupDebugInfo {
  localStorage: {
    skip_setup: string | null;
    setup_completed: string | null;
    td_api_key: string | null;
    td_proxy_url: string | null;
  };
  environment: {
    NODE_ENV: string;
    hasEnvFile: boolean;
  };
  api: {
    checkEnvEndpoint: string;
    testConnectionEndpoint: string;
  };
}

/**
 * Get current setup debugging information
 */
export function getSetupDebugInfo(): SetupDebugInfo {
  return {
    localStorage: {
      skip_setup: localStorage.getItem('skip_setup'),
      setup_completed: localStorage.getItem('setup_completed'),
      td_api_key: localStorage.getItem('td_api_key') ? '***EXISTS***' : null,
      td_proxy_url: localStorage.getItem('td_proxy_url'),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      hasEnvFile: typeof window !== 'undefined' && (window as typeof window & { __ENV_FILE_EXISTS?: boolean }).__ENV_FILE_EXISTS === true,
    },
    api: {
      checkEnvEndpoint: '/api/config/check-env',
      testConnectionEndpoint: '/api/config/test-connection',
    }
  };
}

/**
 * Clear all setup-related localStorage data
 */
export function clearAllSetupData(): void {
  const keysToRemove = ['skip_setup', 'setup_completed', 'td_api_key', 'td_proxy_url'];

  console.log('[Setup Debug] 🧹 Clearing all setup data...');

  keysToRemove.forEach(key => {
    const oldValue = localStorage.getItem(key);
    if (oldValue !== null) {
      localStorage.removeItem(key);
      console.log(`[Setup Debug] Removed ${key}: ${key === 'td_api_key' ? '***REDACTED***' : oldValue}`);
    }
  });

  console.log('[Setup Debug] ✅ All setup data cleared');
}

/**
 * Test the setup detection API endpoint
 */
export async function testSetupDetectionAPI(): Promise<{ success: boolean; data?: object; status?: number; error?: string }> {
  try {
    console.log('[Setup Debug] 🧪 Testing setup detection API...');

    const response = await fetch('/api/config/check-env');
    const data = await response.json();

    console.log('[Setup Debug] API Response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    return { success: true, data, status: response.status };
  } catch (error) {
    console.error('[Setup Debug] API Test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Print comprehensive debugging report
 */
export function printSetupDebugReport(): void {
  console.log('='.repeat(50));
  console.log('🔍 SETUP DEBUG REPORT');
  console.log('='.repeat(50));

  const info = getSetupDebugInfo();

  console.group('📱 Browser Storage');
  Object.entries(info.localStorage).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = key === 'td_api_key' && value ? '***EXISTS***' : (value || 'null');
    console.log(`${status} ${key}: ${displayValue}`);
  });
  console.groupEnd();

  console.group('🌐 Environment');
  console.log(`NODE_ENV: ${info.environment.NODE_ENV}`);
  console.log(`Has .env file: ${info.environment.hasEnvFile ? 'Yes' : 'Unknown'}`);
  console.groupEnd();

  console.group('🔗 API Endpoints');
  console.log(`Check Environment: ${info.api.checkEnvEndpoint}`);
  console.log(`Test Connection: ${info.api.testConnectionEndpoint}`);
  console.groupEnd();

  console.group('🛠️ Available Debug Methods');
  if (typeof window !== 'undefined' && (window as typeof window & { setupDebug?: object }).setupDebug) {
    console.log('✅ window.setupDebug.getCurrentState() - Get current setup state');
    console.log('✅ window.setupDebug.resetSetupData() - Reset all setup data');
    console.log('✅ window.setupDebug.forceShowModal() - Force show setup modal');
    console.log('✅ window.setupDebug.forceHideModal() - Force hide setup modal');
    console.log('✅ window.setupDebug.checkSetupStatus() - Re-run setup check');
  } else {
    console.log('❌ Global debug methods not available (not in development mode?)');
  }
  console.groupEnd();

  console.log('='.repeat(50));
}

/**
 * Quick setup for manual testing - clears everything and provides instructions
 */
export function prepareForModalTesting(): void {
  console.log('🧪 PREPARING FOR SETUP MODAL TESTING');
  console.log('=' .repeat(40));

  // Clear all setup data
  clearAllSetupData();

  // Test API
  testSetupDetectionAPI().then(result => {
    if (result.success) {
      console.log('✅ API is working');
      console.log('📋 Next steps:');
      console.log('1. Refresh the page');
      console.log('2. The setup modal should appear immediately');
      console.log('3. If it doesn\'t appear, check the browser console for [Setup] logs');
      console.log('4. Use window.setupDebug.forceShowModal() to force display');
    } else {
      console.log('❌ API test failed - this might be why modal isn\'t showing');
      console.log('Error:', result.error);
    }
  });
}