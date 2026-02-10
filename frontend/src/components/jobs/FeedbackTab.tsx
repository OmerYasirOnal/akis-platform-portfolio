/**
 * FeedbackTab - PR-2: Feedback Loop UI
 * 
 * Features:
 * - Display job comments
 * - Add new comment form
 * - Request revision button with modal
 * - Show revision chain (parent/children)
 */

import { useState, useEffect, useCallback } from 'react';
import type { Job, JobComment, RevisionInfo, JobState } from '../../services/api/types';
import { getApiBaseUrl } from '../../services/api/config';

// ============================================================================
// Props
// ============================================================================

interface FeedbackTabProps {
  job: Job;
  onRevisionCreated?: (newJobId: string) => void;
}

// ============================================================================
// API Helpers
// ============================================================================

// Get API base at runtime to ensure window is available
// Paths already include /api prefix, so base is origin only
function getApiBase(): string {
  return `${getApiBaseUrl()}/api`;
}

async function fetchComments(jobId: string): Promise<JobComment[]> {
  const res = await fetch(`${getApiBase()}/agents/jobs/${jobId}/comments`, {
    credentials: 'include',
  });
  if (!res.ok) {
    // Return empty array for 404 (no comments yet)
    if (res.status === 404) return [];
    throw new Error('Failed to fetch comments');
  }
  const data = await res.json();
  return (data.comments || []).map((c: { commentText?: string; text?: string; [key: string]: unknown }) => ({
    ...c,
    text: c.commentText || c.text || '',
  }));
}

async function fetchRevisions(jobId: string): Promise<RevisionInfo> {
  const res = await fetch(`${getApiBase()}/agents/jobs/${jobId}/revisions`, {
    credentials: 'include',
  });
  if (!res.ok) {
    // Return default for 404 (no revisions yet)
    if (res.status === 404) {
      return { parentJob: null, revisions: [], isRevision: false, revisionNote: undefined };
    }
    throw new Error('Failed to fetch revisions');
  }
  return res.json();
}

async function addComment(jobId: string, text: string): Promise<JobComment> {
  const res = await fetch(`${getApiBase()}/agents/jobs/${jobId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to add comment');
  }
  const data = await res.json();
  return data.comment;
}

async function requestRevision(
  jobId: string, 
  instruction: string, 
  mode: 'edit' | 'regenerate' = 'edit'
): Promise<string> {
  const res = await fetch(`${getApiBase()}/agents/jobs/${jobId}/revise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ instruction, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to request revision');
  }
  const data = await res.json();
  return data.newJobId;
}

// ============================================================================
// Subcomponents
// ============================================================================

