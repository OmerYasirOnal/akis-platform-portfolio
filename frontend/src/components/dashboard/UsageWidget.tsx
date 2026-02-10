/**
 * UsageWidget - Displays monthly token usage and cost breakdown
 * Follows the liquid glass aesthetic with neon accents
 */
import { useState, useEffect } from 'react';
import Card from '../common/Card';

interface UsageData {
  period: {
    start: string;
    end: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    jobCount: number;
  };
  freeQuota: {
    tokens: number;
    costUsd: number;
  };
  used: {
    tokens: number;
    costUsd: number;
  };
  remaining: {
    tokens: number;
    costUsd: number;
  };
  onDemand: {
    tokens: number;
    costUsd: number;
  };
  percentUsed: {
    tokens: number;
    cost: number;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

const formatCurrency = (amount: number): string => {
  if (amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
};

interface ProgressBarProps {
  percent: number;
  color?: 'primary' | 'warning' | 'danger';
}

const ProgressBar = ({ percent, color = 'primary' }: ProgressBarProps) => {
  const colorClasses = {
    primary: 'bg-ak-primary',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const glowClasses = {
    primary: 'shadow-[0_0_10px_rgba(56,189,248,0.5)]',
    warning: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    danger: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
  };

  return (
    <div className="h-2 w-full rounded-full bg-ak-surface-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]} ${glowClasses[color]}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
};

export const UsageWidget = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/usage/current-month', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view usage');
            return;
          }
          throw new Error('Failed to fetch usage data');
        }

        const data = await response.json();
        setUsage(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="bg-ak-surface p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-ak-surface-2" />
          <div className="h-24 rounded bg-ak-surface-2" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-ak-surface p-5">
        <p className="text-sm text-ak-text-secondary">{error}</p>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const getTokenColor = (percent: number): 'primary' | 'warning' | 'danger' => {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warning';
    return 'primary';
  };

  const getCostColor = (percent: number): 'primary' | 'warning' | 'danger' => {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warning';
    return 'primary';
  };

  const monthName = new Date(usage.period.start).toLocaleDateString('en-US', { month: 'long' });

  return (
    <Card className="bg-ak-surface p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ak-text-primary">Usage This Month</h3>
          <p className="text-xs text-ak-text-secondary">{monthName}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ak-surface-2 text-xs text-ak-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {usage.usage.jobCount} jobs
        </div>
      </div>

      {/* Token Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ak-text-secondary">Tokens</span>
          <span className="font-medium text-ak-text-primary">
            {formatNumber(usage.used.tokens)} / {formatNumber(usage.freeQuota.tokens)}
          </span>
        </div>
        <ProgressBar 
          percent={usage.percentUsed.tokens} 
          color={getTokenColor(usage.percentUsed.tokens)} 
        />
        <div className="flex justify-between text-xs text-ak-text-secondary">
          <span>
            {formatNumber(usage.remaining.tokens)} remaining
          </span>
          {usage.onDemand.tokens > 0 && (
            <span className="text-yellow-400">
              +{formatNumber(usage.onDemand.tokens)} on-demand
            </span>
          )}
        </div>
      </div>

      {/* Cost */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ak-text-secondary">Est. Cost</span>
          <span className="font-medium text-ak-text-primary">
            {formatCurrency(usage.used.costUsd)} / {formatCurrency(usage.freeQuota.costUsd)}
          </span>
        </div>
        <ProgressBar 
          percent={usage.percentUsed.cost} 
          color={getCostColor(usage.percentUsed.cost)} 
        />
        <div className="flex justify-between text-xs text-ak-text-secondary">
          <span>
            {formatCurrency(usage.remaining.costUsd)} free remaining
          </span>
          {usage.onDemand.costUsd > 0 && (
            <span className="text-yellow-400">
              +{formatCurrency(usage.onDemand.costUsd)} charged
            </span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="pt-3 border-t border-ak-border">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-ak-surface-2 p-3">
            <span className="block text-ak-text-secondary">Input Tokens</span>
            <span className="text-base font-semibold text-ak-text-primary">
              {formatNumber(usage.usage.inputTokens)}
            </span>
          </div>
          <div className="rounded-lg bg-ak-surface-2 p-3">
            <span className="block text-ak-text-secondary">Output Tokens</span>
            <span className="text-base font-semibold text-ak-text-primary">
              {formatNumber(usage.usage.outputTokens)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UsageWidget;
