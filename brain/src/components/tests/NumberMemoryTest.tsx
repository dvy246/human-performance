import React, { useState, useEffect, useRef, useCallback } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { encodeChallenge, generateShareCard } from "../../runtime/share"
import SocialShare from "../ui/SocialShare"
import {
  lookupPercentile,
  formatTopPercentile,
} from "../../runtime/percentileLookup"
import { redirectToResults } from "../../runtime/redirectToResults"
import { useSound } from "../../runtime/useSound"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type Phase = "idle" | "showing" | "input" | "correct" | "wrong" | "result"

const NumberMemoryTest = () => {
  const { playClick, playError } = useSound()
  const [phase, setPhase] = useState<Phase>("idle")
  const [level, setLevel] = useState(1)
  const [currentNumber, setCurrentNumber] = useState("")
  const [userInput, setUserInput] = useState("")
  const [showTimer, setShowTimer] = useState(0)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)
  const [highestLevel, setHighestLevel] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const displayDuration = useRef(0)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)
  const startLen = useRef<number>(5)
  const displayBase = useRef<number>(2000)
  const displayPerLevel = useRef<number>(500)

  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("number-memory", "higher")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const token = params.get("challenge")
      if (token) {
        import("../../runtime/share")
          .then(({ decodeChallenge }) => {
            const payload = decodeChallenge(decodeURIComponent(token))
            if (payload && payload.testId === "number-memory") {
              if (mounted) setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const generateNumber = (digits: number): string => {
    let num = ""
    for (let i = 0; i < digits; i++) {
      num +=
        i === 0
          ? String(Math.floor(Math.random() * 9) + 1)
          : String(Math.floor(Math.random() * 10))
    }
    return num
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const diff = getDifficultyParams(
      "number-memory",
      (cfg.difficulty as string) || "Medium"
    )
    startLen.current = (diff.startLen as number) || 5
    displayBase.current = (diff.displayBase as number) || 2000
    displayPerLevel.current = (diff.displayPerLevel as number) || 500

    if (timerRef.current) clearInterval(timerRef.current)
    submittedRef.current = false
    setLevel(startLen.current)
    setHighestLevel(0)
    setShareImage(null)
    setUserInput("")
    showNumber(startLen.current)
  }

  const showNumber = (lvl: number) => {
    const num = generateNumber(lvl)
    setCurrentNumber(num)
    setPhase("showing")
    setUserInput("")

    const base = startLen.current
    const duration = Math.min(
      displayBase.current + (lvl - base) * displayPerLevel.current,
      8000
    )
    displayDuration.current = Math.max(1000, duration)

    // Countdown timer for visual feedback
    const startTime = performance.now()
    setShowTimer(100)

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setShowTimer(remaining)

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase("input")
        setShowTimer(0)
        // Focus input after transition
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }, 30)
  }

  const handleSubmit = useCallback(() => {
    if (phase !== "input") return

    if (userInput === currentNumber) {
      playClick()
      const nextLevel = level + 1
      setHighestLevel((prev) => Math.max(prev, level))
      setPhase("correct")

      setTimeout(() => {
        setLevel(nextLevel)
        showNumber(nextLevel)
      }, 800)
    } else {
      playError()
      setHighestLevel((prev) => Math.max(prev, level - 1))
      setPhase("wrong")
    }
  }, [phase, userInput, currentNumber, level, highestLevel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const finishTest = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    const finalScore = Math.max(highestLevel, level - 1)
    setPhase("result")

    const percentile = lookupPercentile("number-memory", finalScore)

    if (!submittedRef.current) return
    try {
      await dataLayer.saveSession({
        testId: "number-memory",
        category: "memory",
        rawScore: finalScore,
        percentile,
        metadata: { maxDigits: finalScore },
      })
    } catch (err) {
      console.error("Failed to save Number Memory session:", err)
    }

    if (!submittedRef.current) return
    const pb = await dataLayer.getPersonalBest("number-memory", "higher")
    setPersonalBest(pb)

    if (!submittedRef.current) return
    try {
      const card = await generateShareCard(
        "Number Memory Test",
        `${finalScore} Digits`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    if (!submittedRef.current) return
    redirectToResults({
      testId: "number-memory",
      testName: "Number Memory",
      attempts: [finalScore],
      unit: "digits",
      percentile,
      personalBest: pb,
      category: "memory",
      average: finalScore,
    })
  }

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const finalScore = Math.max(highestLevel, level - 1)
    const token = encodeChallenge({
      testId: "number-memory",
      score: finalScore,
    })
    const url = `${window.location.origin}/tests/number-memory/?challenge=${token}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  const finalScore = Math.max(highestLevel, level - 1)

  useBeforeUnload(phase !== "idle" && phase !== "result")
  useVisibilityGuard(
    () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase("idle")
    },
    phase === "showing" || phase === "input"
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Challenge Banner */}
      {challengeScore && phase !== "result" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-foreground">
            Active Challenge: Beat your friend's score of{" "}
            <strong className="font-mono text-foreground">
              {challengeScore} digits
            </strong>
            !
          </span>
          <button
            onClick={() => setChallengeScore(null)}
            className="font-mono text-[11px] text-muted uppercase hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Test Area */}
      <div className="relative flex min-h-[340px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border border-card-border bg-card p-8">
        {/* Level indicator */}
        {phase !== "idle" && phase !== "result" && (
          <div className="absolute top-4 right-4 flex items-center gap-2 font-mono text-xs text-muted">
            <span>Level</span>
            <span className="text-sm font-bold text-foreground">{level}</span>
            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setPhase("idle")
              }}
              className="transition-standard flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[10px] text-muted hover:border-error/50 hover:text-error"
              aria-label="Restart"
            >
              ✕
            </button>
          </div>
        )}

        {/* IDLE STATE */}
        {phase === "idle" && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GameConfigPanel
              testId="number-memory"
              icon="🔢"
              title="Number Memory"
              description="Remember increasingly long numbers. How many digits can you hold in working memory?"
              personalBest={personalBest}
              personalBestLabel="digits"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {/* SHOWING NUMBER */}
        {phase === "showing" && (
          <div className="flex w-full flex-col items-center gap-6">
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
              Memorize this number
            </span>
            <div className="font-mono text-4xl font-bold tracking-[0.15em] text-foreground tabular-nums select-none md:text-5xl">
              {currentNumber}
            </div>
            {/* Progress bar countdown */}
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full border border-card-border/60 bg-subtle">
              <div
                className="h-full rounded-full bg-accent transition-all duration-75"
                style={{ width: `${showTimer}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted">
              Time remaining to memorize
            </span>
          </div>
        )}

        {/* INPUT STATE */}
        {phase === "input" && (
          <div className="flex w-full max-w-xs flex-col items-center gap-5">
            <span className="font-mono text-[10px] tracking-widest text-accent uppercase">
              What was the number?
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
              className="transition-standard w-full rounded-lg border border-card-border bg-subtle px-4 py-3 text-center font-mono text-3xl font-bold text-foreground tabular-nums outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              autoComplete="off"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={userInput.length === 0}
              className="transition-standard w-full cursor-pointer rounded bg-accent px-6 py-2.5 font-mono text-xs font-semibold tracking-widest text-black uppercase hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        )}

        {/* CORRECT FEEDBACK */}
        {phase === "correct" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] text-2xl">
              ✓
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-success uppercase">
              Correct!
            </span>
            <span className="font-mono text-xs text-muted">
              {currentNumber}
            </span>
          </div>
        )}

        {/* WRONG FEEDBACK */}
        {phase === "wrong" && (
          <div className="flex w-full max-w-sm flex-col items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-2xl">
              ✗
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-sm font-bold tracking-wider text-red-400 uppercase">
                Incorrect
              </span>
              <div className="mt-2 flex w-full flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between rounded border border-card-border/40 bg-subtle p-2">
                  <span className="text-muted">Number</span>
                  <span className="font-bold text-foreground">
                    {currentNumber}
                  </span>
                </div>
                <div className="flex justify-between rounded border border-card-border/40 bg-subtle p-2">
                  <span className="text-muted">Your Answer</span>
                  <span className="font-bold text-red-400">
                    {userInput || "—"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={finishTest}
              className="transition-standard mt-2 cursor-pointer rounded bg-accent px-8 py-2.5 font-mono text-xs font-semibold tracking-widest text-black uppercase hover:bg-accent-hover active:scale-[0.98]"
            >
              View Results
            </button>
          </div>
        )}

        {/* RESULT STATE */}
        {phase === "result" && (
          <div className="flex w-full flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-muted uppercase">
                Number Memory Span
              </span>
              <div className="font-mono text-5xl font-bold text-foreground">
                {finalScore}
              </div>
              <span className="font-mono text-[11px] text-secondary">
                digits remembered
              </span>
              <span className="mt-1 font-mono text-xs text-accent uppercase">
                {formatTopPercentile(
                  lookupPercentile("number-memory", finalScore)
                )}{" "}
                of population
              </span>
            </div>

            {/* Stats grid */}
            <div className="mt-2 grid w-full max-w-xs grid-cols-2 gap-8 border-t border-card-border/50 pt-4 text-center">
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Personal Best
                </span>
                <div className="font-mono text-sm text-foreground">
                  {personalBest ? `${personalBest} digits` : "--"}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Percentile
                </span>
                <div className="font-mono text-sm text-foreground">
                  ~
                  {Math.round(
                    100 - lookupPercentile("number-memory", finalScore)
                  )}
                  %ile
                </div>
              </div>
            </div>

            {/* Challenge result comparison */}
            {challengeScore && (
              <div
                className={`w-full max-w-xs rounded-lg border p-3 text-center font-mono text-sm ${
                  finalScore >= challengeScore
                    ? "border-[var(--success-border)] bg-[var(--success-bg)] text-success"
                    : "border-[var(--error-border)] bg-[var(--error-bg)] text-error"
                }`}
              >
                {finalScore >= challengeScore
                  ? `🏆 You beat the challenge! (${finalScore} vs ${challengeScore})`
                  : `Challenge not beaten (${finalScore} vs ${challengeScore})`}
              </div>
            )}

            <SocialShare
              testId="number-memory"
              score={finalScore}
              scoreLabel={`${finalScore} Digits`}
              testName="Number Memory Test"
            />

            <button
              onClick={() => startTest()}
              className="mt-4 cursor-pointer rounded border border-card-border bg-subtle px-4 py-1.5 font-mono text-xs tracking-widest text-muted uppercase hover:border-accent/30 hover:text-foreground"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Share Actions */}
      {phase === "result" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-number-memory.png"
              className="transition-standard flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.98]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Download Score Card</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(NumberMemoryTest)
