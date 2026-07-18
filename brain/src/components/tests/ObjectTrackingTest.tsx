import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { generateShareCard } from "../../runtime/share"
import SocialShare from "../ui/SocialShare"
import {
  lookupPercentile,
  formatTopPercentile,
} from "../../runtime/percentileLookup"
import { useSound } from "../../runtime/useSound"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type GamePhase = "idle" | "memorize" | "tracking" | "recall" | "round-end" | "result"

interface TrackingObject {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  isTarget: boolean
  isSelected: boolean
  isCorrect?: boolean
}

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 400
const OBJECT_RADIUS = 16

const ObjectTrackingTest = () => {
  const { playClick, playError } = useSound()
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [rounds, setRounds] = useState(5)
  const [currentRound, setCurrentRound] = useState(1)
  const [difficulty, setDifficulty] = useState("Medium")
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  
  // Game parameters
  const [targetsToTrackCount, setTargetsToTrackCount] = useState(3)
  const [totalObjectsCount, setTotalObjectsCount] = useState(7)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.4)
  
  const [objects, setObjects] = useState<TrackingObject[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [totalCorrectTargetsTracked, setTotalCorrectTargetsTracked] = useState(0)
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(3) // 3 seconds to memorize
  const [strikes, setStrikes] = useState(0) // Max 3 failures

  const [resultScore, setResultScore] = useState(0)
  const [resultPercentile, setResultPercentile] = useState(0)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [isShareLoading, setIsShareLoading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const requestRef = useRef<number | null>(null)
  const objectsRef = useRef<TrackingObject[]>([])
  const phaseRef = useRef<GamePhase>("idle")
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)

  // Visibility guard to handle tab switching
  useVisibilityGuard(() => {
    if (phaseRef.current === "tracking" || phaseRef.current === "memorize") {
      // Pause or reset on backgrounding to ensure integrity and prevent cheating
      handleQuit()
    }
  })

  // Load personal best
  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("object-tracking", "higher")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)
    return () => {
      mounted = false
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  // Sync phase to ref so requestAnimationFrame always gets the latest state
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Initialize objects for a round
  const initObjects = (targetsCount: number, totalCount: number) => {
    const list: TrackingObject[] = []
    const occupiedPositions: { x: number; y: number }[] = []

    const isTooClose = (x: number, y: number) => {
      for (const pos of occupiedPositions) {
        const dx = x - pos.x
        const dy = y - pos.y
        if (Math.sqrt(dx * dx + dy * dy) < OBJECT_RADIUS * 3) return true
      }
      return false
    }

    for (let i = 0; i < totalCount; i++) {
      let x = 0
      let y = 0
      let attempts = 0
      
      // Position objects with spacing constraints
      do {
        x = OBJECT_RADIUS * 2 + Math.random() * (CANVAS_WIDTH - OBJECT_RADIUS * 4)
        y = OBJECT_RADIUS * 2 + Math.random() * (CANVAS_HEIGHT - OBJECT_RADIUS * 4)
        attempts++
      } while (isTooClose(x, y) && attempts < 100)

      occupiedPositions.push({ x, y })

      // Standard speeds
      const angle = Math.random() * Math.PI * 2
      const speed = (2 + Math.random() * 2) * speedMultiplier
      
      list.push({
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: OBJECT_RADIUS,
        isTarget: i < targetsCount, // First M objects are targets
        isSelected: false
      })
    }

    // Shuffle the array so target dots aren't always drawn first
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = list[i]
      list[i] = list[j]
      list[j] = temp
    }

    objectsRef.current = list
    setObjects([...list])
  }

  // Handle start test / game loop initialization
  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    
    const maxRounds = typeof cfg.rounds === "number" ? cfg.rounds : 5
    setRounds(maxRounds)
    
    const diff = (cfg.difficulty as string) || "Medium"
    setDifficulty(diff)
    
    const params = getDifficultyParams("object-tracking", diff)
    const targets = (params.targetsToTrack as number) || 3
    const total = (params.totalObjects as number) || 7
    const speed = (params.speedMultiplier as number) || 1.4
    
    setTargetsToTrackCount(targets)
    setTotalObjectsCount(total)
    setSpeedMultiplier(speed)

    setCurrentRound(1)
    setTotalCorrectTargetsTracked(0)
    setStrikes(0)
    submittedRef.current = false
    
    startRound(1, targets, total)
  }

  const startRound = (roundNum: number, targets: number, total: number) => {
    setSelectedIds([])
    initObjects(targets, total)
    setPhase("memorize")
    setMemorizeTimeLeft(3)
  }

  // Memorization Phase Countdown
  useEffect(() => {
    if (phase !== "memorize") return
    
    const timer = setInterval(() => {
      setMemorizeTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setPhase("tracking")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase])

  // Tracking Phase Movement Duration
  useEffect(() => {
    if (phase !== "tracking") return

    const trackingDuration = 6000 // 6 seconds of movement
    const timer = setTimeout(() => {
      setPhase("recall")
    }, trackingDuration)

    return () => clearTimeout(timer)
  }, [phase])

  // Canvas Drawing & Physics Animation Frame Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let lastTime = performance.now()

    const updateAndDraw = () => {
      // 1. Clear Canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Get current values
      const currentObjects = objectsRef.current
      const currentPhase = phaseRef.current

      // 2. Update positions if in "tracking" phase
      if (currentPhase === "tracking") {
        for (const obj of currentObjects) {
          obj.x += obj.vx
          obj.y += obj.vy

          // Boundary Collision physics
          if (obj.x - obj.radius < 0) {
            obj.x = obj.radius
            obj.vx = -obj.vx
          } else if (obj.x + obj.radius > CANVAS_WIDTH) {
            obj.x = CANVAS_WIDTH - obj.radius
            obj.vx = -obj.vx
          }

          if (obj.y - obj.radius < 0) {
            obj.y = obj.radius
            obj.vy = -obj.vy
          } else if (obj.y + obj.radius > CANVAS_HEIGHT) {
            obj.y = CANVAS_HEIGHT - obj.radius
            obj.vy = -obj.vy
          }
        }
      }

      // 3. Draw Objects
      for (const obj of currentObjects) {
        ctx.beginPath()
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2)

        // Determine coloring based on phase & state
        if (currentPhase === "memorize") {
          if (obj.isTarget) {
            // Target glows green with outline
            ctx.fillStyle = "rgba(16, 185, 129, 0.9)"
            ctx.strokeStyle = "#10b981"
            ctx.lineWidth = 3
          } else {
            // Decoy standard blue
            ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
            ctx.strokeStyle = "#2563eb"
            ctx.lineWidth = 2
          }
        } else if (currentPhase === "tracking") {
          // Both targets & decoys look identical during tracking
          ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
          ctx.strokeStyle = "#2563eb"
          ctx.lineWidth = 2
        } else if (currentPhase === "recall") {
          // Visual feed during selection
          if (obj.isSelected) {
            ctx.fillStyle = "rgba(245, 158, 11, 0.8)"
            ctx.strokeStyle = "#d97706"
            ctx.lineWidth = 3
          } else {
            ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
            ctx.strokeStyle = "#2563eb"
            ctx.lineWidth = 2
          }
        } else if (currentPhase === "round-end" || currentPhase === "result") {
          // Reveal targets & correct/incorrect selections
          if (obj.isTarget) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.9)" // True target green
            ctx.strokeStyle = obj.isSelected ? "#059669" : "#10b981"
            ctx.lineWidth = obj.isSelected ? 4 : 2
          } else if (obj.isSelected && !obj.isTarget) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.9)" // Mistake red
            ctx.strokeStyle = "#dc2626"
            ctx.lineWidth = 4
          } else {
            ctx.fillStyle = "rgba(107, 114, 128, 0.4)" // Grayed out decoy
            ctx.strokeStyle = "#4b5563"
            ctx.lineWidth = 1
          }
        }

        ctx.fill()
        ctx.stroke()

        // Highlight selection tags
        if (obj.isSelected && currentPhase === "recall") {
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 12px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("?", obj.x, obj.y)
        }
      }

      // 4. Continue loop
      requestRef.current = requestAnimationFrame(updateAndDraw)
    }

    requestRef.current = requestAnimationFrame(updateAndDraw)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [phase])

  // Canvas Click/Touch Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "recall") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Find if clicked inside any object
    const hitObj = objectsRef.current.find((obj) => {
      const dx = clickX - obj.x
      const dy = clickY - obj.y
      return Math.sqrt(dx * dx + dy * dy) <= obj.radius + 10 // added click padding
    })

    if (!hitObj) return

    playClick()

    let newSelected: number[]
    if (selectedIds.includes(hitObj.id)) {
      newSelected = selectedIds.filter((id) => id !== hitObj.id)
      hitObj.isSelected = false
    } else {
      // Don't select more than targets to track count
      if (selectedIds.length >= targetsToTrackCount) return
      newSelected = [...selectedIds, hitObj.id]
      hitObj.isSelected = true
    }

    setSelectedIds(newSelected)
    setObjects([...objectsRef.current])

    // If selected enough targets, evaluate round
    if (newSelected.length === targetsToTrackCount) {
      setTimeout(() => {
        evaluateRound()
      }, 500)
    }
  }

  // Round completion evaluation
  const evaluateRound = () => {
    const list = objectsRef.current
    let correctCount = 0
    let failed = false

    for (const obj of list) {
      if (obj.isSelected && obj.isTarget) {
        correctCount++
      }
      if (obj.isSelected && !obj.isTarget) {
        failed = true
      }
    }

    setTotalCorrectTargetsTracked((prev) => prev + correctCount)

    if (failed) {
      playError()
      setStrikes((prev) => prev + 1)
    }

    setPhase("round-end")
  }

  const handleNextRound = () => {
    if (strikes >= 3 || currentRound >= rounds) {
      finishTest()
    } else {
      setCurrentRound((prev) => prev + 1)
      startRound(currentRound + 1, targetsToTrackCount, totalObjectsCount)
    }
  }

  // End assessment and submit metrics
  const finishTest = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setPhase("result")

    const finalScore = totalCorrectTargetsTracked
    const maxPossible = rounds * targetsToTrackCount
    const accuracyVal = Math.round((finalScore / Math.max(1, maxPossible)) * 100)

    const percentile = Math.round(lookupPercentile("object-tracking", finalScore, false))
    setResultScore(finalScore)
    setResultPercentile(percentile)

    try {
      await dataLayer.saveSession({
        testId: "object-tracking",
        category: "focus",
        rawScore: finalScore,
        percentile,
        metadata: {
          accuracy: accuracyVal,
          rounds,
          difficulty,
          targetsTracked: finalScore,
          maxPossible,
          strikes
        }
      })
    } catch (err) {
      console.error("Failed to save object-tracking session:", err)
    }

    const pb = await dataLayer.getPersonalBest("object-tracking", "higher")
    setPersonalBest(pb)

    // Generate OG Share Card
    setIsShareLoading(true)
    try {
      const card = await generateShareCard({
        title: "Multiple Object Tracking",
        metric: `${finalScore}/${maxPossible} targets`,
        percentile: formatTopPercentile(percentile, false),
        color: "#10b981", // Emerald accent
        theme: "dark"
      })
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share image:", err)
    } finally {
      setIsShareLoading(false)
    }
  }

  const handleQuit = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    setPhase("idle")
  }

  return (
    <div className="mx-auto flex w-full flex-col items-center">
      {/* Persistant Quit Button in Gameplay */}
      {phase !== "idle" && (
        <div className="mb-4 flex w-full max-w-2xl justify-end">
          <button
            onClick={handleQuit}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card text-muted transition-all hover:bg-hover hover:text-foreground cursor-pointer"
            title="Quit game"
          >
            ✕
          </button>
        </div>
      )}

      {phase === "idle" && (
        <GameConfigPanel
          testId="object-tracking"
          title="Multiple Object Tracking"
          personalBest={personalBest !== null ? `${personalBest} targets` : undefined}
          onStart={startTest}
        />
      )}

      {(phase === "memorize" ||
        phase === "tracking" ||
        phase === "recall" ||
        phase === "round-end") && (
        <div className="flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-card-border bg-card/60 p-6 shadow-xl backdrop-blur-md">
          {/* Status Headers */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-foreground font-bold">ROUND {currentRound} of {rounds}</span>
            </div>
            <div className="flex items-center gap-4 text-muted">
              <span>Targets: <strong className="text-foreground">{targetsToTrackCount}</strong></span>
              <span>Strikes: <strong className="text-red-500">{strikes}/3</strong></span>
            </div>
          </div>

          {/* Visual Instructions */}
          <div className="text-center">
            {phase === "memorize" && (
              <h3 className="text-base font-bold text-accent animate-pulse">
                Memorize the {targetsToTrackCount} highlighted green targets! ({memorizeTimeLeft}s)
              </h3>
            )}
            {phase === "tracking" && (
              <h3 className="text-base font-bold text-foreground">
                Keep your eyes on the targets! Tracking...
              </h3>
            )}
            {phase === "recall" && (
              <h3 className="text-base font-bold text-amber-500 animate-pulse">
                Select the {targetsToTrackCount} target dots! ({selectedIds.length}/{targetsToTrackCount})
              </h3>
            )}
            {phase === "round-end" && (
              <h3 className="text-base font-bold text-foreground">
                {strikes >= 3 ? "Game Over! Too many strikes." : "Round finished!"}
              </h3>
            )}
          </div>

          {/* HTML5 Interactive Canvas Container */}
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-neutral-950 shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              className={`block max-w-full cursor-crosshair transition-all duration-300 ${
                phase === "recall" ? "ring-2 ring-amber-500/20" : ""
              }`}
            />
          </div>

          {/* Round Action Button */}
          {phase === "round-end" && (
            <button
              onClick={handleNextRound}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all cursor-pointer shadow-md shadow-accent/20"
            >
              {strikes >= 3 || currentRound >= rounds ? "Show Results" : "Next Round"}
            </button>
          )}
        </div>
      )}

      {phase === "result" && (
        <div className="flex w-full max-w-xl flex-col items-center gap-8 rounded-2xl border border-card-border bg-card/60 p-6 md:p-8 text-center shadow-2xl backdrop-blur-md animate-fade-in">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              ASSESSMENT COMPLETE
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
              Multiple Object Tracking
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="rounded-xl border border-card-border bg-subtle p-4">
              <span className="text-[10px] uppercase font-mono text-muted tracking-wider block font-bold">
                Targets Tracked
              </span>
              <span className="text-3xl font-black text-foreground block mt-1">
                {resultScore} / {rounds * targetsToTrackCount}
              </span>
            </div>
            <div className="rounded-xl border border-card-border bg-subtle p-4">
              <span className="text-[10px] uppercase font-mono text-muted tracking-wider block font-bold">
                Cognitive Percentile
              </span>
              <span className="text-3xl font-black text-accent block mt-1">
                {formatTopPercentile(resultPercentile, false)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full text-xs text-muted leading-relaxed max-w-md">
            <p>
              Your score maps to the <strong className="text-foreground">Focus &amp; Precision</strong> cognitive axis, testing dynamic visual attention gating and spatial indexing capacity.
            </p>
            {personalBest !== null && (
              <p className="font-mono mt-1 text-[11px] bg-subtle py-1.5 px-3 rounded-lg border border-card-border">
                Personal Best: <strong className="text-foreground">{personalBest} targets</strong>
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full border-t border-card-border/40 pt-6">
            <button
              onClick={() => startTest()}
              className="flex-1 py-3 px-4 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-all cursor-pointer shadow-md shadow-accent/20"
            >
              Restart Assessment
            </button>
            <button
              onClick={handleQuit}
              className="flex-1 py-3 px-4 rounded-xl border border-card-border bg-card text-foreground font-semibold text-sm hover:bg-hover transition-all cursor-pointer"
            >
              Configure Options
            </button>
          </div>

          {shareImage && (
            <div className="w-full border-t border-card-border/40 pt-6 flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted font-bold">
                Share your result
              </span>
              <SocialShare shareImage={shareImage} isShareLoading={isShareLoading} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(ObjectTrackingTest)
