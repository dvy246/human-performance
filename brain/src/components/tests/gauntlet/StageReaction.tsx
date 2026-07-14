import { useState, useEffect, useRef, useCallback } from "react"
import { useVisibilityGuard } from "../../../runtime/useVisibilityGuard"
import type { StageProps, GauntletStageResult } from "./GauntletTypes"

const TOTAL_TRIALS = 5

export default function StageReaction({ onComplete, difficulty }: StageProps) {
  const [phase, setPhase] = useState<
    "intro" | "waiting" | "ready" | "result" | "done"
  >("intro")
  const [trial, setTrial] = useState(0)
  const [results, setResults] = useState<number[]>([])
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const rafIdRef = useRef<number>(0)
  const respondedRef = useRef(false)
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty
  const delayMinRef = useRef(1500)
  const delayMaxRef = useRef(2500)

  if (difficulty === "Easy") {
    delayMinRef.current = 2000
    delayMaxRef.current = 3000
  } else if (difficulty === "Hard") {
    delayMinRef.current = 800
    delayMaxRef.current = 1500
  } else {
    delayMinRef.current = 1500
    delayMaxRef.current = 2500
  }

  const cleanup = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
  }

  const startTrial = useCallback(() => {
    respondedRef.current = false
    setPhase("waiting")
    const delay =
      delayMinRef.current +
      Math.random() * (delayMaxRef.current - delayMinRef.current)
    timerRef.current = setTimeout(() => {
      setPhase("ready")
      rafIdRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTimeRef.current = performance.now()
        })
      })
    }, delay)
  }, [])

  useVisibilityGuard(
    () => {
      cleanup()
      setPhase("intro")
    },
    phase === "waiting" || phase === "ready"
  )

  const handleClick = () => {
    if (phase === "intro") {
      cleanup()
      startTrial()
      return
    }
    if (phase === "waiting") {
      cleanup()
      startTrial()
      return
    }
    if (phase === "ready") {
      if (respondedRef.current) return
      respondedRef.current = true
      cleanup()
      const rt = Math.round(performance.now() - startTimeRef.current)
      const updated = [...results, rt]
      setResults(updated)
      if (updated.length >= TOTAL_TRIALS) {
        const avg = Math.round(
          updated.reduce((a, b) => a + b, 0) / TOTAL_TRIALS
        )
        const score = Math.max(
          0,
          Math.min(100, Math.round(100 - (avg - 100) / 3))
        )
        setPhase("done")
        onComplete({
          stageIndex: 0,
          stageName: "Visual Reaction",
          score,
          rawScore: avg,
          category: "reaction",
          metrics: { avgReactionMs: avg, trials: TOTAL_TRIALS },
        })
      } else {
        setTrial((t) => t + 1)
        setPhase("result")
        timerRef.current = setTimeout(startTrial, 600)
      }
    }
    if (phase === "result") {
      startTrial()
    }
  }

  useEffect(() => {
    return cleanup
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="font-mono text-xs text-muted">
        Stage 1: Visual Reaction &middot; Trial {trial + 1}/{TOTAL_TRIALS}
      </div>
      <div
        onClick={handleClick}
        className={`flex h-40 w-64 cursor-pointer items-center justify-center rounded-xl border transition-all duration-150 select-none ${
          phase === "ready"
            ? "scale-105 border-emerald-500 bg-emerald-600/90"
            : phase === "waiting"
              ? "border-rose-500/30 bg-rose-500/20"
              : "border-card-border bg-card hover:border-accent"
        }`}
      >
        {phase === "intro" && (
          <span className="font-mono text-sm text-secondary">
            Click to start
          </span>
        )}
        {phase === "waiting" && (
          <span className="animate-pulse font-mono text-sm text-error">
            Wait...
          </span>
        )}
        {phase === "ready" && (
          <span className="text-2xl font-bold text-white">CLICK!</span>
        )}
        {phase === "result" && (
          <span className="font-mono text-sm text-secondary">
            {results[results.length - 1]}ms
          </span>
        )}
        {phase === "done" && (
          <span className="font-mono text-sm text-success">✓ Done</span>
        )}
      </div>
    </div>
  )
}
