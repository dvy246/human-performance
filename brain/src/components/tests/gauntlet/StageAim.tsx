import { useState, useRef, useCallback, useEffect } from 'react';
import type { StageProps, GauntletStageResult } from './GauntletTypes';

const TOTAL_TARGETS = 20;
const RADIUS = 20;

export default function StageAim({ onComplete }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [targets, setTargets] = useState<{ x: number; y: number; hit: boolean }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalOffset, setTotalOffset] = useState(0);
  const [hits, setHits] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const spawnTarget = useCallback((idx: number) => {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const margin = RADIUS + 5;
    const x = margin + Math.random() * (rect.width - margin * 2);
    const y = margin + Math.random() * (rect.height - margin * 2);
    setTargets(prev => {
      const copy = [...prev];
      copy[idx] = { x, y, hit: false };
      return copy;
    });
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (phase !== 'playing' || currentIdx >= TOTAL_TARGETS) return;
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const t = targets[currentIdx];
    if (!t || t.hit) return;
    const offset = Math.sqrt((clickX - t.x) ** 2 + (clickY - t.y) ** 2);
    setTotalOffset(o => o + offset);
    if (offset <= RADIUS) setHits(h => h + 1);
    setTargets(prev => {
      const copy = [...prev];
      copy[currentIdx] = { ...copy[currentIdx], hit: true };
      return copy;
    });
    const next = currentIdx + 1;
    if (next >= TOTAL_TARGETS) {
      const avgOffset = (totalOffset + offset) / TOTAL_TARGETS;
      const hitPct = (hits + (offset <= RADIUS ? 1 : 0)) / TOTAL_TARGETS;
      const score = Math.round(hitPct * 70 + Math.max(0, Math.min(30, 30 - avgOffset / 2)));
      setPhase('done');
      onComplete({
        stageIndex: 4, stageName: 'Aim Precision', score, rawScore: Math.round(avgOffset),
        category: 'precision', metrics: { accuracy: Math.round(hitPct * 100), avgOffsetPx: Math.round(avgOffset * 10) / 10 },
      });
      return;
    }
    setCurrentIdx(next);
    spawnTarget(next);
  };

  const startGame = () => {
    setPhase('playing');
    setCurrentIdx(0);
    setHits(0);
    setTotalOffset(0);
    const initial: { x: number; y: number; hit: boolean }[] = [];
    for (let i = 0; i < TOTAL_TARGETS; i++) initial.push({ x: 100 + i * 10, y: 100, hit: false });
    setTargets(initial);
    spawnTimerRef.current = setTimeout(() => spawnTarget(0), 100);
  };

  useEffect(() => { return () => { if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current); }; }, []);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="text-xs text-muted font-mono">Stage 5: Aim Precision</div>
        <p className="text-[10px] text-muted max-w-xs text-center">Click the <strong className="text-foreground">red target</strong> as accurately as possible. {TOTAL_TARGETS} targets.</p>
        <button onClick={startGame} className="px-6 h-9 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-standard active:scale-95 cursor-pointer">Start</button>
      </div>
    );
  }
  if (phase === 'done') return <div className="text-xs text-success font-mono py-4">✓ {hits}/{TOTAL_TARGETS} hits</div>;

  const current = targets[currentIdx];

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative w-full h-48 rounded-xl bg-subtle border border-card-border cursor-crosshair overflow-hidden"
    >
      {current && !current.hit && (
        <div
          className="absolute w-10 h-10 rounded-full bg-rose-500/60 border-2 border-rose-400 -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: current.x, top: current.y }}
        />
      )}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted font-mono">
        {currentIdx}/{TOTAL_TARGETS} · Hits: {hits}
      </div>
    </div>
  );
}
