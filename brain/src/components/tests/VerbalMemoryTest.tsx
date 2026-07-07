import { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

const WORD_POOL = [
  'apple', 'bridge', 'cloud', 'dragon', 'eagle', 'forest', 'garden', 'hammer', 'island', 'jewel',
  'knight', 'lunar', 'mountain', 'noble', 'ocean', 'piano', 'queen', 'river', 'silver', 'temple',
  'umbrella', 'valley', 'winter', 'yellow', 'arrow', 'beacon', 'candle', 'desert', 'ember', 'flame',
  'glacier', 'horizon', 'ivory', 'jungle', 'kettle', 'lantern', 'marble', 'nectar', 'orbit', 'plaza',
  'quartz', 'raven', 'summit', 'thunder', 'violet', 'willow', 'zenith', 'anchor', 'bloom', 'crystal',
];

const MAX_LEVEL = 12;

export default function VerbalMemoryTest() {
  const [phase, setPhase] = useState<'intro' | 'encoding' | 'recall' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [wordList, setWordList] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [maxCorrect, setMaxCorrect] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const generateList = (len: number) => {
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, len);
  };

  const generateOptions = (list: string[]) => {
    const distractors = WORD_POOL.filter(w => !list.includes(w)).sort(() => Math.random() - 0.5).slice(0, list.length);
    return [...list, ...distractors].sort(() => Math.random() - 0.5);
  };

  const startLevel = (lvl: number) => {
    const len = Math.min(3 + lvl, 12);
    const list = generateList(len);
    setWordList(list);
    setPhase('encoding');
    setSelected([]);
    setTimeout(() => {
      setOptions(generateOptions(list));
      setPhase('recall');
    }, Math.min(3000, len * 1200));
  };

  const toggleWord = (w: string) => {
    setSelected(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  const submitRecall = () => {
    const correctCount = selected.filter(w => wordList.includes(w)).length;
    if (correctCount > maxCorrect) setMaxCorrect(correctCount);
    if (correctCount === wordList.length && level < MAX_LEVEL) {
      const next = level + 1;
      setLevel(next);
      setTimeout(() => startLevel(next), 400);
    } else {
      setPhase('done');
      finalize(correctCount);
    }
  };

  const finalize = async (correct: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const score = Math.max(0, Math.min(100, Math.round((correct / Math.min(3 + level, 12)) * 100)));
    try {
      await dataLayer.saveSession({
        testId: 'verbal-memory', category: 'memory', rawScore: correct, percentile: lookupPercentile(score),
        metadata: { level, maxListLength: Math.min(3 + level, 12) },
      });
    } catch (err) {
      console.error('Failed to save Verbal Memory session:', err);
    }
    const card = await generateShareCard('Verbal Memory Test', `${correct}/${Math.min(3 + level, 12)}`, lookupPercentile(score));
    setShareImage(card);
  };

  const lookupPercentile = (s: number): number => {
    const levels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
    const pcts = [0.5, 2, 6, 14, 28, 46, 66, 84, 95, 99, 99.9];
    for (let i = levels.length - 1; i >= 0; i--) if (s >= levels[i]) return pcts[i];
    return 0.1;
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-3xl">📝</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Verbal Memory Test</h2>
            <p className="text-secondary text-sm max-w-sm mx-auto mt-2">Words appear one at a time. Remember them, then pick them out from a larger set.</p>
          </div>
          <button onClick={() => { setPhase('encoding'); setLevel(1); setMaxCorrect(0); startLevel(1); }} className="px-8 h-12 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-standard active:scale-95 cursor-pointer">Start Test</button>
        </div>
      </div>
    );
  }

  if (phase === 'encoding') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Level {level} · Memorize {Math.min(3 + level, 12)} words</div>
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
      <div className="w-full max-w-2xl mx-auto">
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
          </div>
          {shareImage && (
            <a href={shareImage} download="cogniarena-verbal-memory.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>Download Share Card</span>
            </a>
          )}
          <SocialShare testId="verbal-memory" score={finalCorrect} scoreLabel={`${finalCorrect}/${wordList.length}`} testName="Verbal Memory Test" />
          <button onClick={() => setPhase('intro')} className="flex items-center justify-center gap-2 rounded-md bg-subtle border border-card-border text-foreground hover:bg-panel h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
