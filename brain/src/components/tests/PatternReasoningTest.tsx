import React, { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

type GameMode = 'pattern' | 'matrix' | 'sequence' | 'analogy';
type GameState = 'idle' | 'running' | 'result';

interface GeneratedQuestion {
  instructions: string;
  type: GameMode;
  sequence?: (React.ReactNode | string)[];
  matrix?: {
    topLeft: React.ReactNode;
    topRight: React.ReactNode;
    bottomLeft: React.ReactNode;
    bottomRight: React.ReactNode;
  };
  analogy?: {
    a: React.ReactNode;
    b: React.ReactNode;
    c: React.ReactNode;
  };
  options: React.ReactNode[];
  correctIdx: number;
}

// ─── SVG Shape Palette ───────────────────────────────────────────────────────
const SVG_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316', '#6b7280', '#f1f5f9'];
const COLOR_NAMES = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange', 'Gray', 'White'];

function SvgCircle({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" fill={color} />
    </svg>
  );
}

function SvgSquare({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="4" y="4" width="32" height="32" rx="3" fill={color} />
    </svg>
  );
}

function SvgTriangle({ color, rotation = 0, size = 36 }: { color: string; rotation?: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: `rotate(${rotation}deg)` }}>
      <polygon points="20,4 36,36 4,36" fill={color} />
    </svg>
  );
}

function SvgDiamond({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <polygon points="20,2 38,20 20,38 2,20" fill={color} />
    </svg>
  );
}

function SvgStar({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <polygon points="20,2 25,15 38,15 27,24 31,37 20,29 9,37 13,24 2,15 15,15" fill={color} />
    </svg>
  );
}

function SvgCross({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="14" y="4" width="12" height="32" rx="2" fill={color} />
      <rect x="4" y="14" width="32" height="12" rx="2" fill={color} />
    </svg>
  );
}

const SHAPES = [SvgCircle, SvgSquare, SvgTriangle, SvgDiamond, SvgStar, SvgCross];
const SHAPE_NAMES = ['Circle', 'Square', 'Triangle', 'Diamond', 'Star', 'Cross'];

function SvgQuestionMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="2" y="2" width="36" height="36" rx="6" fill="none" stroke="var(--border-primary)" strokeWidth="2" strokeDasharray="4,3" />
      <text x="20" y="26" textAnchor="middle" fill="var(--text-muted)" fontSize="18" fontWeight="bold" fontFamily="monospace">?</text>
    </svg>
  );
}

// ─── Question Generators ─────────────────────────────────────────────────────

const MODES: GameMode[] = ['pattern', 'matrix', 'sequence', 'analogy'];
const MODE_TITLES: Record<GameMode, string> = {
  pattern: 'Pattern Recognition',
  matrix: 'Matrix Reasoning',
  sequence: 'Sequence Logic',
  analogy: 'Shape Analogies'
};

const MODE_DESCS: Record<GameMode, string> = {
  pattern: 'Complete the linear sequence of colored shapes.',
  matrix: 'Solve the 2×2 visual grid matrix by identifying the rule.',
  sequence: 'Detect the logical progression of shape rotations.',
  analogy: 'Apply the shape transformation to complete the analogy.'
};

interface GeneratedQuestion {
  instructions: string;
  type: GameMode;
  sequence?: (React.ReactNode | string)[];
  matrix?: {
    topLeft: React.ReactNode;
    topRight: React.ReactNode;
    bottomLeft: React.ReactNode;
    bottomRight: React.ReactNode;
  };
  analogy?: {
    a: React.ReactNode;
    b: React.ReactNode;
    c: React.ReactNode;
  };
  options: React.ReactNode[];
  correctIdx: number;
}

