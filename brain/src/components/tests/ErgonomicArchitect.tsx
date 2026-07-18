import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { useSound } from "../../runtime/useSound"

type ScreenMode = "config" | "reflex" | "result"

export function ErgonomicArchitect() {
  const { playClick, playSuccess, playError } = useSound()
  const [mode, setMode] = useState<ScreenMode>("config")
  
  // Configuration inputs
  const [height, setHeight] = useState<number>(175) // cm
  const [screenSize, setScreenSize] = useState<number>(27) // inches
  const [isStanding, setIsStanding] = useState<boolean>(false)
  const [forearmLength, setForearmLength] = useState<number>(30) // cm
  
  // Reflex Test metrics
  const [reflexTrials, setReflexTrials] = useState<{ yPos: number; rt: number }[]>([])
  const [reflexState, setReflexState] = useState<"idle" | "ready" | "clicked">("idle")
  const [targetY, setTargetY] = useState<number>(50) // percentage
  
  // HistoryPB
  const [personalBest, setPersonalBest] = useState<number | null>(null)

  const reflexStartTimeRef = useRef<number>(0)
  const reflexCountRef = useRef<number>(0)
  const reflexTrialsArrRef = useRef<{ yPos: number; rt: number }[]>([])

  useEffect(() => {
    dataLayer.getPersonalBest("ergonomic-architect", "lower")
      .then(pb => setPersonalBest(pb))
      .catch(err => console.error("Error loading ergonomic PB:", err))
  }, [])

  // Mathematical Ergonomic Calculator Model (cm)
  // Derived from OSHA & ISO 9241 standards
  const eyeHeight = isStanding ? height * 0.93 : height * 0.72
  const elbowHeight = isStanding ? height * 0.63 : height * 0.60
  const deskHeight = elbowHeight - 2
  const chairHeight = isStanding ? 0 : height * 0.26
  const armrestHeight = isStanding ? 0 : chairHeight + (elbowHeight - chairHeight - 20)
  const screenDistance = 65 // standard 50-70cm range

  // SVG dimensions for interactive blueprint
  const deskY = 220
  const screenTopY = deskY - (eyeHeight - deskHeight)

  // Start the reflex/reach calibration test
  const startReflexTest = () => {
    playClick()
    setMode("reflex")
    setReflexTrials([])
    reflexCountRef.current = 0
    reflexTrialsArrRef.current = []
    nextReflexTrial()
  }

  const nextReflexTrial = () => {
    setReflexState("idle")
    // Pick a height position (10% = Top of screen, 50% = Center, 90% = Bottom)
    const positions = [15, 50, 85]
    const chosenPos = positions[Math.floor(Math.random() * positions.length)]
    setTargetY(chosenPos)

    setTimeout(() => {
      reflexStartTimeRef.current = performance.now()
      setReflexState("ready")
    }, 800 + Math.random() * 1200)
  }

  const handleReflexClick = () => {
    if (reflexState !== "ready") return
    const clickTime = performance.now()
    const rt = clickTime - reflexStartTimeRef.current
    playClick()
    
    reflexTrialsArrRef.current.push({ yPos: targetY, rt })
    setReflexTrials([...reflexTrialsArrRef.current])
    reflexCountRef.current++

    if (reflexCountRef.current < 9) {
      nextReflexTrial()
    } else {
      finalizeArchitect()
    }
  }

  const finalizeArchitect = async () => {
    setMode("result")
    playSuccess()
    
    const avgRt = Math.round(
      reflexTrialsArrRef.current.reduce((sum, t) => sum + t.rt, 0) / reflexTrialsArrRef.current.length
    )

    try {
      await dataLayer.saveSession({
        testId: "ergonomic-architect",
        category: "motor",
        rawScore: avgRt,
        percentile: 50, // Benchmark percentile mid-point
        metadata: {
          height,
          screenSize,
          isStanding,
          deskHeight: Math.round(deskHeight),
          chairHeight: Math.round(chairHeight)
        }
      })
    } catch (err) {
      console.error("Failed to save Ergonomic session:", err)
    }
  }

  // Calculate top vs bottom reflex speeds
  const topTrials = reflexTrials.filter(t => t.yPos === 15).map(t => t.rt)
  const bottomTrials = reflexTrials.filter(t => t.yPos === 85).map(t => t.rt)
  const avgTop = topTrials.length > 0 ? Math.round(topTrials.reduce((sum, v) => sum + v, 0) / topTrials.length) : 0
  const avgBottom = bottomTrials.length > 0 ? Math.round(bottomTrials.reduce((sum, v) => sum + v, 0) / bottomTrials.length) : 0

  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all md:p-8">
      {/* Small ✕ close button */}
      {mode !== "config" && (
        <button
          onClick={() => {
            playClick()
            setMode("config")
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
          title="Exit Architect"
        >
          ✕
        </button>
      )}

      {mode === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Sliders and Config panel */}
          <div className="flex flex-col gap-5 justify-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Workstation Ergonomic Blueprint
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Configure your body size parameters below. The model will calculate your precise seating, desk, and display ergonomics.
            </p>

            {/* Toggle Standing */}
            <div className="flex bg-subtle p-1 rounded-lg border border-card-border w-fit">
              <button
                onClick={() => { playClick(); setIsStanding(false) }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-standard cursor-pointer ${!isStanding ? "bg-card text-accent border border-card-border" : "text-muted"}`}
              >
                Sitting Layout
              </button>
              <button
                onClick={() => { playClick(); setIsStanding(true) }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-standard cursor-pointer ${isStanding ? "bg-card text-accent border border-card-border" : "text-muted"}`}
              >
                Standing Layout
              </button>
            </div>

            {/* Height Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono text-secondary">
                <span>User Height:</span>
                <span className="font-semibold text-foreground">{height} cm</span>
              </div>
              <input
                type="range"
                min="140"
                max="210"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Forearm Length Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono text-secondary">
                <span>Forearm Length:</span>
                <span className="font-semibold text-foreground">{forearmLength} cm</span>
              </div>
              <input
                type="range"
                min="20"
                max="45"
                value={forearmLength}
                onChange={(e) => setForearmLength(Number(e.target.value))}
                className="w-full h-1.5 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Screen Size Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono text-secondary">
                <span>Screen Size:</span>
                <span className="font-semibold text-foreground">{screenSize} inches</span>
              </div>
              <input
                type="range"
                min="19"
                max="49"
                value={screenSize}
                onChange={(e) => setScreenSize(Number(e.target.value))}
                className="w-full h-1.5 bg-subtle rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <button
              onClick={startReflexTest}
              className="btn-base btn-primary w-full cursor-pointer py-3 text-sm font-semibold rounded-xl mt-2"
            >
              Start Motor Reach Test
            </button>
          </div>

          {/* Real-time SVG model visualization */}
          <div className="flex items-center justify-center bg-subtle/50 rounded-xl border border-card-border p-4">
            <svg width="220" height="300" viewBox="0 0 220 300" className="text-foreground">
              {/* Ground */}
              <line x1="10" y1="280" x2="210" y2="280" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
              
              {/* Seat & Desk layout items */}
              {!isStanding && (
                <>
                  {/* Chair backrest and support */}
                  <line x1="50" y1="180" x2="50" y2="230" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" />
                  <rect x="40" y="210" width="30" height="8" rx="2" fill="currentColor" fillOpacity="0.7" />
                  <line x1="60" y1="218" x2="60" y2="279" stroke="currentColor" strokeWidth="2" />
                </>
              )}

              {/* Desk */}
              <rect x="110" y={280 - deskHeight * 1.2} width="90" height="6" rx="1" fill="currentColor" fillOpacity="0.8" />
              <line x1="150" y1={286 - deskHeight * 1.2} x2="150" y2="279" stroke="currentColor" strokeWidth="3" />

              {/* Monitor */}
              <rect x="175" y={280 - eyeHeight * 1.2 - 20} width="6" height="50" rx="1" fill="currentColor" fillOpacity="0.9" />
              <line x1="178" y1={310 - eyeHeight * 1.2} x2="178" y2={280 - deskHeight * 1.2} stroke="currentColor" strokeWidth="2" />

              {/* Human figure stick model */}
              {isStanding ? (
                <>
                  {/* Spine / Torso */}
                  <line x1="90" y1="120" x2="90" y2="279" stroke="var(--color-accent)" strokeWidth="4" />
                  {/* Head */}
                  <circle cx="90" cy="100" r="12" fill="var(--color-accent)" fillOpacity="0.3" stroke="var(--color-accent)" strokeWidth="2" />
                  {/* Arm */}
                  <line x1="90" y1="125" x2="110" y2={280 - elbowHeight * 1.2} stroke="var(--color-accent)" strokeWidth="3" />
                  <line x1="110" y1={280 - elbowHeight * 1.2} x2="140" y2={280 - elbowHeight * 1.2} stroke="var(--color-accent)" strokeWidth="3" />
                </>
              ) : (
                <>
                  {/* Spine sitting */}
                  <line x1="85" y1="150" x2="85" y2="210" stroke="var(--color-accent)" strokeWidth="4" />
                  {/* Thigh */}
                  <line x1="85" y1="210" x2="125" y2="210" stroke="var(--color-accent)" strokeWidth="4" />
                  {/* Lower leg */}
                  <line x1="125" y1="210" x2="125" y2="279" stroke="var(--color-accent)" strokeWidth="3" />
                  {/* Head */}
                  <circle cx="85" cy="130" r="12" fill="var(--color-accent)" fillOpacity="0.3" stroke="var(--color-accent)" strokeWidth="2" />
                  {/* Arm sitting */}
                  <line x1="85" y1="155" x2="105" y2={280 - elbowHeight * 1.2} stroke="var(--color-accent)" strokeWidth="3" />
                  <line x1="105" y1={280 - elbowHeight * 1.2} x2="135" y2={280 - elbowHeight * 1.2} stroke="var(--color-accent)" strokeWidth="3" />
                </>
              )}
            </svg>
          </div>
        </div>
      )}

      {mode === "reflex" && (
        <div className="flex flex-col items-center gap-6 w-full text-center max-w-lg select-none">
          <span className="font-mono text-xs text-accent uppercase font-bold tracking-wider">
            Reaching Reflex Test ({reflexCountRef.current}/9 trials)
          </span>
          <p className="text-xs text-muted">
            Move mouse to click the target as soon as it turns green to calibrate reaching strain at top vs. bottom edges.
          </p>

          <div className="relative w-full h-[320px] bg-subtle rounded-xl border border-card-border overflow-hidden">
            {/* Horizontal guidelines */}
            <div className="absolute top-[15%] left-0 right-0 border-t border-card-border border-dashed" />
            <div className="absolute top-[50%] left-0 right-0 border-t border-card-border border-dashed" />
            <div className="absolute top-[85%] left-0 right-0 border-t border-card-border border-dashed" />

            <div
              onClick={handleReflexClick}
              className={`absolute left-[50%] -translate-x-[50%] -translate-y-[50%] h-12 w-12 rounded-full border flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                reflexState === "ready" 
                  ? "bg-success border-success text-white font-bold" 
                  : "bg-card border-card-border text-muted"
              }`}
              style={{ top: `${targetY}%` }}
            >
              {reflexState === "ready" ? "CLICK" : "..."}
            </div>
          </div>
        </div>
      )}

      {mode === "result" && (
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider">
              Calculated Layout blueprint
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Your Customized Ergonomic Dimensions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* The blueprint dimension sheet */}
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-muted uppercase">
                Workplace Layout Metrics
              </h4>
              <div className="rounded-xl border border-card-border bg-subtle p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm border-b border-card-border/60 pb-3 font-mono">
                  <span className="text-muted">Desk Height:</span>
                  <span className="font-bold text-foreground">{Math.round(deskHeight)} cm / {Math.round(deskHeight * 0.39)} in</span>
                </div>
                {!isStanding && (
                  <div className="flex justify-between items-center text-sm border-b border-card-border/60 pb-3 font-mono">
                    <span className="text-muted">Chair Height:</span>
                    <span className="font-bold text-foreground">{Math.round(chairHeight)} cm / {Math.round(chairHeight * 0.39)} in</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-b border-card-border/60 pb-3 font-mono">
                  <span className="text-muted">Screen Top Bezel (from ground):</span>
                  <span className="font-bold text-foreground">{Math.round(eyeHeight)} cm / {Math.round(eyeHeight * 0.39)} in</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-card-border/60 pb-3 font-mono">
                  <span className="text-muted">Optimum View Distance:</span>
                  <span className="font-bold text-foreground">{screenDistance} cm / 26 in</span>
                </div>
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-muted">Reflex Reach Strain:</span>
                  <span className="font-bold text-accent">
                    {Math.abs(avgTop - avgBottom) > 40 ? "Asymmetrical (Tilt monitor)" : "Balanced"}
                  </span>
                </div>
              </div>
            </div>

            {/* Print action and stats */}
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3 font-mono text-xs text-muted">
                <h5 className="font-bold text-foreground text-sm font-sans mb-1">
                  Reach Performance Feedback
                </h5>
                <div className="flex justify-between">
                  <span>Top-Screen Reaction:</span>
                  <span className="font-bold text-foreground">{avgTop} ms</span>
                </div>
                <div className="flex justify-between border-t border-card-border/60 pt-2.5">
                  <span>Bottom-Screen Reaction:</span>
                  <span className="font-bold text-foreground">{avgBottom} ms</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => window.print()}
                  className="btn-base btn-primary flex-1 cursor-pointer py-3 text-sm font-semibold rounded-lg"
                >
                  Print Dimensions
                </button>
                <button
                  onClick={() => setMode("config")}
                  className="btn-base btn-ghost flex-1 cursor-pointer py-3 text-sm font-semibold border border-card-border rounded-lg"
                >
                  Edit Parameters
                </button>
              </div>
            </div>
          </div>

          {/* Curated Affiliate Recommendations */}
          <div className="border-t border-card-border/60 pt-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>💺</span> Recommended Workspace Hardware
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Chair */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Premium Seating
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Herman Miller Aeron
                </h4>
                <p className="text-xs leading-normal text-muted">
                  The gold standard for lumbar health. Features a dynamic mesh seat pan matching the target {Math.round(chairHeight)}cm setting.
                </p>
                <a
                  href="https://amzn.to/3W0P4nQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Chair (~$1400)
                </a>
              </div>

              {/* Desk */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Standing Desk
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Uplift V2 Standing Desk
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Supports programmable presets, letting you switch between your calculated sitting ({Math.round(deskHeight)}cm) and standing presets.
                </p>
                <a
                  href="https://www.upliftdesk.com/uplift-v2-standing-desk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Desk (~$750)
                </a>
              </div>

              {/* Keyboard */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Ergonomic Keyboard
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Kinesis Advantage360
                </h4>
                <p className="text-xs leading-normal text-muted">
                  A split keyboard matching natural forearm alignment to eliminate elbow abduction issues and prevent wrist extension strain.
                </p>
                <a
                  href="https://kinesis-ergo.com/keyboards/advantage360/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Keyboard (~$449)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(ErgonomicArchitect)
