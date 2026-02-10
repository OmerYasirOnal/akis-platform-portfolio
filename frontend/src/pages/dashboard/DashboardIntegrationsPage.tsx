import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  integrationsApi, 
  type GitHubStatus, 
  type AtlassianStatus,
  type AtlassianConnectRequest,
} from '../../services/api/integrations';

// Icons
const GitHubIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const JiraIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
  </svg>
);

const ConfluenceIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.753.675-1.12 1.36-2.257 2.764-2.04 5.235-.81l4.882 2.428c.41.2.896.03 1.1-.38l2.51-5.09a.772.772 0 0 0-.344-1.03l-4.876-2.424c-3.586-1.784-6.536-1.905-9.696 3.346zM23.131 5.743c.249-.383.53-.876.764-1.246a.764.764 0 0 0-.256-1.04L18.674.404a.764.764 0 0 0-1.058.26c-.199.33-.454.753-.675 1.119-1.36 2.257-2.764 2.04-5.235.81L6.823.165a.766.766 0 0 0-1.1.38l-2.51 5.09a.772.772 0 0 0 .344 1.03l4.876 2.423c3.586 1.784 6.536 1.906 9.696-3.345z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Modal Component
interface ConnectModalProps {
  provider: 'jira' | 'confluence';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConnectModal = ({ provider, isOpen, onClose, onSuccess }: ConnectModalProps) => {
  const [siteUrl, setSiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: AtlassianConnectRequest = { siteUrl, email, apiToken };
      const result = provider === 'jira'
        ? await integrationsApi.connectJira(data)
        : await integrationsApi.connectConfluence(data);

      if (result.success) {
        onSuccess();
        onClose();
        setSiteUrl('');
        setEmail('');
        setApiToken('');
      } else {
        setError(result.message || 'Failed to connect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const providerName = provider === 'jira' ? 'Jira' : 'Confluence';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-ak-border bg-ak-surface p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-ak-text-primary mb-2">
          Connect {providerName}
        </h2>
        <p className="text-sm text-ak-text-secondary mb-6">
          Enter your Atlassian credentials to connect {providerName}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ak-text-primary mb-1">
              Site URL
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://your-domain.atlassian.net"
              required
              className="w-full rounded-lg border border-ak-border bg-ak-bg px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ak-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
              className="w-full rounded-lg border border-ak-border bg-ak-bg px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ak-text-primary mb-1">
              API Token
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Your Atlassian API token"
              required
              className="w-full rounded-lg border border-ak-border bg-ak-bg px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
            />
            <p className="mt-1 text-xs text-ak-text-secondary">
              <a 
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ak-primary hover:underline"
              >
                Create an API token
              </a>
              {' '}in your Atlassian account settings.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Integration Card Component
interface IntegrationCardProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  connectedInfo?: string;
  lastValidated?: string;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest?: () => void;
  testing?: boolean;
}

const IntegrationCard = ({
  name,
  icon,
  description,
  connected,
  connectedInfo,
  lastValidated,
  loading,
  onConnect,
  onDisconnect,
  onTest,
  testing,
}: IntegrationCardProps) => {
  return (
    <Card className="flex h-full flex-col gap-4 bg-ak-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            connected ? 'bg-green-500/10 text-green-400' : 'bg-ak-surface-2 text-ak-text-secondary'
          }`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ak-text-primary">{name}</h2>
            {loading ? (
              <p className="text-sm text-ak-text-secondary">Loading...</p>
            ) : connected ? (
              <div className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckIcon />
                <span>Connected</span>
              </div>
            ) : (
              <p className="text-sm text-ak-text-secondary">Not connected</p>
            )}
          </div>
        </div>
      </div>

      {connected && connectedInfo && (
        <div className="rounded-lg bg-ak-surface-2 px-3 py-2 text-xs text-ak-text-secondary">
          <span className="font-medium text-ak-text-primary">Account:</span> {connectedInfo}
          {lastValidated && (
            <span className="block mt-1">
              Last verified: {new Date(lastValidated).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      <p className="text-sm text-ak-text-secondary flex-1">{description}</p>

      <div className="flex gap-2">
        {!loading && (
          connected ? (
            <>
              {onTest && (
                <Button
                  variant="secondary"
                  onClick={onTest}
                  disabled={testing}
                  className="flex-1"
                >
                  {testing ? 'Testing...' : 'Test'}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={onDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={onConnect}
              className="w-full"
            >
              Connect
            </Button>
          )
        )}
      </div>
    </Card>
  );
};

const DashboardIntegrationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // GitHub state
  const [githubStatus, setGitHubStatus] = useState<GitHubStatus | null>(null);
  const [loadingGitHub, setLoadingGitHub] = useState(true);
  const [disconnectingGitHub, setDisconnectingGitHub] = useState(false);

  // Jira state
  const [jiraStatus, setJiraStatus] = useState<AtlassianStatus | null>(null);
  const [loadingJira, setLoadingJira] = useState(true);
  const [disconnectingJira, setDisconnectingJira] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);

  // Confluence state
  const [confluenceStatus, setConfluenceStatus] = useState<AtlassianStatus | null>(null);
  const [loadingConfluence, setLoadingConfluence] = useState(true);
  const [disconnectingConfluence, setDisconnectingConfluence] = useState(false);
  const [testingConfluence, setTestingConfluence] = useState(false);
  const [showConfluenceModal, setShowConfluenceModal] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load all statuses on mount
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadGitHubStatus(),
        loadJiraStatus(),
        loadConfluenceStatus(),
      ]);
    };
    loadAll();

    // Handle OAuth callback params
    const githubParam = searchParams.get('github');
    if (githubParam === 'connected') {
      setNotification({ type: 'success', message: 'GitHub connected successfully!' });
      setSearchParams({});
    } else if (githubParam === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      setNotification({ type: 'error', message: `Failed to connect GitHub: ${reason}` });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadGitHubStatus = async () => {
    setLoadingGitHub(true);
    try {
      const status = await integrationsApi.getGitHubStatus();
      setGitHubStatus(status);
    } catch {
      setGitHubStatus({ connected: false });
    } finally {
      setLoadingGitHub(false);
    }
  };

  const loadJiraStatus = async () => {
    setLoadingJira(true);
    try {
      const status = await integrationsApi.getJiraStatus();
      setJiraStatus(status);
    } catch {
      setJiraStatus({ connected: false });
    } finally {
      setLoadingJira(false);
    }
  };

  const loadConfluenceStatus = async () => {
    setLoadingConfluence(true);
    try {
      const status = await integrationsApi.getConfluenceStatus();
      setConfluenceStatus(status);
    } catch {
      setConfluenceStatus({ connected: false });
    } finally {
      setLoadingConfluence(false);
    }
  };

  // GitHub handlers
  const handleConnectGitHub = () => {
    integrationsApi.startGitHubOAuth();
  };

  const handleDisconnectGitHub = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub?')) return;
    setDisconnectingGitHub(true);
    try {
      await integrationsApi.disconnectGitHub();
      setNotification({ type: 'success', message: 'GitHub disconnected' });
      await loadGitHubStatus();
    } catch {
      setNotification({ type: 'error', message: 'Failed to disconnect GitHub' });
    } finally {
      setDisconnectingGitHub(false);
    }
  };

  // Jira handlers
  const handleDisconnectJira = async () => {
    if (!window.confirm('Are you sure you want to disconnect Jira?')) return;
    setDisconnectingJira(true);
    try {
      await integrationsApi.disconnectJira();
      setNotification({ type: 'success', message: 'Jira disconnected' });
      await loadJiraStatus();
    } catch {
      setNotification({ type: 'error', message: 'Failed to disconnect Jira' });
    } finally {
      setDisconnectingJira(false);
    }
  };

  const handleTestJira = async () => {
    setTestingJira(true);
    try {
      const result = await integrationsApi.testJira();
      if (result.success) {
        setNotification({ type: 'success', message: 'Jira connection verified!' });
      } else {
        setNotification({ type: 'error', message: result.error || 'Connection test failed' });
      }
      await loadJiraStatus();
    } catch {
      setNotification({ type: 'error', message: 'Failed to test Jira connection' });
    } finally {
      setTestingJira(false);
    }
  };

  // Confluence handlers
  const handleDisconnectConfluence = async () => {
    if (!window.confirm('Are you sure you want to disconnect Confluence?')) return;
    setDisconnectingConfluence(true);
    try {
      await integrationsApi.disconnectConfluence();
      setNotification({ type: 'success', message: 'Confluence disconnected' });
      await loadConfluenceStatus();
    } catch {
      setNotification({ type: 'error', message: 'Failed to disconnect Confluence' });
    } finally {
      setDisconnectingConfluence(false);
    }
  };

  const handleTestConfluence = async () => {
    setTestingConfluence(true);
    try {
      const result = await integrationsApi.testConfluence();
      if (result.success) {
        setNotification({ type: 'success', message: 'Confluence connection verified!' });
      } else {
        setNotification({ type: 'error', message: result.error || 'Connection test failed' });
      }
      await loadConfluenceStatus();
    } catch {
      setNotification({ type: 'error', message: 'Failed to test Confluence connection' });
    } finally {
      setTestingConfluence(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
          Integrations
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Connect AKIS to your development tools and services.
        </p>
      </header>

      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
            notification.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckIcon /> : <XIcon />}
            {notification.message}
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="hover:opacity-70"
          >
            <XIcon />
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* GitHub */}
        <IntegrationCard
          name="GitHub"
          icon={<GitHubIcon />}
          description="Connect your GitHub account to enable repository access for Scribe documentation agent."
          connected={githubStatus?.connected ?? false}
          connectedInfo={githubStatus?.login}
          loading={loadingGitHub || disconnectingGitHub}
          onConnect={handleConnectGitHub}
          onDisconnect={handleDisconnectGitHub}
        />

        {/* Jira */}
        <IntegrationCard
          name="Jira"
          icon={<JiraIcon />}
          description="Connect Jira Cloud to enable the Trace agent for test planning and issue tracking."
          connected={jiraStatus?.connected ?? false}
          connectedInfo={jiraStatus?.userEmail}
          lastValidated={jiraStatus?.lastValidatedAt}
          loading={loadingJira || disconnectingJira}
          onConnect={() => setShowJiraModal(true)}
          onDisconnect={handleDisconnectJira}
          onTest={handleTestJira}
          testing={testingJira}
        />

        {/* Confluence */}
        <IntegrationCard
          name="Confluence"
          icon={<ConfluenceIcon />}
          description="Connect Confluence to publish documentation directly from Scribe to your wiki spaces."
          connected={confluenceStatus?.connected ?? false}
          connectedInfo={confluenceStatus?.userEmail}
          lastValidated={confluenceStatus?.lastValidatedAt}
          loading={loadingConfluence || disconnectingConfluence}
          onConnect={() => setShowConfluenceModal(true)}
          onDisconnect={handleDisconnectConfluence}
          onTest={handleTestConfluence}
          testing={testingConfluence}
        />
      </div>

      {/* Connect Modals */}
      <ConnectModal
        provider="jira"
        isOpen={showJiraModal}
        onClose={() => setShowJiraModal(false)}
        onSuccess={() => {
          loadJiraStatus();
          setNotification({ type: 'success', message: 'Jira connected successfully!' });
        }}
      />
      <ConnectModal
        provider="confluence"
        isOpen={showConfluenceModal}
        onClose={() => setShowConfluenceModal(false)}
        onSuccess={() => {
          loadConfluenceStatus();
          setNotification({ type: 'success', message: 'Confluence connected successfully!' });
        }}
      />
    </div>
  );
};

export default DashboardIntegrationsPage;
