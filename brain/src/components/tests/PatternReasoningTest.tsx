import React, { useState, useEffect, useRef } from 'react';
import { withErrorBoundary } from "@/components/ui/withErrorBoundary";
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';
import { lookupPercentile, formatTopPercentile } from '../../runtime/percentileLookup';
import { redirectToResults } from '../../runtime/redirectToResults';
import GameConfigPanel from '../ui/GameConfigPanel';
import type { GameConfig } from '../../runtime/testConfig';
import { loadTestConfig } from '../../runtime/testConfig';
import { useBeforeUnload } from '../../runtime/useBeforeUnload';
import { useVisibilityGuard } from '../../runtime/useVisibilityGuard';

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

function generatePatternQuestion(difficulty: string): GeneratedQuestion {
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
    { seq: [c1, c2, c3, c3, c2], answer: c1, rule: 'A-B-C-C-B-A' },
    { seq: [c1, c1, c2, c2, c3], answer: c3, rule: 'A-A-B-B-C-C' },
    { seq: [c1, c2, c3, c2, c1], answer: c2, rule: 'A-B-C-B-A-B' },
    { seq: [c1, c2, c1, c1, c2], answer: c1, rule: 'A-B-A-A-B-A' },
    { seq: [c1, c1, c2, c3, c3], answer: c1, rule: 'A-A-B-C-C-A' },
    { seq: [c1, c2, c3, c1, c3], answer: c2, rule: 'A-B-C-A-C-B' },
  ];

  const patternCount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 7 : 10;
  const p = patterns[Math.floor(Math.random() * patternCount)];
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

