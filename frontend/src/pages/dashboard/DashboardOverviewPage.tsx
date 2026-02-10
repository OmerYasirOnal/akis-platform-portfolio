import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import { UsageWidget } from '../../components/dashboard/UsageWidget';
import { QualityReliabilityCard } from '../../components/dashboard/QualityReliabilityCard';
import { GettingStartedCard } from '../../components/dashboard/GettingStartedCard';

const AgentsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

type DashboardTab = 'usage' | 'spending' | 'integrations';

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'usage', label: 'Usage' },
  { id: 'spending', label: 'Spending' },
  { id: 'integrations', label: 'Integrations' },
];

function UsageTabContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageWidget />
        <QualityReliabilityCard />
      </div>
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Recent Activity</h3>
        <div className="rounded-lg bg-ak-bg px-4 py-8 text-center">
          <p className="text-sm text-ak-text-secondary">
            No recent activity yet. Start an agent run to populate this feed.
          </p>
          <Link
            to="/agents"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ak-primary hover:underline"
          >
            Run your first agent <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SpendingTabContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <h3 className="text-sm font-semibold text-ak-text-primary mb-1">AI Spending</h3>
        <p className="text-xs text-ak-text-secondary mb-4">Token usage and estimated costs for the current billing period.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-ak-bg p-4">
            <p className="text-xs text-ak-text-secondary">Total Tokens</p>
            <p className="mt-1 text-2xl font-semibold text-ak-text-primary">0</p>
          </div>
          <div className="rounded-lg bg-ak-bg p-4">
            <p className="text-xs text-ak-text-secondary">Estimated Cost</p>
            <p className="mt-1 text-2xl font-semibold text-ak-text-primary">$0.00</p>
          </div>
          <div className="rounded-lg bg-ak-bg p-4">
            <p className="text-xs text-ak-text-secondary">Jobs Run</p>
            <p className="mt-1 text-2xl font-semibold text-ak-text-primary">0</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Cost Breakdown</h3>
        <div className="rounded-lg bg-ak-bg px-4 py-8 text-center">
          <p className="text-sm text-ak-text-secondary">No spending data yet. Run an agent to see cost breakdown.</p>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTabContent() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ak-text-primary">Connected Integrations</h3>
            <p className="text-xs text-ak-text-secondary mt-0.5">Manage your external service connections.</p>
          </div>
          <Link to="/dashboard/integrations">
            <Button variant="outline" size="sm">Manage</Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/dashboard/integrations" className="rounded-xl border border-ak-border bg-ak-surface p-4 hover:bg-ak-surface-2 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ak-surface-2 text-ak-text-primary">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ak-text-primary">GitHub</p>
              <p className="text-xs text-ak-text-secondary">Repos, PRs, webhooks</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/integrations" className="rounded-xl border border-ak-border bg-ak-surface p-4 hover:bg-ak-surface-2 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ak-surface-2 text-blue-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.12 11.08a.74.74 0 00-1.2.18L.62 21.9a.72.72 0 00.65 1.05h7.55a.72.72 0 00.65-.42c1.48-3.12.57-7.85-2.35-11.45zM11.55.17a15.06 15.06 0 00-1.1 15.08l3.77 7.61a.72.72 0 00.65.42h7.55a.72.72 0 00.65-1.05L12.75.35a.74.74 0 00-1.2-.18z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ak-text-primary">Atlassian</p>
              <p className="text-xs text-ak-text-secondary">Jira, Confluence</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

const DashboardOverviewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'usage';

  const setTab = (tab: DashboardTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ak-text-primary">Dashboard</h1>
          <p className="text-sm text-ak-text-secondary mt-0.5">
            Overview of your workspace activity and resource usage.
          </p>
        </div>
        <Button
          as={Link}
          to="/agents"
          className="gap-2 w-full sm:w-auto justify-center"
        >
          <AgentsIcon />
          Open Agents Hub
        </Button>
      </div>

      {/* Getting Started — onboarding checklist */}
      <GettingStartedCard />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: '/agents', label: 'Agents Hub', primary: true },
          { to: '/dashboard/jobs', label: 'Jobs', primary: false },
          { to: '/dashboard/integrations', label: 'Integrations', primary: false },
          { to: '/dashboard/settings/profile', label: 'Settings', primary: false },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              item.primary
                ? 'bg-ak-primary text-ak-bg hover:bg-ak-primary/90'
                : 'border border-ak-border bg-ak-surface text-ak-text-primary hover:bg-ak-surface-2'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="border-b border-ak-border">
        <nav className="flex gap-6" aria-label="Dashboard tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-ak-primary text-ak-primary'
                  : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary hover:border-ak-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'usage' && <UsageTabContent />}
      {activeTab === 'spending' && <SpendingTabContent />}
      {activeTab === 'integrations' && <IntegrationsTabContent />}
    </div>
  );
};

export default DashboardOverviewPage;
