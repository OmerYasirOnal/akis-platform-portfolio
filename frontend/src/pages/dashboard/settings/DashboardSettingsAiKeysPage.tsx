import { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/common/Button';
import { aiKeysApi, type AiProvider, type MultiProviderStatus } from '../../../services/api/ai-keys';

// Key icon
const KeyIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Eye icon for show/hide key
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    )}
  </svg>
);

// Trash icon
const TrashIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

interface ProviderConfig {
  id: AiProvider;
  name: string;
  description: string;
  placeholder: string;
  docUrl: string;
}

const providers: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use GPT-4, GPT-4o, and other OpenAI models for Scribe and other agents.',
    placeholder: 'sk-...',
    docUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access multiple AI providers through a single API, including Claude, Mistral, and more.',
    placeholder: 'sk-or-...',
    docUrl: 'https://openrouter.ai/keys',
  },
];

export default function DashboardSettingsAiKeysPage() {
  const [status, setStatus] = useState<MultiProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for each provider
  const [formState, setFormState] = useState<Record<AiProvider, {
    key: string;
    showKey: boolean;
    saving: boolean;
    deleting: boolean;
    error: string | null;
    success: string | null;
  }>>({
    openai: { key: '', showKey: false, saving: false, deleting: false, error: null, success: null },
    openrouter: { key: '', showKey: false, saving: false, deleting: false, error: null, success: null },
  });

  // Fetch status on mount
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await aiKeysApi.getStatus();
      setStatus(data);
    } catch (err) {
      const apiErr = err as { code?: string };
      const isEncryptionError = apiErr.code === 'ENCRYPTION_NOT_CONFIGURED';
      setError(
        isEncryptionError
          ? 'Server encryption is not configured. An administrator needs to set AI_KEY_ENCRYPTION_KEY in the server environment.'
          : 'Failed to load AI provider status. Please try again.'
      );
      console.error('Failed to fetch AI key status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle key input change
  const handleKeyChange = (provider: AiProvider, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], key: value, error: null, success: null },
    }));
  };

  // Toggle key visibility
  const toggleShowKey = (provider: AiProvider) => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], showKey: !prev[provider].showKey },
    }));
  };

  // Save key
  const handleSaveKey = async (provider: AiProvider) => {
    const key = formState[provider].key.trim();
    if (!key) {
      setFormState((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], error: 'Please enter an API key' },
      }));
      return;
    }

    // Basic validation
    if (provider === 'openai' && !key.startsWith('sk-')) {
      setFormState((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], error: 'OpenAI keys should start with sk-' },
      }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], saving: true, error: null },
    }));

    try {
      await aiKeysApi.saveKey(provider, key);
      await fetchStatus();
      setFormState((prev) => ({
        ...prev,
        [provider]: { 
          ...prev[provider], 
          key: '', 
          saving: false, 
          success: 'API key saved successfully!',
          error: null,
        },
      }));
      // Clear success message after 3 seconds
      setTimeout(() => {
        setFormState((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], success: null },
        }));
      }, 3000);
    } catch (err) {
      const apiErr = err as { code?: string; message?: string };
      const isEncryptionError = apiErr.code === 'ENCRYPTION_NOT_CONFIGURED';
      const errorMessage = isEncryptionError
        ? 'Server encryption is not configured. An administrator needs to set AI_KEY_ENCRYPTION_KEY in the server environment.'
        : 'Failed to save API key. Please try again.';
      setFormState((prev) => ({
        ...prev,
        [provider]: { 
          ...prev[provider], 
          saving: false, 
          error: errorMessage,
        },
      }));
      console.error('Failed to save API key:', err);
    }
  };

  // Delete key
  const handleDeleteKey = async (provider: AiProvider) => {
    if (!confirm(`Are you sure you want to delete your ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} API key?`)) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], deleting: true, error: null },
    }));

    try {
      await aiKeysApi.deleteKey(provider);
      await fetchStatus();
      setFormState((prev) => ({
        ...prev,
        [provider]: { 
          ...prev[provider], 
          deleting: false, 
          success: 'API key deleted.',
        },
      }));
      setTimeout(() => {
        setFormState((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], success: null },
        }));
      }, 3000);
    } catch (err) {
      const apiErr = err as { code?: string };
      const isEncryptionError = apiErr.code === 'ENCRYPTION_NOT_CONFIGURED';
      const errorMessage = isEncryptionError
        ? 'Server encryption is not configured. An administrator needs to set AI_KEY_ENCRYPTION_KEY in the server environment.'
        : 'Failed to delete API key. Please try again.';
      setFormState((prev) => ({
        ...prev,
        [provider]: { 
          ...prev[provider], 
          deleting: false, 
          error: errorMessage,
        },
      }));
      console.error('Failed to delete API key:', err);
    }
  };

  // Set active provider
  const handleSetActive = async (provider: AiProvider) => {
    try {
      const data = await aiKeysApi.setActiveProvider(provider);
      setStatus(data);
    } catch (err) {
      setError('Failed to set active provider. Please try again.');
      console.error('Failed to set active provider:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ak-text-primary">AI Provider Keys</h1>
        <p className="mt-2 text-ak-text-secondary">
          Configure your AI provider API keys to enable Scribe and other agents.
          Keys are encrypted and securely stored.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Security Notice */}
      <div className="rounded-xl border border-ak-primary/20 bg-ak-primary/5 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <KeyIcon />
          </div>
          <div>
            <h3 className="font-medium text-ak-primary">Secure Key Storage</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">
              Your API keys are encrypted using AES-256-GCM before storage. 
              Keys are never logged or returned in plaintext. Only the last 4 characters are shown for identification.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-6">
        {providers.map((provider) => {
          const providerStatus = status?.providers[provider.id];
          const isConfigured = providerStatus?.configured ?? false;
          const isActive = status?.activeProvider === provider.id;
          const form = formState[provider.id];

          return (
            <div
              key={provider.id}
              className={`rounded-2xl border border-ak-border p-6 transition-all duration-base ${
                isActive
                  ? 'bg-ak-surface-2 shadow-ak-elevation-2 ring-1 ring-ak-primary/30'
                  : 'bg-ak-surface shadow-ak-elevation-1'
              }`}
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isConfigured ? 'bg-green-500/10 text-green-400' : 'bg-ak-surface-2 text-ak-text-secondary'
                  }`}>
                    {isConfigured ? <CheckIcon /> : <KeyIcon />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ak-text-primary">
                      {provider.name}
                      {isActive && (
                        <span className="ml-2 rounded-full bg-ak-primary/10 px-2 py-0.5 text-xs font-medium text-ak-primary">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-ak-text-secondary">{provider.description}</p>
                  </div>
                </div>

                {/* Set Active Button */}
                {isConfigured && !isActive && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleSetActive(provider.id)}
                  >
                    Set as Active
                  </Button>
                )}
              </div>

              {/* Status */}
              {isConfigured && providerStatus && (
                <div className="mt-4 flex items-center gap-4 text-sm text-ak-text-secondary">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Configured
                  </span>
                  {providerStatus.last4 && (
                    <span>Key ending in •••• {providerStatus.last4}</span>
                  )}
                  {providerStatus.updatedAt && (
                    <span>Updated {new Date(providerStatus.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {/* Key Input Form */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-ak-text-primary">
                  {isConfigured ? 'Update' : 'Enter'} API Key
                </label>
                <div className="mt-2 flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type={form.showKey ? 'text' : 'password'}
                      value={form.key}
                      onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                      placeholder={provider.placeholder}
                      className="w-full rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 pr-12 text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(provider.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ak-text-secondary hover:text-ak-text-primary"
                      aria-label={form.showKey ? 'Hide key' : 'Show key'}
                    >
                      <EyeIcon open={form.showKey} />
                    </button>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={form.saving || !form.key.trim()}
                  >
                    {form.saving ? 'Saving...' : 'Save'}
                  </Button>
                  {isConfigured && (
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteKey(provider.id)}
                      disabled={form.deleting}
                      className="text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                    >
                      {form.deleting ? '...' : <TrashIcon />}
                    </Button>
                  )}
                </div>

                {/* Error/Success Messages */}
                {form.error && (
                  <p className="mt-2 text-sm text-red-400">{form.error}</p>
                )}
                {form.success && (
                  <p className="mt-2 text-sm text-green-400">{form.success}</p>
                )}

                {/* Help Link */}
                <p className="mt-2 text-xs text-ak-text-secondary">
                  Get your API key from{' '}
                  <a
                    href={provider.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ak-primary hover:underline"
                  >
                    {provider.name}
                  </a>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Info */}
      <div className="rounded-2xl border border-ak-border bg-ak-surface shadow-ak-elevation-1 p-6">
        <h3 className="text-lg font-bold text-ak-text-primary">How API Keys Are Used</h3>
        <ul className="mt-4 space-y-3 text-sm text-ak-text-secondary">
          <li className="flex items-start gap-2">
            <CheckIcon />
            <span>Keys are used server-side only - never exposed to the browser</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon />
            <span>Each agent job uses your configured provider and model</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon />
            <span>You maintain full control over which models and providers to use</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon />
            <span>API calls are logged for auditing (without the keys)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
