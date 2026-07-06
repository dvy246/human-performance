import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const TOTAL_TRIALS = 15;
const GO_SYMBOL = '✓';
const NOGO_SYMBOL = '✗';
const DISTRACTOR_TEXTS = ['New Message', 'Notification', 'Alert', 'Reminder', 'Update', 'Friend Request', 'Comment', 'Like'];

function genTrial() {
  return { isGo: Math.random() < 0.6, distractorText: DISTRACTOR_TEXTS[Math.floor(Math.random() * DISTRACTOR_TEXTS.length)] };
}

export default function Stage2ImpulseControl({ onComplete, calibrationHz }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [showDistractor, setShowDistractor] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [stimSymbol, setStimSymbol] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [displayHitCount, setDisplayHitCount] = useState(0);
  const [displayFaCount, setDisplayFaCount] = useState(0);

  const hitCountRef = useRef(0);
  const faCountRef = useRef(0);
  const trialIndexRef = useRef(0);
  const currentTrialRef = useRef(genTrial());
  const respondedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);

  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setPhase('done');
    const total = TOTAL_TRIALS;
    const correct = hitCountRef.current;
    const fa = faCountRef.current;
    const acc = correct / total;
    const score = Math.max(0, Math.min(100, Math.round((acc * 70) + (Math.max(0, 1 - fa / total) * 30))));
    onComplete({
      stageIndex: 1,
      stageName: 'Impulse Control',
      score,
      metrics: { accuracy: Math.round(acc * 100), falseAlarms: fa },
    });
  }, [onComplete, clearTimers]);

  const advance = useCallback((correct: boolean, isGo: boolean) => {
    if (correct) {
      hitCountRef.current += 1;
      setDisplayHitCount(hitCountRef.current);
    } else {
      faCountRef.current += 1;
      setDisplayFaCount(faCountRef.current);
    }
    const nextIdx = trialIndexRef.current + 1;
    if (nextIdx >= TOTAL_TRIALS) {
      finish();
      return;
    }
    trialIndexRef.current = nextIdx;
    setTrialIndex(nextIdx);
    setFeedbackMsg(correct ? (isGo ? '✓ Press correct' : '✓ Withheld correctly') : (isGo ? '✗ Missed' : '✗ False alarm'));
    st(() => { setFeedbackMsg(''); runTrial(); }, 700);
  }, [st, finish]);

  const runTrial = useCallback(() => {
    respondedRef.current = false;
    const trial = genTrial();
    currentTrialRef.current = trial;
    setShowDistractor(true);
    setShowStimulus(false);
    st(() => {
      setShowDistractor(false);
      setStimSymbol(trial.isGo ? GO_SYMBOL : NOGO_SYMBOL);
      setShowStimulus(true);
    }, 600);
  }, [st]);

  const handlePress = useCallback(() => {
    if (respondedRef.current || !showStimulus) return;
    respondedRef.current = true;
    setShowStimulus(false);
    advance(currentTrialRef.current.isGo, true);
  }, [showStimulus, advance]);

  const handleWithhold = useCallback(() => {
    if (respondedRef.current || !showStimulus) return;
    respondedRef.current = true;
    setShowStimulus(false);
    const isGo = currentTrialRef.current.isGo;
    advance(!isGo, isGo);
  }, [showStimulus, advance]);

  const startPlaying = useCallback(() => {
    setPhase('playing');
    hitCountRef.current = 0;
    faCountRef.current = 0;
    trialIndexRef.current = 0;
    setDisplayHitCount(0);
    setDisplayFaCount(0);
    setTrialIndex(0);
    st(runTrial, 800);
  }, [st, runTrial]);

  useEffect(() => { return clearTimers; }, [clearTimers]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🛡️</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 2: Impulse Control</h3>
          <p className="text-zinc-400 text-sm max-w-md">
            A notification popup briefly appears — <strong className="text-accent">ignore it</strong>. Then a symbol appears: press for <strong className="text-emerald-400">{GO_SYMBOL}</strong>, withhold for <strong className="text-rose-400">{NOGO_SYMBOL}</strong>.
          </p>
        </div>
        <button onClick={startPlaying} className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-sm transition-standard active:scale-95 cursor-pointer">
          Start Stage
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-4xl text-emerald-400">✓</div>
        <p className="text-zinc-400 text-sm">Impulse Control complete!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
        <span>Trial {trialIndex + 1} / {TOTAL_TRIALS}</span>
        <span>•</span>
        <span>Hits: {displayHitCount}</span>
        <span>•</span>
        <span>FA: {displayFaCount}</span>
      </div>

      <div className="relative w-80 h-48 flex items-center justify-center bg-card border border-card-border rounded-xl">
        {showDistractor && (
          <div className="absolute -top-2 right-2 w-52 bg-card border border-zinc-700 rounded-lg p-3 shadow-xl animate-in slide-in-from-top-2 duration-300 z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">New</span>
            </div>
            <p className="text-sm text-foreground font-medium">{currentTrialRef.current.distractorText}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500">Dismiss</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-accent/20 text-accent">View</span>
            </div>
          </div>
        )}

        {showStimulus && (
          <div className="text-6xl font-bold animate-in zoom-in-50 duration-200"
            style={{ color: stimSymbol === GO_SYMBOL ? '#34d399' : '#fb7185' }}
          >
            {stimSymbol}
          </div>
        )}

        {!showDistractor && !showStimulus && !feedbackMsg && (
          <div className="text-zinc-700 text-sm font-mono">Get ready...</div>
        )}

        {feedbackMsg && (
          <div className={`text-sm font-semibold ${feedbackMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'} animate-in fade-in duration-150`}>
            {feedbackMsg}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handlePress} disabled={!showStimulus}
          className="px-8 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-lg hover:bg-emerald-500/30 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-standard cursor-pointer"
        >
          Press
        </button>
        <button onClick={handleWithhold} disabled={!showStimulus}
          className="px-8 h-12 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-lg hover:bg-rose-500/30 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-standard cursor-pointer"
        >
          Withhold
        </button>
      </div>
    </div>
  );
}
