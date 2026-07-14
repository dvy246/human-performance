import React, { useState, useEffect } from "react"
import { dataLayer, type SessionRecord } from "../../runtime/dataLayer"
import { formatTopPercentile } from "../../runtime/percentileLookup"
import {
  computeCategoryAverages,
  calculateBbiScore,
  getRadarCoordinates,
  type CognitiveAverages,
} from "../../runtime/skillRadar"
import {
  determinePersona,
  generateDailyChallengeForDay,
  getAdaptiveRecommendations,
  type DailyChallenge,
} from "../../runtime/trainingEngine"
import TestSummaryGrid from "./TestSummaryGrid"
import MultiTrendChart from "./MultiTrendChart"
import PersonalRecords from "./PersonalRecords"

interface DiagnosticInfo {
  hz: number
  deviceType: "Mobile" | "Tablet" | "Desktop"
  inputMethod: "Touch" | "Mouse/Keyboard"
  browser: string
  os: string
}

const TEST_NAMES: Record<string, string> = {
  "reaction-time": "Visual Reaction Test",
  "f1-lights": "F1 Start Lights",
  "go-no-go": "Color Go/No-Go",
  "choice-reaction": "Choice Grid",
  "sound-reaction": "Sound Reflex Test",
  "click-speed": "Click Speed (CPS)",
  "aim-trainer": "Aim Precision",
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
}

const ACHIEVEMENTS_LIST = [
  {
    id: "speed_demon",
    title: "Speed Demon",
    desc: "Visual Reaction time under 200 ms",
    badge: "⚡",
  },
  {
    id: "sound_reflex",
    title: "Sound Reflex",
    desc: "Sound Reaction time under 180 ms",
    badge: "🔊",
  },
  {
    id: "f1_champion",
    title: "F1 Champion",
    desc: "F1 Start Lights reaction under 200 ms",
    badge: "🏎️",
  },
  {
    id: "choice_master",
    title: "Choice Master",
    desc: "Choice Grid latency under 380 ms",
    badge: "🧠",
  },
  {
    id: "focus_guardian",
    title: "Focus Guardian",
    desc: "Go/No-Go completed with 0 False Alarms",
    badge: "🛡️",
  },
  {
    id: "click_speedster",
    title: "Click Speedster",
    desc: "Click Speed of 10.0+ CPS achieved",
    badge: "🖱️",
  },
  {
    id: "sniper_precision",
    title: "Sniper Precision",
    desc: "Aim Trainer with 95%+ Accuracy achieved",
    badge: "🎯",
  },
  {
    id: "memory_matrix",
    title: "Memory Matrix",
    desc: "Sequence Memory Level 8+ reached",
    badge: "🗂️",
  },
  {
    id: "number_wizard",
    title: "Number Wizard",
    desc: "Recall a 10-digit sequence or higher",
    badge: "🔢",
  },
  {
    id: "visual_genius",
    title: "Visual Genius",
    desc: "Reach Level 10 or higher in Visual Pattern Memory",
    badge: "🧩",
  },
  {
    id: "stroop_master",
    title: "Stroop Master",
    desc: "Stroop color clash average under 750 ms",
    badge: "🎨",
  },
  {
    id: "pattern_detective",
    title: "Pattern Detective",
    desc: "Achieve 7,500+ Pts in Pattern Reasoning",
    badge: "🔮",
  },
  {
    id: "trail_blazer",
    title: "Trail Blazer",
    desc: "Complete Trail Making Part B under 45 seconds",
    badge: "🧭",
  },
  {
    id: "quantum_memory",
    title: "Quantum Memory",
    desc: "Achieve 4,500+ Pts in Dual N-Back",
    badge: "🧠",
  },
  {
    id: "streak_consistency",
    title: "Daily Consistency",
    desc: "Maintain a 3+ Day active streak",
    badge: "🔥",
  },
  {
    id: "full_spectrum",
    title: "Full Spectrum",
    desc: "Try at least 5 different assessments",
    badge: "🌈",
  },
  {
    id: "focus_challenge",
    title: "Brain Rot Survivor",
    desc: "Complete all 5 stages of the Focus Challenge",
    badge: "🧠",
  },
  {
    id: "gauntlet_champion",
    title: "The Gauntlet Champion",
    desc: "Achieve CAI 80+ in The Gauntlet",
    badge: "🏆",
  },
  {
    id: "verbal_legend",
    title: "Verbal Legend",
    desc: "Recall 8+ words in Verbal Memory Test",
    badge: "📝",
  },
  {
    id: "spatial_master",
    title: "Spatial Master",
    desc: "Score 80%+ in Spatial Orientation Test",
    badge: "🔄",
  },
  {
    id: "surgical_aim",
    title: "Surgical Aim",
    desc: "Average offset under 10px in Mouse Accuracy",
    badge: "🎯",
  },
  {
    id: "flick_pro",
    title: "Flick Pro",
    desc: "90%+ accuracy in Flick Trainer",
    badge: "⚡",
  },
  {
    id: "lightning_decisions",
    title: "Lightning Decisions",
    desc: "90%+ accuracy in Decision Speed Test",
    badge: "⚡",
  },
  {
    id: "grandmaster_planner",
    title: "Grandmaster Planner",
    desc: "Complete Planning Test in 15 moves",
    badge: "♟️",
  },
  {
    id: "priority_ace",
    title: "Priority Ace",
    desc: "Score 300+ total points in Prioritization Test",
    badge: "📊",
  },
]

