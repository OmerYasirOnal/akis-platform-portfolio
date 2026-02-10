import type { Job, JobTraceEvent, JobAiCall } from '../../services/api/types';

type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type AiCallDetail = {
  provider?: string;
  model?: string;
  usage?: AiUsage;
  estimatedCostUsd?: number | string | null;
};

type AiCallRow = {
  label: string;
  provider?: string;
  model?: string;
  durationMs?: number;
  usage?: AiUsage;
  estimatedCostUsd?: number | null;
  success?: boolean;
};

type RunSummaryTotals = {
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
};

type RunSummaryPanelProps = {
  job: Job;
  traces: JobTraceEvent[];
};

// ============================================================================
// Helpers
// ============================================================================

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDuration = (value: number | null): string => {
  if (value === null) return '—';
  if (value < 1000) return `${value}ms`;
  const seconds = value / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
};

const formatTokens = (value: number | null): string => {
  if (value === null) return '—';
  return value.toLocaleString();
};

const formatCost = (value: number | null): string => {
  if (value === null) return '—';
  return `$${value.toFixed(4)}`;
};

const buildTotalsFromJob = (job: Job): RunSummaryTotals => ({
  durationMs: coerceNumber(job.aiTotalDurationMs),
  inputTokens: coerceNumber(job.aiInputTokens),
  outputTokens: coerceNumber(job.aiOutputTokens),
  totalTokens: coerceNumber(job.aiTotalTokens),
  estimatedCostUsd: coerceNumber(job.aiEstimatedCostUsd),
});

const buildTotalsFromCalls = (calls: AiCallRow[]): RunSummaryTotals => {
  let durationMs = 0, inputTokens = 0, outputTokens = 0, totalTokens = 0, estimatedCostUsd = 0;
  let hasCost = false;
  calls.forEach((call) => {
    if (typeof call.durationMs === 'number') durationMs += call.durationMs;
    if (call.usage?.inputTokens) inputTokens += call.usage.inputTokens;
    if (call.usage?.outputTokens) outputTokens += call.usage.outputTokens;
    if (call.usage?.totalTokens) totalTokens += call.usage.totalTokens;
    if (typeof call.estimatedCostUsd === 'number') { estimatedCostUsd += call.estimatedCostUsd; hasCost = true; }
  });
  const normalizedTotals = totalTokens > 0 ? totalTokens : inputTokens + outputTokens;
  return {
    durationMs: calls.length > 0 ? durationMs : null,
    inputTokens: calls.length > 0 ? inputTokens || null : null,
    outputTokens: calls.length > 0 ? outputTokens || null : null,
    totalTokens: calls.length > 0 ? normalizedTotals || null : null,
    estimatedCostUsd: hasCost ? Number(estimatedCostUsd.toFixed(6)) : null,
  };
};

const buildCallRows = (job: Job, traces: JobTraceEvent[]): AiCallRow[] => {
  if (job.ai?.calls && job.ai.calls.length > 0) {
    return job.ai.calls.map((call: JobAiCall) => ({
      label: call.purpose || `AI Call ${call.callIndex + 1}`,
      provider: call.provider,
      model: call.model,
      durationMs: call.durationMs ?? undefined,
      usage: { inputTokens: call.inputTokens ?? undefined, outputTokens: call.outputTokens ?? undefined, totalTokens: call.totalTokens ?? undefined },
      estimatedCostUsd: coerceNumber(call.estimatedCostUsd),
      success: call.success,
    }));
  }
  return traces
    .filter((trace) => trace.eventType === 'ai_call')
    .map((trace, index) => {
      const detail = (trace.detail ?? {}) as AiCallDetail;
      return {
        label: trace.title?.replace(/^AI:\s*/i, '') || `AI Call ${index + 1}`,
        provider: detail.provider,
        model: detail.model,
        durationMs: trace.durationMs,
        usage: detail.usage,
        estimatedCostUsd: coerceNumber(detail.estimatedCostUsd),
        success: trace.status !== 'failed',
      };
    });
};

