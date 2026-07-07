import React, { useState } from 'react';

type Domain = 'numerical' | 'verbal' | 'spatial' | 'logical';

interface Question {
  id: number;
  domain: Domain;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string | React.ReactNode;
  options: (string | React.ReactNode)[];
  correctIndex: number;
  explanation: string;
}

const CELL = 28;
const GAP = 3;

function GridShape({ filled, label }: { filled: [number, number][]; label?: string }) {
  const cols = Math.max(...filled.map(([x]) => x)) + 1;
  const rows = Math.max(...filled.map(([, y]) => y)) + 1;
  const w = cols * (CELL + GAP) - GAP;
  const h = rows * (CELL + GAP) - GAP;
  return (
    <svg width={w} height={h + (label ? 20 : 0)} className="inline-block">
      {filled.map(([x, y]) => (
        <rect x={x * (CELL + GAP)} y={y * (CELL + GAP)} width={CELL} height={CELL} rx={3} fill="currentColor" className="text-foreground" />
      ))}
      {label && <text x={w / 2} y={h + 16} textAnchor="middle" className="text-[11px] fill-muted font-mono">{label}</text>}
    </svg>
  );
}

function GridOption({ filled, label }: { filled: [number, number][]; label: string }) {
  const cols = Math.max(...filled.map(([x]) => x)) + 1;
  const rows = Math.max(...filled.map(([, y]) => y)) + 1;
  const w = cols * (CELL + GAP) - GAP;
  const h = rows * (CELL + GAP) - GAP;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={w} height={h}>
        {Array.from({ length: cols * rows }).map((_, i) => {
          const x = (i % cols) * (CELL + GAP);
          const y = Math.floor(i / cols) * (CELL + GAP);
          const filledIdx = filled.findIndex(([fx, fy]) => fx === i % cols && fy === Math.floor(i / cols));
          return (
            <rect
              key={i}
              x={x} y={y} width={CELL} height={CELL} rx={3}
              fill={filledIdx >= 0 ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              className={filledIdx >= 0 ? 'text-foreground' : 'text-muted'}
            />
          );
        })}
      </svg>
      <span className="text-xs font-mono text-muted">{label}</span>
    </div>
  );
}

function MatrixOption({ grid, label }: { grid: number[][]; label: string }) {
  const rows = grid.length;
  const cols = grid[0].length;
  const w = cols * (CELL + GAP) - GAP;
  const h = rows * (CELL + GAP) - GAP;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={w} height={h}>
        {grid.flatMap((row, y) =>
          row.map((val, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * (CELL + GAP)} y={y * (CELL + GAP)} width={CELL} height={CELL} rx={3}
              fill={val ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              className={val ? 'text-foreground' : 'text-muted'}
            />
          ))
        )}
      </svg>
      <span className="text-xs font-mono text-muted">{label}</span>
    </div>
  );
}

