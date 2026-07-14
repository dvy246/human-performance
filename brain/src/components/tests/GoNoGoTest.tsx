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
import { useSound } from "../../runtime/useSound"
import { useI18n } from "../../runtime/useI18n"
import { redirectToResults } from "../../runtime/redirectToResults"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type TestState =
  | "idle"
  | "waiting"
  | "ready"
  | "attempt-result"
  | "inhibited"
  | "abort"
  | "result"

interface ColorState {
  name: string
  hex: string
  isTarget: boolean
}

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance =
    0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4))
  return luminance > 0.179 ? "text-black" : "text-white"
}

const COLORS: ColorState[] = [
  { name: "GREEN", hex: "#10b981", isTarget: true }, // Target (Go)
  { name: "RED", hex: "#ef4444", isTarget: false }, // Distractors (No-Go)
  { name: "BLUE", hex: "#3b82f6", isTarget: false },
  { name: "YELLOW", hex: "#eab308", isTarget: false },
  { name: "PURPLE", hex: "#8b5cf6", isTarget: false },
]

function GoNoGoTest() {
  const { playClick, playError } = useSound()
  const { t } = useI18n()
  const [gameState, setGameState] = useState<TestState>("idle")
  const [currentColor, setCurrentColor] = useState<ColorState | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const [falseAlarms, setFalseAlarms] = useState<number>(0)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)

  const startTime = useRef<number>(0)
  const timerId = useRef<any>(null)
  const targetTimeoutId = useRef<any>(null)
  const rafId = useRef<number>(0)
  const clickLock = useRef<boolean>(false)
  const submittedRef = useRef(false)
  const totalAttempts = useRef<number>(5)
  const waitRange = useRef<{ min: number; max: number }>({
    min: 1000,
    max: 3000,
  })
  const lastConfig = useRef<GameConfig | null>(null)
  const noGoRateRef = useRef<number>(0.35)
  const omissionMsRef = useRef<number>(1500)
  const falseAlarmsRef = useRef<number>(0)
  const stimulusCountRef = useRef<number>(0)
  const correctCountRef = useRef<number>(0)
  const attemptsRef = useRef<number[]>([])

  useEffect(() => {
    let mounted = true
    measureRefreshRate((res) => {
      if (mounted) setCalibration(res)
    })
    dataLayer
      .getPersonalBest("go-no-go", "lower")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const challengeToken = params.get("challenge")
      if (challengeToken) {
        import("../../runtime/share")
          .then(({ decodeChallenge }) => {
            const payload = decodeChallenge(challengeToken)
            if (payload && payload.testId === "go-no-go") {
              if (mounted) setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
      clearTimers()
    }
  }, [])

  const clearTimers = () => {
    if (timerId.current) clearTimeout(timerId.current)
    if (targetTimeoutId.current) clearTimeout(targetTimeoutId.current)
    if (rafId.current) cancelAnimationFrame(rafId.current)
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const attemptsCount = typeof cfg.attempts === "number" ? cfg.attempts : 5
    totalAttempts.current = attemptsCount
    const diff = getDifficultyParams(
      "go-no-go",
      (cfg.difficulty as string) || "Medium"
    )
    waitRange.current = {
      min: (diff.waitMin as number) || 1000,
      max: (diff.waitMax as number) || 3000,
    }
    noGoRateRef.current = (diff.noGoRate as number) || 0.35
    omissionMsRef.current = (diff.omissionMs as number) || 1500
    setAttempts([])
    attemptsRef.current = []
    setFalseAlarms(0)
    falseAlarmsRef.current = 0
    stimulusCountRef.current = 0
    correctCountRef.current = 0
    setCurrentScore(null)
    setShareImage(null)
    submittedRef.current = false
    setGameState("waiting")
    queueNextSignal()
  }

  const queueNextSignal = () => {
    setCurrentColor(null)
    clickLock.current = false
    clearTimers()

    const delay =
      waitRange.current.min +
      Math.random() * (waitRange.current.max - waitRange.current.min)
    timerId.current = setTimeout(() => {
      // `noGoRate` controls the rate of no-go (distractor) trials
      const isTargetSpawn = Math.random() >= noGoRateRef.current
      let selected: ColorState

      if (isTargetSpawn) {
        selected = COLORS[0] // GREEN
      } else {
        const distractors = COLORS.slice(1)
        selected = distractors[Math.floor(Math.random() * distractors.length)]
      }

      setCurrentColor(selected)
      setGameState("ready")

      if (selected.isTarget) {
        // Start reaction timer
        rafId.current = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            startTime.current = performance.now()
          })
        })

        // If user fails to click the target in 1.5 seconds, trigger omission error
        targetTimeoutId.current = setTimeout(() => {
          handleOmission()
        }, omissionMsRef.current)
      } else {
        // Distractor: short flash then show inhibition feedback
        targetTimeoutId.current = setTimeout(() => {
          correctCountRef.current += 1
          setGameState("inhibited")
          targetTimeoutId.current = setTimeout(() => {
            stimulusCountRef.current += 1
            if (stimulusCountRef.current < totalAttempts.current) {
              setGameState("waiting")
              queueNextSignal()
            } else {
              const avg =
                attemptsRef.current.length > 0
                  ? Math.round(
                      attemptsRef.current.reduce((a, b) => a + b, 0) /
                        attemptsRef.current.length
                    )
                  : 0
              finalizeTest(avg, attemptsRef.current.length, attemptsRef.current)
            }
          }, 500)
        }, 600)
      }
    }, delay)
  }

  const handleOmission = () => {
    if (clickLock.current) return
    clickLock.current = true
    stimulusCountRef.current += 1

    // Missed target: add +250ms penalty attempt
    const finalScore = omissionMsRef.current + 250
    const updatedAttempts = [...attemptsRef.current, finalScore]
    attemptsRef.current = updatedAttempts
    setAttempts(updatedAttempts)
    setCurrentScore(finalScore)

    if (stimulusCountRef.current < totalAttempts.current) {
      setGameState("attempt-result")
    } else {
      const average = Math.round(
        updatedAttempts.reduce((a, b) => a + b, 0) / updatedAttempts.length
      )
      finalizeTest(average, updatedAttempts.length, updatedAttempts)
    }
  }

  const handleScreenClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Allow proceeding from attempt-result / result / abort / idle states even if clickLock is engaged
    if (
      gameState === "attempt-result" ||
      gameState === "result" ||
      gameState === "abort" ||
      gameState === "idle"
    ) {
      clickLock.current = false
    }

    if (clickLock.current) return

    if (gameState === "waiting") {
      // Early click before any color flashes
      clearTimers()
      setGameState("abort")
      return
    }

    if (gameState === "ready" && currentColor) {
      clickLock.current = true
      clearTimers()

      if (currentColor.isTarget) {
        // Hit!
        stimulusCountRef.current += 1
        correctCountRef.current += 1
        const elapsed = Math.round(performance.now() - startTime.current)
        const updatedAttempts = [...attemptsRef.current, elapsed]
        attemptsRef.current = updatedAttempts
        setAttempts(updatedAttempts)
        setCurrentScore(elapsed)
        playClick()

        if (stimulusCountRef.current < totalAttempts.current) {
          setGameState("attempt-result")
        } else {
          const average =
            updatedAttempts.length > 0
              ? Math.round(
                  updatedAttempts.reduce((a, b) => a + b, 0) /
                    updatedAttempts.length
                )
              : 0
          finalizeTest(average, updatedAttempts.length, updatedAttempts)
        }
      } else {
        // False Alarm click on distractor!
        playError()
        falseAlarmsRef.current += 1
        setFalseAlarms(falseAlarmsRef.current)
        stimulusCountRef.current += 1

        if (stimulusCountRef.current < totalAttempts.current) {
          setGameState("attempt-result")
          setCurrentScore(null)
        } else {
          const avg =
            attemptsRef.current.length > 0
              ? Math.round(
                  attemptsRef.current.reduce((a, b) => a + b, 0) /
                    attemptsRef.current.length
                )
              : 0
          finalizeTest(avg, attemptsRef.current.length, attemptsRef.current)
        }
      }
    } else if (gameState === "attempt-result") {
      setGameState("waiting")
      queueNextSignal()
    } else if (
      gameState === "abort" ||
      gameState === "result" ||
      gameState === "idle"
    ) {
      startTest(lastConfig.current || undefined)
    }
  }

  const finalizeTest = async (
    avgScore: number,
    roundsCount: number,
    allAttempts: number[]
  ) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")

    // Penalize score for False Alarms: add +250ms per false alarm to the final average
    const fAlarms = falseAlarmsRef.current
    const finalAverage = avgScore + fAlarms * 250
    const percentile = lookupPercentile("go-no-go", finalAverage, true)

    try {
      await dataLayer.saveSession({
        testId: "go-no-go",
        category: "reaction",
        rawScore: finalAverage,
        percentile: percentile,
        metadata: { falseAlarms: fAlarms, attempts: allAttempts },
      })
    } catch (err) {
      console.error("Failed to save Go/No-Go session:", err)
    }

    let pb: number | null = null
    try {
      pb = await dataLayer.getPersonalBest("go-no-go", "lower")
    } catch (err) {
      console.error("Failed to get personal best:", err)
    }
    setPersonalBest(pb)

    try {
      const card = await generateShareCard(
        "Go/No-Go Color Test",
        `${finalAverage} ms`,
        percentile,
        true
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    if (!submittedRef.current) return

    redirectToResults({
      testId: "go-no-go",
      testName: "Go/No-Go",
      attempts: allAttempts,
      unit: "ms",
      percentile,
      personalBest: pb,
      category: "reaction",
      average: finalAverage,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(
    () => {
      if (timerId.current) clearTimeout(timerId.current)
      if (targetTimeoutId.current) clearTimeout(targetTimeoutId.current)
      if (rafId.current) cancelAnimationFrame(rafId.current)
      setGameState("idle")
    },
    gameState !== "idle" && gameState !== "result"
  )

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const avgScore =
      attemptsRef.current.length > 0
        ? Math.round(
            attemptsRef.current.reduce((a, b) => a + b, 0) /
              attemptsRef.current.length
          ) +
          falseAlarms * 250
        : 0
    const token = encodeChallenge({ testId: "go-no-go", score: avgScore })
    const url = `${window.location.origin}/tests/go-no-go/?challenge=${token}`

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
            if (targetTimeoutId.current) clearTimeout(targetTimeoutId.current)
            if (rafId.current) cancelAnimationFrame(rafId.current)
            setGameState("idle")
          }}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
      )}
      {challengeScore && gameState !== "result" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-foreground">
            {t("test.challenge_beat")}{" "}
            <strong className="font-mono text-foreground">
              {challengeScore} ms
            </strong>
            !
          </span>
          <button
            onClick={() => setChallengeScore(null)}
            className="font-mono text-[11px] text-muted uppercase hover:text-foreground"
          >
            {t("test.dismiss")}
          </button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-live="polite"
        aria-atomic="true"
        onClick={handleScreenClick}
        className={`transition-standard flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-card-border p-8 text-center outline-none select-none focus-visible:ring-2 focus-visible:ring-accent ${
          gameState === "ready" && currentColor ? "transition-none" : ""
        }`}
        style={{
          backgroundColor:
            gameState === "ready" && currentColor
              ? currentColor.hex
              : undefined,
        }}
      >
        {gameState === "idle" && (
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <GameConfigPanel
              testId="go-no-go"
              icon="🟢"
              title="Go/No-Go Color Test"
              description="Click ONLY when GREEN appears. Suppress clicks for other colors. False clicks carry a +250ms penalty."
              personalBest={personalBest}
              personalBestLabel="ms"
              startLabel="Start Test"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {gameState === "waiting" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded border border-card-border bg-subtle font-mono text-xs text-muted dark:text-muted">
              {t("gng.wait")}
            </div>
            <p className="mt-3 font-mono text-xs text-muted uppercase">
              {t("gng.rounds")} {attempts.length} / {totalAttempts.current}{" "}
              &middot; {t("gng.click_green")}
            </p>
          </div>
        )}

        {gameState === "ready" && currentColor && (
          <div className="relative flex flex-col items-center gap-1.5">
            {currentColor.isTarget ? (
              <>
                <span className="absolute top-0 right-0 rounded bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                  GO
                </span>
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  className="mb-2"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                  />
                  <circle cx="40" cy="40" r="20" fill="white" opacity="0.3" />
                </svg>
              </>
            ) : (
              <>
                <span className="absolute top-0 right-0 rounded bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                  STOP
                </span>
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  className="mb-2"
                >
                  <line
                    x1="15"
                    y1="15"
                    x2="65"
                    y2="65"
                    stroke="white"
                    strokeWidth="4"
                  />
                  <line
                    x1="65"
                    y1="15"
                    x2="15"
                    y2="65"
                    stroke="white"
                    strokeWidth="4"
                  />
                </svg>
              </>
            )}
            <span
              className={`${getContrastText(currentColor.hex)} text-3xl font-extrabold tracking-wider drop-shadow filter`}
            >
              {currentColor.name}
            </span>
            <span
              className={`${getContrastText(currentColor.hex)}/70 font-mono text-xs uppercase`}
            >
              {currentColor.isTarget ? t("gng.go") : t("gng.no_go")}
            </span>
          </div>
        )}

        {gameState === "attempt-result" && (
          <div className="flex flex-col items-center gap-3">
            {currentScore !== null ? (
              <>
                <span className="font-mono text-xs text-muted uppercase">
                  {t("gng.reaction_latency")}
                </span>
                <div className="font-mono text-4xl font-bold text-foreground">
                  {currentScore} ms
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl text-error">⚠️</span>
                <div className="font-mono text-2xl font-bold tracking-wide text-error uppercase">
                  {t("gng.false_alarm")}
                </div>
                <p className="max-w-xs text-xs leading-relaxed text-secondary">
                  {t("gng.distractor_penalty")}
                </p>
                <span className="mt-1 font-mono text-[10px] text-muted uppercase">
                  {t("gng.rounds")} {attempts.length} / {totalAttempts.current}
                </span>
              </>
            )}
            <span className="mt-4 animate-pulse font-mono text-xs text-muted uppercase">
              {t("gng.click_continue")}
            </span>
          </div>
        )}

        {gameState === "inhibited" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-2xl">
              ✓
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-emerald-400 uppercase">
              Inhibited!
            </span>
            <p className="text-xs text-secondary">
              Correctly suppressed distractor click
            </p>
          </div>
        )}

        {gameState === "abort" && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl text-error">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">
              {t("gng.early_click")}
            </h2>
            <p className="text-xs text-muted">
              {t("gng.clicked_before_flash")}
            </p>
            <span className="mt-2 font-mono text-xs text-muted uppercase">
              {t("gng.click_restart_card")}
            </span>
          </div>
        )}

        {gameState === "result" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xs text-muted uppercase">
                {t("gng.inhibitory_avg")}
              </span>
              <div className="font-mono text-4xl font-bold text-foreground">
                {attempts.length > 0
                  ? Math.round(
                      attempts.reduce((a, b) => a + b, 0) / attempts.length
                    ) +
                    falseAlarms * 250
                  : 0}{" "}
                ms
              </div>
              <span className="mt-1 font-mono text-xs text-accent uppercase">
                {attempts.length > 0
                  ? formatTopPercentile(
                      lookupPercentile(
                        "go-no-go",
                        Math.round(
                          attempts.reduce((a, b) => a + b, 0) / attempts.length
                        ) +
                          falseAlarms * 250,
                        true
                      ),
                      true
                    )
                  : ""}{" "}
                {t("rt.globally")}
              </span>
            </div>

            <div className="mt-3 grid w-full max-w-sm grid-cols-3 gap-6 border-t border-card-border/50 pt-4 text-center">
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  {t("gng.accuracy")}
                </span>
                <div className="font-mono text-sm text-foreground">
                  {totalAttempts.current > 0
                    ? `${Math.round((correctCountRef.current / totalAttempts.current) * 100)}%`
                    : "--"}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  {t("gng.false_alarms")}
                </span>
                <div className="font-mono text-sm text-foreground">
                  {falseAlarms}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  {t("test.personal_best")}
                </span>
                <div className="font-mono text-sm text-foreground">
                  {personalBest ? `${personalBest} ms` : "--"}
                </div>
              </div>
            </div>
            <span className="font-mono text-[9px] text-muted">
              {t("test.calibration")}{" "}
              {calibration ? `${calibration.hz}Hz` : t("test.detecting")}
            </span>

            <span className="mt-2 font-mono text-xs text-muted uppercase">
              {t("gng.click_try_again")}
            </span>
          </div>
        )}
      </div>

      {gameState === "result" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shareImage && (
              <a
                href={shareImage}
                download="cogniarena-go-no-go.png"
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
                <span>{t("gng.download_profile")}</span>
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
                {copiedChallenge
                  ? t("test.challenge_copied")
                  : t("test.challenge_friend")}
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
              <span>{t("test.restart")}</span>
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

export default withErrorBoundary(GoNoGoTest)
