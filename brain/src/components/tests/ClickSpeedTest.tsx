import React, { useState, useEffect, useRef } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { useSound } from '../../runtime/useSound';
import { useI18n } from '../../runtime/useI18n';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';

type TestState = 'idle' | 'clicking' | 'result';

const DURATIONS = [5, 10, 30, 60] as const;
type Duration = typeof DURATIONS[number];

export default function ClickSpeedTest() {
  const { playClick } = useSound();
  const { t } = useI18n();
  const [gameState, setGameState] = useState<TestState>('idle');
  const [clicks, setClicks] = useState<number>(0);
  const [duration, setDuration] = useState<Duration>(10);
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



  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState === 'result') return;

    if (gameState === 'idle') {
      setGameState('clicking');
      setClicks(1);
      clicksRef.current = 1;
      setTimeLeft(duration);
      setClickRates([]);
      startTime.current = performance.now();
      clickTimes.current = [performance.now()];

      // Start precise 100ms interval timer
      timerRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTime.current) / 1000;
        const remaining = Math.max(0, duration - elapsed);
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
      playClick();
    }
  };

  const finalizeTest = async (finalClicks: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const cps = Number((finalClicks / duration).toFixed(1));
    const percentile = lookupPercentile('click-speed', cps);

    try {
      await dataLayer.saveSession({
        testId: 'click-speed',
        category: 'speed',
        rawScore: cps,
        percentile: percentile,
        metadata: { clicks: finalClicks, duration }
      });
    } catch (err) {
      console.error('Failed to save Click Speed session:', err);
    }

    const pb = await dataLayer.getPersonalBest('click-speed', 'higher');
    setPersonalBest(pb);

    const card = await generateShareCard('Click Speed (CPS) Test', `${cps} CPS`, percentile);
    setShareImage(card);

    redirectToResults({
      testId: 'click-speed', testName: 'Click Speed', attempts: [cps], unit: 'CPS',
      percentile, personalBest: pb, category: 'speed', average: cps,
    });
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const cps = Number((clicks / duration).toFixed(1));
    const token = encodeChallenge({ testId: 'click-speed', score: cps });
    const url = `${window.location.origin}/tests/click-speed/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    submittedRef.current = false;
    clicksRef.current = 0;
    setGameState('idle');
    setClicks(0);
    setTimeLeft(duration);
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
          <span className="text-foreground">{t('test.challenge_beat')} <strong className="text-foreground font-mono">{challengeScore} CPS</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-foreground font-mono uppercase">{t('test.dismiss')}</button>
        </div>
      )}

      {/* Click Pad Screen */}
      {gameState !== 'result' ? (
        <div
          role="button"
          tabIndex={0}
          onMouseDown={handleClick}
          className={`w-full min-h-[380px] rounded-xl border border-card-border p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-standard outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            gameState === 'clicking' ? 'bg-subtle border-card-border/80' : 'bg-card hover:border-muted'
          }`}
        >
          {gameState === 'idle' ? (
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <GameConfigPanel
                testId="click-speed"
                icon="🖱️"
                title="Click Speed Test (CPS)"
                description="Click inside this card as fast as you can. The timer begins on your first click."
                personalBest={personalBest}
                personalBestLabel="CPS"
                startLabel="Start Test"
                onStart={() => handleClick({ preventDefault: () => {} } as React.MouseEvent)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span className="text-muted text-xs font-mono uppercase">{t('cps.spam_click')}</span>
              <div className="text-6xl font-mono font-bold text-foreground">{clicks}</div>
              <div className="flex flex-col gap-1">
                <span className="text-accent font-mono text-sm">{timeLeft.toFixed(1)}s {t('cps.remaining')}</span>
                <span className="text-muted font-mono text-xs">{(clicks / Math.max(0.1, duration - timeLeft)).toFixed(1)} {t('cps.clicks_sec')}</span>
              </div>
              {/* Real-time CPS Chart */}
              {clickRates.length > 1 && (
                <div className="w-full max-w-xs mt-2">
                  <svg width="100%" height="60" viewBox="0 0 360 60" className="stroke-accent fill-none">
                    <line x1="0" y1="30" x2="360" y2="30" stroke="var(--border-primary)" strokeDasharray="2,2" />
                    <path d={generateChartPath()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted text-xs font-mono uppercase">{t('cps.cps_duration')} ({duration}s)</span>
            <div className="text-5xl font-mono font-bold text-foreground">{(clicks / duration).toFixed(1)}</div>
            <span className="text-accent text-xs font-mono uppercase">
              {t('rt.top_globally')} {100 - lookupPercentile('click-speed', clicks / duration)}% {t('cps.top_clickers')}
            </span>
            {personalBest && (clicks / duration) >= personalBest && (
              <span className="text-success text-xs font-mono font-bold mt-1">{t('cps.new_pb')}</span>
            )}
          </div>

          {/* Clicking Cadence Timeline Chart */}
          {clickRates.length > 1 && (
            <div className="flex flex-col gap-2 w-full max-w-sm pt-2">
              <span className="text-muted text-[10px] font-mono uppercase text-left">{t('cps.cadence')}</span>
              <div className="w-full bg-subtle border border-card-border/50 rounded p-4 flex items-center justify-center">
                <svg width="100%" height="80" viewBox="0 0 360 80" className="stroke-accent fill-none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="360" y2="40" stroke="var(--border-primary)" strokeDasharray="2,2" />
                  {/* Cadence Path */}
                  <path d={generateChartPath()} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-t border-card-border/50 pt-4 text-center mt-2">
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">{t('cps.total_clicks')}</span>
              <div className="text-foreground font-mono text-sm">{clicks}</div>
            </div>
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">{t('test.personal_best')}</span>
              <div className="text-foreground font-mono text-sm">{personalBest ? `${personalBest} CPS` : '--'}</div>
            </div>
            <div>
              <span className="text-muted text-[10px] font-mono uppercase">{t('test.calibrated_hz')}</span>
              <div className="text-foreground font-mono text-sm">{calibration ? `${calibration.hz}Hz` : t('test.detecting')}</div>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="mt-2 text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
          >
            {t('test.restart')}
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
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>{t('cps.download_profile')}</span>
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
