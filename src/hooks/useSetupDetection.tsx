'use client';

import { useState, useEffect } from 'react';
import { detectEnvironment, validateApiKey, type EnvironmentContext } from '@/utils/environmentDetection';

export interface SetupDetectionState {
  needsSetup: boolean;
  isLoading: boolean;
  environment: EnvironmentContext;
  hasEnvKey: boolean;
  hasStorageKey: boolean;
  isValid: boolean;
  error?: string;
}

export function useSetupDetection() {
  const [state, setState] = useState<SetupDetectionState>({
    needsSetup: false,
    isLoading: true,
    environment: detectEnvironment(),
    hasEnvKey: false,
    hasStorageKey: false,
    isValid: false,
  });

  const checkSetupStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Check if user has opted out of setup
      const skipSetup = localStorage.getItem('skip_setup') === 'true';
      const setupCompleted = localStorage.getItem('setup_completed') === 'true';

      if (skipSetup) {
        setState(prev => ({
          ...prev,
          needsSetup: false,
          isLoading: false,
        }));
        return;
      }

      // Check localStorage for API key
      const storedApiKey = localStorage.getItem('td_api_key');
      const hasStorageKey = !!storedApiKey;
      const storageKeyValid = storedApiKey ? validateApiKey(storedApiKey).isValid : false;

      // Check server for environment variables
      let hasEnvKey = false;
      try {
        const response = await fetch('/api/config/check-env');
        if (response.ok) {
          const data = await response.json();
          hasEnvKey = data.hasEnvKey;
        }
      } catch (error) {
        console.warn('[Setup] Failed to check environment variables:', error);
      }

      const isValid = hasEnvKey || storageKeyValid;
      const needsSetup = !isValid && !setupCompleted;

      setState(prev => ({
        ...prev,
        needsSetup,
        isLoading: false,
        hasEnvKey,
        hasStorageKey,
        isValid,
      }));

    } catch (error) {
      console.error('[Setup Detection] Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        // Default to requiring setup if we can't determine status
        needsSetup: true,
      }));
    }
  };

  const skipSetup = () => {
    localStorage.setItem('skip_setup', 'true');
    setState(prev => ({
      ...prev,
      needsSetup: false,
    }));
  };

  const retrySetup = () => {
    localStorage.removeItem('skip_setup');
    localStorage.removeItem('setup_completed');
    checkSetupStatus();
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  return {
    ...state,
    checkSetupStatus,
    skipSetup,
    retrySetup,
  };
}