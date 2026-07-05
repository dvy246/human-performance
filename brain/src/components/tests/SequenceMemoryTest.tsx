import React, { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';

type TestState = 'idle' | 'showing' | 'playing' | 'result';

export default function SequenceMemoryTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const sequenceRef = useRef<number[]>([]);
  const userSequenceRef = useRef<number[]>([]);
  const userTurnLock = useRef<boolean>(false);

  useEffect(() => {
    dataLayer.getPersonalBest('sequence-memory', 'higher').then((pb) => {
      setPersonalBest(pb);
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(decodeURIComponent(challengeToken));
          if (payload && payload.testId === 'sequence-memory') {
            setChallengeScore(payload.score);
          }
        });
      }
    }
  }, []);

  const lookupPercentile = (lvl: number): number => {
    // Sequence Memory distribution
    // Average is level 7 (50th percentile)
    // Level 10 is ~85th percentile
    // Level 13 is ~95th percentile
    // Level 16+ is ~99th percentile
    if (lvl >= 17) return 99.9;
    if (lvl >= 14) return 98.0;
    if (lvl >= 11) return 90.0;
    if (lvl >= 8) return 70.0;
    if (lvl >= 6) return 40.0;
    if (lvl >= 4) return 15.0;
    return 1.0;
  };

  const startTest = () => {
    sequenceRef.current = [];
    userSequenceRef.current = [];
    setSequence([]);
    setUserSequence([]);
    setLevel(1);
    setShareImage(null);
    nextRound(true);
  };

  const nextRound = (isFirst = false) => {
    userTurnLock.current = true;
    setGameState('showing');
    setUserSequence([]);
    userSequenceRef.current = [];

    // Add new random tile (0 to 8)
    const nextTile = Math.floor(Math.random() * 9);
    const newSeq = [...sequenceRef.current, nextTile];
    sequenceRef.current = newSeq;
    setSequence(newSeq);
    setLevel(newSeq.length);

    // Run flash cycle
    setTimeout(() => {
      playSequence(newSeq);
    }, isFirst ? 600 : 800);
  };

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      const tile = seq[i];
      // Flash ON
      setActiveTile(tile);
      await delay(450);
      // Flash OFF
      setActiveTile(null);
      await delay(200);
    }
    setGameState('playing');
    userTurnLock.current = false;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTileClick = async (tileIdx: number) => {
    if (gameState !== 'playing' || userTurnLock.current) return;

    // Flash clicked tile briefly
    setActiveTile(tileIdx);
    setTimeout(() => setActiveTile(null), 150);

    const expectedTile = sequenceRef.current[userSequenceRef.current.length];

    if (tileIdx === expectedTile) {
      // Correct!
      const nextUserSeq = [...userSequenceRef.current, tileIdx];
      userSequenceRef.current = nextUserSeq;
      setUserSequence(nextUserSeq);

      if (nextUserSeq.length === sequenceRef.current.length) {
        // Complete round!
        userTurnLock.current = true;
        nextRound();
      }
    } else {
      // Incorrect! Game over
      finalizeTest();
    }
  };

  const finalizeTest = async () => {
    setGameState('result');
    const finalScore = level - 1;
    const percentile = lookupPercentile(finalScore);

    await dataLayer.saveSession({
      testId: 'sequence-memory',
      category: 'memory',
      rawScore: finalScore,
      percentile: percentile,
      metadata: {}
    });

    const pb = await dataLayer.getPersonalBest('sequence-memory', 'higher');
    setPersonalBest(pb);

    const card = await generateShareCard('Sequence Memory Test', `Level ${finalScore}`, percentile);
    setShareImage(card);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const finalScore = level - 1;
    const token = encodeChallenge({ testId: 'sequence-memory', score: finalScore });
    const url = `${window.location.origin}/tests/sequence-memory/?challenge=${token}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    });
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Target Challenge */}
      {challengeScore && gameState !== 'result' && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/50 rounded-lg p-4 flex justify-between items-center text-sm">
          <span className="text-foreground">Active Challenge: Beat your friend's score of <strong className="text-foreground font-mono">Level {challengeScore}</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-zinc-500 hover:text-foreground font-mono uppercase">Dismiss</button>
        </div>
      )}

      {/* Grid Container */}
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
        <div className="flex justify-between items-center w-full max-w-xs text-xs font-mono text-zinc-500">
          <span>Level: <strong className="text-foreground">{level}</strong></span>
          <span>Status: <strong className="text-accent">{gameState === 'showing' ? 'WATCH' : gameState === 'playing' ? 'REPEAT' : 'READY'}</strong></span>
        </div>

        {gameState !== 'result' ? (
          /* Simon Grid Layout */
          <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px] h-[280px]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
              const isActive = activeTile === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`w-full h-full rounded-lg border transition-all cursor-pointer outline-none select-none duration-75 ${
                    isActive
                      ? 'bg-accent border-accent shadow-[0_0_20px_rgba(217,119,6,0.5)] scale-95'
                      : 'bg-zinc-200 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          /* Result Board */
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-zinc-500 text-xs font-mono uppercase">Memory Span Capacity</span>
              <div className="text-5xl font-mono font-bold text-foreground">Level {level - 1}</div>
              <span className="text-accent text-xs font-mono uppercase">
                Top {lookupPercentile(level - 1)}% of population
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-xs border-t border-card-border/50 pt-4 text-center mt-2">
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Personal Best</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `Level ${personalBest}` : '--'}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Percentile Span</span>
                <div className="text-foreground font-mono text-sm">~{Math.round(100 - lookupPercentile(level - 1))}%ile</div>
              </div>
            </div>

            <button
              onClick={startTest}
              className="mt-2 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
            >
              Restart Assessment
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <button
            onClick={startTest}
            className="text-xs uppercase font-mono tracking-widest text-black bg-accent hover:bg-accent-hover font-semibold px-6 py-2 rounded transition-standard active:scale-[0.98]"
          >
            Start Memory Test
          </button>
        )}
      </div>

      {/* Share Actions */}
      {gameState === 'result' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="brainbenchmarks-memory-score.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Memory Card</span>
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
