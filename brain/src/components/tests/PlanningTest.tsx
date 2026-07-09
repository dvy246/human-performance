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

const PEGS = 3;
const DISKS = 4;

function makeState(d: number, startRod: number): number[][] {
  const rods: number[][] = [[], [], []];
  for (let i = d; i >= 1; i--) rods[startRod].push(i);
  return rods;
}

function PlanningTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [startRod, setStartRod] = useState(0);
  const [rods, setRods] = useState<number[][]>(makeState(DISKS, 0));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const lastConfig = useRef<GameConfig | null>(null);
  const diskCount = useRef<number>(DISKS);

  useBeforeUnload(phase !== 'intro' && phase !== 'done');

  const targetRod = (startRod + 2) % 3;
  const won = rods[targetRod].length === diskCount.current;

  const handlePegClick = (peg: number) => {
    if (won) return;
    if (selected === null) {
      if (rods[peg].length === 0) return;
      setSelected(peg);
      return;
    }
    if (selected === peg) { setSelected(null); return; }
    const top = rods[selected][rods[selected].length - 1];
    const targetTop = rods[peg].length > 0 ? rods[peg][rods[peg].length - 1] : diskCount.current + 1;
    if (top < targetTop) {
      const newRods = rods.map(r => [...r]);
      newRods[selected].pop();
      newRods[peg].push(top);
      setRods(newRods);
      setMoves(m => m + 1);
      if (newRods[targetRod].length === diskCount.current) finish(newRods);
    }
    setSelected(null);
  };

  const finish = async (finalRods: number[][]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const elapsed = Math.round((performance.now() - startTime) / 1000);
    const optimal = Math.pow(2, diskCount.current) - 1;
    const ratio = moves / optimal;
    const score = Math.max(0, Math.min(100, Math.round(100 - (ratio - 1) * 30 - elapsed / 5)));
    try {
      await dataLayer.saveSession({
        testId: 'planning', category: 'executive', rawScore: score, percentile: lookupPercentile('planning', score),
        metadata: { moves, optimalMoves: optimal, timeSeconds: elapsed },
      });
    } catch (err) {
      console.error('Failed to save Planning session:', err);
    }

    try {
      const card = await generateShareCard('Planning Test', `${moves} moves (optimal: ${optimal})`, lookupPercentile('planning', score));
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }

    setPhase('done');

    redirectToResults({
      testId: 'planning', testName: 'Planning', attempts: [score], unit: 'pts',
      percentile: lookupPercentile('planning', score), personalBest: null, category: 'executive', average: score,
    });
  };

  

  const startGame = (config?: GameConfig) => {
    if (config) lastConfig.current = config;
    const cfg = config || lastConfig.current || {};
    const diff = getDifficultyParams('planning', (cfg.difficulty as string) || 'Medium');
    diskCount.current = (diff.diskCount as number) || DISKS;
    const sr = Math.floor(Math.random() * 3);
    setStartRod(sr);
    setRods(makeState(diskCount.current, sr));
    setSelected(null);
    setMoves(0);
    setStartTime(performance.now());
    submittedRef.current = false;
    setPhase('playing');
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <GameConfigPanel
            testId="planning"
            icon="🧩"
            title="Planning Test"
            description="Tower of Hanoi — move all disks from one peg to another. You can only place a disk on a larger disk."
            onStart={(config: GameConfig) => startGame(config)}
          />
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const optimal = Math.pow(2, diskCount.current) - 1;
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        <button onClick={() => setPhase('intro')} className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
        <div className="rounded-xl border border-card-border bg-card p-6">
          <div className="text-[10px] text-muted font-mono mb-3 flex items-center justify-between">
            <span>Moves: {moves} / Optimal: {optimal}</span>
            <span className={won ? 'text-success' : ''}>{won ? 'Solved!' : `Select a peg, then click destination (target: peg ${targetRod + 1})`}</span>
          </div>
          <div className="flex gap-4 items-end justify-center h-48">
            {rods.map((rod, peg) => (
              <button key={peg} onClick={() => handlePegClick(peg)}
                className={`relative flex flex-col items-center justify-end w-24 h-full rounded-lg border-2 transition-all cursor-pointer ${
                  selected === peg
                    ? 'border-accent bg-accent/10'
                    : rod.length > 0 || selected !== null
                      ? 'border-card-border bg-subtle hover:border-muted'
                      : 'border-card-border bg-subtle'
                }`}
              >
                <div className="absolute bottom-0 w-1 h-full bg-subtle rounded-full" />
                {rod.map((disk) => {
                  const widths = [80, 64, 48, 32, 20];
                  return (
                    <div key={disk} className="relative z-10 h-5 rounded border border-muted/40"
                      style={{ width: widths[diskCount.current - disk] || 16, backgroundColor: `hsl(${disk * 40 + 180}, 50%, 40%)` }}
                    />
                  );
                })}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const optimal = Math.pow(2, diskCount.current) - 1;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-success">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{moves}</div>
        <div className="text-xs text-muted font-mono">moves (optimal: {optimal})</div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-planning.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare testId="planning" score={moves} scoreLabel={`${moves} moves`} testName="Planning Test" />
        <button onClick={() => setPhase('intro')} className="px-6 h-10 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel text-sm transition-standard active:scale-95 cursor-pointer">Try Again</button>
      </div>
    </div>
  );
}

export default withErrorBoundary(PlanningTest);
