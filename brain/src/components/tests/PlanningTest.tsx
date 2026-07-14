import { useState, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { generateShareCard } from "../../runtime/share"
import SocialShare from "../ui/SocialShare"
import { lookupPercentile } from "../../runtime/percentileLookup"
import { redirectToResults } from "../../runtime/redirectToResults"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

const PEGS = 3
const DISKS = 4

function makeState(d: number, startRod: number): number[][] {
  const rods: number[][] = [[], [], []]
  for (let i = d; i >= 1; i--) rods[startRod].push(i)
  return rods
}

function PlanningTest() {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [startRod, setStartRod] = useState(0)
  const [rods, setRods] = useState<number[][]>(makeState(DISKS, 0))
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)
  const diskCount = useRef<number>(DISKS)
  const movesRef = useRef<number>(0)

  useBeforeUnload(phase !== "intro" && phase !== "done")
  useVisibilityGuard(() => {
    setPhase("intro")
  }, phase === "playing")

  const targetRod = (startRod + 2) % 3
  const won = rods[targetRod].length === diskCount.current

  const handlePegClick = (peg: number) => {
    if (won) return
    if (selected === null) {
      if (rods[peg].length === 0) return
      setSelected(peg)
      return
    }
    if (selected === peg) {
      setSelected(null)
      return
    }
    const top = rods[selected][rods[selected].length - 1]
    const targetTop =
      rods[peg].length > 0
        ? rods[peg][rods[peg].length - 1]
        : diskCount.current + 1
    if (top < targetTop) {
      const newRods = rods.map((r) => [...r])
      newRods[selected].pop()
      newRods[peg].push(top)
      setRods(newRods)
      movesRef.current += 1
      setMoves((m) => m + 1)
      if (newRods[targetRod].length === diskCount.current) finish(newRods)
    }
    setSelected(null)
  }

  const finish = async (finalRods: number[][]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    const elapsed = Math.round((performance.now() - startTime) / 1000)
    const optimal = Math.pow(2, diskCount.current) - 1
    const finalMoves = movesRef.current
    const ratio = finalMoves / optimal
    const score = Math.max(
      0,
      Math.min(100, Math.round(100 - (ratio - 1) * 30 - elapsed / 5))
    )
    try {
      await dataLayer.saveSession({
        testId: "planning",
        category: "executive",
        rawScore: score,
        percentile: lookupPercentile("planning", score),
        metadata: {
          moves: finalMoves,
          optimalMoves: optimal,
          timeSeconds: elapsed,
        },
      })
    } catch (err) {
      console.error("Failed to save Planning session:", err)
    }
    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Planning Test",
        `${finalMoves} moves (optimal: ${optimal})`,
        lookupPercentile("planning", score)
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }
    if (!submittedRef.current) return

    setPhase("done")

    if (!submittedRef.current) return
    redirectToResults({
      testId: "planning",
      testName: "Planning",
      attempts: [score],
      unit: "pts",
      percentile: lookupPercentile("planning", score),
      personalBest: null,
      category: "executive",
      average: score,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  const startGame = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const diff = getDifficultyParams(
      "planning",
      (cfg.difficulty as string) || "Medium"
    )
    diskCount.current = (diff.diskCount as number) || DISKS
    const sr = Math.floor(Math.random() * 3)
    setStartRod(sr)
    setRods(makeState(diskCount.current, sr))
    setSelected(null)
    setMoves(0)
    movesRef.current = 0
    setStartTime(performance.now())
    submittedRef.current = false
    setPhase("playing")
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GameConfigPanel
            testId="planning"
            icon="🧩"
            title="Planning Test"
            description="Tower of Hanoi — move all disks from one peg to another. You can only place a disk on a larger disk."
            onStart={(config: GameConfig) => startGame(config)}
          />
        </div>
      </div>
    )
  }

  if (phase === "playing") {
    const optimal = Math.pow(2, diskCount.current) - 1
    return (
      <div className="relative mx-auto w-full max-w-2xl">
        <button
          onClick={() => setPhase("intro")}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
        <div className="rounded-xl border border-card-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-muted">
            <span>
              Moves: {moves} / Optimal: {optimal}
            </span>
            <span className={won ? "text-success" : ""}>
              {won
                ? "Solved!"
                : `Select a peg, then click destination (target: peg ${targetRod + 1})`}
            </span>
          </div>
          <div className="flex h-48 items-end justify-center gap-4">
            {rods.map((rod, peg) => (
              <button
                key={peg}
                onClick={() => handlePegClick(peg)}
                className={`relative flex h-full w-24 cursor-pointer flex-col items-center justify-end rounded-lg border-2 transition-all ${
                  selected === peg
                    ? "border-accent bg-accent/10"
                    : rod.length > 0 || selected !== null
                      ? "border-card-border bg-subtle hover:border-muted"
                      : "border-card-border bg-subtle"
                }`}
              >
                <div className="absolute bottom-0 h-full w-1 rounded-full bg-subtle" />
                {rod.map((disk) => {
                  const widths = [80, 64, 48, 32, 20]
                  return (
                    <div
                      key={disk}
                      className="relative z-10 h-5 rounded border border-muted/40"
                      style={{
                        width: widths[diskCount.current - disk] || 16,
                        backgroundColor: `hsl(${disk * 40 + 180}, 50%, 40%)`,
                      }}
                    />
                  )
                })}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const optimal = Math.pow(2, diskCount.current) - 1
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-card-border bg-card p-8">
        <div className="text-4xl text-success">✓</div>
        <div className="font-mono text-4xl font-bold text-foreground">
          {moves}
        </div>
        <div className="font-mono text-xs text-muted">
          moves (optimal: {optimal})
        </div>
        {shareImage && (
          <a
            href={shareImage}
            download="cogniarena-planning.png"
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
            <span>Download Share Card</span>
          </a>
        )}
        <SocialShare
          testId="planning"
          score={moves}
          scoreLabel={`${moves} moves`}
          testName="Planning Test"
        />
        <button
          onClick={() => setPhase("intro")}
          className="transition-standard h-10 cursor-pointer rounded-lg border border-card-border bg-subtle px-6 text-sm text-foreground hover:bg-panel active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export default withErrorBoundary(PlanningTest)
