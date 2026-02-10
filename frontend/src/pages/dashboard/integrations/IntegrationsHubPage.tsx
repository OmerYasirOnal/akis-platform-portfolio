import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { integrationsApi, type AtlassianStatus, type AtlassianOAuthStatus } from '../../../services/api/integrations';

// ============================================================================
// Icons
// ============================================================================

const GitHubIcon = () => (
  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const AtlassianIcon = () => (
  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.12 11.08a.74.74 0 00-1.2.18L.62 21.9a.72.72 0 00.65 1.05h7.55a.72.72 0 00.65-.42c1.48-3.12.57-7.85-2.35-11.45zM11.55.17a15.06 15.06 0 00-1.1 15.08l3.77 7.61a.72.72 0 00.65.42h7.55a.72.72 0 00.65-1.05L12.75.35a.74.74 0 00-1.2-.18z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LinkIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export default function IntegrationsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Statuses
  const [githubConnected, setGithubConnected] = useState(false);
  const [atlassianOAuth, setAtlassianOAuth] = useState<AtlassianOAuthStatus>({
    connected: false, configured: false, jiraAvailable: false, confluenceAvailable: false,
  });
  const [jiraStatus, setJiraStatus] = useState<AtlassianStatus>({ connected: false });
  const [confluenceStatus, setConfluenceStatus] = useState<AtlassianStatus>({ connected: false });

  const loadAllStatuses = useCallback(async () => {
    const [gh, atl, jira, conf] = await Promise.allSettled([
      integrationsApi.getGitHubStatus(),
      integrationsApi.getAtlassianStatus(),
      integrationsApi.getJiraStatus(),
      integrationsApi.getConfluenceStatus(),
    ]);
    if (gh.status === 'fulfilled') setGithubConnected(gh.value.connected);
    if (atl.status === 'fulfilled') setAtlassianOAuth(atl.value);
    if (jira.status === 'fulfilled') setJiraStatus(jira.value);
    if (conf.status === 'fulfilled') setConfluenceStatus(conf.value);
    setLoading(false);
  }, []);

  // OAuth callback handling
  useEffect(() => {
    const githubParam = searchParams.get('github');
    if (githubParam === 'connected') {
      setMessage({ type: 'success', text: 'GitHub connected successfully!' });
      searchParams.delete('github');
      setSearchParams(searchParams, { replace: true });
      loadAllStatuses();
    } else if (githubParam === 'error') {
      setMessage({ type: 'error', text: `GitHub connection failed: ${searchParams.get('reason') || 'unknown'}` });
      searchParams.delete('github'); searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }

    const atlassianParam = searchParams.get('atlassian');
    if (atlassianParam === 'connected') {
      setMessage({ type: 'success', text: 'Atlassian connected! Jira and Confluence are now available.' });
      searchParams.delete('atlassian');
      setSearchParams(searchParams, { replace: true });
      loadAllStatuses();
    } else if (atlassianParam === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      const msgs: Record<string, string> = {
        state_mismatch: 'Security verification failed. Please try again.',
        no_accessible_resources: 'No accessible Atlassian sites found.',
        missing_code: 'Authorization was cancelled or denied.',
      };
      setMessage({ type: 'error', text: `Atlassian connection failed: ${msgs[reason] || reason}` });
      searchParams.delete('atlassian'); searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadAllStatuses]);

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); }
  }, [message]);

  useEffect(() => { loadAllStatuses(); }, [loadAllStatuses]);

  // Derived
  const jiraConnected = jiraStatus.viaOAuth || (atlassianOAuth.connected && atlassianOAuth.jiraAvailable) || jiraStatus.connected;
  const confluenceConnected = confluenceStatus.viaOAuth || (atlassianOAuth.connected && atlassianOAuth.confluenceAvailable) || confluenceStatus.connected;

  // Handlers
  const handleGitHubConnect = () => integrationsApi.startGitHubOAuth();
  const handleGitHubDisconnect = async () => {
    try { await integrationsApi.disconnectGitHub(); setGithubConnected(false); setMessage({ type: 'success', text: 'GitHub disconnected.' }); }
    catch { setMessage({ type: 'error', text: 'Failed to disconnect GitHub.' }); }
  };
  const handleAtlassianConnect = () => integrationsApi.startAtlassianOAuth();
  const handleAtlassianDisconnect = async () => {
    try {
      await integrationsApi.disconnectAtlassian();
      setAtlassianOAuth({ connected: false, configured: atlassianOAuth.configured, jiraAvailable: false, confluenceAvailable: false });
      setJiraStatus({ connected: false }); setConfluenceStatus({ connected: false });
      setMessage({ type: 'success', text: 'Atlassian disconnected.' });
    } catch { setMessage({ type: 'error', text: 'Failed to disconnect Atlassian.' }); }
  };

  // Frosted glass card
  const card = 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl';
  const badge = (connected: boolean) => connected
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
    : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ak-text-primary">Integrations</h1>
        <p className="mt-2 text-sm text-ak-text-secondary">
          Connect AKIS to your development tools. All integrations use{' '}
          <Link to="/docs/integrations/mcp" className="text-ak-primary hover:underline">MCP</Link>{' '}
          for secure communication.
        </p>
      </div>

      {/* Status Banner */}
      {message && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${
          message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* === GitHub Card === */}
      <div className={card + ' p-6'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] text-ak-text-primary">
              <GitHubIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ak-text-primary">GitHub</h2>
              <p className="text-sm text-ak-text-secondary mt-0.5">Repository analysis, PR creation, webhook automation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge(githubConnected)}`}>
              {githubConnected ? 'Connected' : 'Not Connected'}
            </span>
            {githubConnected ? (
              <Button variant="outline" onClick={handleGitHubDisconnect} disabled={loading}>Disconnect</Button>
            ) : (
              <Button variant="primary" onClick={handleGitHubConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
        {/* Features */}
        <div className="mt-4 flex flex-wrap gap-3">
          {['Repository discovery', 'Branch & commit analysis', 'Pull request creation', 'Webhook automation'].map(f => (
            <span key={f} className="flex items-center gap-1.5 text-xs text-ak-text-secondary bg-white/[0.04] px-2.5 py-1 rounded-lg">
              <CheckIcon /> {f}
            </span>
          ))}
        </div>
        {githubConnected && (
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Link to="/dashboard/agents" className="text-sm text-ak-primary hover:underline flex items-center gap-1">
              Go to Agents <LinkIcon />
            </Link>
          </div>
        )}
      </div>

      {/* === Unified Atlassian Card === */}
      <div className={card + ' p-6'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400">
              <AtlassianIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ak-text-primary">Atlassian</h2>
              <p className="text-sm text-ak-text-secondary mt-0.5">
                Connect once to enable both Jira and Confluence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge(atlassianOAuth.connected)}`}>
              {atlassianOAuth.connected ? 'Connected' : atlassianOAuth.configured ? 'Not Connected' : 'Not Configured'}
            </span>
            {atlassianOAuth.connected ? (
              <Button variant="outline" onClick={handleAtlassianDisconnect} disabled={loading}>Disconnect</Button>
            ) : atlassianOAuth.configured ? (
              <Button variant="primary" onClick={handleAtlassianConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Connect with Atlassian'}
              </Button>
            ) : (
              <span className="text-xs text-ak-text-secondary">Set ATLASSIAN_OAUTH_* env vars</span>
            )}
          </div>
        </div>

        {/* Site info */}
        {atlassianOAuth.connected && atlassianOAuth.siteUrl && (
          <div className="mt-3 text-xs text-ak-text-secondary">
            Site: <span className="text-ak-text-primary">{atlassianOAuth.siteUrl}</span>
          </div>
        )}

        {/* Products grid */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {/* Jira */}
          <div className={`rounded-xl p-4 ${jiraConnected ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ak-text-primary text-sm">Jira</span>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${jiraConnected ? 'bg-emerald-500/15 text-emerald-400' : 'text-ak-text-secondary bg-white/[0.04]'}`}>
                {jiraConnected ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <ul className="space-y-1.5">
              {['Issue linking', 'Status sync', 'Changelog integration', 'Sprint automation'].map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-ak-text-secondary">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            {jiraStatus.error && (
              <p className="mt-2 text-[10px] text-yellow-400">{jiraStatus.error.message}</p>
            )}
          </div>

          {/* Confluence */}
          <div className={`rounded-xl p-4 ${confluenceConnected ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ak-text-primary text-sm">Confluence</span>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${confluenceConnected ? 'bg-emerald-500/15 text-emerald-400' : 'text-ak-text-secondary bg-white/[0.04]'}`}>
                {confluenceConnected ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <ul className="space-y-1.5">
              {['Documentation publishing', 'Space management', 'Page version control', 'Template integration'].map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-ak-text-secondary">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            {confluenceStatus.error && (
              <p className="mt-2 text-[10px] text-yellow-400">{confluenceStatus.error.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Security Callout */}
      <div className={card + ' p-4'}>
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-ak-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <div>
            <h3 className="font-medium text-ak-text-primary text-sm">Secure OAuth 2.0</h3>
            <p className="mt-1 text-xs text-ak-text-secondary">
              Credentials are never stored. Tokens are encrypted with AES-256-GCM and automatically refreshed.
            </p>
          </div>
        </div>
      </div>

      {/* Request Integration */}
      <div className="text-center py-6">
        <p className="text-sm text-ak-text-secondary">
          Need a different integration?{' '}
          <a href="https://github.com/akis-platform/akis/discussions" target="_blank" rel="noopener noreferrer" className="text-ak-primary hover:underline">
            Request one →
          </a>
        </p>
      </div>
    </div>
  );
}
