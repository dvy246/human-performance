import React, { useState, useEffect, useRef, useCallback } from "react"
import { useVisibilityGuard } from "../../../runtime/useVisibilityGuard"
import type { StageProps, StageResult } from "./StageTypes"

const GO_SYMBOL = "✓"
const NOGO_SYMBOL = "✗"
const DISTRACTOR_TEXTS = [
  "New Message",
  "Notification",
  "Alert",
  "Reminder",
  "Update",
  "Friend Request",
  "Comment",
  "Like",
]

// Distractor tiers: Easy=short, Medium=multi-line, Hard=longer + action buttons
const DISTRACTOR_TIERS: Record<string, { lines: string[]; buttons: string[] }> =
  {
    Easy: {
      lines: ["New message from Alex"],
      buttons: ["Dismiss"],
    },
    Medium: {
      lines: ["New message from Alex", '"Hey, are you free later?"'],
      buttons: ["Dismiss", "Reply"],
    },
    Hard: {
      lines: [
        "New message from Alex",
        '"Hey, are you free later?"',
        "Also: meeting at 3pm moved to 4pm",
      ],
      buttons: ["View", "Reply", "Dismiss"],
    },
  }

function genTrial(goRate: number) {
  return {
    isGo: Math.random() < goRate,
    distractorText:
      DISTRACTOR_TEXTS[Math.floor(Math.random() * DISTRACTOR_TEXTS.length)],
  }
}

