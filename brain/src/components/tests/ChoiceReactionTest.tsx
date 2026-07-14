import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import {
  measureRefreshRate,
  type CalibrationResult,
} from "../../runtime/calibration"
import { dataLayer } from "../../runtime/dataLayer"
import { encodeChallenge, generateShareCard } from "../../runtime/share"
import {
  lookupPercentile,
  formatTopPercentile,
} from "../../runtime/percentileLookup"
import { redirectToResults } from "../../runtime/redirectToResults"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type TestState =
  "idle" | "waiting" | "ready" | "attempt-result" | "abort" | "result"

type ColorChoice = "red" | "green" | "blue" | "yellow"

const COLOR_MAP: Record<
  ColorChoice,
  {
    hex: string
    key: string
    label: string
    textClass: string
    bgClass: string
    activeClass: string
  }
> = {
  red: {
    hex: "#ef4444",
    key: "r",
    label: "Red (R)",
    textClass: "text-red-400",
    bgClass: "bg-red-950/20 border-red-900/50",
    activeClass: "bg-red-500 border-red-400 ring-4 ring-red-500/20",
  },
  green: {
    hex: "#10b981",
    key: "g",
    label: "Green (G)",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-950/20 border-emerald-900/50",
    activeClass: "bg-emerald-500 border-emerald-400 ring-4 ring-emerald-500/20",
  },
  blue: {
    hex: "#3b82f6",
    key: "b",
    label: "Blue (B)",
    textClass: "text-blue-400",
    bgClass: "bg-blue-950/20 border-blue-900/50",
    activeClass: "bg-blue-500 border-blue-400 ring-4 ring-blue-500/20",
  },
  yellow: {
    hex: "#eab308",
    key: "y",
    label: "Yellow (Y)",
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-950/20 border-yellow-900/50",
    activeClass: "bg-yellow-500 border-yellow-400 ring-4 ring-yellow-500/20",
  },
}

