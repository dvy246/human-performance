import React, { useState, useEffect } from "react"
import { dataLayer, type SessionRecord } from "@/runtime/dataLayer"

const TEST_NAMES: Record<string, string> = {
  "reaction-time": "Visual Reaction Test",
  "f1-lights": "F1 Start Lights",
  "go-no-go": "Color Go/No-Go",
  "choice-reaction": "Choice Grid",
  "sound-reaction": "Sound Reflex Test",
  "click-speed": "Click Speed (CPS)",
  "aim-trainer": "Aim Precision",
  "aim-coordination": "Aim Coordination",
  "sequence-memory": "Sequence Memory",
  "number-memory": "Number Memory",
  "visual-pattern": "Visual Pattern Memory",
  stroop: "Stroop Attention Test",
  "pattern-reasoning": "Pattern Reasoning Test",
  "tmt-partA": "Trail Making Test (Part A)",
  "tmt-partB": "Trail Making Test (Part B)",
  "dual-n-back": "Dual N-Back Memory",
  "focus-challenge": "Focus Challenge",
  gauntlet: "The Gauntlet",
  "verbal-memory": "Verbal Memory Test",
  "spatial-orientation": "Spatial Orientation Test",
  "mouse-accuracy": "Mouse Accuracy Test",
  "flick-trainer": "Flick Trainer",
  "decision-speed": "Decision Speed Test",
  planning: "Planning Test",
  prioritization: "Prioritization Test",
  "typing-speed": "Typing Speed Test",
}

export default function HistoryDashboard() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const history = await dataLayer.getHistory()
      setSessions(history.sort((a, b) => b.timestamp - a.timestamp))
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.testId === filter)

  const testTypes = Array.from(new Set(sessions.map((s) => s.testId)))

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Loading history...
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <div className="text-4xl">📊</div>
        <p className="text-sm text-muted">
          No test history yet. Take your first test to see it here!
        </p>
        <a
          href="/tests/reaction-time"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Take a Test
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-accent text-white"
              : "border border-card-border text-muted hover:bg-subtle hover:text-foreground"
          }`}
        >
          All Tests ({sessions.length})
        </button>
        {testTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === type
                ? "bg-accent text-white"
                : "border border-card-border text-muted hover:bg-subtle hover:text-foreground"
            }`}
          >
            {TEST_NAMES[type] || type} (
            {sessions.filter((s) => s.testId === type).length})
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-card-border bg-card p-4 transition-colors hover:bg-hover"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-lg">
                {getTestIcon(session.testId)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {TEST_NAMES[session.testId] || session.testId}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(session.timestamp)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {session.rawScore}{" "}
                <span className="text-xs font-normal text-muted">
                  {session.category}
                </span>
              </p>
              {session.percentile && (
                <p className="text-xs text-accent">
                  {session.percentile}th percentile
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      {sessions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => exportToCSV()}
            className="flex items-center gap-2 rounded-md border border-card-border px-4 py-2 text-sm text-muted transition-colors hover:bg-subtle hover:text-foreground"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export to CSV
          </button>
        </div>
      )}
    </div>
  )

  function getTestIcon(testType: string): string {
    const icons: Record<string, string> = {
      "reaction-time": "⚡",
      "f1-lights": "🏎️",
      "sound-reaction": "🔊",
      "choice-reaction": "🔢",
      "go-no-go": "🛡️",
      "click-speed": "🖱️",
      "sequence-memory": "🗂️",
      "number-memory": "🔢",
      "aim-trainer": "🎯",
      "visual-pattern": "🧩",
      stroop: "🎨",
      "trail-making": "🧭",
      "typing-speed": "⌨️",
      "aim-coordination": "🎯",
      "pattern-reasoning": "🧠",
      "decision-speed": "⚖️",
      planning: "📋",
      prioritization: "📊",
      gauntlet: "🏆",
      "tmt-partA": "🔵",
      "tmt-partB": "🔴",
      "focus-challenge": "🎯",
      "verbal-memory": "💬",
      "spatial-orientation": "🧭",
      "mouse-accuracy": "🖱️",
      "flick-trainer": "👆",
    }
    return icons[testType] || "📊"
  }

  function exportToCSV() {
    const headers = ["Test ID", "Category", "Score", "Percentile", "Date"]
    const rows = filteredSessions.map((s) => [
      s.testId,
      s.category,
      s.rawScore,
      s.percentile || "",
      new Date(s.timestamp).toISOString(),
    ])

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cogniarena-history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}
