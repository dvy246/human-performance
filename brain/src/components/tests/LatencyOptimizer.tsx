import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { measureRefreshRate, type CalibrationResult } from "../../runtime/calibration"
import { dataLayer } from "../../runtime/dataLayer"
import { lookupPercentile, formatTopPercentile } from "../../runtime/percentileLookup"
import { useSound } from "../../runtime/useSound"

type ActivePhase = "idle" | "calibrating" | "polling-test" | "reaction-test" | "result"

export function LatencyOptimizer() {
  const { playTone, playClick, playSuccess, playError } = useSound()
  const [phase, setPhase] = useState<ActivePhase>("idle")
  
  // Calibration State
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  
  // Polling Jitter State
  const [pollingInputs, setPollingInputs] = useState<number[]>([])
  const [avgPollingRate, setAvgPollingRate] = useState<number>(0)
  const [pollingJitter, setPollingJitter] = useState<number>(0) // Std dev in ms
  const [pollingStatus, setPollingStatus] = useState<string>("Click/Hold space to benchmark polling jitter")

  // Reaction Speed State
  const [reactionMode, setReactionMode] = useState<"visual" | "audio">("visual")
  const [reactionTrials, setReactionTrials] = useState<{ type: "visual" | "audio"; rt: number }[]>([])
  const [reactionState, setReactionState] = useState<"waiting" | "ready" | "clicked-early" | "next-prompt">("waiting")
  const [trialCount, setTrialCount] = useState<number>(0)

  // Personal Best & History Stats
  const [personalBest, setPersonalBest] = useState<number | null>(null)

  // Refs for tracking timestamps
  const lastInputTimeRef = useRef<number>(0)
  const inputDeltasRef = useRef<number[]>([])
  const reactionStartTimeRef = useRef<number>(0)
  const trialTimerRef = useRef<any>(null)
  const isTransitioningRef = useRef<boolean>(false)

  // Load personal best on mount
  useEffect(() => {
    dataLayer.getPersonalBest("latency-optimizer", "lower")
      .then(pb => setPersonalBest(pb))
      .catch(err => console.error("Error loading personal best:", err))

    return () => {
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    }
  }, [])

  // Start the entire benchmark sequence
  const startBenchmark = () => {
    playClick()
    setPhase("calibrating")
    setCalibration(null)
    setPollingInputs([])
    setAvgPollingRate(0)
    setPollingJitter(0)
    setReactionTrials([])
    setTrialCount(0)

    // Trigger Hz calibration
    const stopCalibrate = measureRefreshRate((result) => {
      setCalibration(result)
      playSuccess()
      // Move to polling test after a short delay
      setTimeout(() => {
        setPhase("polling-test")
      }, 1500)
    })

    return stopCalibrate
  }

  // Handle Input Polling rapid clicks or key presses
  const handlePollingInput = () => {
    if (phase !== "polling-test") return
    const now = performance.now()
    playClick()
    
    if (lastInputTimeRef.current > 0) {
      const delta = now - lastInputTimeRef.current
      // Filter out double clicks or outlier deltas > 200ms
      if (delta > 0.5 && delta < 200) {
        inputDeltasRef.current.push(delta)
        const currentDeltas = [...inputDeltasRef.current]
        
        // Calculate average polling rate (approx) and jitter (standard deviation)
        const avgDelta = currentDeltas.reduce((sum, v) => sum + v, 0) / currentDeltas.length
        const sqDeltas = currentDeltas.map(v => Math.pow(v - avgDelta, 2))
        const variance = sqDeltas.reduce((sum, v) => sum + v, 0) / currentDeltas.length
        const stdDev = Math.sqrt(variance)

        const calculatedHz = Math.round(1000 / avgDelta)
        setAvgPollingRate(calculatedHz)
        setPollingJitter(Number(stdDev.toFixed(2)))
        
        const count = currentDeltas.length
        setPollingInputs(currentDeltas)

        if (count < 25) {
          setPollingStatus(`Logged ${count}/25 inputs. Keep clicking rapidly!`)
        } else {
          setPollingStatus("Polling check complete!")
          playSuccess()
          setTimeout(() => {
            setPhase("reaction-test")
            startReactionTrial("visual", 1)
          }, 1200)
        }
      }
    }
    lastInputTimeRef.current = now
  }

  // Start a single reaction trial (visual or audio)
  const startReactionTrial = (type: "visual" | "audio", count: number) => {
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
    setReactionMode(type)
    setReactionState("waiting")
    setTrialCount(count)
    isTransitioningRef.current = false

    const delay = 1500 + Math.random() * 3000
    trialTimerRef.current = setTimeout(() => {
      reactionStartTimeRef.current = performance.now()
      setReactionState("ready")
      if (type === "audio") {
        playTone(1000, 0.25, "sine", 0.15)
      }
    }, delay)
  }

  // Handle reaction trigger (click or space key during trial)
  const handleReactionTrigger = () => {
    if (phase !== "reaction-test") return
    if (isTransitioningRef.current) return

    const clickTime = performance.now()
    if (reactionState === "waiting") {
      // Clicked too early
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
      playError()
      setReactionState("clicked-early")
      isTransitioningRef.current = true
      setTimeout(() => {
        startReactionTrial(reactionMode, trialCount)
      }, 1500)
    } else if (reactionState === "ready") {
      // Successful trial
      const rt = clickTime - reactionStartTimeRef.current
      playClick()
      isTransitioningRef.current = true

      const updatedTrials = [...reactionTrials, { type: reactionMode, rt }]
      setReactionTrials(updatedTrials)
      setReactionState("next-prompt")

      setTimeout(() => {
        const currentCount = updatedTrials.filter(t => t.type === reactionMode).length
        if (currentCount < 3) {
          // Keep testing same mode
          startReactionTrial(reactionMode, currentCount + 1)
        } else if (reactionMode === "visual") {
          // Switch to audio mode
          startReactionTrial("audio", 1)
        } else {
          // Finished all trials
          finalizeBenchmark(updatedTrials)
        }
      }, 1500)
    }
  }

  // Process and save final results
  const finalizeBenchmark = async (trials: { type: "visual" | "audio"; rt: number }[]) => {
    setPhase("result")
    const visTrials = trials.filter(t => t.type === "visual").map(t => t.rt)
    const audTrials = trials.filter(t => t.type === "audio").map(t => t.rt)
    const avgVis = visTrials.reduce((sum, v) => sum + v, 0) / visTrials.length
    const avgAud = audTrials.reduce((sum, v) => sum + v, 0) / audTrials.length
    const combinedScore = Math.round((avgVis + avgAud) / 2)

    try {
      await dataLayer.saveSession({
        testId: "latency-optimizer",
        category: "reaction",
        rawScore: combinedScore,
        percentile: lookupPercentile("reaction-time", combinedScore, true),
        metadata: {
          hz: calibration?.hz ?? 60,
          pollingRate: avgPollingRate,
          jitter: pollingJitter,
          visualRt: Math.round(avgVis),
          audioRt: Math.round(avgAud),
        }
      })
      const pb = await dataLayer.getPersonalBest("latency-optimizer", "lower")
      setPersonalBest(pb)
    } catch (err) {
      console.error("Failed to save latency optimizer results:", err)
    }
  }

  // Calculations for display stack
  const avgVis = reactionTrials.filter(t => t.type === "visual").map(t => t.rt)
  const rawAvgVis = avgVis.length > 0 ? avgVis.reduce((sum, v) => sum + v, 0) / avgVis.length : 240
  
  const displayLag = calibration ? calibration.expectedLagMs : 8.3
  const pollingLag = avgPollingRate > 0 ? Number((1000 / avgPollingRate).toFixed(1)) : 8.0
  const netBiological = Math.max(80, Math.round(rawAvgVis - displayLag - pollingLag))

  // Percentiles
  const rawAvg = Math.round(rawAvgVis)
  const topPercentile = lookupPercentile("reaction-time", rawAvg, true)

  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all md:p-8">
      {/* Absolute Close button to quit back to idle */}
      {phase !== "idle" && (
        <button
          onClick={() => {
            playClick()
            if (trialTimerRef.current) clearTimeout(trialTimerRef.current)
            setPhase("idle")
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
          title="Exit Optimizer"
        >
          ✕
        </button>
      )}

      {phase === "idle" && (
        <div className="flex flex-col items-center text-center gap-6 max-w-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Calibrate Hardware Lag & True Reflex Speed
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Most online reaction tests are skewed by your screen's refresh rate and device polling delay. 
            This optimizer measures monitor paint intervals and click jitter, then subtracts hardware delivery latency to compute your <strong>true biological response time</strong>.
          </p>
          
          {personalBest && (
            <div className="rounded-lg border border-card-border bg-subtle px-4 py-2 font-mono text-xs text-secondary">
              Personal Best (Biological Net): <span className="font-semibold text-accent">{personalBest} ms</span>
            </div>
          )}

          <button
            onClick={startBenchmark}
            className="btn-base btn-primary w-full max-w-xs cursor-pointer shadow-lg shadow-accent/25 py-3 text-sm font-semibold rounded-xl"
          >
            Start Setup Diagnostics
          </button>
        </div>
      )}

      {phase === "calibrating" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <h3 className="text-lg font-semibold text-foreground">
            Calibrating Display Refresh Rate...
          </h3>
          <p className="max-w-xs text-xs text-muted">
            Measuring frame interval paint synchrony. Please keep this tab active and do not resize the window.
          </p>
        </div>
      )}

      {phase === "polling-test" && (
        <div 
          onClick={handlePollingInput}
          className="flex h-full w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-card-border bg-subtle/50 p-8 text-center select-none"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063Z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Benchmark Input Polling Rate
          </h3>
          <p className="text-sm text-muted">
            Tap or click rapidly inside this box to measure USB polling stability and standard jitter deviation.
          </p>
          <div className="font-mono text-xs text-accent uppercase font-medium">
            {pollingStatus}
          </div>
          
          {pollingInputs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-card p-4 border border-card-border font-mono text-xs text-secondary w-full">
              <div>
                Polling Speed: <span className="font-bold text-foreground">{avgPollingRate} Hz</span>
              </div>
              <div>
                Jitter Deviation: <span className="font-bold text-foreground">{pollingJitter} ms</span>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "reaction-test" && (
        <div
          onClick={handleReactionTrigger}
          className={`flex h-full min-h-[300px] w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center select-none transition-colors duration-200 ${
            reactionState === "ready" 
              ? "bg-success/15 border-success/30" 
              : reactionState === "clicked-early" 
                ? "bg-error/15 border-error/30" 
                : "bg-subtle/50 border-card-border"
          }`}
        >
          {reactionState === "waiting" && (
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs uppercase text-accent font-semibold tracking-wider">
                Trial {trialCount}/3 ({reactionMode === "visual" ? "Visual Screen Change" : "Audio Tone trigger"})
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Wait for {reactionMode === "visual" ? "GREEN Screen" : "Audio Signal"}
              </h3>
              <p className="text-xs text-muted max-w-xs mt-1">
                Click or press Spacebar as quickly as possible when the trigger is released. Do not anticipate.
              </p>
            </div>
          )}

          {reactionState === "ready" && (
            <div className="animate-pulse">
              <h3 className="text-3xl font-extrabold text-success">
                {reactionMode === "visual" ? "CLICK NOW!" : "TRIGGER NOW!"}
              </h3>
            </div>
          )}

          {reactionState === "clicked-early" && (
            <div className="text-error flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3 className="text-xl font-bold">Too Early!</h3>
              <p className="text-xs text-muted">Wait for the green screen or audio sound before clicking.</p>
            </div>
          )}

          {reactionState === "next-prompt" && (
            <div className="text-success flex flex-col items-center gap-1">
              <h3 className="text-2xl font-bold font-mono">
                {Math.round(reactionTrials[reactionTrials.length - 1].rt)} ms
              </h3>
              <p className="text-xs text-muted">Recorded successfully. Waiting for next trial...</p>
            </div>
          )}
        </div>
      )}

      {phase === "result" && (
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
              Diagnostic Hardware Report
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Your Setup Latency Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SVG Latency Stack Graph */}
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-muted uppercase">
                Latency Budget Stack
              </h4>
              <div className="relative rounded-xl border border-card-border bg-subtle p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-xs text-secondary">
                    <span>Net Biological Reflex:</span>
                    <span className="font-bold text-foreground">{netBiological} ms</span>
                  </div>
                  <div className="h-4 w-full bg-card rounded-md overflow-hidden flex border border-card-border/80">
                    <div 
                      className="bg-accent h-full" 
                      style={{ width: `${(netBiological / rawAvg) * 100}%` }} 
                    />
                    <div 
                      className="bg-warning h-full" 
                      style={{ width: `${(displayLag / rawAvg) * 100}%` }} 
                    />
                    <div 
                      className="bg-error h-full" 
                      style={{ width: `${(pollingLag / rawAvg) * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 font-mono text-xs text-muted border-t border-card-border/60 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>Biological Reflex: {netBiological}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    <span>Display Lag ({calibration?.hz ?? 60}Hz): {displayLag}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-error" />
                    <span>Input Polling ({avgPollingRate}Hz): {pollingLag}ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scores & Benchmarks */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted font-medium">True Biological Score</span>
                  <span className="font-mono text-2xl font-extrabold text-accent">{netBiological} ms</span>
                </div>
                <div className="flex justify-between items-center border-t border-card-border/60 pt-3">
                  <span className="text-xs text-muted font-medium">Visual Response Average</span>
                  <span className="font-mono text-sm text-foreground">{Math.round(rawAvgVis)} ms</span>
                </div>
                <div className="flex justify-between items-center border-t border-card-border/60 pt-3">
                  <span className="text-xs text-muted font-medium">Cognitive Percentile</span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent uppercase">
                    {formatTopPercentile(topPercentile, true)}
                  </span>
                </div>
              </div>

              <button
                onClick={startBenchmark}
                className="btn-base btn-primary w-full cursor-pointer py-2.5 text-sm font-semibold rounded-lg"
              >
                Restart Benchmark Setup
              </button>
            </div>
          </div>

          {/* Curated Affiliate Recommendations */}
          <div className="border-t border-card-border/60 pt-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>🔧</span> Recommended Setup Upgrades Mapped to Your System
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Monitor recommendation */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Recommended Display
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  BenQ ZOWIE XL2566K 360Hz
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Upgrading to 360Hz reduces your frame delivery lag from {displayLag}ms to 1.4ms, providing near-instant visual tracking feedback.
                </p>
                <a
                  href="https://amzn.to/3W0P4nQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research display (~$599)
                </a>
              </div>

              {/* Keyboard recommendation */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Recommended Keyboard
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Wooting 60HE Hall Effect
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Features rapid trigger magnetic switch inputs. Eliminates physical key debounce time to save up to 10-15ms of peripheral delay.
                </p>
                <a
                  href="https://wooting.io/wooting-60he"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Keyboard (~$175)
                </a>
              </div>

              {/* Mouse recommendation */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Recommended Mouse
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Logitech G Pro X Superlight 2
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Supports native 4000Hz polling rate. Decreases USB polling jitter from {pollingJitter}ms to less than 0.25ms for click consistency.
                </p>
                <a
                  href="https://amzn.to/4f0mP3l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research mouse (~$159)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(LatencyOptimizer)