export default function CognitiveProfile() {
  const [history, setHistory] = useState<SessionRecord[]>([])
  const [streak, setStreak] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [averages, setAverages] = useState<CognitiveAverages | null>(null)
  const [bbiScore, setBbiScore] = useState<number | null>(null)
  const [persona, setPersona] = useState<{
    title: string
    desc: string
    explanation: string
  } | null>(null)
  const [graphTestId, setGraphTestId] = useState<string>("reaction-time")
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null)
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(
    null
  )
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false)
  const [historyPeriod, setHistoryPeriod] = useState<
    "all" | "30d" | "7d" | "today"
  >("all")
  const [activeTab, setActiveTab] = useState<
    "overview" | "records" | "trends" | "history"
  >("overview")

  const isProfileEmpty = history.length === 0

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const records = await dataLayer.getHistory()
        if (!mounted) return
        setHistory(records)

        const streakInfo = dataLayer.getStreak()
        if (!mounted) return
        setStreak(streakInfo.streakCount)

        detectDiagnostics()

        const day = new Date().getDate()
        const challenge = generateDailyChallengeForDay(day)
        if (!mounted) return
        setDailyChallenge(challenge)

        if (records.length > 0) {
          const computedAverages = computeCategoryAverages(records)
          if (!mounted) return
          setAverages(computedAverages)

          if (!mounted) return
          setBbiScore(calculateBbiScore(computedAverages))
          if (!mounted) return
          setPersona(determinePersona(computedAverages))

          const startOfToday = new Date().setHours(0, 0, 0, 0)
          const todayAttempts = records.filter(
            (r) => r.testId === challenge.testId && r.timestamp >= startOfToday
          )
          const metGoal = todayAttempts.some((r) => {
            return challenge.condition === "lower"
              ? r.rawScore <= challenge.target
              : r.rawScore >= challenge.target
          })
          if (!mounted) return
          setChallengeCompleted(metGoal)
        }
      } catch (err) {
        console.error("Failed to load profile dashboard:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const detectDiagnostics = () => {
    if (typeof window === "undefined") return

    let hz = 60
    let lastTime = performance.now()
    let frameCount = 0
    const checkFrame = () => {
      const now = performance.now()
      frameCount++
      if (now - lastTime >= 500) {
        hz = Math.round((frameCount * 1000) / (now - lastTime))
        setDiagnostics((prev) => (prev ? { ...prev, hz } : null))
      } else {
        requestAnimationFrame(checkFrame)
      }
    }
    requestAnimationFrame(checkFrame)

    const ua = navigator.userAgent
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0

    let deviceType: "Mobile" | "Tablet" | "Desktop" = "Desktop"
    if (isMobile) {
      deviceType = window.innerWidth > 768 ? "Tablet" : "Mobile"
    }

    let browser = "Unknown Browser"
    if (ua.indexOf("Chrome") > -1) browser = "Chrome"
    else if (ua.indexOf("Safari") > -1) browser = "Safari"
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox"
    else if (ua.indexOf("Edg") > -1) browser = "Edge"

    let os = "Unknown OS"
    if (ua.indexOf("Windows") > -1) os = "Windows"
    else if (ua.indexOf("Macintosh") > -1) os = "macOS"
    else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS"
    else if (ua.indexOf("Android") > -1) os = "Android"

    setDiagnostics({
      hz: 60,
      deviceType,
      inputMethod: hasTouch ? "Touch" : "Mouse/Keyboard",
      browser,
      os,
    })
  }

  const checkAchievement = (id: string): boolean => {
    if (history.length === 0) return false
    switch (id) {
      case "speed_demon":
        return history.some(
          (r) => r.testId === "reaction-time" && r.rawScore < 200
        )
      case "sound_reflex":
        return history.some(
          (r) => r.testId === "sound-reaction" && r.rawScore < 180
        )
      case "f1_champion":
        return history.some((r) => r.testId === "f1-lights" && r.rawScore < 200)
      case "choice_master":
        return history.some(
          (r) => r.testId === "choice-reaction" && r.rawScore < 380
        )
      case "focus_guardian":
        return history.some(
          (r) => r.testId === "go-no-go" && r.metadata?.falseAlarms === 0
        )
      case "click_speedster":
        return history.some(
          (r) => r.testId === "click-speed" && r.rawScore >= 100
        )
      case "sniper_precision":
        return history.some(
          (r) => r.testId === "aim-trainer" && r.metadata?.accuracy >= 95
        )
      case "memory_matrix":
        return history.some(
          (r) => r.testId === "sequence-memory" && r.rawScore >= 8
        )
      case "number_wizard":
        return history.some(
          (r) => r.testId === "number-memory" && r.rawScore >= 10
        )
      case "visual_genius":
        return history.some(
          (r) => r.testId === "visual-pattern" && r.rawScore >= 10
        )
      case "stroop_master":
        return history.some((r) => r.testId === "stroop" && r.rawScore < 750)
      case "pattern_detective":
        return history.some(
          (r) => r.testId === "pattern-reasoning" && r.rawScore >= 7500
        )
      case "trail_blazer":
        return history.some(
          (r) => r.testId === "tmt-partB" && r.rawScore < 45000
        )
      case "quantum_memory":
        return history.some(
          (r) => r.testId === "dual-n-back" && r.rawScore >= 4500
        )
      case "streak_consistency":
        return streak >= 3
      case "full_spectrum":
        const uniquePlayed = new Set(history.map((r) => r.testId))
        return uniquePlayed.size >= 5
      case "focus_challenge":
        return history.some(
          (r) => r.testId === "focus-challenge" && r.rawScore >= 60
        )
      case "gauntlet_champion":
        return history.some((r) => r.testId === "gauntlet" && r.rawScore >= 80)
      case "verbal_legend":
        return history.some(
          (r) => r.testId === "verbal-memory" && r.rawScore >= 8
        )
      case "spatial_master":
        return history.some(
          (r) => r.testId === "spatial-orientation" && r.rawScore >= 80
        )
      case "surgical_aim":
        return history.some(
          (r) => r.testId === "mouse-accuracy" && r.metadata?.avgOffsetPx < 10
        )
      case "flick_pro":
        return history.some(
          (r) => r.testId === "flick-trainer" && r.metadata?.accuracy >= 90
        )
      case "lightning_decisions":
        return history.some(
          (r) => r.testId === "decision-speed" && r.metadata?.accuracy >= 90
        )
      case "grandmaster_planner":
        return history.some(
          (r) =>
            r.testId === "planning" &&
            r.metadata != null &&
            typeof r.metadata.moves === "number" &&
            typeof r.metadata.optimalMoves === "number" &&
            r.metadata.moves === r.metadata.optimalMoves
        )
      case "priority_ace":
        return history.some(
          (r) => r.testId === "prioritization" && r.metadata?.totalPoints >= 300
        )
      default:
        return false
    }
  }

  const getUnlockedAchievementsCount = (): number => {
    return ACHIEVEMENTS_LIST.filter((a) => checkAchievement(a.id)).length
  }

  const getRecommendations = () => {
    if (!averages) return []
    return getAdaptiveRecommendations(averages)
  }

  const exportHistoryToCSV = () => {
    if (history.length === 0) return

    const headers = [
      "ID",
      "Test ID",
      "Category",
      "Timestamp",
      "Raw Score",
      "Percentile",
      "Synced",
    ]
    const rows = history.map((r) => [
      r.id,
      r.testId,
      r.category,
      new Date(r.timestamp).toISOString(),
      r.rawScore,
      r.percentile,
      r.synced ? "true" : "false",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `cogniarena_profile_ledger_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetStats = () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL local stats? This action cannot be undone."
      )
    ) {
      const request = indexedDB.deleteDatabase("CogniArenaDB")
      request.onsuccess = () => window.location.reload()
      request.onerror = () => window.location.reload()
    }
  }

  const cx = 100
  const cy = 100
  const r = 70
  const radarAngles = [
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI / 3,
    -Math.PI / 2 + (2 * Math.PI) / 3,
    -Math.PI / 2 + Math.PI,
    -Math.PI / 2 + (4 * Math.PI) / 3,
    -Math.PI / 2 + (5 * Math.PI) / 3,
  ]

  const getPointsStr = () => {
    if (!averages) return ""
    return getRadarCoordinates(averages, cx, r)
  }

  const getHexPoints = (radius: number) => {
    return radarAngles
      .map((angle) => {
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        return `${x},${y}`
      })
      .join(" ")
  }

  const getTrendDataPoints = (
    testId: string
  ): { x: number; y: number; val: number; date: string }[] => {
    const testRecords = [...history]
      .filter((r) => r.testId === testId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)

    if (testRecords.length === 0) return []

    const scores = testRecords.map((r) => {
      return r.rawScore
    })
    const maxScore = scores.reduce((a, b) => Math.max(a, b), 1)
    const minScore = scores.reduce((a, b) => Math.min(a, b), 0)
    const range = maxScore - minScore || 1

    const width = 240
    const height = 100
    const padding = 15

    return testRecords.map((rec, idx) => {
      const rawVal = rec.rawScore
      const x =
        padding +
        (idx / Math.max(1, testRecords.length - 1)) * (width - padding * 2)

      const isTimeMetric =
        rec.testId !== "click-speed" &&
        rec.testId !== "sequence-memory" &&
        rec.testId !== "number-memory" &&
        rec.testId !== "visual-pattern"
      const normVal = (rawVal - minScore) / range
      const y = isTimeMetric
        ? padding + normVal * (height - padding * 2)
        : height - padding - normVal * (height - padding * 2)

      return {
        x,
        y,
        val: rawVal,
        date: new Date(rec.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }
    })
  }

  const trendPoints = getTrendDataPoints(graphTestId)

  const formatScore = (testId: string, score: number) => {
    if (testId === "click-speed") return `${score.toFixed(1)} CPS`
    if (testId === "sequence-memory" || testId === "visual-pattern")
      return `Level ${score}`
    if (testId === "number-memory") return `${score} Digits`
    return `${score} ms`
  }

  if (isProfileEmpty) {
    return (
      <div className="flex w-full flex-col gap-10">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 rounded-xl border border-card-border bg-card p-8 py-16 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/15 bg-accent/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
              Cognitive Profile Locked
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Complete at least one assessment test to unlock your Dashboard,
              Daily Streaks, and Skill Radar metrics.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/tests/reaction-time"
              className="transition-standard flex h-11 items-center rounded bg-accent px-6 font-mono text-xs font-semibold text-white uppercase shadow hover:bg-accent-hover active:scale-98"
            >
              Launch First Assessment
            </a>
            <a
              href="/"
              className="transition-standard flex h-11 items-center rounded border border-card-border bg-subtle px-6 font-mono text-xs font-semibold text-foreground uppercase hover:bg-hover active:scale-98"
            >
              Browse All Assessments
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Top Bar: Stat Cards + Reset Button */}
      <div className="flex items-start gap-4">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-card-border bg-card p-5 shadow">
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
              CogniArena Index (CAI)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-foreground">
                {bbiScore !== null && bbiScore !== undefined ? bbiScore : "--"}
              </span>
              <span className="font-mono text-xs text-muted">/ 1000</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full border border-card-border/60 bg-subtle">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(bbiScore || 0) / 10}%` }}
              ></div>
            </div>
            <span className="mt-2 font-mono text-[9px] text-muted uppercase">
              Aggregated percentile indicator
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-card-border bg-card p-5 shadow">
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
              Active Streak
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold text-foreground">
                {streak}
              </span>
              <span className="font-mono text-xs text-muted">Days</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
              <span className="animate-pulse text-warning">🔥</span>
              <span>Complete 1 test daily to maintain</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-card-border bg-card p-5 shadow">
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
              Completed Runs
            </span>
            <div className="mt-2 flex items-baseline">
              <span className="font-mono text-3xl font-bold text-accent">
                {history.length}
              </span>
            </div>
            <button
              onClick={exportHistoryToCSV}
              className="mt-3 flex cursor-pointer items-center gap-1 border-0 bg-transparent font-mono text-[10px] text-muted transition-colors outline-none hover:text-accent active:scale-95"
            >
              <span>📥 Export CSV</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-card-border bg-card p-5 shadow">
            <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
              Cognitive Persona
            </span>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className="text-lg leading-snug font-bold text-foreground">
                {persona?.title || "Adaptive Learner"}
              </span>
              <span className="text-[10px] text-muted italic">
                {persona?.desc || "Balanced Cognitive Profile"}
              </span>
            </div>
            <span className="mt-3 font-mono text-[9px] text-muted uppercase">
              Derived from strongest scores
            </span>
          </div>
        </div>

        <button
          onClick={handleResetStats}
          className="transition-standard shrink-0 cursor-pointer rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 font-mono text-[10px] tracking-wider text-red-400 uppercase hover:bg-red-500/15 active:scale-95"
          title="Delete all local data and reset"
        >
          Reset All
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm">
        <span className="text-lg leading-none select-none">⚠️</span>
        <div>
          <strong className="font-semibold text-foreground">
            Disclaimer & Scope Note:
          </strong>{" "}
          CogniArena is an educational self-tracking and cognitive training
          platform. All index scores (CAI), comparative percentiles,
          occupational rankings, and cognitive personas represent simulated
          performance benchmarks. They are not medical, clinical, diagnostic, or
          neuropsychological evaluations. If you have concerns about your
          cognitive function, memory, focus, or reflexes, please consult a
          licensed medical professional. Read our full{" "}
          <a href="/terms" className="font-medium text-accent hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/methodology"
            className="font-medium text-accent hover:underline"
          >
            Methodology
          </a>
          .
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 overflow-x-auto border-b border-card-border/60 pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`cursor-pointer border-b-2 pb-2.5 font-mono text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === "overview"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Overview &amp; Radar
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`cursor-pointer border-b-2 pb-2.5 font-mono text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === "records"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Personal Best Records
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`cursor-pointer border-b-2 pb-2.5 font-mono text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === "trends"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Performance Trends
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`cursor-pointer border-b-2 pb-2.5 font-mono text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === "history"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Activity Log
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Skill Radar + Daily Challenge side by side */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="relative flex flex-col items-center overflow-hidden rounded-xl border border-card-border bg-card p-6 shadow-lg lg:col-span-7">
              <span className="absolute top-4 left-4 font-mono text-[10px] tracking-widest text-muted uppercase">
                Skill Radar
              </span>

              <div className="mt-4 h-64 w-64">
                <svg
                  viewBox="-15 0 230 200"
                  className="h-full w-full select-none"
                >
                  <polygon
                    points={getHexPoints(r)}
                    fill="none"
                    stroke="var(--color-card-border)"
                    strokeWidth="1"
                  />
                  <polygon
                    points={getHexPoints(r * 0.75)}
                    fill="none"
                    stroke="var(--color-card-border)"
                    strokeWidth="1"
                    strokeDasharray="1,2"
                  />
                  <polygon
                    points={getHexPoints(r * 0.5)}
                    fill="none"
                    stroke="var(--color-card-border)"
                    strokeWidth="1"
                    strokeDasharray="1,2"
                  />
                  <polygon
                    points={getHexPoints(r * 0.25)}
                    fill="none"
                    stroke="var(--color-card-border)"
                    strokeWidth="1"
                    strokeDasharray="1,2"
                  />

                  {radarAngles.map((angle, idx) => {
                    const x = cx + r * Math.cos(angle)
                    const y = cy + r * Math.sin(angle)
                    return (
                      <line
                        key={idx}
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke="var(--color-card-border)"
                        strokeWidth="1"
                      />
                    )
                  })}

                  {averages && (
                    <polygon
                      points={getPointsStr()}
                      fill="var(--chart-accent-light)"
                      stroke="var(--chart-accent)"
                      strokeWidth="2"
                    />
                  )}

                  <text
                    x="100"
                    y="16"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    REACTION
                  </text>
                  <text
                    x="175"
                    y="70"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="start"
                    fontWeight="bold"
                  >
                    MEMORY
                  </text>
                  <text
                    x="155"
                    y="162"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="start"
                    fontWeight="bold"
                  >
                    PROCESSING
                  </text>
                  <text
                    x="100"
                    y="192"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    PRECISION
                  </text>
                  <text
                    x="45"
                    y="162"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    FOCUS
                  </text>
                  <text
                    x="25"
                    y="70"
                    fill="var(--color-foreground)"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    STAMINA
                  </text>
                </svg>
              </div>

              {averages && (
                <div className="mt-6 flex w-full flex-col gap-3.5 border-t border-card-border/60 pt-5">
                  {[
                    { label: "Reaction Speed", score: averages.reaction },
                    { label: "Memory Capacity", score: averages.memory },
                    { label: "Processing Speed", score: averages.processing },
                    { label: "Precision & Control", score: averages.precision },
                    { label: "Focus & Attention", score: averages.focus },
                    { label: "Cognitive Stamina", score: averages.stamina },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between font-mono text-muted">
                        <span>{item.label}</span>
                        <span className="font-bold text-foreground">
                          {item.score}%ile
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded border border-card-border/60 bg-subtle">
                        <div
                          className="h-full rounded bg-accent"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {persona && (
                <p className="mt-4 border-t border-card-border/60 pt-4 text-center text-[11px] leading-relaxed text-muted">
                  <strong>Persona Detail:</strong> {persona.explanation}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5">
              {dailyChallenge && (
                <div
                  className={`flex flex-col items-start justify-between gap-4 rounded-xl border p-5 shadow md:flex-row md:items-center ${
                    challengeCompleted
                      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-success"
                      : "border-card-border bg-card"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tracking-widest text-muted uppercase">
                        Daily Challenge
                      </span>
                      {challengeCompleted && (
                        <span className="rounded border border-[var(--success-border)] bg-[var(--success-bg)] px-1.5 py-0.5 font-mono text-[10px] text-success">
                          ✓ COMPLETED
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {dailyChallenge.name} Challenge
                    </h4>
                    <p className="text-xs leading-normal text-muted">
                      {dailyChallenge.desc}
                    </p>
                  </div>
                  {!challengeCompleted && (
                    <a
                      href={`/tests/${dailyChallenge.testId}`}
                      className="transition-standard shrink-0 rounded bg-accent px-4 py-2 font-mono text-xs font-semibold text-white uppercase hover:bg-accent-hover"
                    >
                      Play Challenge
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-5 shadow">
                <span className="font-mono text-xs tracking-widest text-muted uppercase">
                  Adaptive Recommendations
                </span>
                <div className="flex flex-col gap-3">
                  {getRecommendations().map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-card-border/40 py-2 text-xs last:border-0"
                    >
                      <span className="text-muted dark:text-muted">
                        {rec.text}
                      </span>
                      <a
                        href={rec.link}
                        className="ml-3 shrink-0 font-mono text-[10px] text-accent uppercase hover:underline"
                      >
                        Train Now &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">
                Achievements ({getUnlockedAchievementsCount()}/
                {ACHIEVEMENTS_LIST.length})
              </span>
              <div className="h-px flex-1 bg-card-border/40"></div>
            </div>
            <div className="flex flex-col gap-6 rounded-xl border border-card-border bg-card p-6 shadow-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = checkAchievement(ach.id)
                  return (
                    <div
                      key={ach.id}
                      className={`transition-standard flex items-center gap-4 rounded-lg border p-4 ${
                        unlocked
                          ? "border-accent/25 bg-accent/5"
                          : "border-card-border bg-subtle/50 opacity-50"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-subtle text-2xl">
                        {ach.badge}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`text-sm font-bold ${unlocked ? "font-semibold text-foreground" : "text-muted"}`}
                        >
                          {ach.title}
                        </span>
                        <span className="text-[11px] text-muted">
                          {ach.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "records" && (
        <div className="animate-fade-in flex flex-col gap-8">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">
                Personal Bests
              </span>
              <div className="h-px flex-1 bg-card-border/40"></div>
            </div>
            <PersonalRecords />
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">
                All Test Metrics
              </span>
              <div className="h-px flex-1 bg-card-border/40"></div>
            </div>
            <TestSummaryGrid />
          </section>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="animate-fade-in flex flex-col gap-8">
          {/* Trend Overview */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">
                Performance Trends
              </span>
              <div className="h-px flex-1 bg-card-border/40"></div>
            </div>
            <MultiTrendChart />
          </section>

          {/* Per-Test Timeline */}
          <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-5 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">
                Per-Test Timeline
              </span>
              <select
                value={graphTestId}
                onChange={(e) => setGraphTestId(e.target.value)}
                className="rounded border border-card-border bg-subtle px-2.5 py-1 font-mono text-xs text-foreground outline-none"
              >
                {Object.keys(TEST_NAMES).map((k) => (
                  <option key={k} value={k}>
                    {TEST_NAMES[k]}
                  </option>
                ))}
              </select>
            </div>

            {trendPoints.length >= 2 ? (
              <div className="mt-2 w-full">
                <svg
                  viewBox="0 0 240 100"
                  className="h-28 w-full overflow-visible"
                >
                  <line
                    x1="15"
                    y1="15"
                    x2="225"
                    y2="15"
                    stroke="var(--color-card-border)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                  <line
                    x1="15"
                    y1="50"
                    x2="225"
                    y2="50"
                    stroke="var(--color-card-border)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                  <line
                    x1="15"
                    y1="85"
                    x2="225"
                    y2="85"
                    stroke="var(--color-card-border)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />

                  <path
                    d={`M ${trendPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
                    fill="none"
                    stroke="var(--chart-accent)"
                    strokeWidth="2"
                  />

                  {trendPoints.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="var(--bg-card)"
                        stroke="var(--chart-accent)"
                        strokeWidth="1.5"
                      />
                      <title>{`${pt.val} (${pt.date})`}</title>
                    </g>
                  ))}
                </svg>
                <div className="mt-2 flex items-center justify-between px-3 font-mono text-[10px] text-muted">
                  <span>First recorded</span>
                  <span>Latest attempt</span>
                </div>
              </div>
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded border border-dashed border-card-border/60 font-mono text-[11px] text-muted">
                Need at least 2 attempts of this test to draw trendline.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="font-mono text-xs tracking-widest text-muted uppercase">
              Test History
            </span>
            <div className="h-px flex-1 bg-card-border/40"></div>
          </div>
          <div className="flex flex-col gap-6 rounded-xl border border-card-border bg-card p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wider text-foreground uppercase">
                  Assessment Ledger
                </h3>
                <p className="mt-0.5 text-xs text-secondary">
                  Filter and analyze your historical performance trendlines.
                </p>
              </div>

              <div className="flex rounded border border-card-border bg-subtle p-0.5">
                {(["all", "30d", "7d", "today"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setHistoryPeriod(period)}
                    className={`cursor-pointer rounded px-3 py-1 font-mono text-[10px] tracking-wider uppercase transition-colors ${
                      historyPeriod === period
                        ? "bg-accent font-semibold text-white shadow"
                        : "text-muted hover:text-foreground dark:text-secondary dark:hover:text-foreground"
                    }`}
                  >
                    {period === "all" ? "Lifetime" : period}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filteredHistory = history.filter((r) => {
                if (historyPeriod === "all") return true
                const now = Date.now()
                const age = now - r.timestamp
                if (historyPeriod === "30d")
                  return age <= 30 * 24 * 60 * 60 * 1000
                if (historyPeriod === "7d")
                  return age <= 7 * 24 * 60 * 60 * 1000
                if (historyPeriod === "today") {
                  const startOfToday = new Date().setHours(0, 0, 0, 0)
                  return r.timestamp >= startOfToday
                }
                return true
              })

              const avgPercentile =
                filteredHistory.length > 0
                  ? Math.round(
                      filteredHistory.reduce(
                        (sum, r) => sum + r.percentile,
                        0
                      ) / filteredHistory.length
                    )
                  : null

              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col rounded-lg border border-card-border/60 bg-subtle p-4">
                      <span className="mb-1 font-mono text-[9px] tracking-widest text-muted uppercase">
                        Period Attempts
                      </span>
                      <span className="font-mono text-xl font-bold text-foreground">
                        {filteredHistory.length}
                      </span>
                    </div>
                    <div className="flex flex-col rounded-lg border border-card-border/60 bg-subtle p-4">
                      <span className="mb-1 font-mono text-[9px] tracking-widest text-muted uppercase">
                        Avg Percentile
                      </span>
                      <span className="font-mono text-xl font-bold text-accent">
                        {avgPercentile !== null
                          ? `Top ${100 - avgPercentile}%`
                          : "--"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-card-border font-mono text-muted">
                          <th className="py-2.5 font-medium">Test Dimension</th>
                          <th className="py-2.5 font-medium">Recorded Score</th>
                          <th className="py-2.5 text-right font-medium">
                            Percentile
                          </th>
                          <th className="py-2.5 pr-2 text-right font-medium">
                            Sync
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/40 font-mono">
                        {filteredHistory.map((row) => (
                          <tr
                            key={row.id}
                            className="text-foreground hover:bg-subtle/50 dark:text-muted"
                          >
                            <td className="flex flex-col py-3 font-sans font-medium text-foreground">
                              <span>
                                {TEST_NAMES[row.testId] || row.testId}
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                {new Date(row.timestamp).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-foreground">
                              {formatScore(row.testId, row.rawScore)}
                            </td>
                            <td className="py-3 text-right font-bold text-accent">
                              {formatTopPercentile(row.percentile, row.testId)}
                            </td>
                            <td className="py-3 pr-2 text-right">
                              {row.synced ? (
                                <span
                                  className="text-success"
                                  title="Edge Backup Active"
                                >
                                  ✓
                                </span>
                              ) : (
                                <span
                                  className="text-muted"
                                  title="Local Cache Only"
                                >
                                  ◷
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
        </section>
      )}

      {/* Diagnostics (collapsible) */}
      <details className="group rounded-xl border border-card-border bg-card p-5 shadow">
        <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-xs tracking-widest text-muted uppercase">
          <span>Hardware & Browser Diagnostics</span>
          <span className="text-[10px] text-accent group-open:hidden">
            Show details
          </span>
          <span className="hidden text-[10px] text-accent group-open:inline">
            Hide details
          </span>
        </summary>
        <div className="mt-5 grid grid-cols-1 gap-6 font-mono text-xs md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-card-border/30 pb-2">
              <span className="text-muted">Monitor Refresh Rate</span>
              <span className="font-bold text-foreground">
                {diagnostics?.hz ? `${diagnostics.hz}Hz` : "Detecting..."}
              </span>
            </div>
            <div className="flex justify-between border-b border-card-border/30 pb-2">
              <span className="text-muted">Device Platform</span>
              <span className="font-bold text-foreground">
                {diagnostics?.deviceType || "Detecting..."}
              </span>
            </div>
            <div className="flex justify-between border-b border-card-border/30 pb-2">
              <span className="text-muted">Input Mode Interface</span>
              <span className="font-bold text-foreground">
                {diagnostics?.inputMethod || "Detecting..."}
              </span>
            </div>
            <div className="flex justify-between border-b border-card-border/30 pb-2">
              <span className="text-muted">Browser Agent</span>
              <span className="font-bold text-foreground">
                {diagnostics?.browser || "Detecting..."}
              </span>
            </div>
            <div className="flex justify-between border-b border-card-border/30 pb-2">
              <span className="text-muted">Operating System</span>
              <span className="font-bold text-foreground">
                {diagnostics?.os || "Detecting..."}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <h4 className="mb-1 text-xs font-bold tracking-wider text-foreground uppercase">
              Calibration Alerts
            </h4>
            {diagnostics?.hz && diagnostics.hz < 60 && (
              <div className="bg-warning-bg border-warning-border rounded border p-3 text-[11px] leading-normal text-secondary">
                ⚠️ <strong>Refresh Rate Alert:</strong> Under 60Hz screen
                refresh detected. Browser paint sync lag may introduce an
                artificial +16.7ms delay to visually clocked assessments.
              </div>
            )}
            {diagnostics?.inputMethod === "Touch" && (
              <div className="bg-warning-bg border-warning-border rounded border p-3 text-[11px] leading-normal text-secondary">
                ⚠️ <strong>Touch Latency Warning:</strong> Touch digitizers add
                between 20ms and 50ms of physical processing delay. For optimal
                scores, execute reaction tests with a physical mouse or
                keyboard.
              </div>
            )}
            {diagnostics?.hz &&
              diagnostics.hz >= 60 &&
              diagnostics.inputMethod !== "Touch" && (
                <div className="bg-success-bg border-success-border rounded border p-3 text-[11px] leading-normal text-secondary">
                  ✓ <strong>Telemetry Calibrated:</strong> Hardware refresh and
                  mouse input methods are optimal. Visual and mechanical click
                  delays are minimized.
                </div>
              )}
          </div>
        </div>
      </details>

      {/* Danger Zone — Reset */}
      <div className="flex justify-end">
        <button
          onClick={handleResetStats}
          className="transition-standard cursor-pointer rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 font-mono text-[10px] tracking-wider text-red-400 uppercase hover:bg-red-500/15 active:scale-95"
        >
          Reset All Local Stats
        </button>
      </div>
    </div>
  )
}
