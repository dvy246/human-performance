import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import SocialShare from '../ui/SocialShare';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import Stage1SelectiveAttention from './focus/Stage1SelectiveAttention';
import Stage2ImpulseControl from './focus/Stage2ImpulseControl';
import Stage3TaskSwitching from './focus/Stage3TaskSwitching';
import Stage4SustainedAttention from './focus/Stage4SustainedAttention';
import Stage5WorkingMemoryUnderDistraction from './focus/Stage5WorkingMemoryUnderDistraction';
import type { StageResult } from './focus/StageTypes';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';
import {
  STAGE_CONFIGS,
  computeOverallScore,
  getPerformanceLabel,
  getPerformanceColor,
} from './focus/StageTypes';

type Phase = 'intro' | 'playing' | 'stage-transition' | 'results';

interface WeakStage {
  index: number;
  name: string;
  score: number;
  recTest: { id: string; name: string; url: string };
}

function computeStability(scores: number[]): number {
  if (scores.length < 2) return 50;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (mean === 0) return 50;
  const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
}

function computeDistractionResistance(results: StageResult[]): number {
  const stages = [1, 3, 4];
  const scores = stages.map(i => results.find(r => r.stageIndex === i)?.score ?? 0).filter(s => s > 0);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeProcessingSpeed(results: StageResult[]): number {
  const s0 = results.find(r => r.stageIndex === 0);
  const s2 = results.find(r => r.stageIndex === 2);
  const vals: number[] = [];
  if (s0) vals.push(s0.score);
  if (s2) vals.push(s2.score);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const TEST_RECOMMENDATIONS: Record<number, { id: string; name: string; url: string }> = {
  0: { id: 'stroop', name: 'Stroop Test', url: '/tests/stroop' },
  1: { id: 'go-no-go', name: 'Go/No-Go Test', url: '/tests/go-no-go' },
  2: { id: 'trail-making', name: 'Trail Making Test', url: '/tests/trail-making' },
  3: { id: 'sequence-memory', name: 'Sequence Memory', url: '/tests/sequence-memory' },
  4: { id: 'dual-n-back', name: 'Dual N-Back', url: '/tests/dual-n-back' },
};

function getWeakStages(results: StageResult[]): WeakStage[] {
  const threshold = 65;
  return results
    .filter(r => r.score < threshold)
    .sort((a, b) => a.score - b.score)
    .map(r => ({
      index: r.stageIndex,
      name: r.stageName,
      score: r.score,
      recTest: TEST_RECOMMENDATIONS[r.stageIndex] || { id: '', name: '', url: '' },
    }));
}

function generatePlan(weakStages: WeakStage[]): { day: number; title: string; tasks: { test: string; url: string; sets: string }[] }[] {
  const primary = weakStages[0];
  const secondary = weakStages[1];

  if (!primary) {
    return [
      { day: 1, title: 'Maintenance', tasks: [{ test: 'Stroop Test', url: '/tests/stroop', sets: '3 rounds' }] },
      { day: 2, title: 'Maintenance', tasks: [{ test: 'Go/No-Go Test', url: '/tests/go-no-go', sets: '3 rounds' }] },
      { day: 3, title: 'Active Recovery', tasks: [{ test: 'Sequence Memory', url: '/tests/sequence-memory', sets: '2 rounds' }] },
      { day: 4, title: 'Cognitive Flexibility', tasks: [{ test: 'Trail Making Test', url: '/tests/trail-making', sets: '3 rounds' }] },
      { day: 5, title: 'Working Memory', tasks: [{ test: 'Dual N-Back', url: '/tests/dual-n-back', sets: '3 rounds' }] },
      { day: 6, title: 'Full Review', tasks: [{ test: 'Stroop Test', url: '/tests/stroop', sets: '2 rounds' }, { test: 'Go/No-Go Test', url: '/tests/go-no-go', sets: '2 rounds' }] },
      { day: 7, title: 'Retest', tasks: [{ test: 'Focus Challenge', url: '/tests/focus-challenge', sets: '1 attempt' }] },
    ];
  }

  const pTest = primary.recTest;
  const sTest = secondary?.recTest;

  return [
    { day: 1, title: `Build: ${primary.name}`, tasks: [{ test: pTest.name, url: pTest.url, sets: '3 rounds' }] },
    { day: 2, title: `Deepen: ${primary.name}`, tasks: [{ test: pTest.name, url: pTest.url, sets: '3-4 rounds' }] },
    { day: 3, title: 'Mixed Focus', tasks: [
      { test: pTest.name, url: pTest.url, sets: '2 rounds' },
      ...(sTest ? [{ test: sTest.name, url: sTest.url, sets: '2 rounds' }] : []),
    ] },
    { day: 4, title: 'Cognitive Cross-Train', tasks: [
      { test: pTest.name, url: pTest.url, sets: '2 rounds' },
      { test: 'Stroop Test', url: '/tests/stroop', sets: '2 rounds' },
    ] },
    { day: 5, title: 'Broad Spectrum', tasks: [
      { test: 'Sequence Memory', url: '/tests/sequence-memory', sets: '2 rounds' },
      { test: 'Dual N-Back', url: '/tests/dual-n-back', sets: '2 rounds' },
    ] },
    { day: 6, title: 'Full Review', tasks: [
      { test: pTest.name, url: pTest.url, sets: '3 rounds' },
      { test: 'Trail Making Test', url: '/tests/trail-making', sets: '1 round' },
    ] },
    { day: 7, title: 'Retest & Compare', tasks: [{ test: 'Focus Challenge', url: '/tests/focus-challenge', sets: '1 full attempt' }] },
  ];
}

const stages = [
  Stage1SelectiveAttention,
  Stage2ImpulseControl,
  Stage3TaskSwitching,
  Stage4SustainedAttention,
  Stage5WorkingMemoryUnderDistraction,
];

function FocusChallengeTest() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStage, setCurrentStage] = useState(0);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const overallScoreRef = useRef(0);
  const stageCompletedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);

  useBeforeUnload(phase !== 'intro' && phase !== 'results');
  useVisibilityGuard(() => {
    setPhase('intro');
  }, phase === 'playing' || phase === 'stage-transition');

  useEffect(() => {
    let mounted = true;
    measureRefreshRate((res) => { if (mounted) setCalibration(res); });
    dataLayer.getPersonalBest('focus-challenge', 'higher').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('challenge');
      if (token) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(token);
          if (payload && payload.testId === 'focus-challenge') {
            setChallengeScore(payload.score);
          }
        }).catch(console.error);
      }
    }

    return () => { mounted = false; };
  }, []);



  const handleStageComplete = (result: StageResult) => {
    if (stageCompletedRef.current) return;
    stageCompletedRef.current = true;
    const updated = [...stageResults, result];
    setStageResults(updated);

    if (result.stageIndex + 1 >= STAGE_CONFIGS.length) {
      const total = computeOverallScore(updated);
      overallScoreRef.current = total;
      setOverallScore(total);
      setPhase('results');
      void finalizeAll(total, updated).catch(console.error);
    } else {
      setCurrentStage(result.stageIndex + 1);
      setPhase('stage-transition');
    }
  };

  useEffect(() => {
    stageCompletedRef.current = false;
  }, [currentStage]);

  const finalizeAll = async (totalScore: number, results: StageResult[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const percentile = lookupPercentile('focus-challenge', totalScore);
    try {
      await dataLayer.saveSession({
        testId: 'focus-challenge',
        category: 'focus',
        rawScore: totalScore,
        percentile,
        metadata: {
          stages: results.map(r => ({ name: r.stageName, score: r.score, metrics: r.metrics })),
        },
      });
    } catch (err) {
      console.error('Failed to save Focus Challenge session:', err);
    }
    if (!submittedRef.current) return;
    const pb = await dataLayer.getPersonalBest('focus-challenge', 'higher');
    setPersonalBest(pb);
    if (!submittedRef.current) return;
    
    try {
      const card = await generateShareCard('Focus Challenge', `${totalScore}/100`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }
    if (!submittedRef.current) return;

    redirectToResults({
      testId: 'focus-challenge', testName: 'Focus Challenge', attempts: results.map(r => r.score), unit: 'pts',
      percentile, personalBest: pb, category: 'focus', average: totalScore,
    });
  };

  const prevStageScore = stageResults.length > 0 ? stageResults[stageResults.length - 1] : null;
  const nextConfig = currentStage < STAGE_CONFIGS.length ? STAGE_CONFIGS[currentStage] : null;

  const beginChallenge = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    setDifficultyLevel((cfg.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium');
    setPhase('playing');
    setCurrentStage(0);
    setStageResults([]);
    setPersonalBest(null);
    setShareImage(null);
    submittedRef.current = false;
    stageCompletedRef.current = false;
    overallScoreRef.current = 0;
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        {challengeScore && (
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
            <span className="text-secondary">Active Challenge: Beat their score of <strong className="text-foreground font-mono">{challengeScore}/100</strong>!</span>
            <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-secondary transition-colors uppercase font-mono">Dismiss</button>
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="focus-challenge"
            icon="🎯"
            title="Focus Challenge"
            description="A 5-stage attention gauntlet measuring your ability to focus, resist impulses, switch tasks, sustain attention, and remember under distraction. Takes ~4 minutes."
            onStart={(config: GameConfig) => beginChallenge(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'stage-transition' && prevStageScore && nextConfig) {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 text-xs text-muted font-mono">
            <span>Stage {prevStageScore.stageIndex + 1} Complete</span>
            <span>•</span>
            <span>{stageResults.length} / {STAGE_CONFIGS.length}</span>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">{STAGE_CONFIGS[prevStageScore.stageIndex].emoji}</div>
            <h3 className="text-lg font-bold text-foreground">{prevStageScore.stageName}</h3>
            <div className={`text-4xl font-bold font-mono mt-2 ${getPerformanceColor(prevStageScore.score)}`}>{prevStageScore.score}</div>
            <div className={`text-xs font-mono uppercase mt-1 ${getPerformanceColor(prevStageScore.score)}`}>{getPerformanceLabel(prevStageScore.score)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs text-center text-xs">
            {Object.entries(prevStageScore.metrics).map(([key, val]) => (
              <div key={key}>
                <div className="text-muted font-mono uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-foreground font-mono font-medium">{val}</div>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-card-border" />
          <div className="text-center">
            <div className="text-xs text-muted font-mono mb-1">Up Next</div>
            <div className="text-xl">{nextConfig.emoji}</div>
            <h4 className="text-base font-bold text-foreground">{nextConfig.name}</h4>
            <p className="text-secondary text-xs max-w-xs">{nextConfig.description}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPhase('playing')} className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-standard active:scale-95 cursor-pointer">Continue</button>
            <button onClick={() => { const total = computeOverallScore(stageResults); overallScoreRef.current = total; setOverallScore(total); setPhase('results'); void finalizeAll(total, stageResults).catch(console.error); }} className="px-4 h-10 rounded-lg bg-subtle border border-card-border text-muted hover:text-foreground text-xs font-mono uppercase transition-standard active:scale-95 cursor-pointer">Skip to Results</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const isNewPB = personalBest !== null && overallScore > personalBest;
    const beatChallenge = challengeScore !== null && overallScore > challengeScore;
    const stability = computeStability(stageResults.map(r => r.score));
    const distractionResistance = computeDistractionResistance(stageResults);
    const processingSpeed = computeProcessingSpeed(stageResults);
    const weakStages = getWeakStages(stageResults);
    const plan = generatePlan(weakStages);
    const metricColor = (v: number) => v >= 75 ? 'text-success' : v >= 60 ? 'text-accent' : v >= 40 ? 'text-warning' : 'text-error';

    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-3xl">🎯</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">Focus Challenge Complete</h2>
            <div className={`text-6xl font-bold font-mono ${getPerformanceColor(overallScore)}`}>{overallScore}</div>
            <div className="text-sm text-accent font-medium mt-1">/ 100</div>
            <div className={`text-xs font-mono uppercase mt-1 ${getPerformanceColor(overallScore)}`}>{getPerformanceLabel(overallScore)} · {formatTopPercentile(lookupPercentile('focus-challenge', overallScore))}</div>
            {isNewPB && <div className="text-success text-xs font-mono mt-1 animate-pulse">✦ New Personal Best!</div>}
            {beatChallenge && <div className="text-success text-xs font-mono mt-1">✓ Beat your friend's score!</div>}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className="p-3 rounded-lg bg-subtle border border-card-border text-center">
              <div className="text-[9px] text-muted font-mono uppercase mb-1">Attention Stability</div>
              <div className={`text-xl font-bold font-mono ${metricColor(stability)}`}>{stability}</div>
              <div className="text-[9px] text-muted font-mono mt-0.5">{stability >= 75 ? 'Consistent' : stability >= 50 ? 'Variable' : 'Unstable'}</div>
            </div>
            <div className="p-3 rounded-lg bg-subtle border border-card-border text-center">
              <div className="text-[9px] text-muted font-mono uppercase mb-1">Distraction Resistance</div>
              <div className={`text-xl font-bold font-mono ${metricColor(distractionResistance)}`}>{distractionResistance}</div>
              <div className="text-[9px] text-muted font-mono mt-0.5">{distractionResistance >= 75 ? 'Strong shield' : distractionResistance >= 50 ? 'Moderate' : 'Easily disrupted'}</div>
            </div>
            <div className="p-3 rounded-lg bg-subtle border border-card-border text-center">
              <div className="text-[9px] text-muted font-mono uppercase mb-1">Processing Speed</div>
              <div className={`text-xl font-bold font-mono ${metricColor(processingSpeed)}`}>{processingSpeed}</div>
              <div className="text-[9px] text-muted font-mono mt-0.5">{processingSpeed >= 75 ? 'Fast' : processingSpeed >= 50 ? 'Average' : 'Sluggish'}</div>
            </div>
            <div className="p-3 rounded-lg bg-subtle border border-card-border text-center">
              <div className="text-[9px] text-muted font-mono uppercase mb-1">Overall Focus</div>
              <div className={`text-xl font-bold font-mono ${getPerformanceColor(overallScore)}`}>{overallScore}</div>
              <div className="text-[9px] text-muted font-mono mt-0.5">{getPerformanceLabel(overallScore)}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
            {STAGE_CONFIGS.map(s => {
              const result = stageResults.find(r => r.stageIndex === s.index);
              return (
                <div key={s.index} className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-subtle border border-card-border text-center">
                  <span className="text-base">{s.emoji}</span>
                  <div className={`text-xs font-bold font-mono ${result ? getPerformanceColor(result.score) : 'text-muted'}`}>{result?.score ?? '--'}</div>
                </div>
              );
            })}
          </div>

          {weakStages.length > 0 && (
            <div className="w-full max-w-md">
              <div className="text-xs text-muted font-mono uppercase tracking-widest mb-2 text-center">Recommended Tests</div>
              <div className="flex flex-col gap-2">
                {weakStages.slice(0, 3).map(ws => (
                  <a key={ws.index} href={ws.recTest.url} className="flex items-center justify-between px-3 py-2 rounded-lg bg-subtle border border-card-border hover:border-accent/40 hover:bg-accent/5 transition-standard text-xs group">
                    <span className="text-secondary">Strengthen <strong className="text-foreground">{ws.name}</strong> ({ws.score})</span>
                    <span className="text-accent group-hover:translate-x-0.5 transition-transform">{ws.recTest.name} →</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="w-full max-w-md">
            <div className="text-xs text-muted font-mono uppercase tracking-widest mb-3 text-center">7-Day Practice Plan</div>
            <div className="flex flex-col gap-1.5">
              {plan.map(p => (
                <details key={p.day} className="rounded-lg bg-subtle border border-card-border overflow-hidden">
                  <summary className="flex items-center justify-between px-3 py-2 text-xs text-secondary cursor-pointer hover:text-foreground transition-colors select-none font-medium">
                    <span>Day {p.day}: {p.title}</span>
                    <svg className="w-3 h-3 text-muted group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-3 pb-2 flex flex-col gap-1">
                    {p.tasks.map((t, i) => (
                      <a key={i} href={t.url} className="flex items-center justify-between text-[11px] text-secondary hover:text-accent transition-colors py-0.5 px-1 rounded">
                        <span>{t.test}</span>
                        <span className="text-muted font-mono">{t.sets}</span>
                      </a>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg p-3 text-xs text-secondary max-w-md">
            <strong className="text-error">⚠️ Disclaimer:</strong> This is a <strong>performance-based entertainment tool</strong>, not a clinical or diagnostic assessment. Results should not be used to diagnose ADHD, anxiety, or any medical condition. If you have concerns about your attention or cognitive health, consult a healthcare professional.
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {shareImage && (
            <a href={shareImage} download="cogniarena-focus-challenge.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Share Card</span>
            </a>
          )}
          <SocialShare testId="focus-challenge" score={overallScore} scoreLabel={`${overallScore}/100`} testName="Focus Challenge" percentile={lookupPercentile('focus-challenge', overallScore)} />
          <button onClick={() => { setPhase('intro'); setCurrentStage(0); setStageResults([]); setOverallScore(0); setShareImage(null); setPersonalBest(null); submittedRef.current = false; stageCompletedRef.current = false; overallScoreRef.current = 0; }} className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Take Challenge Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && currentStage < STAGE_CONFIGS.length) {
    const stageIndex = currentStage;
    const config = STAGE_CONFIGS[stageIndex];
    const StageComponent = stages[stageIndex];
    return (
      <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-xs text-muted font-mono">
          <span>{config.emoji} Stage {stageIndex + 1} / {STAGE_CONFIGS.length}</span>
          <span>{config.name}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => { setPhase('intro'); setCurrentStage(0); setStageResults([]); setOverallScore(0); setShareImage(null); submittedRef.current = false; stageCompletedRef.current = false; overallScoreRef.current = 0; }} className="text-muted hover:text-error transition-colors uppercase tracking-wider text-[10px]">Quit</button>
            <span className="text-muted">{config.duration}</span>
          </div>
        </div>
        <div className="w-full rounded-xl border border-card-border bg-card p-6 flex flex-col items-center">
          <StageComponent key={stageIndex} onComplete={handleStageComplete} calibrationHz={calibration?.hz || 60} difficulty={difficultyLevel} />
        </div>
      </div>
    );
  }

  return null;
}

export default withErrorBoundary(FocusChallengeTest);