function generateMatrixQuestion(difficulty: string): GeneratedQuestion {
  const shapeIdx = Math.floor(Math.random() * SHAPES.length);
  let otherShapeIdx = Math.floor(Math.random() * SHAPES.length);
  while (otherShapeIdx === shapeIdx) otherShapeIdx = Math.floor(Math.random() * SHAPES.length);

  const colorIdx = Math.floor(Math.random() * SVG_COLORS.length);
  let otherColorIdx = Math.floor(Math.random() * SVG_COLORS.length);
  while (otherColorIdx === colorIdx) otherColorIdx = Math.floor(Math.random() * SVG_COLORS.length);

  const Shape1 = SHAPES[shapeIdx];
  const Shape2 = SHAPES[otherShapeIdx];

  const ruleCount = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;
  const ruleType = Math.floor(Math.random() * ruleCount);
  let topLeft: React.ReactNode, topRight: React.ReactNode, bottomLeft: React.ReactNode;
  let bottomRight: React.ReactNode;
  let correctOption: React.ReactNode;
  let distractors: React.ReactNode[];

  if (ruleType === 0) {
    // Row = shape change, Col = color change
    topLeft = <Shape1 color={SVG_COLORS[colorIdx]} size={44} />;
    topRight = <Shape1 color={SVG_COLORS[otherColorIdx]} size={44} />;
    bottomLeft = <Shape2 color={SVG_COLORS[colorIdx]} size={44} />;
    bottomRight = <SvgQuestionMark size={44} />;
    correctOption = <Shape2 color={SVG_COLORS[otherColorIdx]} size={36} />;
    distractors = [
      <Shape2 color={SVG_COLORS[colorIdx]} size={36} />,
      <Shape1 color={SVG_COLORS[otherColorIdx]} size={36} />,
      <Shape2 color={SVG_COLORS[(otherColorIdx + 1) % SVG_COLORS.length]} size={36} />,
    ];
  } else if (ruleType === 1) {
    // Diagonal: same shape in each row, color shifts across columns
    topLeft = <Shape1 color={SVG_COLORS[colorIdx]} size={44} />;
    topRight = <Shape1 color={SVG_COLORS[otherColorIdx]} size={44} />;
    bottomLeft = <Shape2 color={SVG_COLORS[colorIdx]} size={44} />;
    bottomRight = <SvgQuestionMark size={44} />;
    correctOption = <Shape2 color={SVG_COLORS[otherColorIdx]} size={36} />;
    const thirdColor = (colorIdx + 2) % SVG_COLORS.length;
    distractors = [
      <Shape1 color={SVG_COLORS[otherColorIdx]} size={36} />,
      <Shape2 color={SVG_COLORS[thirdColor]} size={36} />,
      <Shape2 color={SVG_COLORS[colorIdx]} size={36} />,
    ];
  } else if (ruleType === 2) {
    // XOR: shapes differ in both cells, colors cross
    let thirdShapeIdx = Math.floor(Math.random() * SHAPES.length);
    while (thirdShapeIdx === shapeIdx || thirdShapeIdx === otherShapeIdx) thirdShapeIdx = Math.floor(Math.random() * SHAPES.length);
    const Shape3 = SHAPES[thirdShapeIdx];
    topLeft = <Shape1 color={SVG_COLORS[colorIdx]} size={44} />;
    topRight = <Shape2 color={SVG_COLORS[otherColorIdx]} size={44} />;
    bottomLeft = <Shape2 color={SVG_COLORS[colorIdx]} size={44} />;
    bottomRight = <SvgQuestionMark size={44} />;
    correctOption = <Shape3 color={SVG_COLORS[otherColorIdx]} size={36} />;
    distractors = [
      <Shape1 color={SVG_COLORS[otherColorIdx]} size={36} />,
      <Shape3 color={SVG_COLORS[colorIdx]} size={36} />,
      <Shape2 color={SVG_COLORS[otherColorIdx]} size={36} />,
    ];
  } else {
    // Shape-shift across columns, color constant in rows
    topLeft = <Shape1 color={SVG_COLORS[colorIdx]} size={44} />;
    topRight = <Shape2 color={SVG_COLORS[colorIdx]} size={44} />;
    bottomLeft = <Shape2 color={SVG_COLORS[otherColorIdx]} size={44} />;
    bottomRight = <SvgQuestionMark size={44} />;
    correctOption = <Shape1 color={SVG_COLORS[otherColorIdx]} size={36} />;
    const thirdColor = (otherColorIdx + 2) % SVG_COLORS.length;
    distractors = [
      <Shape1 color={SVG_COLORS[colorIdx]} size={36} />,
      <Shape2 color={SVG_COLORS[thirdColor]} size={36} />,
      <Shape1 color={SVG_COLORS[thirdColor]} size={36} />,
    ];
  }

  const options: React.ReactNode[] = [correctOption];
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
    correctIdx: options.findIndex(o => {
      const el = o as React.ReactElement<{ color: string }>;
      const correctEl = correctOption as React.ReactElement<{ color: string }>;
      return el.props?.color === correctEl.props?.color && (el.type as Function) === (correctEl.type as Function);
    })
  };
}

