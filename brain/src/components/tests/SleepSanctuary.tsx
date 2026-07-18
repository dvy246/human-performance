import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { useSound } from "../../runtime/useSound"

type ViewPhase = "quiz" | "stroop" | "result"
type Chronotype = "Lion" | "Bear" | "Wolf" | "Dolphin"

interface QuizQuestion {
  id: number
  text: string
  options: { text: string; score: number }[]
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "What time would you wake up if you had entirely free time?",
    options: [
      { text: "5:00 AM – 6:30 AM", score: 4 },
      { text: "6:30 AM – 8:00 AM", score: 3 },
      { text: "8:00 AM – 10:00 AM", score: 2 },
      { text: "Irregular or broken sleep", score: 1 },
    ],
  },
  {
    id: 2,
    text: "When do you feel most alert and productive?",
    options: [
      { text: "Early morning (first 3 hours)", score: 4 },
      { text: "Late morning to early afternoon", score: 3 },
      { text: "Evening / Late night", score: 2 },
      { text: "Varies constantly", score: 1 },
    ],
  },
  {
    id: 3,
    text: "How easily do you fall asleep at night?",
    options: [
      { text: "Very quickly (under 10 minutes)", score: 4 },
      { text: "Within 15-30 minutes", score: 3 },
      { text: "Takes over 45 minutes often", score: 2 },
      { text: "Extremely difficult / Wake up constantly", score: 1 },
    ],
  },
  {
    id: 4,
    text: "How dependent are you on caffeine to function?",
    options: [
      { text: "Not at all, natural wake up", score: 4 },
      { text: "Only one cup in the morning", score: 3 },
      { text: "Need multiple cups throughout the day", score: 2 },
      { text: "Rely on it to stay awake at night", score: 1 },
    ],
  },
]