function generatePatternQuestion(): GeneratedQuestion {
  const colorIdxs = [0, 1, 2, 3, 4, 5];
  const c1 = Math.floor(Math.random() * colorIdxs.length);
  let c2 = Math.floor(Math.random() * colorIdxs.length);
  while (c2 === c1) c2 = Math.floor(Math.random() * colorIdxs.length);
  let c3 = Math.floor(Math.random() * colorIdxs.length);
  while (c3 === c1 || c3 === c2) c3 = Math.floor(Math.random() * colorIdxs.length);

  const patterns = [
    { seq: [c1, c2, c1, c2, c1], answer: c2, rule: 'A-B-A-B-A-B' },
    { seq: [c1, c1, c2, c1, c1], answer: c2, rule: 'A-A-B-A-A-B' },
    { seq: [c1, c2, c3, c1, c2], answer: c3, rule: 'A-B-C-A-B-C' },
    { seq: [c1, c2, c2, c1, c2], answer: c2, rule: 'A-B-B-A-B-B' },
  ];

  const p = patterns[Math.floor(Math.random() * patterns.length)];
  const sequence: React.ReactNode[] = p.seq.map((ci, i) => <SvgCircle key={i} color={SVG_COLORS[ci]} size={40} />);
  sequence.push(<SvgQuestionMark key="q" size={40} />);

  const correctColor = SVG_COLORS[p.answer];
  const options: React.ReactNode[] = [<SvgCircle key="c0" color={correctColor} size={32} />];
  const usedColors = new Set([p.answer]);
  while (options.length < 4) {
    const rc = Math.floor(Math.random() * SVG_COLORS.length);
    if (!usedColors.has(rc)) {
      usedColors.add(rc);
      options.push(<SvgCircle key={options.length} color={SVG_COLORS[rc]} size={32} />);
    }
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    type: 'pattern',
    instructions: 'Complete the color sequence:',
    sequence,
    options,
    correctIdx: options.findIndex(o => {
      const el = o as React.ReactElement<{ color: string }>;
      return el.props?.color === correctColor;
    })
  };
}

function generateMatrixQuestion(): GeneratedQuestion {
  const shapeIdx = Math.floor(Math.random() * SHAPES.length);
  let otherShapeIdx = Math.floor(Math.random() * SHAPES.length);
  while (otherShapeIdx === shapeIdx) otherShapeIdx = Math.floor(Math.random() * SHAPES.length);

  const colorIdx = Math.floor(Math.random() * SVG_COLORS.length);
  let otherColorIdx = Math.floor(Math.random() * SVG_COLORS.length);
  while (otherColorIdx === colorIdx) otherColorIdx = Math.floor(Math.random() * SVG_COLORS.length);

  const Shape1 = SHAPES[shapeIdx];
  const Shape2 = SHAPES[otherShapeIdx];

  // Rule: Row 1 = Shape1 in color1, then Shape1 in color2. Row 2 = Shape2 in color1, then ?
  // Answer: Shape2 in color2
  const topLeft = <Shape1 color={SVG_COLORS[colorIdx]} size={44} />;
  const topRight = <Shape1 color={SVG_COLORS[otherColorIdx]} size={44} />;
  const bottomLeft = <Shape2 color={SVG_COLORS[colorIdx]} size={44} />;
  const bottomRight = <SvgQuestionMark size={44} />;

  const correctOption = <Shape2 color={SVG_COLORS[otherColorIdx]} size={36} />;
  const options: React.ReactNode[] = [correctOption];
  const distractors = [
    <Shape2 color={SVG_COLORS[colorIdx]} size={36} />,
    <Shape1 color={SVG_COLORS[otherColorIdx]} size={36} />,
    <Shape2 color={SVG_COLORS[(otherColorIdx + 1) % SVG_COLORS.length]} size={36} />,
  ];
  for (const d of distractors) {
    if (options.length < 4) options.push(d);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    type: 'matrix',
    instructions: 'Identify the rule and complete the 2×2 grid:',
    matrix: { topLeft, topRight, bottomLeft, bottomRight },
    options,
    correctIdx: 0 // We'll find it after shuffle
  };
}

