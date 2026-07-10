import { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { getDifficultyParams } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';

const WORD_POOL = [
  'apple', 'bridge', 'cloud', 'dragon', 'eagle', 'forest', 'garden', 'hammer', 'island', 'jewel',
  'knight', 'lunar', 'mountain', 'noble', 'ocean', 'piano', 'queen', 'river', 'silver', 'temple',
  'umbrella', 'valley', 'winter', 'yellow', 'arrow', 'beacon', 'candle', 'desert', 'ember', 'flame',
  'glacier', 'horizon', 'ivory', 'jungle', 'kettle', 'lantern', 'marble', 'nectar', 'orbit', 'plaza',
  'quartz', 'raven', 'summit', 'thunder', 'violet', 'willow', 'zenith', 'anchor', 'bloom', 'crystal',
  'compass', 'dawn', 'falcon', 'granite', 'harbor', 'iron', 'jasper', 'lotus', 'maple', 'opal',
  'pearl', 'ridge', 'sapphire', 'tide', 'urchin', 'velvet', 'walnut', 'cedar', 'dusk', 'frost',
  'grove', 'hazel', 'jade', 'lilac', 'mosaic', 'onyx', 'prism', 'reef', 'sage', 'torch',
  'coral', 'delta', 'flint', 'garnet', 'harvest', 'indigo', 'lagoon', 'meadow', 'oasis', 'pine',
  'ruby', 'scarlet', 'timber', 'unity', 'vortex', 'wave', 'acorn', 'birch', 'copper', 'dune',
];

const MAX_LEVEL = 12;

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VerbalMemoryTest = () => {
  const [phase, setPhase] = useState<'intro' | 'encoding' | 'recall' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [wordList, setWordList] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [maxCorrect, setMaxCorrect] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const respondedRef = useRef(false);
  const submittedRef = useRef(false);
  const encodingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const levelTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastConfig = useRef<GameConfig | null>(null);
  const startListSize = useRef<number>(3);
  const maxLevel = useRef<number>(12);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');
  useVisibilityGuard(() => {
    if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current);
    if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
    setPhase('intro');
  }, phase === 'encoding' || phase === 'recall');

  const generateList = (len: number) => {
    return fisherYatesShuffle(WORD_POOL).slice(0, len);
  };

  const distractorMultiplier = useRef<number>(2);

  const generateOptions = (list: string[]) => {
    const distractorCount = Math.min(list.length * distractorMultiplier.current, 50);
    const distractors = fisherYatesShuffle(WORD_POOL.filter(w => !list.includes(w))).slice(0, distractorCount);
    return fisherYatesShuffle([...list, ...distractors]);
  };

  const startLevel = (lvl: number) => {
    const len = Math.min(startListSize.current + lvl - 1, maxLevel.current);
    const list = generateList(len);
    setWordList(list);
    setPhase('encoding');
    setSelected([]);
    if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current);
    encodingTimerRef.current = setTimeout(() => {
      setOptions(generateOptions(list));
      setPhase('recall');
    }, Math.min(3000, len * 1200));
  };

  const toggleWord = (w: string) => {
    setSelected(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  const submitRecall = () => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const correctCount = selected.filter(w => wordList.includes(w)).length;
    if (correctCount > maxCorrect) setMaxCorrect(correctCount);
    if (correctCount === wordList.length && level < maxLevel.current) {
      const next = level + 1;
      setLevel(next);
      if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
      levelTimerRef.current = setTimeout(() => { respondedRef.current = false; startLevel(next); }, 400);
    } else {
      setPhase('done');
      finalize(correctCount);
    }
  };

  const finalize = async (correct: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      await dataLayer.saveSession({
        testId: 'verbal-memory', category: 'memory', rawScore: correct, percentile: lookupPercentile('verbal-memory', correct),
        metadata: { level, maxListLength: Math.min(startListSize.current + level - 1, maxLevel.current) },
      });
    } catch (err) {
      console.error('Failed to save Verbal Memory session:', err);
    }
    if (!submittedRef.current) return;
    
    try {
      const card = await generateShareCard('Verbal Memory Test', `${correct}/${Math.min(startListSize.current + level - 1, maxLevel.current)}`, lookupPercentile('verbal-memory', correct));
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }
    if (!submittedRef.current) return;

    redirectToResults({
      testId: 'verbal-memory', testName: 'Verbal Memory', attempts: [correct], unit: 'words',
      percentile: lookupPercentile('verbal-memory', correct), personalBest: null, category: 'memory', average: correct,
    });
  };

  

  useEffect(() => {
    return () => {
      if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current);
      if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
    };
  }, []);

  const beginTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const diff = getDifficultyParams('verbal-memory', (cfg.difficulty as string) || 'Medium');
    startListSize.current = (diff.startListSize as number) || 3;
    maxLevel.current = (diff.maxLevel as number) || 12;
    distractorMultiplier.current = (cfg.difficulty as string) === 'Easy' ? 2 : (cfg.difficulty as string) === 'Hard' ? 3 : 2;
    if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current);
    if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
    submittedRef.current = false;
    setPhase('encoding');
    setLevel(1);
    setMaxCorrect(0);
    startLevel(1);
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="verbal-memory"
            icon="📝"
            title="Verbal Memory Test"
            description="Words appear one at a time. Remember them, then pick them out from a larger set."
            onStart={(config: GameConfig) => beginTest(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'encoding') {
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        <button onClick={() => { if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current); submittedRef.current = false; respondedRef.current = false; setPhase('intro'); }} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Level {level} · Memorize {Math.min(startListSize.current + level - 1, maxLevel.current)} words</div>
          <div className="flex flex-wrap justify-center gap-3 max-w-md">
            {wordList.map((w, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="px-4 py-2 rounded-lg bg-card border border-accent/30 text-sm font-medium text-foreground">{w}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'recall') {
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        <button onClick={() => { submittedRef.current = false; respondedRef.current = false; setPhase('intro'); }} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
          <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Select the words you saw · {selected.length}/{wordList.length}</div>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {options.map(w => (
              <button key={w} onClick={() => toggleWord(w)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-standard cursor-pointer ${
                  selected.includes(w) ? 'bg-accent/20 border-accent text-accent' : 'bg-subtle border-card-border text-secondary hover:border-accent/50'
                }`}
              >{w}</button>
            ))}
          </div>
          <button onClick={submitRecall} disabled={selected.length === 0}
            className="px-6 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm disabled:opacity-30 transition-standard active:scale-95 cursor-pointer"
          >Submit ({selected.length} selected)</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const finalCorrect = selected.filter(w => wordList.includes(w)).length;
    const score = Math.max(0, Math.min(100, Math.round((finalCorrect / wordList.length) * 100)));
    return (
      <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
          <div className="text-4xl text-success">✓</div>
          <div className="text-center">
            <div className="text-4xl font-bold font-mono text-foreground">{finalCorrect}/{wordList.length}</div>
            <div className="text-xs text-muted font-mono mt-1">Score: {score}/100 • Max Level: {level}</div>
            <span className="text-accent text-xs font-mono uppercase mt-1 block">
              {formatTopPercentile(lookupPercentile('verbal-memory', finalCorrect))}
            </span>
          </div>
          {shareImage && (
            <a href={shareImage} download="cogniarena-verbal-memory.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Share Card</span>
            </a>
          )}
          <SocialShare testId="verbal-memory" score={finalCorrect} scoreLabel={`${finalCorrect}/${wordList.length}`} testName="Verbal Memory Test" />
          <button onClick={() => { if (encodingTimerRef.current) clearTimeout(encodingTimerRef.current); submittedRef.current = false; respondedRef.current = false; setPhase('intro'); }} className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default withErrorBoundary(VerbalMemoryTest);
