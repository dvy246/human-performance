import type { SessionRecord } from './dataLayer';

export interface CognitiveAverages {
  reaction: number;
  memory: number;
  processing: number;
  precision: number;
  focus: number;
  stamina: number;
}

/**
 * Computes category-level averages based on IndexedDB history.
 * Averages are based on percentiles (0-100).
 */
export function computeCategoryAverages(records: SessionRecord[]): CognitiveAverages {
  const scores = {
    reaction: [] as number[],
    memory: [] as number[],
    processing: [] as number[],
    precision: [] as number[],
    focus: [] as number[],
    stamina: [] as number[]
  };

  records.forEach(r => {
    if (r.testId === 'reaction-time' || r.testId === 'f1-lights' || r.testId === 'sound-reaction') {
      scores.reaction.push(r.percentile);
    } else if (r.testId === 'sequence-memory' || r.testId === 'number-memory' || r.testId === 'visual-pattern' || r.testId === 'dual-n-back' || r.testId === 'verbal-memory') {
      scores.memory.push(r.percentile);
    } else if (r.testId === 'choice-reaction' || r.testId === 'pattern-reasoning' || r.testId === 'spatial-orientation' || r.testId === 'decision-speed' || r.testId === 'planning' || r.testId === 'prioritization' || r.testId === 'gauntlet') {
      scores.processing.push(r.percentile);
    } else if (r.testId === 'aim-trainer' || r.testId === 'mouse-accuracy' || r.testId === 'flick-trainer') {
      scores.precision.push(r.percentile);
    } else if (r.testId === 'go-no-go' || r.testId === 'stroop' || r.testId === 'tmt-partA' || r.testId === 'tmt-partB' || r.testId === 'focus-challenge') {
      scores.focus.push(r.percentile);
    } else if (r.testId === 'click-speed' || r.testId === 'typing-speed') {
      scores.stamina.push(r.percentile);
    }
  });

  const getAvg = (arr: number[]) => (arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));

  return {
    reaction: getAvg(scores.reaction),
    memory: getAvg(scores.memory),
    processing: getAvg(scores.processing),
    precision: getAvg(scores.precision),
    focus: getAvg(scores.focus),
    stamina: getAvg(scores.stamina)
  };
}

/**
 * Calculates CAI (CogniArena Index) score from averages.
 */
export function calculateBbiScore(avg: CognitiveAverages): number {
  const activePercentiles = Object.values(avg).filter(v => v > 0);
  if (activePercentiles.length === 0) return 0;

  const averagePercentile = activePercentiles.reduce((a, b) => a + b, 0) / activePercentiles.length;
  return Math.round(averagePercentile * 10);
}

/**
 * Returns radar chart polygon coordinate points for SVG drawing.
 */
export function getRadarCoordinates(avg: CognitiveAverages, center: number, scale: number): string {
  const keys: Array<keyof CognitiveAverages> = ['reaction', 'memory', 'processing', 'precision', 'focus', 'stamina'];
  const points: string[] = [];

  keys.forEach((key, i) => {
    const value = Math.max(avg[key] || 0, 10); // floor at 10 to draw min shape
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    // Map value (0-100) to visual scale
    const dist = (value / 100) * scale;
    const x = center + dist * Math.cos(angle);
    const y = center + dist * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });

  return points.join(' ');
}
