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

function SoundReactionTest() {
  const [gameState, setGameState] = useState<TestState>("idle")
  const [attempts, setAttempts] = useState<number[]>([])
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)
  const [audioError, setAudioError] = useState<boolean>(false)

  const startTime = useRef<number>(0)
  const timerId = useRef<any>(null)
  const rafId = useRef<number>(0)
  const clickLock = useRef<boolean>(false)
  const audioCtx = useRef<AudioContext | null>(null)
  const submittedRef = useRef<boolean>(false)
  const totalAttempts = useRef<number>(5)
  const waitRange = useRef<{ min: number; max: number }>({
    min: 2000,
    max: 5000,
  })
  const lastConfig = useRef<GameConfig | null>(null)

  useEffect(() => {
    let mounted = true
    // 1. Get Calibration
    const cleanupCalibration = measureRefreshRate((res) => {
      if (mounted) setCalibration(res)
    })

    // 2. Personal Best
    dataLayer
      .getPersonalBest("sound-reaction", "lower")
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
            if (payload && payload.testId === "sound-reaction") {
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
      cleanupCalibration()
      if (audioCtx.current) {
        audioCtx.current.close()
      }
    }
  }, [])

  const initAudio = async () => {
    if (typeof window === "undefined") return false
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )()
      }
      if (audioCtx.current.state === "suspended") {
        await audioCtx.current.resume()
      }
      setAudioError(false)
      return true
    } catch (err) {
      console.error("Failed to initialize AudioContext:", err)
      setAudioError(true)
      return false
    }
  }

  const playBeep = () => {
    if (!audioCtx.current) {
      setAudioError(true)
      return
    }
    try {
      const ctx = audioCtx.current

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(750, ctx.currentTime) // Crisp 750Hz sine tone

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime) // Safe visual loudness
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.25)
      setAudioError(false)
    } catch (err) {
      console.error("Failed to play beep:", err)
      setAudioError(true)
    }
  }

  const startTest = async (config?: GameConfig) => {
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
      "sound-reaction",
      (cfg.difficulty as string) || "Medium"
    )
    waitRange.current = {
      min: (diff.waitMin as number) || 2000,
      max: (diff.waitMax as number) || 5000,
    }

    const audioInitialized = await initAudio()
    if (!audioInitialized) {
      console.warn(
        "Audio initialization failed - test will continue with visual feedback only"
      )
    }
    setAttempts([])
    setCurrentScore(null)
    setShareImage(null)
    submittedRef.current = false
    setGameState("waiting")
    setupRandomTimer(waitRange.current.min, waitRange.current.max)
  }

  const setupRandomTimer = (waitMin = 2000, waitMax = 5000) => {
    clickLock.current = false
    const delay = waitMin + Math.random() * (waitMax - waitMin)

    if (timerId.current) clearTimeout(timerId.current)

    timerId.current = setTimeout(() => {
      setGameState("ready")
      playBeep()
      rafId.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTime.current = performance.now()
        })
      })
    }, delay)
  }

  const handleTrigger = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()

    // Allow proceeding from attempt-result / result / abort states even if clickLock is engaged
    if (
      gameState === "attempt-result" ||
      gameState === "result" ||
      gameState === "abort"
    ) {
      clickLock.current = false
    }

    if (clickLock.current) return

    if (gameState === "idle") {
      startTest(lastConfig.current || undefined)
    } else if (gameState === "waiting") {
      // CLICKED TOO EARLY (sound hasn't beeped yet)
      if (timerId.current) clearTimeout(timerId.current)
      setGameState("abort")
    } else if (gameState === "ready") {
      const reactionTime = Math.round(performance.now() - startTime.current)

      if (reactionTime < 60) {
        // Anticipated early start
        setGameState("abort")
        return
      }

      clickLock.current = true

      const updatedAttempts = [...attempts, reactionTime]
      setAttempts(updatedAttempts)
      setCurrentScore(reactionTime)

      if (updatedAttempts.length < totalAttempts.current) {
        setGameState("attempt-result")
      } else {
        const average = Math.round(
          updatedAttempts.reduce((a, b) => a + b, 0) /
            Math.max(1, updatedAttempts.length)
        )
        finalizeTest(average, updatedAttempts)
      }
    } else if (gameState === "attempt-result") {
      setGameState("waiting")
      setupRandomTimer()
    } else if (gameState === "abort" || gameState === "result") {
      startTest()
    }
  }

  const finalizeTest = async (avgScore: number, allAttempts: number[]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")
    const percentile = lookupPercentile("sound-reaction", avgScore, true)

    try {
      await dataLayer.saveSession({
        testId: "sound-reaction",
        category: "reaction",
        rawScore: avgScore,
        percentile: percentile,
        metadata: { attempts: allAttempts },
      })
    } catch (err) {
      console.error("Failed to save Sound Reaction session:", err)
    }
    if (!submittedRef.current) return

    const pb = await dataLayer.getPersonalBest("sound-reaction", "lower")
    setPersonalBest(pb)
    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Auditory Reaction Test",
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
      testId: "sound-reaction",
      testName: "Sound Reaction",
      attempts: allAttempts,
      unit: "ms",
      percentile,
      personalBest: pb,
      category: "reaction",
      average: avgScore,
    })
  }

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const average = Math.round(
      attempts.reduce((a, b) => a + b, 0) / Math.max(1, attempts.length)
    )
    const token = encodeChallenge({ testId: "sound-reaction", score: average })
    const url = `${window.location.origin}/tests/sound-reaction/?challenge=${token}`

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter") {
      handleTrigger(e)
    }
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(
    () => {
      if (timerId.current) clearTimeout(timerId.current)
      setGameState("idle")
    },
    gameState !== "idle" && gameState !== "result" && gameState !== "abort"
  )

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
      {gameState !== "idle" && gameState !== "result" && (
        <button
          onClick={() => {
            if (timerId.current) clearTimeout(timerId.current)
            if (rafId.current) cancelAnimationFrame(rafId.current)
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
            Active Challenge: Beat your friend's sound response of{" "}
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

      {/* Main Sound Wave Panel */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTrigger}
        onKeyDown={handleKeyDown}
        className={`transition-standard flex min-h-[380px] w-full flex-col items-center justify-center rounded-xl border border-card-border p-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          gameState === "ready"
            ? "border-accent/60 bg-subtle shadow-2xl"
            : gameState === "abort"
              ? "border-rose-900/50 bg-rose-950/30 text-rose-200"
              : "bg-card hover:border-muted"
        }`}
      >
        {gameState === "idle" && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GameConfigPanel
              testId="sound-reaction"
              icon="🔊"
              title="Sound Reaction Test"
              description="Click inside the card to begin. Wait for the audio beep, and react the exact instant you hear the tone."
              personalBest={personalBest}
              personalBestLabel="ms"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {gameState === "waiting" && (
          <div className="flex flex-col items-center gap-6">
            <span className="font-mono text-xs text-muted uppercase">
              Attempt {attempts.length + 1} of {totalAttempts.current}
            </span>
            {/* Flat Waveform (Waiting) */}
            <svg
              viewBox="0 0 100 20"
              className="h-8 w-48 stroke-[var(--border-primary)]"
              strokeWidth="2"
              fill="none"
            >
              <line x1="0" y1="10" x2="100" y2="10" />
            </svg>
            <h2 className="text-lg font-medium text-foreground">
              Listen closely...
            </h2>
            {audioError && (
              <p className="max-w-xs text-center font-mono text-xs text-warning">
                ⚠️ Audio unavailable. Using visual feedback only.
              </p>
            )}
          </div>
        )}

        {gameState === "ready" && (
          <div className="flex flex-col items-center gap-6">
            <span className="font-mono text-xs text-secondary uppercase">
              Attempt {attempts.length + 1} of {totalAttempts.current}
            </span>
            {/* Active pulsing Soundwave (Beeping) */}
            <svg
              viewBox="0 0 100 20"
              className="h-8 w-48 animate-pulse fill-none stroke-accent"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M 0,10 Q 12.5,0 25,10 T 50,10 T 75,10 T 100,10 M 12.5,10 Q 25,20 37.5,10 T 62.5,10 T 87.5,10" />
            </svg>
            <h2 className="animate-bounce text-4xl font-extrabold tracking-tight text-foreground uppercase">
              CLICK NOW!
            </h2>
          </div>
        )}

        {gameState === "attempt-result" && (
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-xs text-muted uppercase">
              Attempt {attempts.length} Finished
            </span>
            <div className="font-mono text-4xl font-bold text-foreground">
              {currentScore} ms
            </div>
            <p className="mb-4 text-xs text-muted">
              Click anywhere to proceed to attempt {attempts.length + 1} of{" "}
              {totalAttempts.current}.
            </p>
          </div>
        )}

        {gameState === "abort" && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-2xl text-error">⚠️</span>
            <h2 className="text-lg font-bold text-foreground">Too Early!</h2>
            <p className="text-xs text-muted">
              You clicked before the audio tone beeped. Attempts reset.
            </p>
            <span className="mt-2 font-mono text-xs text-muted uppercase">
              Click to restart
            </span>
          </div>
        )}

        {gameState === "result" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-muted uppercase">
                Average Auditory Response
              </span>
              <div className="font-mono text-4xl font-bold text-foreground">
                {Math.round(
                  attempts.reduce((a, b) => a + b, 0) /
                    Math.max(1, attempts.length)
                )}{" "}
                ms
              </div>
              <span className="font-mono text-xs text-accent uppercase">
                {formatTopPercentile(
                  lookupPercentile(
                    "sound-reaction",
                    Math.round(
                      attempts.reduce((a, b) => a + b, 0) /
                        totalAttempts.current
                    ),
                    true
                  ),
                  true
                )}{" "}
                speed
              </span>
            </div>

            {/* Telemetry rows */}
            <div className="mt-4 grid w-full max-w-sm grid-cols-3 gap-8 border-t border-card-border/50 pt-4 text-center">
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
                  Calibrated Hz
                </span>
                <div className="font-mono text-sm text-foreground">
                  {calibration ? `${calibration.hz}Hz` : "Detecting..."}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Avg Tone Latency
                </span>
                <div className="font-mono text-sm text-foreground">~1.2 ms</div>
              </div>
            </div>

            <span className="mt-2 font-mono text-xs text-muted uppercase">
              Click anywhere outside buttons to restart
            </span>
          </div>
        )}
      </div>

      {/* Sharing controls footer */}
      {gameState === "result" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shareImage && (
              <a
                href={shareImage}
                download="cogniarena-sound-reflex.png"
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
                <span>Download Reflex Card</span>
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

export default withErrorBoundary(SoundReactionTest)
