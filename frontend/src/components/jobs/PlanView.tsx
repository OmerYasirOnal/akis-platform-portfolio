/**
 * PlanView - Displays the contract-first plan for a job
 * PR-1: SCRIBE PR Factory v1 - Plan artifact viewer
 */

import { useState } from 'react';
import type { JobPlan } from '../../services/api/types';

export interface PlanJson {
  version: string;
  generatedAt: string;
  agentType: string;
  jobId: string;
  requiresApproval: boolean;
  dryRun: boolean;
  sections: {
    objective: string;
    scope: string;
    constraints: string[];
    plan: Array<{
      id: string;
      title: string;
      description: string;
      estimatedRisk: 'low' | 'medium' | 'high';
    }>;
    validationStrategy: string[];
    rollbackPlan: string;
    docsToUpdate: string[];
    aiDisclosure: string;
    evidenceChecklist: Array<{
      name: string;
      status: 'pending' | 'passed' | 'failed' | 'skipped';
      notes?: string;
    }>;
  };
  metadata?: Record<string, unknown>;
}

export interface PlanViewProps {
  plan?: JobPlan | null;
  jobState?: string;
  requiresApproval?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

const riskColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/20',
  high: 'text-red-400 bg-red-500/20',
};

const statusIcons: Record<string, string> = {
  pending: '⏳',
  passed: '✅',
  failed: '❌',
  skipped: '⏭️',
};