function generateSequenceQuestion(difficulty: string): GeneratedQuestion {
  const shapeIdx = Math.floor(Math.random() * SHAPES.length);
  const Shape = SHAPES[shapeIdx];
  const colorIdx = Math.floor(Math.random() * SVG_COLORS.length);

  // Rotation sequence: 0°, 90°, 180°, 270°, ?
  const allSteps = [30, 45, 60, 72, 90, 120];
  const minStepIdx = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 1 : 0;
  const steps = allSteps.slice(minStepIdx);
  const step = steps[Math.floor(Math.random() * steps.length)];
  const startAngle = Math.floor(Math.random() * 360);
  const rotations = [0, 1, 2, 3].map(i => startAngle + step * i);
  const answerRotation = startAngle + step * 4;

  const seqShapeIdx = Math.floor(Math.random() * SHAPES.length);
  const SeqShape = SHAPES[seqShapeIdx];

  const sequence: React.ReactNode[] = rotations.map((r, i) => (
    <SeqShape key={i} color={SVG_COLORS[colorIdx]} rotation={r} size={40} />
  ));
  sequence.push(<SvgQuestionMark key="q" size={40} />);

  const correctOption = <SeqShape color={SVG_COLORS[colorIdx]} rotation={answerRotation} size={32} />;
  const options: React.ReactNode[] = [correctOption];
  const otherAngles = [answerRotation + 45, answerRotation + 90, answerRotation + 135];
  for (const a of otherAngles) {
    options.push(<SeqShape color={SVG_COLORS[colorIdx]} rotation={a} size={32} />);
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

function generateAnalogyQuestion(difficulty: string): GeneratedQuestion {
  // Use dynamic color indices for variety across plays
  const ci1 = Math.floor(Math.random() * SVG_COLORS.length);
  let ci2 = Math.floor(Math.random() * SVG_COLORS.length);
  while (ci2 === ci1) ci2 = Math.floor(Math.random() * SVG_COLORS.length);
  let ci3 = Math.floor(Math.random() * SVG_COLORS.length);
  while (ci3 === ci1 || ci3 === ci2) ci3 = Math.floor(Math.random() * SVG_COLORS.length);

  const transformations = [
    { name: 'fill', aShapeIdx: 0, aColorIdx: -1, bShapeIdx: 0, bColorIdx: ci1, cShapeIdx: 1, cColorIdx: -1, correctShapeIdx: 1, correctColorIdx: ci1 },
    { name: 'color', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 0, bColorIdx: ci2, cShapeIdx: 3, cColorIdx: ci1, correctShapeIdx: 3, correctColorIdx: ci2 },
    { name: 'shape', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 1, bColorIdx: ci1, cShapeIdx: 2, cColorIdx: ci2, correctShapeIdx: 3, correctColorIdx: ci2 },
    { name: 'size', aShapeIdx: 4, aColorIdx: ci1, bShapeIdx: 4, bColorIdx: ci1, cShapeIdx: 5, cColorIdx: ci2, correctShapeIdx: 5, correctColorIdx: ci2 },
    { name: 'shape+color', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 1, bColorIdx: ci2, cShapeIdx: 2, cColorIdx: ci1, correctShapeIdx: 3, correctColorIdx: ci2 },
    { name: 'color+shape', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 0, bColorIdx: ci2, cShapeIdx: 1, cColorIdx: ci2, correctShapeIdx: 1, correctColorIdx: ci1 },
    { name: 'fill+shape', aShapeIdx: 0, aColorIdx: -1, bShapeIdx: 0, bColorIdx: ci1, cShapeIdx: 1, cColorIdx: ci1, correctShapeIdx: 1, correctColorIdx: -1 },
    { name: 'double-shift', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 1, bColorIdx: ci2, cShapeIdx: 2, cColorIdx: ci3, correctShapeIdx: 3, correctColorIdx: ci1 },
    { name: 'reverse', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 1, bColorIdx: ci2, cShapeIdx: 2, cColorIdx: ci3, correctShapeIdx: 1, correctColorIdx: ci3 },
    { name: 'cross', aShapeIdx: 0, aColorIdx: ci1, bShapeIdx: 1, bColorIdx: ci2, cShapeIdx: 1, cColorIdx: ci1, correctShapeIdx: 0, correctColorIdx: ci2 },
  ];

  const transformCount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 7 : 10;
  const t = transformations[Math.floor(Math.random() * transformCount)];

  const analogyData = {
    a: { shapeIdx: t.aShapeIdx, colorIdx: t.aColorIdx, size: 44 },
    b: { shapeIdx: t.bShapeIdx, colorIdx: t.bColorIdx, size: 44 },
    c: { shapeIdx: t.cShapeIdx, colorIdx: t.cColorIdx, size: 44 },
  };
  const correctOption = { shapeIdx: t.correctShapeIdx, colorIdx: t.correctColorIdx, size: 44 };

  const options: { shapeIdx: number; colorIdx: number; size: number }[] = [correctOption];
  // Generate dynamic distractors based on the correct answer
  const dColor1 = (t.correctColorIdx + 1) % SVG_COLORS.length;
  const dColor2 = (t.correctColorIdx + 3) % SVG_COLORS.length;
  const dShape1 = (t.correctShapeIdx + 1) % SHAPES.length;
  const dShape2 = (t.correctShapeIdx + 2) % SHAPES.length;
  const distractors = [
    { shapeIdx: t.correctShapeIdx, colorIdx: dColor1, size: 44 },
    { shapeIdx: dShape1, colorIdx: t.correctColorIdx, size: 44 },
    { shapeIdx: dShape2, colorIdx: dColor2, size: 44 },
  ];
  for (const d of distractors) {
    if (options.length < 4) options.push(d);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.shapeIdx === correctOption.shapeIdx && o.colorIdx === correctOption.colorIdx);

  const getColor = (idx: number) => idx < 0 ? 'none' : SVG_COLORS[idx];
  const AShape = SHAPES[analogyData.a.shapeIdx];
  const BShape = SHAPES[analogyData.b.shapeIdx];
  const CShape = SHAPES[analogyData.c.shapeIdx];
  const analogyDisplay = {
    a: <AShape color={getColor(analogyData.a.colorIdx)} size={analogyData.a.size} />,
    b: <BShape color={getColor(analogyData.b.colorIdx)} size={analogyData.b.size} />,
    c: <CShape color={getColor(analogyData.c.colorIdx)} size={analogyData.c.size} />,
  };
  const renderedOptions = options.map((o, i) => {
    const OptShape = SHAPES[o.shapeIdx];
    return <OptShape key={i} color={getColor(o.colorIdx)} size={o.size} />;
  });

  return {
    type: 'analogy',
    instructions: 'Complete the shape transformation analogy:',
    analogy: analogyDisplay,
    options: renderedOptions,
    correctIdx
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

function PatternReasoningTest() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentMode, setCurrentMode] = useState<GameMode>('pattern');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [resultPercentile, setResultPercentile] = useState<number>(0);

  const questionStartTime = useRef<number>(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const submittedRef = useRef(false);
  const scoreRef = useRef<number>(0);
  const answersRef = useRef<boolean[]>([]);
  const respondedRef = useRef(false);

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

  const questionCount = useRef<number>(5);

  const startTest = (mode: GameMode, config?: GameConfig) => {
    const cfg = config || {};
    const difficulty = (cfg.difficulty as string) || 'Medium';
    const attemptCount = typeof cfg.questions === 'number' ? cfg.questions : 5;
    questionCount.current = attemptCount;
    setCurrentMode(mode);
    const questionList: GeneratedQuestion[] = [];
    for (let i = 0; i < questionCount.current; i++) {
      if (mode === 'pattern') questionList.push(generatePatternQuestion(difficulty));
      else if (mode === 'matrix') questionList.push(generateMatrixQuestion(difficulty));
      else if (mode === 'sequence') questionList.push(generateSequenceQuestion(difficulty));
      else questionList.push(generateAnalogyQuestion(difficulty));
    }

    setQuestions(questionList);
    setCurrentIdx(0);
    setScore(0);
    scoreRef.current = 0;
    answersRef.current = [];
    setAnswers([]);
    setLatencies([]);
    setLastCorrect(null);
    setShareImage(null);
    submittedRef.current = false;
    setGameState('running');
    questionStartTime.current = performance.now();
  };

  const handleOptionClick = (idx: number) => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const elapsed = Math.round(performance.now() - questionStartTime.current);
    setLatencies(prev => [...prev, elapsed]);

    const isCorrect = idx === questions[currentIdx]!.correctIdx;
    answersRef.current = [...answersRef.current, isCorrect];
    setAnswers(answersRef.current);

    if (isCorrect) {
      const pts = Math.max(200, Math.round(1000 - elapsed / 10));
      setScore(prev => prev + pts);
      scoreRef.current += pts;
    }
    setLastCorrect(isCorrect);

    setTimeout(() => {
      setLastCorrect(null);
      respondedRef.current = false;
      if (currentIdx + 1 < questionCount.current) {
        setCurrentIdx(prev => prev + 1);
        questionStartTime.current = performance.now();
      } else {
        finishTest(scoreRef.current);
      }
    }, 600);
  };

  const finishTest = async (finalScore: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setGameState('result');
    const correctCount = answersRef.current.filter(Boolean).length;
    const accuracy = Math.round((correctCount / questionCount.current) * 100);
    const percentile = Math.round(lookupPercentile('pattern-reasoning', finalScore));
    setResultPercentile(percentile);

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
          totalQuestions: questionCount.current
        }
      });
    } catch (err) {
      console.error('Failed to save Pattern Reasoning session:', err);
    }
    if (!submittedRef.current) return;

    dataLayer.getPersonalBest('pattern-reasoning', 'higher').then(pb => { if (submittedRef.current) setPersonalBest(pb); }).catch(console.error);

    if (!submittedRef.current) return;

    try {
      const card = await generateShareCard(`Reasoning: ${MODE_TITLES[currentMode]}`, `${finalScore} Pts`, percentile);
      setShareImage(card);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }
    if (!submittedRef.current) return;

    redirectToResults({
      testId: 'pattern-reasoning', testName: 'Pattern Reasoning', attempts: [finalScore], unit: 'pts',
      percentile, personalBest: null, category: 'processing', average: finalScore,
    });
  };

  const getNextMode = (): GameMode => {
    const idx = MODES.indexOf(currentMode);
    return MODES[(idx + 1) % MODES.length];
  };

  const q = questions[currentIdx] as GeneratedQuestion | undefined;

  useBeforeUnload(gameState !== 'idle' && gameState !== 'result');
  useVisibilityGuard(() => {
    setGameState('idle');
  }, gameState === 'running');

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 select-none">
      {gameState === 'idle' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col gap-6 shadow-lg">
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <GameConfigPanel
              testId="pattern-reasoning"
              icon="⭐"
              title="Pattern Recognition Suite"
              description="Test your non-verbal intelligence with visual shape patterns. Evaluate sequences, solve matrix grids, detect rotational logic, and complete shape analogies."
              personalBest={personalBest}
              personalBestLabel="Pts"
              onStart={() => {}}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            {MODES.map(m => (
              <button
                key={m}
                onClick={() => startTest(m, loadTestConfig('pattern-reasoning'))}
                className="p-4 rounded-xl border border-card-border/80 bg-subtle hover:border-accent hover:bg-card text-left transition-standard flex flex-col gap-1 active:scale-98 group cursor-pointer"
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
        </div>
      )}

      {gameState === 'running' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-between min-h-[360px] shadow-lg relative overflow-hidden animate-fade-in">
          <button onClick={() => setGameState('idle')} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-panel/80 border border-card-border text-muted hover:text-error hover:border-error/50 text-[11px] transition-standard cursor-pointer z-10" aria-label="Restart">✕</button>
          <div className="w-full flex justify-between items-center text-xs font-mono text-muted mb-6 border-b border-card-border/40 pb-3">
            <span className="text-accent uppercase tracking-wider font-semibold">{MODE_TITLES[currentMode]}</span>
            <span>Q {currentIdx + 1} / {questionCount.current}</span>
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
              {formatTopPercentile(resultPercentile)} reasoning speed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm border-t border-b border-card-border/50 py-4 my-2 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Questions Correct</span>
              <span className="text-sm font-bold text-foreground">{answers.filter(Boolean).length} / {questionCount.current}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Accuracy</span>
              <span className="text-sm font-bold text-foreground">{Math.round((answers.filter(Boolean).length / questionCount.current) * 100)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Total Latency</span>
              <span className="text-sm font-bold text-foreground">{(latencies.reduce((a,b)=>a+b,0) / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase font-mono">Avg Time/Q</span>
              <span className="text-sm font-bold text-foreground">{Math.round(latencies.reduce((a,b)=>a+b,0) / questionCount.current)} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => startTest(getNextMode(), loadTestConfig('pattern-reasoning'))}
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

export default withErrorBoundary(PatternReasoningTest);
