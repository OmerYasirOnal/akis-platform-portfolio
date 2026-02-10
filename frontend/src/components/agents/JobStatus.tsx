import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { JobDetail, JobState } from '../../services/api/agents';
import { useI18n } from '../../i18n/useI18n';

type JobStatusProps = {
  job: JobDetail | null;
  isPolling: boolean;
};

const stateLabels: Record<JobState, { tone: string; bg: string }> = {
  pending: { tone: 'text-ak-warning', bg: 'bg-ak-warning/20' },
  running: { tone: 'text-ak-primary', bg: 'bg-ak-primary/20' },
  completed: { tone: 'text-ak-success', bg: 'bg-ak-success/20' },
  failed: { tone: 'text-ak-danger', bg: 'bg-ak-danger/20' },
};

const formatDate = (value?: string): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatElapsed = (start: string, end?: string): string => {
  try {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
    return `${(diffMs / 60000).toFixed(1)}m`;
  } catch {
    return '-';
  }
};

type ErrorHint = { hint: string; action?: string; link?: string };

const getErrorHint = (errorCode?: string | null): ErrorHint | null => {
  if (!errorCode) return null;

  const hints: Record<string, ErrorHint> = {
    'AI_KEY_MISSING': { hint: 'AI API key is missing.', action: 'Add an API key in Settings → AI Keys.', link: '/dashboard/settings/ai-keys' },
    'AI_PROVIDER_ERROR': { hint: 'AI provider returned an error.', action: 'Verify your API key and selected model.', link: '/dashboard/settings/ai-keys' },
    'AI_AUTH_ERROR': { hint: 'Authentication failed with AI provider.', action: 'Your API key may be invalid or expired.', link: '/dashboard/settings/ai-keys' },
    'MCP_UNREACHABLE': { hint: 'MCP Gateway is not running. Run: ./scripts/mcp-doctor.sh' },
    'MCP_TIMEOUT': { hint: 'Gateway connection timed out. Check if gateway is healthy.' },
    'MCP_UNAUTHORIZED': { hint: 'Invalid or missing GitHub token.' },
    'MCP_FORBIDDEN': { hint: 'Token lacks required scopes (repo, read:org).' },
    '-32601': { hint: 'MCP tool not found. Check gateway compatibility.' },
    '429': { hint: 'Rate limit exceeded. Please wait and retry.' },
  };

  return hints[String(errorCode)] || null;
};

export const JobStatus = ({ job, isPolling }: JobStatusProps) => {
  const { t } = useI18n();
  const [showDetails, setShowDetails] = useState(false);

  if (!job) {
    return (
      <div className="rounded-xl border border-ak-border bg-ak-surface px-4 py-5 text-sm text-ak-text-secondary">
        {t('agents.status.empty')}
      </div>
    );
  }

  const stateTone = stateLabels[job.state];
  const isFinal = job.state === 'completed' || job.state === 'failed';
  const elapsed = formatElapsed(job.createdAt, isFinal ? job.updatedAt : undefined);

  return (
    <div className="space-y-4 rounded-xl border border-ak-border bg-ak-surface px-4 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${stateTone.tone} ${stateTone.bg}`}>
            {t(`agents.status.state.${job.state}`)}
          </span>
          {isPolling && (
            <span className="flex items-center gap-1 text-xs text-ak-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ak-primary" />
              {t('agents.status.polling')}
            </span>
          )}
          {!isFinal && (
            <span className="text-xs text-ak-text-secondary">
              {elapsed} elapsed
            </span>
          )}
        </div>
        <span className="text-xs text-ak-text-secondary font-mono">
          {job.id.slice(0, 8)}...
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Started</dt>
          <dd className="mt-1 text-ak-text-primary">{formatDate(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Duration</dt>
          <dd className="mt-1 text-ak-text-primary">{elapsed}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em] text-ak-text-secondary/70">Type</dt>
          <dd className="mt-1 capitalize text-ak-text-primary">{job.type}</dd>
        </div>
      </dl>

      {job.result != null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
              {t('agents.status.result')}
            </p>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-ak-primary hover:underline"
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          </div>
          {showDetails && (
            <pre className="overflow-x-auto rounded-xl bg-ak-surface-2 p-3 text-xs text-ak-text-secondary max-h-64 overflow-y-auto">
              {JSON.stringify(job.result, null, 2)}
            </pre>
          )}
        </div>
      )}

      {(job.error != null || job.errorMessage != null) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
            {t('agents.status.error')}
          </p>
          <div className="rounded-lg bg-ak-danger/10 p-3 border border-ak-danger/30">
            {job.errorCode != null && (
              <span className="inline-block rounded-md bg-ak-danger/20 px-2 py-0.5 text-xs font-medium text-ak-danger mb-2">
                {job.errorCode}
              </span>
            )}
            {job.errorMessage != null && (
              <p className="text-sm text-ak-danger">{job.errorMessage}</p>
            )}
            {getErrorHint(job.errorCode) != null && (() => {
              const eh = getErrorHint(job.errorCode)!;
              return (
                <div className="mt-2 text-xs text-ak-text-secondary border-t border-ak-danger/20 pt-2 space-y-1">
                  <p>💡 {eh.hint}</p>
                  {eh.action && <p className="text-ak-text-primary">{eh.action}</p>}
                  {eh.link && (
                    <Link to={eh.link} className="inline-flex items-center gap-1 text-ak-primary hover:underline">
                      Go to Settings →
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isFinal && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-ak-border">
          <Link
            to={`/dashboard/jobs/${job.id}`}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-ak-primary text-ak-text-on-primary hover:bg-ak-primary/90 transition-colors"
          >
            Open Job Details
          </Link>
          <button
            onClick={() => {
              const summary = `Job ${job.id.slice(0, 8)} - ${job.state.toUpperCase()}\n` +
                `Type: ${job.type}\n` +
                `Duration: ${elapsed}\n` +
                (job.errorCode ? `Error: ${job.errorCode}\n` : '') +
                (job.errorMessage ? `Message: ${job.errorMessage}\n` : '');
              void navigator.clipboard.writeText(summary);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-ak-surface-2 text-ak-text-primary hover:bg-ak-surface-3 transition-colors"
          >
            Copy Summary
          </button>
        </div>
      )}
    </div>
  );
};