function generateSequenceQuestion(): GeneratedQuestion {
  const shapeIdx = Math.floor(Math.random() * SHAPES.length);
  const Shape = SHAPES[shapeIdx];
  const colorIdx = Math.floor(Math.random() * SVG_COLORS.length);

  // Rotation sequence: 0°, 90°, 180°, 270°, ?
  const step = Math.random() < 0.5 ? 90 : 45;
  const startAngle = Math.floor(Math.random() * 360);
  const rotations = [0, 1, 2, 3].map(i => startAngle + step * i);
  const answerRotation = startAngle + step * 4;

  const sequence: React.ReactNode[] = rotations.map((r, i) => (
    <SvgTriangle key={i} color={SVG_COLORS[colorIdx]} rotation={r} size={40} />
  ));
  sequence.push(<SvgQuestionMark key="q" size={40} />);

  const correctOption = <SvgTriangle color={SVG_COLORS[colorIdx]} rotation={answerRotation} size={32} />;
  const options: React.ReactNode[] = [correctOption];
  const otherAngles = [answerRotation + 45, answerRotation + 90, answerRotation + 135];
  for (const a of otherAngles) {
    options.push(<SvgTriangle color={SVG_COLORS[colorIdx]} rotation={a} size={32} />);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => {
    const el = o as React.ReactElement<{ rotation: number }>;
    return el.props?.rotation === answerRotation;
  });

  return {
    type: 'sequence',
    instructions: `Determine the rotation progression (${step}° steps):`,
    sequence,
    options,
    correctIdx
  };
}

