import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import SocialShare from '../ui/SocialShare';
import { useSound } from '../../runtime/useSound';
import { useI18n } from '../../runtime/useI18n';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';

type GameState = 'idle' | 'calibration' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

function ReactionTimeTest() {
  const { playTone, playClick, playError } = useSound();
  const { t } = useI18n();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [finalAverage, setFinalAverage] = useState<number | null>(null);
  const [resultPercentile, setResultPercentile] = useState<number>(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const rafId = useRef<number>(0);
  const clickLock = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);
  const totalAttempts = useRef<number>(5);
  const waitRange = useRef<{ min: number; max: number }>({ min: 2000, max: 5000 });
  const lastConfig = useRef<GameConfig | null>(null);

  // Load initial settings and check for a challenge token in the URL
  useEffect(() => {
    let mounted = true;

    // 1. Calibration on mount
    const cleanupCalibration = measureRefreshRate((result) => {
      if (mounted) setCalibration(result);
    });

    // 2. Personal Best from history
    dataLayer.getPersonalBest('reaction-time', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    // 3. Challenge check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'reaction-time') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error);
      }
    }

    return () => { 
      mounted = false; 
      if (timerId.current) clearTimeout(timerId.current); 
      if (rafId.current) cancelAnimationFrame(rafId.current); 
      cleanupCalibration();
    };
  }, []);



  const startTest = (config?: GameConfig) => {
    if (clickLock.current) return;
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptsCount = typeof cfg.attempts === 'number' ? cfg.attempts : 5;
    totalAttempts.current = attemptsCount;
    const diff = getDifficultyParams('reaction-time', (cfg.difficulty as string) || 'Medium');
    waitRange.current = { min: (diff.waitMin as number) || 2000, max: (diff.waitMax as number) || 5000 };
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    submittedRef.current = false;
    setGameState('waiting');
    setupRandomTimer(diff.waitMin as number, diff.waitMax as number);
  };

  const setupRandomTimer = (waitMin = 2000, waitMax = 5000) => {
    clickLock.current = false;
    const delay = waitMin + Math.random() * (waitMax - waitMin);
    
    if (timerId.current) clearTimeout(timerId.current);
    
    timerId.current = setTimeout(() => {
      // Paint-synchronized transition
      playTone(880, 0.15, 'sine', 0.15); // green screen tone
      setGameState('ready');
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      });
    }, delay);
  };

  const handleTestClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    // Allow proceeding from attempt-result / result / abort states even if clickLock is engaged
    if (gameState === 'attempt-result' || gameState === 'result' || gameState === 'abort') {
      clickLock.current = false;
    }

    if (clickLock.current) return;

    if (gameState === 'idle') {
      startTest();
    } else if (gameState === 'waiting') {
      // CLICKED TOO EARLY
      if (timerId.current) clearTimeout(timerId.current);
      playError();
      setGameState('abort');
    } else if (gameState === 'ready') {
      // SUCCESSFUL CLICK
      playClick();
      const clickTime = performance.now();
      const score = Math.round(clickTime - startTime.current);
      
      // Filter out physical impossibilities (< 80ms) as potential cheat/anticipation
      if (score < 80) {
        setGameState('abort');
        return;
      }

      clickLock.current = true;

      setAttempts(prev => {
        const updated = [...prev, score];
        
        if (updated.length < totalAttempts.current) {
          setGameState('attempt-result');
        } else {
          // Compute average score
          const average = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
          finalizeTest(average, updated);
        }
        return updated;
      });
      setCurrentScore(score);
    } else if (gameState === 'attempt-result') {
      // Proceed to next attempt
      setGameState('waiting');
      setupRandomTimer(waitRange.current.min, waitRange.current.max);
    } else if (gameState === 'abort') {
      // Retry
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number, allAttempts: number[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    setFinalAverage(avgScore);
    const percentile = lookupPercentile('reaction-time', avgScore, true);
    setResultPercentile(percentile);

    // Save session record
    try {
      await dataLayer.saveSession({
        testId: 'reaction-time',
        category: 'reaction',
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts }
      });
    } catch (err) {
      console.error('Failed to save Reaction Time session:', err);
    }

    // Check if new PB
    const existingPb = await dataLayer.getPersonalBest('reaction-time', 'lower');
    setPersonalBest(existingPb);

    // Pre-generate Share Card Image in background
    try {
      const cardDataUrl = await generateShareCard('Reaction Time Test', `${avgScore} ms`, percentile);
      setShareImage(cardDataUrl);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'reaction-time', testName: 'Reaction Time', attempts: allAttempts, unit: 'ms',
      percentile, personalBest: existingPb, category: 'reaction', average: avgScore,
    });
  };

  // SVG Normal Distribution Chart Calculations
  const renderSVGChart = (userScore: number) => {
    const width = 500;
    const height = 150;
    const mean = 260; // population mean
    const stdDev = 40; // standard deviation
    const minX = 100;
    const maxX = 420;

    const points: string[] = [];
    
    // Build distribution curve path
    for (let x = minX; x <= maxX; x += 2) {
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
      const yVal = height - (Math.exp(exponent) * height * 0.85) - 10;
      const svgX = ((x - minX) / (maxX - minX)) * width;
      points.push(`${svgX},${yVal}`);
    }

    const pathData = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

    // Map user score to X coordinate
    const clampedUserScore = Math.max(minX, Math.min(maxX, userScore));
    const userX = ((clampedUserScore - minX) / (maxX - minX)) * width;
    
    // User Y height on curve
    const userExponent = -Math.pow(clampedUserScore - mean, 2) / (2 * Math.pow(stdDev, 2));
    const userY = height - (Math.exp(userExponent) * height * 0.85) - 10;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 mt-4 overflow-visible">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Distribution Curve Fill */}
        <path d={pathData} fill="url(#curveGradient)" />
        
        {/* Distribution Curve Line */}
        <path d={`M 0,${height} L ${points.join(' L ')}`} fill="none" stroke="var(--chart-accent)" strokeWidth="2.5" />
        
        {/* Baseline */}
        <line x1="0" y1={height} x2={width} y2={height} stroke="var(--border-primary)" strokeWidth="2" />
        
        {/* Average Marker */}
        <line x1={((mean - minX) / (maxX - minX)) * width} y1="0" x2={((mean - minX) / (maxX - minX)) * width} y2={height} stroke="var(--border-hover)" strokeDasharray="3,3" />
        <text x={((mean - minX) / (maxX - minX)) * width + 4} y="20" fill="var(--text-muted)" className="text-[10px] font-mono">Avg (260ms)</text>

        {/* User Score Pin */}
        <line x1={userX} y1={userY} x2={userX} y2={height} stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="2,2" />
        <circle cx={userX} cy={userY} r="5" fill="var(--bg-primary)" stroke="var(--chart-accent)" strokeWidth="2.5" className="animate-pulse" />
        
        {/* User Marker Label */}
        <g transform={`translate(${Math.max(45, Math.min(width - 55, userX))}, ${userY - 18})`}>
          <rect x="-40" y="-12" width="80" height="18" rx="3" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="0.5" />
          <text textAnchor="middle" fill="var(--text-primary)" className="text-[10px] font-bold font-mono" y="0">YOU: {userScore}ms</text>
        </g>
      </svg>
    );
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    
    // Average score is the last recorded attempts' average
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / totalAttempts.current);
    const token = encodeChallenge({ testId: 'reaction-time', score: average });
    const url = `${window.location.origin}/tests/reaction-time/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');

  // Keyboard navigation support: Spacebar/Enter triggers clicks
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      handleTestClick(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto relative">
      {gameState !== 'idle' && gameState !== 'result' && (
        <button onClick={() => setGameState('idle')} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
      )}
      {/* Target Challenge Display */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-accent"><path d="M6 12 10 16 18 8"/></svg>
            <span>{t('test.challenge_beat')} <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          </div>
          <button 
            onClick={() => setChallengeScore(null)} 
            className="text-[11px] text-muted hover:text-secondary transition-colors uppercase font-mono"
          >
            {t('test.dismiss')}
          </button>
        </div>
      )}

      {/* Main Interactive Panel */}
      <div
        role="button"
        tabIndex={0}
        aria-live="polite"
        aria-atomic="true"
        onClick={handleTestClick}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[380px] rounded-xl flex flex-col items-center justify-center p-8 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background transition-standard ${
          gameState === 'waiting'
            ? 'bg-rose-900/90 text-white border border-rose-700 shadow-rose-950/20 shadow-2xl'
            : gameState === 'ready' 
            ? 'bg-emerald-600/90 text-white shadow-emerald-950/20 shadow-2xl border border-emerald-500' 
            : gameState === 'abort'
            ? 'bg-rose-950/40 text-rose-200 border border-rose-900/50'
            : 'bg-card text-foreground/80 border border-card-border hover:border-muted'
        }`}
      >
        {gameState === 'idle' && (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <GameConfigPanel
              testId="reaction-time"
              icon="⚡"
              title="Reaction Time Test"
              description="When the red screen turns green, click as fast as you can."
              personalBest={personalBest}
              personalBestLabel="ms"
              startLabel="Start Test"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-4 relative">
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white/70">WAITING</span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">{t('rt.waiting')}</h2>
            <div className="flex items-center gap-2 text-white/80 text-sm font-mono">
              <svg width="20" height="20" viewBox="0 0 20 20" className="inline-block">
                <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="10" y1="4" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>{t('rt.stop')}</span>
            </div>
            <p className="text-white/60 text-xs uppercase font-mono">{t('test.attempts')} {attempts.length + 1} / {totalAttempts.current}</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center gap-2 relative">
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white/70">GO!</span>
            <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2">
              <polygon points="30,5 55,50 5,50" fill="none" stroke="white" strokeWidth="3" />
              <polygon points="30,20 45,45 15,45" fill="white" opacity="0.3" />
            </svg>
            <h2 className="text-6xl font-extrabold text-white tracking-tighter drop-shadow-md select-none">
              {t('rt.click')}
            </h2>
            <span className="text-white/80 text-sm font-mono uppercase">{t('rt.green_now')}</span>
          </div>
        )}

        {gameState === 'attempt-result' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-muted text-xs uppercase font-mono">{t('test.attempts')} {attempts.length} {t('rt.finished')}</span>
            <div className="text-5xl font-mono font-bold text-foreground">{currentScore} ms</div>
            <p className="text-muted text-sm max-w-sm mb-4">
              {t('rt.proceed')} {attempts.length + 1} / {totalAttempts.current}.
            </p>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-error text-2xl">⚠️</span>
            <h2 className="text-2xl font-bold text-foreground">{t('rt.too_early')}</h2>
            <p className="text-muted text-sm max-w-sm mb-4">
              {t('rt.clicked_before')}
            </p>
            <span className="text-xs uppercase font-mono text-muted">{t('rt.click_restart')}</span>
          </div>
        )}

        {gameState === 'result' && attempts.length >= totalAttempts.current && (
          <div className="w-full flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-accent text-[10px] font-mono uppercase tracking-widest font-semibold">Visual Reaction Test</span>
              <span className="text-muted text-xs uppercase font-mono mt-1">{t('rt.final_avg')}</span>
              <div className="text-5xl font-mono font-extrabold text-foreground tracking-tight">
                {finalAverage} ms
              </div>
              <span className="text-accent text-sm font-medium">
                {formatTopPercentile(lookupPercentile('reaction-time', finalAverage!, true), true)} {t('rt.globally')}
              </span>
            </div>

            {/* SVG curve overlay */}
            <div className="w-full border-t border-b border-card-border py-4 my-2">
              {renderSVGChart(finalAverage!)}
            </div>

            {/* Micro details */}
            <div className="grid grid-cols-3 gap-8 w-full max-w-md text-center">
              <div>
                <div className="text-muted text-[10px] uppercase font-mono">{t('test.personal_best')}</div>
                <div className="text-foreground font-mono font-medium">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <div className="text-muted text-[10px] uppercase font-mono">{t('test.calibration')}</div>
                <div className="text-foreground font-mono font-medium">{calibration ? `${calibration.hz}Hz` : t('test.detecting')}</div>
              </div>
              <div>
                <div className="text-muted text-[10px] uppercase font-mono">{t('test.attempts')}</div>
                <div className="text-foreground font-mono text-xs gap-1 flex justify-center">
                  {attempts.map((a, idx) => (
                    <span key={idx} className="opacity-80">{a}</span>
                  ))}
                </div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-muted">{t('rt.try_again')}</span>
          </div>
        )}
      </div>

      {/* Action buttons footer for Result screen */}
      {gameState === 'result' && (
        <div className="flex flex-col gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-reaction-time.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>{t('rt.download_share')}</span>
            </a>
          )}
          
          <SocialShare 
            testId="reaction-time" 
            score={finalAverage!} 
            scoreLabel={`${finalAverage} ms`} 
            testName="Visual Reaction Test" 
            percentile={resultPercentile}
          />
          <button
            onClick={() => startTest()}
            className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Hardware Calibration status footer */}
      {calibration && (
        <div className="flex items-center justify-center gap-2 text-muted text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t('rt.monitor_calibrated')} {calibration.hz}Hz {t('rt.refresh_rate')} | {t('rt.expected_lag')} ~{calibration.expectedLagMs}ms</span>
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(ReactionTimeTest);
