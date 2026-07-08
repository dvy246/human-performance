import { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import StageReaction from './gauntlet/StageReaction';
import StageSequenceMemory from './gauntlet/StageSequenceMemory';
import StageStroop from './gauntlet/StageStroop';
import StageMatrix from './gauntlet/StageMatrix';
import StageAim from './gauntlet/StageAim';
import {
  STAGE_CONFIGS,
  computeGauntletScore,
  getArchetype,
  getPerformanceColor,
  type GauntletStageResult,
} from './gauntlet/GauntletTypes';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';

type Phase = 'intro' | 'playing' | 'transition' | 'results';

const STAGES = [StageReaction, StageSequenceMemory, StageStroop, StageMatrix, StageAim];

function GauntletTest() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<GauntletStageResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const stageCompletedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);

  useBeforeUnload(phase !== 'intro' && phase !== 'results');

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('gauntlet', 'higher').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  const handleStageComplete = (result: GauntletStageResult) => {
    if (stageCompletedRef.current) return;
    stageCompletedRef.current = true;
    const updated = [...results, result];
    setResults(updated);
    if (result.stageIndex + 1 >= STAGE_CONFIGS.length) {
      const total = computeGauntletScore(updated);
      setOverallScore(total);
      setPhase('results');
      void finalizeAll(total, updated).catch(console.error);
    } else {
      setCurrentIdx(result.stageIndex + 1);
      setPhase('transition');
    }
  };

  useEffect(() => {
    stageCompletedRef.current = false;
  }, [currentIdx]);

  const finalizeAll = async (totalScore: number, r: GauntletStageResult[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const percentile = lookupPercentile('gauntlet', totalScore);
    try {
      await dataLayer.saveSession({
        testId: 'gauntlet', category: 'focus', rawScore: totalScore, percentile,
        metadata: { stages: r.map(s => ({ name: s.stageName, score: s.score, rawScore: s.rawScore })) },
      });
    } catch (err) {
      console.error('Failed to save Gauntlet session:', err);
    }
    dataLayer.getPersonalBest('gauntlet', 'higher').then(pb => {
      setPersonalBest(pb);
    }).catch(console.error);
    
    try {
      const card = await generateShareCard('The Gauntlet', `${totalScore}/100`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'gauntlet', testName: 'The Gauntlet', attempts: r.map(s => s.score), unit: 'pts',
      percentile, personalBest: null, category: 'focus', average: totalScore,
    });
  };

  

  const beginGauntlet = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    setDifficultyLevel((cfg.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium');
    setPhase('playing');
    setCurrentIdx(0);
    setResults([]);
    setPersonalBest(null);
    setShareImage(null);
    submittedRef.current = false;
    stageCompletedRef.current = false;
  };

  const prevResult = results[results.length - 1];
  const nextConfig = currentIdx < STAGE_CONFIGS.length ? STAGE_CONFIGS[currentIdx] : null;

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="gauntlet"
            icon="🏆"
            title="The Gauntlet"
            description="A 5-stage cognitive gauntlet testing reaction, memory, focus, logic, and precision in one session. Takes ~4 minutes."
            onStart={(config: GameConfig) => beginGauntlet(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'transition' && prevResult && nextConfig) {
    const config = STAGE_CONFIGS[prevResult.stageIndex];
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-6 flex flex-col items-center gap-4">
          <div className="text-2xl">{config.emoji}</div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground">{prevResult.stageName}</h3>
            <div className={`text-3xl font-bold font-mono mt-1 ${getPerformanceColor(prevResult.score)}`}>{prevResult.score}</div>
          </div>
          <div className="flex gap-4 text-[10px] text-muted font-mono">
            {Object.entries(prevResult.metrics).map(([k, v]) => <span key={k}>{k}: {v}</span>)}
          </div>
          <div className="w-full h-px bg-card-border" />
          <div className="text-center">
            <div className="text-[10px] text-muted font-mono mb-1">Up Next</div>
            <div className="text-lg mb-1">{nextConfig.emoji}</div>
            <h4 className="text-sm font-bold text-foreground">{nextConfig.name}</h4>
          </div>
          <button onClick={() => setPhase('playing')} className="px-5 h-8 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs transition-standard active:scale-95 cursor-pointer">Continue</button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const isNewPB = personalBest !== null && overallScore > personalBest;
    const archetype = getArchetype(results);

    return (
      <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-3xl">🏆</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Gauntlet Complete</h2>
            <div className={`text-6xl font-bold font-mono ${getPerformanceColor(overallScore)}`}>{overallScore}</div>
            <div className="text-xs text-muted font-mono mt-1">/ 100</div>
            {isNewPB && <div className="text-success text-xs font-mono mt-1 animate-pulse">✦ New Personal Best!</div>}
          </div>

          <div className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Archetype</div>
            <div className="text-lg font-bold text-accent">{archetype.title}</div>
            <div className="text-[11px] text-secondary max-w-xs mt-1">{archetype.desc}</div>
          </div>

          <div className="grid grid-cols-5 gap-2 w-full max-w-md">
            {STAGE_CONFIGS.map(s => {
              const r = results.find(x => x.stageIndex === s.index);
              return (
                <div key={s.index} className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-subtle border border-card-border text-center">
                  <span className="text-base">{s.emoji}</span>
                  <div className={`text-xs font-bold font-mono ${r ? getPerformanceColor(r.score) : 'text-muted'}`}>{r?.score ?? '--'}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-center w-full max-w-xs">
            <div>
              <div className="text-muted font-mono uppercase text-[10px]">Personal Best</div>
              <div className="text-foreground font-mono font-medium">{personalBest !== null ? `${personalBest}/100` : '--'}</div>
            </div>
            <div>
              <div className="text-muted font-mono uppercase text-[10px]">Stages</div>
              <div className="text-foreground font-mono font-medium">{results.length}/5</div>
            </div>
          </div>

          <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg p-3 text-xs text-secondary max-w-md">
            <strong className="text-error">⚠️</strong> Performance-based entertainment tool. Not a clinical or diagnostic assessment.
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {shareImage && (
            <a href={shareImage} download="cogniarena-gauntlet.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Share Card</span>
            </a>
          )}
          <SocialShare testId="gauntlet" score={overallScore} scoreLabel={`${overallScore}/100`} testName="The Gauntlet" />
          <button onClick={() => { setPhase('intro'); setCurrentIdx(0); setResults([]); setOverallScore(0); setShareImage(null); setPersonalBest(null); submittedRef.current = false; stageCompletedRef.current = false; }} className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Take Gauntlet Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing' && currentIdx < STAGE_CONFIGS.length) {
    const StageComponent = STAGES[currentIdx];
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-[10px] text-muted font-mono mb-2">
          <span>{STAGE_CONFIGS[currentIdx].emoji} Stage {currentIdx + 1}/5</span>
          <span>{STAGE_CONFIGS[currentIdx].name}</span>
        </div>
        <div className="w-full rounded-xl border border-card-border bg-card p-4 flex flex-col items-center">
          <StageComponent key={currentIdx} onComplete={handleStageComplete} difficulty={difficultyLevel} />
        </div>
      </div>
    );
  }

  return null;
}

export default withErrorBoundary(GauntletTest);
