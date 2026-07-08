import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { useSound } from '../../runtime/useSound';
import { useI18n } from '../../runtime/useI18n';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';

type TestState = 'idle' | 'sequence' | 'waiting' | 'ready' | 'attempt-result' | 'jump-start' | 'result';

const F1LightsTest = () => {
  const { playTone, playClick, playError } = useSound();
  const { t } = useI18n();
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
  const totalAttempts = useRef<number>(5);
  const waitRange = useRef<{ min: number; max: number }>({ min: 800, max: 3000 });
  const lastConfig = useRef<GameConfig | null>(null);

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



  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptsCount = typeof cfg.attempts === 'number' ? cfg.attempts : 5;
    totalAttempts.current = attemptsCount;
    const diff = getDifficultyParams('f1-lights', (cfg.difficulty as string) || 'Medium');
    waitRange.current = { min: (diff.waitMin as number) || 800, max: (diff.waitMax as number) || 3000 };
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
        playTone(220 + i * 60, 0.15, 'square', 0.1); // rising tone per light
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
    const delay = waitRange.current.min + Math.random() * (waitRange.current.max - waitRange.current.min);
    
    triggerTimer.current = setTimeout(() => {
      setActiveRows(0);
      playTone(880, 0.25, 'sine', 0.2); // lights-out tone
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

    // Allow proceeding from attempt-result / result / jump-start states even if clickLock is engaged
    if (gameState === 'attempt-result' || gameState === 'result' || gameState === 'jump-start') {
      clickLock.current = false;
    }

    if (clickLock.current) return;

    if (gameState === 'idle') {
      startTest();
    } else if (gameState === 'sequence' || gameState === 'waiting') {
      // JUMP START (too early)
      clearTimers();
      setActiveRows(0);
      playError(); // error buzz
      setGameState('jump-start');
    } else if (gameState === 'ready') {
      const reactionTime = Math.round(performance.now() - startTime.current);
      
      if (reactionTime < 80) { // Anticipated jump start
        setGameState('jump-start');
        return;
      }

      clickLock.current = true;
      playClick(); // click feedback

      const updatedAttempts = [...attempts, reactionTime];
      setAttempts(updatedAttempts);
      setCurrentScore(reactionTime);

      if (updatedAttempts.length < totalAttempts.current) {
        setGameState('attempt-result');
      } else {
        const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / Math.max(1, updatedAttempts.length));
      finalizeTest(average, updatedAttempts);
      }
    } else if (gameState === 'attempt-result') {
      startSequence();
    } else if (gameState === 'jump-start' || gameState === 'result') {
      startTest(lastConfig.current || undefined);
    }
  };

  const finalizeTest = async (avgScore: number, allAttempts: number[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const percentile = lookupPercentile('f1-lights', avgScore, true);

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

    try {
      const card = await generateShareCard('F1 Start Lights Test', `${avgScore} ms`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'f1-lights', testName: 'F1 Start Lights', attempts: allAttempts, unit: 'ms',
      percentile, personalBest: pb, category: 'reaction', average: avgScore,
    });
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / Math.max(1, attempts.length));
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

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');
  useVisibilityGuard(() => {
    clearTimers();
    setGameState('jump-start');
  }, gameState === 'sequence' || gameState === 'waiting' || gameState === 'ready');

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-secondary">Active Challenge: Beat your friend's F1 start of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-secondary font-mono uppercase">{t('test.dismiss')}</button>
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
            ? 'bg-subtle border-emerald-500 shadow-emerald-950/10 shadow-2xl'
            : gameState === 'jump-start'
            ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
            : 'bg-card'
        }`}
      >
        <span className="text-muted text-xs font-mono uppercase">
          {gameState === 'sequence' || gameState === 'waiting'
            ? `Attempt ${attempts.length + 1} of ${totalAttempts.current} · ${t('f1.watch_gantry')}`
            : attempts.length >= totalAttempts.current 
            ? t('f1.assessment_complete')
            : `${t('test.attempts')} ${attempts.length + 1} / ${totalAttempts.current}`}
        </span>

        {/* Dynamic Light Rig Gantry */}
        <div className="flex justify-center gap-5 my-8">
          {[1, 2, 3, 4, 5].map((col) => {
            const isLit = col <= activeRows && gameState !== 'ready';
            return (
              <div key={col} className="w-14 bg-panel border-2 border-card-border rounded-md p-2 flex flex-col gap-3 items-center">
                {/* Light number indicator */}
                <span className="text-[10px] font-mono text-muted absolute -top-5">{col}</span>
                {/* Upper light pair */}
                <div className={`w-8 h-8 rounded-full border border-black transition-all duration-75 shadow-inner relative ${
                  isLit ? 'bg-red-600 shadow-red-500/50 ring-2 ring-red-500' : 'bg-subtle'
                }`}>
                  {isLit && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">●</span>}
                </div>
                {/* Lower light pair */}
                <div className={`w-8 h-8 rounded-full border border-black transition-all duration-75 shadow-inner relative ${
                  isLit ? 'bg-red-600 shadow-red-500/50 ring-2 ring-red-500' : 'bg-subtle'
                }`}>
                  {isLit && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">●</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* HUD Center Instructions */}
        <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center max-w-md">
          {gameState === 'idle' && (
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="w-full">
              <GameConfigPanel
                testId="f1-lights"
                icon="🏎️"
                title="F1 Start Lights Test"
                description="Wait for the five red lights to activate, then react the instant they turn off."
                personalBest={personalBest}
                personalBestLabel="ms"
                startLabel="Start Test"
                onStart={(config: GameConfig) => startTest(config)}
              />
            </div>
          )}

          {(gameState === 'sequence' || gameState === 'waiting') && (
            <h3 className="text-foreground dark:text-white font-mono text-sm tracking-wider uppercase">
              {gameState === 'waiting' ? t('f1.lights_holding') : t('f1.starting_seq')}
            </h3>
          )}

          {gameState === 'ready' && (
            <>
              <svg width="80" height="80" viewBox="0 0 80 80" className="mb-2">
                <polygon points="40,5 75,70 5,70" fill="none" stroke="var(--success)" strokeWidth="4" />
                <polygon points="40,25 60,60 20,60" fill="var(--success)" opacity="0.3" />
              </svg>
              <h2 className="text-5xl font-mono font-bold text-success tracking-widest uppercase select-none animate-pulse">
              {t('f1.go')}
              </h2>
              <span className="text-success/80 text-sm font-mono">{t('f1.lights_out')}</span>
            </>
          )}

          {gameState === 'attempt-result' && (
            <>
              <span className="text-muted text-xs font-mono">Attempt {attempts.length} time</span>
              <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
              <span className="text-xs text-muted font-mono uppercase mt-2">{t('f1.next_seq')}</span>
            </>
          )}

          {gameState === 'jump-start' && (
            <>
              <span className="text-error text-2xl">🚨</span>
              <h2 className="text-xl font-bold text-foreground">{t('f1.jump_start')}</h2>
              <p className="text-muted text-xs">
                {t('f1.clicked_before')}
              </p>
              <span className="text-xs text-error font-mono uppercase mt-2">{t('f1.click_restart')}</span>
            </>
          )}

          {gameState === 'result' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-muted text-xs font-mono">{t('f1.avg_reaction')}</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / Math.max(1, attempts.length))} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase">
                {t('rt.top_globally')} {formatTopPercentile(lookupPercentile('f1-lights', Math.round(attempts.reduce((a, b) => a + b, 0) / Math.max(1, attempts.length)), true))}% {t('f1.drivers_class')}
              </span>
            </div>
          )}
        </div>

        {/* Small stats layout */}
        {gameState === 'result' ? (
          <div className="grid grid-cols-2 gap-8 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-4">
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">{t('test.personal_best')}</span>
              <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
            </div>
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">{t('test.calibrated_hz')}</span>
              <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : t('test.detecting')}</div>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-muted dark:text-muted font-mono">{t('f1.press_spacebar')}</span>
        )}
      </div>

      {/* Share / Restart Buttons */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-f1-reflex.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>{t('f1.download_telemetry')}</span>
            </a>
          )}
          <button
            onClick={copyChallengeLink}
            className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{copiedChallenge ? t('test.challenge_copied') : t('test.challenge_friend')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(F1LightsTest);
