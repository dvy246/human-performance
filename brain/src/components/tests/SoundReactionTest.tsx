import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';

type TestState = 'idle' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

function SoundReactionTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<boolean>(false);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const rafId = useRef<number>(0);
  const clickLock = useRef<boolean>(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const submittedRef = useRef<boolean>(false);
  const totalAttempts = useRef<number>(5);
  const waitRange = useRef<{ min: number; max: number }>({ min: 2000, max: 5000 });
  const lastConfig = useRef<GameConfig | null>(null);

  useEffect(() => {
    let mounted = true;
    // 1. Get Calibration
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });

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
        }).catch(console.error);
      }
    }

    return () => {
      mounted = false;
      if (timerId.current) clearTimeout(timerId.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (audioCtx.current) {
        audioCtx.current.close();
      }
    };
  }, []);



  const initAudio = async () => {
    if (typeof window === 'undefined') return false;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
      }
      setAudioError(false);
      return true;
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
      setAudioError(true);
      return false;
    }
  };

  const playBeep = () => {
    if (!audioCtx.current) {
      setAudioError(true);
      return;
    }
    try {
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
      setAudioError(false);
    } catch (err) {
      console.error('Failed to play beep:', err);
      setAudioError(true);
    }
  };

  const startTest = async (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : 5;
    totalAttempts.current = attemptCount;
    const diff = getDifficultyParams('sound-reaction', (cfg.difficulty as string) || 'Medium');
    waitRange.current = { min: (diff.waitMin as number) || 2000, max: (diff.waitMax as number) || 5000 };

    const audioInitialized = await initAudio();
    if (!audioInitialized) {
      console.warn('Audio initialization failed - test will continue with visual feedback only');
    }
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    submittedRef.current = false;
    setGameState('waiting');
    setupRandomTimer(waitRange.current.min, waitRange.current.max);
  };

  const setupRandomTimer = (waitMin = 2000, waitMax = 5000) => {
    clickLock.current = false;
    const delay = waitMin + Math.random() * (waitMax - waitMin);
    
    if (timerId.current) clearTimeout(timerId.current);
    
    timerId.current = setTimeout(() => {
      setGameState('ready');
      playBeep();
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      });
    }, delay);
  };

  const handleTrigger = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    // Allow proceeding from attempt-result / result / abort states even if clickLock is engaged
    if (gameState === 'attempt-result' || gameState === 'result' || gameState === 'abort') {
      clickLock.current = false;
    }

    if (clickLock.current) return;

    if (gameState === 'idle') {
      startTest(lastConfig.current || undefined);
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

      if (updatedAttempts.length < totalAttempts.current) {
        setGameState('attempt-result');
      } else {
        const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / totalAttempts.current);
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
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const percentile = lookupPercentile('sound-reaction', avgScore, true);

    try {
      await dataLayer.saveSession({
        testId: 'sound-reaction',
        category: 'reaction',
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts }
      });
    } catch (err) {
      console.error('Failed to save Sound Reaction session:', err);
    }

    const pb = await dataLayer.getPersonalBest('sound-reaction', 'lower');
    setPersonalBest(pb);

    const card = await generateShareCard('Auditory Reaction Test', `${avgScore} ms`, percentile);
    setShareImage(card);

    redirectToResults({
      testId: 'sound-reaction', testName: 'Sound Reaction', attempts: allAttempts, unit: 'ms',
      percentile, personalBest: pb, category: 'reaction', average: avgScore,
    });
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / Math.max(1, attempts.length));
    const token = encodeChallenge({ testId: 'sound-reaction', score: average });
    const url = `${window.location.origin}/tests/sound-reaction/?challenge=${token}`;
    
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

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's sound response of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-foreground font-mono uppercase">Dismiss</button>
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
            : 'bg-card hover:border-muted'
        }`}
      >
        {gameState === 'idle' && (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <GameConfigPanel
              testId="sound-reaction"
              icon="🔊"
              title="Sound Reaction Test"
              description="Click inside the card to begin. Wait for the audio beep, and react the exact instant you hear the tone."
              personalBest={personalBest}
              personalBestLabel="ms"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-6">
            <span className="text-muted text-xs font-mono uppercase">Attempt {attempts.length + 1} of {totalAttempts.current}</span>
            {/* Flat Waveform (Waiting) */}
            <svg viewBox="0 0 100 20" className="w-48 h-8 stroke-[var(--border-primary)]" strokeWidth="2" fill="none">
              <line x1="0" y1="10" x2="100" y2="10" />
            </svg>
            <h2 className="text-lg text-foreground font-medium">Listen closely...</h2>
            {audioError && (
              <p className="text-warning text-xs font-mono text-center max-w-xs">
                ⚠️ Audio unavailable. Using visual feedback only.
              </p>
            )}
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center gap-6">
            <span className="text-secondary text-xs font-mono uppercase">Attempt {attempts.length + 1} of {totalAttempts.current}</span>
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
            <span className="text-muted text-xs font-mono uppercase">Attempt {attempts.length} Finished</span>
            <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
            <p className="text-muted text-xs mb-4">
              Click anywhere to proceed to attempt {attempts.length + 1} of {totalAttempts.current}.
            </p>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-error text-2xl">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Too Early!</h2>
            <p className="text-muted text-xs">
              You clicked before the audio tone beeped. Attempts reset.
            </p>
            <span className="text-xs uppercase font-mono text-muted mt-2">Click to restart</span>
          </div>
        )}

        {gameState === 'result' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted text-xs font-mono uppercase">Average Auditory Response</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / totalAttempts.current)} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase">
                Top {formatTopPercentile(lookupPercentile('sound-reaction', Math.round(attempts.reduce((a, b) => a + b, 0) / totalAttempts.current), true))}% speed
              </span>
            </div>

            {/* Telemetry rows */}
            <div className="grid grid-cols-3 gap-8 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-4">
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Calibrated Hz</span>
                <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Avg Tone Latency</span>
                <div className="text-foreground font-mono text-sm">~1.2 ms</div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-muted mt-2">Click anywhere outside buttons to restart</span>
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
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
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

export default withErrorBoundary(SoundReactionTest);
