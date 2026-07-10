import React, { useState, useEffect, useMemo } from 'react';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';

const LOWER_IS_BETTER = new Set(['reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction', 'go-no-go', 'aim-trainer', 'aim-coordination', 'mouse-accuracy', 'flick-trainer', 'stroop', 'tmt-partA', 'tmt-partB', 'planning', 'decision-speed']);

const TEST_NAMES: Record<string, string> = {
  'reaction-time': 'Visual Reaction', 'f1-lights': 'F1 Lights', 'sound-reaction': 'Sound Reflex',
  'choice-reaction': 'Choice Grid', 'go-no-go': 'Go/No-Go', 'click-speed': 'Click Speed',
  'aim-trainer': 'Aim Precision', 'sequence-memory': 'Sequence Memory', 'number-memory': 'Number Memory',
  'visual-pattern': 'Visual Pattern', 'stroop': 'Stroop', 'pattern-reasoning': 'Pattern Reasoning',
  'tmt-partA': 'Trail Making A', 'tmt-partB': 'Trail Making B', 'dual-n-back': 'Dual N-Back',
  'focus-challenge': 'Focus Challenge', 'verbal-memory': 'Verbal Memory', 'spatial-orientation': 'Spatial Orient.',
  'mouse-accuracy': 'Mouse Accuracy', 'flick-trainer': 'Flick Trainer', 'decision-speed': 'Decision Speed',
  'planning': 'Planning', 'prioritization': 'Prioritization', 'gauntlet': 'Gauntlet',
};

const LINE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

interface TrendLine {
  testId: string;
  points: { x: number; y: number; val: number; date: string }[];
  color: string;
  visible: boolean;
}

export default function MultiTrendChart() {
  const [allRecords, setAllRecords] = useState<SessionRecord[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const records = await dataLayer.getHistory();
      if (!mounted) return;
      setAllRecords(records);

      // Auto-select up to 3 tests with most data
      const testCounts = new Map<string, number>();
      records.forEach(r => testCounts.set(r.testId, (testCounts.get(r.testId) || 0) + 1));
      const sorted = [...testCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      setSelectedTests(new Set(sorted.map(([id]) => id)));
    }
    load();
    return () => { mounted = false; };
  }, []);

  const availableTests = useMemo(() => {
    const testIds = new Set(allRecords.map(r => r.testId));
    return [...testIds].filter(id => TEST_NAMES[id]).sort((a, b) => (TEST_NAMES[a] || '').localeCompare(TEST_NAMES[b] || ''));
  }, [allRecords]);

  const trendLines = useMemo((): TrendLine[] => {
    const width = 320;
    const height = 140;
    const pad = 25;

    // Find global date range across selected tests
    const selectedRecords = allRecords.filter(r => selectedTests.has(r.testId));
    if (selectedRecords.length === 0) return [];

    const allTimestamps = selectedRecords.map(r => r.timestamp);
    const minTime = allTimestamps.reduce((a, b) => Math.min(a, b), allTimestamps[0]);
    const maxTime = allTimestamps.reduce((a, b) => Math.max(a, b), allTimestamps[0]);
    const timeRange = maxTime - minTime || 1;

    // Find global score range
    const allScores = selectedRecords.map(r => r.rawScore);
    const minScore = allScores.reduce((a, b) => Math.min(a, b), allScores[0]);
    const maxScore = allScores.reduce((a, b) => Math.max(a, b), allScores[0]);
    const scoreRange = maxScore - minScore || 1;

    let colorIdx = 0;
    return [...selectedTests].map(testId => {
      const testRecords = allRecords
        .filter(r => r.testId === testId)
        .sort((a, b) => a.timestamp - b.timestamp);

      const points = testRecords.map(rec => {
        const x = pad + ((rec.timestamp - minTime) / timeRange) * (width - pad * 2);
        const norm = ((rec.rawScore - minScore) / scoreRange);
        const y = LOWER_IS_BETTER.has(rec.testId)
          ? pad + norm * (height - pad * 2)
          : height - pad - norm * (height - pad * 2);
        return {
          x, y,
          val: rec.rawScore,
          date: new Date(rec.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        };
      });

      return {
        testId,
        points,
        color: LINE_COLORS[colorIdx++ % LINE_COLORS.length],
        visible: true,
      };
    });
  }, [allRecords, selectedTests]);

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  if (availableTests.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-6 shadow flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <span className="text-muted text-xs font-mono">No trend data available</span>
        <span className="text-muted text-[10px]">Complete multiple assessments to see trends</span>
      </div>
    );
  }

  const visibleLines = trendLines.filter(l => l.points.length > 0);
  const width = 320;
  const height = 140;
  const pad = 25;

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">Score Trends</span>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-card-border bg-subtle text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Select Tests ({selectedTests.size})
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-48 max-h-60 overflow-y-auto rounded-lg border border-card-border bg-card shadow-xl">
              {availableTests.map(testId => (
                <label
                  key={testId}
                  className="flex items-center gap-2 px-3 py-1.5 text-[11px] cursor-pointer hover:bg-subtle/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTests.has(testId)}
                    onChange={() => toggleTest(testId)}
                    className="accent-accent"
                  />
                  <span className="text-foreground truncate">{TEST_NAMES[testId]}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {visibleLines.length > 0 && visibleLines.some(l => l.points.length >= 2) ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          {/* Grid lines */}
          <line x1={pad} y1={pad} x2={width - pad} y2={pad} stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />

          {visibleLines.map(line => {
            if (line.points.length < 2) return null;
            return (
              <g key={line.testId}>
                <path
                  d={`M ${line.points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2"
                  opacity="0.85"
                />
                {line.points.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill={line.color} stroke="var(--bg-card)" strokeWidth="1">
                    <title>{`${pt.val} (${pt.date})`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="w-full h-36 flex items-center justify-center border border-dashed border-card-border/60 rounded text-[11px] text-muted font-mono">
          Select tests with 2+ attempts to see trends
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-card-border/40">
        {visibleLines.map(line => (
          <button
            key={line.testId}
            onClick={() => toggleTest(line.testId)}
            className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 outline-none hover:opacity-70 transition-opacity"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            <span className="text-[9px] font-mono text-muted">{TEST_NAMES[line.testId]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
