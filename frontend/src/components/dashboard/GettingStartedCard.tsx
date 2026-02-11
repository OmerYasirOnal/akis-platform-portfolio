/**
 * Getting Started Card (S0.5.2-UX-3 + S0.5.1-WL-2)
 *
 * Guides new users through a 3-step onboarding checklist:
 *  1. Configure AI provider keys
 *  2. Run their first agent
 *  3. Explore results
 *
 * The card is dismissible (persisted to localStorage).
 * Step 1 completion is determined by the AI keys status API.
 * Steps 2–3 are wired to the job list endpoint (hasRanJob).
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import { aiKeysApi } from '../../services/api/ai-keys';
import { agentsApi } from '../../services/api/agents';
import { useI18n } from '../../i18n/useI18n';

/* ---------- constants ---------- */
const STORAGE_KEY = 'akis-getting-started-dismissed';

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  done: boolean;
}

/* ---------- icons ---------- */
const CheckIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ---------- component ---------- */
export function GettingStartedCard() {
  const { t } = useI18n();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [aiKeysConfigured, setAiKeysConfigured] = useState(false);
  const [hasRanJob, setHasRanJob] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const [status, jobList] = await Promise.allSettled([
        aiKeysApi.getStatus(),
        agentsApi.listJobs({ limit: 1 }),
      ]);

      if (status.status === 'fulfilled') {
        const hasKey =
          status.value.providers.openai.configured ||
          status.value.providers.openrouter.configured;
        setAiKeysConfigured(hasKey);
      }

      if (jobList.status === 'fulfilled') {
        setHasRanJob(jobList.value.items.length > 0);
      }
    } catch {
      // API not available — assume unconfigured
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!dismissed) {
      void fetchOnboardingStatus();
    }
  }, [dismissed, fetchOnboardingStatus]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // storage full or unavailable — ignore
    }
  };

  if (dismissed || loading) return null;

  const steps: Step[] = [
    {
      id: 'ai-keys',
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.description'),
      href: '/dashboard/settings/ai-keys',
      linkLabel: t('onboarding.step1.link'),
      done: aiKeysConfigured,
    },
    {
      id: 'first-run',
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.description'),
      href: '/agents',
      linkLabel: t('onboarding.step2.link'),
      done: hasRanJob,
    },
    {
      id: 'explore',
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.description'),
      href: '/dashboard/jobs',
      linkLabel: t('onboarding.step3.link'),
      done: hasRanJob,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Card noHoverLift className="relative bg-gradient-to-br from-ak-primary/5 via-ak-surface-2 to-ak-surface-2 p-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss getting started"
        className="absolute right-4 top-4 rounded-full p-1 text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary transition-colors"
      >
        <CloseIcon />
      </button>

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ak-text-primary">{t('onboarding.title')}</h2>
        <p className="mt-1 text-sm text-ak-text-secondary">
          {t('onboarding.subtitle')}
        </p>
        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-ak-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-ak-primary transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-ak-text-secondary">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
              step.done
                ? 'border-ak-primary/20 bg-ak-primary/5'
                : 'border-ak-border bg-ak-surface'
            }`}
          >
            {/* Step indicator */}
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? 'bg-ak-primary text-[#111418]'
                  : 'border-2 border-ak-border bg-ak-surface-2 text-ak-text-secondary'
              }`}
            >
              {step.done ? <CheckIcon /> : idx + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? 'text-ak-primary' : 'text-ak-text-primary'
                }`}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-ak-text-secondary">{step.description}</p>
              {!step.done && (
                <Link
                  to={step.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ak-primary hover:underline"
                >
                  {step.linkLabel}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
