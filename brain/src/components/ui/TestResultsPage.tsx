import React, { useState, useEffect } from "react"
import { useI18n } from "../../runtime/useI18n"
import { formatTopPercentile } from "../../runtime/percentileLookup"
import QRChallengeCard from "./QRChallengeCard"

interface ResultData {
  testId: string
  testName: string
  attempts: number[]
  unit: string
  percentile: number
  personalBest: number | null
  category: string
  average: number
  difficulty?: string
}

const TEST_SLUGS: Record<string, string> = {
  "tmt-partA": "trail-making",
  "tmt-partB": "trail-making",
}

const RELATED_TESTS: Record<string, { name: string; slug: string }[]> = {
  "reaction-time": [
    { name: "F1 Lights", slug: "f1-lights" },
    { name: "Sound Reflex", slug: "sound-reaction" },
    { name: "Choice Grid", slug: "choice-reaction" },
  ],
  "f1-lights": [
    { name: "Visual Reaction", slug: "reaction-time" },
    { name: "Sound Reflex", slug: "sound-reaction" },
  ],
  "sound-reaction": [
    { name: "Visual Reaction", slug: "reaction-time" },
    { name: "F1 Lights", slug: "f1-lights" },
  ],
  "choice-reaction": [
    { name: "Decision Speed", slug: "decision-speed" },
    { name: "Stroop", slug: "stroop" },
  ],
  "go-no-go": [
    { name: "Stroop", slug: "stroop" },
    { name: "Trail Making", slug: "trail-making" },
  ],
  "click-speed": [
    { name: "Aim Trainer", slug: "aim-trainer" },
    { name: "Typing Speed", slug: "typing-speed" },
  ],
  "aim-trainer": [
    { name: "Mouse Accuracy", slug: "mouse-accuracy" },
    { name: "Flick Trainer", slug: "flick-trainer" },
  ],
  "sequence-memory": [
    { name: "Number Memory", slug: "number-memory" },
    { name: "Visual Pattern", slug: "visual-pattern" },
  ],
  "number-memory": [
    { name: "Sequence Memory", slug: "sequence-memory" },
    { name: "Verbal Memory", slug: "verbal-memory" },
  ],
  "visual-pattern": [
    { name: "Sequence Memory", slug: "sequence-memory" },
    { name: "Spatial Orientation", slug: "spatial-orientation" },
  ],
  stroop: [
    { name: "Go/No-Go", slug: "go-no-go" },
    { name: "Trail Making", slug: "trail-making" },
  ],
  "pattern-reasoning": [
    { name: "Spatial Orientation", slug: "spatial-orientation" },
    { name: "Planning", slug: "planning" },
  ],
  "trail-making": [
    { name: "Stroop", slug: "stroop" },
    { name: "Go/No-Go", slug: "go-no-go" },
  ],
  "dual-n-back": [
    { name: "Sequence Memory", slug: "sequence-memory" },
    { name: "Number Memory", slug: "number-memory" },
  ],
  "verbal-memory": [
    { name: "Number Memory", slug: "number-memory" },
    { name: "Visual Pattern", slug: "visual-pattern" },
  ],
  "spatial-orientation": [
    { name: "Visual Pattern", slug: "visual-pattern" },
    { name: "Pattern Reasoning", slug: "pattern-reasoning" },
  ],
  "decision-speed": [
    { name: "Choice Reaction", slug: "choice-reaction" },
    { name: "Planning", slug: "planning" },
  ],
  planning: [
    { name: "Prioritization", slug: "prioritization" },
    { name: "Decision Speed", slug: "decision-speed" },
  ],
  prioritization: [
    { name: "Planning", slug: "planning" },
    { name: "Decision Speed", slug: "decision-speed" },
  ],
  "mouse-accuracy": [
    { name: "Aim Trainer", slug: "aim-trainer" },
    { name: "Flick Trainer", slug: "flick-trainer" },
  ],
  "flick-trainer": [
    { name: "Aim Trainer", slug: "aim-trainer" },
    { name: "Mouse Accuracy", slug: "mouse-accuracy" },
  ],
}

