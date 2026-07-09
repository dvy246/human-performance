import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const RULES = [
  { id: 'even-odd', label: 'Even vs Odd', left: 'Even', right: 'Odd' },
  { id: 'high-low', label: 'High vs Low', left: '≥ 50', right: '< 50' },
  { id: 'div3', label: 'Divisible by 3', left: 'Yes (÷3)', right: 'No' },
];

function genNumber(): number { return Math.floor(Math.random() * 99) + 1; }
function isEven(n: number): boolean { return n % 2 === 0; }
function isDiv3(n: number): boolean { return n % 3 === 0; }

export default function Stage3TaskSwitching({ onComplete, calibrationHz, difficulty }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [showHelp, setShowHelp] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentNum, setCurrentNum] = useState(42);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [displaySwitchCount, setDisplaySwitchCount] = useState(0);
  const [lastRuleId, setLastRuleId] = useState(RULES[1].id);

  const trialCountRef = useRef(12);
  if (difficulty === 'Easy') trialCountRef.current = 8;
  else if (difficulty === 'Hard') trialCountRef.current = 16;
  else trialCountRef.current = 12;

  const preDelayRef = useRef(800);
  if (difficulty === 'Easy') preDelayRef.current = 1200;
  else if (difficulty === 'Hard') preDelayRef.current = 500;
  else preDelayRef.current = 800;

  const showRuleHints = difficulty !== 'Hard';
  const useHardRules = difficulty === 'Hard';

  const trialRef = useRef(0);
  const correctRef = useRef(0);
  const switchCountRef = useRef(0);
  const prevRuleRef = useRef(RULES[1].id);
  const respondedRef = useRef(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const getCurrentRule = (idx: number) => {
    if (useHardRules) {
      // Hard: random rule selection including the 3rd rule (div3)
      return RULES[Math.floor(Math.random() * RULES.length)];
    }
    return RULES[idx % 2];
  };
  const isSwitch = (idx: number) => idx > 0 && getCurrentRule(idx).id !== prevRuleRef.current;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    setPhase('done');
    const acc = correctRef.current / trialCountRef.current;
    const switchEff = Math.max(0, Math.min(100,
      switchCountRef.current > 0
        ? Math.round(100 - (switchCountRef.current / (trialCountRef.current - 1)) * 50)
        : 100
    ));
    const score = Math.max(0, Math.min(100, Math.round(acc * 70 + (switchEff / 100) * 30)));
    onComplete({
      stageIndex: 2,
      stageName: 'Task Switching',
      score,
      metrics: { accuracy: Math.round(acc * 100), switches: switchCountRef.current },
    });
  }, [onComplete, clearTimers]);

  const runTrial = useCallback(() => {
    respondedRef.current = false;
    const idx = trialRef.current;
    const rule = getCurrentRule(idx);
    prevRuleRef.current = rule.id;
    setLastRuleId(rule.id);
    setCurrentNum(genNumber());
    setFeedbackMsg('');
  }, []);

  const handleAnswer = useCallback((answer: 'left' | 'right') => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const idx = trialRef.current;
    const rule = getCurrentRule(idx);
    const n = currentNum;
    const correct = rule.id === 'even-odd'
      ? (answer === 'left') === isEven(n)
      : rule.id === 'high-low'
      ? (answer === 'left') === (n >= 50)
      : (answer === 'left') === isDiv3(n);
    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    }
    setFeedbackMsg(correct ? '✓' : '✗');
    const nextIdx = idx + 1;
    if (nextIdx >= trialCountRef.current) {
      finish();
      return;
    }
    trialRef.current = nextIdx;
    setTrialIndex(nextIdx);
    if (isSwitch(nextIdx)) {
      switchCountRef.current += 1;
      setDisplaySwitchCount(switchCountRef.current);
    }
    st(() => { setFeedbackMsg(''); runTrial(); }, 500);
  }, [currentNum, st, finish, runTrial]);

  const startPlaying = useCallback(() => {
    setPhase('playing');
    correctRef.current = 0;
    switchCountRef.current = 0;
    trialRef.current = 0;
    completedRef.current = false;
    setCorrectCount(0);
    setDisplaySwitchCount(0);
    setTrialIndex(0);
    prevRuleRef.current = RULES[1].id;
    st(runTrial, preDelayRef.current);
  }, [st, runTrial]);

  useEffect(() => { return clearTimers; }, [clearTimers]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🔄</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 3: Task Switching</h3>
          <div className="text-secondary text-sm max-w-md text-left space-y-1">
            <p>1. A <strong className="text-accent">number</strong> appears on screen.</p>
            <p>2. Classify it using the <strong className="text-accent">current rule</strong> shown at the top.</p>
            {!useHardRules && <p>3. Rules: <strong className="text-accent">Even/Odd</strong> or <strong className="text-success">≥50 / &lt;50</strong>.</p>}
            {useHardRules && <p>3. Rules: <strong className="text-accent">Even/Odd</strong>, <strong className="text-success">≥50 / &lt;50</strong>, or <strong className="text-warning">Divisible by 3</strong> — rule label is hidden!</p>}
            <p>4. The rule <strong className="text-accent">changes</strong> every few rounds — switch your thinking. Speed + accuracy = score.</p>
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
        <p className="text-secondary text-sm">Task Switching complete!</p>
      </div>
    );
  }

  const rule = getCurrentRule(trialRef.current);
  const isSwitchTrial = trialRef.current > 0 && rule.id !== prevRuleRef.current;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 text-xs text-muted font-mono">
        <span>Trial {trialIndex + 1} / {trialCountRef.current}</span>
        <span>•</span>
        <span>Correct: {correctCount}</span>
        {isSwitchTrial && <span className="text-accent animate-pulse">⚡ Switch!</span>}
        <button onClick={() => setShowHelp(!showHelp)} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-accent hover:border-accent/50 text-[10px] transition-standard cursor-pointer" aria-label="How to play">?</button>
      </div>
      {showHelp && (
        <div className="w-full max-w-md p-3 rounded-lg bg-panel border border-card-border text-xs text-muted font-mono space-y-1 animate-in fade-in duration-150">
          <p>1. Classify the number using the <strong className="text-accent">current rule</strong>.</p>
          {!useHardRules && <p>2. Rules: <strong className="text-accent">Even/Odd</strong> or <strong className="text-success">{'>='}50 / &lt;50</strong>.</p>}
          {useHardRules && <p>2. Rules cycle randomly — label is hidden on Hard.</p>}
          <p>3. The rule changes — switch your thinking. Speed + accuracy = score.</p>
        </div>
      )}


      <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-card-border text-center">
        {showRuleHints && (
          <div className="text-xs font-mono mb-2 uppercase tracking-wider px-2 py-0.5 rounded inline-block bg-accent/10 text-accent border border-accent/20">
            Rule: {rule.label}
          </div>
        )}
        {!showRuleHints && (
          <div className="text-xs text-muted mb-2 font-mono">Remember the rule — no hints!</div>
        )}
        <div className="text-6xl font-bold text-foreground mb-4 tabular-nums">{currentNum}</div>
        <div className="flex justify-center gap-4">
          <button onClick={() => handleAnswer('left')} disabled={!!feedbackMsg}
            className="flex-1 max-w-[120px] px-4 h-12 rounded-lg bg-accent/20 border border-accent/40 text-accent font-bold text-sm hover:bg-accent/30 disabled:opacity-30 active:scale-95 transition-standard cursor-pointer"
          >
            {rule.left}
          </button>
          <button onClick={() => handleAnswer('right')} disabled={!!feedbackMsg}
            className="flex-1 max-w-[120px] px-4 h-12 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning-border)] text-warning font-bold text-sm hover:bg-[var(--warning-border)] disabled:opacity-30 active:scale-95 transition-standard cursor-pointer"
          >
            {rule.right}
          </button>
        </div>
        {feedbackMsg && (
          <div className={`mt-4 text-2xl font-bold animate-in zoom-in-50 duration-150 ${feedbackMsg === '✓' ? 'text-success' : 'text-error'}`}>
            {feedbackMsg}
          </div>
        )}
      </div>
    </div>
  );
}
