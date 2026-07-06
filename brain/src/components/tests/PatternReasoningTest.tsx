import React, { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import SocialShare from '../ui/SocialShare';

type GameMode = 'pattern' | 'matrix' | 'sequence' | 'analogy';
type GameState = 'idle' | 'running' | 'result';

interface GeneratedQuestion {
  instructions: string;
  type: GameMode;
  // Representing the visual elements
  sequence?: string[]; // for sequence logic / pattern sequences
  matrix?: {
    topLeft: string | React.ReactNode;
    topRight: string | React.ReactNode;
    bottomLeft: string | React.ReactNode;
    bottomRight: string | React.ReactNode;
  }; // for 2x2 matrix reasoning
  analogy?: {
    a: string | React.ReactNode;
    b: string | React.ReactNode;
    c: string | React.ReactNode;
  }; // for shape analogies
  options: string[] | React.ReactNode[];
  correctIdx: number;
}

const MODES: GameMode[] = ['pattern', 'matrix', 'sequence', 'analogy'];
const MODE_TITLES: Record<GameMode, string> = {
  pattern: 'Pattern Recognition',
  matrix: 'Matrix Reasoning',
  sequence: 'Sequence Logic',
  analogy: 'Shape Analogies'
};

const MODE_DESCS: Record<GameMode, string> = {
  pattern: 'Complete the linear sequence of colored visual elements.',
  matrix: 'Solve the 2x2 visual grid matrix puzzle by identifying the rule.',
  sequence: 'Detect the logical progression of shapes, numbers, or rotations.',
  analogy: 'Apply the shape morphing transformation to complete the analogy.'
};

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
        // Delay slightly to ensure component state is ready
        setTimeout(() => {
          if (mounted) startTest(fmt as GameMode);
        }, 100);
      }
    }

    return () => { mounted = false; };
  }, []);

  // Procedural generators for each mode
  const generatePatternQuestion = (): GeneratedQuestion => {
    const colors = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠', '⚫', '⚪'];
    // pick 2 or 3 colors
    const c1 = colors[Math.floor(Math.random() * colors.length)];
    let c2 = colors[Math.floor(Math.random() * colors.length)];
    while (c2 === c1) c2 = colors[Math.floor(Math.random() * colors.length)];
    let c3 = colors[Math.floor(Math.random() * colors.length)];
    while (c3 === c1 || c3 === c2) c3 = colors[Math.floor(Math.random() * colors.length)];

    const patternTypes = [
      [c1, c2, c1, c2, c1, '❓'], // A-B-A-B-A-? (correct: c2)
      [c1, c1, c2, c1, c1, '❓'], // A-A-B-A-A-? (correct: c2)
      [c1, c2, c3, c1, c2, '❓'], // A-B-C-A-B-? (correct: c3)
      [c1, c2, c2, c1, c2, '❓']  // A-B-B-A-B-? (correct: c2)
    ];

    const typeIdx = Math.floor(Math.random() * patternTypes.length);
    const sequence = patternTypes[typeIdx];
    const correctVal = typeIdx === 2 ? c3 : c2;

    // Generate options
    const optionsSet = new Set<string>([correctVal]);
    while (optionsSet.size < 4) {
      optionsSet.add(colors[Math.floor(Math.random() * colors.length)]);
    }
    const options = Array.from(optionsSet);
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      type: 'pattern',
      instructions: 'Complete the linear sequence of colored visual elements:',
      sequence,
      options,
      correctIdx: options.indexOf(correctVal)
    };
  };

  const generateMatrixQuestion = (): GeneratedQuestion => {
    const shapes = ['▲', '■', '◆', '●'];
    const selectedShape = shapes[Math.floor(Math.random() * shapes.length)];
    let otherShape = shapes[Math.floor(Math.random() * shapes.length)];
    while (otherShape === selectedShape) otherShape = shapes[Math.floor(Math.random() * shapes.length)];

    // Matrix rule: Left to Right adds a nested element or fills color
    // Let's do nested: A -> A nested in A
    const topLeft = selectedShape;
    const topRight = `回${selectedShape}`; // Nested style representation
    const bottomLeft = otherShape;
    const correctVal = `回${otherShape}`;

    // Options
    const optionsSet = new Set<string>([correctVal, otherShape, selectedShape, `回${selectedShape}`]);
    // ensure exactly 4 options
    while (optionsSet.size < 4) {
      optionsSet.add(`回${shapes[Math.floor(Math.random() * shapes.length)]}`);
    }
    const options = Array.from(optionsSet);
    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      type: 'matrix',
      instructions: 'Identify the rule and complete the 2x2 grid matrix:',
      matrix: {
        topLeft: <span className="text-3xl">{topLeft}</span>,
        topRight: <span className="text-3xl text-accent">{topRight}</span>,
        bottomLeft: <span className="text-3xl">{bottomLeft}</span>,
        bottomRight: <span className="text-3xl text-zinc-500 font-mono">❓</span>
      },
      options: options.map(o => <span className="text-2xl">{o}</span>),
      correctIdx: options.indexOf(correctVal)
    };
  };

  const generateSequenceQuestion = (): GeneratedQuestion => {
    const type = Math.random() < 0.5 ? 'arrow' : 'math';
    if (type === 'arrow') {
      const arrows = ['↑', '→', '↓', '←'];
      const start = Math.floor(Math.random() * 4);
      // step can be +1 (90 deg clockwise) or -1 (counter-clockwise)
      const step = Math.random() < 0.5 ? 1 : 3; // 3 matches -1 in modulo 4
      
      const sequence = [
        arrows[start],
        arrows[(start + step) % 4],
        arrows[(start + step * 2) % 4],
        arrows[(start + step * 3) % 4],
        '❓'
      ];
      const correctVal = arrows[(start + step * 4) % 4];

      const options = [...arrows];
      // Shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        type: 'sequence',
        instructions: 'Determine the rotation progression rule:',
        sequence,
        options,
        correctIdx: options.indexOf(correctVal)
      };
    } else {
      // math sequence
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * 5) + 2;
      const mathTypes = [
        (i: number) => start + step * i, // linear addition
        (i: number) => start * Math.pow(2, i) // exponential double
      ];
      const selectedMath = mathTypes[Math.floor(Math.random() * mathTypes.length)];
      
      const sequence = [
        selectedMath(0).toString(),
        selectedMath(1).toString(),
        selectedMath(2).toString(),
        selectedMath(3).toString(),
        '❓'
      ];
      const correctVal = selectedMath(4).toString();

      const optionsSet = new Set<string>([correctVal]);
      while (optionsSet.size < 4) {
        optionsSet.add((selectedMath(4) + (Math.floor(Math.random() * 20) - 10)).toString());
      }
      const options = Array.from(optionsSet);
      // Shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        type: 'sequence',
        instructions: 'Determine the numerical sequence logic:',
        sequence,
        options,
        correctIdx: options.indexOf(correctVal)
      };
    }
  };

  const generateAnalogyQuestion = (): GeneratedQuestion => {
    const morphs = [
      { a: '⚪', b: '⚫', c: '⬜', correct: '⬛' }, // White shape to Black shape
      { a: '◽', b: '⬜', c: '⚬', correct: '⚪' }, // Small shape to Large shape
      { a: '▲', b: '▼', c: '↑', correct: '↓' }  // Triangle up to down, Arrow up to down
    ];

    const selected = morphs[Math.floor(Math.random() * morphs.length)];
    const optionsSet = new Set<string>([selected.correct, selected.a, selected.b, selected.c]);
    while (optionsSet.size < 4) {
      optionsSet.add('❖');
    }
    const options = Array.from(optionsSet);
    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      type: 'analogy',
      instructions: 'Complete the geometric shape analogy:',
      analogy: {
        a: selected.a,
        b: selected.b,
        c: selected.c
      },
      options,
      correctIdx: options.indexOf(selected.correct)
    };
  };

  const startTest = (mode: GameMode) => {
    setCurrentMode(mode);
    // Generate exactly 5 questions for the selected mode
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
      // Speed bonus: max 1000 per question, minimum 200
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

    // Save test performance index (max score is 5000 points)
    const percentile = Math.max(1, Math.min(99, Math.round((finalScore / 5000) * 100)));

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
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mx-auto">
            🧩
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Pattern Recognition Suite</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
              Test your non-verbal intelligence. Evaluate sequences, solve visual matrix grids, detect rotational logic, and morph shape analogies. 
              **Exactly 5 questions per session.**
            </p>
          </div>

          {/* Mode description list */}
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
                <span className="text-[10px] text-zinc-500 leading-normal">
                  {MODE_DESCS[m]}
                </span>
              </button>
            ))}
          </div>

          {personalBest && (
            <span className="text-[10px] text-zinc-500 font-mono uppercase mt-2">
              Personal Best: {personalBest} Pts
            </span>
          )}
        </div>
      )}

      {gameState === 'running' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-between min-h-[360px] shadow-lg relative overflow-hidden animate-fade-in">
          {/* Progress Header */}
          <div className="w-full flex justify-between items-center text-xs font-mono text-zinc-500 mb-6 border-b border-card-border/40 pb-3">
            <span className="text-accent uppercase tracking-wider font-semibold">{MODE_TITLES[currentMode]}</span>
            <span>Q {currentIdx + 1} / 5</span>
            <span>SCORE: {score} Pts</span>
          </div>

          {/* Question Display area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full my-4 text-center min-h-[140px]">
            <span className="text-xs text-zinc-400 font-mono mb-4">{q?.instructions}</span>

            {/* Render logic depending on selected Mode */}
            {currentMode === 'pattern' && !!q && q.sequence && (
              <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40">
                {q.sequence.map((symbol, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-3xl font-sans">{symbol}</span>
                    {i < q.sequence!.length - 1 && (
                      <span className="text-zinc-500 text-xs font-mono">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentMode === 'sequence' && !!q && q.sequence && (
              <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40 font-mono text-xl font-bold text-foreground">
                {q.sequence.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="bg-card px-3 py-1.5 rounded border border-card-border/80 min-w-[40px] text-center">{item}</span>
                    {i < q.sequence!.length - 1 && (
                      <span className="text-zinc-500 text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentMode === 'matrix' && q?.matrix && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-subtle rounded-xl border border-card-border/40 max-w-[200px] aspect-square mx-auto">
                <div className="w-16 h-16 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.topLeft}
                </div>
                <div className="w-16 h-16 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.topRight}
                </div>
                <div className="w-16 h-16 bg-card rounded border border-card-border/80 flex items-center justify-center">
                  {q.matrix.bottomLeft}
                </div>
                <div className="w-16 h-16 bg-card rounded border border-card-border/80 flex items-center justify-center bg-accent/5">
                  {q.matrix.bottomRight}
                </div>
              </div>
            )}

            {currentMode === 'analogy' && q?.analogy && (
              <div className="flex items-center justify-center gap-3 py-4 px-6 bg-subtle rounded-xl border border-card-border/40 text-3xl">
                <span>{q.analogy.a}</span>
                <span className="text-xs text-zinc-500 font-mono">is to</span>
                <span>{q.analogy.b}</span>
                <span className="text-xs text-zinc-500 font-mono">as</span>
                <span>{q.analogy.c}</span>
                <span className="text-xs text-zinc-500 font-mono">is to</span>
                <span className="text-zinc-500 font-mono">❓</span>
              </div>
            )}
          </div>

          {/* Feedback Overlay */}
          <div className="h-6 flex items-center justify-center mb-4">
            {lastCorrect === true && <span className="text-green-500 font-bold text-xs font-mono">✓ CORRECT</span>}
            {lastCorrect === false && <span className="text-red-500 font-bold text-xs font-mono">✗ INCORRECT</span>}
          </div>

          {/* Multiple choice inputs */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {q?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                className="h-14 rounded-lg border border-card-border hover:bg-subtle text-foreground text-sm font-semibold flex items-center justify-center transition-standard active:scale-97 hover:border-accent"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col items-center gap-6 shadow-lg text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-xl font-bold">
            ✓
          </div>
          <div>
            <span className="text-zinc-550 text-xs font-mono uppercase tracking-widest">
              {MODE_TITLES[currentMode]} Score
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {score} Pts
            </h2>
            <span className="text-accent text-xs font-mono uppercase mt-1 block">
              Top {100 - Math.round((score / 5000) * 100)}% reasoning speed
            </span>
          </div>

          {/* Detail Table */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm border-t border-b border-card-border/50 py-4 my-2 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Questions Correct</span>
              <span className="text-sm font-bold text-foreground">
                {answers.filter(Boolean).length} / 5
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Accuracy</span>
              <span className="text-sm font-bold text-foreground">
                {Math.round((answers.filter(Boolean).length / 5) * 100)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Total Latency</span>
              <span className="text-sm font-bold text-foreground">
                {(latencies.reduce((a,b)=>a+b,0) / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Avg Time/Q</span>
              <span className="text-sm font-bold text-foreground">
                {Math.round(latencies.reduce((a,b)=>a+b,0) / 5)} ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => startTest(getNextMode())}
              className="h-11 rounded-lg bg-accent hover:bg-accent-hover text-black font-bold uppercase text-xs font-mono tracking-wider active:scale-98 transition-standard shadow"
            >
              Next Format Game ➔
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
