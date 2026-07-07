import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import percentilesData from '../../data/percentiles.json';

type TestState = 'idle' | 'sequence' | 'waiting' | 'ready' | 'attempt-result' | 'jump-start' | 'result';

export default function F1LightsTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [activeRows, setActiveRows] = useState<number>(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const sequenceTimers = useRef<any[]>([]);
  const triggerTimer = useRef<any>(null);
  const rafId = useRef<number>(0);
  const clickLock = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    // 1. Get Calibration
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });

    // 2. Personal Best
    dataLayer.getPersonalBest('f1-lights', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    // 3. Challenge check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'f1-lights') {
            setChallengeScore(payload.score);
          }
        }).catch(console.error);
      }
    }

    return () => { mounted = false; clearTimers(); };
  }, []);

  const clearTimers = () => {
    sequenceTimers.current.forEach(t => clearTimeout(t));
    sequenceTimers.current = [];
    if (triggerTimer.current) clearTimeout(triggerTimer.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  const lookupPercentile = (score: number): number => {
    // F1 starts require slightly faster trigger response (average ~220ms on F1 lights vs ~250ms visual)
    // We adjust the percentile mapping slightly or reuse reaction-time percentiles.
    const table = percentilesData['reaction-time'];
    for (let i = 0; i < table.length; i++) {
      if (score <= table[i].score) {
        return table[i].percentile;
      }
    }
    return 99.9;
  };

  const startTest = () => {
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    submittedRef.current = false;
    startSequence();
  };

  const startSequence = () => {
    clickLock.current = false;
    clearTimers();
    setActiveRows(0);
    setGameState('sequence');

    // Light up 1 row every 1000ms
    for (let i = 1; i <= 5; i++) {
      const timer = setTimeout(() => {
        setActiveRows(i);
        if (i === 5) {
          // All rows lit, begin wait for extinguish
          setGameState('waiting');
          triggerExtinguish();
        }
      }, i * 800); // 800ms intervals feels faster and cleaner
      sequenceTimers.current.push(timer);
    }
  };

  const triggerExtinguish = () => {
    // Random delay between 800ms and 3000ms for F1 starts
    const delay = 800 + Math.random() * 2200;
    
    triggerTimer.current = setTimeout(() => {
      setActiveRows(0);
      setGameState('ready');
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      });
    }, delay);
  };

  const handleTrigger = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (clickLock.current) return;

    if (gameState === 'idle') {
      startTest();
    } else if (gameState === 'sequence' || gameState === 'waiting') {
      // JUMP START (too early)
      clearTimers();
      setActiveRows(0);
      setGameState('jump-start');
    } else if (gameState === 'ready') {
      const reactionTime = Math.round(performance.now() - startTime.current);
      
      if (reactionTime < 80) { // Anticipated jump start
        setGameState('jump-start');
        return;
      }

      clickLock.current = true;

      const updatedAttempts = [...attempts, reactionTime];
      setAttempts(updatedAttempts);
      setCurrentScore(reactionTime);

      if (updatedAttempts.length < 5) {
        setGameState('attempt-result');
      } else {
        const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / 5);
        finalizeTest(average, updatedAttempts);
      }
    } else if (gameState === 'attempt-result') {
      startSequence();
    } else if (gameState === 'jump-start' || gameState === 'result') {
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number, allAttempts: number[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const percentile = lookupPercentile(avgScore);

    try {
      await dataLayer.saveSession({
        testId: 'f1-lights',
        category: 'reaction',
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts }
      });
    } catch (err) {
      console.error('Failed to save F1 Lights session:', err);
    }

    const pb = await dataLayer.getPersonalBest('f1-lights', 'lower');
    setPersonalBest(pb);

    const card = await generateShareCard('F1 Start Lights Test', `${avgScore} ms`, percentile);
    setShareImage(card);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / 5);
    const token = encodeChallenge({ testId: 'f1-lights', score: average });
    const url = `${window.location.origin}/tests/f1-lights/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      handleTrigger(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-zinc-300">Active Challenge: Beat your friend's F1 start of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Gantry Screen Panel */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTrigger}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[380px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-between transition-standard outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          gameState === 'ready' 
            ? 'bg-zinc-950 border-emerald-500 shadow-emerald-950/10 shadow-2xl'
            : gameState === 'jump-start'
            ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
            : 'bg-card'
        }`}
      >
        <span className="text-zinc-600 text-xs font-mono uppercase">
          {gameState === 'sequence' || gameState === 'waiting'
            ? `Attempt ${attempts.length + 1} of 5 &middot; WATCH GANTRY`
            : attempts.length === 5 
            ? 'Assessment Complete'
            : `Attempt ${attempts.length + 1} of 5`}
        </span>

        {/* Dynamic Light Rig Gantry */}
        <div className="flex justify-center gap-5 my-8">
          {[1, 2, 3, 4, 5].map((col) => {
            const isLit = col <= activeRows && gameState !== 'ready';
            return (
              <div key={col} className="w-14 bg-zinc-900 border-2 border-zinc-800 rounded-md p-2 flex flex-col gap-3 items-center">
                {/* Upper light pair */}
                <div className={`w-8 h-8 rounded-full border border-black transition-all duration-75 shadow-inner ${
                  isLit ? 'bg-red-600 shadow-red-500/50 ring-2 ring-red-500' : 'bg-zinc-950'
                }`} />
                {/* Lower light pair */}
                <div className={`w-8 h-8 rounded-full border border-black transition-all duration-75 shadow-inner ${
                  isLit ? 'bg-red-600 shadow-red-500/50 ring-2 ring-red-500' : 'bg-zinc-950'
                }`} />
              </div>
            );
          })}
        </div>

        {/* HUD Center Instructions */}
        <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center max-w-md">
          {gameState === 'idle' && (
            <>
              <h2 className="text-xl font-bold text-foreground tracking-tight">F1 Start Lights Test</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                Click inside the card or press **Spacebar** to start. Wait for the five red lights to light up, and react the exact instant they turn off.
              </p>
              <span className="text-xs uppercase font-mono tracking-widest text-accent mt-2">Click to start</span>
            </>
          )}

          {(gameState === 'sequence' || gameState === 'waiting') && (
            <h3 className="text-foreground dark:text-white font-mono text-sm tracking-wider uppercase">
              {gameState === 'waiting' ? 'Lights are holding... REACT ON OUT' : 'Starting Sequence...'}
            </h3>
          )}

          {gameState === 'ready' && (
            <h2 className="text-5xl font-mono font-bold text-emerald-400 tracking-widest uppercase select-none animate-pulse">
              GO! GO! GO!
            </h2>
          )}

          {gameState === 'attempt-result' && (
            <>
              <span className="text-zinc-500 text-xs font-mono">Attempt {attempts.length} time</span>
              <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono uppercase mt-2">Click anywhere to load next sequence</span>
            </>
          )}

          {gameState === 'jump-start' && (
            <>
              <span className="text-rose-500 text-2xl">🚨</span>
              <h2 className="text-xl font-bold text-foreground">JUMP START!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                You clicked before the lights went out. Sequence cancelled.
              </p>
              <span className="text-xs text-rose-500 font-mono uppercase mt-2">Click to restart</span>
            </>
          )}

          {gameState === 'result' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-zinc-500 text-xs font-mono">Average Reaction speed</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / 5)} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase">
                Top {100 - lookupPercentile(Math.round(attempts.reduce((a, b) => a + b, 0) / 5))}% drivers class
              </span>
            </div>
          )}
        </div>

        {/* Small stats layout */}
        {gameState === 'result' ? (
          <div className="grid grid-cols-2 gap-8 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-4">
            <div>
              <span className="text-zinc-500 text-[10px] font-mono uppercase">Personal Best</span>
              <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] font-mono uppercase">Calibrated Hz</span>
              <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-600 font-mono">PRESS SPACEBAR / TOUCH TO TRIGGER</span>
        )}
      </div>

      {/* Share / Restart Buttons */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-f1-reflex.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download F1 Telemetry</span>
            </a>
          )}
          <button
            onClick={copyChallengeLink}
            className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{copiedChallenge ? 'Telemetry Copied!' : 'Challenge a Friend'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
