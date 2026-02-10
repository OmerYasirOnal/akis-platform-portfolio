/**
 * Quality Scoring Service
 * Computes quality scores for completed jobs based on execution metrics.
 * Pure function: same inputs → same output
 */

export const QUALITY_VERSION = 'v1.0';

export interface QualityBreakdownItem {
  label: string;
  value: string;
  points: number;
}

export interface QualityResult {
  score: number;
  breakdown: QualityBreakdownItem[];
  version: string;
  computedAt: Date;
}

export interface QualityInput {
  jobType: string;
  state: 'completed' | 'failed';
  errorCode?: string | null;
  targetsConfigured: string[];
  targetsProduced: string[];
  documentsRead: number;
  filesProduced: number;
  docDepth: 'lite' | 'standard' | 'deep';
  multiPass: boolean;
  totalTokens?: number | null;
}

/**
 * Computes a 0–100 quality score for a completed job based on execution metrics.
 * @param input - Job metrics (targets, files, depth, multi-pass, state)
 * @returns Score with detailed breakdown and version tag
 */
export function computeQualityScore(input: QualityInput): QualityResult {
  const breakdown: QualityBreakdownItem[] = [];
  let score = 0;

  if (input.state === 'failed') {
    breakdown.push({
      label: 'Job status',
      value: `Failed: ${input.errorCode || 'unknown'}`,
      points: 0,
    });
    return {
      score: 0,
      breakdown,
      version: QUALITY_VERSION,
      computedAt: new Date(),
    };
  }

  // Target coverage (30 points max)
  const targetCoverage = input.targetsConfigured.length > 0
    ? input.targetsProduced.filter(t => input.targetsConfigured.includes(t)).length / input.targetsConfigured.length
    : 0;
  const targetPoints = Math.round(targetCoverage * 30);
  breakdown.push({
    label: 'Target coverage',
    value: `${input.targetsProduced.length}/${input.targetsConfigured.length} targets`,
    points: targetPoints,
  });
  score += targetPoints;

  // Files analyzed (20 points max)
  const readPoints = Math.min(input.documentsRead * 2, 20);
  breakdown.push({
    label: 'Files analyzed',
    value: `${input.documentsRead} files`,
    points: readPoints,
  });
  score += readPoints;

  // Output volume (20 points max)
  const outputPoints = Math.min(input.filesProduced * 5, 20);
  breakdown.push({
    label: 'Docs generated',
    value: `${input.filesProduced} files`,
    points: outputPoints,
  });
  score += outputPoints;

  // Depth bonus (15 points max)
  const depthPoints = input.docDepth === 'deep' ? 15 : input.docDepth === 'standard' ? 10 : 5;
  breakdown.push({
    label: 'Analysis depth',
    value: input.docDepth,
    points: depthPoints,
  });
  score += depthPoints;

  // Multi-pass bonus (15 points)
  if (input.multiPass) {
    breakdown.push({ label: 'Multi-pass review', value: 'Yes', points: 15 });
    score += 15;
  } else {
    breakdown.push({ label: 'Multi-pass review', value: 'No', points: 0 });
  }

  return {
    score: Math.min(score, 100),
    breakdown,
    version: QUALITY_VERSION,
    computedAt: new Date(),
  };
}

/**
 * Generates up to 2 actionable improvement suggestions based on a quality result.
 * @param result - The computed quality result
 * @param input - The original quality input for context
 * @returns Array of suggestion strings (max 2)
 */
export function generateQualitySuggestions(result: QualityResult, input: QualityInput): string[] {
  const suggestions: string[] = [];

  if (input.state === 'failed') {
    if (input.errorCode === 'AI_PROVIDER_ERROR') {
      suggestions.push('Check AI provider configuration and supported models in Settings > AI Keys');
    } else if (input.errorCode === 'MCP_UNREACHABLE') {
      suggestions.push('Verify MCP Gateway is running and GitHub integration is connected');
    } else {
      suggestions.push('Review job logs for error details');
    }
    return suggestions;
  }

  const breakdown = Object.fromEntries(result.breakdown.map(b => [b.label, b]));

  if ((breakdown['Target coverage']?.points || 0) < 15) {
    suggestions.push('Increase target scope or add more output targets');
  }

  if ((breakdown['Files analyzed']?.points || 0) < 10) {
    suggestions.push('Expand repository scope to analyze more files');
  }

  if ((breakdown['Docs generated']?.points || 0) < 10) {
    suggestions.push('Consider using "full" doc pack for more comprehensive output');
  }

  if (input.docDepth !== 'deep') {
    suggestions.push('Enable "deep" analysis mode for higher quality');
  }

  if (!input.multiPass) {
    suggestions.push('Enable multi-pass review for better accuracy');
  }

  return suggestions.slice(0, 2);
}
