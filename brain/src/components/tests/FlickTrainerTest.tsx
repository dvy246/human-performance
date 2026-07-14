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

const TOTAL = 15
const TARGET_RADIUS = 22

function FlickTrainerTest() {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [trial, setTrial] = useState(0)
  const [target, setTarget] = useState({ x: 0, y: 0 })
  const [results, setResults] = useState<{ rt: number; hit: boolean }[]>([])
  const [shareImage, setShareImage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef(0)
  const submittedRef = useRef(false)
  const respondedRef = useRef(false)
  const resultsRef = useRef<{ rt: number; hit: boolean }[]>([])
  const lastConfig = useRef<GameConfig | null>(null)
  const targetCount = useRef<number>(TOTAL)
  const sizeMultiplier = useRef<number>(1.0)
  const radiusRef = useRef<number>(TARGET_RADIUS)

  useBeforeUnload(phase !== "intro" && phase !== "done")
  useVisibilityGuard(() => {
    setPhase("intro")
  }, phase === "playing")

  const spawnTarget = (container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect()
    const margin = radiusRef.current + 8
    const x = margin + Math.random() * (rect.width - margin * 2)
    const y = margin + Math.random() * (rect.height - margin * 2)
    setTarget({ x, y })
    startTimeRef.current = performance.now()
  }

  const handleClick = (e: React.MouseEvent) => {
    if (phase !== "playing") return
    if (respondedRef.current) return
    respondedRef.current = true
    const c = containerRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const rt = Math.round(performance.now() - startTimeRef.current)
    const dist = Math.sqrt((cx - target.x) ** 2 + (cy - target.y) ** 2)
    const hit = dist <= radiusRef.current
    resultsRef.current = [...resultsRef.current, { rt, hit }]
    setResults((prev) => [...prev, { rt, hit }])
    const next = trial + 1
    if (next >= targetCount.current) {
      setPhase("done")
      finalize(resultsRef.current)
      return
    }
    setTrial((prev) => prev + 1)
    respondedRef.current = false
    spawnTarget(c)
  }

  const finalize = async (r: { rt: number; hit: boolean }[]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    const hitPct = r.filter((x) => x.hit).length / r.length
    const avgRt = Math.round(r.reduce((s, x) => s + x.rt, 0) / r.length)
    const speedScore = Math.max(
      0,
      Math.min(100, Math.round(100 - (avgRt - 200) / 8))
    )
    const score = Math.round(hitPct * 50 + speedScore * 0.5)
    try {
      await dataLayer.saveSession({
        testId: "flick-trainer",
        category: "precision",
        rawScore: score,
        percentile: lookupPercentile("flick-trainer", score),
        metadata: { accuracy: Math.round(hitPct * 100), avgReactionMs: avgRt },
      })
    } catch (err) {
      console.error("Failed to save Flick Trainer session:", err)
    }
    if (!submittedRef.current) return
    const card = await generateShareCard(
      "Flick Trainer",
      `${Math.round(hitPct * 100)}% accuracy`,
      lookupPercentile("flick-trainer", score)
    ).catch(() => "")
    if (!submittedRef.current) return
    setShareImage(card)

    if (!submittedRef.current) return
    redirectToResults({
      testId: "flick-trainer",
      testName: "Flick Trainer",
      attempts: r.map((x) => x.rt),
      unit: "ms",
      percentile: lookupPercentile("flick-trainer", score),
      personalBest: null,
      category: "precision",
      average: avgRt,
    })
  }

  const startGame = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    const diff = getDifficultyParams(
      "flick-trainer",
      (cfg.difficulty as string) || "Medium"
    )
    sizeMultiplier.current = (diff.sizeMultiplier as number) || 1.0
    radiusRef.current = TARGET_RADIUS * sizeMultiplier.current
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
                : TOTAL
    targetCount.current = attemptCount
    setPhase("playing")
    setTrial(0)
    setResults([])
    resultsRef.current = []
    submittedRef.current = false
    respondedRef.current = false
    setTimeout(() => {
      if (containerRef.current) spawnTarget(containerRef.current)
    }, 300)
  }

  const renderCrosshair = () => {
    const r = radiusRef.current
    return (
      <svg
        width={r * 2}
        height={r * 2}
        viewBox={`0 0 ${r * 2} ${r * 2}`}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: target.x, top: target.y }}
      >
        <circle
          cx={r}
          cy={r}
          r={r - 2}
          fill="#ef4444"
          fillOpacity={0.35}
          stroke="#ef4444"
          strokeWidth={2}
        />
        <line
          x1={r - 6}
          y1={r}
          x2={r + 6}
          y2={r}
          stroke="#ef4444"
          strokeWidth={1.5}
        />
        <line
          x1={r}
          y1={r - 6}
          x2={r}
          y2={r + 6}
          stroke="#ef4444"
          strokeWidth={1.5}
        />
      </svg>
    )
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GameConfigPanel
            testId="flick-trainer"
            icon="⚡🎯"
            title="Flick Trainer"
            description={`Flick your mouse to the target and click as fast and accurately as possible.`}
            onStart={(config: GameConfig) => startGame(config)}
          />
        </div>
      </div>
    )
  }

  if (phase === "playing") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted">
            <span>
              Target {trial + 1}/{targetCount.current}
            </span>
            <span className="flex items-center gap-2">
              <span>Hits: {results.filter((r) => r.hit).length}</span>
              <button
                onClick={() => setPhase("intro")}
                className="transition-standard flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[10px] text-muted hover:border-error/50 hover:text-error"
                aria-label="Restart"
              >
                ✕
              </button>
            </span>
          </div>
          <div
            ref={containerRef}
            onClick={handleClick}
            className="relative h-72 w-full cursor-crosshair overflow-hidden rounded-lg border border-card-border bg-subtle"
          >
            <div className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-card-border bg-subtle" />
            {renderCrosshair()}
          </div>
        </div>
      </div>
    )
  }

  const hitPct = results.filter((r) => r.hit).length / targetCount.current
  const avgRt =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.rt, 0) / results.length)
      : 0
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-card-border bg-card p-8">
        <div className="text-4xl text-success">✓</div>
        <div className="font-mono text-4xl font-bold text-foreground">
          {Math.round(hitPct * 100)}%
        </div>
        <div className="font-mono text-xs text-muted">
          accuracy · {avgRt}ms avg flick time
        </div>
        <div className="grid w-full max-w-xs grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="font-mono text-[10px] text-muted">Hits</div>
            <div className="font-mono text-foreground">
              {results.filter((r) => r.hit).length}/{targetCount.current}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted">Fastest</div>
            <div className="font-mono text-foreground">
              {results.length > 0
                ? results.reduce((min, r) => Math.min(min, r.rt), results[0].rt)
                : 0}
              ms
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted">Avg RT</div>
            <div className="font-mono text-foreground">{avgRt}ms</div>
          </div>
        </div>
        {shareImage && (
          <a
            href={shareImage}
            download="cogniarena-flick-trainer.png"
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
          testId="flick-trainer"
          score={Math.round(hitPct * 100)}
          scoreLabel={`${Math.round(hitPct * 100)}% acc`}
          testName="Flick Trainer"
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

export default withErrorBoundary(FlickTrainerTest)
