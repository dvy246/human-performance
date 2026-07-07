import React, { useState, useEffect, useRef } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';

const PASSAGES = [
  `The brain is a remarkable organ that adapts and rewires itself throughout life in response to experience. This quality known as neuroplasticity means that every skill you practice from playing an instrument to learning a new language physically reshapes your neural architecture. The more deliberate your practice the stronger and faster the neural pathways become.`,
  `In the middle of difficulty lies opportunity. The human mind when stretched to a new idea never returns to its original dimensions. What we achieve inwardly will change outer reality. The only way to discover the limits of the possible is to venture a little way past them into the impossible.`,
  `Technology advances at an accelerating pace reshaping how we work communicate and think. The most profound technologies are those that disappear weaving themselves into the fabric of everyday life until they are indistinguishable from it. Computing is not about computers anymore it is about living.`,
  `Success in any field requires a combination of deliberate practice patience and resilience. The most accomplished individuals in any domain have spent approximately ten thousand hours engaged in purposeful practice. But raw hours alone are not enough the quality of practice matters as much as the quantity.`,
  `The human capacity for language is one of the most remarkable features of our species. Through a complex system of symbols and rules we can express an infinite range of thoughts emotions and ideas. Every time you type a sentence you are participating in a cognitive process that involves multiple brain regions working in precise coordination.`,
  `Science is a way of thinking much more than it is a body of knowledge. The pursuit of understanding through observation experimentation and reasoning has transformed every aspect of modern life from medicine to communication to transportation. The scientific method remains humanity's most reliable tool for distinguishing truth from falsehood.`,
  `Focus is not about saying yes to the right things it is about saying no to the everything else. The ability to concentrate without distraction on a cognitively demanding task is becoming increasingly rare and increasingly valuable. Deep work is the superpower of the twenty-first century.`,
  `Every great achievement was once considered impossible. The stories of human progress are stories of individuals who refused to accept the limits that others placed upon them. They saw what could be not what was and they dedicated themselves with singular purpose to making their vision real.`
];

type TestState = 'idle' | 'typing' | 'result';
type TimerOption = 15 | 30 | 60 | 120;

