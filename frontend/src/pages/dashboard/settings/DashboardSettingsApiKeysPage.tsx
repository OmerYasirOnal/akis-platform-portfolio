import { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { aiKeysApi, type MultiProviderStatus, type AiProvider } from '../../../services/api/ai-keys';

const PROVIDERS: { id: AiProvider; name: string; description: string; keyPrefix: string }[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access many AI models through a single API. Keys start with sk-or-',
    keyPrefix: 'sk-or-',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct access to GPT models. Keys start with sk-',
    keyPrefix: 'sk-',
  },
];

const DashboardSettingsApiKeysPage = () => {
  const [status, setStatus] = useState<MultiProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AiProvider | null>(null);
  const [deleting, setDeleting] = useState<AiProvider | null>(null);
  const [settingActive, setSettingActive] = useState<AiProvider | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<AiProvider, string>>({
    openai: '',
    openrouter: '',
  });
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await aiKeysApi.getStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API key status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const handleSave = async (provider: AiProvider) => {
    const apiKey = apiKeyInputs[provider];
    if (!apiKey.trim()) return;
    
    setSaving(provider);
    setError(null);
    try {
      await aiKeysApi.saveKey(provider, apiKey.trim());
      // Refresh full status after saving
      const nextStatus = await aiKeysApi.getStatus();
      setStatus(nextStatus);
      setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${provider} API key.`);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (provider: AiProvider) => {
    setDeleting(provider);
    setError(null);
    try {
      await aiKeysApi.deleteKey(provider);
      const nextStatus = await aiKeysApi.getStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to remove ${provider} API key.`);
    } finally {
      setDeleting(null);
    }
  };

  const handleSetActive = async (provider: AiProvider) => {
    setSettingActive(provider);
    setError(null);
    try {
      const nextStatus = await aiKeysApi.setActiveProvider(provider);
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to set ${provider} as active.`);
    } finally {
      setSettingActive(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
          API Keys
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Configure your AI provider API keys to run Scribe. Choose between OpenRouter (recommended) or OpenAI.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-ak-danger/30 bg-ak-danger/10 px-4 py-3 text-sm text-ak-danger">
          {error}
        </div>
      )}

      {/* Active Provider Banner */}
      {status && (
        <Card className="bg-ak-surface border-ak-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ak-text-secondary">Active Provider</p>
              <p className="text-lg font-semibold text-ak-text-primary capitalize">
                {status.activeProvider === null 
                  ? 'Not Set' 
                  : status.activeProvider === 'openrouter' 
                    ? 'OpenRouter' 
                    : 'OpenAI'}
              </p>
            </div>
            {status.activeProvider === null ? (
              <div className="rounded-full px-3 py-1 text-xs font-semibold bg-yellow-500/15 text-yellow-400">
                Select a Provider
              </div>
            ) : (
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status.providers[status.activeProvider].configured 
                  ? 'bg-green-500/15 text-green-400' 
                  : 'bg-ak-danger/15 text-ak-danger'
              }`}>
                {status.providers[status.activeProvider].configured ? 'Key Configured' : 'Key Missing'}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Provider Cards */}
      {PROVIDERS.map((provider) => {
        const providerStatus = status?.providers[provider.id];
        const isActive = status?.activeProvider === provider.id;
        const isConfigured = providerStatus?.configured ?? false;

        return (
          <Card key={provider.id} className={`space-y-4 bg-ak-surface ${isActive ? 'ring-2 ring-ak-accent/50' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ak-text-primary">
                    {provider.name}
                  </h2>
                  {isActive && (
                    <span className="rounded-full bg-ak-accent/20 px-2 py-0.5 text-xs font-medium text-ak-accent">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-ak-text-secondary mt-1">
                  {provider.description}
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isConfigured ? 'bg-green-500/15 text-green-400' : 'bg-ak-danger/15 text-ak-danger'
              }`}>
                {loading ? 'Checking…' : isConfigured ? 'Configured' : 'Not Configured'}
              </div>
            </div>

            {isConfigured && providerStatus && (
              <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-secondary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-ak-text-primary">Key ending in •••• {providerStatus.last4}</p>
                    {providerStatus.updatedAt && (
                      <p className="text-xs text-ak-text-secondary/80">
                        Updated {new Date(providerStatus.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isActive && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleSetActive(provider.id)} 
                        disabled={settingActive !== null}
                      >
                        {settingActive === provider.id ? 'Setting…' : 'Set Active'}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => handleDelete(provider.id)} 
                      disabled={deleting !== null}
                    >
                      {deleting === provider.id ? 'Removing…' : 'Remove'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Input
                label={isConfigured ? 'Update Key' : 'Add Key'}
                type="password"
                placeholder={`${provider.keyPrefix}...`}
                value={apiKeyInputs[provider.id]}
                onChange={(event) => setApiKeyInputs(prev => ({ 
                  ...prev, 
                  [provider.id]: event.target.value 
                }))}
                description={`${provider.name} keys start with ${provider.keyPrefix}. Your key is encrypted at rest and never shown after submission.`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={() => handleSave(provider.id)} 
                  disabled={saving !== null || !apiKeyInputs[provider.id].trim()}
                >
                  {saving === provider.id ? 'Saving…' : isConfigured ? 'Update Key' : 'Save Key'}
                </Button>
                {!isConfigured && !isActive && (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSetActive(provider.id)}
                    disabled={settingActive !== null}
                  >
                    {settingActive === provider.id ? 'Setting…' : 'Set as Active Provider'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <div className="text-center">
        <Button variant="ghost" onClick={refreshStatus} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh Status'}
        </Button>
      </div>
    </div>
  );
};

export default DashboardSettingsApiKeysPage;
