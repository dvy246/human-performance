import React, { useState, useEffect } from "react"
import { dataLayer, type SessionRecord } from "../../runtime/dataLayer"

const TEST_NAMES: Record<string, string> = {
  "reaction-time": "Visual Reaction",
  "f1-lights": "F1 Lights",
  "sound-reaction": "Sound Reflex",
  "choice-reaction": "Choice Grid",
  "go-no-go": "Go/No-Go",
  "click-speed": "Click Speed",
  "aim-trainer": "Aim Precision",
  "sequence-memory": "Sequence Mem.",
  "number-memory": "Number Mem.",
  "visual-pattern": "Visual Pattern",
  stroop: "Stroop",
  "pattern-reasoning": "Pattern Reason.",
  "tmt-partA": "Trail Making A",
  "tmt-partB": "Trail Making B",
  "dual-n-back": "Dual N-Back",
  "focus-challenge": "Focus Challenge",
  "verbal-memory": "Verbal Memory",
  "spatial-orientation": "Spatial Orient.",
  "mouse-accuracy": "Mouse Accuracy",
  "flick-trainer": "Flick Trainer",
  "decision-speed": "Decision Speed",
  planning: "Planning",
  prioritization: "Prioritization",
  gauntlet: "Gauntlet",
}

const CATEGORY_COLORS: Record<string, string> = {
  reaction: "#ef4444",
  memory: "#8b5cf6",
  processing: "#f59e0b",
  precision: "#10b981",
  focus: "#3b82f6",
  stamina: "#ec4899",
}

const TEST_CATEGORY: Record<string, string> = {
  "reaction-time": "reaction",
  "f1-lights": "reaction",
  "sound-reaction": "reaction",
  "choice-reaction": "reaction",
  "go-no-go": "focus",
  "click-speed": "stamina",
  "aim-trainer": "precision",
  "sequence-memory": "memory",
  "number-memory": "memory",
  "visual-pattern": "memory",
  stroop: "focus",
  "pattern-reasoning": "processing",
  "tmt-partA": "focus",
  "tmt-partB": "focus",
  "dual-n-back": "memory",
  "focus-challenge": "focus",
  "verbal-memory": "memory",
  "spatial-orientation": "processing",
  "mouse-accuracy": "precision",
  "flick-trainer": "precision",
  "decision-speed": "processing",
  planning: "processing",
  prioritization: "processing",
  gauntlet: "processing",
}

interface TestBar {
  testId: string
  name: string
  percentile: number
  color: string
}

export default function CrossTestBarChart() {
  const [bars, setBars] = useState<TestBar[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const records = await dataLayer.getHistory()
      if (!mounted) return

      // Get best percentile per test
      const bestByTest = new Map<string, number>()
      records.forEach((r) => {
        const current = bestByTest.get(r.testId) || 0
        bestByTest.set(r.testId, Math.max(current, r.percentile))
      })

      const barData: TestBar[] = []
      bestByTest.forEach((percentile, testId) => {
        if (TEST_NAMES[testId]) {
          barData.push({
            testId,
            name: TEST_NAMES[testId],
            percentile,
            color:
              CATEGORY_COLORS[TEST_CATEGORY[testId] || "processing"] ||
              "#6b7280",
          })
        }
      })

      barData.sort((a, b) => b.percentile - a.percentile)
      setBars(barData)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (bars.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-card-border bg-card p-6 shadow">
        <span className="font-mono text-xs text-muted">No test data yet</span>
        <span className="text-[10px] text-muted">
          Complete assessments to see your cross-test comparison
        </span>
      </div>
    )
  }

  const maxBarWidth = 200

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 shadow">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest text-muted uppercase">
          Cross-Test Comparison
        </span>
        <span className="font-mono text-[10px] text-muted">
          {bars.length} tests
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {bars.map((bar) => (
          <div key={bar.testId} className="flex items-center gap-3">
            <span
              className="w-24 shrink-0 truncate text-right font-mono text-[10px] text-muted"
              title={bar.name}
            >
              {bar.name}
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="h-4 max-w-[200px] flex-1 overflow-hidden rounded-sm border border-card-border/40 bg-subtle">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.max(2, bar.percentile)}%`,
                    backgroundColor: bar.color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[10px] font-bold text-foreground">
                {bar.percentile}%ile
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-card-border/40 pt-2">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-[9px] text-muted uppercase">
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