export default function TypingSpeedTest() {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [timerDuration, setTimerDuration] = useState<TimerOption>(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [displayWpm, setDisplayWpm] = useState(0);
  const [displayAcc, setDisplayAcc] = useState(100);
  const [resultWpm, setResultWpm] = useState(0);
  const [resultRawWpm, setResultRawWpm] = useState(0);
  const [resultAcc, setResultAcc] = useState(100);
  const [resultCons, setResultCons] = useState(100);
  const [resultCorrect, setResultCorrect] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [finalPercentile, setFinalPercentile] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [words] = useState<string[]>(() => PASSAGES[Math.floor(Math.random() * PASSAGES.length)].split(' '));
  const [renderTick, setRenderTick] = useState(0);

  const typedCharsRef = useRef('');
  const currentWordIdxRef = useRef(0);
  const correctStrokesRef = useRef(0);
  const incorrectStrokesRef = useRef(0);
  const totalStrokesRef = useRef(0);
  const wordResultsRef = useRef<boolean[][]>([]);
  const wpmHistoryRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusSentinelRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    dataLayer.getPersonalBest('typing-speed', 'higher').then(pb => { if (mounted) setPersonalBest(pb); }).catch(() => {});
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('challenge');
      if (t) {
        import('../../runtime/share').then(({ decodeChallenge }) => {
          const payload = decodeChallenge(t);
          if (payload && payload.testId === 'typing-speed' && mounted) setChallengeScore(payload.score);
        }).catch(() => {});
      }
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (wordsContainerRef.current && currentWordIdxRef.current > 0) {
      const children = wordsContainerRef.current.children;
      if (children[currentWordIdxRef.current]) {
        children[currentWordIdxRef.current].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [renderTick]);

  const lookupPercentile = (wpmScore: number): number => {
    if (wpmScore >= 120) return 99.9; if (wpmScore >= 110) return 99.5; if (wpmScore >= 100) return 99;
    if (wpmScore >= 90) return 97; if (wpmScore >= 80) return 93; if (wpmScore >= 75) return 88;
    if (wpmScore >= 70) return 82; if (wpmScore >= 65) return 75; if (wpmScore >= 60) return 66;
    if (wpmScore >= 55) return 56; if (wpmScore >= 50) return 46; if (wpmScore >= 45) return 36;
    if (wpmScore >= 40) return 28; if (wpmScore >= 35) return 20; if (wpmScore >= 30) return 12;
    if (wpmScore >= 25) return 6; if (wpmScore >= 20) return 3; return 1;
  };

  const endTest = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    document.removeEventListener('keydown', handleKeydown);

    const elapsed = (performance.now() - startTimeRef.current) / 60000;
    const minutes = Math.max(elapsed, 1 / 60);
    const total = totalStrokesRef.current;
    const incorrect = incorrectStrokesRef.current;
    const correct = correctStrokesRef.current;
    const grossWpm = Math.round(total / 5 / minutes);
    const netWpm = Math.max(0, Math.round((total - incorrect) / 5 / minutes));
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const history = wpmHistoryRef.current;
    const cons = history.length > 1
      ? Math.round(100 - (stddev(history) / (mean(history) || 1)) * 100)
      : 100;

    setResultWpm(netWpm);
    setResultRawWpm(grossWpm);
    setResultAcc(acc);
    setResultCons(Math.max(0, Math.min(100, cons)));
    setResultCorrect(correct);
    setResultTotal(total);

    const percentile = lookupPercentile(netWpm);
    setFinalPercentile(percentile);
    setGameState('result');

    dataLayer.saveSession({
      testId: 'typing-speed',
      category: 'stamina',
      rawScore: netWpm,
      percentile,
      metadata: { grossWpm, accuracy: acc, consistency: cons, characters: total, correct, incorrect, time: timerDuration }
    }).catch(() => {});

    dataLayer.getPersonalBest('typing-speed', 'higher').then(pb => setPersonalBest(pb)).catch(() => {});
    generateShareCard('Typing Speed Test', `${netWpm} WPM`, percentile).then(card => setShareImage(card)).catch(() => {});
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Escape') { resetTest(); return; }
    e.preventDefault();

    if (e.key === 'Backspace') {
      if (typedCharsRef.current.length > 0) {
        typedCharsRef.current = typedCharsRef.current.slice(0, -1);
        setRenderTick(t => t + 1);
      }
      return;
    }
    if (e.key.length !== 1) return;

    const idx = currentWordIdxRef.current;
    const word = words[idx];
    if (!word) return;

    totalStrokesRef.current += 1;

    if (e.key === ' ' || e.key === 'Enter') {
      const correct = typedCharsRef.current === word;
      const chars = typedCharsRef.current.split('').map((ch, i) => ch === word[i]);
      wordResultsRef.current[idx] = chars;
      if (!correct) {
        incorrectStrokesRef.current += word.length - chars.filter(Boolean).length;
      }
      currentWordIdxRef.current = idx + 1;
      typedCharsRef.current = '';

      if (currentWordIdxRef.current >= words.length) {
        endTest();
        return;
      }
      setRenderTick(t => t + 1);
      return;
    }

    const typed = typedCharsRef.current;
    if (typed.length < word.length) {
      typedCharsRef.current = typed + e.key;
      if (e.key === word[typed.length]) {
        correctStrokesRef.current += 1;
      } else {
        incorrectStrokesRef.current += 1;
      }
      setRenderTick(t => t + 1);
    }
  };

  const startTest = () => {
    if (submittedRef.current) return;
    setGameState('typing');
    typedCharsRef.current = '';
    currentWordIdxRef.current = 0;
    correctStrokesRef.current = 0;
    incorrectStrokesRef.current = 0;
    totalStrokesRef.current = 0;
    wordResultsRef.current = [];
    wpmHistoryRef.current = [];
    submittedRef.current = false;
    setTimeLeft(timerDuration);
    setDisplayWpm(0);
    setDisplayAcc(100);
    startTimeRef.current = performance.now();
    setRenderTick(0);

    document.addEventListener('keydown', handleKeydown);

    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, timerDuration - elapsed);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        endTest();
        return;
      }
      const mins = Math.max(elapsed / 60, 1 / 60);
      const total = totalStrokesRef.current;
      const incorrect = incorrectStrokesRef.current;
      const net = Math.max(0, Math.round((total - incorrect) / 5 / mins));
      wpmHistoryRef.current.push(net);
      setDisplayWpm(net);
      setTimeLeft(remaining);
    }, 250);

    setTimeout(() => {
      if (focusSentinelRef.current) focusSentinelRef.current.focus();
    }, 50);
  };

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    document.removeEventListener('keydown', handleKeydown);
    submittedRef.current = false;
    typedCharsRef.current = '';
    currentWordIdxRef.current = 0;
    correctStrokesRef.current = 0;
    incorrectStrokesRef.current = 0;
    totalStrokesRef.current = 0;
    wordResultsRef.current = [];
    wpmHistoryRef.current = [];
    setGameState('idle');
    setTimeLeft(timerDuration);
    setDisplayWpm(0);
    setDisplayAcc(100);
    setShareImage(null);
  };

  const copyChallengeLink = () => {
    if (typeof window === 'undefined') return;
    const token = encodeChallenge({ testId: 'typing-speed', score: resultWpm });
    const url = `${window.location.origin}/tests/typing-speed/?challenge=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(() => {});
  };

  const renderWord = (word: string, wordIdx: number) => {
    const isPast = wordIdx < currentWordIdxRef.current;
    const isCurrent = wordIdx === currentWordIdxRef.current;

    if (isPast) {
      const result = wordResultsRef.current[wordIdx];
      const allCorrect = result && result.every(Boolean);
      return (
        <span key={wordIdx} className="word" style={{
          color: allCorrect ? '#7a6a3a' : '#6a3030',
          opacity: allCorrect ? 0.8 : 0.6,
          textDecoration: allCorrect ? 'none' : 'line-through',
        }}>
          {word}
        </span>
      );
    }

    if (isCurrent) {
      const typed = typedCharsRef.current;
      return (
        <span key={wordIdx} className="word word-current" ref={wordIdx === currentWordIdxRef.current ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : undefined}>
          {word.split('').map((char, ci) => {
            if (ci < typed.length) {
              const correct = typed[ci] === char;
              return (
                <span key={ci} className="char" style={{
                  color: correct ? '#d6993a' : '#c44040',
                  background: correct ? 'transparent' : 'rgba(196,64,64,0.12)',
                  borderRadius: '2px',
                }}>
                  {char}
                </span>
              );
            }
            if (ci === typed.length) {
              return (
                <span key={ci} className="char" style={{ color: '#5a5245' }}>
                  {char}
                </span>
              );
            }
            return (
              <span key={ci} className="char" style={{ color: '#3a3530' }}>
                {char}
              </span>
            );
          })}
          <span className="cursor" />
        </span>
      );
    }

    return (
      <span key={wordIdx} className="word" style={{ color: '#3a3530' }}>
        {word}
      </span>
    );
  };

  if (gameState === 'result') {
    const hasPb = personalBest !== null;
    const isPb = hasPb && resultWpm >= personalBest;

    return (
      <div className="w-full" style={{
        background: '#0c0c0c',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: 'clamp(2rem, 5vw, 3.5rem)',
      }}>
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: '#7a7368', fontFamily: "'JetBrains Mono', monospace" }}>
              Words Per Minute
            </span>
            <div className="flex items-baseline gap-2" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              <span className="text-7xl md:text-8xl font-extrabold tracking-tight" style={{ color: '#e6dfd0', lineHeight: 1 }}>
                {resultWpm}
              </span>
              <span className="text-2xl font-normal" style={{ color: '#7a7368' }}>wpm</span>
            </div>
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#d6993a' }}>
              Top {100 - Math.round(finalPercentile)}% of typists
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 w-full max-w-lg text-center" style={{ borderTop: '1px solid #1a1a1a', paddingTop: '1.5rem' }}>
            {[
              { label: 'Accuracy', value: `${resultAcc}%` },
              { label: 'Raw WPM', value: String(resultRawWpm) },
              { label: 'Consistency', value: `${resultCons}%` },
              { label: 'Characters', value: `${resultCorrect}/${resultTotal}` },
            ].map(s => (
              <div key={s.label}>
                <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: '#7a7368', fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
                <div className="text-xl font-bold font-mono mt-0.5" style={{ color: '#e6dfd0' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ color: '#7a7368', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>
              Personal Best:{' '}
              <strong style={{ color: isPb ? '#d6993a' : '#e6dfd0' }}>
                {hasPb ? `${personalBest} WPM` : '--'}
              </strong>
            </span>
            {isPb && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(214,153,58,0.2)', color: '#d6993a' }}>
                New PB!
              </span>
            )}
          </div>

          {wpmHistoryRef.current.length > 1 && (
            <div className="w-full max-w-sm">
              <span className="text-[10px] uppercase tracking-[0.15em] block mb-2" style={{ color: '#7a7368', fontFamily: "'JetBrains Mono', monospace" }}>
                WPM Timeline
              </span>
              <div style={{ background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '0.75rem' }}>
                <svg width="100%" height="60" viewBox="0 0 300 60" style={{ stroke: '#d6993a', fill: 'none' }}>
                  <line x1="0" y1="30" x2="300" y2="30" stroke="#1a1a1a" strokeDasharray="2,2" />
                  <path d={(() => {
                    const v = wpmHistoryRef.current;
                    if (v.length < 2) return '';
                    const mx = Math.max(...v, 60), mn = Math.min(...v, 0), r = mx - mn || 1;
                    return v.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (v.length - 1)) * 300} ${60 - ((val - mn) / r) * 60}`).join(' ');
                  })()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={resetTest} className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </button>
            {shareImage && (
              <a href={shareImage} download="cogniarena-typing-score.png" className="btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Download Score
              </a>
            )}
            <button onClick={copyChallengeLink} className="btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {copiedChallenge ? 'Copied!' : 'Challenge a Friend'}
            </button>
          </div>

          <div className="text-[10px] font-mono" style={{ color: '#4a4540' }}>
            Press <kbd style={{ color: '#7a7368', border: '1px solid #1a1a1a', padding: '0 6px', borderRadius: '4px' }}>Tab</kbd> to retry
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{
      background: '#0c0c0c',
      border: '1px solid #1a1a1a',
      borderRadius: '12px',
      padding: 'clamp(1.5rem, 4vw, 3rem)',
    }}>
      {gameState === 'idle' ? (
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">⌨️</span>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#e6dfd0', fontFamily: "'Epilogue', sans-serif" }}>
              Typing Speed Test
            </h2>
          </div>

          <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {([15, 30, 60, 120] as TimerOption[]).map(t => (
              <button
                key={t}
                onClick={() => { setTimerDuration(t); setTimeLeft(t); }}
                className="px-4 py-1.5 rounded text-xs font-mono transition-all cursor-pointer select-none"
                style={{
                  background: timerDuration === t ? 'rgba(214,153,58,0.15)' : 'transparent',
                  color: timerDuration === t ? '#d6993a' : '#7a7368',
                  border: `1px solid ${timerDuration === t ? 'rgba(214,153,58,0.3)' : '#1a1a1a'}`,
                }}
              >
                {t}s
              </button>
            ))}
          </div>

          <div className="w-full max-w-2xl" style={{ opacity: 0.3, lineHeight: '2', maxHeight: '100px', overflow: 'hidden', maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', color: '#7a7368', letterSpacing: '0.03em' }}>
              {words.map((w, i) => (
                <span key={i} className="inline mr-3">{w}</span>
              ))}
            </div>
          </div>

          <button onClick={startTest} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Typing Test
          </button>

          <p className="text-xs font-mono" style={{ color: '#5a5245' }}>
            Press any key or click to begin &middot; <kbd style={{ border: '1px solid #1a1a1a', padding: '0 5px', borderRadius: '3px' }}>Tab</kbd> to restart
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-10 md:gap-16">
            {[
              { label: 'WPM', value: String(displayWpm), color: '#d6993a' },
              { label: 'ACC', value: `${displayAcc}%`, color: '#e6dfd0' },
              { label: 'TIME', value: `${Math.ceil(timeLeft)}s`, color: timeLeft <= 5 ? '#c44040' : '#e6dfd0' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: '#7a7368' }}>{s.label}</span>
                <span className="text-xl font-bold transition-all duration-150" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div ref={wordsContainerRef} className="w-full max-w-3xl mx-auto select-none outline-none" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
            lineHeight: '2',
            letterSpacing: '0.03em',
            minHeight: '200px',
          }}>
            {words.map((word, i) => renderWord(word, i))}
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] font-mono" style={{ color: '#4a4540' }}>
            <span>Type the words shown above</span>
            <span>&middot;</span>
            <span><kbd style={{ border: '1px solid #1a1a1a', padding: '0 5px', borderRadius: '3px' }}>Esc</kbd> or <kbd style={{ border: '1px solid #1a1a1a', padding: '0 5px', borderRadius: '3px' }}>Tab</kbd> to restart</span>
          </div>
        </div>
      )}

      <div ref={focusSentinelRef} tabIndex={-1} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />

      <style>{`
        .word { display: inline; margin-right: 0.75rem; white-space: pre; }
        .word-current { color: #e6dfd0; position: relative; }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: #d6993a;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: cursorPulse 1s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(214,153,58,0.5);
        }
        @keyframes cursorPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Epilogue', sans-serif;
          background: #d6993a;
          color: #0c0c0c;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-primary:hover {
          box-shadow: 0 0 24px rgba(214,153,58,0.25);
          transform: scale(1.02);
        }
        .btn-primary:active { transform: scale(0.98); }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Epilogue', sans-serif;
          background: #1a1a1a;
          color: #e6dfd0;
          border: 1px solid #1a1a1a;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .btn-secondary:hover { border-color: #d6993a; color: #d6993a; }
        .char { transition: color 0.05s ease; }
      `}</style>
    </div>
  );
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stddev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sq, n) => sq + (n - m) ** 2, 0) / arr.length);
}
