import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { withI18n } from "@/components/ui/withI18n"
import { dataLayer } from "../../runtime/dataLayer"
import { useSound } from "../../runtime/useSound"
import { generateQuestion, type QuantQuestion } from "../../lib/mathEngine"
import { saveToLocalStorage, loadFromLocalStorage } from "../../lib/storage"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type GamePhase = "config" | "playing" | "result"
type Difficulty = "easy" | "medium" | "hard"

interface TrialAttempt {
  expression: string
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
  rt: number // response time in ms
}

interface QuantGridProps {
  t: (key: string) => string
  lang: string
}

function QuantGrid({ t, lang }: QuantGridProps) {
  const { playClick, playSuccess, playError } = useSound()
  const [phase, setPhase] = useState<GamePhase>("config")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [showHelp, setShowHelp] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<QuantQuestion | null>(null)
  const [inputValue, setInputValue] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [attempts, setAttempts] = useState<TrialAttempt[]>([])
  const [personalBest, setPersonalBest] = useState<number | null>(null)

  // Refs for tracking performance
  const timerRef = useRef<any>(null)
  const startTimeRef = useRef<number>(0)
  const attemptsRef = useRef<TrialAttempt[]>([])
  const activeRef = useRef<boolean>(false)

  // Load personal best & check onboarding visibility
  useEffect(() => {
    dataLayer.getPersonalBest("quant-dev-grid", "higher")
      .then(pb => setPersonalBest(pb))
      .catch(err => console.error("Error loading quant-dev PB:", err))

    const hasSeen = loadFromLocalStorage<boolean>("hasSeenQuantOnboarding", false)
    if (!hasSeen) {
      setShowOnboarding(true)
    }
  }, [])

  useVisibilityGuard(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase("config")
  }, phase === "playing")

  const startTest = () => {
    playClick()
    setPhase("playing")
    setTimeLeft(60)
    setAttempts([])
    attemptsRef.current = []
    setInputValue("")
    activeRef.current = true
    nextTrial()

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          finishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const nextTrial = () => {
    const q = generateQuestion(difficulty)
    setCurrentQuestion(q)
    setInputValue("")
    startTimeRef.current = performance.now()
  }

  const handleKeypad = (val: string) => {
    if (phase !== "playing") return
    playClick()
    if (val === "clear") {
      setInputValue("")
    } else {
      setInputValue((prev) => prev + val)
    }
  }

  const submitAnswer = () => {
    if (phase !== "playing" || !currentQuestion) return
    const cleanedInput = inputValue.trim().toUpperCase()
    const isCorrect = cleanedInput === currentQuestion.answer.toUpperCase()
    const rt = performance.now() - startTimeRef.current

    if (isCorrect) {
      playSuccess()
    } else {
      playError()
    }

    const newAttempt: TrialAttempt = {
      expression: currentQuestion.expression,
      correctAnswer: currentQuestion.answer,
      userAnswer: cleanedInput,
      isCorrect,
      rt,
    }

    attemptsRef.current.push(newAttempt)
    setAttempts([...attemptsRef.current])
    nextTrial()
  }

  const finishTest = async () => {
    activeRef.current = false
    setPhase("result")
    playSuccess()

    const correctCount = attemptsRef.current.filter(a => a.isCorrect).length
    try {
      await dataLayer.saveSession({
        testId: "quant-dev-grid",
        category: "reasoning",
        rawScore: correctCount,
        percentile: Math.min(99, Math.round((correctCount / 20) * 100)),
        metadata: {
          difficulty,
          totalQuestions: attemptsRef.current.length,
          correctAnswers: correctCount,
          accuracy: attemptsRef.current.length > 0 
            ? Math.round((correctCount / attemptsRef.current.length) * 100)
            : 0
        }
      })
      const pb = await dataLayer.getPersonalBest("quant-dev-grid", "higher")
      setPersonalBest(pb)
    } catch (err) {
      console.error("Error saving Quant Grid session:", err)
    }
  }

  // Monitor physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "playing") return
      const validChars = /^[0-9a-fA-F\-xX()<>+=]$/
      if (validChars.test(e.key)) {
        setInputValue((prev) => prev + e.key)
      } else if (e.key === "Backspace") {
        setInputValue((prev) => prev.slice(0, -1))
      } else if (e.key === "Enter") {
        submitAnswer()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, currentQuestion, inputValue])

  const correctAttempts = attempts.filter(a => a.isCorrect).length
  const accuracy = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0
  const avgRt = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.rt, 0) / attempts.length)
    : 0

  // Close onboarding flow and persist
  const closeOnboarding = () => {
    saveToLocalStorage("hasSeenQuantOnboarding", true)
    setShowOnboarding(false)
  }

  // Draw response latency line SVG
  const renderLatencySVG = () => {
    if (attempts.length === 0) return null
    const width = 360
    const height = 150
    const padding = 20
    
    const maxRt = Math.max(...attempts.map(a => a.rt), 1000)
    const points = attempts.map((a, idx) => {
      const x = padding + (idx / (attempts.length - 1 || 1)) * (width - padding * 2)
      const y = height - padding - (a.rt / maxRt) * (height - padding * 2)
      return { x, y, ...a }
    })

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-zinc-950 rounded-xl border border-card-border/60">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3f3f46" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#3f3f46" strokeWidth="1" />
        
        {/* Draw Line connecting points */}
        {points.length > 1 && (
          <path
            d={points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none"
            stroke="#ea580c"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        )}

        {/* Draw Points */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={p.isCorrect ? "#10b981" : "#ef4444"}
            className="cursor-pointer hover:r-6 transition-all"
          >
            <title>{`Attempt #${idx + 1}: ${p.expression} = ${p.userAnswer} (${Math.round(p.rt)}ms)`}</title>
          </circle>
        ))}
      </svg>
    )
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl border border-card-border bg-card shadow-2xl p-6 font-sans">
      
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-xl border border-card-border bg-card p-6 shadow-2xl font-mono text-xs">
            <h3 className="text-sm font-bold text-accent mb-4 border-b border-card-border pb-2 uppercase tracking-widest">
              system_init // quant_dev_onboarding
            </h3>

            {onboardingStep === 0 && (
              <div className="flex flex-col gap-3 text-secondary leading-relaxed">
                <p>Welcome to the <strong className="text-foreground">Quant-Dev Agility Grid</strong>. This is a specialized mental calculation environment designed to test and benchmark cognitive processing throughput under developer logical scenarios.</p>
                <p className="text-accent font-semibold">Targets: Bitwise Shifts, Boolean Logic Gates, Hexadecimal Sums.</p>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="flex flex-col gap-3 text-secondary leading-relaxed">
                <p>You have exactly <strong className="text-foreground">60 seconds</strong> to solve as many arithmetic equations as possible.</p>
                <div className="bg-zinc-950 p-3 rounded-md text-emerald-400 border border-card-border/50">
                  <span className="text-zinc-600">// Examples:</span>
                  <div>2 &lt;&lt; 1 = 4</div>
                  <div>1 XOR 0 = 1</div>
                  <div>0x0B + 0x05 = 10 (in base 16)</div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="flex flex-col gap-3 text-secondary leading-relaxed">
                <p>Use your physical keyboard or the responsive on-screen hex keypad to submit answers fast.</p>
                <p>Track your score card, analyze your latency logs, and compare benchmarks against role profiles.</p>
              </div>
            )}

            <div className="mt-6 flex justify-between gap-3">
              {onboardingStep > 0 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="px-4 py-2 border border-card-border rounded text-muted hover:text-foreground cursor-pointer h-11 flex-1"
                >
                  Prev
                </button>
              ) : (
                <div className="flex-1" />
              )}

              <button
                onClick={() => {
                  if (onboardingStep < 2) {
                    setOnboardingStep(onboardingStep + 1)
                  } else {
                    closeOnboarding()
                  }
                }}
                className="px-4 py-2 bg-accent text-white font-bold rounded hover:opacity-90 cursor-pointer h-11 flex-1 text-center"
              >
                {onboardingStep === 2 ? "Execute" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar / Quit button */}
      <div className="flex justify-between items-center mb-6 border-b border-card-border pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <h2 className="font-mono text-sm tracking-widest text-muted uppercase">
            quant_bench_terminal_v1.0
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
            title="Help / Rules"
          >
            ?
          </button>
          {phase !== "config" && (
            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setPhase("config")
              }}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
              title="Quit Test"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Collapsible How It Works instructions */}
      {showHelp && (
        <div className="mb-6 rounded-xl border border-accent/25 bg-accent/5 p-4 text-xs font-mono leading-relaxed text-secondary transition-all">
          <h4 className="font-bold text-accent uppercase mb-2">Instructions & Mechanics:</h4>
          <ul className="list-disc pl-4 flex flex-col gap-1.5">
            <li><strong>Bitwise Shifts:</strong> <code className="text-foreground">X &lt;&lt; Y</code> multiplies X by 2^Y. <code className="text-foreground">X &gt;&gt; Y</code> divides X by 2^Y.</li>
            <li><strong>Logic Gates:</strong> Perform <code className="text-foreground">AND, OR, XOR</code> binary checks on Boolean operands.</li>
            <li><strong>Hexadecimal:</strong> Base-16 math. Answers should be written in clean Hex values (e.g. A, B, C, D, E, F, or numerical hex combinations).</li>
          </ul>
        </div>
      )}

      {/* Main Terminal Screen container */}
      <div className="w-full bg-zinc-950 rounded-2xl border border-card-border/80 p-5 md:p-8 text-emerald-400 font-mono relative overflow-hidden min-h-[360px] flex flex-col justify-center">
        
        {phase === "config" && (
          <div className="flex flex-col items-center justify-center text-center gap-6 max-w-lg mx-auto">
            <div className="text-amber-500 text-3xl font-extrabold tracking-wider">
              [SYSTEM STATUS: READY]
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verify calculations throughput, logic chains gate response lag, and bitwise parsing latency. System defaults to 60s runtime checks.
            </p>

            <div className="flex gap-2 w-full max-w-xs select-none">
              {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => { playClick(); setDifficulty(level) }}
                  className={`flex-1 h-11 border rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                    difficulty === level
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {personalBest !== null && (
              <div className="text-xs text-zinc-500">
                // local_best_run: <span className="text-accent">{personalBest} operations</span>
              </div>
            )}

            <button
              onClick={startTest}
              className="h-12 w-full max-w-xs rounded-xl bg-accent text-white font-bold tracking-wider hover:opacity-90 transition-all cursor-pointer active:scale-95 text-sm flex items-center justify-center"
            >
              $ ./init_test_run
            </button>
          </div>
        )}

        {phase === "playing" && currentQuestion && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            {/* HUD / Indicators */}
            <div className="w-full flex justify-between text-xs text-zinc-500 border-b border-zinc-900 pb-2">
              <span>timer: {timeLeft}s</span>
              <span>difficulty: {difficulty}</span>
              <span>correct_ops: {attempts.filter(a => a.isCorrect).length}</span>
            </div>

            {/* Logical Expression block */}
            <div className="text-center font-bold text-3xl text-zinc-100 py-6 tracking-wide select-none">
              {currentQuestion.expression}
            </div>

            {/* Terminal Input Mockup */}
            <div className="w-full flex items-center gap-2 border-b border-zinc-800 pb-2 text-xl font-bold">
              <span className="text-accent">guest@cogniarena:~$</span>
              <div className="flex-1 text-emerald-400 outline-none flex items-center gap-1 font-mono">
                {inputValue}
                <span className="animate-pulse bg-emerald-400 h-6 w-1.5" />
              </div>
            </div>

            {/* Terminal Keypad */}
            <div className="grid grid-cols-4 gap-2 w-full select-none mt-2">
              {["7", "8", "9", "A", "4", "5", "6", "B", "1", "2", "3", "C", "0", "D", "E", "F", "clear", "-", "(", ")"].map((key) => {
                let display = key
                if (key === "clear") display = "⌫"
                return (
                  <button
                    key={key}
                    onClick={() => handleKeypad(key)}
                    className="h-11 rounded border border-zinc-800 bg-zinc-900 font-mono text-sm font-semibold text-zinc-300 hover:border-accent hover:text-accent cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {display}
                  </button>
                )
              })}
              <button
                onClick={submitAnswer}
                className="col-span-4 h-11 rounded bg-accent text-white font-mono text-xs font-semibold uppercase tracking-widest hover:opacity-90 cursor-pointer active:scale-95 flex items-center justify-center"
              >
                $ execute_input
              </button>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="flex flex-col gap-6 w-full">
            <div className="text-center">
              <div className="text-accent text-sm font-bold uppercase tracking-wider">// evaluation_completed</div>
              <h3 className="text-2xl font-bold text-zinc-100 mt-1">Quant Agility Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4 text-xs">
              {/* Latency Plot */}
              <div className="flex flex-col gap-3">
                <span className="text-zinc-500">// logical_response_latency_plot</span>
                {renderLatencySVG()}
              </div>

              {/* Data Dashboard */}
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Operations Completed:</span>
                    <span className="text-accent text-lg">{correctAttempts} / {attempts.length}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-3 text-zinc-400">
                    <span>Accuracy:</span>
                    <span className="font-bold text-zinc-200">{accuracy}%</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-3 text-zinc-400">
                    <span>Mean Processing Lag:</span>
                    <span className="font-bold text-zinc-200">{avgRt} ms</span>
                  </div>
                </div>

                <button
                  onClick={startTest}
                  className="h-11 rounded-lg bg-accent text-white font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  $ ./restart_terminal
                </button>
              </div>
            </div>

            {/* High Ticket Affiliate Section */}
            <div className="border-t border-zinc-800 pt-6 mt-4">
              <h4 className="font-bold text-sm text-zinc-200 mb-4">// recommended_development_rig_upgrades</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-zinc-400">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-4 flex flex-col gap-2">
                  <span className="text-accent font-bold">Ortholinear Input</span>
                  <h5 className="font-bold text-zinc-200">Kinesis Advantage360</h5>
                  <p className="leading-relaxed">Split key configuration mapped to natural forearm alignments. Drastically improves input rates.</p>
                  <a
                    href="https://kinesis-ergo.com/keyboards/advantage360/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block text-center border border-zinc-800 px-3 py-1 rounded text-zinc-300 hover:border-accent hover:text-accent font-mono cursor-pointer"
                  >
                    advantage360.spec (~$449)
                  </a>
                </div>

                <div className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-4 flex flex-col gap-2">
                  <span className="text-accent font-bold">Logic Training</span>
                  <h5 className="font-bold text-zinc-200">Brilliant.org Premium</h5>
                  <p className="leading-relaxed">Advanced study paths on computational matrices, algorithm complexities, and logical neural layers.</p>
                  <a
                    href="https://brilliant.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block text-center border border-zinc-800 px-3 py-1 rounded text-zinc-300 hover:border-accent hover:text-accent font-mono cursor-pointer"
                  >
                    brilliant_sub.spec (~$149/yr)
                  </a>
                </div>

                <div className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-4 flex flex-col gap-2">
                  <span className="text-accent font-bold">Wall Street Quant</span>
                  <h5 className="font-bold text-zinc-200">Heard on the Street</h5>
                  <p className="leading-relaxed">The ultimate quantitative and algorithmic practice curriculum for institutional job roles.</p>
                  <a
                    href="https://amzn.to/3W0P4nQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block text-center border border-zinc-800 px-3 py-1 rounded text-zinc-300 hover:border-accent hover:text-accent font-mono cursor-pointer"
                  >
                    books_heard_street.spec (~$180)
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default withI18n(withErrorBoundary(QuantGrid))
