// Shared percentile lookup utility — uses test-specific data from percentiles.json
import percentilesData from '../data/percentiles.json';

/**
 * Look up the percentile for a given score using the test-specific table from percentiles.json.
 * Tables are sorted ascending by score. Returns the highest percentile whose score threshold is <= the given score.
 *
 * @param testId - The test identifier matching a key in percentiles.json
 * @param score - The raw score to look up
 * @param lowerIsBetter - If true, inverts the lookup for metrics where lower values are better (e.g. reaction times).
 *                        Default is false (higher scores = better performance).
 * @returns The percentile (0.1–99.9), or 0.1 if no table exists or score is below all thresholds.
 */
export const LOWER_IS_BETTER = new Set([
  'reaction-time',
  'f1-lights',
  'sound-reaction',
  'choice-reaction',
  'go-no-go',
  'aim-trainer',
  'aim-coordination',
  'mouse-accuracy',
  'flick-trainer',
  'stroop',
  'tmt-partA',
  'tmt-partB',
  'planning'
]);

export function isLowerBetter(testId: string): boolean {
  return LOWER_IS_BETTER.has(testId);
}

/**
 * Look up the percentile for a given score using the test-specific table from percentiles.json.
 * Tables are sorted ascending by score. Returns the highest percentile whose score threshold is <= the given score.
 *
 * @param testId - The test identifier matching a key in percentiles.json
 * @param score - The raw score to look up
 * @param lowerIsBetter - If true, inverts the lookup for metrics where lower values are better (e.g. reaction times).
 *                        Default is false (higher scores = better performance).
 * @returns The percentile (0.1–99.9), or 0.1 if no table exists or score is below all thresholds.
 */
export function lookupPercentile(testId: string, score: number, lowerIsBetter = false): number {
  const table = (percentilesData as Record<string, { score: number; percentile: number }[]>)[testId];
  if (!table || table.length === 0) return 0.1;

  if (lowerIsBetter) {
    // For "lower is better" metrics (e.g. reaction time in ms):
    // Iterate from lowest score upward — return the percentile of the highest table entry whose score >= given score.
    for (let i = 0; i < table.length; i++) {
      if (score <= table[i].score) return table[i].percentile;
    }
    return 99.9;
  }

  // Default: "higher is better" — iterate from highest to lowest
  for (let i = table.length - 1; i >= 0; i--) {
    if (score >= table[i].score) return table[i].percentile;
  }
  return 0.1;
}

export function formatTopPercentile(percentile: number, lowerIsBetter: boolean | string = false): string {
  const isLower = typeof lowerIsBetter === 'string' ? LOWER_IS_BETTER.has(lowerIsBetter) : lowerIsBetter;
  const isTop = isLower ? (percentile <= 50) : (percentile >= 50);
  
  if (isTop) {
    const topVal = isLower ? percentile : (100 - percentile);
    const rounded = Math.round(topVal * 10) / 10;
    if (rounded < 0.1) return 'Top 0.1%';
    if (rounded < 1) return `Top ${rounded.toFixed(1)}%`;
    return `Top ${Math.round(rounded)}%`;
  } else {
    const bottomVal = isLower ? (100 - percentile) : percentile;
    const rounded = Math.round(bottomVal * 10) / 10;
    if (rounded < 0.1) return 'Bottom <1%';
    if (rounded < 1) return 'Bottom <1%';
    return `Bottom ${Math.round(rounded)}%`;
  }
}