const ChoiceReactionTest = () => {
  const [gameState, setGameState] = useState<TestState>("idle")
  const [activeColor, setActiveColor] = useState<ColorChoice | null>(null)
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<
    { score: number; penalty: boolean }[]
  >([])
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [hasPenalty, setHasPenalty] = useState(false)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)

  const startTime = useRef<number>(0)
  const timerId = useRef<any>(null)
  const rafId = useRef<number>(0)
  const clickLock = useRef<boolean>(false)
  const submittedRef = useRef<boolean>(false)
  const pressedKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalAttempts = useRef<number>(5)
  const waitRange = useRef<{ min: number; max: number }>({
    min: 1200,
    max: 3500,
  })
  const lastConfig = useRef<GameConfig | null>(null)
  const penaltyMs = useRef<number>(150)

  useEffect(() => {
    let mounted = true
    // 1. Get Calibration
    measureRefreshRate((res) => {
      if (mounted) setCalibration(res)
    })

    // 2. Personal Best
    dataLayer
      .getPersonalBest("choice-reaction", "lower")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)

    // 3. Challenge check
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const challengeToken = params.get("challenge")
      if (challengeToken) {
        import("../../runtime/share")
          .then(({ decodeChallenge }) => {
            const payload = decodeChallenge(challengeToken)
            if (payload && payload.testId === "choice-reaction") {
              setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
      if (timerId.current) clearTimeout(timerId.current)
      if (rafId.current) cancelAnimationFrame(rafId.current)
      if (pressedKeyTimerRef.current) clearTimeout(pressedKeyTimerRef.current)
    }
  }, [])

  // Keyboard listeners during active ready state
  useEffect(() => {
    if (gameState !== "ready") return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "ready") return
      const key = e.key.toLowerCase()
      if (["r", "g", "b", "y"].includes(key)) {
        setPressedKey(key)
        if (pressedKeyTimerRef.current) clearTimeout(pressedKeyTimerRef.current)
        pressedKeyTimerRef.current = setTimeout(() => setPressedKey(null), 150)

        let selectedColor: ColorChoice | null = null
        if (key === "r") selectedColor = "red"
        if (key === "g") selectedColor = "green"
        if (key === "b") selectedColor = "blue"
        if (key === "y") selectedColor = "yellow"

        if (selectedColor) {
          evaluateInput(selectedColor)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, activeColor, attempts])

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const attemptCount =
      typeof cfg.trials === "number"
        ? cfg.trials
        : typeof cfg.targets === "number"
          ? cfg.targets
          : typeof cfg.attempts === "number"
            ? cfg.attempts
            : typeof cfg.questions === "number"
              ? cfg.questions
              : typeof cfg.rounds === "number"
                ? cfg.rounds
                : 5
    totalAttempts.current = attemptCount
    const diff = getDifficultyParams(
      "choice-reaction",
      (cfg.difficulty as string) || "Medium"
    )
    waitRange.current = {
      min: (diff.waitMin as number) || 1200,
      max: (diff.waitMax as number) || 3500,
    }
    penaltyMs.current = (diff.penaltyMs as number) || 150

    setAttempts([])
    setCurrentScore(null)
    setShareImage(null)
    submittedRef.current = false
    setGameState("waiting")
    setupRandomTimer(waitRange.current.min, waitRange.current.max)
  }

  const setupRandomTimer = (waitMin = 1200, waitMax = 3500) => {
    clickLock.current = false
    setActiveColor(null)
    setHasPenalty(false)
    const delay = waitMin + Math.random() * (waitMax - waitMin)

    if (timerId.current) clearTimeout(timerId.current)

    timerId.current = setTimeout(() => {
      // Pick random color
      const colors: ColorChoice[] = ["red", "green", "blue", "yellow"]
      const pick = colors[Math.floor(Math.random() * colors.length)]

      setActiveColor(pick)
      setGameState("ready")
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now()
        })
      })
    }, delay)
  }

  const evaluateInput = (selection: ColorChoice) => {
    if (clickLock.current || gameState !== "ready") return

    const triggerTime = performance.now()
    const rawElapsed = Math.round(triggerTime - startTime.current)

    if (rawElapsed < 80) {
      // Clicked too early
      setGameState("abort")
      return
    }

    clickLock.current = true

    const isMatch = selection === activeColor
    const penaltyValue = isMatch ? 0 : penaltyMs.current
    const finalScore = rawElapsed + penaltyValue

    const currentAttempt = { score: finalScore, penalty: !isMatch }
    const updatedAttempts = [...attempts, currentAttempt]
    setAttempts(updatedAttempts)
    setCurrentScore(finalScore)
    setHasPenalty(!isMatch)

    if (updatedAttempts.length < totalAttempts.current) {
      setGameState("attempt-result")
    } else {
      const average = Math.round(
        updatedAttempts.reduce((sum, item) => sum + item.score, 0) /
          totalAttempts.current
      )
      finalizeTest(average, updatedAttempts)
    }
  }

  const handlePadClick = (color: ColorChoice, e: React.MouseEvent) => {
    e.preventDefault()
    if (gameState === "ready") {
      evaluateInput(color)
    } else if (gameState === "waiting") {
      // Clicked early
      if (timerId.current) clearTimeout(timerId.current)
      setGameState("abort")
    }
  }

  const handlePanelClick = (e: React.MouseEvent) => {
    if (gameState === "idle") {
    } else if (gameState === "waiting") {
      if (timerId.current) clearTimeout(timerId.current)
      setGameState("abort")
    } else if (gameState === "attempt-result") {
      setGameState("waiting")
      setupRandomTimer()
    } else if (gameState === "abort" || gameState === "result") {
      startTest()
    }
  }

  const finalizeTest = async (
    avgScore: number,
    allAttempts: { score: number; penalty: boolean }[]
  ) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")
    const percentile = lookupPercentile("choice-reaction", avgScore, true)

    try {
      await dataLayer.saveSession({
        testId: "choice-reaction",
        category: "reaction",
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts.map((a) => a.score) },
      })
    } catch (err) {
      console.error("Failed to save Choice Reaction session:", err)
    }
    if (!submittedRef.current) return

    const pb = await dataLayer.getPersonalBest("choice-reaction", "lower")
    setPersonalBest(pb)
    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Choice Reaction Test",
        `${avgScore} ms`,
        percentile,
        true
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }
    if (!submittedRef.current) return

    redirectToResults({
      testId: "choice-reaction",
      testName: "Choice Reaction",
      attempts: allAttempts.map((a) => a.score),
      unit: "ms",
      percentile,
      personalBest: pb,
      category: "reaction",
      average: avgScore,
    })
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(
    () => {
      if (timerId.current) clearTimeout(timerId.current)
      setGameState("abort")
    },
    gameState === "waiting" || gameState === "ready"
  )

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const average = Math.round(
      attempts.reduce((sum, item) => sum + item.score, 0) /
        Math.max(1, attempts.length)
    )
    const token = encodeChallenge({ testId: "choice-reaction", score: average })
    const url = `${window.location.origin}/tests/choice-reaction/?challenge=${token}`

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
      {gameState !== "idle" && gameState !== "result" && (
        <button
          onClick={() => {
            if (timerId.current) clearTimeout(timerId.current)
            if (rafId.current) cancelAnimationFrame(rafId.current)
            if (pressedKeyTimerRef.current)
              clearTimeout(pressedKeyTimerRef.current)
            setGameState("idle")
          }}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
      )}
      {/* Target Challenge */}
      {challengeScore && gameState !== "result" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-foreground">
            Active Challenge: Beat your friend's choice reflex score of{" "}
            <strong className="font-mono text-foreground">
              {challengeScore} ms
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

      {/* Main Interactive Screen Area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handlePanelClick}
        className={`transition-standard flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-card-border p-8 text-center outline-none select-none focus-visible:ring-2 focus-visible:ring-accent ${
          activeColor === "red" && gameState === "ready"
            ? "border-red-900/50 bg-red-950/30"
            : activeColor === "green" && gameState === "ready"
              ? "border-emerald-900/50 bg-emerald-950/30"
              : activeColor === "blue" && gameState === "ready"
                ? "border-blue-900/50 bg-blue-950/30"
                : activeColor === "yellow" && gameState === "ready"
                  ? "border-yellow-900/50 bg-yellow-950/30"
                  : gameState === "abort"
                    ? "border-rose-900/50 bg-rose-950/40"
                    : "bg-card"
        }`}
      >
        {gameState === "idle" && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GameConfigPanel
              testId="choice-reaction"
              icon="🎮"
              title="Choice Grid Test"
              description="Press the matching color pad or press keys R, G, B, Y on your keyboard when the center box flashes. Incorrect choices carry a +150ms penalty!"
              personalBest={personalBest}
              personalBestLabel="ms"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {gameState === "waiting" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded border border-card-border bg-subtle font-mono text-xs text-muted dark:text-muted">
              READY
            </div>
            <p className="mt-3 font-mono text-xs text-muted uppercase">
              Attempt {attempts.length + 1} of {totalAttempts.current} &middot;
              Wait for color flash
            </p>
          </div>
        )}

        {gameState === "ready" && activeColor && (
          <div className="flex flex-col items-center gap-3">
            <div
              style={{ backgroundColor: COLOR_MAP[activeColor].hex }}
              className="flex h-24 w-24 items-center justify-center rounded border border-white/20 text-2xl font-extrabold tracking-tighter text-black shadow-2xl transition-all duration-75"
            >
              {activeColor.toUpperCase()}
            </div>
            <p className="mt-2 animate-pulse font-mono text-xs tracking-widest text-foreground uppercase">
              Press key or click below
            </p>
          </div>
        )}

        {gameState === "attempt-result" && (
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-xs text-muted uppercase">
              Attempt {attempts.length} score
            </span>
            <div className="font-mono text-4xl font-bold text-foreground">
              {currentScore} ms
            </div>
            {hasPenalty && (
              <span className="font-mono text-xs font-semibold text-error uppercase">
                ⚠️ +150ms Mismatch Penalty
              </span>
            )}
            <span className="mt-2 font-mono text-xs text-secondary uppercase">
              Click card to load next color
            </span>
          </div>
        )}

        {gameState === "abort" && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl text-error">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Too Early!</h2>
            <p className="text-xs text-muted">
              You triggered an input before the color loaded. Grid reset.
            </p>
            <span className="mt-2 font-mono text-xs text-muted uppercase">
              Click card to restart
            </span>
          </div>
        )}

        {gameState === "result" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xs text-muted uppercase">
                Final Choice Average
              </span>
              <div className="font-mono text-4xl font-bold text-foreground">
                {Math.round(
                  attempts.reduce((sum, item) => sum + item.score, 0) /
                    totalAttempts.current
                )}{" "}
                ms
              </div>
              <span className="font-mono text-xs text-accent uppercase">
                {formatTopPercentile(
                  lookupPercentile(
                    "choice-reaction",
                    Math.round(
                      attempts.reduce((sum, item) => sum + item.score, 0) /
                        totalAttempts.current
                    ),
                    true
                  ),
                  true
                )}{" "}
                globally
              </span>
            </div>

            <div className="mt-3 grid w-full max-w-sm grid-cols-3 gap-6 border-t border-card-border/50 pt-4 text-center">
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Personal Best
                </span>
                <div className="font-mono text-sm text-foreground">
                  {personalBest ? `${personalBest} ms` : "--"}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Calibration
                </span>
                <div className="font-mono text-sm text-foreground">
                  {calibration ? `${calibration.hz}Hz` : "Detecting..."}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Mismatches
                </span>
                <div className="font-mono text-sm text-foreground">
                  {attempts.filter((a) => a.penalty).length} /{" "}
                  {totalAttempts.current}
                </div>
              </div>
            </div>

            <span className="mt-2 font-mono text-xs text-muted uppercase">
              Click card to try again
            </span>
          </div>
        )}
      </div>

      {/* Interactive Color Pad Array Grid (Acts as mouse triggers) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(COLOR_MAP) as ColorChoice[]).map((col) => {
          const color = COLOR_MAP[col]
          const isPressed = pressedKey === color.key
          return (
            <button
              key={col}
              onClick={(e) => handlePadClick(col, e)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-4 text-center transition-all select-none hover:border-card-border active:scale-95 ${
                isPressed ? color.activeClass : color.bgClass
              }`}
            >
              <div
                style={{ backgroundColor: color.hex }}
                className="h-5 w-5 rounded-full shadow"
              />
              <span
                className={`font-mono text-xs font-medium ${color.textClass}`}
              >
                {color.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Share cards panel */}
      {gameState === "result" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shareImage && (
              <a
                href={shareImage}
                download="cogniarena-choice-reflex.png"
                className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.98]"
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
                <span>Download Choice Profile</span>
              </a>
            )}
            <button
              onClick={copyChallengeLink}
              className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-card-border bg-subtle text-sm text-foreground hover:bg-panel active:scale-[0.98]"
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
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>
                {copiedChallenge ? "Telemetry Copied!" : "Challenge a Friend"}
              </span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => startTest(lastConfig.current ?? undefined)}
              className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-card-border bg-subtle text-sm text-foreground hover:bg-panel active:scale-[0.98]"
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
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Restart Assessment</span>
            </button>
            <button
              onClick={() => setGameState("idle")}
              className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-card-border bg-subtle text-sm text-foreground hover:bg-panel active:scale-[0.98]"
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
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Configure Test</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(ChoiceReactionTest)
