/**
 * Trace Single-Page Console (S0.5.2-UX-1)
 *
 * Layout matches the Scribe console structure:
 * - Top: Configuration bar (spec input)
 * - Bottom: Workspace with Logs/Results tabs
 *
 * Placeholder phase — wired to useAgentStatus for live badge.
 * Route guard redirects to /dashboard if agent is disabled (future).
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import AgentRuntimeSettingsDrawer from '../../../../components/agents/AgentRuntimeSettingsDrawer';
import { useAgentStatus } from '../../../../hooks/useAgentStatus';
import { useI18n } from '../../../../i18n/useI18n';
import { agentsApi, type JobDetail, type RuntimeOverride } from '../../../../services/api/agents';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../../services/api/ai-keys';

type ActiveTab = 'logs' | 'results';
type TraceQuestionKey = 'testDepth' | 'authScope' | 'browserTarget' | 'strictness';

interface TracePreferences {
  testDepth: 'smoke' | 'standard' | 'deep';
  authScope: 'public' | 'authenticated' | 'mixed';
  browserTarget: 'chromium' | 'cross_browser' | 'mobile';
  strictness: 'fast' | 'balanced' | 'strict';
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
}

interface TraceEvent {
  id?: string;
  timestamp: string;
  title?: string;
  detail?: string;
  status?: 'running' | 'completed' | 'failed';
}

interface AutomationExecutionSummary {
  runner?: 'playwright';
  targetBaseUrl?: string;
  executedScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  featuresPassed?: number;
  featuresFailed?: number;
  featurePassRate?: number;
  testCasesTotal?: number;
  testCasesPassed?: number;
  testCasesFailed?: number;
  durationMs?: number;
  generatedTestPath?: string;
  failures?: Array<{ feature: string; test: string; reason: string }>;
  featuresCovered: number;
  featuresTotal: number;
  featureCoverageRate: number;
  mode: 'syntactic';
}

const DashboardAgentTracePage = () => {
  const { t } = useI18n();
  const { status: agentStatus } = useAgentStatus('trace');

  // Form state
  const [spec, setSpec] = useState('');
  const [tracePreferences, setTracePreferences] = useState<TracePreferences>({
    testDepth: 'standard',
    authScope: 'mixed',
    browserTarget: 'chromium',
    strictness: 'balanced',
  });

  // Job execution state
  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Glass box panel
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [runtimeOverride, setRuntimeOverride] = useState<RuntimeOverride | undefined>(undefined);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const job = await agentsApi.getJob(jobId, { include: ['trace', 'artifacts'] });
      setCurrentJob(job);

      if (job.trace && Array.isArray(job.trace)) {
        const traceLogs: LogEntry[] = (job.trace as TraceEvent[]).map((event) => ({
          id: event.id || String(Math.random()),
          timestamp: new Date(event.timestamp),
          level: event.status === 'failed' ? 'error' : event.status === 'completed' ? 'success' : 'info',
          message: event.title || event.detail || 'Processing...',
        }));
        // Preserve manually-added logs (start/submit) and append trace events
        setLogs((prev) => {
          const manualLogs = prev.filter((l) => l.id.startsWith('start-') || l.id.startsWith('submitted-'));
          return [...manualLogs, ...traceLogs];
        });
      }

      if (job.state === 'completed' || job.state === 'failed') {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        const completionLog: LogEntry = {
          id: `completion-${Date.now()}`,
          timestamp: new Date(),
          level: job.state === 'completed' ? 'success' : 'error',
          message: job.state === 'completed'
            ? '✓ Trace workflow completed successfully'
            : `✗ Trace workflow failed: ${job.errorMessage || job.error || 'Unknown error'}`,
        };
        setLogs(prev => [...prev, completionLog]);
      }
    } catch (error) {
      console.error('Failed to poll job:', error);
    }
  }, []);

  // Start polling when job is created
  useEffect(() => {
    if (currentJob && isPolling && (currentJob.state === 'pending' || currentJob.state === 'running')) {
      void pollJobStatus(currentJob.id);

      pollingIntervalRef.current = window.setInterval(() => {
        void pollJobStatus(currentJob.id);
      }, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [currentJob, isPolling, pollJobStatus]);

  const canRun = spec.trim().length > 0 && !isPolling;

  const updatePreference = (key: TraceQuestionKey, value: string) => {
    setTracePreferences((prev) => ({ ...prev, [key]: value } as TracePreferences));
  };

  const questionGroups: Array<{
    key: TraceQuestionKey;
    label: string;
    help: string;
    options: Array<{ value: string; label: string }>;
  }> = [
    {
      key: 'testDepth',
      label: t('traceConsole.questions.testDepth.label'),
      help: t('traceConsole.questions.testDepth.help'),
      options: [
        { value: 'smoke', label: t('traceConsole.questions.testDepth.options.smoke') },
        { value: 'standard', label: t('traceConsole.questions.testDepth.options.standard') },
        { value: 'deep', label: t('traceConsole.questions.testDepth.options.deep') },
      ],
    },
    {
      key: 'authScope',
      label: t('traceConsole.questions.authScope.label'),
      help: t('traceConsole.questions.authScope.help'),
      options: [
        { value: 'public', label: t('traceConsole.questions.authScope.options.public') },
        { value: 'authenticated', label: t('traceConsole.questions.authScope.options.authenticated') },
        { value: 'mixed', label: t('traceConsole.questions.authScope.options.mixed') },
      ],
    },
    {
      key: 'browserTarget',
      label: t('traceConsole.questions.browserTarget.label'),
      help: t('traceConsole.questions.browserTarget.help'),
      options: [
        { value: 'chromium', label: t('traceConsole.questions.browserTarget.options.chromium') },
        { value: 'cross_browser', label: t('traceConsole.questions.browserTarget.options.crossBrowser') },
        { value: 'mobile', label: t('traceConsole.questions.browserTarget.options.mobile') },
      ],
    },
    {
      key: 'strictness',
      label: t('traceConsole.questions.strictness.label'),
      help: t('traceConsole.questions.strictness.help'),
      options: [
        { value: 'fast', label: t('traceConsole.questions.strictness.options.fast') },
        { value: 'balanced', label: t('traceConsole.questions.strictness.options.balanced') },
        { value: 'strict', label: t('traceConsole.questions.strictness.options.strict') },
      ],
    },
  ];

  const handleRunTrace = async () => {
    if (!canRun) return;

    setLogs([]);
    setCurrentJob(null);

    const initialLog: LogEntry = {
      id: `start-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: t('traceConsole.logs.starting'),
    };
    const preferenceLog: LogEntry = {
      id: `profile-${Date.now()}`,
      timestamp: new Date(),
      level: 'info',
      message: `${t('traceConsole.logs.profilePrefix')}: depth=${tracePreferences.testDepth}, auth=${tracePreferences.authScope}, browser=${tracePreferences.browserTarget}, strictness=${tracePreferences.strictness}`,
    };
    setLogs([initialLog, preferenceLog]);
    setActiveTab('logs');

    try {
      let aiProvider: AIKeyProvider | undefined;
      try {
        const aiStatus = await getMultiProviderStatus();
        if (aiStatus.activeProvider) {
          aiProvider = aiStatus.activeProvider;
        } else {
          const openaiOk = aiStatus.providers.openai.configured;
          const openrouterOk = aiStatus.providers.openrouter.configured;
          if (openaiOk) aiProvider = 'openai';
          else if (openrouterOk) aiProvider = 'openrouter';
          else throw new Error('No AI provider configured. Add an API key in Settings > AI Keys.');
        }
      } catch (aiError) {
        const errorLog: LogEntry = {
          id: `ai-error-${Date.now()}`,
          timestamp: new Date(),
          level: 'error',
          message: aiError instanceof Error ? aiError.message : 'Failed to determine AI provider.',
        };
        setLogs(prev => [...prev, errorLog]);
        return;
      }

      const response = await agentsApi.runAgent({
        type: 'trace',
        payload: {
          spec: spec.trim(),
          tracePreferences,
          ...(aiProvider && { aiProvider }),
        },
        runtimeOverride,
      });

      const job = await agentsApi.getJob(response.jobId);
      setCurrentJob(job);
      setIsPolling(true);

      window.dispatchEvent(new CustomEvent('akis-job-started', {
        detail: { id: job.id, type: job.type, state: job.state, createdAt: job.createdAt, updatedAt: job.updatedAt },
      }));

      const submittedLog: LogEntry = {
        id: `submitted-${Date.now()}`,
        timestamp: new Date(),
        level: 'success',
        message: `${t('traceConsole.logs.submitted')} ${response.jobId}`,
      };
      setLogs(prev => [...prev, submittedLog]);
    } catch (error) {
      const errorLog: LogEntry = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        level: 'error',
        message: `Failed to start Trace: ${error instanceof Error ? error.message : String(error)}`,
      };
      setLogs(prev => [...prev, errorLog]);
      console.error('Failed to run Trace:', error);
    }
  };

  const handleReset = () => {
    setCurrentJob(null);
    setLogs([]);
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const getStatusColor = () => {
    if (!currentJob) return 'text-ak-text-secondary';
    switch (currentJob.state) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      case 'running': return 'text-blue-400';
      default: return 'text-ak-text-secondary';
    }
  };

  const getStatusText = () => {
    if (!currentJob) return 'Ready';
    switch (currentJob.state) {
      case 'pending': return 'Queued';
      case 'running': return 'Running';
      case 'completed': return 'Complete';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'debug': return 'text-gray-500';
      default: return 'text-ak-text-secondary';
    }
  };

  const isRunning = isPolling && currentJob && (currentJob.state === 'pending' || currentJob.state === 'running');
  const isComplete = currentJob && (currentJob.state === 'completed' || currentJob.state === 'failed');
  const isIdle = !currentJob || !isPolling;

  // Extract results from job
  const results = currentJob?.result && typeof currentJob.result === 'object'
    ? JSON.stringify(currentJob.result, null, 2)
    : null;
  const automationExecution: AutomationExecutionSummary | null = (() => {
    if (!currentJob?.result || typeof currentJob.result !== 'object') return null;
    const metadata = (currentJob.result as { metadata?: unknown }).metadata;
    if (!metadata || typeof metadata !== 'object') return null;
    const raw = (metadata as { automationSummary?: unknown; automationExecution?: unknown }).automationSummary
      ?? (metadata as { automationExecution?: unknown }).automationExecution;
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Partial<AutomationExecutionSummary>;
    if (
      typeof value.executedScenarios !== 'number' ||
      typeof value.passedScenarios !== 'number' ||
      typeof value.failedScenarios !== 'number' ||
      typeof value.passRate !== 'number' ||
      typeof value.featuresCovered !== 'number' ||
      typeof value.featuresTotal !== 'number' ||
      typeof value.featureCoverageRate !== 'number' ||
      value.mode !== 'syntactic'
    ) {
      return null;
    }
    return value as AutomationExecutionSummary;
  })();
  const generatedTestSnippet = (() => {
    if (!currentJob?.result || typeof currentJob.result !== 'object') return null;
    const artifacts = (currentJob.result as { artifacts?: unknown }).artifacts;
    if (!Array.isArray(artifacts)) return null;
    const testArtifact = artifacts.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const path = (item as { filePath?: unknown }).filePath;
      return typeof path === 'string' && path.endsWith('trace-tests.test.ts');
    });
    if (!testArtifact || typeof testArtifact !== 'object') return null;
    const content = (testArtifact as { content?: unknown }).content;
    if (typeof content !== 'string' || !content.trim()) return null;
    return content.split('\n').slice(0, 30).join('\n');
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ak-text-primary">Trace Console</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                agentStatus === 'active'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-ak-surface-2 text-ak-text-secondary border border-ak-border'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agentStatus === 'active' ? 'bg-blue-400 animate-pulse' : 'bg-ak-text-secondary/40'
                }`}
              />
              {agentStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-ak-text-secondary">
            Generate test plans and coverage from specifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/agents"
            className="text-xs font-medium text-ak-text-secondary hover:text-ak-primary transition-colors"
          >
            All Agents
          </Link>
          <Button variant="secondary" onClick={() => setShowSettingsDrawer(true)}>
            Settings
          </Button>
        </div>
      </header>

      {/* Configuration Bar */}
      <Card className="bg-ak-surface p-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ak-text-primary">Specification</h2>
            <Link to="/docs/agents/trace" className="text-xs font-medium text-ak-primary hover:underline">
              Docs
            </Link>
          </div>

          {/* Spec Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ak-text-primary">
              Test Specification
            </label>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              disabled={!!isRunning}
              rows={5}
              className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50 resize-none"
              placeholder="Paste your test specification, acceptance criteria, or user story here..."
            />
            <p className="text-xs text-ak-text-secondary/60">
              Trace analyses structured text to build coverage matrices and test cases.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-ak-border bg-ak-surface-2 p-3">
            <div>
              <p className="text-sm font-semibold text-ak-text-primary">
                {t('traceConsole.questions.title')}
              </p>
              <p className="text-xs text-ak-text-secondary">
                {t('traceConsole.questions.subtitle')}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {questionGroups.map((question) => (
                <label key={question.key} className="block space-y-1">
                  <span className="text-xs font-medium text-ak-text-primary">{question.label}</span>
                  <select
                    value={tracePreferences[question.key]}
                    onChange={(event) => updatePreference(question.key, event.target.value)}
                    disabled={!!isRunning}
                    className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
                  >
                    {question.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-ak-text-secondary">{question.help}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Run Button Row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-ak-border pt-4">
            {isIdle ? (
              <Button
                onClick={handleRunTrace}
                disabled={!canRun}
                className="justify-center py-3 text-base font-semibold"
              >
                🧪 Run Trace
              </Button>
            ) : isRunning ? (
              <Button
                variant="outline"
                disabled
                className="justify-center border-blue-400/50 text-blue-400"
              >
                ⏳ Analysing...
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                className="justify-center"
              >
                ↺ Reset Console
              </Button>
            )}

            {!canRun && isIdle && (
              <p className="text-xs text-ak-text-secondary">
                Provide a specification to begin analysis
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Status Summary */}
      {!isIdle && currentJob && (
        <Card className="bg-ak-surface-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">
                Status
              </p>
              <p className={`text-lg font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">
                Job ID
              </p>
              <p className="text-xs font-mono text-ak-text-primary">
                {currentJob.id.substring(0, 8)}...
              </p>
            </div>
          </div>
          {automationExecution && (
            <div className="mt-4 space-y-3 rounded-lg border border-ak-border bg-ak-surface p-3 text-xs text-ak-text-secondary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ak-text-primary">{t('traceConsole.summary.title')}</p>
                {automationExecution.targetBaseUrl && (
                  <span className="rounded bg-ak-bg px-2 py-1 text-[11px] text-ak-text-secondary">
                    {automationExecution.targetBaseUrl}
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.featurePassRateLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    %{typeof automationExecution.featurePassRate === 'number' ? automationExecution.featurePassRate : automationExecution.passRate}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.featuresLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {automationExecution.featuresPassed ?? automationExecution.featuresCovered}/{automationExecution.featuresTotal}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.testCasesLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {automationExecution.testCasesPassed ?? 0}/{automationExecution.testCasesTotal ?? 0}
                  </p>
                </div>
                <div className="rounded border border-ak-border bg-ak-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{t('traceConsole.summary.durationLabel')}</p>
                  <p className="text-sm font-semibold text-ak-text-primary">
                    {typeof automationExecution.durationMs === 'number' ? `${Math.max(1, Math.round(automationExecution.durationMs / 1000))}s` : '-'}
                  </p>
                </div>
              </div>
              {(automationExecution.failures?.length ?? 0) > 0 && (
                <div className="rounded border border-red-500/30 bg-red-500/[0.05] p-2">
                  <p className="mb-1 text-[11px] font-semibold text-red-300">{t('traceConsole.summary.failedFeatures')}</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {automationExecution.failures?.map((failure, index) => (
                      <div key={`${failure.test}-${index}`} className="rounded border border-red-500/20 bg-ak-bg px-2 py-1">
                        <p className="text-[11px] text-ak-text-primary">{failure.feature} · {failure.test}</p>
                        <p className="text-[10px] text-red-300/90">{failure.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Logs/Results Workspace */}
      <Card className="flex h-[600px] flex-col overflow-hidden bg-ak-surface p-0">
        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface-2 px-4">
          <div className="flex">
            {(['logs', 'results'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary'
                }`}
              >
                {tab === 'logs' && '📋 Logs'}
                {tab === 'results' && '📊 Results'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-blue-400' : isComplete ? 'bg-green-500' : 'bg-ak-text-secondary/30'}`} />
            <span className="text-xs text-ak-text-secondary">
              {spec.trim() ? `${spec.trim().substring(0, 40)}...` : 'No spec provided'}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'logs' && (
            <div className="h-full overflow-y-auto bg-ak-bg p-4 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                  <span className="text-4xl">🧪</span>
                  <p className="mt-2 text-center">
                    Trace agent activity will appear here.
                  </p>
                  <p className="mt-1 text-xs">
                    Paste a specification above and press "Run Trace"
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                      <span className="flex-shrink-0 text-ak-text-secondary/50">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={getLogLevelColor(log.level)}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="h-full overflow-y-auto bg-ak-bg p-4">
              {results ? (
                <div className="space-y-3">
                  {automationExecution && (
                    <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs text-ak-text-secondary">
                      <p className="mb-2 text-sm font-semibold text-ak-text-primary">{t('traceConsole.summary.automationCoverage')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p>{t('traceConsole.summary.scenarios')}: {automationExecution.passedScenarios}/{automationExecution.executedScenarios}</p>
                        <p>{t('traceConsole.summary.featureCoverage')}: {automationExecution.featuresCovered}/{automationExecution.featuresTotal} (%{automationExecution.featureCoverageRate})</p>
                        <p>{t('traceConsole.summary.mode')}: {automationExecution.mode}</p>
                        {automationExecution.generatedTestPath && <p>{t('traceConsole.summary.generatedTest')}: {automationExecution.generatedTestPath}</p>}
                      </div>
                    </div>
                  )}
                  {generatedTestSnippet && (
                    <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-3">
                      <p className="mb-2 text-sm font-semibold text-ak-text-primary">{t('traceConsole.summary.generatedTestPreview')}</p>
                      <pre className="overflow-x-auto text-xs text-ak-text-secondary">{generatedTestSnippet}</pre>
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap rounded-lg bg-ak-surface-2 p-4 text-sm text-ak-text-primary">
                    {results}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-ak-text-secondary/50">
                  <span className="text-4xl">📊</span>
                  <p className="mt-2">Test plan results will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      <AgentRuntimeSettingsDrawer
        open={showSettingsDrawer}
        agentType="trace"
        onClose={() => setShowSettingsDrawer(false)}
        onSaved={(next) =>
          setRuntimeOverride({
            runtimeProfile: next.runtimeProfile,
            temperatureValue: next.temperatureValue,
            commandLevel: next.commandLevel,
          })
        }
      />
    </div>
  );
};

export default DashboardAgentTracePage;
