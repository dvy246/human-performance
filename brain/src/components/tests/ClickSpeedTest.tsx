import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';

type TestState = 'idle' | 'clicking' | 'result';

export default function ClickSpeedTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [clicks, setClicks] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(10.0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  // For drawing the cadence graph
  const [clickRates, setClickRates] = useState<number[]>([]);

  const timerRef = useRef<any>(null);
  const clicksRef = useRef<number>(0);
  const clickTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });
    dataLayer.getPersonalBest('click-speed', 'higher').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(challengeToken);
          if (payload && payload.testId === 'click-speed') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const lookupPercentile = (cps: number): number => {
    // Standard CPS percentile curve
    // Average is ~6.5 CPS (50th percentile)
    // 8.5 CPS is ~85th percentile
    // 10 CPS is ~95th percentile
    // 12+ CPS is ~99th percentile
    if (cps >= 14) return 99.9;
    if (cps >= 12) return 99.0;
    if (cps >= 10) return 95.0;
    if (cps >= 8.5) return 85.0;
    if (cps >= 7.2) return 65.0;
    if (cps >= 6.5) return 50.0;
    if (cps >= 5.5) return 30.0;
    if (cps >= 4.0) return 10.0;
    return 1.0;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState === 'result') return;

    if (gameState === 'idle') {
      setGameState('clicking');
      setClicks(1);
      clicksRef.current = 1;
      setTimeLeft(10.0);
      setClickRates([]);
      startTime.current = performance.now();
      clickTimes.current = [performance.now()];

      // Start precise 100ms interval timer
      timerRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTime.current) / 1000;
        const remaining = Math.max(0, 10.0 - elapsed);
        setTimeLeft(remaining);

        // Record click rate at this interval for timeline chart
        const totalClicks = clicksRef.current;
        const currentCps = totalClicks / elapsed;
        setClickRates((prev) => [...prev, Number(currentCps.toFixed(1))]);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          finalizeTest(totalClicks);
        }
      }, 100);
    } else if (gameState === 'clicking') {
      clicksRef.current += 1;
      setClicks(clicksRef.current);
      clickTimes.current.push(performance.now());
    }
  };

  const finalizeTest = async (finalClicks: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const cps = Number((finalClicks / 10.0).toFixed(1));
    const percentile = lookupPercentile(cps);

    await dataLayer.saveSession({
      testId: 'click-speed',
      category: 'speed',
      rawScore: cps,
      percentile: percentile,
      metadata: { clicks: finalClicks }
    });

    const pb = await dataLayer.getPersonalBest('click-speed', 'higher');
    setPersonalBest(pb);

    const card = await generateShareCard('Click Speed (CPS) Test', `${cps} CPS`, percentile);
    setShareImage(card);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const cps = Number((clicks / 10.0).toFixed(1));
    const token = encodeChallenge({ testId: 'click-speed', score: cps });
    const url = `${window.location.origin}/tests/click-speed/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  const resetTest = () => {
    setGameState('idle');
    setClicks(0);
    setTimeLeft(10.0);
    setClickRates([]);
  };

  // SVG Cadence Path Generator
  const generateChartPath = () => {
    if (clickRates.length < 2) return '';
    const maxVal = Math.max(...clickRates, 15);
    const minVal = Math.min(...clickRates, 0);
    const range = maxVal - minVal || 1;
    const width = 360;
    const height = 80;

    return clickRates
      .map((val, idx) => {
        const x = (idx / (clickRates.length - 1)) * width;
        const y = height - ((val - minVal) / range) * height;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Active Challenge Alert */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's score of <strong className="text-foreground font-mono">{challengeScore} CPS</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-zinc-500 hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Click Pad Screen */}
      {gameState !== 'result' ? (
        <div
          role="button"
          tabIndex={0}
          onMouseDown={handleClick}
          className={`w-full min-h-[380px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-standard outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            gameState === 'clicking' ? 'bg-subtle border-card-border/80' : 'bg-card hover:border-zinc-400 dark:hover:border-zinc-800'
          }`}
        >
          {gameState === 'idle' ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-3xl">🖱️</span>
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">Click Speed Test (CPS)</h2>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
                  Click inside this card as fast as you can. The 10-second timer begins on your first click.
                </p>
              </div>
              <span className="text-xs uppercase font-mono tracking-widest text-accent px-4 py-1 bg-accent/5 border border-accent/15 rounded-full mt-2">
                Click to Start
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span className="text-zinc-500 text-xs font-mono uppercase">SPAM CLICK THE CARD</span>
              <div className="text-6xl font-mono font-bold text-foreground">{clicks}</div>
              <div className="flex flex-col gap-1">
                <span className="text-accent font-mono text-sm">{timeLeft.toFixed(1)}s remaining</span>
                <span className="text-zinc-500 font-mono text-xs">{(clicks / Math.max(0.1, 10.0 - timeLeft)).toFixed(1)} clicks/sec</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-zinc-500 text-xs font-mono uppercase">Clicks Per Second</span>
            <div className="text-5xl font-mono font-bold text-foreground">{(clicks / 10.0).toFixed(1)}</div>
            <span className="text-accent text-xs font-mono uppercase">
              Top {100 - lookupPercentile(clicks / 10.0)}% clickers
            </span>
          </div>

          {/* Clicking Cadence Timeline Chart */}
          {clickRates.length > 1 && (
            <div className="flex flex-col gap-2 w-full max-w-sm pt-2">
              <span className="text-zinc-500 text-[10px] font-mono uppercase text-left">Clicking Cadence (CPS Timeline)</span>
              <div className="w-full bg-subtle border border-card-border/50 rounded p-4 flex items-center justify-center">
                <svg width="100%" height="80" viewBox="0 0 360 80" className="stroke-accent fill-none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="360" y2="40" stroke="#1c1c1f" strokeDasharray="2,2" />
                  {/* Cadence Path */}
                  <path d={generateChartPath()} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-2">
            <div>
              <span className="text-zinc-500 text-[10px] font-mono uppercase">Total Clicks</span>
              <div className="text-foreground font-mono text-sm">{clicks}</div>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] font-mono uppercase">Personal Best</span>
              <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} CPS` : '--'}</div>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] font-mono uppercase">Calibrated Hz</span>
              <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : 'Detecting...'}</div>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="mt-2 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
          >
            Restart Assessment
          </button>
        </div>
      )}

      {/* Share Actions */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-cps-score.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download CPS Profile</span>
            </a>
          )}
          <button
            onClick={copyChallengeLink}
            className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{copiedChallenge ? 'Challenge Copied!' : 'Challenge a Friend'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
