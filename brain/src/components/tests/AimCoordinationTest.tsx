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
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';

type TestState = 'idle' | 'playing' | 'result';

interface Target {
  x: number;
  y: number;
  r: number;
  spawnTime: number;
}

function AimCoordinationTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [hits, setHits] = useState<number>(0);
  const [clicks, setClicks] = useState<number>(0);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  // Performance arrays
  const [latencies, setLatencies] = useState<number[]>([]);
  const [misses, setMisses] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentTarget = useRef<Target | null>(null);
  const activeHits = useRef<number>(0);
  const activeClicks = useRef<number>(0);
  const activeMisses = useRef<number>(0);
  const targetIndex = useRef<number>(0);
  const latenciesArr = useRef<number[]>([]);
  const respondedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);
  const targetCount = useRef<number>(20);
  const sizeMultiplier = useRef<number>(1.0);

  useEffect(() => {
    let mounted = true;
    const cleanupCalibration = measureRefreshRate((res) => { if (mounted) setCalibration(res); });
    dataLayer.getPersonalBest('aim-coordination', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(decodeURIComponent(challengeToken));
          if (payload && payload.testId === 'aim-coordination') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => { 
      mounted = false; 
      cleanupCalibration();
    };
  }, []);

  // Canvas drawing loop
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Background
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1;
      for (let i = 20; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 20; j < canvas.height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw Target
      if (currentTarget.current) {
        const { x, y, r } = currentTarget.current;
        const timeElapsed = performance.now() - currentTarget.current.spawnTime;
        
        // Target pulse
        const pulse = r + Math.sin(timeElapsed / 100) * 1.5;

        // Outer Glow ring - green themed
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
        
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#22c55e';
        ctx.stroke();

        // Inner Core target
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x, y, r / 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fafafa';
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const spawnTarget = () => {
    if (!canvasRef.current) return;
    respondedRef.current = false;
    const canvas = canvasRef.current;
    const r = Math.round(30 * sizeMultiplier.current);
    const padding = 40;

    const x = padding + Math.random() * (canvas.width - padding * 2);
    const y = padding + Math.random() * (canvas.height - padding * 2);
    
    currentTarget.current = {
      x,
      y,
      r,
      spawnTime: performance.now()
    };
  };

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const diff = getDifficultyParams('aim-coordination', (cfg.difficulty as string) || 'Medium');
    sizeMultiplier.current = (diff.sizeMultiplier as number) || 1.0;
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : 20;
    targetCount.current = attemptCount;

    activeHits.current = 0;
    activeClicks.current = 0;
    activeMisses.current = 0;
    targetIndex.current = 0;
    latenciesArr.current = [];

    setHits(0);
    setClicks(0);
    setMisses(0);
    setCurrentTargetIndex(0);
    setLatencies([]);
    setShareImage(null);
    submittedRef.current = false;
    setGameState('playing');
    respondedRef.current = false;

    setTimeout(() => {
      spawnTarget();
    }, 100);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameState !== 'playing' || !canvasRef.current || !currentTarget.current) return;
    if (respondedRef.current) return;

    activeClicks.current += 1;
    setClicks(activeClicks.current);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Translate click coordinates from screen space to internal canvas dimensions
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const target = currentTarget.current;
    const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);

    if (dist <= target.r) {
      // Hit!
      respondedRef.current = true;
      const timeElapsed = Math.round(performance.now() - target.spawnTime);
      latenciesArr.current.push(timeElapsed);
      
      activeHits.current += 1;
      setHits(activeHits.current);

      targetIndex.current += 1;
      setCurrentTargetIndex(targetIndex.current);

      if (targetIndex.current >= targetCount.current) {
        finalizeTest();
      } else {
        spawnTarget();
      }
    } else {
      // Miss
      activeMisses.current += 1;
      setMisses(activeMisses.current);
    }
  };

  const finalizeTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    currentTarget.current = null;

    const averageLatency = latenciesArr.current.length > 0
      ? Math.round(latenciesArr.current.reduce((a, b) => a + b, 0) / latenciesArr.current.length)
      : 0;

    setLatencies(latenciesArr.current);

    try {
      await dataLayer.saveSession({
        testId: 'aim-coordination',
        category: 'reaction',
        rawScore: averageLatency,
        percentile: lookupPercentile('aim-coordination', averageLatency, true),
        metadata: { misses: activeMisses.current }
      });
    } catch (err) {
      console.error('Failed to save Aim Coordination session:', err);
    }

    const pb = await dataLayer.getPersonalBest('aim-coordination', 'lower');
    setPersonalBest(pb);

    try {
      const card = await generateShareCard('Aim Coordination Test', `${averageLatency} ms avg`, lookupPercentile('aim-coordination', averageLatency, true));
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'aim-coordination', testName: 'Aim Coordination', attempts: latenciesArr.current, unit: 'ms',
      percentile: lookupPercentile('aim-coordination', averageLatency, true), personalBest: pb, category: 'reaction', average: averageLatency,
    });
  };

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');
  useVisibilityGuard(() => {
    setGameState('idle');
  }, gameState === 'playing');

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = latenciesArr.current.length > 0
      ? Math.round(latenciesArr.current.reduce((a, b) => a + b, 0) / latenciesArr.current.length)
      : 0;
    const token = encodeChallenge({ testId: 'aim-coordination', score: average });
    const url = `${window.location.origin}/tests/aim-coordination/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto relative">
      {gameState !== 'idle' && gameState !== 'result' && (
        <button onClick={() => setGameState('idle')} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
      )}
      {/* Challenge Status */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-green-500/10 dark:bg-green-950/20 border border-green-500/30 dark:border-green-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's coordination speed of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Screen Canvas Area */}
      {gameState === 'playing' ? (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-mono text-muted">
            <span>Targets: <strong className="text-foreground">{currentTargetIndex} / {targetCount.current}</strong></span>
            <span>Misses: <strong className="text-error">{misses}</strong></span>
          </div>
          <canvas
            ref={canvasRef}
            width="600"
            height="340"
            onClick={handleCanvasClick}
            className="w-full bg-[#030303] border border-card-border rounded-xl cursor-crosshair shadow-inner"
          />
        </div>
      ) : gameState === 'result' ? (
        /* Result Dashboard */
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted text-xs font-mono uppercase">Average Coordination Latency</span>
            <div className="text-5xl font-mono font-bold text-foreground">
              {Math.round(latencies.reduce((a, b) => a + b, 0) / targetCount.current)} ms
            </div>
            <span className="text-accent text-xs font-mono uppercase">
              {formatTopPercentile(lookupPercentile('aim-coordination', Math.round(latencies.reduce((a, b) => a + b, 0) / targetCount.current), true), true)} coordination profile
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-2">
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">Total Misses</span>
              <div className="text-foreground font-mono text-sm">{misses}</div>
            </div>
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">Hit Rate</span>
              <div className="text-foreground font-mono text-sm">{clicks > 0 ? Math.round((targetCount.current / clicks) * 100) : 0}%</div>
            </div>
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">Personal Best</span>
              <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
            </div>
          </div>

          <button
            onClick={() => startTest()}
            className="mt-2 text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
          >
            Restart Assessment
          </button>
        </div>
      ) : (
        /* Idle Page */
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-center text-center">
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <GameConfigPanel
              testId="aim-coordination"
              icon="🎯"
              title="Aim Coordination Test"
              description="Click targets as fast as they appear. Measures your visual-motor response latency and hand-eye coordination speed."
              personalBest={personalBest}
              personalBestLabel="ms"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        </div>
      )}

      {/* Share Actions */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-aim-coordination-score.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Coordination Profile</span>
            </a>
          )}
          <button
            onClick={copyChallengeLink}
            className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{copiedChallenge ? 'Telemetry Copied!' : 'Challenge a Friend'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(AimCoordinationTest);
