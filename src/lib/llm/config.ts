export const EVALUATOR_AGENT_ID = '019ae82f-b843-79f5-95c6-c7968262b2c2';

export const ENVIRONMENTS = {
  dev: {
    apiUrl: 'https://llm-api-development.us01.treasuredata.com/api',
    consoleUrl: 'https://llm-development.us01.treasuredata.com',
  },
  staging: {
    apiUrl: 'https://llm-api-staging.us01.treasuredata.com/api',
    consoleUrl: 'https://llm-staging.us01.treasuredata.com',
  },
  prod: {
    apiUrl: 'https://llm-api.us01.treasuredata.com/api',
    consoleUrl: 'https://llm.us01.treasuredata.com',
  },
} as const;

export type Environment = keyof typeof ENVIRONMENTS;

/**
 * Get the API URL for LLM service.
 * Uses TD_LLM_BASE_URL env var if set, otherwise defaults to dev environment.
 * Ensures the URL ends with /api.
 */
export function getApiUrl(): string {
  let url = process.env.TD_LLM_BASE_URL || ENVIRONMENTS.dev.apiUrl;

  // Ensure URL ends with /api
  if (!url.endsWith('/api')) {
    url = url.replace(/\/$/, '') + '/api';
  }

  return url;
}

/**
 * Get the console URL for constructing conversation links.
 * Derives from TD_LLM_BASE_URL if set, otherwise defaults to dev environment.
 */
export function getConsoleUrl(): string {
  const apiUrl = getApiUrl();

  // Match API URL to console URL
  for (const env of Object.values(ENVIRONMENTS)) {
    if (apiUrl === env.apiUrl) {
      return env.consoleUrl;
    }
  }

  // Fallback: try to derive console URL from API URL
  // e.g., https://llm-api-xxx.region.td.com -> https://llm-xxx.region.td.com
  return apiUrl.replace('llm-api', 'llm').replace('/api', '');
}

/**
 * Build a conversation URL for the LLM console.
 */
export function buildConversationUrl(chatId: string): string {
  const consoleUrl = getConsoleUrl();
  return `${consoleUrl}/chats/${chatId}`;
}
