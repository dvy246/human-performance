import React, { useState, useEffect, useRef, useCallback } from "react"
import { useVisibilityGuard } from "../../../runtime/useVisibilityGuard"
import type { StageProps, StageResult } from "./StageTypes"

const RULES = [
  { id: "even-odd", label: "Even vs Odd", left: "Even", right: "Odd" },
  { id: "high-low", label: "High vs Low", left: "≥ 50", right: "< 50" },
  { id: "div3", label: "Divisible by 3", left: "Yes (÷3)", right: "No" },
]

function genNumber(): number {
  return Math.floor(Math.random() * 99) + 1
}
function isEven(n: number): boolean {
  return n % 2 === 0
}
function isDiv3(n: number): boolean {
  return n % 3 === 0
}

export default function Stage3TaskSwitching({
  onComplete,
  calibrationHz,
  difficulty,
}: StageProps) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [showHelp, setShowHelp] = useState(false)
  const [trialIndex, setTrialIndex] = useState(0)
  const [currentNum, setCurrentNum] = useState(42)
  const [feedbackMsg, setFeedbackMsg] = useState("")
  const [correctCount, setCorrectCount] = useState(0)
  const [displaySwitchCount, setDisplaySwitchCount] = useState(0)
  const [lastRuleId, setLastRuleId] = useState(RULES[1].id)

  const trialCountRef = useRef(12)
  if (difficulty === "Easy") trialCountRef.current = 8
  else if (difficulty === "Hard") trialCountRef.current = 16
  else trialCountRef.current = 12

  const preDelayRef = useRef(800)
  if (difficulty === "Easy") preDelayRef.current = 1200
  else if (difficulty === "Hard") preDelayRef.current = 500
  else preDelayRef.current = 800

  const showRuleHints = difficulty !== "Hard"
  const useHardRules = difficulty === "Hard"

  const trialRef = useRef(0)
  const correctRef = useRef(0)
  const switchCountRef = useRef(0)
  const prevRuleRef = useRef(RULES[1].id)
  const respondedRef = useRef(false)
  const completedRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useVisibilityGuard(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setPhase("intro")
  }, phase === "playing")

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])
  const st = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
  }, [])

  const getCurrentRule = (idx: number) => {
    if (useHardRules) {
      // Hard: random rule selection including the 3rd rule (div3)
      return RULES[Math.floor(Math.random() * RULES.length)]
    }
    return RULES[idx % 2]
  }
  const isSwitch = (idx: number) =>
    idx > 0 && getCurrentRule(idx).id !== prevRuleRef.current

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    clearTimers()
    setPhase("done")
    const acc = correctRef.current / trialCountRef.current
    const switchEff = Math.max(
      0,
      Math.min(
        100,
        switchCountRef.current > 0
          ? Math.round(
              100 - (switchCountRef.current / (trialCountRef.current - 1)) * 50
            )
          : 100
      )
    )
    const score = Math.max(
      0,
      Math.min(100, Math.round(acc * 70 + (switchEff / 100) * 30))
    )
    onComplete({
      stageIndex: 2,
      stageName: "Task Switching",
      score,
      metrics: {
        accuracy: Math.round(acc * 100),
        switches: switchCountRef.current,
      },
    })
  }, [onComplete, clearTimers])

  const runTrial = useCallback(() => {
    respondedRef.current = false
    const idx = trialRef.current
    const rule = getCurrentRule(idx)
    prevRuleRef.current = rule.id
    setLastRuleId(rule.id)
    setCurrentNum(genNumber())
    setFeedbackMsg("")
  }, [])

  const handleAnswer = useCallback(
    (answer: "left" | "right") => {
      if (respondedRef.current) return
      respondedRef.current = true
      const idx = trialRef.current
      const rule = getCurrentRule(idx)
      const n = currentNum
      const correct =
        rule.id === "even-odd"
          ? (answer === "left") === isEven(n)
          : rule.id === "high-low"
            ? (answer === "left") === n >= 50
            : (answer === "left") === isDiv3(n)
      if (correct) {
        correctRef.current += 1
        setCorrectCount(correctRef.current)
      }
      setFeedbackMsg(correct ? "✓" : "✗")
      const nextIdx = idx + 1
      if (nextIdx >= trialCountRef.current) {
        finish()
        return
      }
      trialRef.current = nextIdx
      setTrialIndex(nextIdx)
      if (isSwitch(nextIdx)) {
        switchCountRef.current += 1
        setDisplaySwitchCount(switchCountRef.current)
      }
      st(() => {
        setFeedbackMsg("")
        runTrial()
      }, 500)
    },
    [currentNum, st, finish, runTrial]
  )

  const startPlaying = useCallback(() => {
    setPhase("playing")
    correctRef.current = 0
    switchCountRef.current = 0
    trialRef.current = 0
    completedRef.current = false
    setCorrectCount(0)
    setDisplaySwitchCount(0)
    setTrialIndex(0)
    prevRuleRef.current = RULES[1].id
    st(runTrial, preDelayRef.current)
  }, [st, runTrial])

  useEffect(() => {
    return clearTimers
  }, [clearTimers])

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-3xl">
          🔄
        </div>
        <div className="text-center">
          <h3 className="mb-1 text-lg font-bold text-foreground">
            Stage 3: Task Switching
          </h3>
          <div className="max-w-md space-y-1 text-left text-sm text-secondary">
            <p>
              1. A <strong className="text-accent">number</strong> appears on
              screen.
            </p>
            <p>
              2. Classify it using the{" "}
              <strong className="text-accent">current rule</strong> shown at the
              top.
            </p>
            {!useHardRules && (
              <p>
                3. Rules: <strong className="text-accent">Even/Odd</strong> or{" "}
                <strong className="text-success">≥50 / &lt;50</strong>.
              </p>
            )}
            {useHardRules && (
              <p>
                3. Rules: <strong className="text-accent">Even/Odd</strong>,{" "}
                <strong className="text-success">≥50 / &lt;50</strong>, or{" "}
                <strong className="text-warning">Divisible by 3</strong> — rule
                label is hidden!
              </p>
            )}
            <p>
              4. The rule <strong className="text-accent">changes</strong> every
              few rounds — switch your thinking. Speed + accuracy = score.
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
        <p className="text-sm text-secondary">Task Switching complete!</p>
      </div>
    )
  }

  const rule = getCurrentRule(trialRef.current)
  const isSwitchTrial = trialRef.current > 0 && rule.id !== prevRuleRef.current

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 font-mono text-xs text-muted">
        <span>
          Trial {trialIndex + 1} / {trialCountRef.current}
        </span>
        <span>•</span>
        <span>Correct: {correctCount}</span>
        {isSwitchTrial && (
          <span className="animate-pulse text-accent">⚡ Switch!</span>
        )}
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
            1. Classify the number using the{" "}
            <strong className="text-accent">current rule</strong>.
          </p>
          {!useHardRules && (
            <p>
              2. Rules: <strong className="text-accent">Even/Odd</strong> or{" "}
              <strong className="text-success">{">="}50 / &lt;50</strong>.
            </p>
          )}
          {useHardRules && (
            <p>2. Rules cycle randomly — label is hidden on Hard.</p>
          )}
          <p>
            3. The rule changes — switch your thinking. Speed + accuracy =
            score.
          </p>
        </div>
      )}

      <div className="w-full max-w-sm rounded-xl border border-card-border bg-card p-6 text-center">
        {showRuleHints && (
          <div className="mb-2 inline-block rounded border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-xs tracking-wider text-accent uppercase">
            Rule: {rule.label}
          </div>
        )}
        {!showRuleHints && (
          <div className="mb-2 font-mono text-xs text-muted">
            Remember the rule — no hints!
          </div>
        )}
        <div className="mb-4 text-6xl font-bold text-foreground tabular-nums">
          {currentNum}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleAnswer("left")}
            disabled={!!feedbackMsg}
            className="transition-standard h-12 max-w-[120px] flex-1 cursor-pointer rounded-lg border border-accent/40 bg-accent/20 px-4 text-sm font-bold text-accent hover:bg-accent/30 active:scale-95 disabled:opacity-30"
          >
            {rule.left}
          </button>
          <button
            onClick={() => handleAnswer("right")}
            disabled={!!feedbackMsg}
            className="transition-standard h-12 max-w-[120px] flex-1 cursor-pointer rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 text-sm font-bold text-warning hover:bg-[var(--warning-border)] active:scale-95 disabled:opacity-30"
          >
            {rule.right}
          </button>
        </div>
        {feedbackMsg && (
          <div
            className={`animate-in zoom-in-50 mt-4 text-2xl font-bold duration-150 ${feedbackMsg === "✓" ? "text-success" : "text-error"}`}
          >
            {feedbackMsg}
          </div>
        )}
      </div>
    </div>
  )
}
