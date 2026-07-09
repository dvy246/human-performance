import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import { lookupPercentile } from '../../runtime/percentileLookup';
import { useSound } from '../../runtime/useSound';
import { useI18n } from '../../runtime/useI18n';
import { redirectToResults } from '../../runtime/redirectToResults';
import SocialShare from '../ui/SocialShare';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';

type TestState = 'idle' | 'showing' | 'playing' | 'result';

function SequenceMemoryTest() {
  const { playTone, playClick, playSuccess, playError } = useSound();
  const { t } = useI18n();
  const [gameState, setGameState] = useState<TestState>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [resultPercentile, setResultPercentile] = useState<number>(0);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  const sequenceRef = useRef<number[]>([]);
  const userSequenceRef = useRef<number[]>([]);
  const userTurnLock = useRef<boolean>(false);
  const submittedRef = useRef(false);
  const totalAttempts = useRef<number>(5);
  const waitRange = useRef<{ min: number; max: number }>({ min: 1000, max: 3000 });
  const lastConfig = useRef<GameConfig | null>(null);
  const flashOnMs = useRef<number>(450);
  const flashOffMs = useRef<number>(200);
  const startLenRef = useRef<number>(3);
  const mountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('sequence-memory', 'higher').then((pb) => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const challengeToken = params.get('challenge');
      if (challengeToken) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(decodeURIComponent(challengeToken));
          if (payload && payload.testId === 'sequence-memory') {
            if (mounted) setChallengeScore(payload.score);
          }
        }).catch(console.error)
      }
    }

    return () => { mounted = false; mountedRef.current = false; };
  }, []);



  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const diff = getDifficultyParams('sequence-memory', (cfg.difficulty as string) || 'Medium');
    flashOnMs.current = (diff.flashOn as number) || 450;
    flashOffMs.current = (diff.flashOff as number) || 200;
    startLenRef.current = (diff.startLen as number) || 3;
    sequenceRef.current = [];
    userSequenceRef.current = [];
    setSequence([]);
    setUserSequence([]);
    setLevel(1);
    setShareImage(null);
    submittedRef.current = false;
    nextRound(true);
  };

  const nextRound = (isFirst = false) => {
    userTurnLock.current = true;
    setGameState('showing');
    setUserSequence([]);
    userSequenceRef.current = [];

    if (isFirst && startLenRef.current > 1) {
      // Seed initial sequence based on difficulty
      const seed: number[] = [];
      for (let i = 0; i < startLenRef.current; i++) {
        seed.push(Math.floor(Math.random() * 9));
      }
      sequenceRef.current = seed;
      setSequence(seed);
      setLevel(seed.length);
    } else {
      // Add new random tile (0 to 8)
      const nextTile = Math.floor(Math.random() * 9);
      const newSeq = [...sequenceRef.current, nextTile];
      sequenceRef.current = newSeq;
      setSequence(newSeq);
      setLevel(newSeq.length);
    }

    // Run flash cycle
    setTimeout(() => {
      playSequence(sequenceRef.current);
    }, isFirst ? 600 : 800);
  };

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      if (!mountedRef.current) break;
      const tile = seq[i];
      // Flash ON
      setActiveTile(tile);
      playTone(300 + tile * 60, 0.18, 'sine', 0.12); // rising tone per tile
      await delay(flashOnMs.current);
      if (!mountedRef.current) break;
      setActiveTile(null);
      await delay(flashOffMs.current);
    }
    if (!mountedRef.current) return;
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
      playClick();
      const nextUserSeq = [...userSequenceRef.current, tileIdx];
      userSequenceRef.current = nextUserSeq;
      setUserSequence(nextUserSeq);

      if (nextUserSeq.length === sequenceRef.current.length) {
        // Complete round with celebration pause
        userTurnLock.current = true;
        playSuccess();
        setTimeout(() => nextRound(), 600);
      }
    } else {
      // Incorrect! Game over
      playError();
      finalizeTest();
    }
  };

  const finalizeTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const finalScore = level - 1;
    const percentile = lookupPercentile('sequence-memory', finalScore);
    setResultPercentile(percentile);

    try {
      await dataLayer.saveSession({
        testId: 'sequence-memory',
        category: 'memory',
        rawScore: finalScore,
        percentile: percentile,
        metadata: {}
      });
    } catch (err) {
      console.error('Failed to save Sequence Memory session:', err);
    }

    const pb = await dataLayer.getPersonalBest('sequence-memory', 'higher');
    setPersonalBest(pb);

    try {
      const card = await generateShareCard('Sequence Memory Test', `Level ${finalScore}`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    redirectToResults({
      testId: 'sequence-memory', testName: 'Sequence Memory', attempts: [finalScore], unit: 'levels',
      percentile, personalBest: pb, category: 'memory', average: finalScore,
    });
  };

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const finalScore = level - 1;
    const token = encodeChallenge({ testId: 'sequence-memory', score: finalScore });
    const url = `${window.location.origin}/tests/sequence-memory/?challenge=${token}`;
    
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
          <span className="text-foreground">{t('test.challenge_beat')} <strong className="text-foreground font-mono">{t('seq.level')} {challengeScore}</strong>!</span>
          <button onClick={() => setChallengeScore(null)} className="text-[11px] text-muted hover:text-foreground font-mono uppercase">{t('test.dismiss')}</button>
        </div>
      )}

      {/* Grid Container */}
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 relative">
        <button onClick={() => setGameState('idle')} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
        <div className="flex justify-between items-center w-full max-w-xs text-xs font-mono text-muted">
          <span>{t('seq.level')} <strong className="text-foreground">{level}</strong></span>
          <span>{t('seq.status')} <strong className="text-accent">{gameState === 'showing' ? t('seq.watch') : gameState === 'playing' ? t('seq.repeat') : t('seq.ready')}</strong></span>
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
                      : 'bg-subtle border-card-border hover:border-muted'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          /* Result Board */
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-accent text-[10px] font-mono uppercase tracking-widest font-semibold">Sequence Memory Test</span>
              <span className="text-muted text-xs font-mono uppercase mt-1">{t('seq.memory_span')}</span>
              <div className="text-5xl font-mono font-bold text-foreground">{t('seq.level')} {level - 1}</div>
              <span className="text-accent text-xs font-mono uppercase">
                {t('rt.top_globally')} {100 - lookupPercentile('sequence-memory', level - 1)}% {t('seq.population')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-xs border-t border-card-border/50 pt-4 text-center mt-2">
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">{t('test.personal_best')}</span>
                <div className="text-foreground font-mono text-sm">{personalBest ? `${t('seq.level')} ${personalBest}` : '--'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px] font-mono uppercase">{t('seq.percentile_span')}</span>
                <div className="text-foreground font-mono text-sm">~{Math.round(100 - lookupPercentile('sequence-memory', level - 1))}%ile</div>
              </div>
            </div>

            <button
              onClick={() => startTest()}
              className="mt-2 text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground px-4 py-1.5 rounded border border-card-border hover:border-accent/30 bg-subtle cursor-pointer"
            >
              {t('test.restart')}
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <GameConfigPanel
            testId="sequence-memory"
            icon="🧠"
            title="Sequence Memory Test"
            description="Watch the tile sequence, then repeat it from memory. Each round adds one more tile."
            personalBest={personalBest}
            personalBestLabel="levels"
            startLabel="Start Memory Test"
            onStart={(config: GameConfig) => startTest(config)}
          />
        )}
      </div>

      {/* Share Actions */}
      {gameState === 'result' && (
        <div className="flex flex-col gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-memory-score.png"
              className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>{t('seq.download_memory')}</span>
            </a>
          )}
          <SocialShare
            testId="sequence-memory"
            score={level - 1}
            scoreLabel={`${t('seq.level')} ${level - 1}`}
            testName="Sequence Memory"
            percentile={resultPercentile}
          />
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(SequenceMemoryTest);