const questions: Question[] = [
  // NUMERICAL
  {
    id: 1, domain: 'numerical', difficulty: 'easy',
    prompt: 'What number comes next in the sequence?\n2, 4, 6, 8, ?',
    options: ['9', '10', '11', '12'],
    correctIndex: 1,
    explanation: 'The sequence increases by 2 each time. 8 + 2 = 10.',
  },
  {
    id: 2, domain: 'numerical', difficulty: 'easy',
    prompt: 'What number comes next?\n10, 7, 4, 1, ?',
    options: ['-1', '-2', '0', '2'],
    correctIndex: 1,
    explanation: 'The sequence decreases by 3 each time. 1 - 3 = -2.',
  },
  {
    id: 3, domain: 'numerical', difficulty: 'medium',
    prompt: 'What number comes next?\n3, 9, 27, 81, ?',
    options: ['162', '189', '216', '243'],
    correctIndex: 3,
    explanation: 'Each term is multiplied by 3. 81 × 3 = 243.',
  },
  {
    id: 4, domain: 'numerical', difficulty: 'medium',
    prompt: 'What number comes next?\n1, 1, 2, 3, 5, 8, ?',
    options: ['10', '11', '12', '13'],
    correctIndex: 3,
    explanation: 'This is the Fibonacci sequence. Each term is the sum of the previous two. 5 + 8 = 13.',
  },
  {
    id: 5, domain: 'numerical', difficulty: 'hard',
    prompt: 'What number comes next?\n1, 4, 27, 256, ?',
    options: ['625', '1024', '3125', '4096'],
    correctIndex: 2,
    explanation: 'The pattern is n^n: 1¹=1, 2²=4, 3³=27, 4⁴=256, 5⁵=3125.',
  },

  // VERBAL
  {
    id: 6, domain: 'verbal', difficulty: 'easy',
    prompt: 'Dog is to bark as cat is to:',
    options: ['Purr', 'Meow', 'Hiss', 'Growl'],
    correctIndex: 1,
    explanation: 'The sound a dog makes is a bark; the sound a cat makes is a meow.',
  },
  {
    id: 7, domain: 'verbal', difficulty: 'medium',
    prompt: 'Tree is to forest as star is to:',
    options: ['Sky', 'Nebula', 'Galaxy', 'Constellation'],
    correctIndex: 2,
    explanation: 'A collection of trees forms a forest. A collection of stars forms a galaxy.',
  },
  {
    id: 8, domain: 'verbal', difficulty: 'medium',
    prompt: 'Optimistic is to pessimistic as generous is to:',
    options: ['Greedy', 'Stingy', 'Selfish', 'Kind'],
    correctIndex: 1,
    explanation: 'Optimistic and pessimistic are opposites. The opposite of generous is stingy.',
  },
  {
    id: 9, domain: 'verbal', difficulty: 'hard',
    prompt: 'Oculist is to eyes as podiatrist is to:',
    options: ['Hands', 'Feet', 'Spine', 'Skin'],
    correctIndex: 1,
    explanation: 'An oculist specializes in eye health. A podiatrist specializes in foot health.',
  },
  {
    id: 10, domain: 'verbal', difficulty: 'hard',
    prompt: 'Ephemeral is to permanent as nascent is to:',
    options: ['Elderly', 'Developed', 'Nascent', 'Fully formed'],
    correctIndex: 1,
    explanation: 'Ephemeral (short-lived) is opposite to permanent. Nascent (newly emerging) is opposite to developed.',
  },

  // SPATIAL
  {
    id: 11, domain: 'spatial', difficulty: 'easy',
    prompt: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Which option shows the L-shape rotated 90° clockwise?</span>
        <GridShape filled={[[0,0],[1,0],[2,0],[0,1]]} label="Original" />
      </div>
    ),
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Rotating the L-shape 90° clockwise places the two-block vertical column on the right.',
  },
  {
    id: 12, domain: 'spatial', difficulty: 'medium',
    prompt: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Which piece completes the pattern?</span>
        <div className="grid grid-cols-2 gap-1">
          <GridShape filled={[[0,0],[1,0],[0,1]]} label="" />
          <GridShape filled={[[0,0],[1,0],[1,1]]} label="" />
          <GridShape filled={[[0,0],[0,1],[1,1]]} label="" />
          <span className="w-10 h-10 flex items-center justify-center text-lg text-secondary">?</span>
        </div>
      </div>
    ),
    options: [
      <GridOption filled={[[0,0],[1,0],[2,0]]} label="A" />,
      <GridOption filled={[[0,0],[0,1],[1,1]]} label="B" />,
      <GridOption filled={[[0,0],[1,0],[1,1]]} label="C" />,
      <GridOption filled={[[0,0],[1,0],[0,1]]} label="D" />,
    ],
    correctIndex: 2,
    explanation: 'The pattern rotates the L-shape 90° clockwise in each cell. The missing cell needs a shape with the long arm pointing left and down.',
  },
  {
    id: 13, domain: 'spatial', difficulty: 'medium',
    prompt: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Which shape is the mirror image of this one?</span>
        <GridShape filled={[[0,0],[1,0],[2,0],[2,1]]} label="Original" />
      </div>
    ),
    options: [
      <GridOption filled={[[0,0],[0,1],[1,1],[2,1]]} label="A" />,
      <GridOption filled={[[0,0],[0,1],[1,0],[2,0]]} label="B" />,
      <GridOption filled={[[0,0],[1,0],[1,1],[2,1]]} label="C" />,
      <GridOption filled={[[0,1],[1,1],[2,0],[2,1]]} label="D" />,
    ],
    correctIndex: 1,
    explanation: 'A mirror image flips horizontally. The protruding cell at the right end of the top row flips to the left end of the top row.',
  },
  {
    id: 14, domain: 'spatial', difficulty: 'hard',
    prompt: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Which unfolded net folds into a cube?</span>
        <div className="grid grid-cols-3 gap-[2px] bg-card-border p-[2px] rounded">
          <div /><div className="w-8 h-8 bg-foreground/80 rounded" /><div />
          <div /><div className="w-8 h-8 bg-foreground/80 rounded" /><div />
          <div className="w-8 h-8 bg-foreground/80 rounded" /><div className="w-8 h-8 bg-foreground/80 rounded" /><div className="w-8 h-8 bg-foreground/80 rounded" />
        </div>
      </div>
    ),
    options: [
      <MatrixOption grid={[[1,0,0],[1,1,1],[1,0,0]]} label="A" />,
      <MatrixOption grid={[[0,1,0],[1,1,1],[0,1,0]]} label="B" />,
      <MatrixOption grid={[[1,1],[1,1],[1,1]]} label="C" />,
      <MatrixOption grid={[[0,1,0],[0,1,0],[1,1,1]]} label="D" />,
    ],
    correctIndex: 1,
    explanation: 'The cross-shaped net (a center row of 3 squares with one above and one below the middle) is the classic net that folds into a cube.',
  },
  {
    id: 15, domain: 'spatial', difficulty: 'hard',
    prompt: (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Which shape completes the 2×2 pattern?</span>
        <div className="grid grid-cols-2 gap-2">
          <MatrixOption grid={[[1,1,0],[1,0,0],[0,0,1]]} label="" />
          <MatrixOption grid={[[0,1,1],[1,0,0],[1,0,0]]} label="" />
          <MatrixOption grid={[[1,0,0],[0,1,0],[0,0,1]]} label="" />
          <span className="flex items-center justify-center text-2xl text-secondary">?</span>
        </div>
      </div>
    ),
    options: [
      <MatrixOption grid={[[1,1],[0,1]]} label="A" />,
      <MatrixOption grid={[[0,1,0],[1,0,1],[0,1,0]]} label="B" />,
      <MatrixOption grid={[[0,0,1],[0,1,0],[1,0,0]]} label="C" />,
      <MatrixOption grid={[[1,0,0],[0,0,0],[0,0,1]]} label="D" />,
    ],
    correctIndex: 2,
    explanation: 'Each cell in the 2×2 grid contains a diagonal line pattern. The bottom-right cell should complete the diagonal from top-left to bottom-right.',
  },

  // LOGICAL
  {
    id: 16, domain: 'logical', difficulty: 'easy',
    prompt: 'All mammals breathe air.\nWhales are mammals.\nTherefore:',
    options: [
      'Whales live in water',
      'Whales breathe air',
      'All air-breathers are mammals',
      'Whales are fish',
    ],
    correctIndex: 1,
    explanation: 'If all mammals breathe air and whales are mammals, then whales must breathe air (deductive syllogism).',
  },
  {
    id: 17, domain: 'logical', difficulty: 'medium',
    prompt: 'If it is raining, then the ground is wet.\nThe ground is wet.\nTherefore:',
    options: [
      'It must be raining',
      'It may have rained, or the ground could be wet for another reason',
      'It is not raining',
      'Rain causes wet ground only in summer',
    ],
    correctIndex: 1,
    explanation: 'Affirming the consequent is a logical fallacy. Wet ground could result from sprinklers, a spill, or rain — we cannot conclude it rained.',
  },
  {
    id: 18, domain: 'logical', difficulty: 'medium',
    prompt: 'Five people are standing in line. Alex is ahead of Blake. Blake is ahead of Casey. Dana is behind Casey but ahead of Evan. Who is last?',
    options: ['Alex', 'Casey', 'Dana', 'Evan'],
    correctIndex: 3,
    explanation: 'The order is: Alex, Blake, Casey, Dana, Evan. Evan is last in line.',
  },
  {
    id: 19, domain: 'logical', difficulty: 'hard',
    prompt: 'On an island, knights always tell the truth and knaves always lie.\nYou meet two people: A says "B is a knight."\nB says "We are different types."\nWhat are A and B?',
    options: [
      'A is a knight, B is a knight',
      'A is a knight, B is a knave',
      'A is a knave, B is a knight',
      'A is a knave, B is a knave',
    ],
    correctIndex: 3,
    explanation: 'If A is a knight, B must be a knight (truth). But then B saying "we are different" is a lie — contradiction. So A is a knave, meaning "B is a knight" is false, so B is also a knave. B says "we are different" — false, since they are the same. Consistent. Both are knaves.',
  },
  {
    id: 20, domain: 'logical', difficulty: 'hard',
    prompt: 'All squares are rectangles.\nSome rectangles are not parallelograms.\nNo rhombuses are rectangles.\nWhich statement must be true?',
    options: [
      'Some squares are not rectangles',
      'No squares are rhombuses',
      'All rectangles are squares',
      'Some parallelograms are squares',
    ],
    correctIndex: 1,
    explanation: 'If all squares are rectangles and no rhombuses are rectangles, then squares (being rectangles) cannot be rhombuses.',
  },
];

