import { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

const TOTAL = 12;
const ANGLES = [30, 60, 90, 120, 150, 180];
const PATTERNS = [
  [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
  [[1, 1, 0], [0, 1, 0], [0, 1, 1]],
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [0, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
];

function rotateGrid(grid: number[][], angle: number): number[][] {
  const n = grid.length;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const center = (n - 1) / 2;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!grid[i][j]) continue;
      const x = j - center;
      const y = i - center;
      const newX = Math.round(x * cos - y * sin + center);
      const newY = Math.round(x * sin + y * cos + center);
      if (newX >= 0 && newX < n && newY >= 0 && newY < n) {
        out[newY][newX] = grid[i][j];
      }
    }
  }
  return out;
}

function gridKey(g: number[][]): string {
  return g.map(row => row.join('')).join('|');
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SpatialOrientationTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState<number[][]>([]);
  const [choices, setChoices] = useState<number[][][]>([]);
  const [correctKey, setCorrectKey] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    return () => { submittedRef.current = false; };
  }, []);

  const generateTrial = () => {
    const p = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
    const rotated = rotateGrid(p, angle);
    setTarget(p);
    const key = gridKey(rotated);
    setCorrectKey(key);
    const others = PATTERNS.filter((_, i) => i !== PATTERNS.indexOf(p)).slice(0, 3);
    const opts: number[][][] = shuffle([rotated, ...others.map(o => rotateGrid(o, [0, 90, 180, 270][Math.floor(Math.random() * 4)]))]);
    setChoices(opts);
  };

  const handlePick = (opt: number[][]) => {
    if (phase !== 'playing') return;
    const isCorrect = gridKey(opt) === correctKey;
    const next = trial + 1;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    if (next >= TOTAL) {
      setPhase('done');
      finalize(newCorrect);
      return;
    }
    setCorrectCount(newCorrect);
    setTrial(next);
    setTimeout(generateTrial, 300);
  };

  const finalize = async (c: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const score = Math.round((c / TOTAL) * 100);
    try {
      await dataLayer.saveSession({
        testId: 'spatial-orientation', category: 'processing', rawScore: c, percentile: lookupPercentile(score),
        metadata: { accuracy: Math.round((c / TOTAL) * 100), totalTrials: TOTAL },
      });
    } catch (err) {
      console.error('Failed to save Spatial Orientation session:', err);
    }
    const card = await generateShareCard('Spatial Orientation', `${c}/${TOTAL}`, lookupPercentile(score)).catch(() => '');
    setShareImage(card);
  };

  const lookupPercentile = (s: number): number => {
    const ls = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
    const ps = [0.5, 2, 6, 14, 28, 46, 66, 84, 95, 99, 99.9];
    for (let i = ls.length - 1; i >= 0; i--) if (s >= ls[i]) return ps[i];
    return 0.1;
  };

  const renderGrid = (g: number[][], size = 10) => (
    <svg width={size * 3 + 4} height={size * 3 + 4} viewBox={`-2 -2 ${size * 3 + 4} ${size * 3 + 4}`}>
      {g.map((row, r) => row.map((cell, c) =>
        cell ? <rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size} fill="#d97706" rx={1.5} />
        : null
      ))}
      {g.map((row, r) => row.map((cell, c) =>
        !cell ? <rect key={`e-${r}-${c}`} x={c * size} y={r * size} width={size} height={size} fill="none" stroke="#27272a" strokeWidth={0.5} rx={1.5} />
        : null
      ))}
    </svg>
  );

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-3xl">🧭</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Spatial Orientation</h2>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto mt-2">A pattern has been rotated. Find the <strong className="text-accent">matching rotated version</strong> from 4 choices. 12 trials.</p>
          </div>
          <button onClick={() => { setPhase('playing'); setTrial(0); setCorrectCount(0); generateTrial(); }} className="px-8 h-12 rounded-lg bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-standard active:scale-95 cursor-pointer">Start Test</button>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-5">
          <div className="text-[10px] text-zinc-500 font-mono">Trial {trial + 1}/{TOTAL} · Correct: {correctCount}</div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Original Pattern</div>
            <div className="p-2 rounded-lg bg-subtle border border-card-border">{renderGrid(target, 16)}</div>
          </div>
          <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mt-2">Which is the <strong className="text-accent">rotated</strong> version?</div>
          <div className="grid grid-cols-4 gap-3">
            {choices.map((opt, i) => (
              <button key={i} onClick={() => handlePick(opt)}
                className="p-2 rounded-lg bg-subtle border border-card-border hover:border-accent hover:bg-accent/5 active:scale-95 transition-standard cursor-pointer flex flex-col items-center"
              >
                {renderGrid(opt, 12)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const c = correctCount;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-emerald-400">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{c}/{TOTAL}</div>
        <div className="text-xs text-zinc-500 font-mono">{Math.round((c / TOTAL) * 100)}% accuracy</div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-spatial.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="spatial-orientation" score={c} scoreLabel={`${c}/${TOTAL}`} testName="Spatial Orientation" />
        <button onClick={() => setPhase('intro')} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}