export function SleepSanctuary() {
  const { playClick, playSuccess, playError } = useSound()
  const [phase, setPhase] = useState<ViewPhase>("quiz")
  
  // Quiz states
  const [qIndex, setQIndex] = useState<number>(0)
  const [quizScore, setQuizScore] = useState<number>(0)
  
  // Stroop/fatigue check states
  const [stroopTrial, setStroopTrial] = useState<number>(0)
  const [stroopTargetColor, setStroopTargetColor] = useState<string>("")
  const [stroopText, setStroopText] = useState<string>("")
  const [stroopTextColor, setStroopTextColor] = useState<string>("")
  const [stroopState, setStroopState] = useState<"idle" | "ready">("idle")
  
  const stroopStartTimeRef = useRef<number>(0)
  const stroopTimesRef = useRef<number[]>([])
  
  // Final calculated values
  const [chronotype, setChronotype] = useState<Chronotype>("Bear")
  const [caffeineDecayHrs, setCaffeineDecayHrs] = useState<number>(6) // Slider for decay simulator
  const [personalBest, setPersonalBest] = useState<number | null>(null)

  useEffect(() => {
    dataLayer.getPersonalBest("sleep-sanctuary", "lower")
      .then(pb => setPersonalBest(pb))
      .catch(err => console.error("Error loading sleep PB:", err))
  }, [])

  const handleQuizAnswer = (score: number) => {
    playClick()
    const nextScore = quizScore + score
    setQuizScore(nextScore)

    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1)
    } else {
      // Transition to Stroop fatigue check
      setPhase("stroop")
      startStroop()
    }
  }

  // Mini Stroop attention test
  const startStroop = () => {
    setStroopTrial(0)
    stroopTimesRef.current = []
    nextStroopTrial()
  }

  const nextStroopTrial = () => {
    setStroopState("idle")
    const colors = ["red", "blue", "green", "yellow"]
    const randomText = colors[Math.floor(Math.random() * colors.length)]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    setStroopText(randomText)
    setStroopTextColor(randomColor)
    
    // The target color matches the text COLOR, not the word text
    setStroopTargetColor(randomColor)

    setTimeout(() => {
      stroopStartTimeRef.current = performance.now()
      setStroopState("ready")
    }, 600)
  }

  const handleStroopChoice = (chosenColor: string) => {
    if (stroopState !== "ready") return
    const clickTime = performance.now()
    const rt = clickTime - stroopStartTimeRef.current

    if (chosenColor === stroopTargetColor) {
      playClick()
      stroopTimesRef.current.push(rt)
      const nextCount = stroopTrial + 1
      setStroopTrial(nextCount)

      if (nextCount < 5) {
        nextStroopTrial()
      } else {
        calculateResults()
      }
    } else {
      playError()
      // Penalty time
      stroopTimesRef.current.push(rt + 500)
      nextStroopTrial()
    }
  }

  const calculateResults = async () => {
    setPhase("result")
    playSuccess()
    
    // Map score to Chronotype
    let type: Chronotype = "Bear"
    if (quizScore >= 13) type = "Lion"
    else if (quizScore >= 10) type = "Bear"
    else if (quizScore >= 7) type = "Wolf"
    else type = "Dolphin"
    
    setChronotype(type)

    const avgStroop = Math.round(
      stroopTimesRef.current.reduce((sum, v) => sum + v, 0) / stroopTimesRef.current.length
    )

    try {
      await dataLayer.saveSession({
        testId: "sleep-sanctuary",
        category: "focus",
        rawScore: avgStroop,
        percentile: 50,
        metadata: {
          chronotype: type,
          stroopReaction: avgStroop,
        }
      })
    } catch (err) {
      console.error("Failed to save sleep sanctuary session:", err)
    }
  }

  // Circular SVG scheduler calculations based on Chronotype
  const getCircadianArcs = () => {
    switch (chronotype) {
      case "Lion":
        return { sleepStart: 21.5, sleepEnd: 5.5, peakStart: 8, peakEnd: 12, windStart: 19.5, caffeineCut: 13.5 }
      case "Wolf":
        return { sleepStart: 24, sleepEnd: 8, peakStart: 17, peakEnd: 21, windStart: 22, caffeineCut: 16 }
      case "Dolphin":
        return { sleepStart: 23, sleepEnd: 7, peakStart: 10, peakEnd: 14, windStart: 21.5, caffeineCut: 12.5 }
      case "Bear":
      default:
        return { sleepStart: 22.5, sleepEnd: 7, peakStart: 9.5, peakEnd: 13.5, windStart: 20.5, caffeineCut: 14.5 }
    }
  }

  const arcs = getCircadianArcs()
  
  // Caffeine clearance decay helper
  // caffeine remains at approx 100% at ingestion, cuts in half every caffeineDecayHrs
  const caffeineLeft = Number((100 * Math.pow(0.5, (24 - arcs.caffeineCut) / caffeineDecayHrs)).toFixed(1))

  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all md:p-8">
      {/* Exit Button */}
      {phase !== "quiz" && (
        <button
          onClick={() => {
            playClick()
            setPhase("quiz")
            setQIndex(0)
            setQuizScore(0)
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
          title="Exit Quiz"
        >
          ✕
        </button>
      )}

      {phase === "quiz" && (
        <div className="flex flex-col gap-6 w-full max-w-lg justify-center">
          <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
            <h2 className="text-xl font-bold text-foreground">
              Circadian Chronotype Quiz
            </h2>
            <span className="font-mono text-xs text-muted">
              Question {qIndex + 1}/{QUESTIONS.length}
            </span>
          </div>

          <p className="text-sm font-medium text-secondary">
            {QUESTIONS[qIndex].text}
          </p>

          <div className="flex flex-col gap-3">
            {QUESTIONS[qIndex].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleQuizAnswer(opt.score)}
                className="w-full text-left rounded-xl border border-card-border bg-subtle px-4 py-3.5 text-xs text-secondary font-medium transition-standard hover:border-accent hover:text-foreground hover:bg-card cursor-pointer"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "stroop" && (
        <div className="flex flex-col items-center gap-6 text-center max-w-sm w-full select-none">
          <span className="font-mono text-xs text-accent uppercase font-bold tracking-wider">
            Stroop Attention Fatigue Check ({stroopTrial}/5 trials)
          </span>
          <p className="text-xs text-muted">
            Click the button matching the literal ink color of the word shown below.
          </p>

          <div className="h-28 w-full rounded-xl border border-card-border bg-subtle/50 flex items-center justify-center font-extrabold text-4xl tracking-tight select-none">
            {stroopState === "ready" ? (
              <span style={{ color: `var(--color-${stroopTextColor})` }}>
                {stroopText.toUpperCase()}
              </span>
            ) : (
              <span className="text-muted animate-pulse">...</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {["red", "blue", "green", "yellow"].map((color) => (
              <button
                key={color}
                onClick={() => handleStroopChoice(color)}
                className="rounded-lg border border-card-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide transition-standard hover:border-accent cursor-pointer"
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider">
              Calculated chronobiology
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Your Chronobiology & Sanctuary Plan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SVG circular schedule dial */}
            <div className="flex flex-col gap-4 items-center justify-center">
              <h4 className="font-mono text-xs font-semibold text-muted uppercase self-start">
                24-Hour Circadian Schedule
              </h4>
              
              <div className="relative h-[240px] w-[240px] rounded-full border border-card-border bg-subtle flex items-center justify-center">
                <svg width="220" height="220" viewBox="-110 -110 220 220" className="transform -rotate-90">
                  {/* Dial circles */}
                  <circle cx="0" cy="0" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
                  <circle cx="0" cy="0" r="85" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />

                  {/* Arcs representation (simplified visual segments) */}
                  {/* Sleep Phase (Blue) */}
                  <path d="M 0,-100 A 100 100 0 0 1 70.7,-70.7" fill="none" stroke="#3b82f6" strokeWidth="8" />
                  {/* Focus Phase (Gold) */}
                  <path d="M 70.7,70.7 A 100 100 0 0 1 -70.7,70.7" fill="none" stroke="#f59e0b" strokeWidth="8" />
                  {/* Wind Down (Purple) */}
                  <path d="M -70.7,-70.7 A 100 100 0 0 1 0,-100" fill="none" stroke="#8b5cf6" strokeWidth="8" />
                </svg>

                <div className="absolute flex flex-col items-center text-center gap-0.5">
                  <span className="font-mono text-[10px] text-muted uppercase">Chronotype</span>
                  <span className="text-xl font-extrabold text-accent">{chronotype}</span>
                </div>
              </div>
            </div>

            {/* Caffeine clearance decay simulator */}
            <div className="flex flex-col gap-5 justify-center">
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-4">
                <h5 className="font-sans font-bold text-foreground text-sm">
                  Caffeine Decay Simulator
                </h5>
                <p className="text-xs leading-normal text-muted">
                  Simulate caffeine residual remaining in your body at bedtime ({arcs.sleepStart}:00) based on your metabolic clearance speed.
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>Metabolic Half-Life:</span>
                    <span className="font-bold text-foreground">{caffeineDecayHrs} hours</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={caffeineDecayHrs}
                    onChange={(e) => setCaffeineDecayHrs(Number(e.target.value))}
                    className="w-full h-1.5 bg-card rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono border-t border-card-border/60 pt-3">
                  <span className="text-muted">Residual caffeine at bedtime:</span>
                  <span className={`font-bold ${caffeineLeft > 15 ? "text-error" : "text-success"}`}>
                    {caffeineLeft}%
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setPhase("quiz")}
                  className="btn-base btn-primary flex-1 cursor-pointer py-2.5 text-sm font-semibold rounded-lg"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Curated Affiliate Recommendations */}
          <div className="border-t border-card-border/60 pt-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>🛌</span> Biohacking Sleep Sanctuary Equipment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Temperature */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Temperature Control
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Eight Sleep Pod 4 Cover
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Dynamically cools or heats your mattress cover in alignment with your calculated circadian profile peaks.
                </p>
                <a
                  href="https://www.eightsleep.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Pod (~$2250)
                </a>
              </div>

              {/* Smart Ring */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Biometric Tracker
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Oura Ring Gen3
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Log your daily sleep efficiency index. Monitors HRV, blood oxygen, and temperature variations.
                </p>
                <a
                  href="https://amzn.to/4f0mP3l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Oura (~$349)
                </a>
              </div>

              {/* Air quality */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Air Quality
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Dyson Purifier Cool
                </h4>
                <p className="text-xs leading-normal text-muted">
                  HEPA air filtration system to eliminate micro-particles and control bedroom airflow for clean respiration.
                </p>
                <a
                  href="https://amzn.to/3W0P4nQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research Dyson (~$650)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withErrorBoundary(SleepSanctuary)
