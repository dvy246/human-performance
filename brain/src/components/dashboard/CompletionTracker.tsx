import React, { useState, useEffect } from "react"
import { dataLayer } from "../../runtime/dataLayer"

const ALL_TESTS = [
  "reaction-time",
  "f1-lights",
  "sound-reaction",
  "choice-reaction",
  "sequence-memory",
  "number-memory",
  "visual-pattern",
  "dual-n-back",
  "verbal-memory",
  "pattern-reasoning",
  "spatial-orientation",
  "decision-speed",
  "planning",
  "prioritization",
  "go-no-go",
  "stroop",
  "tmt-partA",
  "tmt-partB",
  "focus-challenge",
  "aim-trainer",
  "aim-coordination",
  "mouse-accuracy",
  "flick-trainer",
  "typing-speed",
  "click-speed",
  "gauntlet",
]

const CATEGORIES: {
  key: string
  label: string
  color: string
  tests: string[]
}[] = [
  {
    key: "reaction",
    label: "Reaction",
    color: "#ef4444",
    tests: ["reaction-time", "f1-lights", "sound-reaction", "choice-reaction"],
  },
  {
    key: "memory",
    label: "Memory",
    color: "#8b5cf6",
    tests: [
      "sequence-memory",
      "number-memory",
      "visual-pattern",
      "dual-n-back",
      "verbal-memory",
    ],
  },
  {
    key: "processing",
    label: "Reasoning",
    color: "#f59e0b",
    tests: [
      "pattern-reasoning",
      "spatial-orientation",
      "decision-speed",
      "planning",
      "prioritization",
    ],
  },
  {
    key: "focus",
    label: "Focus",
    color: "#3b82f6",
    tests: ["go-no-go", "stroop", "tmt-partA", "tmt-partB", "focus-challenge"],
  },
  {
    key: "precision",
    label: "Motor",
    color: "#10b981",
    tests: [
      "aim-trainer",
      "aim-coordination",
      "mouse-accuracy",
      "flick-trainer",
    ],
  },
  {
    key: "stamina",
    label: "Stamina",
    color: "#ec4899",
    tests: ["click-speed", "typing-speed", "gauntlet"],
  },
]

export default function CompletionTracker() {
  const [attemptedTests, setAttemptedTests] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    async function load() {
      const records = await dataLayer.getHistory()
      if (!mounted) return
      const attempted = new Set(records.map((r) => r.testId))
      setAttemptedTests(attempted)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const totalTests = ALL_TESTS.length
  const completedCount = ALL_TESTS.filter((t) => attemptedTests.has(t)).length
  const overallPercent = Math.round((completedCount / totalTests) * 100)

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-card-border bg-card p-5 shadow">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest text-muted uppercase">
          Completion Overview
        </span>
        <span className="font-mono text-sm font-bold text-foreground">
          {completedCount}/{totalTests}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-full overflow-hidden rounded-full border border-card-border/60 bg-subtle">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-muted">
          <span>{completedCount} completed</span>
          <span>{totalTests - completedCount} remaining</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col gap-3">
        {CATEGORIES.map((cat) => {
          const catAttempted = cat.tests.filter((t) =>
            attemptedTests.has(t)
          ).length
          const catTotal = cat.tests.length
          const catPercent = Math.round((catAttempted / catTotal) * 100)

          return (
            <div key={cat.key} className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="w-16 shrink-0 font-mono text-[10px] text-muted">
                {cat.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded border border-card-border/40 bg-subtle">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${catPercent}%`,
                    backgroundColor: cat.color,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="w-10 text-right font-mono text-[10px] font-bold text-foreground">
                {catAttempted}/{catTotal}
              </span>
            </div>
          )
        })}
      </div>

      {/* Unattempted tests */}
      {completedCount < totalTests && (
        <div className="flex flex-col gap-2 border-t border-card-border/40 pt-3">
          <span className="font-mono text-[10px] text-muted uppercase">
            Not yet attempted:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TESTS.filter((t) => !attemptedTests.has(t)).map((t) => (
              <a
                key={t}
                href={`/tests/${t}`}
                className="rounded border border-dashed border-card-border/60 px-2 py-0.5 font-mono text-[10px] text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {t.replace(/-/g, " ")}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
