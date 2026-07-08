import React, { useState, useEffect } from 'react';
import { dataLayer } from '../../runtime/dataLayer';

const ALL_TESTS = [
  'reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction',
  'sequence-memory', 'number-memory', 'visual-pattern', 'dual-n-back', 'verbal-memory',
  'pattern-reasoning', 'spatial-orientation', 'decision-speed', 'planning', 'prioritization',
  'go-no-go', 'stroop', 'tmt-partA', 'tmt-partB', 'focus-challenge',
  'aim-trainer', 'mouse-accuracy', 'flick-trainer', 'click-speed', 'gauntlet',
];

const CATEGORIES: { key: string; label: string; color: string; tests: string[] }[] = [
  { key: 'reaction', label: 'Reaction', color: '#ef4444', tests: ['reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction'] },
  { key: 'memory', label: 'Memory', color: '#8b5cf6', tests: ['sequence-memory', 'number-memory', 'visual-pattern', 'dual-n-back', 'verbal-memory'] },
  { key: 'processing', label: 'Reasoning', color: '#f59e0b', tests: ['pattern-reasoning', 'spatial-orientation', 'decision-speed', 'planning', 'prioritization'] },
  { key: 'focus', label: 'Focus', color: '#3b82f6', tests: ['go-no-go', 'stroop', 'tmt-partA', 'tmt-partB', 'focus-challenge'] },
  { key: 'precision', label: 'Motor', color: '#10b981', tests: ['aim-trainer', 'mouse-accuracy', 'flick-trainer'] },
  { key: 'stamina', label: 'Stamina', color: '#ec4899', tests: ['click-speed'] },
];

export default function CompletionTracker() {
  const [attemptedTests, setAttemptedTests] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function load() {
      const records = await dataLayer.getHistory();
      if (!mounted) return;
      const attempted = new Set(records.map(r => r.testId));
      setAttemptedTests(attempted);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const totalTests = ALL_TESTS.length;
  const completedCount = ALL_TESTS.filter(t => attemptedTests.has(t)).length;
  const overallPercent = Math.round((completedCount / totalTests) * 100);

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">Completion Overview</span>
        <span className="text-sm font-bold font-mono text-foreground">{completedCount}/{totalTests}</span>
      </div>

      {/* Overall progress bar */}
      <div className="flex flex-col gap-2">
        <div className="w-full bg-subtle h-3 rounded-full overflow-hidden border border-card-border/60">
          <div
            className="bg-accent h-full rounded-full transition-all duration-700"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted">
          <span>{completedCount} completed</span>
          <span>{totalTests - completedCount} remaining</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-3">
        {CATEGORIES.map(cat => {
          const catAttempted = cat.tests.filter(t => attemptedTests.has(t)).length;
          const catTotal = cat.tests.length;
          const catPercent = Math.round((catAttempted / catTotal) * 100);

          return (
            <div key={cat.key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-[10px] font-mono text-muted w-16 shrink-0">{cat.label}</span>
              <div className="flex-1 h-2 bg-subtle rounded overflow-hidden border border-card-border/40">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${catPercent}%`, backgroundColor: cat.color, opacity: 0.7 }}
                />
              </div>
              <span className="text-[10px] font-mono text-foreground font-bold w-10 text-right">
                {catAttempted}/{catTotal}
              </span>
            </div>
          );
        })}
      </div>

      {/* Unattempted tests */}
      {completedCount < totalTests && (
        <div className="pt-3 border-t border-card-border/40 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-muted uppercase">Not yet attempted:</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TESTS
              .filter(t => !attemptedTests.has(t))
              .map(t => (
                <a
                  key={t}
                  href={`/tests/${t}`}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-card-border/60 text-muted hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {t.replace(/-/g, ' ')}
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
