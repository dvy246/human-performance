import React, { useState, useEffect } from 'react';
import { useI18n } from '../../runtime/useI18n';
import { formatTopPercentile } from '../../runtime/percentileLookup';

interface ResultData {
  testId: string;
  testName: string;
  attempts: number[];
  unit: string;
  percentile: number;
  personalBest: number | null;
  category: string;
  average: number;
}

const RELATED_TESTS: Record<string, { name: string; slug: string }[]> = {
  'reaction-time': [{ name: 'F1 Lights', slug: 'f1-lights' }, { name: 'Sound Reflex', slug: 'sound-reaction' }, { name: 'Choice Grid', slug: 'choice-reaction' }],
  'f1-lights': [{ name: 'Visual Reaction', slug: 'reaction-time' }, { name: 'Sound Reflex', slug: 'sound-reaction' }],
  'sound-reaction': [{ name: 'Visual Reaction', slug: 'reaction-time' }, { name: 'F1 Lights', slug: 'f1-lights' }],
  'choice-reaction': [{ name: 'Decision Speed', slug: 'decision-speed' }, { name: 'Stroop', slug: 'stroop' }],
  'go-no-go': [{ name: 'Stroop', slug: 'stroop' }, { name: 'Trail Making', slug: 'trail-making' }],
  'click-speed': [{ name: 'Aim Trainer', slug: 'aim-trainer' }, { name: 'Typing Speed', slug: 'typing-speed' }],
  'aim-trainer': [{ name: 'Mouse Accuracy', slug: 'mouse-accuracy' }, { name: 'Flick Trainer', slug: 'flick-trainer' }],
  'sequence-memory': [{ name: 'Number Memory', slug: 'number-memory' }, { name: 'Visual Pattern', slug: 'visual-pattern' }],
  'number-memory': [{ name: 'Sequence Memory', slug: 'sequence-memory' }, { name: 'Verbal Memory', slug: 'verbal-memory' }],
  'visual-pattern': [{ name: 'Sequence Memory', slug: 'sequence-memory' }, { name: 'Spatial Orientation', slug: 'spatial-orientation' }],
  'stroop': [{ name: 'Go/No-Go', slug: 'go-no-go' }, { name: 'Trail Making', slug: 'trail-making' }],
  'pattern-reasoning': [{ name: 'Spatial Orientation', slug: 'spatial-orientation' }, { name: 'Planning', slug: 'planning' }],
  'trail-making': [{ name: 'Stroop', slug: 'stroop' }, { name: 'Go/No-Go', slug: 'go-no-go' }],
  'dual-n-back': [{ name: 'Sequence Memory', slug: 'sequence-memory' }, { name: 'Number Memory', slug: 'number-memory' }],
  'verbal-memory': [{ name: 'Number Memory', slug: 'number-memory' }, { name: 'Visual Pattern', slug: 'visual-pattern' }],
  'spatial-orientation': [{ name: 'Visual Pattern', slug: 'visual-pattern' }, { name: 'Pattern Reasoning', slug: 'pattern-reasoning' }],
  'decision-speed': [{ name: 'Choice Reaction', slug: 'choice-reaction' }, { name: 'Planning', slug: 'planning' }],
  'planning': [{ name: 'Prioritization', slug: 'prioritization' }, { name: 'Decision Speed', slug: 'decision-speed' }],
  'prioritization': [{ name: 'Planning', slug: 'planning' }, { name: 'Decision Speed', slug: 'decision-speed' }],
  'mouse-accuracy': [{ name: 'Aim Trainer', slug: 'aim-trainer' }, { name: 'Flick Trainer', slug: 'flick-trainer' }],
  'flick-trainer': [{ name: 'Aim Trainer', slug: 'aim-trainer' }, { name: 'Mouse Accuracy', slug: 'mouse-accuracy' }],
};