/** Badge for key source */
const KeySourceBadge = ({ keySource, fallbackReason }: { keySource: string | null; fallbackReason: string | null }) => {
  if (!keySource) return null;
  const isEnv = keySource === 'env';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
      isEnv ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    }`}>
      {isEnv ? 'ENV Key' : 'User Key'}
      {isEnv && fallbackReason && <span className="text-yellow-400" title={fallbackReason}>!</span>}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const RunSummaryPanel = ({ job, traces }: RunSummaryPanelProps) => {
  const calls = buildCallRows(job, traces);
  const totalsFromJob = buildTotalsFromJob(job);
  const totalsFromCalls = buildTotalsFromCalls(calls);

  const aiSummary = job.ai?.summary;
  const totals: RunSummaryTotals = {
    durationMs: coerceNumber(aiSummary?.totalDurationMs) ?? totalsFromJob.durationMs ?? totalsFromCalls.durationMs,
    inputTokens: coerceNumber(aiSummary?.inputTokens) ?? totalsFromJob.inputTokens ?? totalsFromCalls.inputTokens,
    outputTokens: coerceNumber(aiSummary?.outputTokens) ?? totalsFromJob.outputTokens ?? totalsFromCalls.outputTokens,
    totalTokens: coerceNumber(aiSummary?.totalTokens) ?? totalsFromJob.totalTokens ?? totalsFromCalls.totalTokens,
    estimatedCostUsd: coerceNumber(aiSummary?.estimatedCostUsd) ?? totalsFromJob.estimatedCostUsd ?? totalsFromCalls.estimatedCostUsd,
  };

  const resolvedProvider = job.ai?.resolved?.provider;
  const resolvedModel = job.ai?.resolved?.model;
  const requestedProvider = job.ai?.requested?.provider || job.aiProvider;
  const requestedModel = job.ai?.requested?.model || job.aiModel;
  const displayProvider = resolvedProvider || requestedProvider || calls.find(c => c.provider)?.provider || '—';
  const displayModel = resolvedModel || requestedModel || calls.find(c => c.model)?.model || '—';
  const keySource = job.ai?.resolved?.keySource || null;
  const fallbackReason = job.ai?.resolved?.fallbackReason || null;

  const hasTotals = totals.durationMs !== null || totals.totalTokens !== null || totals.estimatedCostUsd !== null;
  if (calls.length === 0 && !hasTotals && !displayModel) return null;

  const card = 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]';

  return (
    <div className={`${card} rounded-2xl p-5 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-ak-text-primary">Run Summary</h2>
          <p className="text-[11px] text-ak-text-secondary mt-0.5">AI usage metrics (cost is estimated)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ak-text-secondary">
            {displayProvider} <span className="text-ak-text-primary font-medium">/ {displayModel}</span>
          </span>
          <KeySourceBadge keySource={keySource} fallbackReason={fallbackReason} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Duration', value: formatDuration(totals.durationMs) },
          { label: 'Input Tokens', value: formatTokens(totals.inputTokens) },
          { label: 'Output Tokens', value: formatTokens(totals.outputTokens) },
          { label: 'Est. Cost', value: formatCost(totals.estimatedCostUsd) },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-wider text-ak-text-secondary">{m.label}</p>
            <p className="mt-1 text-sm font-semibold text-ak-text-primary">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Call Breakdown */}
      {calls.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ak-text-secondary uppercase tracking-wider mb-2">
            AI Calls ({calls.length})
          </h3>
          <div className="space-y-2">
            {calls.map((call, i) => (
              <div key={`${call.label}-${i}`} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${call.success === false ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs text-ak-text-primary truncate">{call.label}</span>
                  {call.model && call.model !== displayModel && (
                    <span className="text-[10px] text-ak-text-secondary">{call.model}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-ak-text-secondary flex-shrink-0">
                  <span>{formatDuration(call.durationMs ?? null)}</span>
                  <span>{formatTokens((call.usage?.totalTokens ?? ((call.usage?.inputTokens ?? 0) + (call.usage?.outputTokens ?? 0))) || null)}</span>
                  <span>{formatCost(call.estimatedCostUsd ?? null)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback reason */}
      {fallbackReason && (
        <div className="mt-3 text-[10px] text-ak-text-secondary bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]">
          <span className="font-medium text-ak-text-primary">Provider selection:</span>{' '}
          {(() => {
            const reasons: Record<string, string> = {
              PAYLOAD_PROVIDER: 'Explicitly set in job request',
              USER_ACTIVE_PROVIDER: 'Your active provider setting',
              ENV_DEFAULT_NO_USER_ACTIVE: 'System default (no active provider set)',
              ENV_DEFAULT_NO_USER_ID: 'System default (no user context)',
              USER_KEY_MISSING: 'Your key not found, using system key',
              USE_ENV_AI_FLAG: 'Forced by useEnvAI flag',
              NON_SCRIBE_JOB: 'Non-Scribe jobs use system config',
              NO_USER_ID: 'No user context available',
            };
            return reasons[fallbackReason] || fallbackReason;
          })()}
          {requestedModel && requestedModel !== displayModel && (
            <span className="ml-2 text-yellow-400">(Requested: {requestedModel})</span>
          )}
        </div>
      )}
    </div>
  );
};
