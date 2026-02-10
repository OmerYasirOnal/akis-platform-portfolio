import { useEffect, useState, useCallback } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import {
  billingApi,
  type PlanInfo,
  type UsageInfo,
  type AvailablePlan,
  type BillingSettings,
  type BillingNotification,
} from '../../../services/api/billing';

const TIER_COLORS: Record<string, string> = {
  free: 'text-ak-text-secondary',
  pro: 'text-blue-400',
  pro_plus: 'text-purple-400',
  team: 'text-amber-400',
  enterprise: 'text-emerald-400',
};

function UsageBar({ label, used, limit, percent }: { label: string; used: number; limit: number; percent: number }) {
  const barColor = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-ak-primary';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ak-text-secondary">{label}</span>
        <span className="font-mono text-ak-text-primary">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ak-surface-2">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: AvailablePlan;
  isCurrent: boolean;
  onSelect: (plan: AvailablePlan) => void;
}) {
  const price = plan.priceMonthly === 0 ? 'Free' : `$${(plan.priceMonthly / 100).toFixed(0)}/mo`;
  return (
    <Card className={`bg-ak-surface p-5 space-y-3 ${isCurrent ? 'ring-2 ring-ak-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${TIER_COLORS[plan.tier] ?? 'text-ak-text-primary'}`}>{plan.name}</h3>
        {isCurrent && <span className="rounded-full bg-ak-primary/20 px-2 py-0.5 text-xs font-medium text-ak-primary">Current</span>}
      </div>
      <p className="text-xs text-ak-text-secondary">{plan.description}</p>
      <p className="text-2xl font-bold text-ak-text-primary">{price}</p>
      <ul className="space-y-1 text-xs text-ak-text-secondary">
        <li>{plan.jobsPerDay} jobs/day</li>
        <li>{(plan.maxTokenBudget / 1000).toFixed(0)}K tokens/month</li>
        <li>{plan.maxAgents} agents</li>
        <li>Depth: {plan.depthModesAllowed.join(', ')}</li>
        {plan.passesAllowed > 1 && <li>Multi-pass ({plan.passesAllowed} passes)</li>}
        {plan.priorityQueue && <li>Priority queue</li>}
        <li>{plan.backgroundJobHistoryDays}d job history</li>
      </ul>
      {!isCurrent && plan.tier !== 'enterprise' && plan.priceMonthly > 0 && (
        <Button onClick={() => onSelect(plan)} className="w-full justify-center">
          Upgrade to {plan.name}
        </Button>
      )}
      {plan.tier === 'enterprise' && !isCurrent && (
        <Button variant="outline" className="w-full justify-center" disabled>
          Contact Sales
        </Button>
      )}
    </Card>
  );
}

