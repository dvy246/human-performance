import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';

type TrialState = 'idle' | 'running' | 'result';
interface Trial {
  word: string;
  color: string; // the ink color
  isCongruent: boolean;
}

const COLORS = [
  { name: 'RED', hex: '#ef4444', class: 'text-red-500' },
  { name: 'BLUE', hex: '#3b82f6', class: 'text-blue-500' },
  { name: 'GREEN', hex: '#22c55e', class: 'text-green-500' },
  { name: 'YELLOW', hex: '#eab308', class: 'text-yellow-500' }
];

const StroopTest = () => {
  const [gameState, setGameState] = useState<TrialState>('idle');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIdx, setCurrentTrialIdx] = useState(0);
  const [congruentScores, setCongruentScores] = useState<number[]>([]);
  const [incongruentScores, setIncongruentScores] = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [resultScore, setResultScore] = useState<number>(0);
  const [resultPercentile, setResultPercentile] = useState<number>(0);

  const trialStartTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctCountRef = useRef(0);
  const congruentScoresRef = useRef<number[]>([]);
  const incongruentScoresRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);
  const trialCount = useRef<number>(20);
  const incongruentRatio = useRef<number>(0.5);
  const trialTimeoutMs = useRef<number>(4000);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('stroop', 'lower').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);
    return () => { 
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const generateTrials = (): Trial[] => {
    const generated: Trial[] = [];
    for (let i = 0; i < trialCount.current; i++) {
      const isCongruent = Math.random() > incongruentRatio.current;
      const wordIdx = Math.floor(Math.random() * COLORS.length);
      let colorIdx = wordIdx;
      if (!isCongruent) {
        // pick a mismatched color
        colorIdx = (wordIdx + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
      }
      generated.push({
        word: COLORS[wordIdx].name,
        color: COLORS[colorIdx].name,
        isCongruent
      });
    }
    return generated;
  };

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : 20;
    trialCount.current = attemptCount;
    const diff = getDifficultyParams('stroop', (cfg.difficulty as string) || 'Medium');
    incongruentRatio.current = (diff.incongruentRatio as number) || 0.5;
    trialTimeoutMs.current = (diff.trialTimeoutMs as number) || 4000;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    submittedRef.current = false;
    const list = generateTrials();
    setTrials(list);
    setCurrentTrialIdx(0);
    setCongruentScores([]);
    setIncongruentScores([]);
    congruentScoresRef.current = [];
    incongruentScoresRef.current = [];
    setCorrectCount(0);
    correctCountRef.current = 0;
    setAccuracy(0);
    setLastFeedback(null);
    setShareImage(null);
    setGameState('running');
    nextTrial(0, list);
  };

  const nextTrial = (idx: number, list: Trial[]) => {
    if (idx >= list.length) {
      finishTest();
      return;
    }
    setCurrentTrialIdx(idx);
    setLastFeedback(null);
    trialStartTime.current = performance.now();
    lockedRef.current = false;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleAnswer(null);
    }, trialTimeoutMs.current);
  };

  const handleAnswer = (selectedColor: string | null) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Math.round(performance.now() - trialStartTime.current);
    const current = trials[currentTrialIdx];

    if (selectedColor === current.color) {
      setCorrectCount(prev => {
        const next = prev + 1;
        correctCountRef.current = next;
        return next;
      });
      
      // Save scores separately to calculate interference
      if (current.isCongruent) {
        setCongruentScores(prev => {
          const next = [...prev, elapsed];
          congruentScoresRef.current = next;
          return next;
        });
      } else {
        setIncongruentScores(prev => {
          const next = [...prev, elapsed];
          incongruentScoresRef.current = next;
          return next;
        });
      }
      setLastFeedback('correct');
    } else if (selectedColor === null) {
      setLastFeedback('timeout');
    } else {
      setLastFeedback('wrong');
    }

    // Delay slightly to show feedback green/red dot, then next trial
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      nextTrial(currentTrialIdx + 1, trials);
    }, 500);
  };

  const finishTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    const correctCount = correctCountRef.current;
    const congruentScores = congruentScoresRef.current;
    const incongruentScores = incongruentScoresRef.current;

    const totalAccuracy = Math.round((correctCount / Math.max(1, trialCount.current)) * 100);
    setAccuracy(totalAccuracy);

    const getAvg = (arr: number[]) => arr.length === 0 ? 0 : Math.round(arr.reduce((a,b)=>a+b,0) / arr.length);
    const avgCongruent = getAvg(congruentScores);
    const avgIncongruent = getAvg(incongruentScores);
    const avgScore = Math.round((congruentScores.reduce((a,b)=>a+b,0) + incongruentScores.reduce((a,b)=>a+b,0)) / Math.max(1, congruentScores.length + incongruentScores.length));

    const penalty = (trialCount.current - correctCount) * 150;
    const finalScore = avgScore + penalty;
    const percentile = Math.round(lookupPercentile('stroop', finalScore, true));
    setResultScore(finalScore);
    setResultPercentile(percentile);

    try {
      await dataLayer.saveSession({
        testId: 'stroop',
        category: 'focus',
        rawScore: finalScore,
        percentile,
        metadata: {
          accuracy: totalAccuracy,
          avgCongruent,
          avgIncongruent,
          interference: avgIncongruent - avgCongruent
        }
      });
    } catch (err) {
      console.error('Failed to save Stroop session:', err);
    }

    const pb = await dataLayer.getPersonalBest('stroop', 'lower');
    setPersonalBest(pb);

    try {
      const card = await generateShareCard('Stroop Attention Test', `${finalScore} ms`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'stroop', testName: 'Stroop Attention', attempts: [...congruentScores, ...incongruentScores], unit: 'ms',
      percentile, personalBest: pb, category: 'focus', average: finalScore,
    });
  };

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');
  useVisibilityGuard(() => setGameState('idle'), gameState === 'running');

  const getAvg = (arr: number[]) => arr.length === 0 ? 0 : Math.round(arr.reduce((a,b)=>a+b,0) / arr.length);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 select-none">
      {gameState === 'idle' && (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="stroop"
            icon="🎨"
            title="Stroop Attention Test"
            description="Test your brain's selective attention and processing conflict resolution. A word will appear in colored ink. Select the button matching the ink color of the word, NOT what the word itself reads."
            personalBest={personalBest}
            personalBestLabel="ms"
            onStart={(config: GameConfig) => startTest(config)}
          />
        </div>
      )}

      {gameState === 'running' && trials.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-between min-h-[350px] shadow-lg relative overflow-hidden">
          {/* Header Progress */}
          <div className="w-full flex justify-between items-center text-xs font-mono text-muted mb-6">
            <span>TRIAL {currentTrialIdx + 1} / {trialCount.current}</span>
            <span>CORRECT: {correctCount}</span>
          </div>

          {/* Color Word Output */}
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <h1 
              className={`text-5xl font-black tracking-widest ${
                COLORS.find(c => c.name === trials[currentTrialIdx].color)?.class || 'text-foreground'
              }`}
              style={{
                color: COLORS.find(c => c.name === trials[currentTrialIdx].color)?.hex
              }}
            >
              {trials[currentTrialIdx].word}
            </h1>
          </div>

          {/* Feedback indicators */}
          <div className="h-6 flex items-center justify-center mb-6">
            {lastFeedback === 'correct' && <span className="text-success font-bold font-mono text-xs">✓ CORRECT</span>}
            {lastFeedback === 'wrong' && <span className="text-error font-bold font-mono text-xs">✗ INCORRECT</span>}
            {lastFeedback === 'timeout' && <span className="text-warning font-bold font-mono text-xs">⏰ TIMEOUT</span>}
          </div>

          {/* Multiple choice inputs */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => handleAnswer(c.name)}
                className="h-12 rounded border border-card-border hover:bg-subtle text-foreground text-sm font-semibold tracking-wide transition-standard active:scale-97"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center justify-center text-success text-xl font-bold">
            ✓
          </div>
          <div>
            <span className="text-muted text-xs font-mono uppercase tracking-widest">Assessment Final Score</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {resultScore} ms
            </h2>
            <span className="text-accent text-xs font-mono uppercase mt-1 block">
              Top {Math.max(1, Math.min(99, 100 - resultPercentile))}% Globally
            </span>
          </div>

          {/* Details breakdown grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm border-t border-b border-card-border/50 py-4 my-2 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Accuracy</span>
              <span className="text-sm font-bold text-foreground">{accuracy}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Congruent RT</span>
              <span className="text-sm font-bold text-foreground">{getAvg(congruentScores) || '--'} ms</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Incongruent RT</span>
              <span className="text-sm font-bold text-foreground">{getAvg(incongruentScores) || '--'} ms</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Stroop Delay</span>
              <span className="text-sm font-bold text-foreground">
                {Math.max(0, getAvg(incongruentScores) - getAvg(congruentScores))} ms
              </span>
            </div>
          </div>

          <button
            onClick={() => startTest()}
            className="w-full h-11 rounded bg-accent hover:bg-accent-hover text-white font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
          >
            Train Again
          </button>

          {shareImage && (
            <SocialShare
              testId="stroop"
              score={resultScore}
              scoreLabel={`${resultScore} ms`}
              testName="Stroop Attention Test"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(StroopTest);
