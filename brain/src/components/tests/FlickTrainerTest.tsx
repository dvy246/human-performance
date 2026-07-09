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

const TOTAL = 15;
const TARGET_RADIUS = 22;

function FlickTrainerTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [results, setResults] = useState<{ rt: number; hit: boolean }[]>([]);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);
  const submittedRef = useRef(false);
  const resultsRef = useRef<{ rt: number; hit: boolean }[]>([]);
  const lastConfig = useRef<GameConfig | null>(null);
  const targetCount = useRef<number>(TOTAL);
  const sizeMultiplier = useRef<number>(1.0);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');

  const spawnTarget = (container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const margin = TARGET_RADIUS + 8;
    const x = margin + Math.random() * (rect.width - margin * 2);
    const y = margin + Math.random() * (rect.height - margin * 2);
    setTarget({ x, y });
    startTimeRef.current = performance.now();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (phase !== 'playing') return;
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const rt = Math.round(performance.now() - startTimeRef.current);
    const dist = Math.sqrt((cx - target.x) ** 2 + (cy - target.y) ** 2);
    const hit = dist <= TARGET_RADIUS;
    resultsRef.current = [...resultsRef.current, { rt, hit }];
    setResults(prev => [...prev, { rt, hit }]);
    const next = trial + 1;
    if (next >= targetCount.current) {
      setPhase('done');
      finalize(resultsRef.current);
      return;
    }
    setTrial(prev => prev + 1);
    spawnTarget(c);
  };

  const finalize = async (r: { rt: number; hit: boolean }[]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const hitPct = r.filter(x => x.hit).length / r.length;
    const avgRt = Math.round(r.reduce((s, x) => s + x.rt, 0) / r.length);
    const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgRt - 200) / 8)));
    const score = Math.round(hitPct * 50 + speedScore * 0.5);
    try {
      await dataLayer.saveSession({
        testId: 'flick-trainer', category: 'precision', rawScore: Math.round(hitPct * 100), percentile: lookupPercentile('flick-trainer', score),
        metadata: { accuracy: Math.round(hitPct * 100), avgReactionMs: avgRt },
      });
    } catch (err) {
      console.error('Failed to save Flick Trainer session:', err);
    }
    const card = await generateShareCard('Flick Trainer', `${Math.round(hitPct * 100)}% accuracy`, lookupPercentile('flick-trainer', score)).catch(() => '');
    setShareImage(card);

    redirectToResults({
      testId: 'flick-trainer', testName: 'Flick Trainer', attempts: r.map(x => x.rt), unit: 'ms',
      percentile: lookupPercentile('flick-trainer', score), personalBest: null, category: 'precision', average: avgRt,
    });
  };

  

  const startGame = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const diff = getDifficultyParams('flick-trainer', (cfg.difficulty as string) || 'Medium');
    sizeMultiplier.current = (diff.sizeMultiplier as number) || 1.0;
    const attemptCount = typeof cfg.trials === 'number' ? cfg.trials : typeof cfg.targets === 'number' ? cfg.targets : typeof cfg.attempts === 'number' ? cfg.attempts : typeof cfg.questions === 'number' ? cfg.questions : typeof cfg.rounds === 'number' ? cfg.rounds : TOTAL;
    targetCount.current = attemptCount;
    setPhase('playing');
    setTrial(0);
    setResults([]);
    resultsRef.current = [];
    submittedRef.current = false;
    setTimeout(() => { if (containerRef.current) spawnTarget(containerRef.current); }, 300);
  };

  const renderCrosshair = () => (
    <svg width={TARGET_RADIUS * 2} height={TARGET_RADIUS * 2} viewBox={`0 0 ${TARGET_RADIUS * 2} ${TARGET_RADIUS * 2}`} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: target.x, top: target.y }}>
      <circle cx={TARGET_RADIUS} cy={TARGET_RADIUS} r={TARGET_RADIUS - 2} fill="#ef4444" fillOpacity={0.35} stroke="#ef4444" strokeWidth={2} />
      <line x1={TARGET_RADIUS - 6} y1={TARGET_RADIUS} x2={TARGET_RADIUS + 6} y2={TARGET_RADIUS} stroke="#ef4444" strokeWidth={1.5} />
      <line x1={TARGET_RADIUS} y1={TARGET_RADIUS - 6} x2={TARGET_RADIUS} y2={TARGET_RADIUS + 6} stroke="#ef4444" strokeWidth={1.5} />
    </svg>
  );

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="flick-trainer"
            icon="⚡🎯"
            title="Flick Trainer"
            description={`Flick your mouse to the target and click as fast and accurately as possible.`}
            onStart={(config: GameConfig) => startGame(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-[10px] text-muted font-mono mb-2 flex items-center justify-between">
            <span>Target {trial + 1}/{targetCount.current}</span>
            <span className="flex items-center gap-2">
              <span>Hits: {results.filter(r => r.hit).length}</span>
              <button onClick={() => setPhase('intro')} className="w-5 h-5 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[10px] transition-standard cursor-pointer" aria-label="Restart">✕</button>
            </span>
          </div>
          <div ref={containerRef} onClick={handleClick} className="relative w-full h-72 rounded-lg bg-subtle border border-card-border cursor-crosshair overflow-hidden">
            <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-subtle -translate-x-1/2 -translate-y-1/2 border border-card-border" />
            {renderCrosshair()}
          </div>
        </div>
      </div>
    );
  }

  const hitPct = results.filter(r => r.hit).length / targetCount.current;
  const avgRt = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.rt, 0) / results.length) : 0;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-success">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{Math.round(hitPct * 100)}%</div>
        <div className="text-xs text-muted font-mono">accuracy · {avgRt}ms avg flick time</div>
        <div className="grid grid-cols-3 gap-4 text-xs text-center w-full max-w-xs">
          <div><div className="text-muted font-mono text-[10px]">Hits</div><div className="text-foreground font-mono">{results.filter(r => r.hit).length}/{targetCount.current}</div></div>
          <div><div className="text-muted font-mono text-[10px]">Fastest</div><div className="text-foreground font-mono">{results.length > 0 ? results.reduce((min, r) => Math.min(min, r.rt), results[0].rt) : 0}ms</div></div>
          <div><div className="text-muted font-mono text-[10px]">Avg RT</div><div className="text-foreground font-mono">{avgRt}ms</div></div>
        </div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-flick-trainer.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="flick-trainer" score={Math.round(hitPct * 100)} scoreLabel={`${Math.round(hitPct * 100)}% acc`} testName="Flick Trainer" />
        <button onClick={() => setPhase('intro')} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}

export default withErrorBoundary(FlickTrainerTest);
