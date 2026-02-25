'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ApiKeyStatus {
  hasEnvKey: boolean;
  hasStorageKey: boolean;
  isValid: boolean;
  needsSetup: boolean;
}

export interface ConfigurationOptions {
  saveToEnvFile: boolean;
  saveToStorage: boolean;
  skipFuturePrompts: boolean;
  rememberSession: boolean;
}

export interface SetupContextType {
  apiKeyStatus: ApiKeyStatus;
  showSetupModal: boolean;
  isLoading: boolean;
  currentStep: number;
  setupData: {
    apiKey?: string;
    baseUrl?: string;
    region?: string;
  };
  configOptions: ConfigurationOptions;
  setShowSetupModal: (show: boolean) => void;
  setCurrentStep: (step: number) => void;
  setSetupData: (data: Partial<{
    apiKey?: string;
    baseUrl?: string;
    region?: string;
  }>) => void;
  setConfigOptions: (options: Partial<ConfigurationOptions>) => void;
  checkSetupStatus: () => Promise<void>;
  completeSetup: () => Promise<boolean>;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

export function useSetup() {
  const context = useContext(SetupContext);
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}

const DEFAULT_CONFIG_OPTIONS: ConfigurationOptions = {
  saveToEnvFile: true,
  saveToStorage: true,
  skipFuturePrompts: false,
  rememberSession: true,
};

export function SetupProvider({ children }: { children: React.ReactNode }) {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    hasEnvKey: false,
    hasStorageKey: false,
    isValid: false,
    needsSetup: false,
  });

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<{
    apiKey?: string;
    baseUrl?: string;
    region?: string;
  }>({});
  const [configOptions, setConfigOptions] = useState<ConfigurationOptions>(DEFAULT_CONFIG_OPTIONS);

  const updateConfigOptions = (options: Partial<ConfigurationOptions>) => {
    setConfigOptions(prev => ({ ...prev, ...options }));
  };

  const checkSetupStatus = async () => {
    try {
      setIsLoading(true);

      // Check localStorage for existing setup
      const skipSetup = localStorage.getItem('skip_setup') === 'true';
      const setupCompleted = localStorage.getItem('setup_completed') === 'true';
      const storedApiKey = localStorage.getItem('td_api_key');

      if (skipSetup || setupCompleted) {
        setApiKeyStatus({
          hasEnvKey: false,
          hasStorageKey: !!storedApiKey,
          isValid: !!storedApiKey,
          needsSetup: false,
        });
        return;
      }

      // Check server-side environment variables
      const response = await fetch('/api/config/check-env');
      const envStatus = response.ok ? await response.json() : { hasEnvKey: false };

      const hasStorageKey = !!storedApiKey;
      const needsSetup = !envStatus.hasEnvKey && !hasStorageKey && !skipSetup;

      const status: ApiKeyStatus = {
        hasEnvKey: envStatus.hasEnvKey,
        hasStorageKey,
        isValid: envStatus.hasEnvKey || hasStorageKey,
        needsSetup,
      };

      setApiKeyStatus(status);

      if (needsSetup) {
        setShowSetupModal(true);
      }
    } catch (error) {
      console.error('[Setup] Failed to check setup status:', error);
      // Default to showing setup if we can't determine status
      setApiKeyStatus({
        hasEnvKey: false,
        hasStorageKey: false,
        isValid: false,
        needsSetup: true,
      });
      setShowSetupModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async (): Promise<boolean> => {
    try {
      const { apiKey, baseUrl } = setupData;

      if (!apiKey) {
        throw new Error('API key is required');
      }

      // Test the API key first
      const testResponse = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, baseUrl }),
      });

      if (!testResponse.ok) {
        throw new Error('Invalid API key or connection failed');
      }

      // Save configuration based on options
      if (configOptions.saveToStorage) {
        localStorage.setItem('td_api_key', apiKey);
        if (baseUrl) {
          localStorage.setItem('td_proxy_url', baseUrl);
        }
      }

      if (configOptions.saveToEnvFile) {
        const envResponse = await fetch('/api/config/env-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, baseUrl }),
        });

        if (!envResponse.ok) {
          console.warn('[Setup] Failed to create .env.local file');
        }
      }

      // Mark setup as completed
      localStorage.setItem('setup_completed', 'true');

      if (configOptions.skipFuturePrompts) {
        localStorage.setItem('skip_setup', 'true');
      }

      // Update status
      setApiKeyStatus(prev => ({
        ...prev,
        hasStorageKey: configOptions.saveToStorage,
        isValid: true,
        needsSetup: false,
      }));

      setShowSetupModal(false);
      return true;
    } catch (error) {
      console.error('[Setup] Failed to complete setup:', error);
      return false;
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const value: SetupContextType = {
    apiKeyStatus,
    showSetupModal,
    isLoading,
    currentStep,
    setupData,
    configOptions,
    setShowSetupModal,
    setCurrentStep,
    setSetupData,
    setConfigOptions: updateConfigOptions,
    checkSetupStatus,
    completeSetup,
  };

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  );
}