function AdminSettingsPanel({
  settings,
  onSave,
  saving,
}: {
  settings: BillingSettings;
  onSave: (s: Partial<BillingSettings>) => void;
  saving: boolean;
}) {
  const [budget, setBudget] = useState(settings.monthlyBudgetUsd?.toString() ?? '');
  const [threshold, setThreshold] = useState(Math.round(settings.softThresholdPct * 100));
  const [hardStop, setHardStop] = useState(settings.hardStopEnabled);

  return (
    <Card className="bg-ak-surface p-6 space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">Workspace Settings</p>
        <p className="text-lg font-bold text-ak-text-primary">Admin Billing Controls</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ak-text-secondary">Monthly Budget (USD)</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="No limit"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none"
          />
          <p className="text-[11px] text-ak-text-secondary">Leave empty for no budget limit.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-ak-text-secondary">Soft Threshold ({threshold}%)</label>
          <input
            type="range"
            min={50}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-ak-primary"
          />
          <p className="text-[11px] text-ak-text-secondary">Notify users when usage reaches this percentage.</p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hardStop}
          onChange={(e) => setHardStop(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-ak-surface-2 accent-ak-primary"
        />
        <div>
          <span className="text-sm text-ak-text-primary">Hard stop on budget exceeded</span>
          <p className="text-[11px] text-ak-text-secondary">Block new jobs when monthly budget is exceeded.</p>
        </div>
      </label>

      <Button
        onClick={() =>
          onSave({
            monthlyBudgetUsd: budget ? Number(budget) : null,
            softThresholdPct: threshold / 100,
            hardStopEnabled: hardStop,
          })
        }
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Card>
  );
}

function NotificationsList({ notifications }: { notifications: BillingNotification[] }) {
  if (notifications.length === 0) {
    return (
      <Card className="bg-ak-surface p-6">
        <p className="text-sm text-ak-text-secondary">No billing notifications.</p>
      </Card>
    );
  }
  return (
    <Card className="bg-ak-surface p-6 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">Recent Notifications</p>
      <ul className="space-y-2">
        {notifications.slice(0, 10).map((n) => {
          const payload = n.payload as Record<string, number>;
          return (
            <li key={n.id} className="flex items-start gap-3 rounded-lg bg-ak-surface-2 px-3 py-2 text-xs">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <div className="flex-1">
                <span className="text-ak-text-primary">
                  {n.type === 'soft_threshold'
                    ? `Usage threshold reached — Jobs: ${payload.percentJobsUsed ?? 0}%, Tokens: ${payload.percentTokensUsed ?? 0}%`
                    : n.type}
                </span>
                <p className="text-ak-text-secondary">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.readAt && <span className="rounded bg-ak-primary/20 px-1.5 py-0.5 text-[10px] text-ak-primary">New</span>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const DashboardSettingsBillingPage = () => {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [role, setRole] = useState<string>('member');
  const [allPlans, setAllPlans] = useState<AvailablePlan[]>([]);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [currentData, plansData, notifData] = await Promise.all([
          billingApi.getCurrentPlan(),
          billingApi.getAvailablePlans(),
          billingApi.getNotifications().catch(() => ({ notifications: [] })),
        ]);
        if (!active) return;
        setPlan(currentData.plan);
        setUsage(currentData.usage);
        setUnlimited(currentData.unlimited ?? false);
        setRole(currentData.role ?? 'member');
        setAllPlans(plansData.plans);
        setNotifications(notifData.notifications);

        if (currentData.role === 'admin') {
          const s = await billingApi.getSettings().catch(() => null);
          if (active && s) setSettings(s);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load billing data');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const handleSaveSettings = useCallback(async (updated: Partial<BillingSettings>) => {
    setSaving(true);
    try {
      const result = await billingApi.updateSettings(updated);
      setSettings(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleUpgrade = async (selectedPlan: AvailablePlan) => {
    if (!selectedPlan.stripePriceMonthly) {
      setError('This plan is not available for self-service upgrade.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await billingApi.createCheckout(selectedPlan.id, selectedPlan.stripePriceMonthly);
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const result = await billingApi.createPortalSession();
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Billing</h1>
        </header>
        <Card className="bg-ak-surface p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-ak-surface-2" />
            <div className="h-2 w-full rounded bg-ak-surface-2" />
            <div className="h-2 w-2/3 rounded bg-ak-surface-2" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">Billing</h1>
        <p className="text-sm text-ak-text-secondary">
          {isAdmin
            ? 'Manage workspace billing, view usage, and configure limits.'
            : 'View your plan and usage.'}
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Current Plan + Usage */}
      {plan && usage && (
        <Card className="bg-ak-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">Current Plan</p>
                <p className={`text-xl font-bold ${TIER_COLORS[plan.tier] ?? 'text-ak-text-primary'}`}>{plan.name}</p>
              </div>
              {unlimited && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  Unlimited
                </span>
              )}
              {isAdmin && (
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400">
                  Admin
                </span>
              )}
            </div>
            {plan.tier !== 'free' && (
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            )}
          </div>

          {unlimited ? (
            <p className="text-sm text-emerald-400">You have unlimited usage. No limits enforced.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UsageBar label="Jobs today" used={usage.jobsUsedToday} limit={usage.jobsLimit} percent={usage.percentJobsUsed} />
              <UsageBar label="Tokens this month" used={usage.tokensUsedThisMonth} limit={usage.tokensLimit} percent={usage.percentTokensUsed} />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Max Agents</p>
              <p className="text-lg font-bold text-ak-text-primary">{plan.maxAgents}</p>
            </div>
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Depth Modes</p>
              <p className="text-sm font-medium text-ak-text-primary">{plan.depthModesAllowed.join(', ')}</p>
            </div>
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Passes</p>
              <p className="text-lg font-bold text-ak-text-primary">{plan.passesAllowed}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Admin: Workspace billing settings */}
      {isAdmin && settings && (
        <AdminSettingsPanel settings={settings} onSave={handleSaveSettings} saving={saving} />
      )}

      {/* Non-admin: budget info */}
      {!isAdmin && !unlimited && (
        <Card className="bg-ak-surface p-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">Workspace Budget</p>
          <p className="text-sm text-ak-text-secondary">
            Your workspace admin manages billing limits. Contact your admin for budget changes.
          </p>
        </Card>
      )}

      {/* Notifications */}
      {notifications.length > 0 && <NotificationsList notifications={notifications} />}

      {/* Available Plans */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ak-text-primary">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {allPlans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={p.id === plan?.planId}
              onSelect={handleUpgrade}
            />
          ))}
        </div>
      </div>

      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-ak-surface p-6 text-center">
            <p className="text-ak-text-primary">Redirecting to checkout...</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardSettingsBillingPage;
