import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { encodeChallenge, generateShareCard } from '../../runtime/share';
import percentilesData from '../../data/percentiles.json';
import { PASSAGE_CATEGORIES } from '../../data/passages';
import { redirectToResults } from '../../runtime/redirectToResults';

type GameState = 'idle' | 'typing' | 'result';
type TimeOption = 15 | 30 | 60 | 120;
type WordOption = 10 | 25 | 50 | 100;
type TestMode = 'time' | 'words';

interface StatsSnapshot {
  wpm: number; rawWpm: number; acc: number; consistency: number;
  correct: number; incorrect: number; total: number;
  burstSpeed: number; reactionDelay: number; backspaces: number;
  peakWpm: number; wpmSamples: { wpm: number; raw: number; acc: number; t: number }[];
  charErrors: Record<string, { wrong: number; total: number }>;
  wordTimings: number[];
}

class TypingEngine {
  words: string[] = [];
  currentWordIdx = 0;
  typedChars = '';
  wordResults: boolean[][] = [];
  extraChars: string[] = [];
  correctStrokes = 0;
  incorrectStrokes = 0;
  totalStrokes = 0;
  startTime = 0;
  timerDuration = 60;
  timeRemaining = 60;
  isActive = false;
  submitted = false;
  capsLockOn = false;
  isWordMode = false;
  wordCount = 25;
  backspaceCount = 0;
  lastKeyTime = 0;
  keyIntervals: number[] = [];
  wordStartTime = 0;
  wordTimings: number[] = [];
  reactionDelay = 0;
  firstKeyTimes: number[] = [];
  charErrors: Record<string, { wrong: number; total: number }> = {};
  wpmSamples: { wpm: number; raw: number; acc: number; t: number }[] = [];
  burstSpeed = 0;
  onUpdate: () => void = () => {};
  private rafId: number | null = null;
  private lastSampleSec = -1;
  private isComposing = false;
  waitingForFirstKey = false;

  init(words: string[], duration: number, mode: TestMode, count: number) {
    this.words = words;
    this.timerDuration = duration;
    this.isWordMode = mode === 'words';
    this.wordCount = count;
    this.reset();
    this.waitingForFirstKey = true;
  }

  reset() {
    this.currentWordIdx = 0;
    this.typedChars = '';
    this.wordResults = [];
    this.extraChars = [];
    this.correctStrokes = 0;
    this.incorrectStrokes = 0;
    this.totalStrokes = 0;
    this.startTime = 0;
    this.timeRemaining = this.timerDuration;
    this.isActive = false;
    this.submitted = false;
    this.capsLockOn = false;
    this.wpmSamples = [];
    this.lastSampleSec = -1;
    this.backspaceCount = 0;
    this.keyIntervals = [];
    this.lastKeyTime = 0;
    this.wordStartTime = 0;
    this.wordTimings = [];
    this.reactionDelay = 0;
    this.firstKeyTimes = [];
    this.charErrors = {};
    this.burstSpeed = 0;
    this.isComposing = false;
    this.cancelFrame();
  }

  start(now: number) {
    if (this.submitted) return;
    this.isActive = true;
    this.waitingForFirstKey = false;
    this.startTime = now;
    this.wordStartTime = now;
    this.lastKeyTime = now;
    this.timeRemaining = this.timerDuration;
    this.lastSampleSec = -1;
    this.scheduleFrame();
  }