function getPersonalizedMessage(data: ResultData): {
  emoji: string
  title: string
  subtitle: string
} {
  const { attempts, average, percentile, personalBest, testId } = data
  const isLowerBetter = ![
    "click-speed",
    "sequence-memory",
    "number-memory",
    "visual-pattern",
    "pattern-reasoning",
    "planning",
    "prioritization",
  ].includes(testId)

  // Check if new personal best
  const isNewPB =
    personalBest !== null &&
    (isLowerBetter ? average <= personalBest : average >= personalBest)

  // Check trend (improving?)
  let improving = false
  if (attempts.length >= 3) {
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2))
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    improving = isLowerBetter ? secondAvg < firstAvg : secondAvg > firstAvg
  }

  if (isNewPB && percentile >= 80) {
    return {
      emoji: "🏆",
      title: "New Personal Best!",
      subtitle: `Outstanding! ${formatTopPercentile(percentile, isLowerBetter)} globally. A truly elite performance.`,
    }
  }
  if (isNewPB) {
    return {
      emoji: "🎉",
      title: "New Personal Best!",
      subtitle: `You beat your previous record! Keep pushing to climb the rankings.`,
    }
  }
  if (percentile >= 90) {
    return {
      emoji: "⚡",
      title: "Elite Performance!",
      subtitle: `${formatTopPercentile(percentile, isLowerBetter)} — among the best. Can you reach #1?`,
    }
  }
  if (percentile >= 70) {
    return {
      emoji: "🔥",
      title: "Strong Showing!",
      subtitle: `${formatTopPercentile(percentile, isLowerBetter)} — you're well above average. A few more drills and you'll be elite.`,
    }
  }
  if (improving) {
    return {
      emoji: "📈",
      title: "Trending Upward!",
      subtitle: `Your attempts got progressively better. Keep practicing to see bigger gains!`,
    }
  }
  if (percentile >= 40) {
    return {
      emoji: "💪",
      title: "Solid Effort!",
      subtitle: `${formatTopPercentile(percentile, isLowerBetter)}. Consistent practice will push you higher.`,
    }
  }
  return {
    emoji: "🌱",
    title: "Room to Grow!",
    subtitle: `Every expert was once a beginner. Try again to improve your score!`,
  }
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  return Math.sqrt(
    squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1)
  )
}

