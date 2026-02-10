/**
 * ThinkingIndicator - Animated loading indicator for job execution
 * S2.0.3: Live Execution Trace + Thinking UX
 * 
 * Displays AKIS logo with pulse/orbit animation and status text
 * based on the current execution stage.
 */

import { useMemo } from 'react';
import type { StageStreamEvent } from '../../services/api/types';

export interface ThinkingIndicatorProps {
  /** Current execution stage */
  stage: StageStreamEvent['stage'] | null;
  /** Custom message override */
  message?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the job is connected to stream */
  isConnected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status text for a given stage
 */
function getStageText(stage: StageStreamEvent['stage'] | null, customMessage?: string | null): string {
  if (customMessage) return customMessage;
  
  switch (stage) {
    case 'init':
      return 'Initializing...';
    case 'planning':
      return 'Planning...';
    case 'executing':
      return 'Executing...';
    case 'reflecting':
      return 'Reflecting on results...';
    case 'validating':
      return 'Validating output...';
    case 'publishing':
      return 'Publishing changes...';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Processing...';
  }
}

/**
 * Get animation class for a given stage
 */
function getAnimationClass(stage: StageStreamEvent['stage'] | null): string {
  switch (stage) {
    case 'planning':
      return 'animate-pulse-slow';
    case 'executing':
      return 'animate-spin-slow';
    case 'reflecting':
    case 'validating':
      return 'animate-bounce-subtle';
    case 'publishing':
      return 'animate-pulse-fast';
    case 'completed':
    case 'failed':
      return '';
    default:
      return 'animate-pulse';
  }
}

/**
 * Get color class for a given stage
 */
function getColorClass(stage: StageStreamEvent['stage'] | null): string {
  switch (stage) {
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'planning':
      return 'text-blue-500';
    case 'executing':
      return 'text-amber-500';
    case 'reflecting':
    case 'validating':
      return 'text-purple-500';
    case 'publishing':
      return 'text-cyan-500';
    default:
      return 'text-accent';
  }
}

/**
 * Size configurations
 */
const sizeConfig = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-xs',
    ring: 'w-6 h-6',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-sm',
    ring: 'w-10 h-10',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    text: 'text-base',
    ring: 'w-14 h-14',
  },
};

export function ThinkingIndicator({
  stage,
  message,
  size = 'md',
  isConnected = true,
  className = '',
}: ThinkingIndicatorProps) {
  const statusText = useMemo(() => getStageText(stage, message), [stage, message]);
  const animationClass = useMemo(() => getAnimationClass(stage), [stage]);
  const colorClass = useMemo(() => getColorClass(stage), [stage]);
  const config = sizeConfig[size];

  const isTerminal = stage === 'completed' || stage === 'failed';

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Animated Logo Container */}
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Outer Ring (orbit animation) */}
        {!isTerminal && (
          <div
            className={`absolute ${config.ring} rounded-full border-2 border-transparent ${colorClass} opacity-30`}
            style={{
              borderTopColor: 'currentColor',
              animation: 'spin 2s linear infinite',
            }}
          />
        )}
        
        {/* Middle Ring (pulse animation) */}
        {!isTerminal && (
          <div
            className={`absolute ${config.ring} rounded-full ${colorClass} opacity-20`}
            style={{
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
        
        {/* AKIS Logo / Icon */}
        <div
          className={`${config.icon} ${colorClass} ${animationClass} flex items-center justify-center`}
        >
          {isTerminal ? (
            stage === 'completed' ? (
              <CheckIcon className={config.icon} />
            ) : (
              <XIcon className={config.icon} />
            )
          ) : (
            <AkisIcon className={config.icon} />
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className={`${config.text} ${colorClass} font-medium text-center`}>
        {statusText}
        {!isTerminal && !isConnected && (
          <span className="block text-xs text-muted-foreground mt-1">
            Reconnecting...
          </span>
        )}
      </div>

      {/* Live indicator dot */}
      {!isTerminal && isConnected && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>Live</span>
        </div>
      )}
    </div>
  );
}

/**
 * AKIS Logo Icon (simplified version for indicator)
 */
function AkisIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Stylized 'A' representing AKIS */}
      <path d="M12 2L3 22h6l3-7l3 7h6L12 2z" />
      <path d="M7 15h10" />
    </svg>
  );
}

/**
 * Check Icon
 */
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * X Icon
 */
function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * CSS Keyframes (add to your global CSS or Tailwind config)
 * These provide smoother animations than default Tailwind
 */
export const thinkingIndicatorStyles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes pulse-fast {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.animate-pulse-fast {
  animation: pulse-fast 0.75s ease-in-out infinite;
}

.animate-bounce-subtle {
  animation: bounce-subtle 1s ease-in-out infinite;
}
`;

export default ThinkingIndicator;
