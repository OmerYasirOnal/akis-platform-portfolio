/**
 * PRMetadataCard - Display PR, Branch, and Commit metadata
 * 
 * Features:
 * - Prominent display of PR link with status
 * - Branch information (source → target)
 * - Commit details with SHA
 * - Copy buttons for all key values
 * - Links to GitHub resources
 */

import { useState, useMemo } from 'react';
import type { JobState } from '../../services/api/types';

// ============================================================================
// Types
// ============================================================================

interface PRInfo {
  url?: string;
  number?: number;
  title?: string;
  state?: 'open' | 'closed' | 'merged' | 'draft';
  html_url?: string;
}

interface CommitInfo {
  sha?: string;
  message?: string;
  url?: string;
}

interface BranchInfo {
  source?: string;
  target?: string;
}

interface RepoInfo {
  owner?: string;
  repo?: string;
}

interface PRMetadataCardProps {
  /** Job result containing PR/commit/branch info */
  result?: unknown;
  /** Job payload containing repo info */
  payload?: unknown;
  /** Whether this was a dry run */
  isDryRun?: boolean;
  /** Job state for showing pending/running status */
  jobState?: JobState;
}

// ============================================================================
// Helpers
// ============================================================================

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-1.5 py-0.5 text-xs rounded bg-ak-surface-3 hover:bg-ak-surface-2 text-ak-text-secondary hover:text-ak-text-primary transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

function extractPRInfo(result: unknown): PRInfo | null {
  if (!result || typeof result !== 'object') return null;
  
  const r = result as Record<string, unknown>;
  
  // Check for pullRequest object
  if (r.pullRequest && typeof r.pullRequest === 'object') {
    const pr = r.pullRequest as Record<string, unknown>;
    return {
      url: (pr.url as string) || (pr.html_url as string),
      number: pr.number as number,
      title: pr.title as string,
      state: pr.state as PRInfo['state'],
      html_url: (pr.html_url as string) || (pr.url as string),
    };
  }

  // Check for prUrl directly
  if (r.prUrl) {
    return { url: r.prUrl as string };
  }

  return null;
}

function extractCommitInfo(result: unknown): CommitInfo | null {
  if (!result || typeof result !== 'object') return null;
  
  const r = result as Record<string, unknown>;
  
  // Check for commit object
  if (r.commit && typeof r.commit === 'object') {
    const c = r.commit as Record<string, unknown>;
    return {
      sha: c.sha as string,
      message: c.message as string,
      url: c.url as string,
    };
  }

  // Check for commits array
  if (r.commits && Array.isArray(r.commits) && r.commits.length > 0) {
    const c = r.commits[0] as Record<string, unknown>;
    return {
      sha: c.sha as string,
      message: c.message as string,
      url: c.url as string,
    };
  }

  return null;
}

function extractBranchInfo(result: unknown, payload: unknown): BranchInfo {
  const r = (result && typeof result === 'object') ? result as Record<string, unknown> : {};
  const p = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {};
  
  return {
    source: (r.branch as string) || (p.featureBranch as string),
    target: (p.baseBranch as string) || 'main',
  };
}

function extractRepoInfo(payload: unknown): RepoInfo {
  if (!payload || typeof payload !== 'object') return {};
  const p = payload as Record<string, unknown>;
  return {
    owner: p.owner as string,
    repo: p.repo as string,
  };
}