  private scheduleFrame() {
    if (this.submitted) return;
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private cancelFrame() {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  private tick() {
    if (this.submitted || !this.isActive) return;
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    this.timeRemaining = Math.max(0, this.timerDuration - elapsed);
    if (this.timeRemaining <= 0 || (this.isWordMode && this.currentWordIdx >= this.wordCount)) {
      this.endTest(); return;
    }
    const sec = Math.floor(elapsed);
    if (sec > this.lastSampleSec && sec > 0) {
      this.lastSampleSec = sec;
      const mins = Math.max(elapsed / 60, 1 / 60);
      const t = this.totalStrokes;
      const inc = this.incorrectStrokes;
      const net = Math.max(0, Math.round((t - inc) / 5 / mins));
      const gross = Math.round(t / 5 / mins);
      const acc = t > 0 ? Math.round((this.correctStrokes / t) * 100) : 100;
      this.wpmSamples.push({ wpm: net, raw: gross, acc, t: now });
    }
    this.onUpdate();
    this.scheduleFrame();
  }

  endTest() {
    if (this.submitted) return;
    this.submitted = true;
    this.isActive = false;
    this.cancelFrame();
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.timeRemaining = Math.max(0, this.timerDuration - elapsed);
    this.burstSpeed = this.calcBurst();
    this.reactionDelay = this.firstKeyTimes.length > 0
      ? Math.round(this.firstKeyTimes.reduce((a, b) => a + b, 0) / this.firstKeyTimes.length)
      : 0;
    this.onUpdate();
  }

  private calcBurst(): number {
    const windowSize = 5;
    let peak = 0;
    for (let i = 0; i < this.wordTimings.length - windowSize; i++) {
      const totalTime = this.wordTimings.slice(i, i + windowSize).reduce((a, b) => a + b, 0) / 1000;
      if (totalTime > 0) {
        const burst = Math.round((windowSize / 5) / (totalTime / 60));
        peak = Math.max(peak, burst);
      }
    }
    return peak;
  }

  setComposing(v: boolean) { this.isComposing = v; }

  handleKeydown(e: KeyboardEvent): boolean {
    if (this.isComposing && e.key !== 'Escape') return false;
    if (e.key === 'Tab') { e.preventDefault(); this.reset(); this.onUpdate(); return true; }
    if (e.key === 'Escape') {
      if (this.isActive || this.submitted) { this.reset(); this.onUpdate(); return true; }
      return false;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) {
      if (['a','c','v','x','z'].includes(e.key.toLowerCase())) { e.preventDefault(); return true; }
      return false;
    }
    e.preventDefault();
    this.capsLockOn = e.getModifierState('CapsLock');
    if (e.key === 'Dead' || e.key.length !== 1 && e.key !== 'Backspace' && e.key !== 'Enter') return true;

    const now = performance.now();
    if (this.lastKeyTime > 0) this.keyIntervals.push(now - this.lastKeyTime);
    this.lastKeyTime = now;

    if (e.key === 'Backspace') {
      if (this.typedChars.length > 0) {
        const last = this.typedChars[this.typedChars.length - 1];
        this.typedChars = this.typedChars.slice(0, -1);
        if (this.extraChars.length > 0) this.extraChars.pop();
        if (last && this.currentWordIdx < this.words.length) {
          const w = this.words[this.currentWordIdx];
          const idx = this.typedChars.length;
          if (idx < w.length && last === w[idx]) {
            this.correctStrokes = Math.max(0, this.correctStrokes - 1);
          } else {
            this.incorrectStrokes = Math.max(0, this.incorrectStrokes - 1);
          }
          this.totalStrokes = Math.max(0, this.totalStrokes - 1);
        }
        this.backspaceCount++;
      }
      this.onUpdate(); return true;
    }

    if (e.key.length !== 1) return true;
    if (!this.isActive) {
      this.start(now);
      this.firstKeyTimes.push(0);
    }
    const word = this.words[this.currentWordIdx];
    if (!word) return true;
    this.totalStrokes++;

    if (e.key === ' ' || e.key === 'Enter') {
      const isCorrect = this.typedChars === word;
      const chars = this.typedChars.split('').map((ch, i) => ch === word[i]);
      this.wordResults[this.currentWordIdx] = chars;
      if (!isCorrect) {
        const typedLen = this.typedChars.length;
        const wordLen = word.length;
        const correctCount = chars.filter(Boolean).length;
        this.incorrectStrokes += Math.max(0, typedLen - correctCount) + Math.max(0, wordLen - typedLen);
      }
      this.wordTimings.push(now - this.wordStartTime);
      this.currentWordIdx++;
      this.typedChars = '';
      this.extraChars = [];
      this.wordStartTime = now;
      if (this.currentWordIdx >= this.words.length) { this.endTest(); return true; }
      if (this.isWordMode && this.currentWordIdx >= this.wordCount) { this.endTest(); return true; }
      this.onUpdate(); return true;
    }

    const typed = this.typedChars;
    this.trackChar(word[typed.length] || '_', e.key);
    if (typed.length < word.length) {
      this.typedChars = typed + e.key;
      if (e.key === word[typed.length]) this.correctStrokes++;
      else this.incorrectStrokes++;
    } else {
      this.typedChars = typed + e.key;
      this.extraChars.push(e.key);
      this.incorrectStrokes++;
    }
    this.onUpdate(); return true;
  }

  private trackChar(expected: string, actual: string) {
    if (!this.charErrors[expected]) this.charErrors[expected] = { wrong: 0, total: 0 };
    this.charErrors[expected].total++;
    if (expected !== actual) this.charErrors[expected].wrong++;
  }

  get stats(): StatsSnapshot {
    const elapsed = this.isActive
      ? (performance.now() - this.startTime) / 1000
      : this.timerDuration - this.timeRemaining;
    const minutes = Math.max(elapsed / 60, 1 / 60);
    const t = this.totalStrokes;
    const inc = this.incorrectStrokes;
    const gross = Math.round(t / 5 / minutes);
    const net = Math.max(0, Math.round((t - inc) / 5 / minutes));
    const acc = t > 0 ? Math.round((this.correctStrokes / t) * 100) : 100;
    const hist = this.wpmSamples.map(s => s.wpm);
    const cons = hist.length > 1
      ? Math.round(100 - (stddev(hist) / (mean(hist) || 1)) * 100)
      : 100;
    const peak = hist.length > 0 ? Math.max(...hist) : 0;
    return {
      wpm: net, rawWpm: gross, acc, consistency: Math.max(0, Math.min(100, cons)),
      correct: this.correctStrokes, incorrect: this.incorrectStrokes, total: t,
      burstSpeed: this.burstSpeed || peak, reactionDelay: this.reactionDelay,
      backspaces: this.backspaceCount, peakWpm: peak,
      wpmSamples: this.wpmSamples, charErrors: this.charErrors, wordTimings: this.wordTimings,
    };
  }
}

function mean(a: number[]): number { return a.length === 0 ? 0 : a.reduce((s, n) => s + n, 0) / a.length; }
function stddev(a: number[]): number {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, n) => s + (n - m) ** 2, 0) / a.length);
}

