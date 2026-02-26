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
  isInitializing: boolean;
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
  resetSetupData: () => void;
  debugInfo: () => object;
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
  const [isInitializing, setIsInitializing] = useState(true);
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
      console.log('[Setup] Starting setup status check...');
      setIsLoading(true);
      setIsInitializing(true);

      // Check localStorage for existing setup
      const skipSetup = localStorage.getItem('skip_setup') === 'true';
      const setupCompleted = localStorage.getItem('setup_completed') === 'true';
      const storedApiKey = localStorage.getItem('td_api_key');

      console.log('[Setup] localStorage flags:', {
        skipSetup,
        setupCompleted,
        hasStoredApiKey: !!storedApiKey,
      });

      if (skipSetup || setupCompleted) {
        console.log('[Setup] Setup blocked by localStorage flags - not showing modal');
        setApiKeyStatus({
          hasEnvKey: false,
          hasStorageKey: !!storedApiKey,
          isValid: !!storedApiKey,
          needsSetup: false,
        });
        setShowSetupModal(false);
        return;
      }

      // Check server-side environment variables
      console.log('[Setup] Checking server environment...');
      const response = await fetch('/api/config/check-env');
      const envStatus = response.ok ? await response.json() : { hasEnvKey: false };

      console.log('[Setup] Server environment status:', envStatus);

      const hasStorageKey = !!storedApiKey;
      const needsSetup = !envStatus.hasEnvKey && !hasStorageKey && !skipSetup;

      const status: ApiKeyStatus = {
        hasEnvKey: envStatus.hasEnvKey,
        hasStorageKey,
        isValid: envStatus.hasEnvKey || hasStorageKey,
        needsSetup,
      };

      console.log('[Setup] Final setup status:', { ...status, willShowModal: needsSetup });

      setApiKeyStatus(status);

      if (needsSetup) {
        console.log('[Setup] ✅ Showing setup modal - API key configuration needed');
        setShowSetupModal(true);
      } else {
        console.log('[Setup] ❌ NOT showing setup modal - API key already configured');
        setShowSetupModal(false);
      }
    } catch (error) {
      console.error('[Setup] Failed to check setup status:', error);
      console.log('[Setup] 🆘 Error occurred - defaulting to showing setup modal');
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
      setIsInitializing(false);
      console.log('[Setup] Setup status check completed');
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

  const resetSetupData = () => {
    console.log('[Setup] 🔄 Resetting all setup data...');

    // Clear all localStorage flags
    localStorage.removeItem('skip_setup');
    localStorage.removeItem('setup_completed');
    localStorage.removeItem('td_api_key');
    localStorage.removeItem('td_proxy_url');

    // Reset all state
    setShowSetupModal(false);
    setCurrentStep(0);
    setSetupData({});
    setConfigOptions(DEFAULT_CONFIG_OPTIONS);
    setApiKeyStatus({
      hasEnvKey: false,
      hasStorageKey: false,
      isValid: false,
      needsSetup: false,
    });

    console.log('[Setup] ✅ Setup data reset complete');

    // Re-check setup status
    setTimeout(() => {
      checkSetupStatus();
    }, 100);
  };

  const debugInfo = () => {
    const info = {
      state: {
        showSetupModal,
        isLoading,
        isInitializing,
        currentStep,
        apiKeyStatus,
        setupData,
        configOptions,
      },
      localStorage: {
        skip_setup: localStorage.getItem('skip_setup'),
        setup_completed: localStorage.getItem('setup_completed'),
        td_api_key: localStorage.getItem('td_api_key') ? '***REDACTED***' : null,
        td_proxy_url: localStorage.getItem('td_proxy_url'),
      },
      methods: {
        resetSetupData: 'Call window.setupDebug.resetSetupData() to clear all setup data',
        checkSetupStatus: 'Call window.setupDebug.checkSetupStatus() to re-run setup check',
        forceShowModal: 'Call window.setupDebug.forceShowModal() to force modal display',
      }
    };

    console.log('[Setup Debug] Current setup state:', info);
    return info;
  };

  useEffect(() => {
    checkSetupStatus();

    // Add global debug methods in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      interface SetupDebugMethods {
        getCurrentState: () => object;
        resetSetupData: () => void;
        checkSetupStatus: () => Promise<void>;
        forceShowModal: () => void;
        forceHideModal: () => void;
      }

      const setupDebugMethods: SetupDebugMethods = {
        getCurrentState: debugInfo,
        resetSetupData,
        checkSetupStatus,
        forceShowModal: () => {
          console.log('[Setup Debug] 🔧 Forcing setup modal to show...');
          setShowSetupModal(true);
        },
        forceHideModal: () => {
          console.log('[Setup Debug] 🔧 Forcing setup modal to hide...');
          setShowSetupModal(false);
        },
      };

      (window as typeof window & { setupDebug: SetupDebugMethods }).setupDebug = setupDebugMethods;
    }
  }, []); // Empty dependency array is correct - we only want this to run once

  const value: SetupContextType = {
    apiKeyStatus,
    showSetupModal,
    isLoading,
    isInitializing,
    currentStep,
    setupData,
    configOptions,
    setShowSetupModal,
    setCurrentStep,
    setSetupData,
    setConfigOptions: updateConfigOptions,
    checkSetupStatus,
    completeSetup,
    resetSetupData,
    debugInfo,
  };

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  );
}