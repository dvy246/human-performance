import { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, GauntletStageResult } from './GauntletTypes';

const TOTAL_TRIALS = 5;

export default function StageReaction({ onComplete, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'waiting' | 'ready' | 'result' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rafIdRef = useRef<number>(0);
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const delayMinRef = useRef(1500);
  const delayMaxRef = useRef(2500);

  if (difficulty === 'Easy') { delayMinRef.current = 2000; delayMaxRef.current = 3000; }
  else if (difficulty === 'Hard') { delayMinRef.current = 800; delayMaxRef.current = 1500; }
  else { delayMinRef.current = 1500; delayMaxRef.current = 2500; }

  const cleanup = () => { if (timerRef.current) clearTimeout(timerRef.current); if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };

  const startTrial = useCallback(() => {
    setPhase('waiting');
    const delay = delayMinRef.current + Math.random() * (delayMaxRef.current - delayMinRef.current);
    timerRef.current = setTimeout(() => {
      setPhase('ready');
      rafIdRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTimeRef.current = performance.now();
        });
      });
    }, delay);
  }, []);

  const handleClick = () => {
    if (phase === 'intro') {
      cleanup();
      startTrial();
      return;
    }
    if (phase === 'waiting') {
      cleanup();
      startTrial();
      return;
    }
    if (phase === 'ready') {
      cleanup();
      const rt = Math.round(performance.now() - startTimeRef.current);
      const updated = [...results, rt];
      setResults(updated);
      if (updated.length >= TOTAL_TRIALS) {
        const avg = Math.round(updated.reduce((a, b) => a + b, 0) / TOTAL_TRIALS);
        const score = Math.max(0, Math.min(100, Math.round(100 - (avg - 100) / 3)));
        setPhase('done');
        onComplete({
          stageIndex: 0, stageName: 'Visual Reaction', score, rawScore: avg,
          category: 'reaction', metrics: { avgReactionMs: avg, trials: TOTAL_TRIALS },
        });
      } else {
        setTrial(t => t + 1);
        setPhase('result');
        timerRef.current = setTimeout(startTrial, 600);
      }
    }
    if (phase === 'result') {
      startTrial();
    }
  };

  useEffect(() => { return cleanup; }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-xs text-muted font-mono">Stage 1: Visual Reaction &middot; Trial {trial + 1}/{TOTAL_TRIALS}</div>
      <div
        onClick={handleClick}
        className={`w-64 h-40 rounded-xl flex items-center justify-center cursor-pointer select-none border transition-all duration-150 ${
          phase === 'ready' ? 'bg-emerald-600/90 border-emerald-500 scale-105' :
          phase === 'waiting' ? 'bg-rose-500/20 border-rose-500/30' :
          'bg-card border-card-border hover:border-accent'
        }`}
      >
        {phase === 'intro' && <span className="text-sm text-secondary font-mono">Click to start</span>}
        {phase === 'waiting' && <span className="text-sm text-error font-mono animate-pulse">Wait...</span>}
        {phase === 'ready' && <span className="text-2xl font-bold text-white">CLICK!</span>}
        {phase === 'result' && <span className="text-sm text-secondary font-mono">{results[results.length - 1]}ms</span>}
        {phase === 'done' && <span className="text-sm text-success font-mono">✓ Done</span>}
      </div>
    </div>
  );
}