function getPersonalizedMessage(data: ResultData): { emoji: string; title: string; subtitle: string } {
  const { attempts, average, percentile, personalBest, testId } = data;
  const isLowerBetter = !['click-speed', 'sequence-memory', 'number-memory', 'visual-pattern', 'pattern-reasoning', 'planning', 'prioritization'].includes(testId);

  // Check if new personal best
  const isNewPB = personalBest !== null && (
    isLowerBetter ? average <= personalBest : average >= personalBest
  );

  // Check trend (improving?)
  let improving = false;
  if (attempts.length >= 3) {
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    improving = isLowerBetter ? secondAvg < firstAvg : secondAvg > firstAvg;
  }

  if (isNewPB && percentile >= 80) {
    return { emoji: '🏆', title: 'New Personal Best!', subtitle: `Outstanding! You're in the top ${formatTopPercentile(percentile)}% globally. A truly elite performance.` };
  }
  if (isNewPB) {
    return { emoji: '🎉', title: 'New Personal Best!', subtitle: `You beat your previous record! Keep pushing to climb the rankings.` };
  }
  if (percentile >= 90) {
    return { emoji: '⚡', title: 'Elite Performance!', subtitle: `You're in the top ${formatTopPercentile(percentile)}% — among the best. Can you reach #1?` };
  }
  if (percentile >= 70) {
    return { emoji: '🔥', title: 'Strong Showing!', subtitle: `Top ${formatTopPercentile(percentile)}% — you're well above average. A few more drills and you'll be elite.` };
  }
  if (improving) {
    return { emoji: '📈', title: 'Trending Upward!', subtitle: `Your attempts got progressively better. Keep practicing to see bigger gains!` };
  }
  if (percentile >= 40) {
    return { emoji: '💪', title: 'Solid Effort!', subtitle: `You're in the top ${formatTopPercentile(percentile)}%. Consistent practice will push you higher.` };
  }
  return { emoji: '🌱', title: 'Room to Grow!', subtitle: `Every expert was once a beginner. Try again to improve your score!` };
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export default function TestResultsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<ResultData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cogniarena-last-result');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch { /* ignore */ }
  }, []);

  if (!data) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 flex flex-col items-center justify-center text-center gap-4">
        <span className="text-4xl">🔍</span>
        <h2 className="text-xl font-bold text-foreground">{t('results.no_results')}</h2>
        <p className="text-muted text-sm">{t('results.no_results_desc')}</p>
        <a href="/" className="px-6 h-10 rounded bg-accent hover:bg-accent-hover text-white font-semibold text-xs font-mono uppercase flex items-center transition-standard">
          {t('results.back_home')}
        </a>
      </div>
    );
  }

  const msg = getPersonalizedMessage(data);
  const { attempts, unit, percentile, personalBest, average } = data;
  const min = Math.min(...attempts);
  const max = Math.max(...attempts);
  const stdDev = Math.round(computeStdDev(attempts, average) * 10) / 10;
  const related = RELATED_TESTS[data.testId] || [];

  // Bar chart calculations
  const bestVal = Math.min(...attempts);
  const worstVal = Math.max(...attempts);
  const range = worstVal - bestVal || 1;

  const formatScore = (val: number) => {
    if (data.testId === 'click-speed') return `${(val / 10).toFixed(1)} CPS`;
    if (['sequence-memory', 'visual-pattern'].includes(data.testId)) return `Lvl ${val}`;
    if (data.testId === 'number-memory') return `${val} digits`;
    return `${Math.round(val)} ${unit}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 py-4">
      {/* Trophy Header */}
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <span className="text-6xl select-none">{msg.emoji}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{msg.title}</h1>
        <p className="text-muted text-sm max-w-md leading-relaxed">{msg.subtitle}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-mono font-extrabold text-foreground">{formatScore(average)}</span>
          <span className="text-accent text-sm font-medium">Top {formatTopPercentile(percentile)}%</span>
        </div>
      </div>

      {/* Per-Attempt Bar Chart */}
      <div className="rounded-xl border border-card-border bg-card p-5 shadow flex flex-col gap-4">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">{t('results.attempt_breakdown')}</span>
        <div className="flex items-end gap-2 h-32">
          {attempts.map((val, idx) => {
            const heightPercent = Math.max(10, ((worstVal - val) / range) * 80 + 20);
            const isBest = val === bestVal;
            const isWorst = val === worstVal && attempts.length > 1;
            const barColor = isBest ? '#10b981' : isWorst ? '#ef4444' : '#f59e0b';

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-mono text-foreground font-bold">{formatScore(val)}</span>
                <div
                  className="w-full rounded-t-sm transition-all duration-300 min-w-[20px]"
                  style={{ height: `${heightPercent}%`, backgroundColor: barColor, opacity: 0.85 }}
                />
                <span className="text-[9px] font-mono text-muted">#{idx + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-[9px] font-mono text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('results.best')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {t('results.average')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> {t('results.slowest')}</span>
        </div>
      </div>

      {/* Trend Line */}
      {attempts.length >= 2 && (
        <div className="rounded-xl border border-card-border bg-card p-5 shadow flex flex-col gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-muted">{t('results.trend')}</span>
          <svg viewBox="0 0 300 80" className="w-full h-20 overflow-visible">
            {(() => {
              const pad = 20;
              const w = 300 - pad * 2;
              const h = 80 - pad;
              const vals = attempts;
              const minV = Math.min(...vals);
              const maxV = Math.max(...vals);
              const rng = maxV - minV || 1;
              const points = vals.map((v, i) => {
                const x = pad + (i / (vals.length - 1)) * w;
                const y = h - ((v - minV) / rng) * (h - 10) + 5;
                return { x, y };
              });
              return (
                <>
                  <line x1={pad} y1={h} x2={300 - pad} y2={h} stroke="var(--color-card-border)" strokeWidth="0.5" />
                  <path d={`M ${points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`} fill="none" stroke="var(--chart-accent)" strokeWidth="2" />
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg-card)" stroke="var(--chart-accent)" strokeWidth="1.5">
                      <title>{`Attempt ${i + 1}: ${formatScore(vals[i])}`}</title>
                    </circle>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: t('results.min'), value: formatScore(min) },
          { label: t('results.max'), value: formatScore(max) },
          { label: t('results.avg'), value: formatScore(average) },
          { label: t('results.std_dev'), value: `${stdDev} ${unit}` },
          { label: t('results.percentile'), value: `Top ${formatTopPercentile(percentile)}%` },
        ].map((stat, i) => (
          <div key={i} className="rounded-lg border border-card-border bg-card p-3 flex flex-col items-center text-center">
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">{stat.label}</span>
            <span className="text-sm font-bold font-mono text-foreground mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Personal Best Comparison */}
      {personalBest !== null && (
        <div className="p-4 rounded-lg bg-subtle border border-card-border flex items-center justify-between text-xs">
          <span className="text-muted font-mono">{t('results.pb_all')}</span>
          <span className="text-foreground font-bold font-mono">{formatScore(personalBest)}</span>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href={`/tests/${data.testId}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs font-mono uppercase h-10 transition-standard"
        >
          {t('results.play_again')}
        </a>
        <a
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel font-semibold text-xs font-mono uppercase h-10 transition-standard"
        >
          {t('results.dashboard')}
        </a>
        <a
          href={`/tests/${data.testId}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel font-semibold text-xs font-mono uppercase h-10 transition-standard"
        >
          {t('results.challenge')}
        </a>
      </div>

      {/* Related Tests */}
      {related.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-card-border/40">
          <span className="text-xs font-mono uppercase tracking-widest text-muted">{t('results.related')}</span>
          <div className="flex flex-wrap gap-2">
            {related.map(r => (
              <a
                key={r.slug}
                href={`/tests/${r.slug}`}
                className="px-3 py-1.5 rounded-lg border border-card-border bg-subtle text-xs text-muted hover:border-accent hover:text-foreground transition-colors"
              >
                {r.name} →
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