export default function Stage2ImpulseControl({
  onComplete,
  calibrationHz,
  difficulty,
}: StageProps) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [showHelp, setShowHelp] = useState(false)
  const [trialIndex, setTrialIndex] = useState(0)
  const [showDistractor, setShowDistractor] = useState(false)
  const [showStimulus, setShowStimulus] = useState(false)
  const [stimSymbol, setStimSymbol] = useState("")
  const [feedbackMsg, setFeedbackMsg] = useState("")
  const [displayHitCount, setDisplayHitCount] = useState(0)
  const [displayFaCount, setDisplayFaCount] = useState(0)
  const [clickedDistractor, setClickedDistractor] = useState(false)

  const trialCountRef = useRef(15)
  if (difficulty === "Easy") trialCountRef.current = 10
  else if (difficulty === "Hard") trialCountRef.current = 20
  else trialCountRef.current = 15

  const goRateRef = useRef(0.6)
  if (difficulty === "Easy") goRateRef.current = 0.7
  else if (difficulty === "Hard") goRateRef.current = 0.5
  else goRateRef.current = 0.6

  const distractorDelayRef = useRef(600)
  if (difficulty === "Easy") distractorDelayRef.current = 1000
  else if (difficulty === "Hard") distractorDelayRef.current = 350
  else distractorDelayRef.current = 600

  const incompletePenaltyRef = useRef(false)
  if (difficulty === "Hard") incompletePenaltyRef.current = true
  else incompletePenaltyRef.current = false

  const distractorTier = difficulty || "Medium"

  const hitCountRef = useRef(0)
  const faCountRef = useRef(0)
  const trialIndexRef = useRef(0)
  const currentTrialRef = useRef(genTrial(0.6))
  const respondedRef = useRef(false)
  const clickedDistractorRef = useRef(false)
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

  const finish = useCallback(() => {
    clearTimers()
    setPhase("done")
    const total = trialCountRef.current
    const correct = hitCountRef.current
    const fa = faCountRef.current
    const acc = correct / total
    const score = Math.max(
      0,
      Math.min(100, Math.round(acc * 70 + Math.max(0, 1 - fa / total) * 30))
    )
    onComplete({
      stageIndex: 1,
      stageName: "Impulse Control",
      score,
      metrics: { accuracy: Math.round(acc * 100), falseAlarms: fa },
    })
  }, [onComplete, clearTimers])

  const advance = useCallback(
    (correct: boolean, isGo: boolean, distractorPenalty = false) => {
      if (correct) {
        hitCountRef.current += 1
        setDisplayHitCount(hitCountRef.current)
      } else {
        faCountRef.current += 1
        setDisplayFaCount(faCountRef.current)
      }
      if (distractorPenalty) {
        // Clicking distractor popup counts as extra false alarm
        faCountRef.current += 1
        setDisplayFaCount(faCountRef.current)
      }
      const nextIdx = trialIndexRef.current + 1
      if (nextIdx >= trialCountRef.current) {
        finish()
        return
      }
      trialIndexRef.current = nextIdx
      setTrialIndex(nextIdx)
      setFeedbackMsg(
        correct
          ? isGo
            ? "✓ Press correct"
            : "✓ Withheld correctly"
          : isGo
            ? "✗ Missed"
            : "✗ False alarm"
      )
      st(() => {
        setFeedbackMsg("")
        runTrial()
      }, 700)
    },
    [st, finish]
  )

  const runTrial = useCallback(() => {
    respondedRef.current = false
    clickedDistractorRef.current = false
    setClickedDistractor(false)
    const trial = genTrial(goRateRef.current)
    currentTrialRef.current = trial
    setShowDistractor(true)
    setShowStimulus(false)
    st(() => {
      setShowDistractor(false)
      // If player clicked the distractor in Hard mode, apply penalty immediately
      if (incompletePenaltyRef.current && clickedDistractorRef.current) {
        faCountRef.current += 1
        setDisplayFaCount(faCountRef.current)
      }
      setStimSymbol(trial.isGo ? GO_SYMBOL : NOGO_SYMBOL)
      setShowStimulus(true)
    }, distractorDelayRef.current)
  }, [st])

  const handlePress = useCallback(() => {
    if (respondedRef.current || !showStimulus) return
    respondedRef.current = true
    setShowStimulus(false)
    advance(currentTrialRef.current.isGo, currentTrialRef.current.isGo, false)
  }, [showStimulus, advance])

  const handleWithhold = useCallback(() => {
    if (respondedRef.current || !showStimulus) return
    respondedRef.current = true
    setShowStimulus(false)
    const isGo = currentTrialRef.current.isGo
    advance(!isGo, isGo, false)
  }, [showStimulus, advance])

  // On Hard difficulty, clicking anywhere on the distractor popup = failed impulse test
  const handleDistractorClick = useCallback(() => {
    if (
      !incompletePenaltyRef.current ||
      !showDistractor ||
      respondedRef.current
    )
      return
    clickedDistractorRef.current = true
    setClickedDistractor(true)
  }, [showDistractor])

  const startPlaying = useCallback(() => {
    setPhase("playing")
    hitCountRef.current = 0
    faCountRef.current = 0
    trialIndexRef.current = 0
    clickedDistractorRef.current = false
    setClickedDistractor(false)
    setDisplayHitCount(0)
    setDisplayFaCount(0)
    setTrialIndex(0)
    st(runTrial, 800)
  }, [st, runTrial])

  useEffect(() => {
    return clearTimers
  }, [clearTimers])

  if (phase === "intro") {
    const tier = DISTRACTOR_TIERS[distractorTier]
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-3xl">
          🛡️
        </div>
        <div className="text-center">
          <h3 className="mb-1 text-lg font-bold text-foreground">
            Stage 2: Impulse Control
          </h3>
          <div className="max-w-md space-y-1 text-left text-sm text-secondary">
            <p>
              1. A <strong className="text-accent">notification popup</strong>{" "}
              appears briefly — ignore it completely.
            </p>
            <p>
              2. Then a <strong className="text-accent">symbol</strong> appears:
              press{" "}
              <kbd className="rounded border border-card-border bg-panel px-1 py-0.5 font-mono text-xs text-accent">
                SPACE
              </kbd>{" "}
              for <strong className="text-success">{GO_SYMBOL}</strong>,
              withhold for <strong className="text-error">{NOGO_SYMBOL}</strong>
              .
            </p>
            <p>
              3. Respond as{" "}
              <strong className="text-accent">fast and accurately</strong> as
              you can.
            </p>
            <p>
              4.{" "}
              {incompletePenaltyRef.current
                ? "Clicking the notification counts as a false alarm!"
                : "Impulse control is the key skill."}
            </p>
          </div>
          <p className="mt-2 max-w-md text-xs text-muted">
            {distractorTier === "Easy" && "Short notification. Easy to ignore."}
            {distractorTier === "Medium" &&
              "Multi-line notification. Requires more willpower to ignore."}
            {distractorTier === "Hard" &&
              "Long notification with action buttons. Clicking = instant penalty."}
          </p>
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
        <p className="text-sm text-secondary">Impulse Control complete!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-3 font-mono text-xs text-muted">
        <span>
          Trial {trialIndex + 1} / {trialCountRef.current}
        </span>
        <span>•</span>
        <span>Hits: {displayHitCount}</span>
        <span>•</span>
        <span>FA: {displayFaCount}</span>
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
            1. <strong className="text-accent">Ignore</strong> the notification
            popup.
          </p>
          <p>
            2. Press{" "}
            <kbd className="rounded border border-card-border bg-subtle px-1 py-0.5 text-accent">
              SPACE
            </kbd>{" "}
            for <strong className="text-success">{"✓"}</strong>, withhold for{" "}
            <strong className="text-error">{"✗"}</strong>.
          </p>
          <p>
            3. Be fast and accurate.{" "}
            {incompletePenaltyRef.current
              ? "Clicking notification = penalty!"
              : ""}
          </p>
        </div>
      )}

      <div className="relative flex min-h-[8rem] min-w-[20rem] items-center justify-center rounded-xl border border-card-border bg-card">
        {showDistractor && (
          <div
            className={`animate-in slide-in-from-top-2 absolute -top-2 right-2 z-10 rounded-lg border border-card-border bg-card p-3 shadow-xl duration-300 ${incompletePenaltyRef.current ? "cursor-pointer" : ""}`}
            onClick={
              incompletePenaltyRef.current ? handleDistractorClick : undefined
            }
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                New
              </span>
              {incompletePenaltyRef.current && (
                <span className="ml-auto font-mono text-[8px] text-error">
                  DO NOT CLICK
                </span>
              )}
            </div>
            {DISTRACTOR_TIERS[distractorTier].lines.map((line, li) => (
              <p
                key={li}
                className={`text-foreground ${li === 0 ? "text-sm font-medium" : "text-xs text-muted"} ${li > 0 ? "mt-1" : ""}`}
              >
                {line}
              </p>
            ))}
            <div className="mt-2 flex gap-2">
              {DISTRACTOR_TIERS[distractorTier].buttons.map((btn) => (
                <button
                  key={btn}
                  className={`rounded px-2 py-0.5 text-[10px] ${btn === "Dismiss" ? "bg-subtle text-muted" : "bg-accent/20 text-accent"} cursor-default`}
                  tabIndex={-1}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

        {showStimulus && (
          <div
            className="animate-in zoom-in-50 text-6xl font-bold duration-200"
            style={{ color: stimSymbol === GO_SYMBOL ? "#34d399" : "#fb7185" }}
          >
            {stimSymbol}
          </div>
        )}

        {!showDistractor && !showStimulus && !feedbackMsg && (
          <div className="font-mono text-sm text-secondary">Get ready...</div>
        )}

        {feedbackMsg && (
          <div
            className={`text-sm font-semibold ${feedbackMsg.startsWith("✓") ? "text-success" : "text-error"} animate-in fade-in duration-150`}
          >
            {feedbackMsg}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handlePress}
          disabled={!showStimulus}
          className="transition-standard h-12 cursor-pointer rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-8 text-lg font-bold text-success hover:bg-[var(--success-border)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
        >
          Press
        </button>
        <button
          onClick={handleWithhold}
          disabled={!showStimulus}
          className="transition-standard h-12 cursor-pointer rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-8 text-lg font-bold text-error hover:bg-[var(--error-border)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
        >
          Withhold
        </button>
      </div>
    </div>
  )
}
