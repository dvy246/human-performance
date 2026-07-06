import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StageProps, StageResult } from './StageTypes';

const TOTAL_TRIALS = 12;
const RULES = [
  { id: 'even-odd', label: 'Even vs Odd', left: 'Even', right: 'Odd' },
  { id: 'high-low', label: 'High vs Low', left: '≥ 50', right: '< 50' },
];

function genNumber(): number { return Math.floor(Math.random() * 99) + 1; }
function isEven(n: number): boolean { return n % 2 === 0; }

export default function Stage3TaskSwitching({ onComplete, calibrationHz }: StageProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentNum, setCurrentNum] = useState(42);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [displaySwitchCount, setDisplaySwitchCount] = useState(0);
  const [lastRuleId, setLastRuleId] = useState(RULES[1].id);

  const trialRef = useRef(0);
  const correctRef = useRef(0);
  const switchCountRef = useRef(0);
  const prevRuleRef = useRef(RULES[1].id);
  const respondedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const getCurrentRule = (idx: number) => RULES[idx % 2];
  const isSwitch = (idx: number) => idx > 0 && getCurrentRule(idx).id !== prevRuleRef.current;

  const finish = useCallback(() => {
    clearTimers();
    setPhase('done');
    const acc = correctRef.current / TOTAL_TRIALS;
    const switchEff = Math.max(0, Math.min(100,
      switchCountRef.current > 0
        ? Math.round(100 - (switchCountRef.current / (TOTAL_TRIALS - 1)) * 50)
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
    prevRuleRef.current = idx > 0 ? getCurrentRule(idx - 1).id : RULES[1].id;
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
      : (answer === 'left') === (n >= 50);
    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    }
    setFeedbackMsg(correct ? '✓' : '✗');
    const nextIdx = idx + 1;
    if (nextIdx >= TOTAL_TRIALS) {
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
    setCorrectCount(0);
    setDisplaySwitchCount(0);
    setTrialIndex(0);
    prevRuleRef.current = RULES[1].id;
    st(runTrial, 800);
  }, [st, runTrial]);

  useEffect(() => { return clearTimers; }, [clearTimers]);

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl">🔄</div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Stage 3: Task Switching</h3>
          <p className="text-zinc-400 text-sm max-w-md">
            The rule alternates each trial. Answer <strong className="text-accent">Even/Odd</strong> or <strong className="text-emerald-400">≥50 / &lt;50</strong> for each number. Switching quickly and accurately is the challenge.
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
        <p className="text-zinc-400 text-sm">Task Switching complete!</p>
      </div>
    );
  }

  const rule = getCurrentRule(trialRef.current);
  const isSwitchTrial = trialRef.current > 0 && rule.id !== (trialRef.current > 0 ? getCurrentRule(trialRef.current - 1).id : '');

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
        <span>Trial {trialIndex + 1} / {TOTAL_TRIALS}</span>
        <span>•</span>
        <span>Correct: {correctCount}</span>
        {isSwitchTrial && <span className="text-accent animate-pulse">⚡ Switch!</span>}
      </div>

      <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-card-border text-center">
        <div className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-wider">Rule: {rule.label}</div>
        <div className="text-6xl font-bold text-foreground mb-4 tabular-nums">{currentNum}</div>
        <div className="flex justify-center gap-4">
          <button onClick={() => handleAnswer('left')} disabled={!!feedbackMsg}
            className="flex-1 max-w-[120px] px-4 h-12 rounded-lg bg-accent/20 border border-accent/40 text-accent font-bold text-sm hover:bg-accent/30 disabled:opacity-30 active:scale-95 transition-standard cursor-pointer"
          >
            {rule.left}
          </button>
          <button onClick={() => handleAnswer('right')} disabled={!!feedbackMsg}
            className="flex-1 max-w-[120px] px-4 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-sm hover:bg-amber-500/30 disabled:opacity-30 active:scale-95 transition-standard cursor-pointer"
          >
            {rule.right}
          </button>
        </div>
        {feedbackMsg && (
          <div className={`mt-4 text-2xl font-bold animate-in zoom-in-50 duration-150 ${feedbackMsg === '✓' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {feedbackMsg}
          </div>
        )}
      </div>
    </div>
  );
}
