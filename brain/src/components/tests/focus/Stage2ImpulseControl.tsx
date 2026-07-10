import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVisibilityGuard } from '../../../runtime/useVisibilityGuard';
import type { StageProps, StageResult } from './StageTypes';

const GO_SYMBOL = '✓';
const NOGO_SYMBOL = '✗';
const DISTRACTOR_TEXTS = ['New Message', 'Notification', 'Alert', 'Reminder', 'Update', 'Friend Request', 'Comment', 'Like'];

// Distractor tiers: Easy=short, Medium=multi-line, Hard=longer + action buttons
const DISTRACTOR_TIERS: Record<string, { lines: string[]; buttons: string[] }> = {
  Easy: {
    lines: ['New message from Alex'],
    buttons: ['Dismiss'],
  },
  Medium: {
    lines: ['New message from Alex', '"Hey, are you free later?"'],
    buttons: ['Dismiss', 'Reply'],
  },
  Hard: {
    lines: ['New message from Alex', '"Hey, are you free later?"', 'Also: meeting at 3pm moved to 4pm'],
    buttons: ['View', 'Reply', 'Dismiss'],
  },
};

function genTrial(goRate: number) {
  return { isGo: Math.random() < goRate, distractorText: DISTRACTOR_TEXTS[Math.floor(Math.random() * DISTRACTOR_TEXTS.length)] };
}

