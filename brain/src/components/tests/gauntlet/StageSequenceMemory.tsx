import { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, GauntletStageResult } from './GauntletTypes';

const GRID = [
  [0, 0], [0, 1], [0, 2],
  [1, 0], [1, 1], [1, 2],
  [2, 0], [2, 1], [2, 2],
];

export default function StageSequenceMemory({ onComplete }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'watching' | 'recall' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [seq, setSeq] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const seqRef = useRef<number[]>([]);
  const userRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const ct = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const playSeq = useCallback((s: number[], idx = 0) => {
    if (idx >= s.length) {
      setActiveIdx(null);
      st(() => { ct(); setPhase('recall'); setUserSeq([]); userRef.current = []; }, 400);
      return;
    }
    setActiveIdx(s[idx]);
    st(() => {
      setActiveIdx(null);
      st(() => playSeq(s, idx + 1), 200);
    }, 400);
  }, [st, ct]);

  const startLevel = useCallback((lvl: number) => {
    const len = Math.min(3 + lvl, 8);
    const s: number[] = [];
    for (let i = 0; i < len; i++) s.push(Math.floor(Math.random() * GRID.length));
    seqRef.current = s;
    setSeq(s);
    userRef.current = [];
    setUserSeq([]);
    setPhase('watching');
    st(() => playSeq(s, 0), 400);
  }, [st, playSeq]);

  const handleCellClick = (cellIdx: number) => {
    if (phase !== 'recall') return;
    const nextIdx = userRef.current.length;
    if (nextIdx >= seqRef.current.length) return;
    const correct = cellIdx === seqRef.current[nextIdx];
    const updated = [...userRef.current, cellIdx];
    userRef.current = updated;
    setUserSeq(updated);
    if (!correct) {
      ct();
      const MAX_LEVEL = 10;
      const score = Math.max(0, Math.min(100, Math.round((correctCount / MAX_LEVEL) * 70 + 30)));
      if (completedRef.current) return;
      completedRef.current = true;
      setPhase('done');
      onComplete({
        stageIndex: 1, stageName: 'Sequence Memory', score, rawScore: correctCount,
        category: 'memory', metrics: { maxLevel: correctCount, totalLevels: level },
      });
      return;
    }
    if (nextIdx + 1 >= seqRef.current.length) {
      ct();
      setCorrectCount(level);
      const next = level + 1;
      if (next > 10) {
        if (completedRef.current) return;
        completedRef.current = true;
        setPhase('done');
        onComplete({
          stageIndex: 1, stageName: 'Sequence Memory', score: 100, rawScore: 10,
          category: 'memory', metrics: { maxLevel: 10, totalLevels: 10 },
        });
        return;
      }
      setLevel(next);
      st(() => startLevel(next), 500);
    }
  };

  const startGame = () => { setLevel(1); setCorrectCount(0); completedRef.current = false; startLevel(1); };
  useEffect(() => { return ct; }, [ct]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="text-xs text-muted font-mono">Stage 2: Sequence Memory</div>
        <button onClick={startGame} className="px-6 h-9 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-standard active:scale-95 cursor-pointer">Start</button>
      </div>
    );
  }
  if (phase === 'done') {
    return <div className="text-xs text-success font-mono py-4">✓ Level {correctCount} reached</div>;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-[10px] text-muted font-mono">{phase === 'watching' ? '👀 Watch' : '🎯 Recall'} · Level {level} · Seq: {Math.min(3 + level, 8)}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {GRID.map((_, i) => (
          <button key={i} onClick={() => handleCellClick(i)}
            disabled={phase !== 'recall'}
            className={`w-12 h-12 rounded-lg border transition-all duration-100 ${
              activeIdx === i ? 'bg-accent border-accent scale-110' :
              userSeq.includes(i) ? 'bg-emerald-500/30 border-emerald-500/50' :
              'bg-card border-card-border'
            } ${phase === 'recall' ? 'hover:border-accent cursor-pointer' : ''}`}
          />
        ))}
      </div>
      {phase === 'recall' && <div className="text-[10px] text-muted font-mono">{userSeq.length}/{seq.length}</div>}
    </div>
  );
}
