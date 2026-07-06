import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import percentilesData from '../../data/percentiles.json';

type TestState = 'idle' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

interface ColorState {
  name: string;
  hex: string;
  isTarget: boolean;
}

const COLORS: ColorState[] = [
  { name: 'GREEN', hex: '#10b981', isTarget: true }, // Target (Go)
  { name: 'RED', hex: '#ef4444', isTarget: false },    // Distractors (No-Go)
  { name: 'BLUE', hex: '#3b82f6', isTarget: false },
  { name: 'YELLOW', hex: '#eab308', isTarget: false },
  { name: 'PURPLE', hex: '#8b5cf6', isTarget: false }
];

export default function GoNoGoTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [currentColor, setCurrentColor] = useState<ColorState | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [falseAlarms, setFalseAlarms] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const targetTimeoutId = useRef<any>(null);
  const clickLock = useRef<boolean>(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });
    dataLayer.getPersonalBest('go-no-go', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'go-no-go') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => {
      mounted = false;
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (timerId.current) clearTimeout(timerId.current);
    if (targetTimeoutId.current) clearTimeout(targetTimeoutId.current);
  };

  const lookupPercentile = (score: number): number => {
    // Go/No-Go average latency is ~320ms due to decision check.
    const visualPercentileTable = percentilesData['reaction-time'];
    const adjustedScore = Math.max(120, score - 80);
    
    for (let i = 0; i < visualPercentileTable.length; i++) {
      if (adjustedScore <= visualPercentileTable[i].score) {
        return visualPercentileTable[i].percentile;
      }
    }
    return 99.9;
  };

  const startTest = () => {
    setAttempts([]);
    setFalseAlarms(0);
    setCurrentScore(null);
    setShareImage(null);
    setGameState('waiting');
    queueNextSignal();
  };

  const queueNextSignal = () => {
    setCurrentColor(null);
    clickLock.current = false;
    clearTimers();

    const delay = 1000 + Math.random() * 2000;
    timerId.current = setTimeout(() => {
      // 35% chance to spawn target, 65% chance to spawn distractor
      const isTargetSpawn = Math.random() < 0.35;
      let selected: ColorState;

      if (isTargetSpawn) {
        selected = COLORS[0]; // GREEN
      } else {
        const distractors = COLORS.slice(1);
        selected = distractors[Math.floor(Math.random() * distractors.length)];
      }

      setCurrentColor(selected);
      setGameState('ready');

      if (selected.isTarget) {
        // Start reaction timer
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            startTime.current = performance.now();
          });
        });

        // If user fails to click the target in 1.5 seconds, trigger omission error
        targetTimeoutId.current = setTimeout(() => {
          handleOmission();
        }, 1500);
      } else {
        // Distractor stays on screen for 1 second, then disappears
        targetTimeoutId.current = setTimeout(() => {
          // Success: user successfully inhibited clicking
          setGameState('waiting');
          queueNextSignal();
        }, 1000);
      }
    }, delay);
  };

  const handleOmission = () => {
    if (clickLock.current) return;
    clickLock.current = true;

    // Missed target: add +250ms penalty attempt
    const finalScore = 1500 + 250;
    const updatedAttempts = [...attempts, finalScore];
    setAttempts(updatedAttempts);
    setCurrentScore(finalScore);

    if (updatedAttempts.length < 5) {
      setGameState('attempt-result');
    } else {
      const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / 5);
      finalizeTest(average, updatedAttempts.length);
    }
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickLock.current) return;

    if (gameState === 'waiting') {
      // Early click before any color flashes
      clearTimers();
      setGameState('abort');
      return;
    }

    if (gameState === 'ready' && currentColor) {
      clickLock.current = true;
      clearTimers();

      if (currentColor.isTarget) {
        // Hit!
        const elapsed = Math.round(performance.now() - startTime.current);
        const updatedAttempts = [...attempts, elapsed];
        setAttempts(updatedAttempts);
        setCurrentScore(elapsed);

        if (updatedAttempts.length < 5) {
          setGameState('attempt-result');
        } else {
          const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / 5);
          finalizeTest(average, updatedAttempts.length);
        }
      } else {
        // False Alarm click on distractor!
        setFalseAlarms((prev) => prev + 1);
        setGameState('attempt-result');
        setCurrentScore(null); // Displays False Alarm message
      }
    } else if (gameState === 'attempt-result') {
      setGameState('waiting');
      queueNextSignal();
    } else if (gameState === 'abort' || gameState === 'result' || gameState === 'idle') {
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number, roundsCount: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    
    // Penalize score for False Alarms: add +250ms per false alarm to the final average
    const finalAverage = avgScore + (falseAlarms * 250);
    const percentile = lookupPercentile(finalAverage);

    await dataLayer.saveSession({
      testId: 'go-no-go',
      category: 'reaction',
      rawScore: finalAverage,
      percentile: percentile,
      metadata: { falseAlarms, attempts }
    });

    const pb = await dataLayer.getPersonalBest('go-no-go', 'lower');
    setPersonalBest(pb);

    const card = await generateShareCard('Go/No-Go Color Test', `${finalAverage} ms`, percentile);
    setShareImage(card);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const avgScore = Math.round(attempts.reduce((a, b) => a + b, 0) / 5) + (falseAlarms * 250);
    const token = encodeChallenge({ testId: 'go-no-go', score: avgScore });
    const url = `${window.location.origin}/tests/go-no-go/?challenge=${token}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's Go/No-Go score of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-zinc-500 hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={handleScreenClick}
        className={`w-full min-h-[300px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-standard select-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          gameState === 'ready' && currentColor ? 'transition-none' : ''
        }`}
        style={{
          backgroundColor: gameState === 'ready' && currentColor ? currentColor.hex : undefined
        }}
      >
        {gameState === 'idle' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl">🟢</span>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Go/No-Go Color Test</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
              Click the screen <strong className="text-emerald-400">ONLY when GREEN</strong> appears. 
              If other colors flash (Red, Blue, Purple, Yellow), suppress your click and wait. 
              False clicks or misses carry a <strong className="text-rose-400">+250ms penalty</strong>!
            </p>
            <span className="text-xs uppercase font-mono tracking-widest text-accent mt-2">Click card to start</span>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded bg-subtle border border-card-border animate-pulse flex items-center justify-center text-zinc-500 dark:text-zinc-600 font-mono text-xs">WAIT</div>
            <p className="text-zinc-500 font-mono text-xs uppercase mt-3">Rounds: {attempts.length} / 5 &middot; Click ONLY on GREEN</p>
          </div>
        )}

        {gameState === 'ready' && currentColor && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-black font-extrabold text-3xl tracking-wider filter drop-shadow">
              {currentColor.name}
            </span>
          </div>
        )}

        {gameState === 'attempt-result' && (
          <div className="flex flex-col items-center gap-3">
            {currentScore !== null ? (
              <>
                <span className="text-zinc-500 text-xs font-mono uppercase">Reaction Latency</span>
                <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
              </>
            ) : (
              <>
                <span className="text-rose-500 text-2xl">⚠️</span>
                <div className="text-2xl font-mono font-bold text-rose-500 uppercase tracking-wide">False Alarm!</div>
                <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                  You clicked on a distractor color. +250ms penalty added to final average.
                </p>
              </>
            )}
            <span className="text-xs text-zinc-500 font-mono uppercase mt-4 animate-pulse">Click card to continue</span>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-rose-500 text-2xl">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Early Click!</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">
              You clicked before a color flashed.
            </p>
            <span className="text-xs uppercase font-mono text-zinc-500 mt-2">Click card to restart</span>
          </div>
        )}

        {gameState === 'result' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-zinc-500 text-xs font-mono uppercase">Inhibitory Reaction Average</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / 5) + (falseAlarms * 250)} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase mt-1">
                Top {100 - lookupPercentile(Math.round(attempts.reduce((a, b) => a + b, 0) / 5) + (falseAlarms * 250))}% globally
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-3">
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Calibration</span>
                <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">False Alarms</span>
                <div className="text-foreground font-mono text-sm">{falseAlarms}</div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-zinc-650 mt-2">Click card to try again</span>
          </div>
        )}
      </div>

      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-go-no-go.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Go/No-Go Profile</span>
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