function getPRStateStyle(state?: PRInfo['state']): string {
  switch (state) {
    case 'open':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'draft':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'merged':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'closed':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-ak-surface-3 text-ak-text-secondary border-ak-border';
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface InfoRowProps {
  icon: string;
  label: string;
  value?: string | React.ReactNode;
  copyValue?: string;
  link?: string;
}

function InfoRow({ icon, label, value, copyValue, link }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-6 text-center">{icon}</span>
      <span className="text-sm text-ak-text-secondary w-24 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {link ? (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-ak-primary hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-ak-text-primary truncate">{value}</span>
        )}
        {copyValue && <CopyButton text={copyValue} label={label} />}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PRMetadataCard({ result, payload, isDryRun, jobState }: PRMetadataCardProps) {
  const prInfo = useMemo(() => extractPRInfo(result), [result]);
  const commitInfo = useMemo(() => extractCommitInfo(result), [result]);
  const branchInfo = useMemo(() => extractBranchInfo(result, payload), [result, payload]);
  const repoInfo = useMemo(() => extractRepoInfo(payload), [payload]);

  const hasAnyInfo = Boolean(prInfo || commitInfo || branchInfo.source || repoInfo.owner);
  const isPendingOrRunning =
    jobState === 'pending' || jobState === 'running' || jobState === 'awaiting_approval';

  // Always show the card for scribe jobs to provide context
  if (!hasAnyInfo && !isDryRun && !isPendingOrRunning) {
    return null;
  }

  // Build GitHub URLs
  const repoUrl = repoInfo.owner && repoInfo.repo 
    ? `https://github.com/${repoInfo.owner}/${repoInfo.repo}` 
    : null;
  
  const branchUrl = repoUrl && branchInfo.source
    ? `${repoUrl}/tree/${branchInfo.source}`
    : null;

  const compareUrl = repoUrl && branchInfo.source && branchInfo.target
    ? `${repoUrl}/compare/${branchInfo.target}...${branchInfo.source}`
    : null;

  return (
    <div 
      className="bg-ak-surface-2 shadow-ak-elevation-1 rounded-2xl overflow-hidden"
      data-testid="pr-metadata-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ak-border bg-ak-surface-3/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <span className="font-semibold text-ak-text-primary">
            {isDryRun ? 'Preview (Dry Run)' : 'GitHub Integration'}
          </span>
        </div>
        {isDryRun && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            No changes made
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 divide-y divide-ak-border/50">
        {/* Repository Info */}
        {repoInfo.owner && repoInfo.repo && (
          <InfoRow
            icon="📦"
            label="Repository"
            value={`${repoInfo.owner}/${repoInfo.repo}`}
            copyValue={`${repoInfo.owner}/${repoInfo.repo}`}
            link={repoUrl || undefined}
          />
        )}

        {/* Branch Info */}
        {branchInfo.source && (
          <div className="flex items-center gap-3 py-2">
            <span className="w-6 text-center">🌿</span>
            <span className="text-sm text-ak-text-secondary w-24 flex-shrink-0">Branch</span>
            <div className="flex items-center gap-2 text-sm">
              <code className="px-2 py-0.5 bg-ak-surface-3 rounded text-ak-text-primary">
                {branchInfo.source}
              </code>
              <span className="text-ak-text-secondary">→</span>
              <code className="px-2 py-0.5 bg-ak-surface-3 rounded text-ak-text-primary">
                {branchInfo.target}
              </code>
              {branchUrl && (
                <a
                  href={branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ak-primary hover:underline text-xs"
                >
                  View
                </a>
              )}
              {compareUrl && (
                <a
                  href={compareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ak-primary hover:underline text-xs"
                >
                  Compare
                </a>
              )}
            </div>
          </div>
        )}

        {/* PR Info - Prominent Display */}
        {/* PR-2: Fix undefined rendering - only show if we have valid PR data */}
        {prInfo && prInfo.url && (
          <div className="py-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-lg">🔀</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={prInfo.html_url || prInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-ak-primary hover:underline"
                    data-testid="pr-link"
                  >
                    {/* PR-2: Handle all cases - title, number, or fallback to "View Pull Request" */}
                    {prInfo.title 
                      ? prInfo.title 
                      : prInfo.number 
                        ? `Pull Request #${prInfo.number}`
                        : 'View Pull Request'}
                  </a>
                  {/* PR-2: Only show number badge if we have a valid number */}
                  {typeof prInfo.number === 'number' && prInfo.number > 0 && (
                    <span className="text-xs text-ak-text-secondary">#{prInfo.number}</span>
                  )}
                  {prInfo.state && (
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getPRStateStyle(prInfo.state)}`}>
                      {prInfo.state === 'draft' ? 'Draft' : prInfo.state}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-ak-text-secondary truncate max-w-xs">
                    {prInfo.url}
                  </code>
                  <CopyButton text={prInfo.url} label="PR URL" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commit Info */}
        {commitInfo && commitInfo.sha && (
          <InfoRow
            icon="📝"
            label="Commit"
            value={
              <div className="flex items-center gap-2">
                <code className="text-xs bg-ak-surface-3 px-2 py-0.5 rounded">
                  {commitInfo.sha.slice(0, 7)}
                </code>
                {commitInfo.message && (
                  <span className="text-ak-text-secondary truncate max-w-xs">
                    {commitInfo.message}
                  </span>
                )}
              </div>
            }
            copyValue={commitInfo.sha}
            link={commitInfo.url}
          />
        )}

        {/* Dry Run Notice */}
        {isDryRun && !prInfo && (
          <div className="py-3">
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <span className="text-lg">🔬</span>
              <div className="text-sm text-ak-text-secondary">
                <p className="font-medium text-amber-400 mb-1">Dry Run Mode</p>
                <p>No changes were made to GitHub. This preview shows what would be created.</p>
                {branchInfo.source && (
                  <p className="mt-2 text-ak-text-primary">
                    Would create branch <code className="text-xs bg-ak-surface-3 px-1.5 py-0.5 rounded">{branchInfo.source}</code> from <code className="text-xs bg-ak-surface-3 px-1.5 py-0.5 rounded">{branchInfo.target}</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending/Running Job Notice */}
        {isPendingOrRunning && !prInfo && !isDryRun && (
          <div className="py-3">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-lg animate-pulse">⏳</span>
              <div className="text-sm text-ak-text-secondary">
                <p className="font-medium text-blue-400 mb-1">
                  {jobState === 'pending'
                    ? 'Waiting to Start'
                    : jobState === 'awaiting_approval'
                      ? 'Awaiting Approval'
                      : 'In Progress'}
                </p>
                <p>GitHub integration details will appear once the job completes.</p>
                {branchInfo.source && (
                  <p className="mt-2 text-ak-text-primary">
                    Target branch: <code className="text-xs bg-ak-surface-3 px-1.5 py-0.5 rounded">{branchInfo.source}</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No PR Created (failed job without PR) */}
        {jobState === 'failed' && !prInfo && !isDryRun && (
          <div className="py-3">
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-lg">❌</span>
              <div className="text-sm text-ak-text-secondary">
                <p className="font-medium text-red-400 mb-1">Pull Request Not Created</p>
                <p>The job failed before a pull request could be created. Check the error details above.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PRMetadataCard;

