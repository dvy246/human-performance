import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

type Phase = 'idle' | 'showing' | 'input' | 'correct' | 'wrong' | 'result';

export default function NumberMemoryTest() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(1);
  const [currentNumber, setCurrentNumber] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showTimer, setShowTimer] = useState(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [highestLevel, setHighestLevel] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayDuration = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('number-memory', 'higher').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('challenge');
      if (token) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(decodeURIComponent(token));
          if (payload && payload.testId === 'number-memory') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => { mounted = false; };
  }, []);

  const generateNumber = (digits: number): string => {
    let num = '';
    for (let i = 0; i < digits; i++) {
      num += i === 0
        ? String(Math.floor(Math.random() * 9) + 1)
        : String(Math.floor(Math.random() * 10));
    }
    return num;
  };

  const startTest = () => {
    setLevel(1);
    setHighestLevel(0);
    setShareImage(null);
    setUserInput('');
    showNumber(1);
  };

  const showNumber = (lvl: number) => {
    const num = generateNumber(lvl);
    setCurrentNumber(num);
    setPhase('showing');
    setUserInput('');

    // Display duration: starts at 2s, increases with level
    const duration = Math.min(2000 + (lvl - 1) * 500, 8000);
    displayDuration.current = duration;

    // Countdown timer for visual feedback
    const startTime = performance.now();
    setShowTimer(100);

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setShowTimer(remaining);

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('input');
        setShowTimer(0);
        // Focus input after transition
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, 30);
  };

  const handleSubmit = useCallback(() => {
    if (phase !== 'input') return;

    if (userInput === currentNumber) {
      const nextLevel = level + 1;
      setHighestLevel(Math.max(highestLevel, level));
      setPhase('correct');
      
      setTimeout(() => {
        setLevel(nextLevel);
        showNumber(nextLevel);
      }, 800);
    } else {
      setHighestLevel(Math.max(highestLevel, level - 1));
      setPhase('wrong');
    }
  }, [phase, userInput, currentNumber, level, highestLevel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const finishTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const finalScore = Math.max(highestLevel, level - 1);
    setPhase('result');

    const percentile = lookupPercentile(finalScore);

    await dataLayer.saveSession({
      testId: 'number-memory',
      category: 'memory',
      rawScore: finalScore,
      percentile,
      metadata: { maxDigits: finalScore }
    });

    const pb = await dataLayer.getPersonalBest('number-memory', 'higher');
    setPersonalBest(pb);

    const card = await generateShareCard(
      'Number Memory Test',
      `${finalScore} Digits`,
      percentile
    );
    setShareImage(card);
  };

  const lookupPercentile = (digits: number): number => {
    // Number Memory percentile distribution
    // Based on cognitive research: average adult can recall 7±2 digits
    if (digits >= 15) return 99.9;
    if (digits >= 13) return 99;
    if (digits >= 11) return 97;
    if (digits >= 10) return 93;
    if (digits >= 9) return 85;
    if (digits >= 8) return 75;
    if (digits >= 7) return 55;
    if (digits >= 6) return 35;
    if (digits >= 5) return 20;
    if (digits >= 4) return 8;
    return 2;
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const finalScore = Math.max(highestLevel, level - 1);
    const token = encodeChallenge({ testId: 'number-memory', score: finalScore });
    const url = `${window.location.origin}/tests/number-memory/?challenge=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  const finalScore = Math.max(highestLevel, level - 1);

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Challenge Banner */}
      {challengeScore && phase !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">
            Active Challenge: Beat your friend's score of{' '}
            <strong className="text-foreground font-mono">{challengeScore} digits</strong>!
          </span>
          <button
            onClick={() => setChallengeScore(null)}
            className="text-[11px] text-zinc-500 hover:text-foreground font-mono uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Test Area */}
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 min-h-[340px] justify-center relative overflow-hidden">
        
        {/* Level indicator */}
        {phase !== 'idle' && phase !== 'result' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span>Level</span>
            <span className="text-foreground font-bold text-sm">{level}</span>
          </div>
        )}

        {/* IDLE STATE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl">
              🔢
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-1">Number Memory</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
                Remember increasingly long numbers. How many digits can you hold in working memory?
              </p>
            </div>
            <button
              onClick={startTest}
              className="text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-8 py-2.5 rounded transition-standard active:scale-[0.98]"
            >
              Start Test
            </button>
          </div>
        )}

        {/* SHOWING NUMBER */}
        {phase === 'showing' && (
          <div className="flex flex-col items-center gap-6 w-full">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Memorize this number
            </span>
            <div className="text-4xl md:text-5xl font-mono font-bold text-foreground tracking-[0.15em] tabular-nums select-none">
              {currentNumber}
            </div>
            {/* Progress bar countdown */}
            <div className="w-full max-w-xs h-1.5 bg-subtle rounded-full overflow-hidden border border-card-border/60">
              <div
                className="h-full bg-accent rounded-full transition-all duration-75"
                style={{ width: `${showTimer}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-600">
              Time remaining to memorize
            </span>
          </div>
        )}

        {/* INPUT STATE */}
        {phase === 'input' && (
          <div className="flex flex-col items-center gap-5 w-full max-w-xs">
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
              What was the number?
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              className="w-full text-center text-3xl font-mono font-bold text-foreground bg-subtle border border-card-border rounded-lg px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-standard tabular-nums"
              autoComplete="off"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={userInput.length === 0}
              className="w-full text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-6 py-2.5 rounded transition-standard active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        )}

        {/* CORRECT FEEDBACK */}
        {phase === 'correct' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
              ✓
            </div>
            <span className="text-emerald-400 font-mono text-sm font-bold uppercase tracking-wider">
              Correct!
            </span>
            <span className="text-zinc-500 text-xs font-mono">
              {currentNumber}
            </span>
          </div>
        )}

        {/* WRONG FEEDBACK */}
        {phase === 'wrong' && (
          <div className="flex flex-col items-center gap-5 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
              ✗
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-red-400 font-mono text-sm font-bold uppercase tracking-wider">
                Incorrect
              </span>
              <div className="flex flex-col gap-2 mt-2 w-full text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-subtle border border-card-border/40">
                  <span className="text-zinc-500">Number</span>
                  <span className="text-foreground font-bold">{currentNumber}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-subtle border border-card-border/40">
                  <span className="text-zinc-500">Your Answer</span>
                  <span className="text-red-400 font-bold">{userInput || '—'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={finishTest}
              className="text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-8 py-2.5 rounded transition-standard active:scale-[0.98] mt-2"
            >
              View Results
            </button>
          </div>
        )}

        {/* RESULT STATE */}
        {phase === 'result' && (
          <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <span className="text-zinc-500 text-xs font-mono uppercase">
                Number Memory Span
              </span>
              <div className="text-5xl font-mono font-bold text-foreground">
                {finalScore}
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                digits remembered
              </span>
              <span className="text-accent text-xs font-mono uppercase mt-1">
                Top {100 - lookupPercentile(finalScore)}% of population
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-xs border-t border-card-border/50 pt-4 text-center mt-2">
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">
                  Personal Best
                </span>
                <div className="text-foreground font-mono text-sm">
                  {personalBest ? `${personalBest} digits` : '--'}
                </div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">
                  Percentile
                </span>
                <div className="text-foreground font-mono text-sm">
                  ~{Math.round(100 - lookupPercentile(finalScore))}%ile
                </div>
              </div>
            </div>

            {/* Challenge result comparison */}
            {challengeScore && (
              <div className={`w-full max-w-xs p-3 rounded-lg border text-center text-sm font-mono ${
                finalScore >= challengeScore
                  ? 'bg-emerald-950/10 border-emerald-900/50 text-emerald-400'
                  : 'bg-red-950/10 border-red-900/50 text-red-400'
              }`}>
                {finalScore >= challengeScore
                  ? `🏆 You beat the challenge! (${finalScore} vs ${challengeScore})`
                  : `Challenge not beaten (${finalScore} vs ${challengeScore})`}
              </div>
            )}

            <SocialShare
              testId="number-memory"
              score={finalScore}
              scoreLabel={`${finalScore} Digits`}
              testName="Number Memory Test"
            />

            <button
              onClick={startTest}
              className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Share Actions */}
      {phase === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-number-memory.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Score Card</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
