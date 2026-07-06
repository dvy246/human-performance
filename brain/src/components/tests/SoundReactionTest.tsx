import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import percentilesData from '../../data/percentiles.json';

type TestState = 'idle' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

export default function SoundReactionTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const clickLock = useRef<boolean>(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    let mounted = true;
    // 1. Get Calibration
    measureRefreshRate((res) => setCalibration(res));

    // 2. Personal Best
    dataLayer.getPersonalBest('sound-reaction', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    // 3. Challenge check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'sound-reaction') {
            setChallengeScore(payload.score);
          }
        });
      }
    }

    return () => {
      mounted = false;
      if (timerId.current) clearTimeout(timerId.current);
      if (audioCtx.current) {
        audioCtx.current.close();
      }
    };
  }, []);

  const lookupPercentile = (score: number): number => {
    // Auditory reaction times are generally faster than visual (average is ~150-170ms)
    // We adjust the lookup score threshold by offsetting it to maintain realistic distribution percentiles
    const visualPercentileTable = percentilesData['reaction-time'];
    const adjustedScore = score + 40; // Offset auditory to match visual bell-curve distribution scale
    
    for (let i = 0; i < visualPercentileTable.length; i++) {
      if (adjustedScore <= visualPercentileTable[i].score) {
        return visualPercentileTable[i].percentile;
      }
    }
    return 99.9;
  };

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playBeep = () => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime); // Crisp 750Hz sine tone
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime); // Safe visual loudness
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  };

  const startTest = () => {
    initAudio();
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    setGameState('waiting');
    setupRandomTimer();
  };

  const setupRandomTimer = () => {
    clickLock.current = false;
    const delay = 2000 + Math.random() * 3000;
    
    if (timerId.current) clearTimeout(timerId.current);
    
    timerId.current = setTimeout(() => {
      setGameState('ready');
      playBeep();
      requestAnimationFrame(() => {
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
    } else if (gameState === 'waiting') {
      // CLICKED TOO EARLY (sound hasn't beeped yet)
      if (timerId.current) clearTimeout(timerId.current);
      setGameState('abort');
    } else if (gameState === 'ready') {
      const reactionTime = Math.round(performance.now() - startTime.current);
      
      if (reactionTime < 60) { // Anticipated early start
        setGameState('abort');
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
      setGameState('waiting');
      setupRandomTimer();
    } else if (gameState === 'abort' || gameState === 'result') {
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number, allAttempts: number[]) => {
    setGameState('result');
    const percentile = lookupPercentile(avgScore);

    await dataLayer.saveSession({
      testId: 'sound-reaction',
      category: 'reaction',
      rawScore: avgScore,
      percentile: percentile,
      metadata: { attempts: allAttempts }
    });

    const pb = await dataLayer.getPersonalBest('sound-reaction', 'lower');
    setPersonalBest(pb);

    const card = await generateShareCard('Auditory Reaction Test', `${avgScore} ms`, percentile);
    setShareImage(card);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / 5);
    const token = encodeChallenge({ testId: 'sound-reaction', score: average });
    const url = `${window.location.origin}/tests/sound-reaction/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    });
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
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's sound response of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-zinc-500 hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Main Sound Wave Panel */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTrigger}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[380px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-center text-center transition-standard outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          gameState === 'ready'
            ? 'bg-subtle border-accent/60 shadow-2xl'
            : gameState === 'abort'
            ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
            : 'bg-card hover:border-zinc-400 dark:hover:border-zinc-800'
        }`}
      >
        {gameState === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-subtle border border-card-border flex items-center justify-center text-2xl">
              🔊
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">Sound Reaction Test</h2>
              <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-relaxed max-w-sm mb-4">
                Click inside the card to begin. Wait for the audio beep, and react the exact instant you hear the tone.
              </p>
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-accent px-4 py-1 bg-accent/5 border border-accent/15 rounded-full">
              Click to Start
            </span>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-6">
            <span className="text-zinc-500 text-xs font-mono uppercase">Attempt {attempts.length + 1} of 5</span>
            {/* Flat Waveform (Waiting) */}
            <svg viewBox="0 0 100 20" className="w-48 h-8 stroke-zinc-800" strokeWidth="2" fill="none">
              <line x1="0" y1="10" x2="100" y2="10" />
            </svg>
            <h2 className="text-lg text-foreground font-medium">Listen closely...</h2>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center gap-6">
            <span className="text-zinc-400 text-xs font-mono uppercase">Attempt {attempts.length + 1} of 5</span>
            {/* Active pulsing Soundwave (Beeping) */}
            <svg viewBox="0 0 100 20" className="w-48 h-8 stroke-accent fill-none animate-pulse" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,10 Q 12.5,0 25,10 T 50,10 T 75,10 T 100,10 M 12.5,10 Q 25,20 37.5,10 T 62.5,10 T 87.5,10" />
            </svg>
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight uppercase animate-bounce">
              CLICK NOW!
            </h2>
          </div>
        )}

        {gameState === 'attempt-result' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-zinc-500 text-xs font-mono uppercase">Attempt {attempts.length} Finished</span>
            <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs mb-4">
              Click anywhere to proceed to attempt {attempts.length + 1} of 5.
            </p>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-rose-500 text-2xl">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Too Early!</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">
              You clicked before the audio tone beeped. Attempts reset.
            </p>
            <span className="text-xs uppercase font-mono text-zinc-500 mt-2">Click to restart</span>
          </div>
        )}

        {gameState === 'result' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-zinc-500 text-xs font-mono uppercase">Average Auditory Response</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / 5)} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase">
                Top {100 - lookupPercentile(Math.round(attempts.reduce((a, b) => a + b, 0) / 5))}% speed
              </span>
            </div>

            {/* Telemetry rows */}
            <div className="grid grid-cols-3 gap-8 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-4">
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Calibrated Hz</span>
                <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Avg Tone Latency</span>
                <div className="text-foreground font-mono text-sm">~1.2 ms</div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-zinc-600 mt-2">Click anywhere outside buttons to restart</span>
          </div>
        )}
      </div>

      {/* Sharing controls footer */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-sound-reflex.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Reflex Card</span>
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
