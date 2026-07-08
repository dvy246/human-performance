import React, { useState, useEffect } from 'react';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';

const TEST_NAMES: Record<string, string> = {
  'reaction-time': 'Visual Reaction', 'f1-lights': 'F1 Lights', 'sound-reaction': 'Sound Reflex',
  'choice-reaction': 'Choice Grid', 'go-no-go': 'Go/No-Go', 'click-speed': 'Click Speed',
  'aim-trainer': 'Aim Precision', 'sequence-memory': 'Sequence Mem.', 'number-memory': 'Number Mem.',
  'visual-pattern': 'Visual Pattern', 'stroop': 'Stroop', 'pattern-reasoning': 'Pattern Reason.',
  'tmt-partA': 'Trail Making A', 'tmt-partB': 'Trail Making B', 'dual-n-back': 'Dual N-Back',
  'focus-challenge': 'Focus Challenge', 'verbal-memory': 'Verbal Memory', 'spatial-orientation': 'Spatial Orient.',
  'mouse-accuracy': 'Mouse Accuracy', 'flick-trainer': 'Flick Trainer', 'decision-speed': 'Decision Speed',
  'planning': 'Planning', 'prioritization': 'Prioritization', 'gauntlet': 'Gauntlet',
};

const CATEGORY_COLORS: Record<string, string> = {
  reaction: '#ef4444', memory: '#8b5cf6', processing: '#f59e0b',
  precision: '#10b981', focus: '#3b82f6', stamina: '#ec4899',
};

const TEST_CATEGORY: Record<string, string> = {
  'reaction-time': 'reaction', 'f1-lights': 'reaction', 'sound-reaction': 'reaction',
  'choice-reaction': 'reaction', 'go-no-go': 'focus', 'click-speed': 'stamina',
  'aim-trainer': 'precision', 'sequence-memory': 'memory', 'number-memory': 'memory',
  'visual-pattern': 'memory', 'stroop': 'focus', 'pattern-reasoning': 'processing',
  'tmt-partA': 'focus', 'tmt-partB': 'focus', 'dual-n-back': 'memory',
  'focus-challenge': 'focus', 'verbal-memory': 'memory', 'spatial-orientation': 'processing',
  'mouse-accuracy': 'precision', 'flick-trainer': 'precision', 'decision-speed': 'processing',
  'planning': 'processing', 'prioritization': 'processing', 'gauntlet': 'processing',
};

interface TestBar {
  testId: string;
  name: string;
  percentile: number;
  color: string;
}

export default function CrossTestBarChart() {
  const [bars, setBars] = useState<TestBar[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const records = await dataLayer.getHistory();
      if (!mounted) return;

      // Get best percentile per test
      const bestByTest = new Map<string, number>();
      records.forEach(r => {
        const current = bestByTest.get(r.testId) || 0;
        bestByTest.set(r.testId, Math.max(current, r.percentile));
      });

      const barData: TestBar[] = [];
      bestByTest.forEach((percentile, testId) => {
        if (TEST_NAMES[testId]) {
          barData.push({
            testId,
            name: TEST_NAMES[testId],
            percentile,
            color: CATEGORY_COLORS[TEST_CATEGORY[testId] || 'processing'] || '#6b7280',
          });
        }
      });

      barData.sort((a, b) => b.percentile - a.percentile);
      setBars(barData);
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (bars.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <span className="text-muted text-xs font-mono">No test data yet</span>
        <span className="text-muted text-[10px]">Complete assessments to see your cross-test comparison</span>
      </div>
    );
  }

  const maxBarWidth = 200;

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">Cross-Test Comparison</span>
        <span className="text-[10px] font-mono text-muted">{bars.length} tests</span>
      </div>

      <div className="flex flex-col gap-2">
        {bars.map((bar) => (
          <div key={bar.testId} className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted w-24 truncate text-right shrink-0" title={bar.name}>
              {bar.name}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-4 rounded-sm overflow-hidden bg-subtle border border-card-border/40 flex-1 max-w-[200px]">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.max(2, bar.percentile)}%`,
                    backgroundColor: bar.color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-foreground font-bold w-12 text-right">
                {bar.percentile}%ile
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-card-border/40">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-mono text-muted uppercase">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
