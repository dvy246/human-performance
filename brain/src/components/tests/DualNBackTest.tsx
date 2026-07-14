import React, { useState, useEffect, useRef, useCallback } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { encodeChallenge, generateShareCard } from "../../runtime/share"
import {
  lookupPercentile,
  formatTopPercentile,
} from "../../runtime/percentileLookup"
import { redirectToResults } from "../../runtime/redirectToResults"
import SocialShare from "../ui/SocialShare"
import GameConfigPanel from "../ui/GameConfigPanel"
import type { GameConfig } from "../../runtime/testConfig"
import { getDifficultyParams } from "../../runtime/testConfig"
import { useBeforeUnload } from "../../runtime/useBeforeUnload"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type GameState = "idle" | "running" | "result"

interface Stimulus {
  position: number // 0-8 grid index
  letter: string // 'A', 'B', 'C', 'D', 'P', 'T', 'L'
}

const LETTERS = ["A", "B", "C", "D", "P", "T", "L"]

function DualNBackTest() {
  const [gameState, setGameState] = useState<GameState>("idle")
  const [n, setN] = useState<number>(2)
  const [maxN, setMaxN] = useState<number>(2)
  const [trialList, setTrialList] = useState<Stimulus[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [activePosition, setActivePosition] = useState<number | null>(null)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  // Staircasing state
  const consecutiveCorrect = useRef<number>(0)
  const currentNRef = useRef<number>(2)
  const maxNRef = useRef<number>(2)

  // User input responses
  const [posMatches, setPosMatches] = useState<boolean[]>([])
  const [letterMatches, setLetterMatches] = useState<boolean[]>([])
  const [score, setScore] = useState(0) // overall score points
  const [accuracy, setAccuracy] = useState(0)
  const [resultPercentile, setResultPercentile] = useState(0)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [shareImage, setShareImage] = useState<string | null>(null)

  // Tracks if the user already pressed match keys in the current trial
  const userMatchPos = useRef<boolean>(false)
  const userMatchLetter = useRef<boolean>(false)
  const posMatchesRef = useRef<boolean[]>([])
  const letterMatchesRef = useRef<boolean[]>([])
  const submittedRef = useRef<boolean>(false)

  const trialTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialNRef = useRef<number>(2)
  const lastConfig = useRef<GameConfig | null>(null)
  const sequenceListRef = useRef<Stimulus[]>([])
  const totalTrialsRef = useRef<number>(20)
  const matchRateRef = useRef<number>(0.35)

  useEffect(() => {
    let mounted = true
    dataLayer
      .getPersonalBest("dual-n-back", "higher")
      .then((pb) => {
        if (mounted) setPersonalBest(pb)
      })
      .catch(console.error)
    return () => {
      mounted = false
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakLetter = (letter: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any ongoing speech to avoid delays
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(letter.toLowerCase())
      utterance.rate = 1.3
      window.speechSynthesis.speak(utterance)
    }
  }

  const generateSequence = (
    nVal: number,
    trials: number,
    matchRate: number
  ): Stimulus[] => {
    const list: Stimulus[] = []

    for (let i = 0; i < nVal; i++) {
      list.push({
        position: Math.floor(Math.random() * 9),
        letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      })
    }

    for (let i = nVal; i < trials; i++) {
      const matchPos = Math.random() < matchRate
      const matchLetter = Math.random() < matchRate

      const position = matchPos
        ? list[i - nVal].position
        : Math.floor(Math.random() * 9)

      const letter = matchLetter
        ? list[i - nVal].letter
        : LETTERS[Math.floor(Math.random() * LETTERS.length)]

      list.push({ position, letter })
    }

    return list
  }

  const generateRemaining = (
    count: number,
    nVal: number,
    preceding: Stimulus[],
    matchRate: number
  ): Stimulus[] => {
    const list: Stimulus[] = []
    const totalSoFar = preceding.length

    for (let i = 0; i < count; i++) {
      const actualIdx = totalSoFar + i
      const matchPos = Math.random() < matchRate
      const matchLetter = Math.random() < matchRate

      const refIndex = actualIdx - nVal
      const position =
        refIndex >= 0 && matchPos
          ? preceding[refIndex].position
          : Math.floor(Math.random() * 9)
      const letter =
        refIndex >= 0 && matchLetter
          ? preceding[refIndex].letter
          : LETTERS[Math.floor(Math.random() * LETTERS.length)]

      list.push({ position, letter })
    }

    return list
  }

  const startTest = (config?: GameConfig) => {
    if (config) lastConfig.current = config
    const cfg = config || lastConfig.current || {}

    // Clean up any pending timers from a previous run
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
    trialTimerRef.current = null
    sequenceTimerRef.current = null
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    const diff = getDifficultyParams(
      "dual-n-back",
      (cfg.difficulty as string) || "Medium"
    )
    const startN = (diff.startN as number) || 2
    totalTrialsRef.current = (diff.trials as number) || 20
    matchRateRef.current = (diff.matchRate as number) || 0.35
    setN(startN)
    setMaxN(startN)
    currentNRef.current = startN
    maxNRef.current = startN
    initialNRef.current = startN
    consecutiveCorrect.current = 0
    const sequence = generateSequence(
      startN,
      totalTrialsRef.current,
      matchRateRef.current
    )
    sequenceListRef.current = sequence
    setTrialList(sequence)
    setCurrentIdx(-1)
    setActivePosition(null)
    setActiveLetter(null)
    setPosMatches([])
    setLetterMatches([])
    posMatchesRef.current = []
    letterMatchesRef.current = []
    submittedRef.current = false
    setScore(0)
    setAccuracy(0)
    setResultPercentile(0)
    setShareImage(null)
    setGameState("running")

    // Launch sequence timing
    setTimeout(() => {
      runNextTrial(0)
    }, 500)
  }

  const runNextTrial = (idx: number, _list?: Stimulus[]) => {
    const list = sequenceListRef.current
    if (idx >= list.length) {
      evaluateResult(list)
      return
    }

    setCurrentIdx(idx)
    const stim = list[idx]

    // Trigger visual/auditory stimulus
    setActivePosition(stim.position)
    setActiveLetter(stim.letter)
    speakLetter(stim.letter)

    // Clear user match flags
    userMatchPos.current = false
    userMatchLetter.current = false

    // Flash stimulus for 1.2s, then wait in blank screen state for another 1.3s (2.5s total trial time)
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
    sequenceTimerRef.current = setTimeout(() => {
      setActivePosition(null)
      setActiveLetter(null)
    }, 1200)

    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    trialTimerRef.current = setTimeout(() => {
      // Evaluate trial response at the end of the 2.5s interval
      // Both functions read from sequenceListRef.current, not the closure param
      evaluateTrialResponse(idx)
      runNextTrial(idx + 1)
    }, 2500)
  }

  const handleMatchPosition = useCallback(() => {
    if (gameState !== "running" || currentIdx < n) return
    userMatchPos.current = true
  }, [gameState, currentIdx, n])

  const handleMatchLetter = useCallback(() => {
    if (gameState !== "running" || currentIdx < n) return
    userMatchLetter.current = true
  }, [gameState, currentIdx, n])

  const evaluateTrialResponse = (idx: number, _list?: Stimulus[]) => {
    const list = sequenceListRef.current
    if (idx < currentNRef.current) return // First N trials cannot have matches

    const targetPosMatch =
      list[idx].position === list[idx - currentNRef.current].position
    const targetLetterMatch =
      list[idx].letter === list[idx - currentNRef.current].letter

    const posCorrect = userMatchPos.current === targetPosMatch
    const letterCorrect = userMatchLetter.current === targetLetterMatch

    posMatchesRef.current = [...posMatchesRef.current, posCorrect]
    letterMatchesRef.current = [...letterMatchesRef.current, letterCorrect]
    setPosMatches(posMatchesRef.current)
    setLetterMatches(letterMatchesRef.current)

    // 3-up-1-down staircasing
    if (posCorrect && letterCorrect) {
      consecutiveCorrect.current += 1
      if (consecutiveCorrect.current >= 3 && currentNRef.current < 7) {
        // Level up!
        currentNRef.current += 1
        maxNRef.current = Math.max(maxNRef.current, currentNRef.current)
        consecutiveCorrect.current = 0
        setN(currentNRef.current)
        setMaxN(maxNRef.current)
        // Regenerate remaining trials with new n so match offsets stay consistent
        regenerateRemaining(idx)
      }
    } else {
      // Any error resets the streak and drops level
      consecutiveCorrect.current = 0
      if (currentNRef.current > 1) {
        currentNRef.current -= 1
        setN(currentNRef.current)
        // Regenerate with new (lower) n
        regenerateRemaining(idx)
      }
    }
  }

  /** Regenerate the remaining trials (idx+1 onward) using the current currentNRef n value. */
  const regenerateRemaining = (currentTrialIdx: number) => {
    const list = sequenceListRef.current
    const remainingCount = totalTrialsRef.current - currentTrialIdx - 1
    if (remainingCount <= 0) return
    const preceding = list.slice(0, currentTrialIdx + 1)
    const replacement = generateRemaining(
      remainingCount,
      currentNRef.current,
      preceding,
      matchRateRef.current
    )
    const newList = [...preceding, ...replacement]
    sequenceListRef.current = newList
    setTrialList(newList)
  }

  const evaluateResult = async (_list?: Stimulus[]) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setGameState("result")
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)

    // Calculate total matches accuracy from refs (captures last trial)
    const posCorrectCount = posMatchesRef.current.filter(Boolean).length
    const letterCorrectCount = letterMatchesRef.current.filter(Boolean).length
    const totalEvaluated = posMatchesRef.current.length
    const totalPossible = Math.max(1, totalEvaluated) * 2
    const totalCorrect = posCorrectCount + letterCorrectCount
    const finalAccuracy = Math.round(
      (totalCorrect / Math.max(1, totalPossible)) * 100
    )

    setAccuracy(finalAccuracy)

    // Calculate final composite score using max N achieved
    const achievedN = maxNRef.current
    const finalScore = Math.round(achievedN * 1000 + finalAccuracy * 50)
    setScore(finalScore)

    const percentile = lookupPercentile("dual-n-back", finalScore)
    setResultPercentile(percentile)

    try {
      await dataLayer.saveSession({
        testId: "dual-n-back",
        category: "memory",
        rawScore: finalScore,
        percentile,
        metadata: {
          nLevel: achievedN,
          maxN: achievedN,
          accuracy: finalAccuracy,
          posCorrect: posCorrectCount,
          letterCorrect: letterCorrectCount,
        },
      })
    } catch (err) {
      console.error("Failed to save DualN-Back session:", err)
    }
    if (!submittedRef.current) return

    dataLayer
      .getPersonalBest("dual-n-back", "higher")
      .then((pb) => {
        if (!submittedRef.current) setPersonalBest(pb)
      })
      .catch(console.error)

    if (!submittedRef.current) return

    try {
      const card = await generateShareCard(
        "Dual N-Back Test",
        `Max N=${achievedN} (${finalAccuracy}%)`,
        percentile
      )
      setShareImage(card)
    } catch (err) {
      console.error("Failed to generate share card:", err)
    }
    if (!submittedRef.current) return

    redirectToResults({
      testId: "dual-n-back",
      testName: "Dual N-Back",
      attempts: [finalScore],
      unit: "pts",
      percentile,
      personalBest: null,
      category: "memory",
      average: finalScore,
      difficulty: (lastConfig.current?.difficulty as string) || "Medium",
    })
  }

  useBeforeUnload(gameState !== "idle" && gameState !== "result")
  useVisibilityGuard(() => {
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
    setGameState("idle")
  }, gameState === "running")

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "running") return
      if (e.key.toLowerCase() === "a" || e.key === "ArrowLeft") {
        handleMatchPosition()
      } else if (e.key.toLowerCase() === "l" || e.key === "ArrowRight") {
        handleMatchLetter()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, handleMatchPosition, handleMatchLetter])

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 select-none">
      {gameState === "idle" && (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GameConfigPanel
            testId="dual-n-back"
            icon="🧠"
            title="Dual N-Back Memory"
            description="The gold standard for visual-auditory working memory training. Compare the current grid position and spoken letter to those shown N steps back."
            personalBest={personalBest}
            personalBestLabel="Pts"
            onStart={(config: GameConfig) => startTest(config)}
          />
        </div>
      )}

      {gameState === "running" && (
        <div className="relative flex min-h-[440px] flex-col items-center justify-between overflow-hidden rounded-xl border border-card-border bg-card p-6 shadow-lg">
          <button
            onClick={() => {
              if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
              if (sequenceTimerRef.current)
                clearTimeout(sequenceTimerRef.current)
              setGameState("idle")
            }}
            className="transition-standard absolute top-2 right-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-card-border bg-panel/80 text-[11px] text-muted hover:border-error/50 hover:text-error"
            aria-label="Restart"
          >
            ✕
          </button>
          {/* Header Status */}
          <div className="mb-6 flex w-full items-center justify-between font-mono text-xs text-muted">
            <span>
              TRIAL {currentIdx + 1} / {trialList.length}
            </span>
            <span>LEVEL: DUAL {n}-BACK</span>
          </div>

          {/* 3x3 Visual Grid */}
          <div className="mx-auto mb-6 grid aspect-square w-full max-w-[240px] grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, idx) => {
              const isActive = activePosition === idx
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg border transition-all duration-150 ${
                    isActive
                      ? "scale-98 border-accent bg-accent shadow-md"
                      : "border-card-border/40 bg-subtle"
                  }`}
                />
              )
            })}
          </div>

          {/* Audio Indicator Backup (Visual Assist) */}
          <div className="mb-6 flex h-6 items-center justify-center">
            {activeLetter ? (
              <span className="font-mono text-xs text-muted">
                Audio backup: [ {activeLetter} ]
              </span>
            ) : (
              <span className="font-mono text-xs text-muted opacity-0">
                Wait
              </span>
            )}
          </div>

          {/* Match Trigger Buttons */}
          <div className="grid w-full grid-cols-2 gap-4">
            <button
              onClick={handleMatchPosition}
              className="transition-standard flex h-12 flex-col items-center justify-center rounded border border-card-border text-sm font-semibold tracking-wide text-foreground hover:bg-subtle active:scale-97"
            >
              <span>Match Position</span>
              <span className="mt-0.5 font-mono text-[9px] text-muted">
                Key [A] or [←]
              </span>
            </button>
            <button
              onClick={handleMatchLetter}
              className="transition-standard flex h-12 flex-col items-center justify-center rounded border border-card-border text-sm font-semibold tracking-wide text-foreground hover:bg-subtle active:scale-97"
            >
              <span>Match Audio</span>
              <span className="mt-0.5 font-mono text-[9px] text-muted">
                Key [L] or [→]
              </span>
            </button>
          </div>
        </div>
      )}

      {gameState === "result" && (
        <div className="flex flex-col items-center gap-6 rounded-xl border border-card-border bg-card p-8 text-center shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] text-xl font-bold text-success">
            ✓
          </div>
          <div>
            <span className="font-mono text-xs tracking-widest text-muted uppercase">
              Dual N-Back Result
            </span>
            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">
              {score} Pts
            </h2>
            <span className="mt-1 block font-mono text-xs text-accent uppercase">
              Max Level: N={maxN} · {formatTopPercentile(resultPercentile)}{" "}
              memory performance
            </span>
          </div>

          {/* Stats Breakdown */}
          <div className="my-2 grid w-full max-w-sm grid-cols-2 gap-4 border-t border-b border-card-border/50 py-4 text-left">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Accuracy
              </span>
              <span className="text-sm font-bold text-foreground">
                {accuracy}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Position Correct
              </span>
              <span className="text-sm font-bold text-foreground">
                {posMatches.filter(Boolean).length} / {posMatches.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Audio Correct
              </span>
              <span className="text-sm font-bold text-foreground">
                {letterMatches.filter(Boolean).length} / {letterMatches.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-muted uppercase">
                Max N-Level
              </span>
              <span className="text-sm font-bold text-foreground">{maxN}</span>
            </div>
          </div>

          <button
            onClick={() => startTest()}
            className="transition-standard h-11 w-full rounded bg-accent font-mono text-xs font-bold tracking-wider text-white uppercase shadow hover:bg-accent-hover active:scale-98"
          >
            Train Again
          </button>

          {shareImage && (
            <SocialShare
              testId="dual-n-back"
              score={score}
              scoreLabel={`N=${maxN} (${accuracy}%)`}
              testName="Dual N-Back Memory Test"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(DualNBackTest)
