/**
 * ArtifactPreview - Inline file preview with diff support
 * 
 * Features:
 * - Inline preview for text files (md, txt, json, yaml)
 * - Unified diff view with syntax highlighting
 * - Size limits and truncation for large files
 * - Modal view for full content
 */

import { useState, useMemo } from 'react';
import type { JobArtifact } from '../../services/api/types';

// ============================================================================
// Types
// ============================================================================

interface ArtifactPreviewProps {
  artifact: JobArtifact;
  showFullPath?: boolean;
}

interface PreviewModalProps {
  artifact: JobArtifact;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_PREVIEW_LINES = 20;
const MAX_PREVIEW_BYTES = 5000;

const FILE_ICONS: Record<string, string> = {
  md: '📝',
  txt: '📄',
  json: '📋',
  yaml: '⚙️',
  yml: '⚙️',
  ts: '🔷',
  tsx: '🔷',
  js: '🟨',
  jsx: '🟨',
  py: '🐍',
  go: '🔵',
  rs: '🦀',
  sql: '🗃️',
  sh: '🖥️',
  css: '🎨',
  html: '🌐',
};

// ============================================================================
// Helpers
// ============================================================================

function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function getFileIcon(path: string): string {
  const ext = getFileExtension(path);
  return FILE_ICONS[ext] || '📄';
}

function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextFile(path: string): boolean {
  const textExtensions = ['md', 'txt', 'json', 'yaml', 'yml', 'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'sql', 'sh', 'css', 'html', 'xml', 'env', 'gitignore', 'dockerfile'];
  const ext = getFileExtension(path);
  return textExtensions.includes(ext) || path.toLowerCase().includes('readme');
}

function truncatePreview(content: string, maxLines: number = MAX_PREVIEW_LINES): { content: string; truncated: boolean } {
  const lines = content.split('\n');
  if (lines.length <= maxLines && content.length <= MAX_PREVIEW_BYTES) {
    return { content, truncated: false };
  }
  
  const truncatedContent = lines.slice(0, maxLines).join('\n');
  return {
    content: truncatedContent.slice(0, MAX_PREVIEW_BYTES),
    truncated: true,
  };
}

// ============================================================================
// Diff Renderer
// ============================================================================

interface DiffLineProps {
  line: string;
  lineNumber: number;
}

function DiffLine({ line }: DiffLineProps) {
  let bgClass = 'bg-transparent';
  let textClass = 'text-ak-text-secondary';
  let prefix = ' ';

  if (line.startsWith('+') && !line.startsWith('+++')) {
    bgClass = 'bg-emerald-500/10';
    textClass = 'text-emerald-400';
    prefix = '+';
  } else if (line.startsWith('-') && !line.startsWith('---')) {
    bgClass = 'bg-red-500/10';
    textClass = 'text-red-400';
    prefix = '-';
  } else if (line.startsWith('@@')) {
    bgClass = 'bg-blue-500/10';
    textClass = 'text-blue-400';
    prefix = '@';
  } else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
    textClass = 'text-ak-text-secondary';
  }

  return (
    <div className={`flex ${bgClass}`}>
      <span className={`w-4 text-center text-xs ${textClass} select-none`}>{prefix}</span>
      <span className={`flex-1 ${textClass}`}>{line.slice(1) || line}</span>
    </div>
  );
}

function DiffViewer({ content }: { content: string }) {
  const lines = content.split('\n');
  
  return (
    <div className="font-mono text-xs overflow-x-auto bg-ak-surface-3 rounded-lg p-3" data-testid="diff-viewer">
      {lines.map((line, idx) => (
        <DiffLine key={idx} line={line} lineNumber={idx + 1} />
      ))}
    </div>
  );
}

// ============================================================================
// Preview Modal
// ============================================================================

function PreviewModal({ artifact, isOpen, onClose }: PreviewModalProps) {
  if (!isOpen) return null;

  const content = artifact.diffPreview || artifact.preview || '';
  const isDiff = Boolean(artifact.diffPreview);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-ak-surface border border-ak-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-ak-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getFileIcon(artifact.path)}</span>
            <div>
              <h3 className="font-semibold text-ak-text-primary">{getFileName(artifact.path)}</h3>
              <p className="text-xs text-ak-text-secondary font-mono">{artifact.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {artifact.linesAdded !== undefined && (
              <span className="text-xs text-emerald-400">+{artifact.linesAdded}</span>
            )}
            {artifact.linesRemoved !== undefined && (
              <span className="text-xs text-red-400">-{artifact.linesRemoved}</span>
            )}
            <span className="text-xs text-ak-text-secondary">{formatBytes(artifact.sizeBytes)}</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-ak-surface-3 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4">
          {isDiff ? (
            <DiffViewer content={content} />
          ) : (
            <pre className="font-mono text-xs whitespace-pre-wrap text-ak-text-primary bg-ak-surface-3 rounded-lg p-3">
              {content}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-ak-border bg-ak-surface-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              artifact.operation === 'create' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : artifact.operation === 'modify'
                ? 'bg-amber-500/20 text-amber-400'
                : artifact.operation === 'preview'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-ak-surface-3 text-ak-text-secondary'
            }`}>
              {artifact.operation === 'create' ? 'Created' : 
               artifact.operation === 'modify' ? 'Modified' : 
               artifact.operation === 'preview' ? '🔬 Preview (Dry Run)' : 'Read'}
            </span>
            <span className="text-xs text-ak-text-secondary">
              {new Date(artifact.createdAt).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(content);
            }}
            className="px-3 py-1.5 text-sm bg-ak-surface-3 hover:bg-ak-surface-2 rounded-lg text-ak-text-primary transition-colors"
          >
            Copy Content
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ArtifactPreview({ artifact, showFullPath = false }: ArtifactPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInlineExpanded, setIsInlineExpanded] = useState(false);

  const hasContent = Boolean(artifact.preview || artifact.diffPreview);
  const isDiff = Boolean(artifact.diffPreview);
  const canPreview = isTextFile(artifact.path) && hasContent;

  const inlinePreview = useMemo(() => {
    if (!hasContent) return null;
    const content = artifact.diffPreview || artifact.preview || '';
    return truncatePreview(content);
  }, [artifact.preview, artifact.diffPreview, hasContent]);

  const operationStyles: Record<string, string> = {
    create: 'border-l-emerald-500 bg-emerald-500/5',
    modify: 'border-l-amber-500 bg-amber-500/5',
    read: 'border-l-blue-500 bg-blue-500/5',
    preview: 'border-l-purple-500 bg-purple-500/5',
  };

  return (
    <>
      <div 
        className={`border-l-4 rounded-lg border border-ak-border overflow-hidden ${operationStyles[artifact.operation] || 'border-l-ak-border bg-ak-surface-2'}`}
        data-testid="artifact-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0">{getFileIcon(artifact.path)}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-ak-text-primary truncate">
                  {showFullPath ? artifact.path : getFileName(artifact.path)}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                  artifact.operation === 'create' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : artifact.operation === 'modify'
                    ? 'bg-amber-500/20 text-amber-400'
                    : artifact.operation === 'preview'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {artifact.operation === 'preview' ? '🔬 preview' : artifact.operation}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ak-text-secondary mt-0.5">
                {artifact.sizeBytes && <span>{formatBytes(artifact.sizeBytes)}</span>}
                {artifact.linesAdded !== undefined && (
                  <span className="text-emerald-400">+{artifact.linesAdded}</span>
                )}
                {artifact.linesRemoved !== undefined && (
                  <span className="text-red-400">-{artifact.linesRemoved}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canPreview && (
              <>
                <button
                  onClick={() => setIsInlineExpanded(!isInlineExpanded)}
                  className="px-2 py-1 text-xs text-ak-primary hover:bg-ak-surface-3 rounded"
                  data-testid="preview-toggle"
                >
                  {isInlineExpanded ? 'Hide' : 'Preview'}
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2 py-1 text-xs text-ak-primary hover:bg-ak-surface-3 rounded"
                  data-testid="fullscreen-preview"
                >
                  Full View
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Preview */}
        {isInlineExpanded && inlinePreview && (
          <div className="border-t border-ak-border bg-ak-surface/50 p-3">
            {isDiff ? (
              <DiffViewer content={inlinePreview.content} />
            ) : (
              <pre className="font-mono text-xs whitespace-pre-wrap text-ak-text-primary bg-ak-surface-3 rounded-lg p-3">
                {inlinePreview.content}
              </pre>
            )}
            {inlinePreview.truncated && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-ak-primary hover:underline"
                >
                  Content truncated - click for full view
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <PreviewModal
        artifact={artifact}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default ArtifactPreview;

