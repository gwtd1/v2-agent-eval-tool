export interface EnvironmentContext {
  platform: 'local' | 'vercel' | 'docker' | 'cloudrun';
  canWriteEnvFile: boolean;
  recommendedStorage: 'env' | 'localStorage' | 'both';
}

/**
 * Detect the current deployment environment and capabilities
 */
export function detectEnvironment(): EnvironmentContext {
  // Check for Vercel deployment
  if (process.env.VERCEL) {
    return {
      platform: 'vercel',
      canWriteEnvFile: false,
      recommendedStorage: 'localStorage',
    };
  }

  // Check for Docker deployment
  if (process.env.DOCKER || process.env.DOCKERIZED) {
    return {
      platform: 'docker',
      canWriteEnvFile: false,
      recommendedStorage: 'env',
    };
  }

  // Check for Cloud Run deployment
  if (process.env.K_SERVICE || process.env.CLOUD_RUN) {
    return {
      platform: 'cloudrun',
      canWriteEnvFile: false,
      recommendedStorage: 'env',
    };
  }

  // Default to local development
  return {
    platform: 'local',
    canWriteEnvFile: true,
    recommendedStorage: 'both',
  };
}

/**
 * Get region-specific configuration
 */
export function getRegionConfig(region: string = 'us-prod') {
  const regionConfigs = {
    'us-dev': {
      apiUrl: 'https://llm-api-development.us01.treasuredata.com',
      consoleUrl: 'https://llm-development.us01.treasuredata.com',
      label: 'US Development',
    },
    'us-staging': {
      apiUrl: 'https://llm-api-staging.us01.treasuredata.com',
      consoleUrl: 'https://llm-staging.us01.treasuredata.com',
      label: 'US Staging',
    },
    'us-prod': {
      apiUrl: 'https://llm-api.us01.treasuredata.com',
      consoleUrl: 'https://llm.us01.treasuredata.com',
      label: 'US Production',
    },
  } as const;

  return regionConfigs[region as keyof typeof regionConfigs] || regionConfigs['us-prod'];
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' };
  }

  if (!apiKey.startsWith('1/')) {
    return { isValid: false, error: 'API key must start with "1/"' };
  }

  if (apiKey.length < 10) {
    return { isValid: false, error: 'API key is too short' };
  }

  return { isValid: true };
}

/**
 * Generate TD Console URL for API key creation
 */
export function getTdConsoleApiKeyUrl(baseUrl?: string): string {
  if (baseUrl && baseUrl.includes('development')) {
    return 'https://console-development.treasuredata.com/app/account/api-keys';
  }

  if (baseUrl && baseUrl.includes('staging')) {
    return 'https://console-staging.treasuredata.com/app/account/api-keys';
  }

  // Default to production
  return 'https://console.treasuredata.com/app/account/api-keys';
}