const domainLabels: Record<Domain, string> = {
  numerical: 'Numerical Reasoning',
  verbal: 'Verbal Reasoning',
  spatial: 'Spatial Reasoning',
  logical: 'Logical Reasoning',
};

const domainColors: Record<Domain, string> = {
  numerical: 'text-blue-500',
  verbal: 'text-emerald-500',
  spatial: 'text-purple-500',
  logical: 'text-amber-500',
};

function computeIQ(rawScore: number): { iq: number; percentile: number } {
  const iq = Math.round(70 + (rawScore / 20) * 75);
  const z = (iq - 100) / 15;
  const p = 0.5 * (1 + erf(z / Math.SQRT2));
  const percentile = Math.round(p * 1000) / 10;
  return { iq: Math.min(145, Math.max(70, iq)), percentile };
}

function erf(x: number): number {
  const a1 = 0.254829592; const a2 = -0.284496736; const a3 = 1.421413741;
  const a4 = -1.453152027; const a5 = 1.061405429; const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  return sign * (1 - (a1 * t + a2 * t * t + a3 * t * t * t + a4 * t * t * t * t + a5 * t * t * t * t * t) * Math.exp(-x * x));
}

const iqLabels = [
  { min: 130, label: 'Very Superior', color: 'text-emerald-500' },
  { min: 120, label: 'Superior', color: 'text-blue-500' },
  { min: 110, label: 'High Average', color: 'text-amber-500' },
  { min: 90, label: 'Average', color: 'text-muted' },
  { min: 80, label: 'Low Average', color: 'text-orange-500' },
  { min: 0, label: 'Below Average', color: 'text-red-500' },
];

