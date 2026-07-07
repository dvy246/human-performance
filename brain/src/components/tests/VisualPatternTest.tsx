import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

type Phase = 'idle' | 'showing' | 'input' | 'feedback' | 'result';

const GRID_SIZES = [3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9];
const TILE_COUNTS = [3, 4, 4, 5, 6, 6, 7, 8, 9, 8, 9, 10, 11, 10, 12, 14, 14, 16, 18, 20];

export default function VisualPatternTest() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [userSelected, setUserSelected] = useState<Set<number>>(new Set());
  const [correctTiles, setCorrectTiles] = useState<Set<number>>(new Set());
  const [wrongTiles, setWrongTiles] = useState<Set<number>>(new Set());
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(100);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('visual-pattern', 'higher').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('challenge');
      if (token) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(decodeURIComponent(token));
          if (payload && payload.testId === 'visual-pattern') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => { mounted = false; };
  }, []);

  const generatePattern = (size: number, tileCount: number): Set<number> => {
    const total = size * size;
    const indices = new Set<number>();
    while (indices.size < Math.min(tileCount, total)) {
      indices.add(Math.floor(Math.random() * total));
    }
    return indices;
  };

  const startTest = () => {
    setLevel(1);
    setShareImage(null);
    startLevel(1);
  };

  const startLevel = (lvl: number) => {
    const idx = Math.min(lvl - 1, GRID_SIZES.length - 1);
    const size = GRID_SIZES[idx];
    const tiles = TILE_COUNTS[idx];
    
    setGridSize(size);
    const newPattern = generatePattern(size, tiles);
    setPattern(newPattern);
    setUserSelected(new Set());
    setCorrectTiles(new Set());
    setWrongTiles(new Set());
    setPhase('showing');
    setShowTimer(100);

    // Show pattern for a calculated duration
    const duration = 1500 + lvl * 200;
    const startTime = performance.now();

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setShowTimer(remaining);

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('input');
        setShowTimer(0);
      }
    }, 30);
  };

  const handleTileClick = useCallback((idx: number) => {
    if (phase !== 'input') return;

    setUserSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, [phase]);

  const submitPattern = useCallback(() => {
    if (phase !== 'input') return;

    // Calculate results
    const correct = new Set<number>();
    const wrong = new Set<number>();

    userSelected.forEach(idx => {
      if (pattern.has(idx)) {
        correct.add(idx);
      } else {
        wrong.add(idx);
      }
    });

    setCorrectTiles(correct);
    setWrongTiles(wrong);
    setPhase('feedback');

    // Check if enough tiles are correct (allowing 1 error margin for higher levels)
    const accuracy = correct.size / pattern.size;
    const passed = accuracy >= 0.8 && wrong.size <= Math.floor(level / 5);

    setTimeout(() => {
      if (passed) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        startLevel(nextLevel);
      } else {
        finishTest();
      }
    }, 1200);
  }, [phase, userSelected, pattern, level]);

  const finishTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const finalScore = level - 1;
    setPhase('result');

    const percentile = lookupPercentile(finalScore);

    try {
      await dataLayer.saveSession({
        testId: 'visual-pattern',
        category: 'memory',
        rawScore: finalScore,
        percentile,
        metadata: { maxLevel: finalScore }
      });
    } catch (err) {
      console.error('Failed to save Visual Pattern session:', err);
    }

    const pb = await dataLayer.getPersonalBest('visual-pattern', 'higher');
    setPersonalBest(pb);

    const card = await generateShareCard(
      'Visual Pattern Memory',
      `Level ${finalScore}`,
      percentile
    );
    setShareImage(card);
  };

  const lookupPercentile = (lvl: number): number => {
    if (lvl >= 18) return 99.9;
    if (lvl >= 15) return 99;
    if (lvl >= 13) return 97;
    if (lvl >= 11) return 92;
    if (lvl >= 9) return 82;
    if (lvl >= 7) return 65;
    if (lvl >= 5) return 42;
    if (lvl >= 3) return 20;
    if (lvl >= 2) return 8;
    return 2;
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const finalScore = level - 1;
    const token = encodeChallenge({ testId: 'visual-pattern', score: finalScore });
    const url = `${window.location.origin}/tests/visual-pattern/?challenge=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(console.error);
  };

  const finalScore = level - 1;
  const totalCells = gridSize * gridSize;

  // Dynamic grid cell size
  const cellSize = gridSize <= 4 ? 'w-14 h-14 md:w-16 md:h-16' : 
                   gridSize <= 6 ? 'w-10 h-10 md:w-12 md:h-12' : 
                   'w-8 h-8 md:w-10 md:h-10';

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Challenge Banner */}
      {challengeScore && phase !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">
            Active Challenge: Beat Level{' '}
            <strong className="text-foreground font-mono">{challengeScore}</strong>!
          </span>
          <button
            onClick={() => setChallengeScore(null)}
            className="text-[11px] text-muted hover:text-foreground font-mono uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Test Area */}
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 min-h-[400px] justify-center relative overflow-hidden">
        
        {/* Level & status indicator */}
        {phase !== 'idle' && phase !== 'result' && (
          <div className="flex justify-between items-center w-full max-w-sm text-xs font-mono text-muted">
            <span>Level: <strong className="text-foreground">{level}</strong></span>
            <span>Grid: <strong className="text-accent">{gridSize}×{gridSize}</strong></span>
            <span>Status: <strong className="text-accent">
              {phase === 'showing' ? 'MEMORIZE' : phase === 'input' ? 'RECALL' : 'CHECKING'}
            </strong></span>
          </div>
        )}

        {/* IDLE STATE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl">
              🧩
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-1">Visual Pattern Memory</h3>
              <p className="text-muted text-sm max-w-xs">
                Memorize the highlighted tiles on a grid, then recreate the pattern from memory. Grid size increases with each level.
              </p>
            </div>
            <button
              onClick={startTest}
              className="text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-8 py-2.5 rounded transition-standard active:scale-[0.98]"
            >
              Start Test
            </button>
          </div>
        )}

        {/* SHOWING / INPUT / FEEDBACK GRID */}
        {(phase === 'showing' || phase === 'input' || phase === 'feedback') && (
          <div className="flex flex-col items-center gap-4">
            {/* Progress bar (showing phase only) */}
            {phase === 'showing' && (
              <div className="w-full max-w-xs h-1.5 bg-subtle rounded-full overflow-hidden border border-card-border/60">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-75"
                  style={{ width: `${showTimer}%` }}
                />
              </div>
            )}

            {/* Grid */}
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: totalCells }, (_, idx) => {
                const isPatternTile = pattern.has(idx);
                const isUserSelected = userSelected.has(idx);
                const isCorrect = correctTiles.has(idx);
                const isWrong = wrongTiles.has(idx);
                const isMissed = phase === 'feedback' && isPatternTile && !userSelected.has(idx);

                let tileClass = 'bg-subtle border-card-border';

                if (phase === 'showing' && isPatternTile) {
                  tileClass = 'bg-accent border-accent shadow-[0_0_15px_rgba(217,119,6,0.4)] scale-95';
                } else if (phase === 'input' && isUserSelected) {
                  tileClass = 'bg-accent/80 border-accent';
                } else if (phase === 'feedback') {
                  if (isCorrect) tileClass = 'bg-emerald-500/60 border-emerald-500';
                  else if (isWrong) tileClass = 'bg-red-500/60 border-red-500';
                  else if (isMissed) tileClass = 'bg-amber-500/30 border-amber-500/50';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(idx)}
                    disabled={phase !== 'input'}
                    className={`${cellSize} rounded-lg border transition-all duration-100 cursor-pointer outline-none select-none ${tileClass} ${
                      phase === 'input' ? 'hover:border-card-border active:scale-95' : ''
                    }`}
                    aria-label={`Tile ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Submit button (input phase only) */}
            {phase === 'input' && (
              <button
                onClick={submitPattern}
                className="mt-2 text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-8 py-2.5 rounded transition-standard active:scale-[0.98]"
              >
                Submit Pattern ({userSelected.size}/{pattern.size} selected)
              </button>
            )}
          </div>
        )}

        {/* RESULT STATE */}
        {phase === 'result' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted text-xs font-mono uppercase">
                Visual Pattern Memory
              </span>
              <div className="text-5xl font-mono font-bold text-foreground">
                Level {finalScore}
              </div>
              <span className="text-accent text-xs font-mono uppercase mt-1">
                Top {100 - lookupPercentile(finalScore)}% of population
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-xs border-t border-card-border/50 pt-4 text-center mt-2">
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">
                  {personalBest ? `Level ${personalBest}` : '--'}
                </div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">Percentile</span>
                <div className="text-foreground font-mono text-sm">
                  ~{Math.round(100 - lookupPercentile(finalScore))}%ile
                </div>
              </div>
            </div>

            {challengeScore && (
              <div className={`w-full max-w-xs p-3 rounded-lg border text-center text-sm font-mono ${
                finalScore >= challengeScore
                  ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-success'
                  : 'bg-[var(--error-bg)] border-[var(--error-border)] text-error'
              }`}>
                {finalScore >= challengeScore
                  ? `🏆 You beat Level ${challengeScore}!`
                  : `Try again! Target: Level ${challengeScore}`}
              </div>
            )}

            <SocialShare
              testId="visual-pattern"
              score={finalScore}
              scoreLabel={`Level ${finalScore}`}
              testName="Visual Pattern Memory Test"
            />

            <button
              onClick={startTest}
              className="mt-4 text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Share Actions */}
      {phase === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-visual-pattern.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Score Card</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
