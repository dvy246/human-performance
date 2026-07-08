import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const DURATION_MS = 90000;
const STIMULUS_DURATION = 300;
const ISI_RANGE: [number, number] = [800, 1800];
const TARGET_LETTER = 'X';

const LETTERS = 'ABCDEFGHJKLMNOPQRSTUVWYZ'.split('');

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function genStimulus(): { letter: string; isTarget: boolean } {
  const isTarget = Math.random() < 0.2;
  return { letter: isTarget ? TARGET_LETTER : randomLetter(), isTarget };
}

export default function Stage4SustainedAttention({ onComplete, calibrationHz }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [currentLetter, setCurrentLetter] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(DURATION_MS);
  const [totalStimuli, setTotalStimuli] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);

  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const faRef = useRef(0);
  const totalRef = useRef(0);
  const currentStimRef = useRef<{ letter: string; isTarget: boolean } | null>(null);
  const respondingRef = useRef(false);
  const startTimeRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);

  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const showStimulus = useCallback(() => {
    if (!isMountedRef.current) return;
    const stim = genStimulus();
    currentStimRef.current = stim;
    setCurrentLetter(stim.letter);
    totalRef.current += 1;
    setTotalStimuli(totalRef.current);
    respondingRef.current = false;

    st(() => {
      if (stim.isTarget && !respondingRef.current) {
        missesRef.current += 1;
        setMisses(missesRef.current);
      }
      if (!isMountedRef.current) return;
      setCurrentLetter('');
      currentStimRef.current = null;
      const isi = ISI_RANGE[0] + Math.random() * (ISI_RANGE[1] - ISI_RANGE[0]);
      st(showStimulus, isi);
    }, STIMULUS_DURATION);
  }, [st]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing' || e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!currentStimRef.current) {
        faRef.current += 1;
        setFalseAlarms(faRef.current);
        return;
      }
      if (currentStimRef.current.isTarget) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
      } else {
        faRef.current += 1;
        setFalseAlarms(faRef.current);
      }
      respondingRef.current = true;
      currentStimRef.current = null;
      setCurrentLetter('');
    }
  }, [phase]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const finish = useCallback(() => {
    if (!isMountedRef.current) return;
    clearTimers();
    setPhase('done');
    const omissions = missesRef.current;
    const commissions = faRef.current;
    const omScore = Math.max(0, 100 - omissions * 5);
    const faScore = Math.max(0, 100 - commissions * 8);
    const score = Math.max(0, Math.min(100, Math.round((omScore * 0.6 + faScore * 0.4))));
    onComplete({
      stageIndex: 3,
      stageName: 'Sustained Attention',
      score,
      metrics: { omissions, commissions, totalStimuli: totalRef.current },
    });
  }, [onComplete, clearTimers]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        finish();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, finish]);

  const startPlaying = useCallback(() => {
    isMountedRef.current = true;
    setPhase('playing');
    hitsRef.current = 0;
    missesRef.current = 0;
    faRef.current = 0;
    totalRef.current = 0;
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setTotalStimuli(0);
    setTimeRemaining(DURATION_MS);
    startTimeRef.current = performance.now();
    st(showStimulus, 1500);
  }, [st, showStimulus]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; clearTimers(); };
  }, [clearTimers]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🧘</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 4: Sustained Attention</h3>
          <p className="text-secondary text-sm max-w-md">
            A 90-second vigilance test. Letters flash on screen — press <kbd className="px-1.5 py-0.5 rounded bg-panel text-xs font-mono text-accent border border-card-border">SPACE</kbd> only when you see <strong className="text-accent">{TARGET_LETTER}</strong>. Stay focused the whole time.
          </p>
        </div>
        <button onClick={startPlaying} className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-standard active:scale-95 cursor-pointer">
          Start 90s Challenge
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-4xl text-success">✓</div>
        <p className="text-secondary text-sm">Sustained Attention complete!</p>
      </div>
    );
  }

  const seconds = Math.ceil(timeRemaining / 1000);
  const minutes = Math.floor(seconds / 60);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-5 text-xs text-muted font-mono">
        <span className={`${timeRemaining < 10000 ? 'text-error animate-pulse' : ''}`}>
          {minutes}:{String(seconds % 60).padStart(2, '0')}
        </span>
        <span>Hits: {hits}</span>
        <span>Miss: {misses}</span>
        <span>FA: {falseAlarms}</span>
      </div>

      <div className="w-40 h-40 rounded-2xl bg-card border border-card-border flex items-center justify-center">
        {currentLetter ? (
          <span className="text-7xl font-bold text-foreground tabular-nums animate-in zoom-in-50 duration-100">{currentLetter}</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-secondary text-sm font-mono">+</span>
            <span className="text-[10px] text-secondary font-mono">Wait...</span>
          </div>
        )}
      </div>

      <div className="text-xs text-muted font-mono text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-panel text-accent border border-card-border">SPACE</kbd> on <strong className="text-accent">{TARGET_LETTER}</strong> only
      </div>

      <div className="w-full max-w-xs bg-card rounded-full h-1.5 overflow-hidden border border-card-border">
        <div
          className="h-full bg-accent transition-all duration-200 rounded-full"
          style={{ width: `${(timeRemaining / DURATION_MS) * 100}%` }}
        />
      </div>
    </div>
  );
}
