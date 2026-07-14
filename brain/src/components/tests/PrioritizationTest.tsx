import { useState, useRef, useEffect } from "react"
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

interface Task {
  id: number
  name: string
  deadline: number
  points: number
  effort: number
}

const ROUNDS = 5

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateTasks(): Task[] {
  const pools = [
    { name: "Fix login bug", points: 50, effort: 2 },
    { name: "Write tests", points: 40, effort: 3 },
    { name: "Review PR", points: 30, effort: 1 },
    { name: "Update docs", points: 20, effort: 2 },
    { name: "Refactor module", points: 60, effort: 4 },
    { name: "Deploy hotfix", points: 80, effort: 1 },
    { name: "Design mockup", points: 35, effort: 3 },
    { name: "Optimize query", points: 55, effort: 3 },
    { name: "Fix CSS bug", points: 25, effort: 1 },
    { name: "Code review", points: 30, effort: 2 },
  ]
  return fisherYatesShuffle(pools)
    .slice(0, 5)
    .map((t, i) => ({
      ...t,
      id: i,
      deadline: (i + 1) * 3 + Math.floor(Math.random() * 3),
    }))
}

function PrioritizationTest() {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro")
  const [round, setRound] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completed, setCompleted] = useState<number[]>([])
  const [usedTime, setUsedTime] = useState(0)
  const [results, setResults] = useState<
    { points: number; deadline: number }[]
  >([])
  const [shareImage, setShareImage] = useState<string | null>(null)
  const timeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const completedRef = useRef<number[]>([])
  const tasksRef = useRef<Task[]>([])
  const resultsRef = useRef<{ points: number; deadline: number }[]>([])
  const roundRef = useRef(0)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)
  const roundCount = useRef<number>(ROUNDS)
  const roundTime = useRef<number>(10)

  useBeforeUnload(phase !== "intro" && phase !== "done")
  useVisibilityGuard(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase("intro")
  }, phase === "playing")

  const totalTime = roundTime.current

  const startRound = () => {
    const t = generateTasks()
    setTasks(t)
    tasksRef.current = t
    setCompleted([])
    completedRef.current = []
    setUsedTime(0)
    timeRef.current = 0
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      timeRef.current += 1
      setUsedTime(timeRef.current)
      if (timeRef.current >= totalTime)
        endRound(tasksRef.current, [...completedRef.current])
    }, 1000)
  }

  const doTask = (task: Task) => {
    if (
      completedRef.current.includes(task.id) ||
      timeRef.current + task.effort > totalTime
    )
      return
    const newCompleted = [...completedRef.current, task.id]
    completedRef.current = newCompleted
    setCompleted(newCompleted)
    timeRef.current += task.effort
    setUsedTime(timeRef.current)
    if (timeRef.current >= totalTime) endRound(tasksRef.current, newCompleted)
  }

  const endRound = (currentTasks: Task[], done: number[]) => {
    if (timerRef.current) clearInterval(timerRef.current)
    let points = 0
    done.forEach((id) => {
      const t = currentTasks.find((x) => x.id === id)!
      points +=
        done.length <= t.deadline ? t.points : Math.round(t.points * 0.5)
    })
    const newResults = [
      ...resultsRef.current,
      { points, deadline: done.length },
    ]
    resultsRef.current = newResults
    setResults(newResults)
    const next = roundRef.current + 1
    if (next >= roundCount.current) {
      setPhase("done")
      finalize(newResults)
      return
    }
    roundRef.current = next
    setRound(next)
    setTimeout(startRound, 800)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const finalize = async (r: { points: number }[]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    const total = r.reduce((s, x) => s + x.points, 0)
    const avg = Math.round(total / r.length)
    const score = Math.max(0, Math.min(100, Math.round((avg / 80) * 100)))
    try {
      await dataLayer.saveSession({
        testId: "prioritization",
        category: "executive",
        rawScore: score,
        percentile: lookupPercentile("prioritization", score),
        metadata: { totalPoints: total, rounds: ROUNDS, avgPerRound: avg },
      })
    } catch (err) {
      console.error("Failed to save Prioritization session:", err)
    }
    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Prioritization Test",
        `${total} pts`,
        lookupPercentile("prioritization", score)
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }
    if (!submittedRef.current) return

    redirectToResults({
      testId: "prioritization",
      testName: "Prioritization",
      attempts: r.map((x) => x.points),
      unit: "pts",
      percentile: lookupPercentile("prioritization", score),
      personalBest: null,
      category: "executive",
      average: avg,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  const begin = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
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
                : ROUNDS
    roundCount.current = attemptCount
    const diff = getDifficultyParams(
      "prioritization",
      (cfg.difficulty as string) || "Medium"
    )
    roundTime.current = (diff.roundTime as number) || 10
    if (timerRef.current) clearInterval(timerRef.current)
    submittedRef.current = false
    roundRef.current = 0
    resultsRef.current = []
    setRound(0)
    setResults([])
    setPhase("playing")
    setTimeout(startRound, 400)
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GameConfigPanel
            testId="prioritization"
            icon="📊"
            title="Prioritization Test"
            description="Complete rounds of task scheduling. Maximize points by completing high-value tasks before their deadlines."
            onStart={(config: GameConfig) => begin(config)}
          />
        </div>
      </div>
    )
  }

  if (phase === "playing") {
    return (
      <div className="relative mx-auto w-full max-w-2xl">
        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            setPhase("intro")
          }}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
        <div className="rounded-xl border border-card-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-muted">
            <span>
              Round {round + 1}/{ROUNDS}
            </span>
            <span>
              Time: {usedTime}s / {totalTime}s
            </span>
          </div>
          <div className="mb-4 h-1 w-full rounded-full bg-subtle">
            <div
              className="h-1 rounded-full bg-accent transition-all duration-200"
              style={{ width: `${(usedTime / totalTime) * 100}%` }}
            />
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const done = completed.includes(task.id)
              const canDo = !done && usedTime + task.effort <= totalTime
              return (
                <button
                  key={task.id}
                  onClick={() => doTask(task)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-xs transition-all ${
                    done
                      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-muted"
                      : canDo
                        ? "cursor-pointer border-card-border bg-subtle text-foreground hover:bg-panel"
                        : "cursor-not-allowed border-card-border bg-subtle/50 text-muted"
                  }`}
                  disabled={!canDo}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${
                      done
                        ? "border-[var(--success-border)] bg-[var(--success-bg)] text-success"
                        : "border-card-border text-muted"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </div>
                  <div className="flex-1 text-left">{task.name}</div>
                  <div className="text-muted">{task.points}pts</div>
                  <div className="text-muted">{task.effort}s</div>
                  <div
                    className={`${completed.length <= task.deadline ? "text-success" : "text-error"}`}
                  >
                    D{task.deadline}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const total = results.reduce((s, r) => s + r.points, 0)
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-card-border bg-card p-8">
        <div className="text-4xl text-success">✓</div>
        <div className="font-mono text-4xl font-bold text-foreground">
          {total} pts
        </div>
        <div className="font-mono text-xs text-muted">{ROUNDS} rounds</div>
        {shareImage && (
          <a
            href={shareImage}
            download="cogniarena-prioritization.png"
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
          testId="prioritization"
          score={total}
          scoreLabel={`${total} pts`}
          testName="Prioritization Test"
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

export default withErrorBoundary(PrioritizationTest)
