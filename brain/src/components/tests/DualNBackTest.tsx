import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

type GameState = 'idle' | 'running' | 'result';

interface Stimulus {
  position: number; // 0-8 grid index
  letter: string;   // 'A', 'B', 'C', 'D', 'P', 'T', 'L'
}

const LETTERS = ['A', 'B', 'C', 'D', 'P', 'T', 'L'];
const TOTAL_TRIALS = 20;

export default function DualNBackTest() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [n, setN] = useState<number>(2); // Default N=2
  const [trialList, setTrialList] = useState<Stimulus[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // User input responses
  const [posMatches, setPosMatches] = useState<boolean[]>([]);
  const [letterMatches, setLetterMatches] = useState<boolean[]>([]);
  const [score, setScore] = useState(0); // overall score points
  const [accuracy, setAccuracy] = useState(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);

  // Tracks if the user already pressed match keys in the current trial
  const posAnswered = useRef<boolean>(false);
  const letterAnswered = useRef<boolean>(false);
  const userMatchPos = useRef<boolean>(false);
  const userMatchLetter = useRef<boolean>(false);
  const posMatchesRef = useRef<boolean[]>([]);
  const letterMatchesRef = useRef<boolean[]>([]);
  const submittedRef = useRef<boolean>(false);

  const trialTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('dual-n-back', 'higher').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);
    return () => {
      mounted = false;
      if (trialTimerRef.current) clearInterval(trialTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, []);

  const speakLetter = (letter: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech to avoid delays
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
      utterance.rate = 1.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateSequence = (nVal: number): Stimulus[] => {
    const list: Stimulus[] = [];
    
    // Fill first N trials randomly
    for (let i = 0; i < nVal; i++) {
      list.push({
        position: Math.floor(Math.random() * 9),
        letter: LETTERS[Math.floor(Math.random() * LETTERS.length)]
      });
    }

    // Fill remaining trials with ~30% target matches to ensure active cognitive load
    for (let i = nVal; i < TOTAL_TRIALS; i++) {
      const matchPos = Math.random() < 0.35;
      const matchLetter = Math.random() < 0.35;

      const position = matchPos 
        ? list[i - nVal].position 
        : Math.floor(Math.random() * 9);

      const letter = matchLetter 
        ? list[i - nVal].letter 
        : LETTERS[Math.floor(Math.random() * LETTERS.length)];

      list.push({ position, letter });
    }

    return list;
  };

  const startTest = () => {
    const sequence = generateSequence(n);
    setTrialList(sequence);
    setCurrentIdx(-1);
    setActivePosition(null);
    setActiveLetter(null);
    setPosMatches([]);
    setLetterMatches([]);
    posMatchesRef.current = [];
    letterMatchesRef.current = [];
    submittedRef.current = false;
    setScore(0);
    setAccuracy(0);
    setShareImage(null);
    setGameState('running');

    // Launch sequence timing
    setTimeout(() => {
      runNextTrial(0, sequence);
    }, 500);
  };

  const runNextTrial = (idx: number, list: Stimulus[]) => {
    if (idx >= list.length) {
      evaluateResult(list);
      return;
    }

    setCurrentIdx(idx);
    const stim = list[idx];
    
    // Trigger visual/auditory stimulus
    setActivePosition(stim.position);
    setActiveLetter(stim.letter);
    speakLetter(stim.letter);

    // Clear user match flags
    posAnswered.current = false;
    letterAnswered.current = false;
    userMatchPos.current = false;
    userMatchLetter.current = false;

    // Flash stimulus for 1.2s, then wait in blank screen state for another 1.3s (2.5s total trial time)
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    sequenceTimerRef.current = setTimeout(() => {
      setActivePosition(null);
      setActiveLetter(null);
    }, 1200);

    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    trialTimerRef.current = setTimeout(() => {
      // Evaluate trial response at the end of the 2.5s interval
      evaluateTrialResponse(idx, list);
      runNextTrial(idx + 1, list);
    }, 2500);
  };

  const handleMatchPosition = useCallback(() => {
    if (gameState !== 'running' || currentIdx < n) return;
    userMatchPos.current = true;
  }, [gameState, currentIdx, n]);

  const handleMatchLetter = useCallback(() => {
    if (gameState !== 'running' || currentIdx < n) return;
    userMatchLetter.current = true;
  }, [gameState, currentIdx, n]);

  const evaluateTrialResponse = (idx: number, list: Stimulus[]) => {
    if (idx < n) return; // First N trials cannot have matches

    const targetPosMatch = list[idx].position === list[idx - n].position;
    const targetLetterMatch = list[idx].letter === list[idx - n].letter;

    // Compare user action with target state
    const posCorrect = userMatchPos.current === targetPosMatch;
    const letterCorrect = userMatchLetter.current === targetLetterMatch;

    posMatchesRef.current = [...posMatchesRef.current, posCorrect];
    letterMatchesRef.current = [...letterMatchesRef.current, letterCorrect];
    setPosMatches(posMatchesRef.current);
    setLetterMatches(letterMatchesRef.current);
  };

  const evaluateResult = async (list: Stimulus[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);

    // Calculate total matches accuracy from refs (captures last trial)
    const posCorrectCount = posMatchesRef.current.filter(Boolean).length;
    const letterCorrectCount = letterMatchesRef.current.filter(Boolean).length;
    const totalPossible = (TOTAL_TRIALS - n) * 2;
    const totalCorrect = posCorrectCount + letterCorrectCount;
    const finalAccuracy = Math.round((totalCorrect / Math.max(1, totalPossible)) * 100);

    setAccuracy(finalAccuracy);

    // Calculate final composite score
    const finalScore = Math.round((n * 1000) + (finalAccuracy * 50));
    setScore(finalScore);

    const percentile = Math.max(1, Math.min(99, Math.round((finalScore / 10000) * 100)));

    try {
      await dataLayer.saveSession({
        testId: 'dual-n-back',
        category: 'memory',
        rawScore: finalScore,
        percentile,
        metadata: {
          nLevel: n,
          accuracy: finalAccuracy,
          posCorrect: posCorrectCount,
          letterCorrect: letterCorrectCount
        }
      });
    } catch (err) {
      console.error('Failed to save DualN-Back session:', err);
    }

    dataLayer.getPersonalBest('dual-n-back', 'higher').then(pb => {
      setPersonalBest(pb);
    }).catch(console.error);

    const card = await generateShareCard('Dual N-Back Test', `N=${n} (${finalAccuracy}%)`, percentile).catch(() => '');
    setShareImage(card);
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'running') return;
      if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
        handleMatchPosition();
      } else if (e.key.toLowerCase() === 'l' || e.key === 'ArrowRight') {
        handleMatchLetter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMatchPosition, handleMatchLetter]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 select-none">
      {gameState === 'idle' && (
        <div className="rounded-xl border border-card-border bg-card p-8 text-center flex flex-col gap-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mx-auto">
            🧠
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Dual N-Back Memory</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
              The gold standard for visual-auditory working memory training.
              Compare the **current grid position** and **spoken letter** to those shown **N steps back**.
            </p>
          </div>

          {/* N Level Selector */}
          <div className="flex flex-col gap-2 items-center">
            <span className="text-xs text-zinc-500 font-mono">CHOOSE DIFFICULTY LEVEL (N):</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(val => (
                <button
                  key={val}
                  onClick={() => setN(val)}
                  className={`w-10 h-10 rounded border font-bold font-mono transition-standard ${
                    n === val
                      ? 'bg-accent border-accent text-black shadow-sm'
                      : 'border-card-border hover:bg-subtle text-foreground'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full h-11 rounded bg-accent hover:bg-accent-hover text-black font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
          >
            Start Assessment
          </button>
          {personalBest && (
            <span className="text-[10px] text-zinc-500 font-mono uppercase">
              Personal Best: {personalBest} Pts
            </span>
          )}
        </div>
      )}

      {gameState === 'running' && (
        <div className="rounded-xl border border-card-border bg-card p-6 flex flex-col items-center justify-between min-h-[440px] shadow-lg relative overflow-hidden">
          {/* Header Status */}
          <div className="w-full flex justify-between items-center text-xs font-mono text-zinc-500 mb-6">
            <span>TRIAL {currentIdx + 1} / 20</span>
            <span>LEVEL: DUAL {n}-BACK</span>
          </div>

          {/* 3x3 Visual Grid */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] aspect-square mx-auto mb-6">
            {Array.from({ length: 9 }).map((_, idx) => {
              const isActive = activePosition === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-lg border aspect-square transition-all duration-150 ${
                    isActive
                      ? 'bg-accent border-accent shadow-md scale-98'
                      : 'bg-subtle border-card-border/40'
                  }`}
                />
              );
            })}
          </div>

          {/* Audio Indicator Backup (Visual Assist) */}
          <div className="h-6 flex items-center justify-center mb-6">
            {activeLetter ? (
              <span className="text-zinc-500 font-mono text-xs">Audio backup: [ {activeLetter} ]</span>
            ) : (
              <span className="text-zinc-500 font-mono text-xs opacity-0">Wait</span>
            )}
          </div>

          {/* Match Trigger Buttons */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={handleMatchPosition}
              className="h-12 rounded border border-card-border hover:bg-subtle text-foreground text-sm font-semibold tracking-wide transition-standard active:scale-97 flex flex-col items-center justify-center"
            >
              <span>Match Position</span>
              <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Key [A] or [←]</span>
            </button>
            <button
              onClick={handleMatchLetter}
              className="h-12 rounded border border-card-border hover:bg-subtle text-foreground text-sm font-semibold tracking-wide transition-standard active:scale-97 flex flex-col items-center justify-center"
            >
              <span>Match Audio</span>
              <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Key [L] or [→]</span>
            </button>
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-xl font-bold">
            ✓
          </div>
          <div>
            <span className="text-zinc-550 text-xs font-mono uppercase tracking-widest">
              Dual {n}-Back Result
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {score} Pts
            </h2>
            <span className="text-accent text-xs font-mono uppercase mt-1 block">
              Top {100 - accuracy}% memory performance
            </span>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm border-t border-b border-card-border/50 py-4 my-2 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Accuracy</span>
              <span className="text-sm font-bold text-foreground">{accuracy}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Position Correct</span>
              <span className="text-sm font-bold text-foreground">
                {posMatches.filter(Boolean).length} / {TOTAL_TRIALS - n}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Audio Correct</span>
              <span className="text-sm font-bold text-foreground">
                {letterMatches.filter(Boolean).length} / {TOTAL_TRIALS - n}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">N-Back Level</span>
              <span className="text-sm font-bold text-foreground">{n}</span>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full h-11 rounded bg-accent hover:bg-accent-hover text-black font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
          >
            Train Again
          </button>

          {shareImage && (
            <SocialShare
              testId="dual-n-back"
              score={score}
              scoreLabel={`N=${n} (${accuracy}%)`}
              testName="Dual N-Back Memory Test"
            />
          )}
        </div>
      )}
    </div>
  );
}
