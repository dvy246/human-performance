import { useState, useRef, useCallback, useEffect } from "react"
import { useVisibilityGuard } from "../../../runtime/useVisibilityGuard"
import type { StageProps, GauntletStageResult } from "./GauntletTypes"

const WORDS = ["RED", "GREEN", "BLUE", "YELLOW"]
const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"]

function genTrial(): { word: string; color: string; correct: string } {
  const colorIdx = Math.floor(Math.random() * COLORS.length)
  const wordIdx = Math.floor(Math.random() * WORDS.length)
  const color = COLORS[colorIdx]
  const word = WORDS[wordIdx]
  const correct = WORDS[colorIdx]
  return { word, color, correct }
}

export default function StageStroop({ onComplete, difficulty }: StageProps) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [trial, setTrial] = useState(0)
  const [current, setCurrent] = useState(genTrial())
  const [correct, setCorrect] = useState(0)
  const [totalRt, setTotalRt] = useState(0)
  const [feedback, setFeedback] = useState("")
  const startRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const respondedRef = useRef(false)
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty
  const trialCountRef = useRef(10)
  const speedBaselineRef = useRef(300)

  if (difficulty === "Easy") {
    trialCountRef.current = 8
    speedBaselineRef.current = 500
  } else if (difficulty === "Hard") {
    trialCountRef.current = 12
    speedBaselineRef.current = 200
  } else {
    trialCountRef.current = 10
    speedBaselineRef.current = 300
  }

  useVisibilityGuard(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setPhase("intro")
  }, phase === "playing")

  const ct = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
  }, [])

  const nextTrial = useCallback(() => {
    respondedRef.current = false
    setCurrent(genTrial())
    startRef.current = performance.now()
    setFeedback("")
  }, [])

  const handleAnswer = (answer: string) => {
    if (phase !== "playing" || feedback || respondedRef.current) return
    respondedRef.current = true
    const rt = Math.round(performance.now() - startRef.current)
    const isCorrect = answer === current.correct
    if (isCorrect) setCorrect((c) => c + 1)
    setTotalRt((t) => t + rt)
    setFeedback(isCorrect ? "✓" : "✗")
    const next = trial + 1
    if (next >= trialCountRef.current) {
      ct()
      setPhase("done")
      const acc = (correct + (isCorrect ? 1 : 0)) / trialCountRef.current
      const avgRt = (totalRt + rt) / trialCountRef.current
      const speed = Math.max(
        0,
        Math.min(100, Math.round(100 - (avgRt - speedBaselineRef.current) / 10))
      )
      const score = Math.round(acc * 50 + speed * 0.5)
      onComplete({
        stageIndex: 2,
        stageName: "Stroop Test",
        score,
        rawScore: Math.round(avgRt),
        category: "focus",
        metrics: {
          accuracy: Math.round(acc * 100),
          avgReactionMs: Math.round(avgRt),
        },
      })
      return
    }
    setTrial(next)
    st(nextTrial, 500)
  }

  useEffect(() => {
    return ct
  }, [ct])
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="font-mono text-xs text-muted">Stage 3: Stroop Test</div>
        <p className="max-w-xs text-center text-[10px] text-muted">
          Name the <strong className="text-foreground">ink color</strong>,
          ignoring the word.
        </p>
        <button
          onClick={() => {
            setPhase("playing")
            startRef.current = performance.now()
          }}
          className="transition-standard h-11 cursor-pointer rounded-lg bg-accent px-6 text-xs font-semibold text-white hover:bg-accent-hover active:scale-95"
        >
          Start
        </button>
      </div>
    )
  }
  if (phase === "done")
    return <div className="py-4 font-mono text-xs text-success">✓ Done</div>

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="font-mono text-[10px] text-muted">
        Trial {trial + 1}/{trialCountRef.current} · Correct: {correct}
      </div>
      <div className="flex h-24 w-48 items-center justify-center rounded-xl border border-card-border bg-card">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ color: current.color }}
        >
          {current.word}
        </span>
      </div>
      <div className="flex gap-2">
        {WORDS.map((w) => (
          <button
            key={w}
            onClick={() => handleAnswer(w)}
            className="transition-standard h-11 cursor-pointer rounded-lg border border-card-border bg-subtle px-4 text-xs text-foreground hover:border-accent active:scale-95"
          >
            {w}
          </button>
        ))}
      </div>
      {feedback && (
        <div
          className={`text-sm font-bold ${feedback === "✓" ? "text-success" : "text-error"}`}
        >
          {feedback}
        </div>
      )}
    </div>
  )
}
