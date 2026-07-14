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

type TestState = "idle" | "playing" | "result"

interface Target {
  x: number
  y: number
  r: number
  spawnTime: number
}

function AimTrainer() {
  const { playClick, playError } = useSound()
  const { t } = useI18n()
  const [gameState, setGameState] = useState<TestState>("idle")
  const [hits, setHits] = useState<number>(0)
  const [clicks, setClicks] = useState<number>(0)
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)

  // Performance arrays
  const [latencies, setLatencies] = useState<number[]>([])
  const [offsets, setOffsets] = useState<number[]>([])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentTarget = useRef<Target | null>(null)
  const activeHits = useRef<number>(0)
  const activeClicks = useRef<number>(0)
  const targetIndex = useRef<number>(0)
  const respondedRef = useRef(false)
  const latenciesArr = useRef<number[]>([])
  const offsetsArr = useRef<number[]>([])
  const submittedRef = useRef(false)
  const totalAttempts = useRef<number>(5)
  const waitRange = useRef<{ min: number; max: number }>({
    min: 1000,
    max: 3000,
  })
  const lastConfig = useRef<GameConfig | null>(null)
  const totalTargets = useRef<number>(30)
  const sizeMultiplier = useRef<number>(1)

  useEffect(() => {
    let mounted = true
    const cleanupCalibration = measureRefreshRate((res) => {
      if (mounted) setCalibration(res)
    })
    dataLayer
      .getPersonalBest("aim-trainer", "lower")
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
            const payload = decodeChallenge(decodeURIComponent(challengeToken))
            if (payload && payload.testId === "aim-trainer") {
              if (mounted) setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
      cleanupCalibration()
    }
  }, [])

  // Canvas drawing loop
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw Grid Background for Technical Aesthetic
      ctx.strokeStyle = "#09090b"
      ctx.lineWidth = 1
      for (let i = 20; i < canvas.width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let j = 20; j < canvas.height; j += 20) {
        ctx.beginPath()
        ctx.moveTo(0, j)
        ctx.lineTo(canvas.width, j)
        ctx.stroke()
      }

      // Draw Target
      if (currentTarget.current) {
        const { x, y, r } = currentTarget.current
        const timeElapsed = performance.now() - currentTarget.current.spawnTime

        // Target pulse pulse rate
        const pulse = r + Math.sin(timeElapsed / 100) * 1.5

        // Outer Glow ring
        ctx.shadowBlur = 15
        ctx.shadowColor = "rgba(217, 119, 6, 0.4)"

        ctx.beginPath()
        ctx.arc(x, y, pulse, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(217, 119, 6, 0.15)"
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = "#d97706"
        ctx.stroke()

        // Inner Core target
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(x, y, r / 3.5, 0, Math.PI * 2)
        ctx.fillStyle = "#fafafa"
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [gameState])

  const spawnTarget = () => {
    if (!canvasRef.current) return
    respondedRef.current = false
    const canvas = canvasRef.current
    const r = Math.round(24 * sizeMultiplier.current)
    const padding = 40

    const x = padding + Math.random() * (canvas.width - padding * 2)
    const y = padding + Math.random() * (canvas.height - padding * 2)

    currentTarget.current = {
      x,
      y,
      r,
      spawnTime: performance.now(),
    }
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    totalTargets.current = (cfg.targets as number) || 30
    const diff = getDifficultyParams(
      "aim-trainer",
      (cfg.difficulty as string) || "Medium"
    )
    sizeMultiplier.current = (diff.sizeMultiplier as number) || 1
    activeHits.current = 0
    activeClicks.current = 0
    targetIndex.current = 0
    latenciesArr.current = []
    offsetsArr.current = []

    setHits(0)
    setClicks(0)
    setCurrentTargetIndex(0)
    setLatencies([])
    setOffsets([])
    setShareImage(null)
    submittedRef.current = false
    setGameState("playing")
    respondedRef.current = false

    setTimeout(() => {
      spawnTarget()
    }, 100)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (gameState !== "playing" || !canvasRef.current || !currentTarget.current)
      return
    if (respondedRef.current) return

    activeClicks.current += 1
    setClicks(activeClicks.current)

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Translate click coordinates from screen space to internal canvas dimensions
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    const target = currentTarget.current
    const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2)

    if (dist <= target.r) {
      respondedRef.current = true
      // Hit!
      playClick()
      const timeElapsed = Math.round(performance.now() - target.spawnTime)
      latenciesArr.current.push(timeElapsed)
      offsetsArr.current.push(Number(dist.toFixed(1)))

      activeHits.current += 1
      setHits(activeHits.current)

      targetIndex.current += 1
      setCurrentTargetIndex(targetIndex.current)

      if (targetIndex.current >= totalTargets.current) {
        finalizeTest()
      } else {
        spawnTarget()
      }
    } else {
      // Miss
      playError()
      // We don't advance the target, player must click the target to advance.
      // This measures exact latency to target acquisition and tracks penalty clicks.
    }
  }

  const finalizeTest = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")
    currentTarget.current = null

    const averageLatency = Math.round(
      latenciesArr.current.reduce((a, b) => a + b, 0) / totalTargets.current
    )
    const averageOffset = Number(
      (
        offsetsArr.current.reduce((a, b) => a + b, 0) / totalTargets.current
      ).toFixed(1)
    )
    const accuracy = Math.round(
      (totalTargets.current / activeClicks.current) * 100
    )

    setLatencies(latenciesArr.current)
    setOffsets(offsetsArr.current)

    try {
      await dataLayer.saveSession({
        testId: "aim-trainer",
        category: "precision",
        rawScore: averageLatency,
        percentile: lookupPercentile("aim-trainer", averageLatency, true),
        metadata: { accuracy, offset: averageOffset },
      })
    } catch (err) {
      console.error("Failed to save Aim Trainer session:", err)
    }
    if (!submittedRef.current) return

    const pb = await dataLayer.getPersonalBest("aim-trainer", "lower")
    setPersonalBest(pb)
    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Aim Precision Trainer",
        `${averageLatency} ms avg`,
        lookupPercentile("aim-trainer", averageLatency, true)
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }
    if (!submittedRef.current) return

    redirectToResults({
      testId: "aim-trainer",
      testName: "Aim Trainer",
      attempts: latenciesArr.current,
      unit: "ms",
      percentile: lookupPercentile("aim-trainer", averageLatency, true),
      personalBest: pb,
      category: "precision",
      average: averageLatency,
    })
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(() => {
    setGameState("idle")
  }, gameState === "playing")

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const average = Math.round(
      latenciesArr.current.reduce((a, b) => a + b, 0) / totalTargets.current
    )
    const token = encodeChallenge({ testId: "aim-trainer", score: average })
    const url = `${window.location.origin}/tests/aim-trainer/?challenge=${token}`

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Challenge Status */}
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

      {/* Screen Canvas Area */}
      {gameState === "playing" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>
              {t("aim.targets")}{" "}
              <strong className="text-foreground">
                {currentTargetIndex} / {totalTargets.current}
              </strong>
            </span>
            <span className="flex items-center gap-2">
              <span>
                {t("aim.accuracy")}{" "}
                <strong className="text-accent">
                  {clicks > 0 ? Math.round((hits / clicks) * 100) : 100}%
                </strong>
              </span>
              <button
                onClick={() => setGameState("idle")}
                className="transition-standard flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[10px] text-muted hover:border-error/50 hover:text-error"
                aria-label="Restart"
              >
                ✕
              </button>
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width="600"
            height="340"
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair rounded-xl border border-card-border bg-[#030303] shadow-inner"
          />
        </div>
      ) : gameState === "result" ? (
        /* Result Dashboard */
        <div className="flex w-full flex-col items-center gap-6 rounded-xl border border-card-border bg-card p-8">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs text-muted uppercase">
              {t("aim.avg_latency")}
            </span>
            <div className="font-mono text-5xl font-bold text-foreground">
              {Math.round(
                latencies.reduce((a, b) => a + b, 0) / totalTargets.current
              )}{" "}
              ms
            </div>
            <span className="font-mono text-xs text-accent uppercase">
              {formatTopPercentile(
                lookupPercentile(
                  "aim-trainer",
                  Math.round(
                    latencies.reduce((a, b) => a + b, 0) / totalTargets.current
                  ),
                  true
                ),
                true
              )}{" "}
              {t("aim.aim_profile")}
            </span>
          </div>

          {/* Stats grid */}
          <div className="mt-2 grid w-full max-w-sm grid-cols-3 gap-6 border-t border-card-border/50 pt-4 text-center">
            <div>
              <span className="font-mono text-[10px] text-muted uppercase">
                {t("aim.accuracy_rate")}
              </span>
              <div className="font-mono text-sm text-foreground">
                {clicks > 0
                  ? Math.round((totalTargets.current / clicks) * 100)
                  : 0}
                %
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] text-muted uppercase">
                {t("aim.pinpoint_error")}
              </span>
              <div className="font-mono text-sm text-foreground">
                {(
                  offsets.reduce((a, b) => a + b, 0) / totalTargets.current
                ).toFixed(1)}{" "}
                px
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

          <button
            onClick={() => startTest()}
            className="mt-2 cursor-pointer rounded border border-card-border bg-subtle px-4 py-1.5 font-mono text-xs tracking-widest text-muted uppercase hover:border-accent/30 hover:text-foreground"
          >
            {t("test.restart")}
          </button>
        </div>
      ) : (
        /* Idle — Config Panel */
        <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-xl border border-card-border bg-card p-8 text-center">
          <GameConfigPanel
            testId="aim-trainer"
            icon="🎯"
            title="Aim Precision Trainer"
            description="Click 30 random glowing targets as fast and accurately as possible. We measure raw response speed, accuracy, and pixel offset precision."
            personalBest={personalBest}
            personalBestLabel="ms"
            startLabel="Start Aim Assessment"
            onStart={(config: GameConfig) => startTest(config)}
          />
        </div>
      )}

      {/* Share Actions */}
      {gameState === "result" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-aim-score.png"
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
              <span>{t("aim.download_aim")}</span>
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

export default withErrorBoundary(AimTrainer)
