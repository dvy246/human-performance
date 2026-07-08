import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const SYMBOLS = ['★', '●', '■', '▲', '◆', '♥', '♦', '♣', '♠', '✿'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Stage1SelectiveAttention({ onComplete, calibrationHz, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'feedback' | 'done'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<{ targetSymbol: string; grid: string[]; targetIdx: number; startTime: number; correct: boolean; rt: number }[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [totalRt, setTotalRt] = useState(0);

  const trialCountRef = useRef(8);
  if (difficulty === 'Easy') trialCountRef.current = 6;
  else if (difficulty === 'Hard') trialCountRef.current = 10;
  else trialCountRef.current = 8;

  const gridSizeRef = useRef(5);
  if (difficulty === 'Easy') gridSizeRef.current = 4;
  else if (difficulty === 'Hard') gridSizeRef.current = 6;
  else gridSizeRef.current = 5;

  const distractorCountRef = useRef(6);
  if (difficulty === 'Easy') distractorCountRef.current = 4;
  else if (difficulty === 'Hard') distractorCountRef.current = 8;
  else distractorCountRef.current = 6;

  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const startTimeRef = useRef(0);

  const generateTrial = useCallback(() => {
    const targetSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const targetIdx = Math.floor(Math.random() * gridSizeRef.current * gridSizeRef.current);
    const grid: string[] = [];
    for (let i = 0; i < gridSizeRef.current * gridSizeRef.current; i++) {
      grid.push(i === targetIdx ? targetSymbol : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    startTimeRef.current = performance.now();
    return { targetSymbol, grid, targetIdx, startTime: performance.now(), correct: false, rt: 0 };
  }, []);

  const startPlaying = () => {
    setPhase('playing');
    setTrials([generateTrial()]);
  };

  const handleCellClick = (idx: number) => {
    if (phase !== 'playing') return;
    const rt = Math.round(performance.now() - startTimeRef.current);
    const correct = idx === trials[trialIndex].targetIdx;
    if (correct) setHitCount(h => h + 1);
    setTotalRt(t => t + rt);

    const updated = [...trials];
    updated[trialIndex] = { ...updated[trialIndex], correct, rt };
    setTrials(updated);

    setPhase('feedback');
    feedbackTimer.current = setTimeout(() => {
      if (trialIndex + 1 >= trialCountRef.current) {
        setPhase('done');
        const accuracy = (hitCount + (correct ? 1 : 0)) / trialCountRef.current;
        const avgRt = (totalRt + rt) / trialCountRef.current;
        const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgRt / 2000) * 100)));
        const score = Math.round(accuracy * 60 + speedScore * 0.4);
        onComplete({
          stageIndex: 0,
          stageName: 'Selective Attention',
          score: Math.min(100, Math.max(0, score)),
          metrics: { accuracy: Math.round(accuracy * 100), avgReactionMs: avgRt },
        });
      } else {
        setTrialIndex(i => i + 1);
        setTrials(prev => [...prev, generateTrial()]);
        setPhase('playing');
      }
    }, 800);
  };

  useEffect(() => {
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, []);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🎯</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 1: Selective Attention</h3>
          <p className="text-secondary text-sm max-w-md">Find and click the <strong className="text-accent">target symbol</strong> shown at the top, ignoring all distractions. {trialCountRef.current} rounds.</p>
        </div>
        <button onClick={startPlaying} className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-standard active:scale-95 cursor-pointer">
          Start Stage
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-4xl text-success">✓</div>
        <p className="text-secondary text-sm">Selective Attention complete!</p>
      </div>
    );
  }

  const currentTrial = trials[trialIndex];
  if (!currentTrial) return null;

  const distractors = Array.from({ length: distractorCountRef.current }, () => ['▲', '△', '▪', '▫', '✦', '✧'][Math.floor(Math.random() * 6)]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-3 text-xs text-muted font-mono">
        <span>Trial {trialIndex + 1} / {trialCountRef.current}</span>
        <span>•</span>
        <span>Hits: {hitCount}</span>
      </div>
      <div className="flex items-center gap-3 py-2 px-4 rounded-lg bg-subtle border border-card-border">
        <span className="text-secondary text-xs font-mono">Find this:</span>
        <span className="text-3xl text-accent">{currentTrial.targetSymbol}</span>
      </div>
      <div className="relative">
        {phase === 'playing' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {distractors.map((d, i) => (
              <span
                key={i}
                className="absolute text-xs text-secondary animate-pulse"
                style={{
                  top: `${10 + (i * 17) % 80}%`,
                  left: `${5 + (i * 23) % 90}%`,
                  animationDelay: `${i * 0.3}s`,
                  fontSize: '8px',
                }}
              >
                {d}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSizeRef.current}, minmax(0, 1fr))`, gap: '0.5rem' }}>
          {currentTrial.grid.map((symbol, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={phase !== 'playing'}
              className={`w-14 h-14 flex items-center justify-center rounded-lg text-xl font-bold transition-all duration-150 cursor-pointer ${
                phase === 'playing'
                  ? 'bg-card border border-card-border hover:border-accent hover:bg-accent/5 active:scale-95 text-foreground'
                  : idx === currentTrial.targetIdx
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-110'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              } ${phase === 'feedback' ? 'pointer-events-none' : ''}`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
      {phase === 'feedback' && (
        <div className={`text-sm font-semibold ${currentTrial.correct ? 'text-success' : 'text-error'}`}>
          {currentTrial.correct ? `✓ ${currentTrial.rt}ms` : '✗ Wrong target'}
        </div>
      )}
    </div>
  );
}
