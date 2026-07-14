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
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type TestState = "idle" | "clicking" | "result"

type Duration = 5 | 10 | 30 | 60

const ClickSpeedTest = () => {
  const { playClick } = useSound()
  const { t } = useI18n()
  const [gameState, setGameState] = useState<TestState>("idle")
  const [clicks, setClicks] = useState<number>(0)
  const [duration, setDuration] = useState<Duration>(10)
  const [timeLeft, setTimeLeft] = useState<number>(10.0)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)

  // For drawing the cadence graph
  const [clickRates, setClickRates] = useState<number[]>([])

  const timerRef = useRef<any>(null)
  const clicksRef = useRef<number>(0)
  const intervalClicksRef = useRef<number>(0)
  const startTime = useRef<number>(0)
  const submittedRef = useRef(false)
  const finalCpsRef = useRef(0)
  const lastConfig = useRef<GameConfig | null>(null)

  useEffect(() => {
    let mounted = true
    const cleanupCalibration = measureRefreshRate((res) => {
      if (mounted) setCalibration(res)
    })
    dataLayer
      .getPersonalBest("click-speed", "higher")
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
            if (payload && payload.testId === "click-speed") {
              if (mounted) setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
      cleanupCalibration()
    }
  }, [])

  const beginClicking = (dur: number) => {
    setGameState("clicking")
    setClicks(0)
    clicksRef.current = 0
    intervalClicksRef.current = 0
    setTimeLeft(dur)
    setClickRates([])
    startTime.current = performance.now()

    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTime.current) / 1000
      const remaining = Math.max(0, dur - elapsed)
      setTimeLeft(remaining)

      const currentCps = intervalClicksRef.current / 0.1
      setClickRates((prev) => [...prev, Number(currentCps.toFixed(1))])
      intervalClicksRef.current = 0

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        finalizeTest(clicksRef.current)
      }
    }, 100)
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    if (timerRef.current) clearInterval(timerRef.current)
    submittedRef.current = false
    clicksRef.current = 0
    intervalClicksRef.current = 0
    finalCpsRef.current = 0
    setClicks(0)
    setClickRates([])

    const dur =
      config && typeof config.duration === "number" ? config.duration : duration
    setDuration(dur as Duration)
    beginClicking(dur)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (gameState === "result") return

    if (gameState === "idle") {
      beginClicking(duration)
      clicksRef.current = 1
      intervalClicksRef.current = 1
      setClicks(1)
    } else if (gameState === "clicking") {
      clicksRef.current += 1
      intervalClicksRef.current += 1
      setClicks(clicksRef.current)
      playClick()
    }
  }

  const finalizeTest = async (finalClicks: number) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")

    // Precise CPS calculation using actual elapsed time
    const actualElapsed = (performance.now() - startTime.current) / 1000
    const cps = Number((finalClicks / Math.max(0.1, actualElapsed)).toFixed(1))
    finalCpsRef.current = cps
    const percentile = lookupPercentile("click-speed", cps)

    try {
      await dataLayer.saveSession({
        testId: "click-speed",
        category: "stamina",
        rawScore: cps,
        percentile: percentile,
        metadata: { clicks: finalClicks, duration },
      })
    } catch (err) {
      console.error("Failed to save Click Speed session:", err)
    }

    if (!submittedRef.current) return

    const pb = await dataLayer.getPersonalBest("click-speed", "higher")
    setPersonalBest(pb)

    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Click Speed (CPS) Test",
        `${cps} CPS`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    if (!submittedRef.current) return

    redirectToResults({
      testId: "click-speed",
      testName: "Click Speed",
      attempts: [cps],
      unit: "CPS",
      percentile,
      personalBest: pb,
      category: "stamina",
      average: cps,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const cps = finalCpsRef.current || Number((clicks / duration).toFixed(1))
    const token = encodeChallenge({ testId: "click-speed", score: cps })
    const url = `${window.location.origin}/tests/click-speed/?challenge=${token}`

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    submittedRef.current = false
    clicksRef.current = 0
    intervalClicksRef.current = 0
    finalCpsRef.current = 0
    setGameState("idle")
    setClicks(0)
    setTimeLeft(duration)
    setClickRates([])
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(() => resetTest(), gameState === "clicking")

  // SVG Cadence Path Generator
  const lastChartPath = useRef<string>("")
  const lastClickRatesLen = useRef<number>(0)

  const generateChartPath = () => {
    if (clickRates.length < 2) return ""
    if (clickRates.length === lastClickRatesLen.current)
      return lastChartPath.current

    const maxVal = clickRates.reduce((a, b) => Math.max(a, b), 15)
    const minVal = clickRates.reduce((a, b) => Math.min(a, b), 0)
    const range = maxVal - minVal || 1
    const width = 360
    const height = 80

    const path = clickRates
      .map((val, idx) => {
        const x = (idx / (clickRates.length - 1)) * width
        const y = height - ((val - minVal) / range) * height
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(" ")

    lastChartPath.current = path
    lastClickRatesLen.current = clickRates.length
    return path
  }

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
      {gameState !== "idle" && gameState !== "result" && (
        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            setGameState("idle")
          }}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
      )}
      {/* Active Challenge Alert */}
      {challengeScore && gameState !== "result" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-foreground">
            {t("test.challenge_beat")}{" "}
            <strong className="font-mono text-foreground">
              {challengeScore} CPS
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

      {/* Click Pad Screen */}
      {gameState !== "result" ? (
        <div
          role="button"
          tabIndex={0}
          onMouseDown={handleClick}
          className={`transition-standard flex min-h-[380px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-card-border p-8 text-center outline-none select-none focus-visible:ring-2 focus-visible:ring-accent ${
            gameState === "clicking"
              ? "border-card-border/80 bg-subtle"
              : "bg-card hover:border-muted"
          }`}
        >
          {gameState === "idle" ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GameConfigPanel
                testId="click-speed"
                icon="🖱️"
                title="Click Speed Test (CPS)"
                description="Click inside this card as fast as you can. The timer begins on your first click."
                personalBest={personalBest}
                personalBestLabel="CPS"
                startLabel="Start Test"
                onStart={(config: GameConfig) => startTest(config)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-xs text-muted uppercase">
                {t("cps.spam_click")}
              </span>
              <div className="font-mono text-6xl font-bold text-foreground">
                {clicks}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm text-accent">
                  {timeLeft.toFixed(1)}s {t("cps.remaining")}
                </span>
                <span className="font-mono text-xs text-muted">
                  {(clicks / Math.max(0.1, duration - timeLeft)).toFixed(1)}{" "}
                  {t("cps.clicks_sec")}
                </span>
              </div>
              {/* Real-time CPS Chart */}
              {clickRates.length > 1 && (
                <div className="mt-2 w-full max-w-xs">
                  <svg
                    width="100%"
                    height="60"
                    viewBox="0 0 360 60"
                    className="fill-none stroke-accent"
                  >
                    <line
                      x1="0"
                      y1="30"
                      x2="360"
                      y2="30"
                      stroke="var(--border-primary)"
                      strokeDasharray="2,2"
                    />
                    <path
                      d={generateChartPath()}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="flex w-full flex-col items-center gap-6 rounded-xl border border-card-border bg-card p-8">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs text-muted uppercase">
              {t("cps.cps_duration")} ({duration}s)
            </span>
            <div className="font-mono text-5xl font-bold text-foreground">
              {finalCpsRef.current.toFixed(1)}
            </div>
            <span className="font-mono text-xs text-accent uppercase">
              {formatTopPercentile(
                lookupPercentile("click-speed", finalCpsRef.current)
              )}{" "}
              {t("cps.top_clickers")}
            </span>
            {personalBest && finalCpsRef.current >= personalBest && (
              <span className="mt-1 font-mono text-xs font-bold text-success">
                {t("cps.new_pb")}
              </span>
            )}
          </div>

          {/* Clicking Cadence Timeline Chart */}
          {clickRates.length > 1 && (
            <div className="flex w-full max-w-sm flex-col gap-2 pt-2">
              <span className="text-left font-mono text-[10px] text-muted uppercase">
                {t("cps.cadence")}
              </span>
              <div className="flex w-full items-center justify-center rounded border border-card-border/50 bg-subtle p-4">
                <svg
                  width="100%"
                  height="80"
                  viewBox="0 0 360 80"
                  className="fill-none stroke-accent"
                >
                  {/* Grid Lines */}
                  <line
                    x1="0"
                    y1="40"
                    x2="360"
                    y2="40"
                    stroke="var(--border-primary)"
                    strokeDasharray="2,2"
                  />
                  {/* Cadence Path */}
                  <path
                    d={generateChartPath()}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="mt-2 grid w-full max-w-sm grid-cols-3 gap-6 border-t border-card-border/50 pt-4 text-center">
            <div>
              <span className="font-mono text-[10px] text-muted uppercase">
                {t("cps.total_clicks")}
              </span>
              <div className="font-mono text-sm text-foreground">{clicks}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] text-muted uppercase">
                {t("test.personal_best")}
              </span>
              <div className="font-mono text-sm text-foreground">
                {personalBest ? `${personalBest} CPS` : "--"}
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] text-muted uppercase">
                {t("test.calibrated_hz")}
              </span>
              <div className="font-mono text-sm text-foreground">
                {calibration ? `${calibration.hz}Hz` : t("test.detecting")}
              </div>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="mt-2 cursor-pointer rounded border border-card-border bg-subtle px-4 py-1.5 font-mono text-xs tracking-widest text-muted uppercase hover:border-accent/30 hover:text-foreground"
          >
            {t("test.restart")}
          </button>
        </div>
      )}

      {/* Share Actions */}
      {gameState === "result" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-cps-score.png"
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
              <span>{t("cps.download_profile")}</span>
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
      )}
    </div>
  )
}

export default withErrorBoundary(ClickSpeedTest)