function generateAnalogyQuestion(): GeneratedQuestion {
  const transformations = [
    { name: 'fill', a: <SvgCircle color="none" size={44} />, b: <SvgCircle color={SVG_COLORS[0]} size={44} />, c: <SvgSquare color="none" size={44} />, correct: <SvgSquare color={SVG_COLORS[0]} size={44} /> },
    { name: 'color', a: <SvgCircle color={SVG_COLORS[0]} size={44} />, b: <SvgCircle color={SVG_COLORS[1]} size={44} />, c: <SvgDiamond color={SVG_COLORS[0]} size={44} />, correct: <SvgDiamond color={SVG_COLORS[1]} size={44} /> },
    { name: 'shape', a: <SvgCircle color={SVG_COLORS[2]} size={44} />, b: <SvgSquare color={SVG_COLORS[2]} size={44} />, c: <SvgTriangle color={SVG_COLORS[3]} size={44} />, correct: <SvgDiamond color={SVG_COLORS[3]} size={44} /> },
    { name: 'size', a: <SvgStar color={SVG_COLORS[4]} size={28} />, b: <SvgStar color={SVG_COLORS[4]} size={44} />, c: <SvgCross color={SVG_COLORS[5]} size={28} />, correct: <SvgCross color={SVG_COLORS[5]} size={44} /> },
  ];

  const t = transformations[Math.floor(Math.random() * transformations.length)];
  const options: React.ReactNode[] = [t.correct];
  const distractors = [
    <SvgCircle color={SVG_COLORS[1]} size={44} />,
    <SvgSquare color={SVG_COLORS[3]} size={44} />,
    <SvgDiamond color={SVG_COLORS[5]} size={44} />,
  ];
  for (const d of distractors) {
    if (options.length < 4) options.push(d);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    type: 'analogy',
    instructions: 'Complete the shape transformation analogy:',
    analogy: { a: t.a, b: t.b, c: t.c },
    options,
    correctIdx: 0
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PatternReasoningTest() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentMode, setCurrentMode] = useState<GameMode>('pattern');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const questionStartTime = useRef<number>(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('pattern-reasoning', 'higher').then(pb => {
      if (mounted) setPersonalBest(pb);
    }).catch(console.error);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fmt = params.get('format');
      if (fmt && ['pattern', 'matrix', 'sequence', 'analogy'].includes(fmt)) {
        setTimeout(() => {
          if (mounted) startTest(fmt as GameMode);
        }, 100);
      }
    }

    return () => { mounted = false; };
  }, []);

  const startTest = (mode: GameMode) => {
    setCurrentMode(mode);
    const questionList: GeneratedQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      if (mode === 'pattern') questionList.push(generatePatternQuestion());
      else if (mode === 'matrix') questionList.push(generateMatrixQuestion());
      else if (mode === 'sequence') questionList.push(generateSequenceQuestion());
      else questionList.push(generateAnalogyQuestion());
    }

    setQuestions(questionList);
    setCurrentIdx(0);
    setScore(0);
    setAnswers([]);
    setLatencies([]);
    setLastCorrect(null);
    setShareImage(null);
    setGameState('running');
    questionStartTime.current = performance.now();
  };

  const handleOptionClick = (idx: number) => {
    const elapsed = Math.round(performance.now() - questionStartTime.current);
    setLatencies(prev => [...prev, elapsed]);

    const isCorrect = idx === questions[currentIdx]!.correctIdx;
    setAnswers(prev => [...prev, isCorrect]);

    if (isCorrect) {
      const pts = Math.max(200, Math.round(1000 - elapsed / 10));
      setScore(prev => prev + pts);
    }
    setLastCorrect(isCorrect);

    setTimeout(() => {
      setLastCorrect(null);
      if (currentIdx + 1 < 5) {
        setCurrentIdx(prev => prev + 1);
        questionStartTime.current = performance.now();
      } else {
        finishTest(isCorrect ? score + Math.max(200, Math.round(1000 - elapsed / 10)) : score);
      }
    }, 600);
  };

  const finishTest = async (finalScore: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const correctCount = answers.filter(Boolean).length;
    const accuracy = Math.round((correctCount / 5) * 100);
    const percentile = Math.max(1, Math.min(99, Math.round((finalScore / 5000) * 100)));

    try {
      await dataLayer.saveSession({
        testId: 'pattern-reasoning',
        category: 'processing',
        rawScore: finalScore,
        percentile,
        metadata: {
          mode: currentMode,
          accuracy,
          correctAnswers: correctCount,
          totalQuestions: 5
        }
      });
    } catch (err) {
      console.error('Failed to save Pattern Reasoning session:', err);
    }

    dataLayer.getPersonalBest('pattern-reasoning', 'higher').then(pb => setPersonalBest(pb)).catch(console.error);
    const card = await generateShareCard(`Reasoning: ${MODE_TITLES[currentMode]}`, `${finalScore} Pts`, percentile);
    setShareImage(card);
  };

  const getNextMode = (): GameMode => {
    const idx = MODES.indexOf(currentMode);
    return MODES[(idx + 1) % MODES.length];
  };

  const q = questions[currentIdx] as GeneratedQuestion | undefined;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 select-none">
      {gameState === 'idle' && (
        <div className="rounded-xl border border-card-border bg-card p-8 text-center flex flex-col gap-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 40 40">
              <polygon points="20,2 25,15 38,15 27,24 31,37 20,29 9,37 13,24 2,15 15,15" fill="var(--accent)" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Pattern Recognition Suite</h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Test your non-verbal intelligence with visual shape patterns. Evaluate sequences, solve matrix grids, detect rotational logic, and complete shape analogies.
              <strong className="text-foreground"> 5 questions per session.</strong>
            </p>
            <p className="text-xs text-secondary mt-2">
              All patterns use colored SVG shapes — no text or emoji dependencies.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            {MODES.map(m => (
              <button
                key={m}
                onClick={() => startTest(m)}
                className="p-4 rounded-xl border border-card-border/80 bg-subtle hover:border-accent hover:bg-card text-left transition-standard flex flex-col gap-1 active:scale-98 group"
              >
                <span className="text-xs font-bold text-foreground group-hover:text-accent font-mono">
                  {MODE_TITLES[m]}
                </span>
                <span className="text-[10px] text-muted leading-normal">
                  {MODE_DESCS[m]}
                </span>
              </button>
            ))}
          </div>

          {personalBest && (
            <span className="text-[10px] text-muted font-mono uppercase mt-2">
              Personal Best: {personalBest} Pts
            </span>
          )}
        </div>
      )}

      {gameState === 'running' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-between min-h-[360px] shadow-lg relative overflow-hidden animate-fade-in">
          <div className="w-full flex justify-between items-center text-xs font-mono text-muted mb-6 border-b border-card-border/40 pb-3">
            <span className="text-accent uppercase tracking-wider font-semibold">{MODE_TITLES[currentMode]}</span>
            <span>Q {currentIdx + 1} / 5</span>
            <span>SCORE: {score} Pts</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full my-4 text-center min-h-[140px]">
            <span className="text-xs text-secondary font-mono mb-4">{q?.instructions}</span>

            {currentMode === 'pattern' && !!q && q.sequence && (
              <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40">
                {q.sequence.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {item}
                    {i < q.sequence!.length - 1 && (
                      <span className="text-muted text-xs font-mono">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentMode === 'sequence' && !!q && q.sequence && (
              <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40">
                {q.sequence.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-card px-3 py-2 rounded border border-card-border/80 flex items-center justify-center min-w-[48px] min-h-[48px]">
                      {item}
                    </div>
                    {i < q.sequence!.length - 1 && (
                      <span className="text-muted text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentMode === 'matrix' && q?.matrix && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-subtle rounded-xl border border-card-border/40 mx-auto">
                <div className="w-20 h-20 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.topLeft}
                </div>
                <div className="w-20 h-20 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.topRight}
                </div>
                <div className="w-20 h-20 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.bottomLeft}
                </div>
                <div className="w-20 h-20 bg-card rounded border border-card-border/80 flex items-center justify-center bg-accent/5">
                  {q.matrix.bottomRight}
                </div>
              </div>
            )}

            {currentMode === 'analogy' && q?.analogy && (
              <div className="flex items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40 flex-wrap">
                <div className="flex items-center gap-2">{q.analogy.a}</div>
                <span className="text-xs text-muted font-mono">is to</span>
                <div className="flex items-center gap-2">{q.analogy.b}</div>
                <span className="text-xs text-muted font-mono">as</span>
                <div className="flex items-center gap-2">{q.analogy.c}</div>
                <span className="text-xs text-muted font-mono">is to</span>
                <SvgQuestionMark size={36} />
              </div>
            )}
          </div>

          <div className="h-6 flex items-center justify-center mb-4">
            {lastCorrect === true && <span className="text-success font-bold text-xs font-mono">✓ CORRECT</span>}
            {lastCorrect === false && <span className="text-error font-bold text-xs font-mono">✗ INCORRECT</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {q?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                className="h-16 rounded-lg border border-card-border hover:bg-subtle text-foreground text-sm font-semibold flex items-center justify-center transition-standard active:scale-97 hover:border-accent"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 shadow-lg text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center justify-center text-success text-xl font-bold">
            ✓
          </div>
          <div>
            <span className="text-muted text-xs font-mono uppercase tracking-widest">
              {MODE_TITLES[currentMode]} Score
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {score} Pts
            </h2>
            <span className="text-accent text-xs font-mono uppercase mt-1 block">
              Top {100 - Math.round((score / 5000) * 100)}% reasoning speed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm border-t border-b border-card-border/50 py-4 my-2 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Questions Correct</span>
              <span className="text-sm font-bold text-foreground">{answers.filter(Boolean).length} / 5</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Accuracy</span>
              <span className="text-sm font-bold text-foreground">{Math.round((answers.filter(Boolean).length / 5) * 100)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Total Latency</span>
              <span className="text-sm font-bold text-foreground">{(latencies.reduce((a,b)=>a+b,0) / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Avg Time/Q</span>
              <span className="text-sm font-bold text-foreground">{Math.round(latencies.reduce((a,b)=>a+b,0) / 5)} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => startTest(getNextMode())}
              className="h-11 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
            >
              Next Format ➔
            </button>
            <button
              onClick={() => setGameState('idle')}
              className="h-11 rounded-lg border border-card-border hover:bg-subtle text-foreground font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
            >
              Main Menu
            </button>
          </div>

          {shareImage && (
            <SocialShare
              testId="pattern-reasoning"
              score={score}
              scoreLabel={`${score} Pts`}
              testName={`Pattern Recognition: ${MODE_TITLES[currentMode]}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
