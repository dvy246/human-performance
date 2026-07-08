import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';

type TestState = 'idle' | 'waiting' | 'ready' | 'attempt-result' | 'abort' | 'result';

type ColorChoice = 'red' | 'green' | 'blue' | 'yellow';

const COLOR_MAP: Record<ColorChoice, { hex: string; key: string; label: string; textClass: string; bgClass: string; activeClass: string }> = {
  red: { hex: '#ef4444', key: 'r', label: 'Red (R)', textClass: 'text-red-400', bgClass: 'bg-red-950/20 border-red-900/50', activeClass: 'bg-red-500 border-red-400 ring-4 ring-red-500/20' },
  green: { hex: '#10b981', key: 'g', label: 'Green (G)', textClass: 'text-emerald-400', bgClass: 'bg-emerald-950/20 border-emerald-900/50', activeClass: 'bg-emerald-500 border-emerald-400 ring-4 ring-emerald-500/20' },
  blue: { hex: '#3b82f6', key: 'b', label: 'Blue (B)', textClass: 'text-blue-400', bgClass: 'bg-blue-950/20 border-blue-900/50', activeClass: 'bg-blue-500 border-blue-400 ring-4 ring-blue-500/20' },
  yellow: { hex: '#eab308', key: 'y', label: 'Yellow (Y)', textClass: 'text-yellow-400', bgClass: 'bg-yellow-950/20 border-yellow-900/50', activeClass: 'bg-yellow-500 border-yellow-400 ring-4 ring-yellow-500/20' }
};