function interpolatePercentile(score: number): number {
  const table = (percentilesData as Record<string, { score: number; percentile: number }[]>)['typing-speed'];
  if (!table || table.length === 0) {
    if (score >= 120) return 99.9; if (score >= 100) return 99;
    if (score >= 80) return 93; if (score >= 60) return 66;
    if (score >= 40) return 28; return 1;
  }
  if (score <= table[0].score) return table[0].percentile;
  if (score >= table[table.length - 1].score) return table[table.length - 1].percentile;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
    if (score >= a.score && score <= b.score) {
      const t = (score - a.score) / (b.score - a.score);
      return a.percentile + t * (b.percentile - a.percentile);
    }
  }
  return 50;
}

export default function TypingSpeedTest() {
  const engineRef = useRef<TypingEngine>(new TypingEngine());
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [, setRenderTick] = useState(0);
  const [timerDuration, setTimerDuration] = useState<TimeOption>(60);
  const [testMode, setTestMode] = useState<TestMode>('time');
  const [wordCount, setWordCount] = useState<WordOption>(25);
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [passageIdx, setPassageIdx] = useState(() => Math.floor(Math.random() * PASSAGE_CATEGORIES[0].passages.length));
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [displayWpm, setDisplayWpm] = useState(0);
  const [displayAcc, setDisplayAcc] = useState(100);
  const [displayTime, setDisplayTime] = useState(60);
  const [capsLockWarning, setCapsLockWarning] = useState(false);
  const [resultStats, setResultStats] = useState<StatsSnapshot | null>(null);
  const [finalPercentile, setFinalPercentile] = useState(0);

  const engine = engineRef.current;
  const rerender = useCallback(() => setRenderTick(t => t + 1), []);
  engine.onUpdate = rerender;

  // Cursor positioning — Monkeytype-style absolute positioning
  const updateCursor = useCallback(() => {
    const cursor = cursorRef.current;
    const wordsEl = wordsRef.current;
    if (!cursor || !wordsEl || engine.submitted) { if (cursor) cursor.style.opacity = '0'; return; }
    const wordSpans = wordsEl.querySelectorAll<HTMLElement>('[data-word-idx]');
    const currentWordEl = wordsEl.querySelector<HTMLElement>(`[data-word-idx="${engine.currentWordIdx}"]`);
    if (!currentWordEl) { cursor.style.opacity = '0'; return; }
    const containerRect = wordsEl.getBoundingClientRect();
    const charIdx = engine.typedChars.length;
    const charSpans = currentWordEl.querySelectorAll<HTMLElement>('[data-char-idx]');
    let targetRect: DOMRect | null = null;
    if (charIdx < charSpans.length) {
      targetRect = charSpans[charIdx].getBoundingClientRect();
      cursor.style.left = `${targetRect.left - containerRect.left}px`;
      cursor.style.top = `${targetRect.top - containerRect.top}px`;
      cursor.style.height = `${targetRect.height}px`;
    } else if (charSpans.length > 0) {
      const lastChar = charSpans[charSpans.length - 1];
      targetRect = lastChar.getBoundingClientRect();
      cursor.style.left = `${targetRect.right - containerRect.left}px`;
      cursor.style.top = `${targetRect.top - containerRect.top}px`;
      cursor.style.height = `${targetRect.height}px`;
    } else {
      const wordRect = currentWordEl.getBoundingClientRect();
      cursor.style.left = `${wordRect.left - containerRect.left}px`;
      cursor.style.top = `${wordRect.top - containerRect.top}px`;
      cursor.style.height = `${wordRect.height}px`;
    }
    cursor.style.opacity = '1';
    // Suppress unused var warning
    void wordSpans;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Line management — auto-scroll to keep current line visible
  const updateScroll = useCallback(() => {
    const wordsEl = wordsRef.current;
    if (!wordsEl) return;
    const currentWordEl = wordsEl.querySelector<HTMLElement>(`[data-word-idx="${engine.currentWordIdx}"]`);
    if (!currentWordEl) return;
    const containerHeight = wordsEl.parentElement?.clientHeight || 200;
    const lineHeight = currentWordEl.offsetHeight || 30;
    const visibleLines = Math.max(1, Math.floor(containerHeight / lineHeight));
    const maxScroll = Math.max(0, wordsEl.scrollHeight - containerHeight);
    const wordTop = currentWordEl.offsetTop;
    const targetLine = Math.floor(wordTop / lineHeight);
    const centerOffset = Math.floor(visibleLines / 2);
    const scrollTarget = Math.max(0, (targetLine - centerOffset) * lineHeight);
    wordsEl.style.transform = `translateY(-${Math.min(scrollTarget, maxScroll)}px)`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (gameState === 'typing') {
      setDisplayWpm(engine.stats.wpm);
      setDisplayAcc(engine.stats.acc);
      setDisplayTime(Math.ceil(engine.timeRemaining));
      setCapsLockWarning(engine.capsLockOn);
      requestAnimationFrame(() => { updateCursor(); updateScroll(); });
    }
  }, [gameState, engine, updateCursor, updateScroll]);

  // Re-position cursor on every render tick during typing
  useEffect(() => {
    if (gameState === 'typing') {
      setDisplayWpm(engine.stats.wpm);
      setDisplayAcc(engine.stats.acc);
      setDisplayTime(Math.ceil(engine.timeRemaining));
      setCapsLockWarning(engine.capsLockOn);
      requestAnimationFrame(updateCursor);
    }
  });

  useEffect(() => {
    if (engine.submitted && gameState !== 'result') {
      const stats = engine.stats;
      setResultStats(stats);
      setGameState('result');
      const percentile = interpolatePercentile(stats.wpm);
      setFinalPercentile(percentile);
      dataLayer.saveSession({
        testId: 'typing-speed', category: 'stamina', rawScore: stats.wpm, percentile,
        metadata: {
          rawWpm: stats.rawWpm, accuracy: stats.acc, consistency: stats.consistency,
          characters: stats.total, correct: stats.correct, incorrect: stats.incorrect,
          time: timerDuration, mode: testMode,
          wordCount: testMode === 'words' ? wordCount : undefined,
          burstSpeed: stats.burstSpeed, reactionDelay: stats.reactionDelay,
          backspaces: stats.backspaces,
        },
      }).catch(() => {});
      dataLayer.getPersonalBest('typing-speed', 'higher').then(pb => setPersonalBest(pb)).catch(() => {});
      generateShareCard('Typing Speed Test', `${stats.wpm} WPM`, percentile).then(card => setShareImage(card)).catch(() => {});

      redirectToResults({
        testId: 'typing-speed', testName: 'Typing Speed', attempts: stats.wpmSamples.length > 0 ? stats.wpmSamples.map(s => s.wpm) : [stats.wpm], unit: 'WPM',
        percentile, personalBest: null, category: 'stamina', average: stats.wpm,
      });
    }
  }, [engine.submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard event handling with IME/composition guards
  useEffect(() => {
    if (gameState !== 'typing') return;
    const handler = (e: KeyboardEvent) => { engine.handleKeydown(e); };
    const compositionStart = () => { engine.setComposing(true); };
    const compositionEnd = () => { engine.setComposing(false); };
    const paste = (e: ClipboardEvent) => { e.preventDefault(); };
    const copy = (e: ClipboardEvent) => { e.preventDefault(); };
    document.addEventListener('keydown', handler);
    document.addEventListener('compositionstart', compositionStart);
    document.addEventListener('compositionend', compositionEnd);
    document.addEventListener('paste', paste);
    document.addEventListener('copy', copy);
    // Visibility change for timing correction
    const visChange = () => {
      if (document.hidden && engine.isActive) {
        // Timer continues via performance.now() — no action needed
      }
    };
    document.addEventListener('visibilitychange', visChange);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('compositionstart', compositionStart);
      document.removeEventListener('compositionend', compositionEnd);
      document.removeEventListener('paste', paste);
      document.removeEventListener('copy', copy);
      document.removeEventListener('visibilitychange', visChange);
    };
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickRandomPassage = useCallback((catIdx: number, excludeIdx?: number) => {
    const cat = PASSAGE_CATEGORIES[catIdx];
    if (!cat) return 0;
    const len = cat.passages.length;
    if (len <= 1) return 0;
    let idx: number;
    do { idx = Math.floor(Math.random() * len); } while (idx === excludeIdx);
    return idx;
  }, []);

  const startTest = () => {
    engine.reset();
    const newPassageIdx = pickRandomPassage(categoryIdx, passageIdx);
    setPassageIdx(newPassageIdx);
    const cat = PASSAGE_CATEGORIES[categoryIdx];
    const passageText = cat ? cat.passages[newPassageIdx % cat.passages.length].text : PASSAGE_CATEGORIES[0].passages[0].text;
    const words = passageText.split(/\s+/).filter(Boolean);
    engine.init(words, timerDuration, testMode, wordCount);
    setDisplayWpm(0); setDisplayAcc(100); setDisplayTime(timerDuration);
    setCapsLockWarning(false); setShareImage(null); setResultStats(null);
    setGameState('typing');
    requestAnimationFrame(() => {
      if (wordsRef.current) wordsRef.current.style.transform = 'translateY(0)';
      updateCursor();
    });
  };

  const resetTest = () => {
    engine.reset();
    setPassageIdx(pickRandomPassage(categoryIdx, passageIdx));
    setGameState('idle');
    setDisplayWpm(0); setDisplayAcc(100); setDisplayTime(timerDuration);
    setCapsLockWarning(false); setShareImage(null); setResultStats(null);
  };

  const copyChallengeLink = () => {
    if (!resultStats) return;
    const token = encodeChallenge({ testId: 'typing-speed', score: resultStats.wpm });
    const url = `${window.location.origin}/tests/typing-speed/?challenge=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2000);
    }).catch(() => {});
  };

  const switchCategory = (idx: number) => { setCategoryIdx(idx); setPassageIdx(pickRandomPassage(idx)); };

  // Detect engine reset (Tab/Esc pressed during typing) and return to idle with new passage
  useEffect(() => {
    if (engine.waitingForFirstKey) return;
    if (gameState === 'typing' && !engine.isActive && !engine.submitted && engine.currentWordIdx === 0) {
      setPassageIdx(pickRandomPassage(categoryIdx, passageIdx));
      setGameState('idle');
      setDisplayWpm(0); setDisplayAcc(100); setDisplayTime(timerDuration);
      setCapsLockWarning(false);
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const words = engine.words;
  const currentWordIdx = engine.currentWordIdx;
  const typedChars = engine.typedChars;
  const wordResults = engine.wordResults;

  // Render a single word with per-character spans for cursor tracking
  const renderWord = (word: string, wordIdx: number) => {
    const isPast = wordIdx < currentWordIdx;
    const isCurrent = wordIdx === currentWordIdx;
    if (isPast) {
      const result = wordResults[wordIdx];
      const allCorrect = result && result.every(Boolean);
      return (
        <span key={wordIdx} data-word-idx={wordIdx} className="tts-word tts-word-past"
          style={{ color: allCorrect ? 'var(--tts-past-correct)' : 'var(--tts-past-incorrect)', opacity: allCorrect ? 0.8 : 0.6, textDecoration: allCorrect ? 'none' : 'line-through' }}>
          {word.split('').map((ch, ci) => (
            <span key={ci} data-char-idx={ci} className="tts-char">{ch}</span>
          ))}
        </span>
      );
    }
    if (isCurrent) {
      const typed = typedChars;
      const extra = engine.extraChars;
      return (
        <span key={wordIdx} data-word-idx={wordIdx} className="tts-word tts-word-current">
          {word.split('').map((char, ci) => {
            if (ci < typed.length) {
              const correct = typed[ci] === char;
              return (
                <span key={ci} data-char-idx={ci} className="tts-char"
                  style={{ color: correct ? 'var(--tts-correct)' : 'var(--tts-incorrect)', background: correct ? 'transparent' : 'var(--tts-incorrect-bg)', borderRadius: '2px' }}>
                  {char}
                </span>
              );
            }
            if (ci === typed.length) {
              return (
                <span key={ci} data-char-idx={ci} className="tts-char tts-char-active" style={{ color: 'var(--tts-faint)' }}>
                  {char}
                </span>
              );
            }
            return (
              <span key={ci} data-char-idx={ci} className="tts-char" style={{ color: 'var(--tts-dim)' }}>
                {char}
              </span>
            );
          })}
          {extra.map((ch, ei) => (
            <span key={`e${ei}`} data-char-idx={word.length + ei} className="tts-char"
              style={{ color: 'var(--tts-incorrect)', background: 'var(--tts-incorrect-bg)', borderRadius: '2px' }}>
              {ch}
            </span>
          ))}
        </span>
      );
    }
    return (
      <span key={wordIdx} data-word-idx={wordIdx} className="tts-word tts-word-future" style={{ color: 'var(--tts-dim)' }}>
        {word.split('').map((ch, ci) => (
          <span key={ci} data-char-idx={ci} className="tts-char">{ch}</span>
        ))}
      </span>
    );
  };

  // ===== RESULT SCREEN =====
  if (gameState === 'result' && resultStats) {
    const hasPb = personalBest !== null;
    const isPb = hasPb && resultStats.wpm >= personalBest;
    const rs = resultStats;
    const maxWpm = Math.max(...rs.wpmSamples.map(s => s.wpm), rs.wpm, 60);

    return (
      <div className="w-full tts-panel" style={{ padding: 'clamp(2rem, 5vw, 3.5rem)' }}>
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="tts-label">Words Per Minute</span>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl md:text-8xl font-extrabold tracking-tight" style={{ color: 'var(--tts-text)', lineHeight: 1 }}>{rs.wpm}</span>
              <span className="text-2xl font-normal" style={{ color: 'var(--tts-muted)' }}>wpm</span>
            </div>
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--tts-accent)' }}>
              Top {Math.round(100 - finalPercentile)}% of typists
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 w-full max-w-lg text-center" style={{ borderTop: '1px solid var(--tts-border)', paddingTop: '1.5rem' }}>
            {[
              { label: 'Accuracy', value: `${rs.acc}%` },
              { label: 'Raw WPM', value: String(rs.rawWpm) },
              { label: 'Consistency', value: `${rs.consistency}%` },
              { label: 'Characters', value: `${rs.correct}/${rs.total}` },
              { label: 'Burst Speed', value: `${rs.burstSpeed} wpm` },
              { label: 'Reaction', value: `${rs.reactionDelay}ms` },
              { label: 'Backspaces', value: String(rs.backspaces) },
              { label: 'Peak WPM', value: String(rs.peakWpm) },
            ].map(s => (
              <div key={s.label}>
                <span className="tts-label">{s.label}</span>
                <div className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--tts-text)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--tts-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>Personal Best: <strong style={{ color: isPb ? 'var(--tts-accent)' : 'var(--tts-text)' }}>{hasPb ? `${personalBest} WPM` : '--'}</strong></span>
            {isPb && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--tts-accent-bg)', color: 'var(--tts-accent)' }}>New PB!</span>}
          </div>

          {/* WPM + Accuracy Chart */}
          {rs.wpmSamples.length > 1 && (
            <div className="w-full max-w-md">
              <span className="tts-label block mb-2">Performance Timeline</span>
              <div style={{ background: 'var(--tts-bg)', border: '1px solid var(--tts-border)', borderRadius: '8px', padding: '0.75rem' }}>
                <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                  <line x1="0" y1="40" x2="300" y2="40" stroke="var(--tts-border)" strokeDasharray="2,2" />
                  {/* WPM line */}
                  <path d={(() => {
                    const v = rs.wpmSamples.map(s => s.wpm);
                    if (v.length < 2) return '';
                    return v.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (v.length - 1)) * 300} ${80 - (val / maxWpm) * 75}`).join(' ');
                  })()} strokeWidth="2" stroke="var(--tts-accent)" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Accuracy line */}
                  <path d={(() => {
                    const v = rs.wpmSamples.map(s => s.acc);
                    if (v.length < 2) return '';
                    return v.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (v.length - 1)) * 300} ${80 - (val / 100) * 75}`).join(' ');
                  })()} strokeWidth="1.5" stroke="var(--accent)" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                </svg>
                <div className="flex justify-between text-[9px] font-mono mt-1" style={{ color: 'var(--tts-faint)' }}>
                  <span style={{ color: 'var(--tts-accent)' }}>WPM</span>
                  <span style={{ color: 'var(--accent)' }}>Accuracy</span>
                </div>
              </div>
            </div>
          )}

          {/* Character Error Heatmap */}
          {Object.keys(rs.charErrors).length > 0 && (
            <div className="w-full max-w-md">
              <span className="tts-label block mb-2">Error Heatmap</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(rs.charErrors)
                  .filter(([, v]) => v.wrong > 0)
                  .sort((a, b) => b[1].wrong - a[1].wrong)
                  .slice(0, 20)
                  .map(([char, data]) => {
                    const intensity = Math.min(1, data.wrong / Math.max(1, data.total) * 3);
                    return (
                      <span key={char} className="inline-flex items-center justify-center w-7 h-7 rounded text-xs font-mono"
                        style={{ background: `rgba(196,64,64,${0.1 + intensity * 0.4})`, color: 'var(--tts-text)', border: '1px solid rgba(196,64,64,0.3)' }}>
                        {char === ' ' ? '␣' : char}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={startTest} className="tts-btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </button>
            {shareImage && (
              <a href={shareImage} download="cogniarena-typing-score.png" className="tts-btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Download Score
              </a>
            )}
            <button onClick={copyChallengeLink} className="tts-btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {copiedChallenge ? 'Copied!' : 'Challenge a Friend'}
            </button>
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'var(--tts-faint)' }}>
            Press <kbd style={{ color: 'var(--tts-muted)', border: '1px solid var(--tts-border)', padding: '0 6px', borderRadius: '4px' }}>Tab</kbd> to retry
          </div>
        </div>
      </div>
    );
  }

  // ===== IDLE + TYPING SCREENS =====
  return (
    <div className="w-full tts-panel" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
      {gameState === 'idle' ? (
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--tts-text)' }}>Typing Speed Test</h2>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <button onClick={() => setTestMode('time')} className="tts-opt" style={{ background: testMode === 'time' ? 'var(--tts-accent-bg)' : 'transparent', color: testMode === 'time' ? 'var(--tts-accent)' : 'var(--tts-muted)', borderColor: testMode === 'time' ? 'var(--tts-accent-border)' : 'var(--tts-border)' }}>Time</button>
            <button onClick={() => setTestMode('words')} className="tts-opt" style={{ background: testMode === 'words' ? 'var(--tts-accent-bg)' : 'transparent', color: testMode === 'words' ? 'var(--tts-accent)' : 'var(--tts-muted)', borderColor: testMode === 'words' ? 'var(--tts-accent-border)' : 'var(--tts-border)' }}>Words</button>
          </div>
          <div className="flex items-center gap-2 font-mono">
            {(testMode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(v => (
              <button key={v} onClick={() => testMode === 'time' ? setTimerDuration(v as TimeOption) : setWordCount(v as WordOption)}
                className="tts-opt"
                style={{ background: (testMode === 'time' ? timerDuration === v : wordCount === v) ? 'var(--tts-accent-bg)' : 'transparent', color: (testMode === 'time' ? timerDuration === v : wordCount === v) ? 'var(--tts-accent)' : 'var(--tts-muted)', borderColor: (testMode === 'time' ? timerDuration === v : wordCount === v) ? 'var(--tts-accent-border)' : 'var(--tts-border)' }}>
                {testMode === 'time' ? `${v}s` : v}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <span className="tts-label">Passage Category</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PASSAGE_CATEGORIES.map((cat, idx) => (
                <button key={cat.id} onClick={() => switchCategory(idx)} className="tts-opt"
                  style={{ background: categoryIdx === idx ? 'var(--tts-accent-bg)' : 'transparent', color: categoryIdx === idx ? 'var(--tts-accent)' : 'var(--tts-muted)', borderColor: categoryIdx === idx ? 'var(--tts-accent-border)' : 'var(--tts-border)' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--tts-faint)' }}>
              Passage {passageIdx + 1} of {PASSAGE_CATEGORIES[categoryIdx].passages.length} &mdash; randomizes on each attempt
            </span>
          </div>
          <div className="w-full max-w-2xl" style={{ opacity: 0.3, lineHeight: '2', maxHeight: '100px', overflow: 'hidden', maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)' }}>
            <div className="tts-words-preview">
              {PASSAGE_CATEGORIES[categoryIdx].passages[passageIdx].text.split(/\s+/).filter(Boolean).map((w, i) => (
                <span key={i} className="tts-word" style={{ marginRight: '0.35em' }}>{w}</span>
              ))}
            </div>
          </div>
          <button onClick={startTest} className="tts-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Typing Test
          </button>
          <p className="text-xs font-mono" style={{ color: 'var(--tts-faint)' }}>
            Press any key to begin &middot; <kbd style={{ border: '1px solid var(--tts-border)', padding: '0 5px', borderRadius: '3px' }}>Tab</kbd> to restart
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Live Stats Bar */}
          <div className="flex items-center justify-center gap-10 md:gap-16">
            {[
              { label: 'WPM', value: String(displayWpm), color: 'var(--tts-accent)' },
              { label: 'ACC', value: `${displayAcc}%`, color: 'var(--tts-text)' },
              { label: testMode === 'time' ? 'TIME' : 'WORDS', value: testMode === 'time' ? `${displayTime}s` : `${currentWordIdx}/${wordCount}`, color: testMode === 'time' && displayTime <= 5 ? 'var(--tts-incorrect)' : 'var(--tts-text)' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 font-mono">
                <span className="tts-label">{s.label}</span>
                <span className="text-xl font-bold transition-all duration-150" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {capsLockWarning && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono" style={{ color: 'var(--tts-accent)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Caps Lock is on
            </div>
          )}

          {/* Words Container with cursor and line management */}
          <div className="tts-words-outer" style={{ height: 'calc(1.8em * 3 + 0.5rem)', overflow: 'hidden', position: 'relative' }}>
            <div ref={wordsRef} id="typing-words-container" tabIndex={-1}
              className="tts-words-inner"
              style={{ position: 'relative', transition: 'transform 0.15s ease', outline: 'none' }}>
              {/* Absolute-positioned cursor */}
              <div ref={cursorRef} className="tts-cursor" />
              {words.slice(Math.max(0, currentWordIdx - 30), Math.min(words.length, currentWordIdx + 120)).map((word, i) => {
                const actualIdx = Math.max(0, currentWordIdx - 30) + i;
                return renderWord(word, actualIdx);
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] font-mono" style={{ color: 'var(--tts-faint)' }}>
            <span>Type the words shown above</span>
            <span>&middot;</span>
            <span><kbd style={{ border: '1px solid var(--tts-border)', padding: '0 5px', borderRadius: '3px' }}>Esc</kbd> or <kbd style={{ border: '1px solid var(--tts-border)', padding: '0 5px', borderRadius: '3px' }}>Tab</kbd> to restart</span>
          </div>
        </div>
      )}

      <style>{`
        .tts-panel { background: var(--tts-bg); border: 1px solid var(--tts-border); border-radius: 12px; }
        .tts-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--tts-muted); font-family: 'JetBrains Mono', monospace; }
        .tts-opt { padding: 0.375rem 1rem; border-radius: 6px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; border: 1px solid; transition: all 0.15s ease; cursor: pointer; user-select: none; }
        .tts-btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: var(--tts-accent); color: var(--tts-bg); border: none; cursor: pointer; transition: all 0.15s ease; }
        .tts-btn-primary:hover { box-shadow: 0 0 24px rgba(214,153,58,0.25); transform: scale(1.02); }
        .tts-btn-primary:active { transform: scale(0.98); }
        .tts-btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: var(--tts-border); color: var(--tts-text); border: 1px solid var(--tts-border); cursor: pointer; transition: all 0.15s ease; text-decoration: none; }
        .tts-btn-secondary:hover { border-color: var(--tts-accent); color: var(--tts-accent); }
        .tts-words-preview { font-family: 'JetBrains Mono', monospace; font-size: clamp(0.9rem, 2.5vw, 1.2rem); color: var(--tts-muted); letter-spacing: 0.03em; display: flex; flex-wrap: wrap; }
        .tts-words-inner { font-family: 'JetBrains Mono', monospace; font-size: clamp(1rem, 2.5vw, 1.35rem); line-height: 1.8; letter-spacing: 0.03em; display: flex; flex-wrap: wrap; align-items: flex-start; align-content: flex-start; min-height: 100%; }
        .tts-word { margin-right: 0.35em; white-space: nowrap; contain: layout style; }
        .tts-char { display: inline; transition: color 0.05s ease; }
        .tts-cursor { position: absolute; width: 2px; background: var(--tts-accent); border-radius: 1px; z-index: 10; pointer-events: none; opacity: 0; transition: left 0.08s ease, top 0.08s ease, opacity 0.1s ease; box-shadow: 0 0 8px rgba(214,153,58,0.5); animation: ttsBlink 1s ease-in-out infinite; }
        @keyframes ttsBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .tts-word-current { position: relative; }
        @media (prefers-reduced-motion: reduce) {
          .tts-cursor { animation: none; opacity: 1 !important; transition: none; }
          .tts-words-inner { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