export default function Stage2ImpulseControl({ onComplete, calibrationHz, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [showHelp, setShowHelp] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [showDistractor, setShowDistractor] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [stimSymbol, setStimSymbol] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [displayHitCount, setDisplayHitCount] = useState(0);
  const [displayFaCount, setDisplayFaCount] = useState(0);
  const [clickedDistractor, setClickedDistractor] = useState(false);

  const trialCountRef = useRef(15);
  if (difficulty === 'Easy') trialCountRef.current = 10;
  else if (difficulty === 'Hard') trialCountRef.current = 20;
  else trialCountRef.current = 15;

  const goRateRef = useRef(0.6);
  if (difficulty === 'Easy') goRateRef.current = 0.7;
  else if (difficulty === 'Hard') goRateRef.current = 0.5;
  else goRateRef.current = 0.6;

  const distractorDelayRef = useRef(600);
  if (difficulty === 'Easy') distractorDelayRef.current = 1000;
  else if (difficulty === 'Hard') distractorDelayRef.current = 350;
  else distractorDelayRef.current = 600;

  const incompletePenaltyRef = useRef(false);
  if (difficulty === 'Hard') incompletePenaltyRef.current = true;
  else incompletePenaltyRef.current = false;

  const distractorTier = difficulty || 'Medium';

  const hitCountRef = useRef(0);
  const faCountRef = useRef(0);
  const trialIndexRef = useRef(0);
  const currentTrialRef = useRef(genTrial(0.6));
  const respondedRef = useRef(false);
  const clickedDistractorRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useVisibilityGuard(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase('intro');
  }, phase === 'playing');

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);

  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setPhase('done');
    const total = trialCountRef.current;
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

  const advance = useCallback((correct: boolean, isGo: boolean, distractorPenalty = false) => {
    if (correct) {
      hitCountRef.current += 1;
      setDisplayHitCount(hitCountRef.current);
    } else {
      faCountRef.current += 1;
      setDisplayFaCount(faCountRef.current);
    }
    if (distractorPenalty) {
      // Clicking distractor popup counts as extra false alarm
      faCountRef.current += 1;
      setDisplayFaCount(faCountRef.current);
    }
    const nextIdx = trialIndexRef.current + 1;
    if (nextIdx >= trialCountRef.current) {
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
    clickedDistractorRef.current = false;
    setClickedDistractor(false);
    const trial = genTrial(goRateRef.current);
    currentTrialRef.current = trial;
    setShowDistractor(true);
    setShowStimulus(false);
    st(() => {
      setShowDistractor(false);
      // If player clicked the distractor in Hard mode, apply penalty immediately
      if (incompletePenaltyRef.current && clickedDistractorRef.current) {
        faCountRef.current += 1;
        setDisplayFaCount(faCountRef.current);
      }
      setStimSymbol(trial.isGo ? GO_SYMBOL : NOGO_SYMBOL);
      setShowStimulus(true);
    }, distractorDelayRef.current);
  }, [st]);

  const handlePress = useCallback(() => {
    if (respondedRef.current || !showStimulus) return;
    respondedRef.current = true;
    setShowStimulus(false);
    advance(currentTrialRef.current.isGo, currentTrialRef.current.isGo, false);
  }, [showStimulus, advance]);

  const handleWithhold = useCallback(() => {
    if (respondedRef.current || !showStimulus) return;
    respondedRef.current = true;
    setShowStimulus(false);
    const isGo = currentTrialRef.current.isGo;
    advance(!isGo, isGo, false);
  }, [showStimulus, advance]);

  // On Hard difficulty, clicking anywhere on the distractor popup = failed impulse test
  const handleDistractorClick = useCallback(() => {
    if (!incompletePenaltyRef.current || !showDistractor || respondedRef.current) return;
    clickedDistractorRef.current = true;
    setClickedDistractor(true);
  }, [showDistractor]);

  const startPlaying = useCallback(() => {
    setPhase('playing');
    hitCountRef.current = 0;
    faCountRef.current = 0;
    trialIndexRef.current = 0;
    clickedDistractorRef.current = false;
    setClickedDistractor(false);
    setDisplayHitCount(0);
    setDisplayFaCount(0);
    setTrialIndex(0);
    st(runTrial, 800);
  }, [st, runTrial]);

  useEffect(() => { return clearTimers; }, [clearTimers]);

  if (phase === 'intro') {
    const tier = DISTRACTOR_TIERS[distractorTier];
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🛡️</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 2: Impulse Control</h3>
          <div className="text-secondary text-sm max-w-md text-left space-y-1">
            <p>1. A <strong className="text-accent">notification popup</strong> appears briefly — ignore it completely.</p>
            <p>2. Then a <strong className="text-accent">symbol</strong> appears: press <kbd className="px-1 py-0.5 rounded bg-panel text-xs font-mono text-accent border border-card-border">SPACE</kbd> for <strong className="text-success">{GO_SYMBOL}</strong>, withhold for <strong className="text-error">{NOGO_SYMBOL}</strong>.</p>
            <p>3. Respond as <strong className="text-accent">fast and accurately</strong> as you can.</p>
            <p>4. {incompletePenaltyRef.current ? 'Clicking the notification counts as a false alarm!' : 'Impulse control is the key skill.'}</p>
          </div>
          <p className="text-muted text-xs max-w-md mt-2">
            {distractorTier === 'Easy' && 'Short notification. Easy to ignore.'}
            {distractorTier === 'Medium' && 'Multi-line notification. Requires more willpower to ignore.'}
            {distractorTier === 'Hard' && 'Long notification with action buttons. Clicking = instant penalty.'}
          </p>
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
        <p className="text-secondary text-sm">Impulse Control complete!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 text-xs text-muted font-mono">
        <span>Trial {trialIndex + 1} / {trialCountRef.current}</span>
        <span>•</span>
        <span>Hits: {displayHitCount}</span>
        <span>•</span>
        <span>FA: {displayFaCount}</span>
        <button onClick={() => setShowHelp(!showHelp)} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-accent hover:border-accent/50 text-[10px] transition-standard cursor-pointer" aria-label="How to play">?</button>
      </div>
      {showHelp && (
        <div className="w-full max-w-md p-3 rounded-lg bg-panel border border-card-border text-xs text-muted font-mono space-y-1 animate-in fade-in duration-150">
          <p>1. <strong className="text-accent">Ignore</strong> the notification popup.</p>
          <p>2. Press <kbd className="px-1 py-0.5 rounded bg-subtle text-accent border border-card-border">SPACE</kbd> for <strong className="text-success">{'✓'}</strong>, withhold for <strong className="text-error">{'✗'}</strong>.</p>
          <p>3. Be fast and accurate. {incompletePenaltyRef.current ? 'Clicking notification = penalty!' : ''}</p>
        </div>
      )}


      <div className="relative min-w-[20rem] min-h-[8rem] flex items-center justify-center bg-card border border-card-border rounded-xl">
        {showDistractor && (
          <div
            className={`absolute -top-2 right-2 bg-card border border-card-border rounded-lg p-3 shadow-xl animate-in slide-in-from-top-2 duration-300 z-10 ${incompletePenaltyRef.current ? 'cursor-pointer' : ''}`}
            onClick={incompletePenaltyRef.current ? handleDistractorClick : undefined}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] text-muted font-mono uppercase tracking-wider">New</span>
              {incompletePenaltyRef.current && <span className="text-[8px] text-error font-mono ml-auto">DO NOT CLICK</span>}
            </div>
            {DISTRACTOR_TIERS[distractorTier].lines.map((line, li) => (
              <p key={li} className={`text-foreground ${li === 0 ? 'text-sm font-medium' : 'text-xs text-muted'} ${li > 0 ? 'mt-1' : ''}`}>
                {line}
              </p>
            ))}
            <div className="flex gap-2 mt-2">
              {DISTRACTOR_TIERS[distractorTier].buttons.map((btn) => (
                <button
                  key={btn}
                  className={`px-2 py-0.5 rounded text-[10px] ${btn === 'Dismiss' ? 'bg-subtle text-muted' : 'bg-accent/20 text-accent'} cursor-default`}
                  tabIndex={-1}
                >
                  {btn}
                </button>
              ))}
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
          <div className="text-secondary text-sm font-mono">Get ready...</div>
        )}

        {feedbackMsg && (
          <div className={`text-sm font-semibold ${feedbackMsg.startsWith('✓') ? 'text-success' : 'text-error'} animate-in fade-in duration-150`}>
            {feedbackMsg}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handlePress} disabled={!showStimulus}
          className="px-8 h-12 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] text-success font-bold text-lg hover:bg-[var(--success-border)] disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-standard cursor-pointer"
        >
          Press
        </button>
        <button onClick={handleWithhold} disabled={!showStimulus}
          className="px-8 h-12 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-error font-bold text-lg hover:bg-[var(--error-border)] disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-standard cursor-pointer"
        >
          Withhold
        </button>
      </div>
    </div>
  );
}
