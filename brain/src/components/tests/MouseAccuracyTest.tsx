import { useState, useRef } from 'react';
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

const TARGET_SIZES = [80, 60, 45, 32, 22];
const PER_SIZE = 5;
const TOTAL = TARGET_SIZES.length * PER_SIZE;

function MouseAccuracyTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState({ x: 0, y: 0, size: 80 });
  const [offsets, setOffsets] = useState<number[]>([]);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);
  const respondedRef = useRef(false);
  const offsetsRef = useRef<number[]>([]);
  const lastConfig = useRef<GameConfig | null>(null);
  const targetCount = useRef<number>(TOTAL);
  const sizeMultiplier = useRef<number>(1.0);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');
  useVisibilityGuard(() => {
    setPhase('intro');
  }, phase === 'playing');

  const spawnTarget = (idx: number) => {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const sizeIdx = Math.min(Math.floor(idx / PER_SIZE), TARGET_SIZES.length - 1);
    const size = Math.round(TARGET_SIZES[sizeIdx] * (sizeMultiplier.current ?? 1.0));
    const margin = size / 2 + 4;
    const x = margin + Math.random() * (rect.width - margin * 2);
    const y = margin + Math.random() * (rect.height - margin * 2);
    setTarget({ x, y, size });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (phase !== 'playing') return;
    if (respondedRef.current) return;
    respondedRef.current = true;
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const offset = Math.sqrt((cx - target.x) ** 2 + (cy - target.y) ** 2);
    offsetsRef.current = [...offsetsRef.current, offset];
    setOffsets(prev => [...prev, offset]);
    const next = trial + 1;
    if (next >= targetCount.current) {
      setPhase('done');
      finalize(offsetsRef.current);
      return;
    }
    setTrial(prev => prev + 1);
    respondedRef.current = false;
    spawnTarget(next);
  };

  const finalize = async (allOffsets: number[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const avgOffset = allOffsets.reduce((a, b) => a + b, 0) / allOffsets.length;
    const score = Math.max(0, Math.min(100, Math.round(100 - avgOffset / 2)));
    try {
      await dataLayer.saveSession({
        testId: 'mouse-accuracy', category: 'precision', rawScore: score, percentile: lookupPercentile('mouse-accuracy', score),
        metadata: { avgOffsetPx: Math.round(avgOffset * 10) / 10, totalTargets: targetCount.current },
      });
    } catch (err) {
      console.error('Failed to save Mouse Accuracy session:', err);
    }
    if (!submittedRef.current) return;
    const card = await generateShareCard('Mouse Accuracy Test', `${Math.round(avgOffset * 10) / 10}px avg`, lookupPercentile('mouse-accuracy', score)).catch(() => '');
    if (!submittedRef.current) return;
    setShareImage(card);

    if (!submittedRef.current) return;
    redirectToResults({
      testId: 'mouse-accuracy', testName: 'Mouse Accuracy', attempts: allOffsets, unit: 'px',
      percentile: lookupPercentile('mouse-accuracy', score), personalBest: null, category: 'precision', average: Math.round(allOffsets.reduce((a, b) => a + b, 0) / allOffsets.length),
    });
  };

  

  const startGame = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : TOTAL;
    targetCount.current = attemptCount;
    const diff = getDifficultyParams('mouse-accuracy', (cfg.difficulty as string) || 'Medium');
    sizeMultiplier.current = (diff.sizeMultiplier as number) || 1.0;
    setPhase('playing');
    setTrial(0);
    setOffsets([]);
    offsetsRef.current = [];
    submittedRef.current = false;
    respondedRef.current = false;
    setTimeout(() => spawnTarget(0), 200);
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="mouse-accuracy"
            icon="🎯"
            title="Mouse Accuracy Test"
            description="Click the center of each target. Targets shrink as you progress."
            onStart={(config: GameConfig) => startGame(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const sizeIdx = Math.min(Math.floor(trial / PER_SIZE), TARGET_SIZES.length - 1);
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-[10px] text-muted font-mono mb-2 flex items-center justify-between">
            <span>Target {trial + 1}/{targetCount.current}</span>
            <span>Size: {TARGET_SIZES[sizeIdx]}px</span>
            <span className="flex items-center gap-2">
              <span>Last offset: {offsets.length > 0 ? `${Math.round(offsets[offsets.length - 1] * 10) / 10}px` : '--'}</span>
              <button onClick={() => setPhase('intro')} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[10px] transition-standard cursor-pointer" aria-label="Restart">✕</button>
            </span>
          </div>
          <div ref={containerRef} onClick={handleClick} className="relative w-full h-72 rounded-lg bg-subtle border border-card-border cursor-crosshair overflow-hidden">
            <div className="absolute w-1 h-1 rounded-full bg-accent/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: target.x, top: target.y }} />
            <div className={`absolute rounded-full bg-rose-500/40 border-2 border-rose-400 -translate-x-1/2 -translate-y-1/2`}
              style={{ left: target.x, top: target.y, width: target.size, height: target.size }}
            />
          </div>
        </div>
      </div>
    );
  }

  const avg = offsets.length > 0 ? Math.round(offsets.reduce((a, b) => a + b, 0) / offsets.length * 10) / 10 : 0;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-success">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{avg}px</div>
        <div className="text-xs text-muted font-mono">average offset from center</div>
        <div className="grid grid-cols-3 gap-4 text-xs text-center w-full max-w-xs">
          <div><div className="text-muted font-mono text-[10px]">Best</div><div className="text-foreground font-mono">{Math.round(offsets.reduce((a, b) => Math.min(a, b), offsets[0]) * 10) / 10}px</div></div>
          <div><div className="text-muted font-mono text-[10px]">Worst</div><div className="text-foreground font-mono">{Math.round(offsets.reduce((a, b) => Math.max(a, b), offsets[0]) * 10) / 10}px</div></div>
          <div><div className="text-muted font-mono text-[10px]">Targets</div><div className="text-foreground font-mono">{targetCount.current}</div></div>
        </div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-mouse-accuracy.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="mouse-accuracy" score={Math.round(avg * 10)} scoreLabel={`${avg}px avg`} testName="Mouse Accuracy Test" />
        <button onClick={() => setPhase('intro')} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}

export default withErrorBoundary(MouseAccuracyTest);
