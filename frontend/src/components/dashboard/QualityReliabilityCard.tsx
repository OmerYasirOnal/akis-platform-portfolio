import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client';
import type { DashboardMetrics } from '../../services/api/types';

const ERROR_CODE_LABELS: Record<string, string> = {
  AI_PROVIDER_ERROR: 'AI Provider Error',
  MCP_UNREACHABLE: 'MCP Gateway Unreachable',
  AI_RATE_LIMITED: 'Rate Limited',
  TIMEOUT: 'Timeout',
  VALIDATION_ERROR: 'Validation Error',
};

const ERROR_CODE_SUGGESTIONS: Record<string, { text: string; link?: string }> = {
  AI_PROVIDER_ERROR: { text: 'Check AI provider config', link: '/dashboard/settings/ai-keys' },
  MCP_UNREACHABLE: { text: 'Verify GitHub integration', link: '/dashboard/integrations' },
  AI_RATE_LIMITED: { text: 'Wait or upgrade plan', link: '/dashboard/settings/billing' },
  TIMEOUT: { text: 'Try smaller scope', link: '/agents' },
};

export function QualityReliabilityCard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getDashboardMetrics(period)
      .then((data) => {
        if (!cancelled) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load metrics');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  if (loading) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5 animate-pulse">
        <div className="h-5 w-40 bg-ak-surface-2 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-ak-surface-2 rounded" />
          <div className="h-16 bg-ak-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!metrics || metrics.totalJobs === 0) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
        <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Quality & Reliability</h3>
        <div className="rounded-lg bg-ak-bg px-4 py-6 text-center">
          <p className="text-sm text-ak-text-secondary">
            Run an agent to see quality metrics.
          </p>
          <Link
            to="/agents"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ak-primary hover:underline"
          >
            Start your first run →
          </Link>
        </div>
      </div>
    );
  }

  const topIssueLabel = metrics.topFailureReason
    ? ERROR_CODE_LABELS[metrics.topFailureReason] || metrics.topFailureReason
    : null;
  const suggestion = metrics.topFailureReason
    ? ERROR_CODE_SUGGESTIONS[metrics.topFailureReason]
    : null;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ak-text-primary">Quality & Reliability</h3>
        <div className="flex gap-1 rounded-lg bg-ak-bg p-0.5">
          {(['7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-ak-surface text-ak-text-primary shadow-sm'
                  : 'text-ak-text-secondary hover:text-ak-text-primary'
              }`}
            >
              {p === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-ak-bg p-4">
          <p className="text-xs text-ak-text-secondary mb-1">Avg Quality</p>
          <p className="text-2xl font-semibold text-ak-text-primary">
            {metrics.avgQualityScore !== null ? `${Math.round(metrics.avgQualityScore)}` : '—'}
            <span className="text-sm font-normal text-ak-text-secondary">/100</span>
          </p>
        </div>
        <div className="rounded-lg bg-ak-bg p-4">
          <p className="text-xs text-ak-text-secondary mb-1">Success Rate</p>
          <p className="text-2xl font-semibold text-ak-text-primary">
            {metrics.successRate}
            <span className="text-sm font-normal text-ak-text-secondary">%</span>
          </p>
        </div>
      </div>

      <div className="text-xs text-ak-text-secondary">
        <span>{metrics.completedJobs} completed</span>
        <span className="mx-1">·</span>
        <span>{metrics.failedJobs} failed</span>
        <span className="mx-1">·</span>
        <span>{metrics.totalJobs} total</span>
      </div>

      {topIssueLabel && metrics.topFailureCount > 0 && (
        <div className="mt-4 pt-4 border-t border-ak-border">
          <p className="text-xs text-ak-text-secondary mb-2">Top Issue</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                {metrics.topFailureCount}
              </span>
              <span className="text-sm text-ak-text-primary">{topIssueLabel}</span>
            </div>
            {suggestion && (
              <Link
                to={suggestion.link || '#'}
                className="text-xs font-medium text-ak-primary hover:underline"
              >
                {suggestion.text} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
