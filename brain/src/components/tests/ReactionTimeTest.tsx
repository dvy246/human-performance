import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import percentilesData from '../../data/percentiles.json';
import SocialShare from '../ui/SocialShare';

type GameState = 'idle' | 'calibration' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

export default function ReactionTimeTest() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const clickLock = useRef<boolean>(false);

  // Load initial settings and check for a challenge token in the URL
  useEffect(() => {
    // 1. Calibration on mount
    measureRefreshRate((result) => {
      setCalibration(result);
    });

    // 2. Personal Best from history
    dataLayer.getPersonalBest('reaction-time', 'lower').then((pb) => {
      setPersonalBest(pb);
    });

    // 3. Challenge check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'reaction-time') {
            setChallengeScore(payload.score);
          }
        });
      }
    }
  }, []);

  const lookupPercentile = (score: number): number => {
    const table = percentilesData['reaction-time'];
    for (let i = 0; i < table.length; i++) {
      if (score <= table[i].score) {
        return table[i].percentile;
      }
    }
    return 99.9;
  };

  const startTest = () => {
    if (clickLock.current) return;
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    setGameState('waiting');
    setupRandomTimer();
  };

  const setupRandomTimer = () => {
    // Random wait between 2.0 and 5.0 seconds
    const delay = 2000 + Math.random() * 3000;
    
    if (timerId.current) clearTimeout(timerId.current);
    
    timerId.current = setTimeout(() => {
      // Paint-synchronized transition
      setGameState('ready');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      });
    }, delay);
  };

  const handleTestClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (clickLock.current) return;

    if (gameState === 'idle') {
      startTest();
    } else if (gameState === 'waiting') {
      // CLICKED TOO EARLY
      if (timerId.current) clearTimeout(timerId.current);
      setGameState('abort');
    } else if (gameState === 'ready') {
      // SUCCESSFUL CLICK
      const clickTime = performance.now();
      const score = Math.round(clickTime - startTime.current);
      
      // Filter out physical impossibilities (< 80ms) as potential cheat/anticipation
      if (score < 80) {
        setGameState('abort');
        return;
      }

      const updatedAttempts = [...attempts, score];
      setAttempts(updatedAttempts);
      setCurrentScore(score);

      if (updatedAttempts.length < 5) {
        setGameState('attempt-result');
      } else {
        // Compute average score
        const average = Math.round(updatedAttempts.reduce((a, b) => a + b, 0) / 5);
        finalizeTest(average);
      }
    } else if (gameState === 'attempt-result') {
      // Proceed to next attempt
      setGameState('waiting');
      setupRandomTimer();
    } else if (gameState === 'abort' || gameState === 'result') {
      // Retry
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number) => {
    setGameState('result');
    const percentile = lookupPercentile(avgScore);

    // Save session record
    await dataLayer.saveSession({
      testId: 'reaction-time',
      category: 'reaction',
      rawScore: avgScore,
      percentile: percentile,
      metadata: { attempts }
    });

    // Check if new PB
    const existingPb = await dataLayer.getPersonalBest('reaction-time', 'lower');
    setPersonalBest(existingPb);

    // Pre-generate Share Card Image in background
    const cardDataUrl = await generateShareCard('Reaction Time Test', `${avgScore} ms`, percentile);
    setShareImage(cardDataUrl);
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
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Distribution Curve Fill */}
        <path d={pathData} fill="url(#curveGradient)" />
        
        {/* Distribution Curve Line */}
        <path d={`M 0,${height} L ${points.join(' L ')}`} fill="none" stroke="#d97706" strokeWidth="2.5" />
        
        {/* Baseline */}
        <line x1="0" y1={height} x2={width} y2={height} stroke="#1c1c1f" strokeWidth="2" />
        
        {/* Average Marker */}
        <line x1={((mean - minX) / (maxX - minX)) * width} y1="0" x2={((mean - minX) / (maxX - minX)) * width} y2={height} stroke="#27272a" strokeDasharray="3,3" />
        <text x={((mean - minX) / (maxX - minX)) * width + 4} y="20" fill="#71717a" className="text-[10px] font-mono">Avg (260ms)</text>

        {/* User Score Pin */}
        <line x1={userX} y1={userY} x2={userX} y2={height} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2,2" />
        <circle cx={userX} cy={userY} r="5" fill="#fafafa" stroke="#d97706" strokeWidth="2.5" className="animate-pulse" />
        
        {/* User Marker Label */}
        <g transform={`translate(${Math.max(45, Math.min(width - 55, userX))}, ${userY - 18})`}>
          <rect x="-40" y="-12" width="80" height="18" rx="3" fill="#fafafa" />
          <text textAnchor="middle" fill="#030303" className="text-[10px] font-bold font-mono" y="0">YOU: {userScore}ms</text>
        </g>
      </svg>
    );
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    
    // Average score is the last recorded attempts' average
    const average = Math.round(attempts.reduce((a, b) => a + b, 0) / 5);
    const token = encodeChallenge({ testId: 'reaction-time', score: average });
    const url = `${window.location.origin}/tests/reaction-time/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    });
  };

  // Keyboard navigation support: Spacebar/Enter triggers clicks
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      handleTestClick(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge Display */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-accent"><path d="M6 12 10 16 18 8"/></svg>
            <span>Active Challenge: Beat your friend's score of <strong className="text-white font-mono">{challengeScore} ms</strong>!</span>
          </div>
          <button 
            onClick={() => setChallengeScore(null)} 
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Interactive Panel */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTestClick}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[380px] rounded-xl flex flex-col items-center justify-center p-8 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background transition-standard ${
          gameState === 'ready' 
            ? 'bg-emerald-600/90 text-white shadow-emerald-950/20 shadow-2xl border border-emerald-500' 
            : gameState === 'abort'
            ? 'bg-rose-950/40 text-rose-200 border border-rose-900/50'
            : 'bg-card text-foreground/80 border border-card-border hover:border-zinc-400 dark:hover:border-zinc-800'
        }`}
      >
        {gameState === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-3xl animate-pulse">
              ⚡
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Reaction Time Test</h2>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm max-w-sm mb-6">
                When the red screen turns green, click as fast as you can.
              </p>
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-accent px-4 py-1.5 rounded-full bg-accent/5 border border-accent/15">
              Click to Start
            </span>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping mb-2" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Wait for green...</h2>
            <p className="text-zinc-500 text-xs uppercase font-mono">Attempt {attempts.length + 1} of 5</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-6xl font-extrabold text-white tracking-tighter drop-shadow-md select-none">
              CLICK!
            </h2>
          </div>
        )}

        {gameState === 'attempt-result' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-zinc-500 text-xs uppercase font-mono">Attempt {attempts.length} Finished</span>
            <div className="text-5xl font-mono font-bold text-foreground">{currentScore} ms</div>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm max-w-sm mb-4">
              Click anywhere to proceed to attempt {attempts.length + 1} of 5.
            </p>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-rose-500 text-2xl">⚠️</span>
            <h2 className="text-2xl font-bold text-foreground">Too Early!</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm max-w-sm mb-4">
              You clicked before the screen turned green. Clicks are reset.
            </p>
            <span className="text-xs uppercase font-mono text-zinc-500">Click to restart</span>
          </div>
        )}

        {gameState === 'result' && attempts.length === 5 && (
          <div className="w-full flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-zinc-500 text-xs uppercase font-mono">Final Average Score</span>
              <div className="text-5xl font-mono font-extrabold text-foreground tracking-tight">
                {Math.round(attempts.reduce((a, b) => a + b, 0) / 5)} ms
              </div>
              <span className="text-accent text-sm font-medium">
                Top {lookupPercentile(Math.round(attempts.reduce((a, b) => a + b, 0) / 5))}% Globally
              </span>
            </div>

            {/* SVG curve overlay */}
            <div className="w-full border-t border-b border-card-border py-4 my-2">
              {renderSVGChart(Math.round(attempts.reduce((a, b) => a + b, 0) / 5))}
            </div>

            {/* Micro details */}
            <div className="grid grid-cols-3 gap-8 w-full max-w-md text-center">
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Personal Best</div>
                <div className="text-foreground font-mono font-medium">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Calibration</div>
                <div className="text-foreground font-mono font-medium">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-mono">Attempts</div>
                <div className="text-foreground font-mono text-xs gap-1 flex justify-center">
                  {attempts.map((a, idx) => (
                    <span key={idx} className="opacity-80">{a}</span>
                  ))}
                </div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-zinc-500">Click anywhere outside buttons to try again</span>
          </div>
        )}
      </div>

      {/* Action buttons footer for Result screen */}
      {gameState === 'result' && (
        <div className="flex flex-col gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="brainbenchmarks-reaction-time.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Share Card</span>
            </a>
          )}
          
          <SocialShare 
            testId="reaction-time" 
            score={average} 
            scoreLabel={`${average} ms`} 
            testName="Visual Reaction Test" 
          />
        </div>
      )}

      {/* Hardware Calibration status footer */}
      {calibration && (
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Monitor calibrated: {calibration.hz}Hz Refresh Rate | Expected Hardware Lag: ~{calibration.expectedLagMs}ms</span>
        </div>
      )}
    </div>
  );
}
