/**
 * Smart Automations Page
 * Main page for listing and managing smart automations
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../../components/common/Button';
import {
  smartAutomationsApi,
  type AutomationWithLastRun,
} from '../../../../services/api/smart-automations';
import { cn } from '../../../../utils/cn';
import CreateAutomationModal from './CreateAutomationModal';

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  running: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
  scheduled: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  disabled: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

// Icons
const AutomationIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
  </svg>
);

const PlayIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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

function getAutomationStatus(automation: AutomationWithLastRun): string {
  if (!automation.enabled) return 'disabled';
  if (automation.lastRun?.status === 'running') return 'running';
  if (automation.lastRun?.status === 'failed') return 'failed';
  return 'scheduled';
}

export default function SmartAutomationsPage() {
  const [automations, setAutomations] = useState<AutomationWithLastRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await smartAutomationsApi.list();
      setAutomations(data);
      setError(null);
    } catch (err) {
      setError('Otomasyonlar yüklenemedi');
      console.error('Failed to load automations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  const handleRunNow = async (id: string) => {
    try {
      setRunningIds((prev) => new Set(prev).add(id));
      const result = await smartAutomationsApi.runNow(id);
      if (result.success) {
        // Reload to get updated status
        await loadAutomations();
      } else {
        setError(result.error || 'Çalıştırma başarısız');
      }
    } catch (err) {
      setError('Çalıştırma başarısız');
      console.error('Failed to run automation:', err);
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleEnabled = async (automation: AutomationWithLastRun) => {
    try {
      await smartAutomationsApi.update(automation.id, {
        enabled: !automation.enabled,
      });
      await loadAutomations();
    } catch (err) {
      setError('Güncelleme başarısız');
      console.error('Failed to toggle automation:', err);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadAutomations();
  };

  return (
    <div className="min-h-screen bg-ak-bg">
      {/* Header */}
      <header className="border-b border-ak-border bg-ak-surface-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/agents"
                className="flex items-center gap-2 text-ak-text-secondary hover:text-ak-text transition-colors"
              >
                <ArrowLeftIcon />
                <span>Agents</span>
              </Link>
              <div className="h-6 w-px bg-ak-border" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <AutomationIcon />
                </div>
                <h1 className="text-lg font-semibold text-ak-text">Akıllı Otomasyonlar</h1>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon />
              <span>Yeni Otomasyon</span>
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
          </div>
        ) : automations.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
              <AutomationIcon />
            </div>
            <h2 className="text-xl font-semibold text-ak-text mb-2">Henüz otomasyon yok</h2>
            <p className="text-ak-text-secondary mb-6 max-w-md mx-auto">
              RSS kaynaklarından günlük içerik toplayıp LinkedIn taslağı oluşturan otomasyonlar
              oluşturun.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon />
              <span>İlk Otomasyonu Oluştur</span>
            </Button>
          </div>
        ) : (
          /* Automations List */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => {
              const status = getAutomationStatus(automation);
              const statusColor = STATUS_COLORS[status] || STATUS_COLORS.scheduled;
              const isRunning = runningIds.has(automation.id);

              return (
                <div
                  key={automation.id}
                  className="rounded-xl border border-ak-border bg-ak-surface-1 p-5 hover:border-ak-border-hover transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                        <AutomationIcon />
                      </div>
                      <div>
                        <Link
                          to={`/agents/smart-automations/${automation.id}`}
                          className="font-medium text-ak-text hover:text-ak-primary transition-colors"
                        >
                          {automation.name}
                        </Link>
                        <p className="text-sm text-ak-text-secondary">
                          {automation.topics.slice(0, 3).join(', ')}
                          {automation.topics.length > 3 && ` +${automation.topics.length - 3}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusColor.bg,
                        statusColor.text
                      )}
                    >
                      {status === 'scheduled' && 'Planlandı'}
                      {status === 'running' && 'Çalışıyor'}
                      {status === 'success' && 'Başarılı'}
                      {status === 'failed' && 'Başarısız'}
                      {status === 'disabled' && 'Devre Dışı'}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-2 text-sm text-ak-text-secondary mb-4">
                    <div className="flex justify-between">
                      <span>Sonraki çalışma:</span>
                      <span className="text-ak-text">
                        {automation.enabled ? formatDate(automation.nextRunAt) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Son çalışma:</span>
                      <span className="text-ak-text">{formatDate(automation.lastRunAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kaynak sayısı:</span>
                      <span className="text-ak-text">{automation.sources.length}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-ak-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRunNow(automation.id)}
                      disabled={isRunning || !automation.enabled}
                      className="flex-1"
                    >
                      {isRunning ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <PlayIcon />
                      )}
                      <span>{isRunning ? 'Çalışıyor...' : 'Şimdi Çalıştır'}</span>
                    </Button>
                    <button
                      onClick={() => handleToggleEnabled(automation)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        automation.enabled ? 'bg-ak-primary' : 'bg-ak-border'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          automation.enabled && 'translate-x-5'
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAutomationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
