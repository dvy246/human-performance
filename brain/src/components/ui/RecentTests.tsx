import React, { useState, useEffect } from "react"
import { dataLayer } from "@/runtime/dataLayer"

const TEST_SLUGS: Record<string, string> = {
  "tmt-partA": "trail-making",
  "tmt-partB": "trail-making",
}

interface RecentTest {
  testId: string
  timestamp: number
  rawScore: number
}

export default function RecentTests() {
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])

  useEffect(() => {
    loadRecentTests()
  }, [])

  const loadRecentTests = async () => {
    try {
      const history = await dataLayer.getHistory()
      const recent = history.slice(0, 5).map((h) => ({
        testId: h.testId,
        timestamp: h.timestamp,
        rawScore: h.rawScore,
      }))
      setRecentTests(recent)
    } catch (err) {
      console.error("Failed to load recent tests:", err)
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (recentTests.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted">
        No recent tests yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="mb-1 px-2 font-mono text-[10px] font-semibold tracking-widest text-muted uppercase">
        Recent Tests
      </span>
      {recentTests.map((test, idx) => (
        <a
          key={idx}
          href={`/tests/${TEST_SLUGS[test.testId] || test.testId}`}
          className="transition-standard group flex items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-subtle"
        >
          <span className="truncate text-muted group-hover:text-foreground">
            {test.testId}
          </span>
          <span className="ml-2 shrink-0 font-mono text-[10px] text-muted">
            {formatTime(test.timestamp)}
          </span>
        </a>
      ))}
      <a
        href="/history"
        className="mt-2 text-center font-mono text-[10px] text-accent hover:underline"
      >
        View all history →
      </a>
    </div>
  )
}