export default function TestResultsPage() {
  const { t } = useI18n()
  const [data, setData] = useState<ResultData | null>(null)
  const [showQR, setShowQR] = useState(false)

  const hasResultParam =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("hasResult")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cogniarena-last-result")
      if (raw) {
        setData(JSON.parse(raw))
        // Clean URL param after data loads
        if (hasResultParam) {
          window.history.replaceState({}, "", "/tests/results/")
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (!data) {
    if (hasResultParam) {
      return (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <h2 className="text-xl font-bold text-foreground">
            Loading results...
          </h2>
        </div>
      )
    }
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="text-4xl">🔍</span>
        <h2 className="text-xl font-bold text-foreground">
          {t("results.no_results")}
        </h2>
        <p className="text-sm text-muted">{t("results.no_results_desc")}</p>
        <a
          href="/"
          className="transition-standard flex h-10 items-center rounded bg-accent px-6 font-mono text-xs font-semibold text-white uppercase hover:bg-accent-hover"
        >
          {t("results.back_home")}
        </a>
      </div>
    )
  }

  const msg = getPersonalizedMessage(data)
  const { attempts, unit, percentile, personalBest, average } = data
  const min = attempts.reduce((a, b) => Math.min(a, b), attempts[0])
  const max = attempts.reduce((a, b) => Math.max(a, b), attempts[0])
  const stdDev = Math.round(computeStdDev(attempts, average) * 10) / 10
  const related = RELATED_TESTS[data.testId] || []

  // Bar chart calculations
  const isLowerBetter = ![
    "click-speed",
    "sequence-memory",
    "number-memory",
    "visual-pattern",
    "pattern-reasoning",
    "planning",
    "prioritization",
  ].includes(data.testId)
  const bestVal = isLowerBetter ? Math.min(...attempts) : Math.max(...attempts)
  const worstVal = isLowerBetter ? Math.max(...attempts) : Math.min(...attempts)
  const range = worstVal - bestVal || 1

  const formatScore = (val: number) => {
    if (data.testId === "click-speed") return `${(val / 10).toFixed(1)} CPS`
    if (["sequence-memory", "visual-pattern"].includes(data.testId))
      return `Lvl ${val}`
    if (data.testId === "number-memory") return `${val} digits`
    return `${Math.round(val)} ${unit}`
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4">
      {/* Trophy Header */}
      <div className="animate-fade-in-up flex flex-col items-center gap-3 py-6 text-center">
        <span className="text-6xl select-none">{msg.emoji}</span>
        <span className="font-mono text-[11px] font-semibold tracking-widest text-accent uppercase">
          {data.testName}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {msg.title}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {msg.subtitle}
        </p>
        {data.difficulty && (
          <span className="rounded border border-card-border bg-subtle px-2 py-0.5 font-mono text-[10px] text-secondary uppercase">
            Difficulty: {data.difficulty}
          </span>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-extrabold text-foreground">
            {formatScore(average)}
          </span>
          <span className="text-sm font-medium text-accent">
            {formatTopPercentile(
              percentile,
              ![
                "click-speed",
                "sequence-memory",
                "number-memory",
                "visual-pattern",
                "pattern-reasoning",
                "planning",
                "prioritization",
              ].includes(data.testId)
            )}
          </span>
        </div>
        {data.difficulty && data.difficulty !== "Medium" && (
          <span className="max-w-xs font-mono text-[10px] leading-normal text-muted">
            * Percentile ranking is based on standard Medium difficulty
            population norms.
          </span>
        )}
      </div>

      {/* Per-Attempt Bar Chart */}
      <div className="animate-fade-in-up stagger-1 flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 shadow">
        <span className="font-mono text-xs tracking-widest text-muted uppercase">
          {t("results.attempt_breakdown")}
        </span>
        <div className="flex h-32 items-end gap-2">
          {attempts.map((val, idx) => {
            const heightPercent = Math.max(
              10,
              ((worstVal - val) / range) * 80 + 20
            )
            const isBest = val === bestVal
            const isWorst = val === worstVal && attempts.length > 1
            const barColor = isBest
              ? "#10b981"
              : isWorst
                ? "#ef4444"
                : "#f59e0b"

            return (
              <div
                key={idx}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="font-mono text-[9px] font-bold text-foreground">
                  {formatScore(val)}
                </span>
                <div
                  className="w-full min-w-[20px] rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: barColor,
                    opacity: 0.85,
                  }}
                />
                <span className="font-mono text-[9px] text-muted">
                  #{idx + 1}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 font-mono text-[9px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
            {t("results.best")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
            {t("results.average")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />{" "}
            {t("results.slowest")}
          </span>
        </div>
      </div>

      {/* Trend Line */}
      {attempts.length >= 2 && (
        <div className="animate-fade-in-up stagger-2 flex flex-col gap-3 rounded-xl border border-card-border bg-card p-5 shadow">
          <span className="font-mono text-xs tracking-widest text-muted uppercase">
            {t("results.trend")}
          </span>
          <svg viewBox="0 0 300 80" className="h-20 w-full overflow-visible">
            {(() => {
              const pad = 20
              const w = 300 - pad * 2
              const h = 80 - pad
              const vals = attempts
              const minV = vals.reduce((a, b) => Math.min(a, b), vals[0])
              const maxV = vals.reduce((a, b) => Math.max(a, b), vals[0])
              const rng = maxV - minV || 1
              const points = vals.map((v, i) => {
                const x = pad + (i / (vals.length - 1)) * w
                const norm = (v - minV) / rng
                const y = isLowerBetter
                  ? pad + norm * (h - 10) + 5
                  : h - norm * (h - 10) + 5
                return { x, y }
              })
              return (
                <>
                  <line
                    x1={pad}
                    y1={h}
                    x2={300 - pad}
                    y2={h}
                    stroke="var(--color-card-border)"
                    strokeWidth="0.5"
                  />
                  <path
                    d={`M ${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`}
                    fill="none"
                    stroke="var(--chart-accent)"
                    strokeWidth="2"
                  />
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="var(--bg-card)"
                      stroke="var(--chart-accent)"
                      strokeWidth="1.5"
                    >
                      <title>{`Attempt ${i + 1}: ${formatScore(vals[i])}`}</title>
                    </circle>
                  ))}
                </>
              )
            })()}
          </svg>
        </div>
      )}

      {/* Stats Grid */}
      <div className="animate-fade-in-up stagger-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: t("results.min"), value: formatScore(min) },
          { label: t("results.max"), value: formatScore(max) },
          { label: t("results.avg"), value: formatScore(average) },
          { label: t("results.std_dev"), value: `${stdDev} ${unit}` },
          {
            label: t("results.percentile"),
            value: formatTopPercentile(
              percentile,
              ![
                "click-speed",
                "sequence-memory",
                "number-memory",
                "visual-pattern",
                "pattern-reasoning",
                "planning",
                "prioritization",
              ].includes(data.testId)
            ),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-lg border border-card-border bg-card p-3 text-center"
          >
            <span className="font-mono text-[9px] tracking-widest text-muted uppercase">
              {stat.label}
            </span>
            <span className="mt-1 font-mono text-sm font-bold text-foreground">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Personal Best Comparison */}
      {personalBest !== null && (
        <div className="animate-fade-in-up stagger-4 flex items-center justify-between rounded-lg border border-card-border bg-subtle p-4 text-xs">
          <span className="font-mono text-muted">{t("results.pb_all")}</span>
          <span className="font-mono font-bold text-foreground">
            {formatScore(personalBest)}
          </span>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="animate-fade-in-up stagger-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a
          href={`/tests/${TEST_SLUGS[data.testId] || data.testId}`}
          className="transition-standard flex h-10 items-center justify-center gap-2 rounded-lg bg-accent font-mono text-xs font-semibold text-white uppercase hover:bg-accent-hover"
        >
          {t("results.play_again")}
        </a>
        <a
          href="/dashboard"
          className="transition-standard flex h-10 items-center justify-center gap-2 rounded-lg border border-card-border bg-subtle font-mono text-xs font-semibold text-foreground uppercase hover:bg-panel"
        >
          {t("results.dashboard")}
        </a>
        <button
          onClick={() => setShowQR(true)}
          className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-card-border bg-subtle font-mono text-xs font-semibold text-foreground uppercase hover:bg-panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {t("results.challenge")}
        </button>
      </div>

      {/* Related Tests */}
      {related.length > 0 && (
        <div className="animate-fade-in-up stagger-6 flex flex-col gap-3 border-t border-card-border/40 pt-4">
          <span className="font-mono text-xs tracking-widest text-muted uppercase">
            {t("results.related")}
          </span>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <a
                key={r.slug}
                href={`/tests/${r.slug}`}
                className="rounded-lg border border-card-border bg-subtle px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                {r.name} →
              </a>
            ))}
          </div>
        </div>
      )}

      <QRChallengeCard
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        testId={data.testId}
        score={Math.round(data.average)}
        scoreLabel={formatScore(data.average)}
        testName={data.testName}
        percentile={data.percentile}
      />
    </div>
  )
}
