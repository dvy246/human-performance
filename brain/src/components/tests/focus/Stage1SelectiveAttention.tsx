import React, { useState, useEffect, useRef, useCallback } from "react"
import { useVisibilityGuard } from "../../../runtime/useVisibilityGuard"
import type { StageProps, StageResult } from "./StageTypes"

const SYMBOLS = ["★", "●", "■", "▲", "◆", "♥", "♦", "♣", "♠", "✿"]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Stage1SelectiveAttention({
  onComplete,
  calibrationHz,
  difficulty,
}: StageProps) {
  const [phase, setPhase] = useState<"intro" | "playing" | "feedback" | "done">(
    "intro"
  )
  const [showHelp, setShowHelp] = useState(false)
  const [trialIndex, setTrialIndex] = useState(0)
  const [trials, setTrials] = useState<
    {
      targetSymbol: string
      grid: string[]
      targetIdx: number
      startTime: number
      correct: boolean
      rt: number
    }[]
  >([])
  const [hitCount, setHitCount] = useState(0)
  const [totalRt, setTotalRt] = useState(0)

  const trialCountRef = useRef(8)
  if (difficulty === "Easy") trialCountRef.current = 6
  else if (difficulty === "Hard") trialCountRef.current = 10
  else trialCountRef.current = 8

  const gridSizeRef = useRef(5)
  if (difficulty === "Easy") gridSizeRef.current = 4
  else if (difficulty === "Hard") gridSizeRef.current = 6
  else gridSizeRef.current = 5

  const distractorCountRef = useRef(6)
  if (difficulty === "Easy") distractorCountRef.current = 4
  else if (difficulty === "Hard") distractorCountRef.current = 8
  else distractorCountRef.current = 6

  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startTimeRef = useRef(0)

  useVisibilityGuard(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setPhase("intro")
  }, phase === "playing")

  const generateTrial = useCallback(() => {
    const targetSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    const targetIdx = Math.floor(
      Math.random() * gridSizeRef.current * gridSizeRef.current
    )
    const distractorPool = SYMBOLS.filter((s) => s !== targetSymbol)
    const grid: string[] = []
    for (let i = 0; i < gridSizeRef.current * gridSizeRef.current; i++) {
      grid.push(
        i === targetIdx
          ? targetSymbol
          : distractorPool[Math.floor(Math.random() * distractorPool.length)]
      )
    }
    startTimeRef.current = performance.now()
    return {
      targetSymbol,
      grid,
      targetIdx,
      startTime: performance.now(),
      correct: false,
      rt: 0,
    }
  }, [])

  const startPlaying = () => {
    setPhase("playing")
    setTrials([generateTrial()])
  }

  const handleCellClick = (idx: number) => {
    if (phase !== "playing") return
    const rt = Math.round(performance.now() - startTimeRef.current)
    const correct = idx === trials[trialIndex].targetIdx
    if (correct) setHitCount((h) => h + 1)
    setTotalRt((t) => t + rt)

    const updated = [...trials]
    updated[trialIndex] = { ...updated[trialIndex], correct, rt }
    setTrials(updated)

    setPhase("feedback")
    feedbackTimer.current = setTimeout(() => {
      if (trialIndex + 1 >= trialCountRef.current) {
        setPhase("done")
        const accuracy = (hitCount + (correct ? 1 : 0)) / trialCountRef.current
        const avgRt = (totalRt + rt) / trialCountRef.current
        const speedScore = Math.max(
          0,
          Math.min(100, Math.round(100 - (avgRt / 2000) * 100))
        )
        const score = Math.round(accuracy * 60 + speedScore * 0.4)
        onComplete({
          stageIndex: 0,
          stageName: "Selective Attention",
          score: Math.min(100, Math.max(0, score)),
          metrics: {
            accuracy: Math.round(accuracy * 100),
            avgReactionMs: avgRt,
          },
        })
      } else {
        setTrialIndex((i) => i + 1)
        setTrials((prev) => [...prev, generateTrial()])
        setPhase("playing")
      }
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-3xl">
          🎯
        </div>
        <div className="text-center">
          <h3 className="mb-1 text-lg font-bold text-foreground">
            Stage 1: Selective Attention
          </h3>
          <div className="max-w-md space-y-1 text-left text-sm text-secondary">
            <p>
              1. Look at the{" "}
              <strong className="text-accent">target symbol</strong> shown at
              the top.
            </p>
            <p>
              2. Find the{" "}
              <strong className="text-accent">matching symbol</strong> in the
              grid below.
            </p>
            <p>3. Click it as fast as you can.</p>
            <p>4. Ignore the moving distractions around the grid.</p>
            <p className="mt-2 text-xs text-muted">
              {trialCountRef.current} rounds. Speed matters — faster = higher
              score.
            </p>
          </div>
        </div>
        <button
          onClick={startPlaying}
          className="transition-standard h-10 cursor-pointer rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover active:scale-95"
        >
          Start Stage
        </button>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-4xl text-success">✓</div>
        <p className="text-sm text-secondary">Selective Attention complete!</p>
      </div>
    )
  }

  const currentTrial = trials[trialIndex]
  if (!currentTrial) return null

  const distractors = Array.from(
    { length: distractorCountRef.current },
    () => ["▲", "△", "▪", "▫", "✦", "✧"][Math.floor(Math.random() * 6)]
  )

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-3 font-mono text-xs text-muted">
        <span>
          Trial {trialIndex + 1} / {trialCountRef.current}
        </span>
        <span>•</span>
        <span>Hits: {hitCount}</span>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="transition-standard flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[10px] text-muted hover:border-accent/50 hover:text-accent"
          aria-label="How to play"
        >
          ?
        </button>
      </div>
      {showHelp && (
        <div className="animate-in fade-in w-full max-w-md space-y-1 rounded-lg border border-card-border bg-panel p-3 font-mono text-xs text-muted duration-150">
          <p>
            1. Note the <strong className="text-accent">target symbol</strong>{" "}
            above.
          </p>
          <p>
            2. Find and click the{" "}
            <strong className="text-accent">matching symbol</strong> in the
            grid.
          </p>
          <p>3. Ignore moving distractions. Speed = higher score.</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-card-border bg-subtle px-4 py-2">
        <span className="font-mono text-xs text-secondary">Find this:</span>
        <span className="text-3xl text-accent">
          {currentTrial.targetSymbol}
        </span>
      </div>
      <div className="relative">
        {phase === "playing" && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {distractors.map((d, i) => (
              <span
                key={i}
                className="absolute animate-pulse text-xs text-secondary"
                style={{
                  top: `${10 + ((i * 17) % 80)}%`,
                  left: `${5 + ((i * 23) % 90)}%`,
                  animationDelay: `${i * 0.3}s`,
                  fontSize: "8px",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSizeRef.current}, minmax(0, 1fr))`,
            gap: "0.5rem",
          }}
        >
          {currentTrial.grid.map((symbol, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={phase !== "playing"}
              className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg text-xl font-bold transition-all duration-150 ${
                phase === "playing"
                  ? "border border-card-border bg-card text-foreground hover:border-accent hover:bg-accent/5 active:scale-95"
                  : idx === currentTrial.targetIdx
                    ? "scale-110 border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              } ${phase === "feedback" ? "pointer-events-none" : ""}`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
      {phase === "feedback" && (
        <div
          className={`text-sm font-semibold ${currentTrial.correct ? "text-success" : "text-error"}`}
        >
          {currentTrial.correct ? `✓ ${currentTrial.rt}ms` : "✗ Wrong target"}
        </div>
      )}
    </div>
  )
}
