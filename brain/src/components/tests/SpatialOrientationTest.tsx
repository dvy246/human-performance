import { useState, useEffect, useRef } from 'react';
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

const TOTAL = 12;
const ANGLES = [0, 90, 180, 270];
const PATTERNS = [
  [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
  [[1, 1, 0], [0, 1, 0], [0, 1, 1]],
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [0, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
  [[1, 0, 1], [1, 0, 0], [1, 0, 1]],
  [[0, 1, 1], [1, 1, 0], [1, 0, 0]],
  [[1, 1, 0], [1, 0, 1], [0, 1, 1]],
  [[0, 0, 1], [1, 1, 0], [1, 0, 0]],
  [[1, 0, 0], [0, 1, 1], [1, 0, 1]],
  [[0, 1, 0], [1, 0, 1], [0, 1, 1]],
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
  [[0, 1, 1], [0, 1, 0], [1, 1, 0]],
  [[1, 0, 1], [0, 1, 1], [1, 0, 0]],
  // Additional patterns for variety
  [[1, 1, 0], [0, 1, 0], [0, 0, 1]],  // stair-step
  [[0, 1, 0], [0, 1, 1], [1, 0, 0]],  // reverse stair
  [[1, 0, 0], [1, 1, 0], [0, 1, 0]],  // S-zigzag
  [[0, 0, 1], [0, 1, 0], [1, 1, 0]],  // Z-zigzag
  [[1, 1, 0], [0, 1, 0], [0, 0, 0]],  // small corner
  [[0, 0, 0], [1, 0, 1], [0, 1, 1]],  // bottom-heavy
  [[1, 0, 0], [0, 0, 1], [1, 0, 1]],  // scattered diagonal
  [[0, 1, 0], [1, 0, 0], [1, 1, 0]],  // hook
  [[1, 0, 1], [0, 0, 1], [1, 0, 0]],  // reverse hook
  [[1, 1, 0], [1, 0, 0], [1, 1, 0]],  // U-shape
  [[0, 1, 1], [0, 1, 0], [0, 1, 1]],  // reverse U
  [[1, 0, 0], [1, 0, 1], [0, 0, 1]],  // sparse corner
  [[0, 1, 0], [1, 1, 0], [0, 1, 1]],  // wave
  [[1, 0, 1], [1, 1, 0], [0, 0, 1]],  // asymmetric scatter
  [[0, 0, 1], [1, 0, 1], [1, 1, 0]],  // reverse scatter
  [[1, 1, 0], [0, 0, 1], [1, 0, 1]],  // diamond-offset
  [[0, 1, 1], [1, 0, 0], [0, 1, 0]],  // tilt
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
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Isometric 3D Block Renderer ─────────────────────────────────────────────
const CUBE_W = 24;
const CUBE_H = 14;
const FILL_COLOR = 'var(--chart-accent, #d97706)';
const TOP_COLOR = 'var(--chart-accent, #d97706)';
const LEFT_COLOR = 'var(--chart-accent-light, rgba(217,119,6,0.6))';
const RIGHT_COLOR = 'var(--chart-accent-light, rgba(217,119,6,0.35))';
const GRID_EMPTY_STROKE = 'var(--border-primary)';

function IsometricCube({ cx, cy }: { cx: number; cy: number }) {
  const hw = CUBE_W / 2;
  const hh = CUBE_H / 2;
  return (
    <g>
      {/* Top face */}
      <polygon
        points={`${cx},${cy - CUBE_H} ${cx + hw},${cy - hh} ${cx},${cy} ${cx - hw},${cy - hh}`}
        fill={TOP_COLOR}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
      {/* Left face */}
      <polygon
        points={`${cx - hw},${cy - hh} ${cx},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
        fill={LEFT_COLOR}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
      {/* Right face */}
      <polygon
        points={`${cx + hw},${cy - hh} ${cx},${cy} ${cx},${cy + hh} ${cx + hw},${cy}`}
        fill={RIGHT_COLOR}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
    </g>
  );
}

function IsometricGrid({ grid, cellSize = 1 }: { grid: number[][]; cellSize?: number }) {
  const n = grid.length;
  const isoW = CUBE_W * cellSize;
  const isoH = CUBE_H * cellSize;
  const totalW = n * isoW + isoW;
  const totalH = n * isoH + isoH + CUBE_H * cellSize;
  const offsetX = totalW / 2;
  const offsetY = CUBE_H * cellSize;

  return (
    <svg width={totalW + 10} height={totalH + 10} viewBox={`-5 -5 ${totalW + 10} ${totalH + 10}`}>
      {/* Render empty cell outlines first */}
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (cell) return null;
          const cx = offsetX + (c - r) * (isoW / 2);
          const cy = offsetY + (c + r) * (isoH / 2);
          const hw = isoW / 2;
          const hh = isoH / 2;
          return (
            <polygon
              key={`e-${r}-${c}`}
              points={`${cx},${cy - isoH} ${cx + hw},${cy - hh} ${cx},${cy} ${cx - hw},${cy - hh}`}
              fill="none"
              stroke={GRID_EMPTY_STROKE}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.4"
            />
          );
        })
      )}
      {/* Render filled cubes (back to front for proper overlap) */}
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          const cx = offsetX + (c - r) * (isoW / 2);
          const cy = offsetY + (c + r) * (isoH / 2);
          return (
            <g key={`f-${r}-${c}`} transform={`translate(${cx},${cy}) scale(${cellSize})`}>
              <IsometricCube cx={0} cy={0} />
            </g>
          );
        })
      )}
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function SpatialOrientationTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState<number[][]>([]);
  const [choices, setChoices] = useState<number[][][]>([]);
  const [correctKey, setCorrectKey] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);
  const trialCount = useRef<number>(TOTAL);
  const choicesPerTrial = useRef<number>(4);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');

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
    const others = shuffle(PATTERNS.filter((_, i) => i !== PATTERNS.indexOf(p))).slice(0, 3);
    const opts: number[][][] = shuffle([rotated, ...others.map(o => rotateGrid(o, [0, 90, 180, 270][Math.floor(Math.random() * 4)]))]);
    setChoices(opts);
  };

  const handlePick = (opt: number[][]) => {
    if (phase !== 'playing') return;
    const isCorrect = gridKey(opt) === correctKey;
    const next = trial + 1;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    if (next >= trialCount.current) {
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
    const score = Math.round((c / trialCount.current) * 100);
    try {
      await dataLayer.saveSession({
        testId: 'spatial-orientation', category: 'processing', rawScore: c, percentile: lookupPercentile('spatial-orientation', score),
        metadata: { accuracy: Math.round((c / trialCount.current) * 100), totalTrials: trialCount.current },
      });
    } catch (err) {
      console.error('Failed to save Spatial Orientation session:', err);
    }
    try {
      const card = await generateShareCard('Spatial Orientation', `${c}/${TOTAL}`, lookupPercentile('spatial-orientation', score));
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'spatial-orientation', testName: 'Spatial Orientation', attempts: [score], unit: '%',
      percentile: lookupPercentile('spatial-orientation', score), personalBest: null, category: 'processing', average: score,
    });
  };

  

  const beginTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : TOTAL;
    trialCount.current = attemptCount;
    const diff = getDifficultyParams('spatial-orientation', (cfg.difficulty as string) || 'Medium');
    choicesPerTrial.current = (diff.choicesPerTrial as number) || 4;
    setShareImage(null);
    submittedRef.current = false;
    setPhase('playing');
    setTrial(0);
    setCorrectCount(0);
    generateTrial();
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="spatial-orientation"
            icon="🧊"
            title="Spatial Orientation"
            description="A 3D block structure has been rotated. Identify the matching rotated version from the options."
            onStart={(config: GameConfig) => beginTest(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        <button onClick={() => { submittedRef.current = false; setPhase('intro'); }} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-5">
          <div className="text-[10px] text-muted font-mono">Trial {trial + 1}/{TOTAL} · Correct: {correctCount}</div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] text-muted font-mono uppercase tracking-wider">Original 3D Structure</div>
            <div className="p-3 rounded-lg bg-subtle border border-card-border">
              <IsometricGrid grid={target} cellSize={1.2} />
            </div>
          </div>
          <div className="text-[9px] text-muted font-mono uppercase tracking-wider mt-2">
            Which is the <strong className="text-accent">rotated</strong> version?
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {choices.map((opt, i) => (
              <button key={i} onClick={() => handlePick(opt)}
                className="p-3 rounded-lg bg-subtle border border-card-border hover:border-accent hover:bg-accent/5 active:scale-95 transition-standard cursor-pointer flex items-center justify-center"
              >
                <IsometricGrid grid={opt} cellSize={0.8} />
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
        <div className="text-4xl text-success">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{c}/{trialCount.current}</div>
        <div className="text-xs text-muted font-mono">{Math.round((c / trialCount.current) * 100)}% accuracy</div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-spatial.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="spatial-orientation" score={c} scoreLabel={`${c}/${TOTAL}`} testName="Spatial Orientation" />
        <button onClick={() => { submittedRef.current = false; setPhase('intro'); }} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}

export default withErrorBoundary(SpatialOrientationTest);
