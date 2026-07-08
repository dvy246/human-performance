import { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, GauntletStageResult } from './GauntletTypes';

const TOTAL = 5;
const SHAPES = ['◆', '●', '■', '▲', '★', '✦'];

function genMatrix(): { grid: string[]; options: string[]; correct: number } {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const fill = Math.random() > 0.5 ? 'solid' : 'empty';
  const grid = [
    shape, fill === 'solid' ? shape : '○',
    fill === 'solid' ? '○' : shape, '?'
  ];
  const opts: string[] = [shape]; // First option is always correct
  const usedShapes = new Set([shape]);
  while (opts.length < 4) {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    if (!usedShapes.has(s)) {
      usedShapes.add(s);
      opts.push(s);
    }
  }
  // Shuffle options
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const correctIdx = opts.indexOf(shape);
  return { grid, options: opts, correct: correctIdx };
}

export default function StageMatrix({ onComplete }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [puzzle, setPuzzle] = useState(genMatrix());
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState('');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ct = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);
  useEffect(() => { return ct; }, [ct]);

  const handlePick = (idx: number) => {
    if (phase !== 'playing' || feedback) return;
    const isCorrect = idx === puzzle.correct;
    if (isCorrect) setCorrect(c => c + 1);
    setFeedback(isCorrect ? '✓' : '✗');
    const next = trial + 1;
    if (next >= TOTAL) {
      ct();
      setPhase('done');
      const acc = (correct + (isCorrect ? 1 : 0)) / TOTAL;
      const score = Math.round(acc * 100);
      onComplete({
        stageIndex: 3, stageName: 'Matrix Reasoning', score, rawScore: Math.round(acc * 100),
        category: 'processing', metrics: { accuracy: Math.round(acc * 100), totalPuzzles: TOTAL },
      });
      return;
    }
    setTrial(next);
    st(() => { setFeedback(''); setPuzzle(genMatrix()); }, 500);
  };

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="text-xs text-muted font-mono">Stage 4: Matrix Reasoning</div>
        <p className="text-[10px] text-muted max-w-xs text-center">Find the missing shape that <strong className="text-foreground">completes the pattern</strong>.</p>
        <button onClick={() => { setPhase('playing'); setPuzzle(genMatrix()); }} className="px-6 h-9 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-standard active:scale-95 cursor-pointer">Start</button>
      </div>
    );
  }
  if (phase === 'done') return <div className="text-xs text-success font-mono py-4">✓ {correct}/{TOTAL} correct</div>;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-[10px] text-muted font-mono">Puzzle {trial + 1}/{TOTAL} · {correct} correct</div>
      <div className="grid grid-cols-2 gap-1.5 w-32">
        {puzzle.grid.map((cell, i) => (
          <div key={i} className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg border ${
            cell === '?' ? 'bg-subtle border-dashed border-card-border' : 'bg-card border-card-border'
          }`}>
            {cell === '?' ? '?' : cell}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {puzzle.options.map((opt, i) => (
          <button key={i} onClick={() => handlePick(i)}
            className="w-10 h-10 rounded-lg bg-subtle border border-card-border text-base hover:border-accent active:scale-95 transition-standard cursor-pointer flex items-center justify-center">
            {opt}
          </button>
        ))}
      </div>
      {feedback && <div className={`text-sm font-bold ${feedback === '✓' ? 'text-success' : 'text-error'}`}>{feedback}</div>}
    </div>
  );
}
