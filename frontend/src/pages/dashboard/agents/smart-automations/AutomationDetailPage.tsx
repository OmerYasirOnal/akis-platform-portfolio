/**
 * Automation Detail Page
 * Shows automation configuration and run history with draft previews
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Button from '../../../../components/common/Button';
import {
  smartAutomationsApi,
  type SmartAutomation,
  type SmartAutomationRun,
  type SmartAutomationItem,
} from '../../../../services/api/smart-automations';
import { cn } from '../../../../utils/cn';

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Bekliyor' },
  running: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Çalışıyor' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Başarılı' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Başarısız' },
};

// Icons
const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const PlayIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AutomationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialRunId = searchParams.get('runId');

  const [automation, setAutomation] = useState<SmartAutomation | null>(null);
  const [runs, setRuns] = useState<SmartAutomationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SmartAutomationRun | null>(null);
  const [runItems, setRunItems] = useState<SmartAutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadAutomation = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await smartAutomationsApi.get(id);
      setAutomation(data.automation);
      setRuns(data.runs);

      // Auto-select run if specified in URL or select first successful run
      const runToSelect = initialRunId
        ? data.runs.find((r) => r.id === initialRunId)
        : data.runs.find((r) => r.status === 'success') || data.runs[0];

      if (runToSelect) {
        setSelectedRun(runToSelect);
        // Load items for selected run
        const runDetail = await smartAutomationsApi.getRunDetail(id, runToSelect.id);
        setRunItems(runDetail.items);
      }

      setError(null);
    } catch (err) {
      setError('Otomasyon yüklenemedi');
      console.error('Failed to load automation:', err);
    } finally {
      setLoading(false);
    }
  }, [id, initialRunId]);

  useEffect(() => {
    loadAutomation();
  }, [loadAutomation]);

  const handleSelectRun = async (run: SmartAutomationRun) => {
    if (!id) return;
    setSelectedRun(run);

    try {
      const runDetail = await smartAutomationsApi.getRunDetail(id, run.id);
      setRunItems(runDetail.items);
    } catch (err) {
      console.error('Failed to load run items:', err);
    }
  };

  const handleRunNow = async () => {
    if (!id) return;

    try {
      setRunningAction(true);
      const result = await smartAutomationsApi.runNow(id);
      if (result.success) {
        await loadAutomation();
      } else {
        setError(result.error || 'Çalıştırma başarısız');
      }
    } catch (err) {
      setError('Çalıştırma başarısız');
      console.error('Failed to run automation:', err);
    } finally {
      setRunningAction(false);
    }
  };

  const handleResendSlack = async () => {
    if (!id || !selectedRun) return;

    try {
      setRunningAction(true);
      const result = await smartAutomationsApi.resendSlack(id, selectedRun.id);
      if (!result.success) {
        setError(result.error || 'Slack gönderimi başarısız');
      }
    } catch (err) {
      setError('Slack gönderimi başarısız');
      console.error('Failed to resend Slack:', err);
    } finally {
      setRunningAction(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!selectedRun?.output) return;

    try {
      await navigator.clipboard.writeText(selectedRun.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ak-bg flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen bg-ak-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-ak-text-secondary mb-4">Otomasyon bulunamadı</p>
          <Link to="/agents/smart-automations" className="text-ak-primary hover:underline">
            Geri dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ak-bg">
      {/* Header */}
      <header className="border-b border-ak-border bg-ak-surface-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/agents/smart-automations"
                className="flex items-center gap-2 text-ak-text-secondary hover:text-ak-text transition-colors"
              >
                <ArrowLeftIcon />
                <span>Otomasyonlar</span>
              </Link>
              <div className="h-6 w-px bg-ak-border" />
              <h1 className="text-lg font-semibold text-ak-text">{automation.name}</h1>
            </div>
            <Button
              onClick={handleRunNow}
              disabled={runningAction || !automation.enabled}
            >
              {runningAction ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <PlayIcon />
              )}
              <span>Şimdi Çalıştır</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Kapat
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Config Summary */}
            <div className="rounded-xl border border-ak-border bg-ak-surface-1 p-5">
              <h2 className="text-sm font-medium text-ak-text-secondary mb-4">Yapılandırma</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-ak-text-secondary">Konular:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {automation.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-ak-surface-2 text-ak-text text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-ak-text-secondary">Kaynak sayısı:</span>
                  <span className="text-ak-text">{automation.sources.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ak-text-secondary">Çalışma saati:</span>
                  <span className="text-ak-text">
                    {automation.scheduleTime} ({automation.timezone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ak-text-secondary">Çıktı dili:</span>
                  <span className="text-ak-text">
                    {automation.outputLanguage === 'tr' ? 'Türkçe' : 'English'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ak-text-secondary">Durum:</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      automation.enabled
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-gray-500/10 text-gray-400'
                    )}
                  >
                    {automation.enabled ? 'Aktif' : 'Devre Dışı'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ak-text-secondary">Sonraki çalışma:</span>
                  <span className="text-ak-text">{formatDate(automation.nextRunAt)}</span>
                </div>
              </div>
            </div>

            {/* Run History */}
            <div className="rounded-xl border border-ak-border bg-ak-surface-1 p-5">
              <h2 className="text-sm font-medium text-ak-text-secondary mb-4">
                Son Çalışmalar ({runs.length})
              </h2>
              {runs.length === 0 ? (
                <p className="text-sm text-ak-text-muted">Henüz çalışma yok</p>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => {
                    const statusInfo = STATUS_COLORS[run.status] || STATUS_COLORS.pending;
                    const isSelected = selectedRun?.id === run.id;

                    return (
                      <button
                        key={run.id}
                        onClick={() => handleSelectRun(run)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg transition-colors',
                          isSelected
                            ? 'bg-ak-primary/10 border border-ak-primary/30'
                            : 'hover:bg-ak-surface-2'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ak-text">
                            {formatDate(run.createdAt)}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs',
                              statusInfo.bg,
                              statusInfo.text
                            )}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        {run.status === 'success' && (
                          <p className="text-xs text-ak-text-secondary mt-1">
                            {run.itemCount} içerik işlendi
                          </p>
                        )}
                        {run.status === 'failed' && run.error && (
                          <p className="text-xs text-red-400 mt-1 truncate">
                            {run.error}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Draft Preview */}
          <div className="lg:col-span-2">
            {selectedRun ? (
              <div className="rounded-xl border border-ak-border bg-ak-surface-1">
                {/* Draft Header */}
                <div className="flex items-center justify-between p-5 border-b border-ak-border">
                  <div>
                    <h2 className="font-medium text-ak-text">Oluşturulan Taslak</h2>
                    <p className="text-sm text-ak-text-secondary">
                      {formatDate(selectedRun.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {automation.deliverySlack && selectedRun.status === 'success' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleResendSlack}
                        disabled={runningAction}
                      >
                        <RefreshIcon />
                        <span>Slack'e Gönder</span>
                      </Button>
                    )}
                    {selectedRun.output && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCopyDraft}
                        >
                          <ClipboardIcon />
                          <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
                        </Button>
                        <a
                          href="https://www.linkedin.com/feed/?shareActive=true"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm">
                            <ExternalLinkIcon />
                            <span>LinkedIn'de Paylaş</span>
                          </Button>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Draft Content */}
                <div className="p-5">
                  {selectedRun.status === 'failed' ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">Çalışma başarısız oldu</p>
                      <p className="text-sm text-ak-text-secondary">{selectedRun.error}</p>
                    </div>
                  ) : selectedRun.status === 'running' || selectedRun.status === 'pending' ? (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
                      <p className="text-ak-text-secondary">Çalışıyor...</p>
                    </div>
                  ) : selectedRun.output ? (
                    <>
                      {/* Summary */}
                      {selectedRun.summary && (
                        <div className="mb-4 p-3 rounded-lg bg-ak-surface-2">
                          <p className="text-sm text-ak-text-secondary">
                            <strong>Özet:</strong> {selectedRun.summary}
                          </p>
                        </div>
                      )}

                      {/* Draft Text */}
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-ak-text font-sans bg-transparent p-0">
                          {selectedRun.output}
                        </pre>
                      </div>

                      {/* Sources */}
                      {runItems.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-ak-border">
                          <h3 className="text-sm font-medium text-ak-text-secondary mb-3">
                            Kaynaklar ({runItems.length})
                          </h3>
                          <div className="space-y-2">
                            {runItems.map((item) => (
                              <a
                                key={item.id}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 rounded-lg bg-ak-surface-2 hover:bg-ak-surface-3 transition-colors"
                              >
                                <p className="text-sm text-ak-text line-clamp-1">
                                  {item.title}
                                </p>
                                <p className="text-xs text-ak-text-secondary mt-1">
                                  {item.source} • {formatDate(item.publishedAt)}
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-ak-text-secondary">Taslak bulunamadı</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-ak-border bg-ak-surface-1 p-5">
                <div className="text-center py-12">
                  <p className="text-ak-text-secondary">
                    Sol taraftan bir çalışma seçin veya yeni bir çalışma başlatın
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
