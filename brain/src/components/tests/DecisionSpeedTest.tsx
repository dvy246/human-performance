import { useState, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';

const TOTAL = 20;
const TIMEOUT_MS = 2000;

function DecisionSpeedTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [number, setNumber] = useState(50);
  const [results, setResults] = useState<{ correct: boolean; rt: number }[]>([]);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const startRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const respondedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);
  const trialCount = useRef<number>(TOTAL);
  const timeoutMs = useRef<number>(TIMEOUT_MS);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');

  const genNumber = () => {
    const n = Math.floor(Math.random() * 98) + 1;
    setNumber(n);
    startRef.current = performance.now();
    respondedRef.current = false;
    timeoutRef.current = setTimeout(() => {
      if (!respondedRef.current) {
        setResults(prev => {
          const next = [...prev, { correct: false, rt: timeoutMs.current }];
          advance(next);
          return next;
        });
      }
    }, TIMEOUT_MS);
  };

  const handleAnswer = (answer: 'high' | 'low') => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rt = Math.round(performance.now() - startRef.current);
    const correct = (answer === 'high' && number >= 50) || (answer === 'low' && number < 50);
    setResults(prev => {
      const next = [...prev, { correct, rt }];
      advance(next);
      return next;
    });
  };

  const advance = (r: { correct: boolean; rt: number }[]) => {
    setTrial(prev => {
      const next = prev + 1;
      if (next >= trialCount.current) {
        setPhase('done');
        finalize(r);
        return prev;
      }
      setTimeout(genNumber, 300);
      return next;
    });
  };

  const finalize = async (r: { correct: boolean; rt: number }[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const correctCount = r.filter(x => x.correct).length;
    const acc = correctCount / trialCount.current;
    const avgRt = Math.round(r.reduce((s, x) => s + x.rt, 0) / r.length);
    const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgRt - 300) / 15)));
    const score = Math.round(acc * 60 + speedScore * 0.4);
    try {
      await dataLayer.saveSession({
        testId: 'decision-speed', category: 'processing', rawScore: Math.round(acc * 100), percentile: lookupPercentile('decision-speed', score),
        metadata: { accuracy: Math.round(acc * 100), avgReactionMs: avgRt },
      });
    } catch (err) {
      console.error('Failed to save Decision Speed session:', err);
    }

    try {
      const card = await generateShareCard('Decision Speed Test', `${Math.round(acc * 100)}%`, lookupPercentile('decision-speed', score));
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'decision-speed', testName: 'Decision Speed', attempts: r.map(x => x.rt), unit: 'ms',
      percentile: lookupPercentile('decision-speed', score), personalBest: null, category: 'processing', average: avgRt,
    });
  };

  

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : TOTAL;
    trialCount.current = attemptCount;
    const diff = getDifficultyParams('decision-speed', (cfg.difficulty as string) || 'Medium');
    timeoutMs.current = (diff.timeoutMs as number) || TIMEOUT_MS;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    submittedRef.current = false;
    setPhase('playing');
    setTrial(0);
    setResults([]);
    setTimeout(genNumber, 500);
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="decision-speed"
            icon="⚡"
            title="Decision Speed"
            description="Is the number greater or less than 50? Answer as quickly as possible."
            onStart={(config: GameConfig) => startTest(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="text-[10px] text-muted font-mono">Trial {trial + 1}/{TOTAL} · {results.filter(r => r.correct).length} correct</div>
          <div className="text-7xl font-bold text-foreground tabular-nums animate-in zoom-in-50 duration-150">{number}</div>
          <div className="flex gap-4">
            <button onClick={() => handleAnswer('high')} className="px-10 h-14 rounded-xl bg-[var(--success-bg)] border-2 border-[var(--success-border)] text-success font-bold text-lg hover:bg-[var(--success-border)] active:scale-95 transition-standard cursor-pointer">≥ 50</button>
            <button onClick={() => handleAnswer('low')} className="px-10 h-14 rounded-xl bg-[var(--error-bg)] border-2 border-[var(--error-border)] text-error font-bold text-lg hover:bg-[var(--error-border)] active:scale-95 transition-standard cursor-pointer">&lt; 50</button>
          </div>
        </div>
      </div>
    );
  }

  const c = results.filter(r => r.correct).length;
  const a = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.rt, 0) / results.length) : 0;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-success">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{c}/{TOTAL}</div>
        <div className="text-xs text-muted font-mono">{Math.round((c / TOTAL) * 100)}% · {a}ms avg</div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-decision-speed.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="decision-speed" score={c} scoreLabel={`${c}/${TOTAL}`} testName="Decision Speed Test" />
        <button onClick={() => setPhase('intro')} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}

export default withErrorBoundary(DecisionSpeedTest);
