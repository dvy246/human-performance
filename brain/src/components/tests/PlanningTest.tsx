import { useState, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

const PEGS = 3;
const DISKS = 4;

function makeState(d: number): number[][] {
  const rods: number[][] = [[], [], []];
  for (let i = d; i >= 1; i--) rods[0].push(i);
  return rods;
}

export default function PlanningTest() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [rods, setRods] = useState<number[][]>(makeState(DISKS));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const won = rods[2].length === DISKS;

  const handlePegClick = (peg: number) => {
    if (won) return;
    if (selected === null) {
      if (rods[peg].length === 0) return;
      setSelected(peg);
      return;
    }
    if (selected === peg) { setSelected(null); return; }
    const top = rods[selected][rods[selected].length - 1];
    const targetTop = rods[peg].length > 0 ? rods[peg][rods[peg].length - 1] : DISKS + 1;
    if (top < targetTop) {
      const newRods = rods.map(r => [...r]);
      newRods[selected].pop();
      newRods[peg].push(top);
      setRods(newRods);
      setMoves(m => m + 1);
      if (newRods[2].length === DISKS) finish(newRods);
    }
    setSelected(null);
  };

  const finish = async (finalRods: number[][]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const elapsed = Math.round((performance.now() - startTime) / 1000);
    const optimal = Math.pow(2, DISKS) - 1;
    const ratio = moves / optimal;
    const score = Math.max(0, Math.min(100, Math.round(100 - (ratio - 1) * 30 - elapsed / 5)));
    try {
      await dataLayer.saveSession({
        testId: 'planning', category: 'executive', rawScore: score, percentile: lookupPercentile(score),
        metadata: { moves, optimalMoves: optimal, timeSeconds: elapsed },
      });
    } catch (err) {
      console.error('Failed to save Planning session:', err);
    }
    const card = await generateShareCard('Planning Test', `${moves} moves (optimal: ${optimal})`, lookupPercentile(score));
    setShareImage(card);
    setPhase('done');
  };

  const lookupPercentile = (s: number): number => {
    const ls = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
    const ps = [0.5, 2, 6, 14, 28, 46, 66, 84, 95, 99, 99.9];
    for (let i = ls.length - 1; i >= 0; i--) if (s >= ls[i]) return ps[i];
    return 0.1;
  };

  const startGame = () => {
    setRods(makeState(DISKS));
    setSelected(null);
    setMoves(0);
    setStartTime(performance.now());
    setPhase('playing');
  };

  if (phase === 'intro') {
    return (
      <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-3xl">🧩</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Planning Test</h2>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto mt-2">Tower of Hanoi — move all {DISKS} disks from left peg to right peg. You can only place a disk on a larger disk. Minimum moves: {Math.pow(2, DISKS) - 1}.</p>
          </div>
          <button onClick={startGame} className="px-8 h-12 rounded-lg bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-standard active:scale-95 cursor-pointer">Start Test</button>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const optimal = Math.pow(2, DISKS) - 1;
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-xl border border-card-border bg-card p-6">
          <div className="text-[10px] text-zinc-500 font-mono mb-3 flex items-center justify-between">
            <span>Moves: {moves} / Optimal: {optimal}</span>
            <span className={won ? 'text-emerald-400' : ''}>{won ? 'Solved!' : 'Select a peg, then click destination'}</span>
          </div>
          <div className="flex gap-4 items-end justify-center h-48">
            {rods.map((rod, peg) => (
              <button key={peg} onClick={() => handlePegClick(peg)}
                className={`relative flex flex-col items-center justify-end w-24 h-full rounded-lg border-2 transition-all cursor-pointer ${
                  selected === peg
                    ? 'border-accent bg-accent/10'
                    : rod.length > 0 || selected !== null
                      ? 'border-card-border bg-subtle hover:border-zinc-500'
                      : 'border-card-border bg-subtle'
                }`}
              >
                <div className="absolute bottom-0 w-1 h-full bg-zinc-700 rounded-full" />
                {rod.map((disk) => {
                  const widths = [80, 64, 48, 32, 20];
                  return (
                    <div key={disk} className="relative z-10 h-5 rounded border border-zinc-500/40"
                      style={{ width: widths[DISKS - disk], backgroundColor: `hsl(${disk * 40 + 180}, 50%, 40%)` }}
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

  const optimal = Math.pow(2, DISKS) - 1;
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="w-full rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="text-4xl text-emerald-400">✓</div>
        <div className="text-4xl font-bold font-mono text-foreground">{moves}</div>
        <div className="text-xs text-zinc-500 font-mono">moves (optimal: {optimal})</div>
        {shareImage && (
          <a href={shareImage} download="cogniarena-planning.png" className="flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-black font-semibold h-10 text-sm active:scale-[0.98] transition-standard">
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