function getIQLabel(iq: number) {
  return iqLabels.find(l => iq >= l.min) || iqLabels[iqLabels.length - 1];
}

type Phase = 'start' | 'playing' | 'result';

export default function IQTest() {
  const [phase, setPhase] = useState<Phase>('start');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);

  function handleSelect(index: number) {
    if (showExplanation) return;
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
    setShowExplanation(true);
  }

  function handleNext() {
    setShowExplanation(false);
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setPhase('result');
    }
  }

  function handleRestart() {
    setPhase('start');
    setCurrent(0);
    setAnswers(Array(questions.length).fill(null));
    setShowExplanation(false);
  }

  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center max-w-lg mx-auto">
        <span className="text-5xl">🧠</span>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Free Cognitive Reasoning Quiz</h2>
        <div className="text-sm text-muted leading-relaxed flex flex-col gap-2">
          <p>20 questions across <strong className="text-foreground">numerical, verbal, spatial, and logical</strong> reasoning domains.</p>
          <p>No time limit. No sign-up. All scoring happens in your browser.</p>
          <p className="text-xs text-secondary">Based on formats from the International Cognitive Ability Resource (ICAR).</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center text-xs">
          {(['numerical', 'verbal', 'spatial', 'logical'] as Domain[]).map(d => (
            <span className={`px-2.5 py-1 rounded-full border border-card-border bg-subtle ${domainColors[d]} font-medium`}>
              {d.charAt(0).toUpperCase() + d.slice(1)} &middot; 5
            </span>
          ))}
        </div>
        <button onClick={() => setPhase('playing')} className="px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-standard">
          Start Test
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    const rawScore = answers.filter(a => a !== null).reduce((sum, a, i) => sum + (a === questions[i].correctIndex ? 1 : 0), 0);
    const { iq, percentile } = computeIQ(rawScore);
    const label = getIQLabel(iq);
    const domainScores = (['numerical', 'verbal', 'spatial', 'logical'] as Domain[]).map(d => {
      const qs = questions.filter(q => q.domain === d);
      const correct = qs.filter(q => answers[q.id - 1] === q.correctIndex).length;
      return { domain: d, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) };
    });

    return (
      <div className="flex flex-col gap-8 py-8 max-w-lg mx-auto w-full">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-5xl">📊</span>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Results</h2>
        </div>

        <div className="flex flex-col items-center gap-2 p-6 rounded-xl border border-card-border bg-subtle">
          <span className={`text-5xl font-extrabold tracking-tight ${label.color}`}>{iq}</span>
          <span className={`text-sm font-semibold ${label.color}`}>{label.label}</span>
          <span className="text-xs text-muted">Top {percentile < 1 ? '<1' : percentile}th percentile</span>
          <span className="text-xs text-muted mt-1">{rawScore} / {questions.length} correct</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Domain Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {domainScores.map(({ domain, correct, total, pct }) => (
              <div key={domain} className="p-3 rounded-lg border border-card-border bg-subtle flex flex-col gap-1.5">
                <span className={`text-xs font-semibold ${domainColors[domain]}`}>{domainLabels[domain].split(' ')[0]}</span>
                <div className="w-full h-2 rounded-full bg-card-border overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${domainColors[domain].replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted">{correct}/{total} ({pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-xl border border-card-border bg-subtle text-xs text-muted leading-relaxed">
          <p><strong className="text-foreground">Note:</strong> This is an informal cognitive reasoning quiz for entertainment and self-educational purposes only. It is not a clinically validated IQ assessment. Scores are estimates based on a 20-question sample and should not be treated as a professionally administered cognitive evaluation. For a comprehensive assessment, consult a licensed psychologist.</p>
        </div>

        <div className="flex justify-center">
          <button onClick={handleRestart} className="px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-standard">
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers[current] !== null;
  const isCorrect = answered && answers[current] === q.correctIndex;
  const isOption = (index: number) => typeof q.options[index] === 'string';

  return (
    <div className="flex flex-col gap-6 py-6 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-mono">Question {current + 1} / {questions.length}</span>
        <span className={`font-medium ${domainColors[q.domain]}`}>{domainLabels[q.domain]}</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-card-border overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="flex flex-col gap-4 p-5 rounded-xl border border-card-border bg-subtle">
        <div className="text-sm text-foreground font-medium leading-relaxed whitespace-pre-line">
          {q.prompt}
        </div>

        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const selected = answers[current] === i;
            const showCorrect = answered && i === q.correctIndex;
            const borderClass = showCorrect
              ? 'border-[var(--success-border)] bg-[var(--success-bg)]'
              : selected && !isCorrect
              ? 'border-[var(--error-border)] bg-[var(--error-bg)]'
              : 'border-card-border hover:border-accent/30 hover:bg-accent/5';
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={showExplanation}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-standard ${borderClass} ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="w-6 h-6 rounded-full border border-card-border flex items-center justify-center text-xs font-mono text-muted shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-foreground">{opt}</span>
                {showCorrect && <span className="ml-auto text-success text-xs font-semibold">&check;</span>}
                {selected && !isCorrect && <span className="ml-auto text-error text-xs font-semibold">&times;</span>}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className={`p-3 rounded-lg text-xs leading-relaxed ${isCorrect ? 'bg-[var(--success-bg)] border border-[var(--success-border)] text-secondary' : 'bg-[var(--error-bg)] border border-[var(--error-border)] text-secondary'}`}>
            <span className="font-semibold">{isCorrect ? 'Correct' : 'Incorrect'}. </span>
            {q.explanation}
          </div>
        )}
      </div>

      {showExplanation && (
        <div className="flex justify-center">
          <button onClick={handleNext} className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-standard">
            {current < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
