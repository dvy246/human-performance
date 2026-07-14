import React, { useState, useEffect, useRef } from "react"
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

type TestMode = "partA" | "partB"
type TrialState = "idle" | "running" | "result"

interface TMTNode {
  id: number
  label: string
  x: number // percentage
  y: number // percentage
}

function TrailMakingTest() {
  const [gameState, setGameState] = useState<TrialState>("idle")
  const [mode, setMode] = useState<TestMode>("partA")
  const [nodes, setNodes] = useState<TMTNode[]>([])
  const [nextExpectedIdx, setNextExpectedIdx] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [penalties, setPenalties] = useState(0)
  const [wrongNodeId, setWrongNodeId] = useState<number | null>(null)
  const [personalBestA, setPersonalBestA] = useState<number | null>(null)
  const [personalBestB, setPersonalBestB] = useState<number | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [resultPercentile, setResultPercentile] = useState(0)

  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const respondedRef = useRef(false)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)
  const nodeCount = useRef<number>(20)
  const penaltyDuration = useRef<number>(2000)

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameState("idle")
  }, gameState === "running")

  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("tmt-partA", "lower")
      .then((pb) => {
        if (mounted) setPersonalBestA(pb)
      })
      .catch(console.error)
    dataLayer
      .getPersonalBest("tmt-partB", "lower")
      .then((pb) => {
        if (mounted) setPersonalBestB(pb)
      })
      .catch(console.error)

    return () => {
      mounted = false
    }
  }, [])

  const generateNodes = (testMode: TestMode): TMTNode[] => {
    const list: TMTNode[] = []
    const labels: string[] = []
    const count = nodeCount.current

    if (testMode === "partA") {
      for (let i = 1; i <= count; i++) {
        labels.push(i.toString())
      }
    } else {
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
      const halfCount = Math.ceil(count / 2)
      for (let i = 1; i <= halfCount; i++) {
        labels.push(i.toString())
        if (letters[i - 1]) labels.push(letters[i - 1])
      }
      // Trim to exact count
      while (labels.length > count) labels.pop()
    }

    const totalLabels = labels.length
    const gridCols = Math.ceil(Math.sqrt(totalLabels))
    const gridRows = Math.ceil(totalLabels / gridCols)
    const gridCells: { r: number; c: number }[] = []
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        gridCells.push({ r, c })
      }
    }

    // Shuffle grid cells
    for (let i = gridCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gridCells[i], gridCells[j]] = [gridCells[j], gridCells[i]]
    }

    labels.forEach((label, i) => {
      const cell = gridCells[i]
      // Map to percentage bounds (margin 10% to 90%)
      const jitterX = Math.random() * 8 - 4 // jitter +-4%
      const jitterY = Math.random() * 8 - 4
      const x = Math.round(15 + (cell.c / (gridCols - 1)) * 70 + jitterX)
      const y = Math.round(15 + (cell.r / (gridRows - 1)) * 70 + jitterY)

      list.push({
        id: i,
        label,
        x,
        y,
      })
    })

    return list
  }

  const startTest = (selectedMode: TestMode, config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const diff = getDifficultyParams(
      "trail-making",
      (cfg.difficulty as string) || "Medium"
    )
    nodeCount.current = (diff.nodeCount as number) || 20
    penaltyDuration.current = (diff.penaltyMs as number) || 2000

    setMode(selectedMode)
    const generated = generateNodes(selectedMode)
    setNodes(generated)
    setNextExpectedIdx(0)
    setPenalties(0)
    setElapsedTime(0)
    setWrongNodeId(null)
    setShareImage(null)
    setResultPercentile(0)
    submittedRef.current = false
    setGameState("running")

    startTimeRef.current = performance.now()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.round(performance.now() - startTimeRef.current))
    }, 50)
  }

  const handleNodeClick = (node: TMTNode) => {
    if (gameState !== "running" || respondedRef.current) return
    respondedRef.current = true

    if (node.id === nextExpectedIdx) {
      // Correct click
      const nextIdx = nextExpectedIdx + 1
      setNextExpectedIdx(nextIdx)

      if (nextIdx >= nodes.length) {
        finishTest()
      } else {
        setTimeout(() => {
          respondedRef.current = false
        }, 100)
      }
    } else {
      setPenalties((prev) => prev + penaltyDuration.current)
      setWrongNodeId(node.id)
      setTimeout(() => {
        setWrongNodeId(null)
        respondedRef.current = false
      }, 500)
    }
  }

  const finishTest = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setGameState("result")

    const totalScore = elapsedTime + penalties
    const testId = `tmt-${mode}`

    const percentile = Math.round(
      lookupPercentile("trail-making", totalScore, true)
    )
    setResultPercentile(percentile)

    try {
      await dataLayer.saveSession({
        testId,
        category: "focus",
        rawScore: totalScore,
        percentile,
        metadata: {
          rawTime: elapsedTime,
          penaltiesCount: penalties / penaltyDuration.current,
        },
      })
    } catch (err) {
      console.error("Failed to save Trail Making session:", err)
    }

    if (mode === "partA") {
      dataLayer
        .getPersonalBest("tmt-partA", "lower")
        .then((pb) => setPersonalBestA(pb))
        .catch(console.error)
    } else {
      dataLayer
        .getPersonalBest("tmt-partB", "lower")
        .then((pb) => setPersonalBestB(pb))
        .catch(console.error)
    }

    try {
      const card = await generateShareCard(
        `Trail Making Test (${mode === "partA" ? "Part A" : "Part B"})`,
        `${(totalScore / 1000).toFixed(2)}s`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    redirectToResults({
      testId: testId,
      testName: `Trail Making (${mode === "partA" ? "A" : "B"})`,
      attempts: [totalScore],
      unit: "ms",
      percentile,
      personalBest: null,
      category: "focus",
      average: totalScore,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 select-none">
      {gameState === "running" && (
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
      {gameState === "idle" && (
        <div className="flex flex-col gap-6 rounded-xl border border-card-border bg-card p-8 shadow-lg">
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GameConfigPanel
              testId="trail-making"
              icon="🧭"
              title="Trail Making Test (TMT)"
              description="Measure visual scanning, processing speed, and cognitive flexibility. Click the targets sequentially as fast as possible. Mismatched target clicks add a 2.0 second penalty."
              startLabel="Configure"
              onStart={(config: GameConfig) => (lastConfig.current = config)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() =>
                startTest("partA", lastConfig.current || undefined)
              }
              className="transition-standard h-11 rounded bg-accent font-mono text-xs font-bold tracking-wider text-white uppercase shadow hover:bg-accent-hover active:scale-98"
            >
              Start Part A
            </button>
            <button
              onClick={() =>
                startTest("partB", lastConfig.current || undefined)
              }
              className="transition-standard h-11 rounded border border-card-border font-mono text-xs font-bold tracking-wider text-foreground uppercase shadow hover:bg-subtle active:scale-98"
            >
              Start Part B
            </button>
          </div>
          <div className="flex justify-center gap-6 font-mono text-[10px] text-muted uppercase">
            <span>
              PB Part A:{" "}
              {personalBestA ? `${(personalBestA / 1000).toFixed(2)}s` : "--"}
            </span>
            <span>
              PB Part B:{" "}
              {personalBestB ? `${(personalBestB / 1000).toFixed(2)}s` : "--"}
            </span>
          </div>
        </div>
      )}

      {gameState === "running" && (
        <div className="flex flex-col gap-4">
          {/* Header Panel */}
          <div className="flex items-center justify-between rounded-xl border border-card-border bg-card p-4 font-mono text-xs text-muted shadow">
            <span>
              MODE: {mode === "partA" ? "PART A (1-20)" : "PART B (1-A-2-B...)"}
            </span>
            <span>EXPECTED: {nodes[nextExpectedIdx]?.label || "--"}</span>
            <span>TIME: {((elapsedTime + penalties) / 1000).toFixed(1)}s</span>
          </div>

          {/* Test Canvas Container */}
          <div className="relative min-h-[420px] w-full overflow-hidden rounded-xl border border-card-border bg-subtle shadow">
            {/* Connection trails lines (completed nodes) */}
            {nextExpectedIdx > 0 && (
              <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full">
                {nodes.slice(0, nextExpectedIdx).map((node, idx) => {
                  if (idx === 0) return null
                  const prev = nodes[idx - 1]
                  return (
                    <line
                      key={idx}
                      x1={`${prev.x}%`}
                      y1={`${prev.y}%`}
                      x2={`${node.x}%`}
                      y2={`${node.y}%`}
                      stroke="var(--accent)"
                      strokeWidth="2"
                      strokeOpacity="0.4"
                    />
                  )
                })}
              </svg>
            )}

            {/* Target Nodes */}
            {nodes.map((node) => {
              const isCompleted = node.id < nextExpectedIdx
              const isNext = node.id === nextExpectedIdx
              const isWrong = node.id === wrongNodeId

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`transition-standard absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border font-mono text-xs font-bold active:scale-95 ${
                    isCompleted
                      ? "border-accent bg-accent/15 text-accent shadow-sm"
                      : isWrong
                        ? "animate-shake border-red-600 bg-red-500 text-white"
                        : "border-card-border bg-card text-foreground hover:border-accent"
                  }`}
                >
                  {node.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {gameState === "result" && (
        <div className="flex flex-col items-center gap-6 rounded-xl border border-card-border bg-card p-8 text-center shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] text-xl font-bold text-success">
            ✓
          </div>
          <div>
            <span className="font-mono text-xs tracking-widest text-muted uppercase">
              TMT {mode === "partA" ? "Part A" : "Part B"} Result
            </span>
            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">
              {((elapsedTime + penalties) / 1000).toFixed(2)}s
            </h2>
            <span className="mt-1 block font-mono text-[11px] text-muted uppercase">
              Accuracy-adjusted: {formatTopPercentile(resultPercentile, true)}
            </span>
          </div>

          {/* Breakdown Stats */}
          <div className="my-2 grid w-full max-w-sm grid-cols-2 gap-4 border-t border-b border-card-border/50 py-4 text-left">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Raw Latency
              </span>
              <span className="text-sm font-bold text-foreground">
                {(elapsedTime / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Penalties Added
              </span>
              <span className="text-sm font-bold text-foreground">
                {(penalties / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Mismatched Clicks
              </span>
              <span className="text-sm font-bold text-foreground">
                {Math.round(penalties / penaltyDuration.current)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Target Rate
              </span>
              <span className="text-sm font-bold text-foreground">
                {elapsedTime + penalties > 0
                  ? (nodes.length / ((elapsedTime + penalties) / 1000)).toFixed(
                      1
                    )
                  : "0.0"}
                /s
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <button
              onClick={() => startTest(mode)}
              className="transition-standard h-11 rounded bg-accent font-mono text-xs font-bold tracking-wider text-white uppercase shadow hover:bg-accent-hover active:scale-98"
            >
              Replay {mode === "partA" ? "Part A" : "Part B"}
            </button>
            <button
              onClick={() => setGameState("idle")}
              className="transition-standard h-11 rounded border border-card-border font-mono text-xs font-bold tracking-wider text-foreground uppercase shadow hover:bg-subtle active:scale-98"
            >
              Mode Menu
            </button>
          </div>

          {shareImage && (
            <SocialShare
              testId={`tmt-${mode}`}
              score={elapsedTime + penalties}
              scoreLabel={`${((elapsedTime + penalties) / 1000).toFixed(2)}s`}
              testName={`Trail Making Test (${mode === "partA" ? "Part A" : "Part B"})`}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(TrailMakingTest)
