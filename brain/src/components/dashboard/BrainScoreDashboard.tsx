import { useState, useEffect } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import {
  computeCategoryAverages,
  calculateBbiScore,
  type CognitiveAverages
} from '../../runtime/skillRadar';

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  delta: number;
}

interface CategoryConfig {
  key: keyof CognitiveAverages;
  label: string;
  href: string;
  icon: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'reaction',
    label: 'Reaction',
    href: '/tests/reaction-time',
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
  },
  {
    key: 'memory',
    label: 'Memory',
    href: '/tests/sequence-memory',
    icon: 'M12 2a10 10 0 1 0 10 10 M12 6v6l4 2 M21 3v4h-4'
  },
  {
    key: 'processing',
    label: 'Processing',
    href: '/tests/pattern-reasoning',
    icon: 'M12 2a3 3 0 0 0-3 3v.5M12 2a3 3 0 0 1 3 3v.5M12 2v4M6.5 8.5l3.5-2M6.5 8.5l-3.5 6M10 14l2 6 2-6M17.5 14.5l-3.5-2M17.5 14.5l3.5-2'
  },
  {
    key: 'precision',
    label: 'Precision',
    href: '/tests/aim-trainer',
    icon: 'M12 2a10 10 0 1 0 10 10M12 6a6 6 0 1 0 6 6M12 10a2 2 0 1 0 2 2'
  },
  {
    key: 'focus',
    label: 'Focus',
    href: '/tests/stroop',
    icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  },
  {
    key: 'stamina',
    label: 'Stamina',
    href: '/tests/click-speed',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2'
  }
];

function Icon({ d }: { d: string }) {
  const segments = d.split('M').filter(Boolean);
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
      aria-hidden="true"
    >
      {segments.map((s, i) => (
        <path key={i} d={`M${s}`} />
      ))}
    </svg>
  );
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-subtle animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-3 py-1">
      <SkeletonPulse className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1.5">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-3 w-6" />
        </div>
        <SkeletonPulse className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function ScoreCircle({ score, animate }: { score: number; animate: boolean }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-subtle"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-accent"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out 0.3s' }}
        />
      </svg>
      <span className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
        {score}
      </span>
    </div>
  );
}

export default function BrainScoreDashboard() {
  const [loading, setLoading] = useState(true);
  const [averages, setAverages] = useState<CognitiveAverages | null>(null);
  const [bbiScore, setBbiScore] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const records = await dataLayer.getHistory();
        if (!mounted) return;
        if (records.length > 0) {
          const computed = computeCategoryAverages(records);
          setAverages(computed);
          setBbiScore(calculateBbiScore(computed));
          setHasData(true);

          // Compute trends: compare last 3 sessions to previous 3
          const trendData: Record<string, TrendData> = {};
          const recent = records.slice(0, 3);
          const older = records.slice(3, 6);
          if (older.length > 0) {
            const recentAvg = computeCategoryAverages(recent);
            const olderAvg = computeCategoryAverages(older);
            for (const key of Object.keys(recentAvg) as (keyof CognitiveAverages)[]) {
              const delta = Math.round(recentAvg[key] - olderAvg[key]);
              trendData[key] = {
                direction: delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable',
                delta
              };
            }
          }
          setTrends(trendData);

          // Load streak
          const streakData = dataLayer.getStreak();
          if (mounted) setStreak(streakData.streakCount);
        }
      } catch (err) {
        console.error('Failed to load scores:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          requestAnimationFrame(() => {
            if (mounted) setAnimate(true);
          });
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-card/50 backdrop-blur border border-card-border p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
          <SkeletonPulse className="h-5 w-28" />
        </div>
        {[...Array(6)].map((_, i) => <SkeletonBar key={i} />)}
        <div className="mt-6 pt-6 border-t border-card-border/60 flex justify-center">
          <SkeletonPulse className="w-28 h-28 rounded-full" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-card/50 backdrop-blur border border-card-border p-8 md:p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
            <path d="M21 3v4h-4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">Your Brain</h2>
        <p className="text-secondary text-sm leading-relaxed mb-7 max-w-xs mx-auto">
          Complete any assessment to unlock your personalized cognitive profile with skill bars and a composite index score.
        </p>
        <a
          href="/tests/reaction-time"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold h-11 px-6 text-sm transition-standard active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Start Your First Assessment
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-card/50 backdrop-blur border border-card-border p-6 md:p-8">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
            <path d="M21 3v4h-4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Your Brain</h2>
        {streak > 0 && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-xs">🔥</span>
            <span className="text-[10px] font-mono font-bold text-accent">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2" role="list" aria-label="Cognitive skill scores">
        {CATEGORIES.map((cat, i) => {
          const val = averages?.[cat.key] ?? 0;
          const pct = Math.min(val, 100);
          return (
            <a
              key={cat.key}
              href={cat.href}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-accent/[0.04] transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              role="listitem"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/5 border border-accent/[0.08] flex items-center justify-center shrink-0 group-hover:border-accent/25 group-hover:bg-accent/10 transition-all">
                <Icon d={cat.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[13px] font-medium text-foreground/80 leading-none group-hover:text-accent transition-colors">
                    {cat.label}
                  </span>
                  <span className="text-[12px] font-mono text-muted tabular-nums">
                    {Math.round(val)}
                  </span>
                  {trends[cat.key] && (
                    <span className={`text-[10px] font-mono ml-1 ${
                      trends[cat.key].direction === 'up' ? 'text-success' :
                      trends[cat.key].direction === 'down' ? 'text-error' : 'text-muted'
                    }`}>
                      {trends[cat.key].direction === 'up' ? '↑' :
                       trends[cat.key].direction === 'down' ? '↓' : '→'}
                      {trends[cat.key].delta !== 0 && `${Math.abs(trends[cat.key].delta)}`}
                    </span>
                  )}
                </div>
                <div
                  className="h-1.5 rounded-full bg-subtle overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(val)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.label}: ${Math.round(val)} out of 100`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/50 via-accent/80 to-accent"
                    style={{
                      width: animate ? `${pct}%` : '0%',
                      transition: `width 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`
                    }}
                  />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="mt-7 pt-6 border-t border-card-border/60 flex flex-col items-center gap-1">
        <ScoreCircle score={bbiScore ?? 0} animate={animate} />
        <span className="text-[10px] font-mono text-muted uppercase tracking-[0.15em] mt-1">
          CogniArena Index
        </span>
      </div>
    </div>
  );
}

BrainScoreDashboard.displayName = 'BrainScoreDashboard';
