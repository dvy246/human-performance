import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVisibilityGuard } from '../../../runtime/useVisibilityGuard';
import type { StageProps, StageResult } from './StageTypes';

const MAX_LEVEL = 10;
const GRID_POSITIONS = [
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
];

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
const DISTRACTOR_SYMBOLS = ['✦', '◆', '★', '●', '▪', '✧'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type GridCell = { row: number; col: number; color: string };

export default function Stage5WorkingMemoryUnderDistraction({ onComplete, calibrationHz, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'encoding' | 'recall' | 'feedback' | 'done'>('intro');
  const [showHelp, setShowHelp] = useState(false);
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<GridCell[]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [userSequence, setUserSequence] = useState<GridCell[]>([]);
  const [maxLevelReached, setMaxLevelReached] = useState(0);
  const [distractors, setDistractors] = useState<{ id: number; symbol: string; row: number; col: number }[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const levelRef = useRef(1);
  const seqRef = useRef<GridCell[]>([]);
  const userSeqRef = useRef<GridCell[]>([]);
  const maxLevelRef = useRef(0);
  const encodingRef = useRef(false);
  const distractorsRef = useRef<{ id: number; symbol: string; row: number; col: number }[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const distractorIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const displayMsRef = useRef(500);
  if (difficulty === 'Easy') displayMsRef.current = 600;
  else if (difficulty === 'Hard') displayMsRef.current = 350;
  else displayMsRef.current = 500;

  const gapMsRef = useRef(250);
  if (difficulty === 'Easy') gapMsRef.current = 350;
  else if (difficulty === 'Hard') gapMsRef.current = 150;
  else gapMsRef.current = 250;

  const distractorSpawnMsRef = useRef(500);
  if (difficulty === 'Easy') distractorSpawnMsRef.current = 700;
  else if (difficulty === 'Hard') distractorSpawnMsRef.current = 350;
  else distractorSpawnMsRef.current = 500;

  const distractorDurationRef = useRef(400);
  if (difficulty === 'Easy') distractorDurationRef.current = 500;
  else if (difficulty === 'Hard') distractorDurationRef.current = 300;
  else distractorDurationRef.current = 400;

  const isErrorRef = useRef(false);
  const completedRef = useRef(false);

  useVisibilityGuard(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (distractorIntervalRef.current) {
      clearInterval(distractorIntervalRef.current);
      distractorIntervalRef.current = undefined;
    }
    setPhase('intro');
  }, phase === 'encoding' || phase === 'recall');

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (distractorIntervalRef.current) {
      clearInterval(distractorIntervalRef.current);
      distractorIntervalRef.current = undefined;
    }
  }, []);

  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const generateSequence = useCallback((len: number): GridCell[] => {
    const seq: GridCell[] = [];
    for (let i = 0; i < len; i++) {
      const pos = GRID_POSITIONS[Math.floor(Math.random() * GRID_POSITIONS.length)];
      const color = pickRandom(COLORS);
      seq.push({ ...pos, color });
    }
    return seq;
  }, []);

  const getOccupiedPositions = (seq: GridCell[]): string[] => {
    return seq.map(c => `${c.row},${c.col}`);
  };

  const startDistractors = useCallback((occupied: string[]) => {
    let idCount = 0;
    distractorIntervalRef.current = setInterval(() => {
      const pos = pickRandom(GRID_POSITIONS);
      const key = `${pos.row},${pos.col}`;
      if (occupied.includes(key)) return;
      idCount++;
      const d = { id: idCount, symbol: pickRandom(DISTRACTOR_SYMBOLS), row: pos.row, col: pos.col };
      distractorsRef.current = [...distractorsRef.current, d];
      setDistractors([...distractorsRef.current]);
      st(() => {
        distractorsRef.current = distractorsRef.current.filter(d2 => d2.id !== d.id);
        setDistractors([...distractorsRef.current]);
      }, distractorDurationRef.current);
    }, distractorSpawnMsRef.current);
  }, [st]);

  const playSequence = useCallback((seq: GridCell[], idx: number = 0) => {
    if (idx >= seq.length) {
      setActiveCell(null);
      encodingRef.current = true;
      st(() => {
        encodingRef.current = false;
        clearTimers();
        if (distractorIntervalRef.current) {
          clearInterval(distractorIntervalRef.current);
          distractorIntervalRef.current = undefined;
        }
        setDistractors([]);
        setPhase('recall');
        setUserSequence([]);
        userSeqRef.current = [];
      }, 500);
      return;
    }

    const cell = seq[idx];
    setActiveCell({ row: cell.row, col: cell.col });
    st(() => {
      setActiveCell(null);
      st(() => playSequence(seq, idx + 1), gapMsRef.current);
    }, displayMsRef.current);
  }, [st]);

  const startLevel = useCallback((lvl: number) => {
    const seqLen = Math.min(3 + lvl, 9);
    const seq = generateSequence(seqLen);
    seqRef.current = seq;
    setSequence(seq);
    userSeqRef.current = [];
    setUserSequence([]);
    setFeedbackMsg('');
    setPhase('encoding');
    setDistractors([]);
    distractorsRef.current = [];
    isErrorRef.current = false;

    const occ = getOccupiedPositions(seq);
    startDistractors(occ);
    st(() => playSequence(seq, 0), 500);
  }, [generateSequence, startDistractors, playSequence, st]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (phase !== 'recall') return;
    if (isErrorRef.current) return;
    const nextIdx = userSeqRef.current.length;
    if (nextIdx >= seqRef.current.length) return;
    const expected = seqRef.current[nextIdx];
    const isCorrect = row === expected.row && col === expected.col;

    const newEntry = { row, col, color: isCorrect ? '#22c55e' : '#ef4444' };
    const updated = [...userSeqRef.current, newEntry];
    userSeqRef.current = updated;
    setUserSequence(updated);

    if (!isCorrect) {
      isErrorRef.current = true;
      clearTimers();
      setFeedbackMsg(`Wrong! You reached Level ${levelRef.current}`);
      const reached = Math.max(maxLevelRef.current, levelRef.current - 1);
      maxLevelRef.current = reached;
      setMaxLevelReached(reached);
      st(() => {
        if (levelRef.current >= MAX_LEVEL) {
          finishGame();
        } else {
          if (completedRef.current) return;
          completedRef.current = true;
          setPhase('done');
          const score = Math.max(1, Math.min(100, Math.round((reached / MAX_LEVEL) * 100)));
          onComplete({
            stageIndex: 4,
            stageName: 'WM Under Distraction',
            score,
            metrics: { maxLevelReached: reached, maxSequenceLength: Math.min(3 + reached, 9) },
          });
        }
      }, 1500);
      return;
    }

    if (nextIdx + 1 >= seqRef.current.length) {
      clearTimers();
      const nextLvl = levelRef.current + 1;
      if (nextLvl > MAX_LEVEL) {
        if (completedRef.current) return;
        completedRef.current = true;
        setPhase('done');
        maxLevelRef.current = MAX_LEVEL;
        setMaxLevelReached(MAX_LEVEL);
        onComplete({
          stageIndex: 4,
          stageName: 'WM Under Distraction',
          score: 100,
          metrics: { maxLevelReached: MAX_LEVEL, maxSequenceLength: Math.min(3 + MAX_LEVEL, 9) },
        });
        return;
      }
      setFeedbackMsg('✓ Correct!');
      setPhase('feedback');
      st(() => {
        levelRef.current = nextLvl;
        setLevel(nextLvl);
        startLevel(nextLvl);
      }, 800);
    }
  }, [phase, onComplete, st, clearTimers, startLevel]);

  const finishGame = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('done');
    const score = Math.max(1, Math.min(100, Math.round((maxLevelRef.current / MAX_LEVEL) * 100)));
    onComplete({
      stageIndex: 4,
      stageName: 'WM Under Distraction',
      score,
      metrics: { maxLevelReached: maxLevelRef.current, maxSequenceLength: Math.min(3 + maxLevelRef.current, 9) },
    });
  }, [onComplete]);

  const startPlaying = useCallback(() => {
    levelRef.current = 1;
    maxLevelRef.current = 0;
    completedRef.current = false;
    isErrorRef.current = false;
    setLevel(1);
    setMaxLevelReached(0);
    startLevel(1);
  }, [startLevel]);

  useEffect(() => { return clearTimers; }, [clearTimers]);

  const renderGrid = (showActive: boolean, showDistractors: boolean) => (
    <div className="grid grid-cols-3 gap-2">
      {GRID_POSITIONS.map((pos) => {
        const seqIdx = sequence.findIndex(s => s.row === pos.row && s.col === pos.col);
        const isActive = showActive && activeCell?.row === pos.row && activeCell?.col === pos.col;
        const isUser = userSequence.find(u => u.row === pos.row && u.col === pos.col);
        const distractor = showDistractors
          ? distractors.find(d => d.row === pos.row && d.col === pos.col)
          : undefined;

        let bg = 'bg-card';
        if (isActive) {
          bg = 'shadow-lg shadow-accent/30';
        }
        if (isUser) {
          bg = isUser.color === '#22c55e' ? 'bg-emerald-500/30 border-emerald-500/50' : 'bg-rose-500/30 border-rose-500/50';
        }

        return (
          <button
            key={`${pos.row}-${pos.col}`}
            onClick={() => handleCellClick(pos.row, pos.col)}
            disabled={phase !== 'recall'}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-card-border flex items-center justify-center text-lg transition-all duration-150 ${
              bg
            } ${
              isActive ? 'scale-110 border-accent' : ''
            } ${
              phase === 'recall' ? 'hover:border-accent hover:bg-accent/5 active:scale-95 cursor-pointer' : ''
            }`}
          >
            {distractor ? (
              <span className="text-muted text-sm animate-pulse">{distractor.symbol}</span>
            ) : isActive ? (
              <span className="text-2xl" style={{ color: sequence[seqIdx]?.color || '#fff' }}>●</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🧠</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 5: Working Memory Under Distraction</h3>
          <div className="text-secondary text-sm max-w-md text-left space-y-1">
            <p>1. Watch the <strong className="text-accent">colored dots</strong> appear on the grid one by one.</p>
            <p>2. <strong className="text-accent">Ignore</strong> the distracting symbols flashing around the grid.</p>
            <p>3. When prompted, click the grid cells <strong className="text-accent">in the same order</strong> as the dots you saw.</p>
            <p>4. Get it right to advance to the next level with longer sequences.</p>
            <p className="text-muted text-xs mt-2">{MAX_LEVEL} levels. Each level adds one more dot to remember.</p>
          </div>
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
        <p className="text-secondary text-sm">Working Memory complete! Level {maxLevelReached}/{MAX_LEVEL}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex items-center gap-3 text-xs text-muted font-mono">
        <span>Level {level}/{MAX_LEVEL}</span>
        <span>•</span>
        <span>Seq: {Math.min(3 + level, 9)}</span>
        {phase === 'recall' && <span className="text-accent">🎯 Recall</span>}
        {phase === 'encoding' && <span className="text-warning animate-pulse">👀 Watch</span>}
        <button onClick={() => setShowHelp(!showHelp)} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-accent hover:border-accent/50 text-[10px] transition-standard cursor-pointer" aria-label="How to play">?</button>
      </div>
      {showHelp && (
        <div className="w-full max-w-md p-3 rounded-lg bg-panel border border-card-border text-xs text-muted font-mono space-y-1 animate-in fade-in duration-150">
          <p>1. Watch the <strong className="text-accent">colored dots</strong> appear in order.</p>
          <p>2. <strong className="text-error">Ignore</strong> distracting symbols on the grid.</p>
          <p>3. When prompted, click cells <strong className="text-accent">in the same order</strong> as the dots.</p>
        </div>
      )}


      {renderGrid(phase === 'encoding', phase === 'encoding')}

      {feedbackMsg && (
        <div className={`text-sm font-semibold ${feedbackMsg.startsWith('✓') ? 'text-success' : 'text-error'} animate-in fade-in duration-150`}>
          {feedbackMsg}
        </div>
      )}

      {phase === 'recall' && (
        <p className="text-xs text-muted font-mono">
          Click cells in order ({userSequence.length}/{sequence.length})
        </p>
      )}
    </div>
  );
}
