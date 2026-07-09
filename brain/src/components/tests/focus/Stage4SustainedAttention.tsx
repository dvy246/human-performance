import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const TARGET_LETTER = 'X';

const LETTERS = 'ABCDEFGHJKLMNOPQRSTUVWYZ'.split('');

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function genStimulus(): { letter: string; isTarget: boolean } {
  const isTarget = Math.random() < 0.2;
  return { letter: isTarget ? TARGET_LETTER : randomLetter(), isTarget };
}

export default function Stage4SustainedAttention({ onComplete, calibrationHz, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [showHelp, setShowHelp] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<'' | 'hit' | 'miss' | 'fa' | 'omission'>('');
  const durationRef = useRef(90000);
  if (difficulty === 'Easy') durationRef.current = 60000;
  else if (difficulty === 'Hard') durationRef.current = 120000;
  else durationRef.current = 90000;

  const stimDurationRef = useRef(600);
  if (difficulty === 'Easy') stimDurationRef.current = 800;
  else if (difficulty === 'Hard') stimDurationRef.current = 400;
  else stimDurationRef.current = 600;

  const isiRangeRef = useRef<[number, number]>([1200, 2500]);
  if (difficulty === 'Easy') isiRangeRef.current = [1500, 3000];
  else if (difficulty === 'Hard') isiRangeRef.current = [800, 1800];
  else isiRangeRef.current = [1200, 2500];

  // Hard mode: periodic visual glitch to simulate distraction
  const glitchActiveRef = useRef(false);
  const glitchTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [timeRemaining, setTimeRemaining] = useState(durationRef.current);
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

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    glitchTimersRef.current.forEach(clearTimeout);
    glitchTimersRef.current = [];
    if (keyFeedbackTimerRef.current) {
      clearTimeout(keyFeedbackTimerRef.current);
      keyFeedbackTimerRef.current = null;
    }
  }, []);

  const keyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashFeedback = useCallback((type: '' | 'hit' | 'miss' | 'fa' | 'omission') => {
    setKeyFeedback(type);
    if (keyFeedbackTimerRef.current) clearTimeout(keyFeedbackTimerRef.current);
    keyFeedbackTimerRef.current = setTimeout(() => {
      setKeyFeedback('');
    }, 250);
  }, []);

  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const scheduleGlitch = useCallback(() => {
    if (difficulty !== 'Hard' || !isMountedRef.current) return;
    const nextGlitch = 5000 + Math.random() * 15000;
    const glitchId = setTimeout(() => {
      if (!isMountedRef.current) return;
      glitchActiveRef.current = true;
      const innerId = setTimeout(() => {
        if (!isMountedRef.current) return;
        glitchActiveRef.current = false;
        scheduleGlitch();
      }, 300);
      glitchTimersRef.current.push(innerId);
    }, nextGlitch);
    glitchTimersRef.current.push(glitchId);
  }, [difficulty]);

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
        flashFeedback('omission');
      }
      if (!isMountedRef.current) return;
      setCurrentLetter('');
      currentStimRef.current = null;
      const isi = isiRangeRef.current[0] + Math.random() * (isiRangeRef.current[1] - isiRangeRef.current[0]);
      st(showStimulus, isi);
    }, stimDurationRef.current);
  }, [st, flashFeedback]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing' || e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!currentStimRef.current) {
        faRef.current += 1;
        setFalseAlarms(faRef.current);
        flashFeedback('fa');
        return;
      }
      if (currentStimRef.current.isTarget) {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        flashFeedback('hit');
      } else {
        faRef.current += 1;
        setFalseAlarms(faRef.current);
        flashFeedback('fa');
      }
      respondingRef.current = true;
      currentStimRef.current = null;
      setCurrentLetter('');
    }
  }, [phase, flashFeedback]);

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
      const remaining = Math.max(0, durationRef.current - elapsed);
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
    setKeyFeedback('');
    setTimeRemaining(durationRef.current);
    startTimeRef.current = performance.now();
    scheduleGlitch();
    st(showStimulus, 1500);
  }, [st, showStimulus, scheduleGlitch]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
      if (keyFeedbackTimerRef.current) clearTimeout(keyFeedbackTimerRef.current);
    };
  }, [clearTimers]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🧘</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 4: Sustained Attention</h3>
          <div className="text-secondary text-sm max-w-md text-left space-y-1">
            <p>1. <strong className="text-accent">Letters</strong> appear on screen one at a time for {Math.round(durationRef.current / 1000)} seconds.</p>
            <p>2. Press <kbd className="px-1.5 py-0.5 rounded bg-panel text-xs font-mono text-accent border border-card-border">SPACE</kbd> <strong className="text-accent">only</strong> when you see <strong className="text-accent">{TARGET_LETTER}</strong>.</p>
            <p>3. <strong className="text-error">Ignore</strong> all other letters — they are distractors.</p>
            <p>4. Stay focused for the full duration. Every miss and false alarm is tracked.</p>
          </div>
          <p className="text-muted text-xs max-w-md mt-2">
            {difficulty === 'Easy' && 'Slower pace with longer letter display time.'}
            {difficulty === 'Medium' && 'Moderate pace. Standard difficulty.'}
            {difficulty === 'Hard' && 'Fast pace with random screen flicker distractions.'}
          </p>
        </div>
        <button onClick={startPlaying} className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-standard active:scale-95 cursor-pointer">
          Start {Math.round(durationRef.current / 1000)}s Challenge
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

  const feedbackColors: Record<string, string> = {
    hit: 'bg-emerald-500/30 border-emerald-500 text-emerald-400',
    miss: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
    fa: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    omission: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
  };
  const feedbackLabels: Record<string, string> = {
    hit: '✓ HIT',
    miss: '✗ MISSED X',
    fa: '✗ FALSE ALARM',
    omission: '✗ MISSED X',
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 relative">
      {/* Hard mode glitch overlay */}
      {glitchActiveRef.current && (
        <div className="absolute inset-0 z-20 rounded-xl pointer-events-none bg-black/20 animate-in fade-in duration-100 mix-blend-overlay" />
      )}
      <div className="flex items-center gap-5 text-xs text-muted font-mono">
        <span className={`${timeRemaining < 10000 ? 'text-error animate-pulse' : ''}`}>
          {minutes}:{String(seconds % 60).padStart(2, '0')}
        </span>
        <span className="text-emerald-400 font-semibold">H: {hits}</span>
        <span className="text-rose-400">M: {misses}</span>
        <span className="text-orange-400">FA: {falseAlarms}</span>
        <span className="text-muted">∑{totalStimuli}</span>
        <button onClick={() => setShowHelp(!showHelp)} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-accent hover:border-accent/50 text-[10px] transition-standard cursor-pointer" aria-label="How to play">?</button>
      </div>
      {showHelp && (
        <div className="w-full max-w-md p-3 rounded-lg bg-panel border border-card-border text-xs text-muted font-mono space-y-1 animate-in fade-in duration-150">
          <p>1. Press <kbd className="px-1 py-0.5 rounded bg-subtle text-accent border border-card-border">SPACE</kbd> <strong className="text-accent">only</strong> when you see <strong className="text-accent">{TARGET_LETTER}</strong>.</p>
          <p>2. Ignore all other letters. Every miss and false alarm counts.</p>
          <p>3. Stay focused for the full {Math.round(durationRef.current / 1000)}s.</p>
        </div>
      )}


      <div className="relative w-40 h-40 rounded-2xl bg-card border border-card-border flex items-center justify-center">
        {currentLetter ? (
          <span className="text-7xl font-bold text-foreground tabular-nums animate-in zoom-in-50 duration-100">{currentLetter}</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-secondary text-sm font-mono">+</span>
            <span className="text-[10px] text-secondary font-mono">Wait...</span>
          </div>
        )}
        {keyFeedback && (
          <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border animate-in zoom-in-50 duration-100 ${feedbackColors[keyFeedback]}`}>
            {feedbackLabels[keyFeedback]}
          </div>
        )}
      </div>

      <div className="text-xs text-muted font-mono text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-panel text-accent border border-card-border">SPACE</kbd> on <strong className="text-accent">{TARGET_LETTER}</strong> only
      </div>

      <div className="w-full max-w-xs bg-card rounded-full h-1.5 overflow-hidden border border-card-border">
        <div
          className="h-full bg-accent transition-all duration-200 rounded-full"
          style={{ width: `${(timeRemaining / durationRef.current) * 100}%` }}
        />
      </div>
    </div>
  );
}
