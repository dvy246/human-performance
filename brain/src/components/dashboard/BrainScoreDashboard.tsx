import { useState, useEffect } from "react"
import { dataLayer } from "../../runtime/dataLayer"
import {
  computeCategoryAverages,
  calculateBbiScore,
  type CognitiveAverages,
} from "../../runtime/skillRadar"

interface TrendData {
  direction: "up" | "down" | "stable"
  delta: number
}

interface CategoryConfig {
  key: keyof CognitiveAverages
  label: string
  href: string
  icon: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "reaction",
    label: "Reaction",
    href: "/tests/reaction-time",
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    key: "memory",
    label: "Memory",
    href: "/tests/sequence-memory",
    icon: "M12 2a10 10 0 1 0 10 10 M12 6v6l4 2 M21 3v4h-4",
  },
  {
    key: "processing",
    label: "Processing",
    href: "/tests/pattern-reasoning",
    icon: "M12 2a3 3 0 0 0-3 3v.5M12 2a3 3 0 0 1 3 3v.5M12 2v4M6.5 8.5l3.5-2M6.5 8.5l-3.5 6M10 14l2 6 2-6M17.5 14.5l-3.5-2M17.5 14.5l3.5-2",
  },
  {
    key: "precision",
    label: "Precision",
    href: "/tests/aim-trainer",
    icon: "M12 2a10 10 0 1 0 10 10M12 6a6 6 0 1 0 6 6M12 10a2 2 0 1 0 2 2",
  },
  {
    key: "focus",
    label: "Focus",
    href: "/tests/stroop",
    icon: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  },
  {
    key: "stamina",
    label: "Stamina",
    href: "/tests/click-speed",
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
  },
]

function Icon({ d }: { d: string }) {
  const segments = d.split("M").filter(Boolean)
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
      aria-hidden="true"
    >
      {segments.map((s, i) => (
        <path key={i} d={`M${s}`} />
      ))}
    </svg>
  )
}

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-subtle ${className}`}
      aria-hidden="true"
    />
  )
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-3 py-1">
      <SkeletonPulse className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-3 w-6" />
        </div>
        <SkeletonPulse className="h-2 w-full rounded-full" />
      </div>
    </div>
  )
}

function ScoreCircle({ score, animate }: { score: number; animate: boolean }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg
        width="112"
        height="112"
        viewBox="0 0 100 100"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-subtle"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-accent"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? offset : circumference}
          style={{ transition: "stroke-dashoffset 0.8s ease-out 0.3s" }}
        />
      </svg>
      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {score}
      </span>
    </div>
  )
}

export default function BrainScoreDashboard() {
  const [loading, setLoading] = useState(true)
  const [averages, setAverages] = useState<CognitiveAverages | null>(null)
  const [bbiScore, setBbiScore] = useState<number | null>(null)
  const [hasData, setHasData] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [trends, setTrends] = useState<Record<string, TrendData>>({})
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const records = await dataLayer.getHistory()
        if (!mounted) return
        if (records.length > 0) {
          const computed = computeCategoryAverages(records)
          setAverages(computed)
          setBbiScore(calculateBbiScore(computed))
          setHasData(true)

          // Compute trends: compare last 3 sessions to previous 3
          const trendData: Record<string, TrendData> = {}
          const recent = records.slice(0, 3)
          const older = records.slice(3, 6)
          if (older.length > 0) {
            const recentAvg = computeCategoryAverages(recent)
            const olderAvg = computeCategoryAverages(older)
            for (const key of Object.keys(
              recentAvg
            ) as (keyof CognitiveAverages)[]) {
              const delta = Math.round(recentAvg[key] - olderAvg[key])
              trendData[key] = {
                direction: delta > 2 ? "up" : delta < -2 ? "down" : "stable",
                delta,
              }
            }
          }
          setTrends(trendData)

          // Load streak
          const streakData = dataLayer.getStreak()
          if (mounted) setStreak(streakData.streakCount)
        }
      } catch (err) {
        console.error("Failed to load scores:", err)
      } finally {
        if (mounted) {
          setLoading(false)
          requestAnimationFrame(() => {
            if (mounted) setAnimate(true)
          })
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-card-border bg-card/50 p-6 backdrop-blur md:p-8">
        <div className="mb-8 flex items-center gap-3">
          <SkeletonPulse className="h-8 w-8 rounded-lg" />
          <SkeletonPulse className="h-5 w-28" />
        </div>
        {[...Array(6)].map((_, i) => (
          <SkeletonBar key={i} />
        ))}
        <div className="mt-6 flex justify-center border-t border-card-border/60 pt-6">
          <SkeletonPulse className="h-28 w-28 rounded-full" />
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-card-border bg-card/50 p-8 text-center backdrop-blur md:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
            <path d="M21 3v4h-4" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
          Your Brain
        </h2>
        <p className="mx-auto mb-7 max-w-xs text-sm leading-relaxed text-secondary">
          Complete any assessment to unlock your personalized cognitive profile
          with skill bars and a composite index score.
        </p>
        <a
          href="/tests/reaction-time"
          className="transition-standard inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-[0.98]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Start Your First Assessment
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-card-border bg-card/50 p-6 backdrop-blur md:p-8">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/15">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
            <path d="M21 3v4h-4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Your Brain
        </h2>
        {streak > 0 && (
          <div className="ml-auto flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5">
            <span className="text-xs">🔥</span>
            <span className="font-mono text-[10px] font-bold text-accent">
              {streak} day{streak !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div
        className="flex flex-col gap-2"
        role="list"
        aria-label="Cognitive skill scores"
      >
        {CATEGORIES.map((cat, i) => {
          const val = averages?.[cat.key] ?? 0
          const pct = Math.min(val, 100)
          return (
            <a
              key={cat.key}
              href={cat.href}
              className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/[0.04] focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
              role="listitem"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/[0.08] bg-accent/5 transition-all group-hover:border-accent/25 group-hover:bg-accent/10">
                <Icon d={cat.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[13px] leading-none font-medium text-foreground/80 transition-colors group-hover:text-accent">
                    {cat.label}
                  </span>
                  <span className="font-mono text-[12px] text-muted tabular-nums">
                    {Math.round(val)}
                  </span>
                  {trends[cat.key] && (
                    <span
                      className={`ml-1 font-mono text-[10px] ${
                        trends[cat.key].direction === "up"
                          ? "text-success"
                          : trends[cat.key].direction === "down"
                            ? "text-error"
                            : "text-muted"
                      }`}
                    >
                      {trends[cat.key].direction === "up"
                        ? "↑"
                        : trends[cat.key].direction === "down"
                          ? "↓"
                          : "→"}
                      {trends[cat.key].delta !== 0 &&
                        `${Math.abs(trends[cat.key].delta)}`}
                    </span>
                  )}
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-subtle"
                  role="progressbar"
                  aria-valuenow={Math.round(val)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.label}: ${Math.round(val)} out of 100`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/50 via-accent/80 to-accent"
                    style={{
                      width: animate ? `${pct}%` : "0%",
                      transition: `width 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`,
                    }}
                  />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="mt-7 flex flex-col items-center gap-1 border-t border-card-border/60 pt-6">
        <ScoreCircle score={bbiScore ?? 0} animate={animate} />
        <span className="mt-1 font-mono text-[10px] tracking-[0.15em] text-muted uppercase">
          CogniArena Index
        </span>
      </div>
    </div>
  )
}

BrainScoreDashboard.displayName = "BrainScoreDashboard"
