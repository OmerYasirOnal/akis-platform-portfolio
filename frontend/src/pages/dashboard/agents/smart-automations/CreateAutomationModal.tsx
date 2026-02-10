/**
 * Create Automation Modal
 * Form for creating a new smart automation
 */

import { useState, useCallback } from 'react';
import Button from '../../../../components/common/Button';
import {
  smartAutomationsApi,
  type CreateAutomationRequest,
  type AutomationSource,
} from '../../../../services/api/smart-automations';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'Istanbul (GMT+3)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
];

// Icons
const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export default function CreateAutomationModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [sources, setSources] = useState<AutomationSource[]>([{ url: '', type: 'rss' }]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  const [outputLanguage, setOutputLanguage] = useState<'tr' | 'en'>('tr');
  const [deliveryInApp, setDeliveryInApp] = useState(true);
  const [deliverySlack, setDeliverySlack] = useState(false);
  const [slackChannel, setSlackChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSource = useCallback(() => {
    setSources((prev) => [...prev, { url: '', type: 'rss' }]);
  }, []);

  const handleRemoveSource = useCallback((index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSourceChange = useCallback((index: number, url: string) => {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, url } : s))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse topics
    const topics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (topics.length === 0) {
      setError('En az bir konu/anahtar kelime gerekli');
      return;
    }

    // Validate sources
    const validSources = sources.filter((s) => s.url.trim());
    if (validSources.length === 0) {
      setError('En az bir RSS kaynağı gerekli');
      return;
    }

    // Validate URLs
    for (const source of validSources) {
      try {
        new URL(source.url);
      } catch {
        setError(`Geçersiz URL: ${source.url}`);
        return;
      }
    }

    const data: CreateAutomationRequest = {
      name: name.trim(),
      topics,
      sources: validSources,
      scheduleTime,
      timezone,
      outputLanguage,
      deliveryInApp,
      deliverySlack,
      slackChannel: deliverySlack ? slackChannel.trim() || undefined : undefined,
    };

    try {
      setLoading(true);
      await smartAutomationsApi.create(data);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(`Otomasyon oluşturulamadı: ${message}`);
      console.error('Failed to create automation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-ak-surface-1 border border-ak-border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-ak-border bg-ak-surface-1">
          <h2 className="text-lg font-semibold text-ak-text">Yeni Otomasyon Oluştur</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ak-text-secondary hover:text-ak-text hover:bg-ak-surface-2 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-ak-text mb-1.5">
              Otomasyon Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Günlük AI Haberleri"
              required
              className="w-full px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text placeholder-ak-text-muted focus:outline-none focus:border-ak-primary"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-ak-text mb-1.5">
              Konular / Anahtar Kelimeler
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="yapay zeka, machine learning, LLM (virgülle ayırın)"
              className="w-full px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text placeholder-ak-text-muted focus:outline-none focus:border-ak-primary"
            />
            <p className="mt-1 text-xs text-ak-text-secondary">
              Virgülle ayırarak birden fazla konu ekleyebilirsiniz
            </p>
          </div>

          {/* RSS Sources */}
          <div>
            <label className="block text-sm font-medium text-ak-text mb-1.5">
              RSS Kaynakları
            </label>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={source.url}
                    onChange={(e) => handleSourceChange(index, e.target.value)}
                    placeholder="https://example.com/rss"
                    className="flex-1 px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text placeholder-ak-text-muted focus:outline-none focus:border-ak-primary"
                  />
                  {sources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSource}
              className="mt-2 flex items-center gap-1 text-sm text-ak-primary hover:text-ak-primary-hover transition-colors"
            >
              <PlusIcon />
              <span>Kaynak Ekle</span>
            </button>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ak-text mb-1.5">
                Çalışma Saati
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text focus:outline-none focus:border-ak-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ak-text mb-1.5">
                Saat Dilimi
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text focus:outline-none focus:border-ak-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Output Language */}
          <div>
            <label className="block text-sm font-medium text-ak-text mb-1.5">
              Çıktı Dili
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="tr"
                  checked={outputLanguage === 'tr'}
                  onChange={() => setOutputLanguage('tr')}
                  className="h-4 w-4 text-ak-primary"
                />
                <span className="text-ak-text">Türkçe</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={outputLanguage === 'en'}
                  onChange={() => setOutputLanguage('en')}
                  className="h-4 w-4 text-ak-primary"
                />
                <span className="text-ak-text">English</span>
              </label>
            </div>
          </div>

          {/* Delivery Options */}
          <div>
            <label className="block text-sm font-medium text-ak-text mb-2">
              Bildirim Kanalları
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryInApp}
                  onChange={(e) => setDeliveryInApp(e.target.checked)}
                  className="h-4 w-4 rounded text-ak-primary"
                />
                <span className="text-ak-text">Uygulama içi bildirim</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliverySlack}
                  onChange={(e) => setDeliverySlack(e.target.checked)}
                  className="h-4 w-4 rounded text-ak-primary"
                />
                <span className="text-ak-text">Slack bildirimi</span>
              </label>
              {deliverySlack && (
                <div className="pl-7">
                  <input
                    type="text"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    placeholder="Kanal ID veya #kanal-adı"
                    className="w-full px-3 py-2 rounded-lg border border-ak-border bg-ak-surface-2 text-ak-text placeholder-ak-text-muted focus:outline-none focus:border-ak-primary text-sm"
                  />
                  <p className="mt-1 text-xs text-ak-text-secondary">
                    Boş bırakılırsa varsayılan kanal kullanılır
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ak-border">
            <Button type="button" variant="secondary" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              <span>{loading ? 'Oluşturuluyor...' : 'Oluştur'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