export default function ChoiceReactionTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [activeColor, setActiveColor] = useState<ColorChoice | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<{ score: number; penalty: boolean }[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [hasPenalty, setHasPenalty] = useState(false);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const startTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const rafId = useRef<number>(0);
  const clickLock = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    // 1. Get Calibration
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });

    // 2. Personal Best
    dataLayer.getPersonalBest('choice-reaction', 'lower').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    // 3. Challenge check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'choice-reaction') {
            setChallengeScore(payload.score);
          }
        }).catch(console.error);
      }
    }

    return () => {
      mounted = false;
      if (timerId.current) clearTimeout(timerId.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Keyboard listeners during active ready state
  useEffect(() => {
    if (gameState !== 'ready') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['r', 'g', 'b', 'y'].includes(key)) {
        setPressedKey(key);
        setTimeout(() => setPressedKey(null), 150);
        
        let selectedColor: ColorChoice | null = null;
        if (key === 'r') selectedColor = 'red';
        if (key === 'g') selectedColor = 'green';
        if (key === 'b') selectedColor = 'blue';
        if (key === 'y') selectedColor = 'yellow';

        if (selectedColor) {
          evaluateInput(selectedColor);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeColor, attempts]);



  const startTest = () => {
    setAttempts([]);
    setCurrentScore(null);
    setShareImage(null);
    submittedRef.current = false;
    setGameState('waiting');
    setupRandomTimer();
  };

  const setupRandomTimer = () => {
    clickLock.current = false;
    setActiveColor(null);
    setHasPenalty(false);
    const delay = 1200 + Math.random() * 2300;
    
    if (timerId.current) clearTimeout(timerId.current);
    
    timerId.current = setTimeout(() => {
      // Pick random color
      const colors: ColorChoice[] = ['red', 'green', 'blue', 'yellow'];
      const pick = colors[Math.floor(Math.random() * colors.length)];
      
      setActiveColor(pick);
      setGameState('ready');
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      });
    }, delay);
  };

  const evaluateInput = (selection: ColorChoice) => {
    if (clickLock.current) return;

    const triggerTime = performance.now();
    const rawElapsed = Math.round(triggerTime - startTime.current);

    if (rawElapsed < 80) { // Clicked too early
      setGameState('abort');
      return;
    }

    clickLock.current = true;

    const isMatch = selection === activeColor;
    // Add +150ms penalty for incorrect choice
    const penaltyValue = isMatch ? 0 : 150;
    const finalScore = rawElapsed + penaltyValue;

    const currentAttempt = { score: finalScore, penalty: !isMatch };
    const updatedAttempts = [...attempts, currentAttempt];
    setAttempts(updatedAttempts);
    setCurrentScore(finalScore);
    setHasPenalty(!isMatch);

    if (updatedAttempts.length < 5) {
      setGameState('attempt-result');
    } else {
      const average = Math.round(updatedAttempts.reduce((sum, item) => sum + item.score, 0) / 5);
      finalizeTest(average, updatedAttempts);
    }
  };

  const handlePadClick = (color: ColorChoice, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState === 'ready') {
      evaluateInput(color);
    } else if (gameState === 'waiting') {
      // Clicked early
      if (timerId.current) clearTimeout(timerId.current);
      setGameState('abort');
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    if (gameState === 'idle') {
      startTest();
    } else if (gameState === 'waiting') {
      if (timerId.current) clearTimeout(timerId.current);
      setGameState('abort');
    } else if (gameState === 'attempt-result') {
      setGameState('waiting');
      setupRandomTimer();
    } else if (gameState === 'abort' || gameState === 'result') {
      startTest();
    }
  };

  const finalizeTest = async (avgScore: number, allAttempts: { score: number; penalty: boolean }[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const percentile = lookupPercentile('choice-reaction', avgScore, true);

    try {
      await dataLayer.saveSession({
        testId: 'choice-reaction',
        category: 'reaction',
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts.map(a => a.score) }
      });
    } catch (err) {
      console.error('Failed to save Choice Reaction session:', err);
    }

    const pb = await dataLayer.getPersonalBest('choice-reaction', 'lower');
    setPersonalBest(pb);

    const card = await generateShareCard('Choice Reaction Test', `${avgScore} ms`, percentile);
    setShareImage(card);

    redirectToResults({
      testId: 'choice-reaction', testName: 'Choice Reaction', attempts: allAttempts.map(a => a.score), unit: 'ms',
      percentile, personalBest: pb, category: 'reaction', average: avgScore,
    });
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const average = Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / Math.max(1, attempts.length));
    const token = encodeChallenge({ testId: 'choice-reaction', score: average });
    const url = `${window.location.origin}/tests/choice-reaction/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's choice reflex score of <strong className="text-foreground font-mono">{challengeScore} ms</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Main Interactive Screen Area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handlePanelClick}
        className={`w-full min-h-[260px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-standard select-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          activeColor === 'red' && gameState === 'ready' ? 'bg-red-950/30 border-red-900/50' :
          activeColor === 'green' && gameState === 'ready' ? 'bg-emerald-950/30 border-emerald-900/50' :
          activeColor === 'blue' && gameState === 'ready' ? 'bg-blue-950/30 border-blue-900/50' :
          activeColor === 'yellow' && gameState === 'ready' ? 'bg-yellow-950/30 border-yellow-900/50' :
          gameState === 'abort' ? 'bg-rose-950/40 border-rose-900/50' : 'bg-card'
        }`}
      >
        {gameState === 'idle' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl">🎮</span>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Choice Grid Test</h2>
            <p className="text-muted text-xs leading-relaxed max-w-sm">
              Press the matching color pad or press keys **R**, **G**, **B**, **Y** on your keyboard when the center box flashes. Incorrect choices carry a **+150ms penalty**!
            </p>
            <span className="text-xs uppercase font-mono tracking-widest text-accent mt-2">Click card to start</span>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded bg-subtle border border-card-border animate-pulse flex items-center justify-center text-muted dark:text-muted font-mono text-xs">READY</div>
            <p className="text-muted font-mono text-xs uppercase mt-3">Attempt {attempts.length + 1} of 5 &middot; Wait for color flash</p>
          </div>
        )}

        {gameState === 'ready' && activeColor && (
          <div className="flex flex-col items-center gap-3">
            <div 
              style={{ backgroundColor: COLOR_MAP[activeColor].hex }}
              className="w-24 h-24 rounded border border-white/20 shadow-2xl transition-all duration-75 flex items-center justify-center text-black font-extrabold text-2xl tracking-tighter"
            >
              {activeColor.toUpperCase()}
            </div>
            <p className="text-foreground text-xs font-mono uppercase tracking-widest animate-pulse mt-2">Press key or click below</p>
          </div>
        )}

        {gameState === 'attempt-result' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-muted text-xs font-mono uppercase">Attempt {attempts.length} score</span>
            <div className="text-4xl font-mono font-bold text-foreground">{currentScore} ms</div>
            {hasPenalty && <span className="text-xs text-error font-mono uppercase font-semibold">⚠️ +150ms Mismatch Penalty</span>}
            <span className="text-xs text-secondary font-mono uppercase mt-2">Click card to load next color</span>
          </div>
        )}

        {gameState === 'abort' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-error text-2xl">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Too Early!</h2>
            <p className="text-muted text-xs">
              You triggered an input before the color loaded. Grid reset.
            </p>
            <span className="text-xs uppercase font-mono text-muted mt-2">Click card to restart</span>
          </div>
        )}

        {gameState === 'result' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-muted text-xs font-mono uppercase">Final Choice Average</span>
              <div className="text-4xl font-mono font-bold text-foreground">
                {Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / 5)} ms
              </div>
              <span className="text-accent text-xs font-mono uppercase">
                Top {100 - lookupPercentile('choice-reaction', Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / 5), true)}% globally
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-3">
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} ms` : '--'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Calibration</span>
                <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Mismatches</span>
                <div className="text-foreground font-mono text-sm">{attempts.filter(a => a.penalty).length} / 5</div>
              </div>
            </div>

            <span className="text-xs uppercase font-mono text-muted mt-2">Click card to try again</span>
          </div>
        )}
      </div>

      {/* Interactive Color Pad Array Grid (Acts as mouse triggers) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(COLOR_MAP) as ColorChoice[]).map((col) => {
          const color = COLOR_MAP[col];
          const isPressed = pressedKey === color.key;
          return (
            <button
              key={col}
              onClick={(e) => handlePadClick(col, e)}
              className={`p-4 rounded-lg border text-center transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center gap-1 hover:border-card-border ${
                isPressed ? color.activeClass : color.bgClass
              }`}
            >
              <div 
                style={{ backgroundColor: color.hex }}
                className="w-5 h-5 rounded-full shadow"
              />
              <span className={`text-xs font-mono font-medium ${color.textClass}`}>
                {color.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Share cards panel */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-choice-reflex.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Choice Profile</span>
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
