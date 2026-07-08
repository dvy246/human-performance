import React, { useState, useEffect } from 'react';
import { formatTopPercentile } from '../../runtime/percentileLookup';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';

const TEST_NAMES: Record<string, string> = {
  'reaction-time': 'Visual Reaction Test',
  'f1-lights': 'F1 Start Lights',
  'go-no-go': 'Color Go/No-Go',
  'choice-reaction': 'Choice Grid',
  'sound-reaction': 'Sound Reflex Test',
  'click-speed': 'Click Speed (CPS)',
  'aim-trainer': 'Aim Precision',
  'sequence-memory': 'Sequence Memory',
  'number-memory': 'Number Memory',
  'visual-pattern': 'Visual Pattern Memory',
  'stroop': 'Stroop Attention Test',
  'pattern-reasoning': 'Pattern Reasoning Test',
  'tmt-partA': 'Trail Making (Part A)',
  'tmt-partB': 'Trail Making (Part B)',
  'dual-n-back': 'Dual N-Back Memory',
  'focus-challenge': 'Focus Challenge',
  'gauntlet': 'The Gauntlet',
  'verbal-memory': 'Verbal Memory Test',
  'spatial-orientation': 'Spatial Orientation Test',
  'mouse-accuracy': 'Mouse Accuracy Test',
  'flick-trainer': 'Flick Trainer',
  'decision-speed': 'Decision Speed Test',
  'planning': 'Planning Test',
  'prioritization': 'Prioritization Test',
};

const TEST_CODES: Record<string, string> = {
  'reaction-time': 'RT-001', 'f1-lights': 'RT-002', 'sound-reaction': 'RT-003',
  'choice-reaction': 'RT-004', 'go-no-go': 'FC-001', 'click-speed': 'ST-001',
  'aim-trainer': 'MP-001', 'sequence-memory': 'MM-001', 'number-memory': 'MM-002',
  'visual-pattern': 'MM-003', 'dual-n-back': 'MM-004', 'verbal-memory': 'MM-005',
  'stroop': 'FA-001', 'tmt-partA': 'FA-002', 'tmt-partB': 'FA-003',
  'focus-challenge': 'FA-004', 'pattern-reasoning': 'RF-001', 'spatial-orientation': 'RF-002',
  'decision-speed': 'RF-003', 'planning': 'EF-001', 'prioritization': 'EF-002',
  'mouse-accuracy': 'MP-002', 'flick-trainer': 'MP-003', 'gauntlet': 'FL-001',
};

const TEST_SLUGS: Record<string, string> = {
  'reaction-time': 'reaction-time', 'f1-lights': 'f1-lights', 'sound-reaction': 'sound-reaction',
  'choice-reaction': 'choice-reaction', 'go-no-go': 'go-no-go', 'click-speed': 'click-speed',
  'aim-trainer': 'aim-trainer', 'sequence-memory': 'sequence-memory', 'number-memory': 'number-memory',
  'visual-pattern': 'visual-pattern', 'dual-n-back': 'dual-n-back', 'verbal-memory': 'verbal-memory',
  'stroop': 'stroop', 'tmt-partA': 'trail-making', 'tmt-partB': 'trail-making',
  'focus-challenge': 'focus-challenge', 'pattern-reasoning': 'pattern-reasoning',
  'spatial-orientation': 'spatial-orientation', 'decision-speed': 'decision-speed',
  'planning': 'planning', 'prioritization': 'prioritization',
  'mouse-accuracy': 'mouse-accuracy', 'flick-trainer': 'flick-trainer', 'gauntlet': 'gauntlet',
};

const CATEGORIES: Record<string, { label: string; color: string; tests: string[] }> = {
  reaction: { label: 'Reaction & Reflexes', color: '#ef4444', tests: ['reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction'] },
  memory: { label: 'Memory', color: '#8b5cf6', tests: ['sequence-memory', 'number-memory', 'visual-pattern', 'dual-n-back', 'verbal-memory'] },
  processing: { label: 'Reasoning', color: '#f59e0b', tests: ['pattern-reasoning', 'spatial-orientation', 'decision-speed', 'planning', 'prioritization'] },
  precision: { label: 'Motor Performance', color: '#10b981', tests: ['aim-trainer', 'mouse-accuracy', 'flick-trainer'] },
  focus: { label: 'Focus & Attention', color: '#3b82f6', tests: ['go-no-go', 'stroop', 'tmt-partA', 'tmt-partB', 'focus-challenge'] },
  stamina: { label: 'Executive Function', color: '#ec4899', tests: ['click-speed'] },
};

interface TestSummary {
  testId: string;
  attempts: number;
  personalBest: number | null;
  lastScore: number | null;
  lastPercentile: number | null;
}

