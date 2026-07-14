import { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { generateShareCard } from "../../runtime/share"
import SocialShare from "../ui/SocialShare"
import { lookupPercentile } from "../../runtime/percentileLookup"
import { redirectToResults } from "../../runtime/redirectToResults"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import StageReaction from "./gauntlet/StageReaction"
import StageSequenceMemory from "./gauntlet/StageSequenceMemory"
import StageStroop from "./gauntlet/StageStroop"
import StageMatrix from "./gauntlet/StageMatrix"
import StageAim from "./gauntlet/StageAim"
import {
  STAGE_CONFIGS,
  computeGauntletScore,
  getArchetype,
  getPerformanceColor,
  type GauntletStageResult,
} from "./gauntlet/GauntletTypes"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type Phase = "intro" | "playing" | "transition" | "results"

const STAGES = [
  StageReaction,
  StageSequenceMemory,
  StageStroop,
  StageMatrix,
  StageAim,
]

function getDetailedReview(
  results: GauntletStageResult[],
  overallScore: number
) {
  let tierTag = "Cognitive Apprentice (Tier 4)"
  let nextTierGoal =
    "Reach 50+ overall score by pacing your clicks in the Stroop Test and building visual patterns."
  let tierColor = "bg-rose-500/10 text-rose-600 border-rose-500/20"

  if (overallScore >= 85) {
    tierTag = "Omniscient Sage (Tier 1) 👑"
    nextTierGoal =
      "You have achieved the peak cognitive tier! Maintain your peak performance by practicing Gauntlets weekly under different fatigue states."
    tierColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  } else if (overallScore >= 70) {
    tierTag = "Strategic Thinker (Tier 2) 🧠"
    nextTierGoal =
      "Reach 85+ overall score to ascend to Tier 1. Focus on accelerating your Matrix Reasoning decisions and reducing reaction latency."
    tierColor = "bg-accent/10 text-accent border-accent/20"
  } else if (overallScore >= 50) {
    tierTag = "Methodical Analyst (Tier 3) 🔍"
    nextTierGoal =
      "Reach 70+ overall score to ascend to Tier 2. Work on expanding your visuospatial working memory span and sharpening motor click accuracy."
    tierColor = "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }

  const sortedStages = [...results].sort((a, b) => b.score - a.score)
  const strongest = sortedStages[0]

  let strengthTitle = "Balanced Cognitive Foundation"
  let strengthDetail =
    "You display a consistent performance profile across auditory, visual, and motor planning pathways."

  if (strongest) {
    if (strongest.stageIndex === 0) {
      strengthTitle = "Elite Visual Response Triggers"
      strengthDetail =
        "Your sensory-motor reflexes are extremely rapid. Your brain pathways minimize latency from retinal stimulation to physical finger execution."
    } else if (strongest.stageIndex === 1) {
      strengthTitle = "High-Capacity Working Memory Chunking"
      strengthDetail =
        "You excel at visuospatial chunking. Your brain maps sequence coordinates into spatial patterns effortlessly, allowing high recall under load."
    } else if (strongest.stageIndex === 2) {
      strengthTitle = "Sustained Cognitive Inhibitory Control"
      strengthDetail =
        "You have exceptional conflict resolution in your prefrontal cortex. You suppress incorrect triggers easily, even when color words conflict with inks."
    } else if (strongest.stageIndex === 3) {
      strengthTitle = "Rapid Fluid Logic Extraction"
      strengthDetail =
        "Your analytical reasoning is highly efficient. You identify non-verbal matrix rules and geometric relationships quickly."
    } else if (strongest.stageIndex === 4) {
      strengthTitle = "Surgical Visuomotor Coordination"
      strengthDetail =
        "Your motor control is exceptionally precise. You align spatial targets with sub-pixel coordination and minimal correction lag."
    }
  }

  let analysisAdvice =
    "To sharpen your analytical logic, train in extracting complex rules under time constraints. Try Pattern Reasoning or Tower of Hanoi."
  const matrixResult = results.find((r) => r.stageIndex === 3)
  const memoryResult = results.find((r) => r.stageIndex === 1)
  const stroopResult = results.find((r) => r.stageIndex === 2)

  if (matrixResult && matrixResult.score < 70) {
    analysisAdvice =
      "Your fluid matrix reasoning score shows room for growth. Enhance analytical thinking by playing Pattern Reasoning at Medium/Hard difficulty: focus on isolating columns/rows and tracking rotation transformations step-by-step."
  } else if (memoryResult && memoryResult.score < 70) {
    analysisAdvice =
      "Memory load limits analytical processing. Train on Sequence Memory or Dual N-Back to expand your working memory, letting you hold more active variables in your mind simultaneously."
  } else if (stroopResult && stroopResult.score < 70) {
    analysisAdvice =
      "Inhibitory failures consume cognitive bandwidth. Practice Stroop and Go/No-Go to train your brain to filter out cognitive noise, freeing up attention for complex logic."
  }

  return {
    tierTag,
    nextTierGoal,
    tierColor,
    strengthTitle,
    strengthDetail,
    analysisAdvice,
  }
}

function GauntletTest() {
  const [phase, setPhase] = useState<Phase>("intro")
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState<GauntletStageResult[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [difficultyLevel, setDifficultyLevel] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium")
  const [challengeScore, setChallengeScore] = useState<number | null>(null)
  const stageCompletedRef = useRef(false)
  const submittedRef = useRef(false)
  const lastConfig = useRef<GameConfig | null>(null)

  useBeforeUnload(phase !== "intro" && phase !== "results")
  useVisibilityGuard(
    () => {
      setPhase("intro")
    },
    phase === "playing" || phase === "transition"
  )

  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("gauntlet", "higher")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)

    // Challenge check
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const challengeToken = params.get("challenge")
      if (challengeToken) {
        import("../../runtime/share")
          .then(({ decodeChallenge }) => {
            const payload = decodeChallenge(challengeToken)
            if (payload && payload.testId === "gauntlet") {
              if (mounted) setChallengeScore(payload.score)
            }
          })
          .catch(console.error)
      }
    }

    return () => {
      mounted = false
    }
  }, [])

  const handleStageComplete = (result: GauntletStageResult) => {
    if (stageCompletedRef.current) return
    stageCompletedRef.current = true
    const updated = [...results, result]
    setResults(updated)
    if (result.stageIndex + 1 >= STAGE_CONFIGS.length) {
      const total = computeGauntletScore(updated)
      setOverallScore(total)
      setPhase("results")
      void finalizeAll(total, updated).catch(console.error)
    } else {
      setCurrentIdx(result.stageIndex + 1)
      setPhase("transition")
    }
  }

  useEffect(() => {
    stageCompletedRef.current = false
  }, [currentIdx])

  const finalizeAll = async (totalScore: number, r: GauntletStageResult[]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    const percentile = lookupPercentile("gauntlet", totalScore)
    try {
      await dataLayer.saveSession({
        testId: "gauntlet",
        category: "gauntlet",
        rawScore: totalScore,
        percentile,
        metadata: {
          stages: r.map((s) => ({
            name: s.stageName,
            score: s.score,
            rawScore: s.rawScore,
          })),
        },
      })
    } catch (err) {
      console.error("Failed to save Gauntlet session:", err)
    }
    dataLayer
      .getPersonalBest("gauntlet", "higher")
      .then((pb) => {
        setPersonalBest(pb)
      })
      .catch(console.error)

    try {
      const card = await generateShareCard(
        "The Gauntlet",
        `${totalScore}/100`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }

    redirectToResults({
      testId: "gauntlet",
      testName: "The Gauntlet",
      attempts: r.map((s) => s.score),
      unit: "pts",
      percentile,
      personalBest: null,
      category: "focus",
      average: totalScore,
      difficulty: difficultyLevel,
    })
  }

  const beginGauntlet = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}
    setDifficultyLevel(
      (cfg.difficulty as "Easy" | "Medium" | "Hard") || "Medium"
    )
    setPhase("playing")
    setCurrentIdx(0)
    setResults([])
    setPersonalBest(null)
    setShareImage(null)
    submittedRef.current = false
    stageCompletedRef.current = false
  }

  const prevResult = results[results.length - 1]
  const nextConfig =
    currentIdx < STAGE_CONFIGS.length ? STAGE_CONFIGS[currentIdx] : null

  if (phase === "intro") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {/* Target Challenge Display */}
        {challengeScore && (
          <div className="flex items-center justify-between rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm">
            <div className="flex items-center gap-2 text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent"
              >
                <path d="M6 12 10 16 18 8" />
              </svg>
              <span>
                Try to beat the target score of{" "}
                <strong className="font-mono text-foreground">
                  {challengeScore} pts
                </strong>
                !
              </span>
            </div>
            <button
              onClick={() => setChallengeScore(null)}
              className="cursor-pointer border-0 bg-transparent font-mono text-[11px] text-muted uppercase transition-colors hover:text-secondary"
            >
              Dismiss
            </button>
          </div>
        )}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GameConfigPanel
            testId="gauntlet"
            icon="🏆"
            title="The Gauntlet"
            description="A 5-stage cognitive gauntlet testing reaction, memory, focus, logic, and precision in one session. Takes ~4 minutes."
            onStart={(config: GameConfig) => beginGauntlet(config)}
          />
        </div>
      </div>
    )
  }

  if (phase === "transition" && prevResult && nextConfig) {
    const config = STAGE_CONFIGS[prevResult.stageIndex]
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-card-border bg-card p-6">
          <div className="text-2xl">{config.emoji}</div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground">
              {prevResult.stageName}
            </h3>
            <div
              className={`mt-1 font-mono text-3xl font-bold ${getPerformanceColor(prevResult.score)}`}
            >
              {prevResult.score}
            </div>
          </div>
          <div className="flex gap-4 font-mono text-[10px] text-muted">
            {Object.entries(prevResult.metrics).map(([k, v]) => (
              <span key={k}>
                {k}: {v}
              </span>
            ))}
          </div>
          <div className="h-px w-full bg-card-border" />
          <div className="text-center">
            <div className="mb-1 font-mono text-[10px] text-muted">Up Next</div>
            <div className="mb-1 text-lg">{nextConfig.emoji}</div>
            <h4 className="text-sm font-bold text-foreground">
              {nextConfig.name}
            </h4>
          </div>
          <button
            onClick={() => setPhase("playing")}
            className="transition-standard h-11 cursor-pointer rounded-lg bg-accent px-5 text-xs font-semibold text-white hover:bg-accent-hover active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (phase === "results") {
    const isNewPB = personalBest !== null && overallScore > personalBest
    const archetype = getArchetype(results)
    const review = getDetailedReview(results, overallScore)

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex w-full flex-col items-center gap-5 rounded-xl border border-card-border bg-card p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent/20 bg-accent/10 text-3xl">
            🏆
          </div>
          <div className="text-center">
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
              Gauntlet Complete
            </h2>
            <div
              className={`font-mono text-6xl font-bold ${getPerformanceColor(overallScore)}`}
            >
              {overallScore}
            </div>
            <div className="mt-1 font-mono text-xs text-muted">/ 100</div>
            {isNewPB && (
              <div className="mt-1 animate-pulse font-mono text-xs text-success">
                ✦ New Personal Best!
              </div>
            )}
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2 text-center">
            <div className="font-mono text-[10px] tracking-wider text-muted uppercase">
              Archetype
            </div>
            <div className="text-lg font-bold text-accent">
              {archetype.title}
            </div>
            <div className="mt-1 max-w-xs text-[11px] text-secondary">
              {archetype.desc}
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-5 gap-2">
            {STAGE_CONFIGS.map((s) => {
              const r = results.find((x) => x.stageIndex === s.index)
              return (
                <div
                  key={s.index}
                  className="flex flex-col items-center gap-1 rounded-lg border border-card-border bg-subtle p-1.5 text-center"
                >
                  <span className="text-base">{s.emoji}</span>
                  <div
                    className={`font-mono text-xs font-bold ${r ? getPerformanceColor(r.score) : "text-muted"}`}
                  >
                    {r?.score ?? "--"}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid w-full max-w-xs grid-cols-2 gap-4 text-center text-xs">
            <div>
              <div className="font-mono text-[10px] text-muted uppercase">
                Personal Best
              </div>
              <div className="font-mono font-medium text-foreground">
                {personalBest !== null ? `${personalBest}/100` : "--"}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted uppercase">
                Stages
              </div>
              <div className="font-mono font-medium text-foreground">
                {results.length}/5
              </div>
            </div>
          </div>

          <div className="max-w-md rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] p-3 text-xs text-secondary">
            <strong className="text-error">⚠️</strong> Performance-based
            entertainment tool. Not a clinical or diagnostic assessment.
          </div>
        </div>

        {/* Cognitive Review & Strengths Panel */}
        <div className="flex w-full flex-col gap-4 rounded-xl border border-card-border bg-card p-6">
          <h3 className="flex items-center gap-2 border-b border-card-border/40 pb-3 text-base font-bold text-foreground">
            <span>🧠</span> Cognitive Strengths &amp; Analytical Review
          </h3>

          <div className="flex flex-col gap-4 text-left text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                Persona Tag / Rank
              </span>
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold ${review.tierColor}`}
              >
                {review.tierTag}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                Core Brain Strength
              </span>
              <strong className="text-sm font-semibold text-foreground">
                {review.strengthTitle}
              </strong>
              <p className="leading-relaxed text-muted">
                {review.strengthDetail}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                Analytical Thinking Growth
              </span>
              <p className="leading-relaxed text-muted">
                {review.analysisAdvice}
              </p>
            </div>

            <div className="flex flex-col gap-1 rounded-lg border border-accent/15 bg-accent/5 p-3">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-accent uppercase">
                How to Reach Top Persona (Omniscient Sage)
              </span>
              <p className="mt-0.5 leading-relaxed text-muted">
                {review.nextTierGoal}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {shareImage && (
            <a
              href={shareImage}
              download="cogniarena-gauntlet.png"
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
            testId="gauntlet"
            score={overallScore}
            scoreLabel={`${overallScore}/100`}
            testName="The Gauntlet"
            percentile={lookupPercentile("gauntlet", overallScore)}
          />
          <button
            onClick={() => {
              setPhase("intro")
              setCurrentIdx(0)
              setResults([])
              setOverallScore(0)
              setShareImage(null)
              setPersonalBest(null)
              submittedRef.current = false
              stageCompletedRef.current = false
            }}
            className="transition-standard flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-card-border bg-subtle text-sm text-foreground hover:bg-panel active:scale-[0.98]"
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
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Take Gauntlet Again</span>
          </button>
        </div>
      </div>
    )
  }

  if (phase === "playing" && currentIdx < STAGE_CONFIGS.length) {
    const StageComponent = STAGES[currentIdx]
    return (
      <div className="relative mx-auto w-full max-w-2xl">
        <button
          onClick={() => {
            setPhase("intro")
            setCurrentIdx(0)
            setResults([])
            setOverallScore(0)
            setShareImage(null)
            submittedRef.current = false
            stageCompletedRef.current = false
          }}
          className="transition-standard absolute top-0 right-0 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
          aria-label="Restart"
        >
          ✕
        </button>
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted">
          <span>
            {STAGE_CONFIGS[currentIdx].emoji} Stage {currentIdx + 1}/5
          </span>
          <span>{STAGE_CONFIGS[currentIdx].name}</span>
        </div>
        <div className="flex w-full flex-col items-center rounded-xl border border-card-border bg-card p-4">
          <StageComponent
            key={currentIdx}
            onComplete={handleStageComplete}
            difficulty={difficultyLevel}
          />
        </div>
      </div>
    )
  }

  return null
}

export default withErrorBoundary(GauntletTest)
