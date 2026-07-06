import { describe, it, expect } from 'vitest';
import { computeCategoryAverages, calculateBbiScore, getRadarCoordinates } from '../skillRadar';
import type { SessionRecord } from '../dataLayer';

function makeRecord(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: 'test-id',
    testId: 'reaction-time',
    category: 'reaction',
    timestamp: Date.now(),
    rawScore: 200,
    percentile: 50,
    ...overrides,
  };
}

describe('computeCategoryAverages', () => {
  it('returns zeros for empty records', () => {
    const result = computeCategoryAverages([]);
    expect(result).toEqual({
      reaction: 0, memory: 0, processing: 0,
      precision: 0, focus: 0, stamina: 0,
    });
  });

  it('classifies reaction-time into reaction category', () => {
    const records = [makeRecord({ testId: 'reaction-time', percentile: 80 })];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(80);
    expect(result.memory).toBe(0);
  });

  it('classifies f1-lights into reaction category', () => {
    const records = [makeRecord({ testId: 'f1-lights', percentile: 70 })];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(70);
  });

  it('classifies sound-reaction into reaction category', () => {
    const records = [makeRecord({ testId: 'sound-reaction', percentile: 90 })];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(90);
  });

  it('classifies memory tests into memory category', () => {
    const tests = ['sequence-memory', 'number-memory', 'visual-pattern', 'dual-n-back'];
    const records = tests.map((t, i) => makeRecord({ testId: t, percentile: (i + 1) * 20 }));
    const result = computeCategoryAverages(records);
    expect(result.memory).toBe(50);
    expect(result.reaction).toBe(0);
  });

  it('classifies processing tests correctly', () => {
    const records = [
      makeRecord({ testId: 'choice-reaction', percentile: 60 }),
      makeRecord({ testId: 'pattern-reasoning', percentile: 80 }),
    ];
    const result = computeCategoryAverages(records);
    expect(result.processing).toBe(70);
  });

  it('classifies aim-trainer as precision', () => {
    const records = [makeRecord({ testId: 'aim-trainer', percentile: 85 })];
    const result = computeCategoryAverages(records);
    expect(result.precision).toBe(85);
  });

  it('classifies focus tests correctly', () => {
    const records = [
      makeRecord({ testId: 'go-no-go', percentile: 40 }),
      makeRecord({ testId: 'stroop', percentile: 60 }),
      makeRecord({ testId: 'tmt-partA', percentile: 50 }),
      makeRecord({ testId: 'tmt-partB', percentile: 70 }),
    ];
    const result = computeCategoryAverages(records);
    expect(result.focus).toBe(55);
  });

  it('classifies click-speed as stamina', () => {
    const records = [makeRecord({ testId: 'click-speed', percentile: 95 })];
    const result = computeCategoryAverages(records);
    expect(result.stamina).toBe(95);
  });

  it('handles mixed categories independently', () => {
    const records = [
      makeRecord({ testId: 'reaction-time', percentile: 50 }),
      makeRecord({ testId: 'sequence-memory', percentile: 70 }),
      makeRecord({ testId: 'aim-trainer', percentile: 30 }),
    ];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(50);
    expect(result.memory).toBe(70);
    expect(result.precision).toBe(30);
    expect(result.processing).toBe(0);
    expect(result.focus).toBe(0);
    expect(result.stamina).toBe(0);
  });

  it('averages multiple records in same category', () => {
    const records = [
      makeRecord({ testId: 'reaction-time', percentile: 40 }),
      makeRecord({ testId: 'f1-lights', percentile: 60 }),
      makeRecord({ testId: 'sound-reaction', percentile: 80 }),
    ];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(60);
  });

  it('rounds averages to nearest integer', () => {
    const records = [
      makeRecord({ testId: 'reaction-time', percentile: 33 }),
      makeRecord({ testId: 'f1-lights', percentile: 34 }),
    ];
    const result = computeCategoryAverages(records);
    expect(result.reaction).toBe(34);
  });

  it('ignores unknown testIds', () => {
    const records = [makeRecord({ testId: 'unknown-test', percentile: 99 })];
    const result = computeCategoryAverages(records);
    expect(result).toEqual({
      reaction: 0, memory: 0, processing: 0,
      precision: 0, focus: 0, stamina: 0,
    });
  });
});

describe('calculateBbiScore', () => {
  it('returns 0 for all zero averages', () => {
    const avg = { reaction: 0, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    expect(calculateBbiScore(avg)).toBe(0);
  });

  it('returns 10x the percentile for single category', () => {
    const avg = { reaction: 50, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    expect(calculateBbiScore(avg)).toBe(500);
  });

  it('averages multiple active categories', () => {
    const avg = { reaction: 60, memory: 80, processing: 0, precision: 0, focus: 0, stamina: 0 };
    expect(calculateBbiScore(avg)).toBe(700);
  });

  it('includes all six categories when all active', () => {
    const avg = { reaction: 50, memory: 60, processing: 70, precision: 80, focus: 90, stamina: 100 };
    expect(calculateBbiScore(avg)).toBe(750);
  });

  it('ignores zeros when computing average', () => {
    const avg = { reaction: 100, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    expect(calculateBbiScore(avg)).toBe(1000);
  });

  it('rounds to nearest integer', () => {
    const avg = { reaction: 33, memory: 34, processing: 0, precision: 0, focus: 0, stamina: 0 };
    expect(calculateBbiScore(avg)).toBe(335);
  });
});

describe('getRadarCoordinates', () => {
  const center = 100;
  const scale = 80;

  it('returns 6 comma-separated coordinate pairs', () => {
    const avg = { reaction: 50, memory: 50, processing: 50, precision: 50, focus: 50, stamina: 50 };
    const coords = getRadarCoordinates(avg, center, scale);
    const points = coords.split(' ');
    expect(points).toHaveLength(6);
    points.forEach(pt => {
      const [x, y] = pt.split(',');
      expect(Number(x)).not.toBeNaN();
      expect(Number(y)).not.toBeNaN();
    });
  });

  it('all zeros produce minimum shape (all at center)', () => {
    const avg = { reaction: 0, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    const coords = getRadarCoordinates(avg, center, scale);
    const points = coords.split(' ').map(pt => pt.split(',').map(Number));
    // With floor at 10, all points should be at 10% of scale from center
    const expectedDist = (10 / 100) * scale;
    points.forEach(([x, y]) => {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      expect(dist).toBeCloseTo(expectedDist, 0);
    });
  });

  it('all max values produce maximum shape', () => {
    const avg = { reaction: 100, memory: 100, processing: 100, precision: 100, focus: 100, stamina: 100 };
    const coords = getRadarCoordinates(avg, center, scale);
    const points = coords.split(' ').map(pt => pt.split(',').map(Number));
    points.forEach(([x, y]) => {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      expect(dist).toBeCloseTo(scale, 0);
    });
  });

  it('first point is at top (12 o\'clock)', () => {
    const avg = { reaction: 100, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    const coords = getRadarCoordinates(avg, center, scale);
    const firstPoint = coords.split(' ')[0];
    const [x, y] = firstPoint.split(',').map(Number);
    expect(x).toBeCloseTo(center, 0);
    expect(y).toBeLessThan(center);
  });

  it('values below 10 use floor of 10', () => {
    const avg = { reaction: 5, memory: 0, processing: 0, precision: 0, focus: 0, stamina: 0 };
    const coords = getRadarCoordinates(avg, center, scale);
    const coords2 = getRadarCoordinates({ ...avg, reaction: 10 }, center, scale);
    expect(coords).toBe(coords2);
  });
});