function CommentCard({ comment }: { comment: JobComment }) {
  return (
    <div className="p-3 bg-ak-surface-2 rounded-lg border border-ak-border">
      <p className="text-sm text-ak-text-primary whitespace-pre-wrap">{comment.text}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-ak-text-secondary">
        <span>💬</span>
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

function RevisionChainCard({ 
  revisionInfo, 
  currentJobId 
}: { 
  revisionInfo: RevisionInfo; 
  currentJobId: string;
}) {
  const getStateColor = (state: JobState) => {
    switch (state) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'awaiting_approval': return 'text-purple-400';
      default: return 'text-ak-text-secondary';
    }
  };

  if (!revisionInfo.isRevision && revisionInfo.revisions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-ak-surface-2 rounded-lg border border-ak-border">
      <h4 className="text-sm font-medium text-ak-text-primary mb-3 flex items-center gap-2">
        🔄 Revision Chain
      </h4>
      
      {revisionInfo.parentJob && (
        <div className="mb-3 pb-3 border-b border-ak-border">
          <div className="text-xs text-ak-text-secondary mb-1">Parent Job</div>
          <a 
            href={`/dashboard/jobs/${revisionInfo.parentJob.id}`}
            className="text-sm text-ak-primary hover:underline flex items-center gap-2"
          >
            <span className={getStateColor(revisionInfo.parentJob.state)}>●</span>
            {revisionInfo.parentJob.id.slice(0, 8)}...
          </a>
        </div>
      )}

      {revisionInfo.revisions.length > 0 && (
        <div>
          <div className="text-xs text-ak-text-secondary mb-2">
            Revisions ({revisionInfo.revisions.length})
          </div>
          <div className="space-y-2">
            {revisionInfo.revisions.map(rev => (
              <a
                key={rev.id}
                href={`/dashboard/jobs/${rev.id}`}
                className={`block p-2 rounded-lg border transition-colors ${
                  rev.id === currentJobId 
                    ? 'border-ak-primary bg-ak-primary/10' 
                    : 'border-ak-border hover:border-ak-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className={getStateColor(rev.state)}>●</span>
                  <span className="text-ak-text-primary">{rev.id.slice(0, 8)}...</span>
                  <span className="text-xs text-ak-text-secondary">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rev.revisionNote && (
                  <p className="text-xs text-ak-text-secondary mt-1 truncate">
                    "{rev.revisionNote}"
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevisionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instruction: string, mode: 'edit' | 'regenerate') => void;
  isSubmitting: boolean;
}) {
  const [instruction, setInstruction] = useState('');
  const [mode, setMode] = useState<'edit' | 'regenerate'>('edit');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-ak-surface-1 rounded-xl border border-ak-border p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-lg font-semibold text-ak-text-primary mb-4 flex items-center gap-2">
          ✏️ Request Revision
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-ak-text-secondary mb-2">
              What should be changed?
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 bg-ak-surface-2 border border-ak-border rounded-lg 
                       text-ak-text-primary placeholder:text-ak-text-secondary/50
                       focus:outline-none focus:ring-2 focus:ring-ak-primary/50 resize-none"
              placeholder="Describe what you want to revise..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm text-ak-text-secondary mb-2">
              Revision Mode
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 p-3 rounded-lg border text-sm transition-colors ${
                  mode === 'edit'
                    ? 'border-ak-primary bg-ak-primary/10 text-ak-primary'
                    : 'border-ak-border text-ak-text-secondary hover:border-ak-primary/50'
                }`}
                onClick={() => setMode('edit')}
              >
                <div className="font-medium">✂️ Edit</div>
                <div className="text-xs mt-1 opacity-75">Modify existing outputs</div>
              </button>
              <button
                type="button"
                className={`flex-1 p-3 rounded-lg border text-sm transition-colors ${
                  mode === 'regenerate'
                    ? 'border-ak-primary bg-ak-primary/10 text-ak-primary'
                    : 'border-ak-border text-ak-text-secondary hover:border-ak-primary/50'
                }`}
                onClick={() => setMode('regenerate')}
              >
                <div className="font-medium">🔄 Regenerate</div>
                <div className="text-xs mt-1 opacity-75">Create from scratch</div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg border border-ak-border 
                     text-ak-text-secondary hover:bg-ak-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(instruction, mode)}
            disabled={isSubmitting || !instruction.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-ak-primary text-white 
                     hover:bg-ak-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Request Revision'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FeedbackTab({ job, onRevisionCreated }: FeedbackTabProps) {
  const [comments, setComments] = useState<JobComment[]>([]);
  const [revisionInfo, setRevisionInfo] = useState<RevisionInfo | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [commentsData, revisionsData] = await Promise.all([
        fetchComments(job.id),
        fetchRevisions(job.id),
      ]);
      setComments(commentsData);
      setRevisionInfo(revisionsData);
    } catch {
      // Non-critical - may fail if job is new
    }
  }, [job.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsAddingComment(true);
    setError(null);
    
    try {
      const comment = await addComment(job.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleRevision = async (instruction: string, mode: 'edit' | 'regenerate') => {
    setIsSubmittingRevision(true);
    setError(null);
    
    try {
      const newJobId = await requestRevision(job.id, instruction, mode);
      setIsModalOpen(false);
      onRevisionCreated?.(newJobId);
      // Navigate to new job
      window.location.href = `/dashboard/jobs/${newJobId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
      setIsSubmittingRevision(false);
    }
  };

  const canRevise = job.state === 'completed' || job.state === 'failed';

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Revision note if this is a revision */}
      {job.revisionNote && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-xs text-purple-400 mb-1">Revision Request</div>
          <p className="text-sm text-ak-text-primary">{job.revisionNote}</p>
        </div>
      )}

      {/* Revision chain */}
      {revisionInfo && (
        <RevisionChainCard revisionInfo={revisionInfo} currentJobId={job.id} />
      )}

      {/* Request Revision button */}
      {canRevise && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-ak-primary text-white rounded-lg 
                     hover:bg-ak-primary/90 transition-colors flex items-center gap-2"
          >
            ✏️ Request Revision
          </button>
        </div>
      )}

      {/* Comments section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-ak-text-primary flex items-center gap-2">
          💬 Comments ({comments.length})
        </h4>

        {comments.length === 0 ? (
          <div className="p-4 bg-ak-surface-2 rounded-lg border border-ak-border text-center">
            <p className="text-sm text-ak-text-secondary">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        )}

        {/* Add comment form */}
        <div className="pt-4 border-t border-ak-border">
          <textarea
            className="w-full h-24 px-3 py-2 bg-ak-surface-2 border border-ak-border rounded-lg 
                     text-ak-text-primary placeholder:text-ak-text-secondary/50
                     focus:outline-none focus:ring-2 focus:ring-ak-primary/50 resize-none"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isAddingComment}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
              className="px-4 py-2 bg-ak-surface-3 text-ak-text-primary rounded-lg 
                       hover:bg-ak-surface-2 transition-colors disabled:opacity-50
                       flex items-center gap-2"
            >
              {isAddingComment ? 'Adding...' : '💬 Add Comment'}
            </button>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      <RevisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRevision}
        isSubmitting={isSubmittingRevision}
      />
    </div>
  );
}

export default FeedbackTab;

