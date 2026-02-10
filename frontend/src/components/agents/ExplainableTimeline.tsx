/**
 * ExplainableTimeline - S1.1 Explainability UI
 * Displays a step-by-step timeline of agent actions with:
 * - Asked: What did we ask the tool/service?
 * - Did: What action was taken?
 * - Why: Reasoning behind the action (user-facing summary)
 * - Output: Result of the action
 */

import { useState } from 'react';
import type { JobTraceEvent, JobArtifact } from '../../services/api/types';

// ============================================================================
// Types
// ============================================================================

interface ExplainableTimelineProps {
  traces: JobTraceEvent[];
  artifacts?: JobArtifact[];
}

interface TimelineCardProps {
  event: JobTraceEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for event type
 */
function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    // Core events
    'step_start': '▶️',
    'step_complete': '✅',
    'step_failed': '❌',
    // Document/file events
    'doc_read': '📄',
    'file_created': '📝',
    'file_modified': '✏️',
    // Integration events
    'mcp_connect': '🔌',
    'mcp_call': '⚡',
    'ai_call': '🤖',
    'ai_parse_error': '⚠️',
    // Explainability events
    'tool_call': '🔧',
    'tool_result': '📤',
    'decision': '🧠',
    'plan_step': '📋',
    'reasoning': '💭',
    // General
    'error': '❌',
    'info': 'ℹ️',
  };
  return icons[eventType] || '•';
}

/**
 * Get status color class
 */
function getStatusColor(status?: string): string {
  const colors: Record<string, string> = {
    'success': 'text-emerald-400',
    'failed': 'text-red-400',
    'warning': 'text-amber-400',
    'info': 'text-ak-text-secondary',
  };
  return colors[status || 'info'] || 'text-ak-text-secondary';
}

/**
 * Get background color for status
 */