const formatScore = (testId: string, score: number): string => {
  if (testId === 'click-speed') return `${(score / 10).toFixed(1)} CPS`;
  if (testId === 'sequence-memory' || testId === 'visual-pattern') return `Lvl ${score}`;
  if (testId === 'number-memory') return `${score} digits`;
  return `${score} ms`;
};

export default function TestSummaryGrid() {
  const [summaries, setSummaries] = useState<Map<string, TestSummary>>(new Map());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const records = await dataLayer.getHistory();
      if (!mounted) return;

      const map = new Map<string, TestSummary>();
      const allTestIds = Object.keys(TEST_NAMES);

      for (const testId of allTestIds) {
        const testRecords = records.filter(r => r.testId === testId);
        if (testRecords.length === 0) {
          map.set(testId, { testId, attempts: 0, personalBest: null, lastScore: null, lastPercentile: null });
        } else {
          const sorted = [...testRecords].sort((a, b) => b.timestamp - a.timestamp);
          const isLower = testId !== 'click-speed' && testId !== 'sequence-memory' && testId !== 'number-memory' && testId !== 'visual-pattern' && testId !== 'pattern-reasoning' && testId !== 'planning' && testId !== 'prioritization';
          const scores = testRecords.map(r => r.rawScore);
          const pb = isLower ? Math.min(...scores) : Math.max(...scores);
          map.set(testId, {
            testId,
            attempts: testRecords.length,
            personalBest: pb,
            lastScore: sorted[0].rawScore,
            lastPercentile: sorted[0].percentile,
          });
        }
      }
      setSummaries(map);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => prev === cat ? null : cat);
  };

  const getRelatedTests = (testId: string): { name: string; slug: string }[] => {
    for (const cat of Object.values(CATEGORIES)) {
      if (cat.tests.includes(testId)) {
        return cat.tests
          .filter(t => t !== testId)
          .slice(0, 3)
          .map(t => ({ name: TEST_NAMES[t] || t, slug: TEST_SLUGS[t] || t }));
      }
    }
    return [];
  };

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(CATEGORIES).map(([catKey, cat]) => {
        const catTests = cat.tests.map(t => summaries.get(t)).filter(Boolean) as TestSummary[];
        const attemptedCount = catTests.filter(t => t.attempts > 0).length;
        const isExpanded = expandedCategory === catKey;

        return (
          <div key={catKey} className="rounded-xl border border-card-border bg-card shadow overflow-hidden">
            <button
              onClick={() => toggleCategory(catKey)}
              className="w-full flex items-center justify-between p-4 cursor-pointer bg-transparent border-0 outline-none text-left hover:bg-subtle/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-bold text-foreground">{cat.label}</span>
                <span className="text-[10px] font-mono text-muted bg-subtle px-2 py-0.5 rounded">
                  {attemptedCount}/{cat.tests.length} attempted
                </span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 16 16"
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-0">
                {cat.tests.map(testId => {
                  const summary = summaries.get(testId);
                  if (!summary) return null;
                  const attempted = summary.attempts > 0;
                  const related = getRelatedTests(testId);

                  return (
                    <div
                      key={testId}
                      className={`rounded-lg border p-4 flex flex-col gap-2 transition-standard ${
                        attempted
                          ? 'border-card-border bg-subtle/30'
                          : 'border-dashed border-card-border/60 bg-subtle/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted">{TEST_CODES[testId] || '???'}</span>
                        {attempted ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                            Top {formatTopPercentile(summary.lastPercentile || 0)}%
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-subtle text-muted border border-card-border/60">
                            Not attempted
                          </span>
                        )}
                      </div>

                      <a href={`/tests/${TEST_SLUGS[testId] || testId}`} className="text-sm font-bold text-foreground hover:text-accent transition-colors">
                        {TEST_NAMES[testId] || testId}
                      </a>

                      {attempted ? (
                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                          <div className="flex justify-between text-muted">
                            <span>Personal Best</span>
                            <span className="text-foreground font-bold">
                              {summary.personalBest !== null ? formatScore(testId, summary.personalBest) : '--'}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted">
                            <span>Last Score</span>
                            <span className="text-foreground">
                              {summary.lastScore !== null ? formatScore(testId, summary.lastScore) : '--'}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted">
                            <span>Attempts</span>
                            <span className="text-foreground">{summary.attempts}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted italic">Complete this test to see your stats.</p>
                      )}

                      {related.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-card-border/40">
                          <span className="text-[9px] font-mono text-muted uppercase mr-1">Related:</span>
                          {related.map(r => (
                            <a
                              key={r.slug}
                              href={`/tests/${r.slug}`}
                              className="text-[10px] font-mono text-accent/70 hover:text-accent transition-colors"
                            >
                              {r.name} →
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
