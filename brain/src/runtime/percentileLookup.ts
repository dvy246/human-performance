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

export function formatTopPercentile(percentile: number, _lowerIsBetter = false): string {
  // lookupPercentile already returns standardized percentile (higher=better)
  // so lowerIsBetter is always false here — kept for backward compat
  const isTop = percentile >= 50;
  const top = 100 - percentile;
  const rounded = Math.round(top * 10) / 10;

  if (isTop) {
    if (rounded < 1) return `Top ${rounded.toFixed(1)}%`;
    return `Top ${Math.round(rounded)}%`;
  }
  const bottom = Math.round(percentile * 10) / 10;
  if (bottom < 1) return 'Bottom <1%';
  return `Bottom ${Math.round(bottom)}%`;
}
