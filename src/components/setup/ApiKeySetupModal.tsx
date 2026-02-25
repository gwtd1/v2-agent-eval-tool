'use client';

import React, { useState, useEffect } from 'react';
import { useSetup } from '@/contexts/SetupContext';
import { validateApiKey, getRegionConfig, getTdConsoleApiKeyUrl } from '@/utils/environmentDetection';

interface TestConnectionState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

const SETUP_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with Agent Eval Tool' },
  { id: 'apikey', title: 'API Key', description: 'Enter your Treasure Data API key' },
  { id: 'test', title: 'Test Connection', description: 'Verify your configuration' },
  { id: 'storage', title: 'Save Settings', description: 'Choose how to save your settings' },
  { id: 'complete', title: 'Complete', description: 'Setup completed successfully' },
];

export function ApiKeySetupModal() {
  const {
    showSetupModal,
    currentStep,
    setupData,
    configOptions,
    setShowSetupModal,
    setCurrentStep,
    setSetupData,
    setConfigOptions,
    completeSetup,
  } = useSetup();

  const [testConnection, setTestConnection] = useState<TestConnectionState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset test connection state when API key changes
  useEffect(() => {
    if (setupData.apiKey) {
      setTestConnection(prev => ({
        ...prev,
        isSuccess: false,
        error: null,
      }));
    }
  }, [setupData.apiKey]);

  if (!showSetupModal) return null;

  const handleApiKeyChange = (apiKey: string) => {
    setSetupData({ ...setupData, apiKey });
    const validation = validateApiKey(apiKey);
    setValidationError(validation.isValid ? null : (validation.error || 'Invalid API key'));
  };

  const handleRegionChange = (region: string) => {
    const config = getRegionConfig(region);
    setSetupData({
      ...setupData,
      region,
      baseUrl: config.apiUrl,
    });
  };

  const handleTestConnection = async () => {
    if (!setupData.apiKey) return;

    setTestConnection({
      isLoading: true,
      isSuccess: false,
      error: null,
    });

    try {
      const response = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: setupData.apiKey,
          baseUrl: setupData.baseUrl,
        }),
      });

      if (response.ok) {
        await response.json(); // Consume the response
        setTestConnection({
          isLoading: false,
          isSuccess: true,
          error: null,
        });
        setCurrentStep(3); // Move to storage step
      } else {
        const errorData = await response.json();
        setTestConnection({
          isLoading: false,
          isSuccess: false,
          error: errorData.error || 'Connection test failed',
        });
      }
    } catch (networkError) {
      console.error('Connection test failed:', networkError);
      setTestConnection({
        isLoading: false,
        isSuccess: false,
        error: 'Network error - please check your internet connection',
      });
    }
  };

  const handleCompleteSetup = async () => {
    const success = await completeSetup();
    if (success) {
      setCurrentStep(4); // Move to complete step
    }
  };

  const handleSkipSetup = () => {
    localStorage.setItem('skip_setup', 'true');
    setShowSetupModal(false);
  };

  const canProceedFromApiKey = setupData.apiKey && !validationError;
  const canProceedFromTest = testConnection.isSuccess;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome to Agent Eval Tool
          </h2>
          <div className="mt-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Step {currentStep + 1} of {SETUP_STEPS.length}</span>
              <span>•</span>
              <span>{SETUP_STEPS[currentStep]?.title}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / SETUP_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {currentStep === 0 && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Let&apos;s get you set up!
              </h3>
              <p className="text-gray-600 mb-6">
                To use this tool, you need a Treasure Data API key. This setup will guide you through the configuration process.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">What you&apos;ll need:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• A valid Treasure Data API key</li>
                  <li>• Access to your TD Console account</li>
                  <li>• A few minutes to complete setup</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Enter your Treasure Data API Key
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Get your API key from TD Console:
                  </label>
                  <a
                    href={getTdConsoleApiKeyUrl(setupData.baseUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    🔗 Open TD Console
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region:
                  </label>
                  <select
                    value={setupData.region || 'us-prod'}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="us-prod">US Production</option>
                    <option value="us-staging">US Staging</option>
                    <option value="us-dev">US Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TD API Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={setupData.apiKey || ''}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  {validationError && (
                    <p className="mt-1 text-sm text-red-600">{validationError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Test Connection
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Configuration:</p>
                      <p className="text-sm text-gray-600">API Key: {setupData.apiKey?.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-600">Region: {getRegionConfig(setupData.region).label}</p>
                    </div>
                    <button
                      onClick={handleTestConnection}
                      disabled={testConnection.isLoading || !canProceedFromApiKey}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testConnection.isLoading ? '🔄 Testing...' : '🔍 Test Connection'}
                    </button>
                  </div>
                </div>

                {testConnection.isSuccess && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✅</span>
                      <p className="text-green-800 font-medium">Connection successful!</p>
                    </div>
                  </div>
                )}

                {testConnection.error && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-red-600 mr-2">❌</span>
                      <div>
                        <p className="text-red-800 font-medium">Connection failed</p>
                        <p className="text-red-700 text-sm mt-1">{testConnection.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Save Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configOptions.saveToStorage}
                      onChange={(e) => setConfigOptions({
                        ...configOptions,
                        saveToStorage: e.target.checked,
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">
                      <span className="font-medium text-gray-900">Save to browser storage</span>
                      <span className="block text-sm text-gray-600">
                        Remember settings for this browser session
                      </span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configOptions.saveToEnvFile}
                      onChange={(e) => setConfigOptions({
                        ...configOptions,
                        saveToEnvFile: e.target.checked,
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">
                      <span className="font-medium text-gray-900">Create .env.local file</span>
                      <span className="block text-sm text-gray-600">
                        Save configuration to local environment file
                      </span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configOptions.skipFuturePrompts}
                      onChange={(e) => setConfigOptions({
                        ...configOptions,
                        skipFuturePrompts: e.target.checked,
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3">
                      <span className="font-medium text-gray-900">Don&apos;t show this setup again</span>
                      <span className="block text-sm text-gray-600">
                        Skip setup prompt in future sessions
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Setup Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Your Agent Eval Tool is now configured and ready to use. You can start running agent evaluations.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✨ Tip: You can change these settings later in the Settings page.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between">
            {currentStep > 0 && currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {currentStep < 3 && (
                <button
                  onClick={handleSkipSetup}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Skip Setup
                </button>
              )}

              {currentStep === 0 && (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Get Started
                </button>
              )}

              {currentStep === 1 && (
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedFromApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}

              {currentStep === 2 && (
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedFromTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}

              {currentStep === 3 && (
                <button
                  onClick={handleCompleteSetup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Complete Setup
                </button>
              )}

              {currentStep === 4 && (
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Start Using Tool
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}