function getStatusBg(status?: string): string {
  const colors: Record<string, string> = {
    'success': 'bg-emerald-500/10 border-emerald-500/30',
    'failed': 'bg-red-500/10 border-red-500/30',
    'warning': 'bg-amber-500/10 border-amber-500/30',
    'info': 'bg-ak-surface-2 border-ak-border',
  };
  return colors[status || 'info'] || 'bg-ak-surface-2 border-ak-border';
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Check if event is an explainability event (has Asked/Did/Why)
 */
function isExplainableEvent(event: JobTraceEvent): boolean {
  return Boolean(event.askedWhat || event.didWhat || event.whyReason || event.reasoningSummary);
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Expandable section for Asked/Did/Why/Output
 */
function ExplainabilitySection({ 
  label, 
  content, 
  variant = 'default' 
}: { 
  label: string; 
  content?: string; 
  variant?: 'default' | 'code' | 'reason';
}) {
  if (!content) return null;
  
  const bgClass = variant === 'reason' 
    ? 'bg-purple-500/10 border-purple-500/20' 
    : variant === 'code'
    ? 'bg-ak-surface-3'
    : 'bg-ak-surface-2';
    
  return (
    <div className="mt-2">
      <div className="text-xs text-ak-text-secondary font-medium mb-1">{label}</div>
      <div className={`text-sm p-3 rounded-lg border ${bgClass}`}>
        {variant === 'code' ? (
          <pre className="font-mono text-xs whitespace-pre-wrap overflow-x-auto">{content}</pre>
        ) : (
          <p className="text-ak-text-primary">{content}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Timeline card for a single event
 */
function TimelineCard({ event, isExpanded, onToggle }: TimelineCardProps) {
  const hasDetails = isExplainableEvent(event) || event.detail;
  const hasExplainability = isExplainableEvent(event);
  
  return (
    <div className={`relative pl-8 pb-4 ${getStatusBg(event.status)} rounded-lg border p-4 mb-3`}>
      {/* Timeline dot */}
      <div className="absolute left-2 top-4 w-6 h-6 rounded-full bg-ak-surface flex items-center justify-center text-sm border border-ak-border">
        {getEventIcon(event.eventType)}
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${getStatusColor(event.status)}`}>
              {event.title}
            </span>
            {event.toolName && (
              <span className="text-xs px-2 py-0.5 bg-ak-surface-3 rounded-full text-ak-text-secondary font-mono">
                {event.toolName}
              </span>
            )}
            {event.durationMs && (
              <span className="text-xs text-ak-text-secondary">
                {formatDuration(event.durationMs)}
              </span>
            )}
          </div>
          <div className="text-xs text-ak-text-secondary mt-1">
            {new Date(event.timestamp).toLocaleTimeString()}
            {event.stepId && ` • Step: ${event.stepId}`}
            {event.correlationId && (
              <span className="font-mono ml-2">[{event.correlationId.slice(0, 8)}...]</span>
            )}
          </div>
        </div>
        
        {hasDetails && (
          <button
            onClick={onToggle}
            className="text-xs text-ak-primary hover:text-ak-primary/80 transition-colors px-2 py-1 rounded hover:bg-ak-surface-3"
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand'}
          </button>
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {/* Reasoning Summary - always show first if present */}
          {event.reasoningSummary && (
            <ExplainabilitySection 
              label="🧠 Reasoning" 
              content={event.reasoningSummary} 
              variant="reason"
            />
          )}
          
          {/* Asked/Did/Why sections */}
          {hasExplainability && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              {event.askedWhat && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-medium mb-1">❓ Asked</div>
                  <p className="text-sm text-ak-text-primary">{event.askedWhat}</p>
                </div>
              )}
              {event.didWhat && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-xs text-emerald-400 font-medium mb-1">✓ Did</div>
                  <p className="text-sm text-ak-text-primary">{event.didWhat}</p>
                </div>
              )}
              {event.whyReason && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-xs text-purple-400 font-medium mb-1">💭 Why</div>
                  <p className="text-sm text-ak-text-primary">{event.whyReason}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Input/Output summaries */}
          {event.inputSummary && (
            <ExplainabilitySection label="📥 Input" content={event.inputSummary} variant="code" />
          )}
          {event.outputSummary && (
            <ExplainabilitySection label="📤 Output" content={event.outputSummary} variant="code" />
          )}
          
          {/* Raw detail (if no explainability fields) */}
          {!hasExplainability && event.detail && (
            <div className="mt-2">
              <div className="text-xs text-ak-text-secondary font-medium mb-1">Details</div>
              <pre className="text-xs font-mono bg-ak-surface-3 p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(event.detail, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * File diff preview component
 */
function FileDiffPreview({ artifact }: { artifact: JobArtifact }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDiff = artifact.diffPreview || (artifact.metadata as { diffPreview?: string })?.diffPreview;
  const diff = artifact.diffPreview || (artifact.metadata as { diffPreview?: string })?.diffPreview;
  const linesAdded = artifact.linesAdded ?? (artifact.metadata as { linesAdded?: number })?.linesAdded;
  const linesRemoved = artifact.linesRemoved ?? (artifact.metadata as { linesRemoved?: number })?.linesRemoved;
  
  return (
    <div className="bg-ak-surface-2 border border-ak-border rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {artifact.operation === 'create' ? '📝' : artifact.operation === 'modify' ? '✏️' : '📄'}
          </span>
          <div>
            <div className="font-mono text-sm text-ak-text-primary">{artifact.path}</div>
            <div className="text-xs text-ak-text-secondary mt-0.5">
              {artifact.operation === 'create' ? 'Created' : artifact.operation === 'modify' ? 'Modified' : 'Read'}
              {artifact.sizeBytes && ` • ${(artifact.sizeBytes / 1024).toFixed(1)} KB`}
              {(linesAdded !== undefined || linesRemoved !== undefined) && (
                <span className="ml-2">
                  {linesAdded !== undefined && <span className="text-emerald-400">+{linesAdded}</span>}
                  {linesRemoved !== undefined && <span className="text-red-400 ml-1">-{linesRemoved}</span>}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {(hasDiff || artifact.preview) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-ak-primary hover:text-ak-primary/80 px-2 py-1 rounded hover:bg-ak-surface-3"
          >
            {isExpanded ? '▼ Hide' : '▶ Preview'}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          {diff ? (
            <pre className="text-xs font-mono bg-ak-surface-3 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {diff.split('\n').map((line, i) => {
                let lineClass = 'text-ak-text-secondary';
                if (line.startsWith('+')) lineClass = 'text-emerald-400';
                else if (line.startsWith('-')) lineClass = 'text-red-400';
                else if (line.startsWith('@@')) lineClass = 'text-blue-400';
                return <div key={i} className={lineClass}>{line}</div>;
              })}
            </pre>
          ) : artifact.preview ? (
            <pre className="text-xs font-mono bg-ak-surface-3 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {artifact.preview}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExplainableTimeline({ traces, artifacts = [] }: ExplainableTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    setExpandedIds(new Set(traces.map(t => t.id)));
  };
  
  const collapseAll = () => {
    setExpandedIds(new Set());
  };
  
  // Filter artifacts by type
  const filesProduced = artifacts.filter(a => a.artifactType === 'file_created' || a.artifactType === 'file_modified');
  const documentsRead = artifacts.filter(a => a.artifactType === 'doc_read');
  
  if (traces.length === 0) {
    return (
      <div className="text-center py-8 text-ak-text-secondary">
        <p className="text-sm">No execution trace available yet.</p>
        <p className="text-xs mt-2">Trace events will appear as the job executes.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-ak-text-secondary">
          {traces.length} event{traces.length !== 1 ? 's' : ''} recorded
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-ak-primary hover:text-ak-primary/80 px-2 py-1 rounded hover:bg-ak-surface-3"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs text-ak-primary hover:text-ak-primary/80 px-2 py-1 rounded hover:bg-ak-surface-3"
          >
            Collapse All
          </button>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-ak-border" />
        
        {/* Events */}
        {traces.map((event) => (
          <TimelineCard
            key={event.id}
            event={event}
            isExpanded={expandedIds.has(event.id)}
            onToggle={() => toggleExpand(event.id)}
          />
        ))}
      </div>
      
      {/* Files Produced Section */}
      {filesProduced.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-ak-text-primary mb-4 flex items-center gap-2">
            📝 Files Produced
            <span className="text-sm font-normal text-ak-text-secondary">({filesProduced.length})</span>
          </h3>
          <div className="space-y-2">
            {filesProduced.map((artifact) => (
              <FileDiffPreview key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </div>
      )}
      
      {/* Documents Read Section */}
      {documentsRead.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-ak-text-primary mb-4 flex items-center gap-2">
            📄 Documents Read
            <span className="text-sm font-normal text-ak-text-secondary">({documentsRead.length})</span>
          </h3>
          <div className="bg-ak-surface-2 border border-ak-border rounded-lg p-4">
            <div className="space-y-2">
              {documentsRead.map((artifact) => (
                <div key={artifact.id} className="flex items-center gap-3 py-2 border-b border-ak-border last:border-0">
                  <span className="text-sm">📄</span>
                  <span className="font-mono text-sm text-ak-text-primary flex-1">{artifact.path}</span>
                  {artifact.sizeBytes && (
                    <span className="text-xs text-ak-text-secondary">
                      {(artifact.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplainableTimeline;

