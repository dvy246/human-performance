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
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type Phase = "idle" | "showing" | "input" | "feedback" | "result"

const GRID_SIZES = [3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9]
const TILE_COUNTS = [
  3, 4, 4, 5, 6, 6, 7, 8, 9, 8, 9, 10, 11, 10, 12, 14, 14, 16, 18, 20,
]

function VisualPatternTest() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [level, setLevel] = useState(1)
  const [gridSize, setGridSize] = useState(3)
  const [pattern, setPattern] = useState<Set<number>>(new Set())
  const [userSelected, setUserSelected] = useState<Set<number>>(new Set())
  const [correctTiles, setCorrectTiles] = useState<Set<number>>(new Set())
  const [wrongTiles, setWrongTiles] = useState<Set<number>>(new Set())
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)
  const [showTimer, setShowTimer] = useState(100)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)
  const startGrid = useRef<number>(3)
  const startTiles = useRef<number>(4)
  const displayBase = useRef<number>(1500)
  const displayPerLevel = useRef<number>(200)

  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("visual-pattern", "higher")
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
            if (payload && payload.testId === "visual-pattern") {
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

  const generatePattern = (size: number, tileCount: number): Set<number> => {
    const total = size * size
    const indices = new Set<number>()
    while (indices.size < Math.min(tileCount, total)) {
      indices.add(Math.floor(Math.random() * total))
    }
    return indices
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const diff = getDifficultyParams(
      "visual-pattern",
      (cfg.difficulty as string) || "Medium"
    )
    startGrid.current = (diff.startGrid as number) || 3
    startTiles.current = (diff.startTiles as number) || 4
    displayBase.current = (diff.displayBase as number) || 1500
    displayPerLevel.current = (diff.displayPerLevel as number) || 200

    if (timerRef.current) clearInterval(timerRef.current)
    submittedRef.current = false
    setLevel(1)
    setShareImage(null)
    startLevel(1)
  }

  const startLevel = (lvl: number) => {
    const idx = Math.min(lvl - 1, GRID_SIZES.length - 1)
    const size =
      GRID_SIZES[Math.min(idx + startGrid.current - 3, GRID_SIZES.length - 1)]
    const tiles =
      TILE_COUNTS[
        Math.min(idx + startTiles.current - 3, TILE_COUNTS.length - 1)
      ]

    setGridSize(size)
    const newPattern = generatePattern(size, tiles)
    setPattern(newPattern)
    setUserSelected(new Set())
    setCorrectTiles(new Set())
    setWrongTiles(new Set())
    setPhase("showing")
    setShowTimer(100)

    const duration = Math.min(
      displayBase.current + (lvl - 1) * displayPerLevel.current,
      8000
    )
    const startTime = performance.now()

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setShowTimer(remaining)

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase("input")
        setShowTimer(0)
      }
    }, 30)
  }

  const handleTileClick = useCallback(
    (idx: number) => {
      if (phase !== "input") return

      setUserSelected((prev) => {
        const next = new Set(prev)
        if (next.has(idx)) {
          next.delete(idx)
        } else {
          next.add(idx)
        }
        return next
      })
    },
    [phase]
  )

  const submitPattern = useCallback(() => {
    if (phase !== "input") return

    // Calculate results
    const correct = new Set<number>()
    const wrong = new Set<number>()

    userSelected.forEach((idx) => {
      if (pattern.has(idx)) {
        correct.add(idx)
      } else {
        wrong.add(idx)
      }
    })

    setCorrectTiles(correct)
    setWrongTiles(wrong)
    setPhase("feedback")

    // Check if enough tiles are correct (allowing 1 error margin for higher levels)
    const accuracy = correct.size / pattern.size
    const passed = accuracy >= 0.8 && wrong.size <= Math.floor(level / 5)

    setTimeout(() => {
      if (passed) {
        const nextLevel = level + 1
        setLevel(nextLevel)
        startLevel(nextLevel)
      } else {
        finishTest()
      }
    }, 1200)
  }, [phase, userSelected, pattern, level])

  const finishTest = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    const finalScore = level - 1
    setPhase("result")

    const percentile = lookupPercentile("visual-pattern", finalScore)

    try {
      await dataLayer.saveSession({
        testId: "visual-pattern",
        category: "memory",
        rawScore: finalScore,
        percentile,
        metadata: { maxLevel: finalScore },
      })
    } catch (err) {
      console.error("Failed to save Visual Pattern session:", err)
    }

    if (!submittedRef.current) return
    const pb = await dataLayer.getPersonalBest("visual-pattern", "higher")
    setPersonalBest(pb)

    if (!submittedRef.current) return
    try {
      const card = await generateShareCard(
        "Visual Pattern Memory",
        `Level ${finalScore}`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    if (!submittedRef.current) return
    redirectToResults({
      testId: "visual-pattern",
      testName: "Visual Pattern",
      attempts: [finalScore],
      unit: "levels",
      percentile,
      personalBest: pb,
      category: "memory",
      average: finalScore,
    })
  }

  const copyChallengeLink = () => {
    if (typeof window === "undefined") return
    const finalScore = level - 1
    const token = encodeChallenge({
      testId: "visual-pattern",
      score: finalScore,
    })
    const url = `${window.location.origin}/tests/visual-pattern/?challenge=${token}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedChallenge(true)
        setTimeout(() => setCopiedChallenge(false), 2000)
      })
      .catch(console.error)
  }

  const finalScore = level - 1
  const totalCells = gridSize * gridSize

  useBeforeUnload(phase !== "idle" && phase !== "result")
  useVisibilityGuard(
    () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase("idle")
    },
    phase !== "idle" && phase !== "result"
  )

  // Dynamic grid cell size
  const cellSize =
    gridSize <= 4
      ? "w-14 h-14 md:w-16 md:h-16"
      : gridSize <= 6
        ? "w-10 h-10 md:w-12 md:h-12"
        : "w-8 h-8 md:w-10 md:h-10"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Challenge Banner */}
      {challengeScore && phase !== "result" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-foreground">
            Active Challenge: Beat Level{" "}
            <strong className="font-mono text-foreground">
              {challengeScore}
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
      <div className="relative flex min-h-[400px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border border-card-border bg-card p-8">
        {/* Level & status indicator */}
        {phase !== "idle" && phase !== "result" && (
          <div className="flex w-full max-w-sm items-center justify-between font-mono text-xs text-muted">
            <span>
              Level: <strong className="text-foreground">{level}</strong>
            </span>
            <span>
              Grid:{" "}
              <strong className="text-accent">
                {gridSize}×{gridSize}
              </strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-accent">
                {phase === "showing"
                  ? "MEMORIZE"
                  : phase === "input"
                    ? "RECALL"
                    : "CHECKING"}
              </span>
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
            </span>
          </div>
        )}

        {/* IDLE STATE */}
        {phase === "idle" && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GameConfigPanel
              testId="visual-pattern"
              icon="🧩"
              title="Visual Pattern Memory"
              description="Memorize the highlighted tiles on a grid, then recreate the pattern from memory. Grid size increases with each level."
              personalBest={personalBest}
              personalBestLabel="levels"
              onStart={(config: GameConfig) => startTest(config)}
            />
          </div>
        )}

        {/* SHOWING / INPUT / FEEDBACK GRID */}
        {(phase === "showing" || phase === "input" || phase === "feedback") && (
          <div className="flex flex-col items-center gap-4">
            {/* Progress bar (showing phase only) */}
            {phase === "showing" && (
              <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full border border-card-border/60 bg-subtle">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-75"
                  style={{ width: `${showTimer}%` }}
                />
              </div>
            )}

            {/* Grid */}
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: totalCells }, (_, idx) => {
                const isPatternTile = pattern.has(idx)
                const isUserSelected = userSelected.has(idx)
                const isCorrect = correctTiles.has(idx)
                const isWrong = wrongTiles.has(idx)
                const isMissed =
                  phase === "feedback" &&
                  isPatternTile &&
                  !userSelected.has(idx)

                let tileClass = "bg-subtle border-card-border"

                if (phase === "showing" && isPatternTile) {
                  tileClass =
                    "bg-accent border-accent shadow-[0_0_15px_rgba(217,119,6,0.4)] scale-95"
                } else if (phase === "input" && isUserSelected) {
                  tileClass = "bg-accent/80 border-accent"
                } else if (phase === "feedback") {
                  if (isCorrect)
                    tileClass = "bg-emerald-500/60 border-emerald-500"
                  else if (isWrong) tileClass = "bg-red-500/60 border-red-500"
                  else if (isMissed)
                    tileClass = "bg-amber-500/30 border-amber-500/50"
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(idx)}
                    disabled={phase !== "input"}
                    className={`${cellSize} cursor-pointer rounded-lg border transition-all duration-100 outline-none select-none ${tileClass} ${
                      phase === "input"
                        ? "hover:border-card-border active:scale-95"
                        : ""
                    }`}
                    aria-label={`Tile ${idx + 1}`}
                  />
                )
              })}
            </div>

            {/* Submit button (input phase only) */}
            {phase === "input" && (
              <button
                onClick={submitPattern}
                className="transition-standard mt-2 cursor-pointer rounded bg-accent px-8 py-2.5 font-mono text-xs font-semibold tracking-widest text-black uppercase hover:bg-accent-hover active:scale-[0.98]"
              >
                Submit Pattern ({userSelected.size}/{pattern.size} selected)
              </button>
            )}
          </div>
        )}

        {/* RESULT STATE */}
        {phase === "result" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-muted uppercase">
                Visual Pattern Memory
              </span>
              <div className="font-mono text-5xl font-bold text-foreground">
                Level {finalScore}
              </div>
              <span className="mt-1 font-mono text-xs text-accent uppercase">
                {formatTopPercentile(
                  lookupPercentile("visual-pattern", finalScore)
                )}{" "}
                of population
              </span>
            </div>

            <div className="mt-2 grid w-full max-w-xs grid-cols-2 gap-8 border-t border-card-border/50 pt-4 text-center">
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Personal Best
                </span>
                <div className="font-mono text-sm text-foreground">
                  {personalBest ? `Level ${personalBest}` : "--"}
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted uppercase">
                  Percentile
                </span>
                <div className="font-mono text-sm text-foreground">
                  ~
                  {Math.round(
                    100 - lookupPercentile("visual-pattern", finalScore)
                  )}
                  %ile
                </div>
              </div>
            </div>

            {challengeScore && (
              <div
                className={`w-full max-w-xs rounded-lg border p-3 text-center font-mono text-sm ${
                  finalScore >= challengeScore
                    ? "border-[var(--success-border)] bg-[var(--success-bg)] text-success"
                    : "border-[var(--error-border)] bg-[var(--error-bg)] text-error"
                }`}
              >
                {finalScore >= challengeScore
                  ? `🏆 You beat Level ${challengeScore}!`
                  : `Try again! Target: Level ${challengeScore}`}
              </div>
            )}

            <SocialShare
              testId="visual-pattern"
              score={finalScore}
              scoreLabel={`Level ${finalScore}`}
              testName="Visual Pattern Memory Test"
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
              download="cogniarena-visual-pattern.png"
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

export default withErrorBoundary(VisualPatternTest)