export function PlanView({
  plan,
  jobState,
  requiresApproval,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: PlanViewProps) {
  const [activeView, setActiveView] = useState<'markdown' | 'json'>('markdown');

  // Empty state
  if (!plan) {
    return (
      <div className="text-center py-12 text-ak-text-secondary" data-testid="plan-empty">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-ak-text-primary mb-2">No Plan Available</h3>
        <p className="text-sm max-w-md mx-auto">
          This job does not have a contract-first plan. Plans are generated for jobs that require
          approval or use the SCRIBE PR Factory workflow.
        </p>
      </div>
    );
  }

  const planJson = plan.planJson;
  const planMarkdown: string | null | undefined = plan.planMarkdown;

  // Show approval controls if job is awaiting approval
  const showApprovalControls = jobState === 'awaiting_approval' && requiresApproval === true;

  // Type guards for planJson
  const isPlanJson = (val: unknown): val is PlanJson => {
    return val !== null && typeof val === 'object' && 'version' in (val as object) && 'sections' in (val as object);
  };

  const typedPlanJson = isPlanJson(planJson) ? planJson : null;

  return (
    <div className="space-y-6" data-testid="plan-view">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-ak-text-primary">Execution Plan</h3>
          {typedPlanJson?.requiresApproval && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-400">
              Approval Required
            </span>
          )}
          {typedPlanJson?.dryRun && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
              Dry Run
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-ak-surface-2 rounded-lg p-1" role="tablist" aria-label="Plan view format">
          <button
            role="tab"
            aria-selected={activeView === 'markdown'}
            onClick={() => setActiveView('markdown')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeView === 'markdown'
                ? 'bg-ak-primary text-white'
                : 'text-ak-text-secondary hover:text-ak-text-primary'
            }`}
          >
            Markdown
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'json'}
            onClick={() => setActiveView('json')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeView === 'json'
                ? 'bg-ak-primary text-white'
                : 'text-ak-text-secondary hover:text-ak-text-primary'
            }`}
            disabled={!typedPlanJson}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Approval controls */}
      {showApprovalControls && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg" data-testid="approval-controls">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-amber-400">Awaiting Approval</h4>
              <p className="text-sm text-ak-text-secondary mt-1">
                Review the plan below and approve or reject the execution.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onReject}
                disabled={isRejecting || isApproving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? 'Approving...' : 'Approve & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown view */}
      {activeView === 'markdown' && typeof planMarkdown === 'string' && (
        <div
          className="prose prose-invert prose-sm max-w-none bg-ak-surface-2 rounded-lg p-6 overflow-auto"
          data-testid="plan-markdown"
        >
          <div className="whitespace-pre-wrap font-mono text-sm text-ak-text-primary">
            {planMarkdown}
          </div>
        </div>
      )}

      {activeView === 'json' && typedPlanJson && (
        <div className="space-y-6" data-testid="plan-json">
          {/* Objective & Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
                Objective
              </h4>
              <p className="text-sm text-ak-text-primary">{typedPlanJson.sections.objective}</p>
            </div>
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
                Scope
              </h4>
              <p className="text-sm text-ak-text-primary">{typedPlanJson.sections.scope}</p>
            </div>
          </div>

          {/* Constraints */}
          {typedPlanJson.sections.constraints.length > 0 && (
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
                Constraints
              </h4>
              <ul className="space-y-1">
                {typedPlanJson.sections.constraints.map((constraint, i) => (
                  <li key={i} className="text-sm text-ak-text-primary flex items-start gap-2">
                    <span className="text-ak-text-secondary">•</span>
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Execution Steps */}
          <div className="bg-ak-surface-2 rounded-lg p-4">
            <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-3">
              Execution Steps
            </h4>
            <div className="space-y-3">
              {typedPlanJson.sections.plan.map((step, i) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-3 bg-ak-surface rounded-lg border border-ak-border"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ak-primary/20 text-ak-primary text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-ak-text-primary">{step.title}</h5>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${riskColors[step.estimatedRisk]}`}
                      >
                        {step.estimatedRisk}
                      </span>
                    </div>
                    <p className="text-sm text-ak-text-secondary mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Strategy */}
          {typedPlanJson.sections.validationStrategy.length > 0 && (
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
                Validation Strategy
              </h4>
              <ol className="space-y-1 list-decimal list-inside">
                {typedPlanJson.sections.validationStrategy.map((strategy, i) => (
                  <li key={i} className="text-sm text-ak-text-primary">
                    {strategy}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rollback Plan */}
          <div className="bg-ak-surface-2 rounded-lg p-4">
            <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
              Rollback Plan
            </h4>
            <p className="text-sm text-ak-text-primary">{typedPlanJson.sections.rollbackPlan}</p>
          </div>

          {/* Evidence Checklist */}
          {typedPlanJson.sections.evidenceChecklist.length > 0 && (
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-3">
                Evidence Checklist
              </h4>
              <div className="space-y-2">
                {typedPlanJson.sections.evidenceChecklist.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-ak-surface rounded border border-ak-border"
                  >
                    <div className="flex items-center gap-2">
                      <span>{statusIcons[item.status]}</span>
                      <span className="text-sm text-ak-text-primary">{item.name}</span>
                    </div>
                    <span className="text-xs text-ak-text-secondary capitalize">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Disclosure */}
          <div className="bg-ak-surface-2 rounded-lg p-4 border-l-4 border-ak-primary">
            <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
              AI Disclosure
            </h4>
            <p className="text-sm text-ak-text-primary italic">{typedPlanJson.sections.aiDisclosure}</p>
          </div>

          {/* Metadata */}
          {typedPlanJson.metadata && Object.keys(typedPlanJson.metadata).length > 0 && (
            <div className="bg-ak-surface-2 rounded-lg p-4">
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
                Metadata
              </h4>
              <pre className="text-xs text-ak-text-secondary overflow-auto">
                {String(JSON.stringify(typedPlanJson.metadata, null, 2))}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Legacy plan (steps + rationale) fallback */}
      {!planMarkdown && !planJson && plan.steps && (
        <div className="bg-ak-surface-2 rounded-lg p-4" data-testid="plan-legacy">
          <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">
            Plan Steps (Legacy)
          </h4>
          <pre className="text-sm text-ak-text-primary whitespace-pre-wrap">
            {String(JSON.stringify(plan.steps, null, 2))}
          </pre>
          {plan.rationale && (
            <>
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mt-4 mb-2">
                Rationale
              </h4>
              <p className="text-sm text-ak-text-primary">{String(plan.rationale)}</p>
            </>
          )}
        </div>
      )}

      {/* Plan metadata footer */}
      <div className="flex items-center justify-between text-xs text-ak-text-secondary pt-4 border-t border-ak-border">
        <span>
          Created: {new Date(plan.createdAt).toLocaleString()}
          {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
            <> | Updated: {new Date(plan.updatedAt).toLocaleString()}</>
          )}
        </span>
        {typedPlanJson && (
          <span>
            Agent: {typedPlanJson.agentType} | Version: {typedPlanJson.version}
          </span>
        )}
      </div>
    </div>
  );
}

