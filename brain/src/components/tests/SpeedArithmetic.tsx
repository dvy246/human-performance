import React, { useState, useEffect, useRef } from "react"
import { withErrorBoundary } from "@/components/ui/withErrorBoundary"
import { dataLayer } from "../../runtime/dataLayer"
import { useSound } from "../../runtime/useSound"
import { useVisibilityGuard } from "../../runtime/useVisibilityGuard"

type GamePhase = "config" | "playing" | "result"
type Difficulty = "easy" | "medium" | "hard"

interface AnswerAttempt {
  equation: string
  operator: string
  correctAnswer: number
  userAnswer: number
  isCorrect: boolean
  rt: number // response time in ms
}

export function SpeedArithmetic() {
  const { playClick, playSuccess, playError } = useSound()
  const [phase, setPhase] = useState<GamePhase>("config")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  
  // Game states
  const [equation, setEquation] = useState<string>("")
  const [operator, setOperator] = useState<string>("+")
  const [correctAnswer, setCorrectAnswer] = useState<number>(0)
  const [inputValue, setInputValue] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [attempts, setAttempts] = useState<AnswerAttempt[]>([])
  
  // Leaderboard / Personal best
  const [personalBest, setPersonalBest] = useState<number | null>(null)

  const timerRef = useRef<any>(null)
  const trialStartTimeRef = useRef<number>(0)
  const attemptsRef = useRef<AnswerAttempt[]>([])
  const activeRef = useRef<boolean>(false)

  useEffect(() => {
    dataLayer.getPersonalBest("speed-arithmetic", "higher") // higher is better for math scores (completed count)
      .then(pb => setPersonalBest(pb))
      .catch(err => console.error("Error loading speed arithmetic PB:", err))

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useVisibilityGuard(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase("config")
  }, phase === "playing")

  // Start the 60-second math blitz
  const startTest = () => {
    playClick()
    setPhase("playing")
    setTimeLeft(60)
    setAttempts([])
    attemptsRef.current = []
    setInputValue("")
    activeRef.current = true
    generateQuestion()

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          endTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Finalize and save scores
  const endTest = async () => {
    activeRef.current = false
    setPhase("result")
    playSuccess()

    const correctCount = attemptsRef.current.filter(a => a.isCorrect).length
    try {
      await dataLayer.saveSession({
        testId: "speed-arithmetic",
        category: "reasoning",
        rawScore: correctCount, // Store correct answer count as rawScore
        percentile: Math.min(99, Math.round((correctCount / 30) * 100)), // dynamic estimate
        metadata: {
          difficulty,
          totalQuestions: attemptsRef.current.length,
          correctAnswers: correctCount,
          accuracy: attemptsRef.current.length > 0 
            ? Math.round((correctCount / attemptsRef.current.length) * 100)
            : 0
        }
      })
      const pb = await dataLayer.getPersonalBest("speed-arithmetic", "higher")
      setPersonalBest(pb)
    } catch (err) {
      console.error("Failed to save speed arithmetic results:", err)
    }
  }

  // Generates math questions based on difficulty level
  const generateQuestion = () => {
    let num1 = 0
    let num2 = 0
    let op = "+"
    const ops = ["+", "-", "*"]
    op = ops[Math.floor(Math.random() * ops.length)]
    
    if (difficulty === "easy") {
      // 1-digit calculations
      num1 = Math.floor(Math.random() * 9) + 1
      num2 = Math.floor(Math.random() * 9) + 1
      // Keep subtraction positive for easy
      if (op === "-" && num1 < num2) {
        const tmp = num1
        num1 = num2
        num2 = tmp
      }
    } else if (difficulty === "medium") {
      if (op === "*") {
        // 1-digit x 2-digit multiplication
        num1 = Math.floor(Math.random() * 8) + 2 // 2-9
        num2 = Math.floor(Math.random() * 15) + 2 // 2-16
      } else {
        // 2-digit calculations
        num1 = Math.floor(Math.random() * 80) + 10 // 10-89
        num2 = Math.floor(Math.random() * 80) + 10
      }
    } else {
      // Hard
      if (op === "*") {
        // 2-digit x 2-digit multiplication
        num1 = Math.floor(Math.random() * 10) + 10 // 10-19
        num2 = Math.floor(Math.random() * 15) + 10 // 10-24
      } else {
        // 3-digit calculations
        num1 = Math.floor(Math.random() * 800) + 100 // 100-899
        num2 = Math.floor(Math.random() * 800) + 100
      }
    }

    let correct = 0
    if (op === "+") correct = num1 + num2
    else if (op === "-") correct = num1 - num2
    else correct = num1 * num2

    setEquation(`${num1} ${op} ${num2}`)
    setOperator(op)
    setCorrectAnswer(correct)
    setInputValue("")
    trialStartTimeRef.current = performance.now()
  }

  // Handle number keyboard click or physical keyboard entry
  const handleKeypadPress = (val: string) => {
    if (phase !== "playing") return
    playClick()
    if (val === "clear") {
      setInputValue("")
    } else if (val === "minus") {
      if (inputValue === "") {
        setInputValue("-")
      }
    } else {
      setInputValue((prev) => prev + val)
    }
  }

  // Submit answer
  const submitAnswer = () => {
    if (phase !== "playing") return
    const userNum = parseInt(inputValue, 10)
    if (isNaN(userNum)) {
      playError()
      return
    }

    const rt = performance.now() - trialStartTimeRef.current
    const isCorrect = userNum === correctAnswer

    if (isCorrect) {
      playSuccess()
    } else {
      playError()
    }

    const newAttempt: AnswerAttempt = {
      equation,
      operator,
      correctAnswer,
      userAnswer: userNum,
      isCorrect,
      rt,
    }

    attemptsRef.current.push(newAttempt)
    setAttempts([...attemptsRef.current])

    generateQuestion()
  }

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "playing") return
      if (e.key >= "0" && e.key <= "9") {
        setInputValue((prev) => prev + e.key)
      } else if (e.key === "-") {
        if (inputValue === "") {
          setInputValue("-")
        }
      } else if (e.key === "Backspace") {
        setInputValue((prev) => prev.slice(0, -1))
      } else if (e.key === "Enter") {
        submitAnswer()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, inputValue, correctAnswer, equation, operator])

  // Custom stats parsing for final dashboard
  const operatorBreakdown = () => {
    const operators = ["+", "-", "*"]
    return operators.map((op) => {
      const opsAttempts = attempts.filter((a) => a.operator === op)
      const correct = opsAttempts.filter((a) => a.isCorrect).length
      const avgRt = opsAttempts.length > 0
        ? Math.round(opsAttempts.reduce((sum, v) => sum + v.rt, 0) / opsAttempts.length)
        : 0
      const accuracy = opsAttempts.length > 0 ? Math.round((correct / opsAttempts.length) * 100) : 0
      return { op, total: opsAttempts.length, correct, avgRt, accuracy }
    })
  }

  const breakdown = operatorBreakdown()
  const correctCount = attempts.filter((a) => a.isCorrect).length
  const overallAccuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0
  const avgResponseTime = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.rt, 0) / attempts.length)
    : 0

  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all md:p-8">
      {/* exit '✕' button */}
      {phase !== "config" && (
        <button
          onClick={() => {
            playClick()
            if (timerRef.current) clearInterval(timerRef.current)
            setPhase("config")
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-subtle text-muted transition-standard hover:border-accent hover:text-foreground cursor-pointer"
          title="Exit game"
        >
          ✕
        </button>
      )}

      {phase === "config" && (
        <div className="flex flex-col items-center text-center gap-6 max-w-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Speed Arithmetic & Agility Blitz
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Benchmark your working memory, calculations capacity, and visual math processing under timed pressure. Complete as many correct arithmetic equations as possible in 60 seconds.
          </p>

          <div className="flex gap-3 justify-center w-full max-w-xs">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => { playClick(); setDifficulty(level) }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-standard cursor-pointer ${
                  difficulty === level 
                    ? "bg-accent/10 border-accent text-accent" 
                    : "bg-subtle border-card-border text-muted hover:border-card-border/80"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          {personalBest !== null && (
            <div className="rounded-lg border border-card-border bg-subtle px-4 py-2 font-mono text-xs text-secondary">
              Personal Best: <span className="font-semibold text-accent">{personalBest} correct</span>
            </div>
          )}

          <button
            onClick={startTest}
            className="btn-base btn-primary w-full max-w-xs cursor-pointer shadow-lg shadow-accent/25 py-3 text-sm font-semibold rounded-xl"
          >
            Start Math Blitz
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Progress bar / timer */}
          <div className="w-full flex items-center justify-between font-mono text-xs text-muted">
            <span>Time Left: {timeLeft}s</span>
            <span>Correct: {attempts.filter(a => a.isCorrect).length}</span>
          </div>
          <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden border border-card-border/60">
            <div 
              className="bg-accent h-full transition-all duration-1000" 
              style={{ width: `${(timeLeft / 60) * 100}%` }} 
            />
          </div>

          {/* Equation display */}
          <div className="h-28 w-full rounded-2xl border border-card-border bg-subtle flex flex-col items-center justify-center font-extrabold text-4xl tracking-tight select-none">
            <div>{equation}</div>
            <div className="h-8 mt-2 font-mono text-xl text-accent">
              {inputValue || <span className="text-muted/30">type answer...</span>}
            </div>
          </div>

          {/* On-screen mobile keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mt-2 select-none">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "minus", "0", "clear"].map((k) => {
              let label = k
              if (k === "minus") label = "-"
              if (k === "clear") label = "⌫"
              return (
                <button
                  key={k}
                  onClick={() => handleKeypadPress(k)}
                  className="h-11 w-full rounded-lg border border-card-border bg-card font-mono text-sm font-semibold text-foreground transition-standard hover:border-accent hover:text-accent cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  {label}
                </button>
              )
            })}
            <button
              onClick={submitAnswer}
              className="col-span-3 h-11 rounded-lg bg-accent text-white font-mono text-xs font-semibold uppercase tracking-wider transition-standard hover:bg-accent-hover cursor-pointer active:scale-95 flex items-center justify-center"
            >
              ↵ Submit
            </button>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider">
              Arithmetic Diagnostic Score
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Your Quantitative Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SVG Operator Breakdown Chart */}
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-muted uppercase">
                Performance by Operator
              </h4>
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-4">
                {breakdown.map((item) => (
                  <div key={item.op} className="flex flex-col gap-1 text-xs font-mono text-secondary">
                    <div className="flex justify-between">
                      <span>Operator: {item.op === "*" ? "× (Multiplication)" : item.op}</span>
                      <span>{item.correct}/{item.total} correct ({item.accuracy}%)</span>
                    </div>
                    <div className="h-3 w-full bg-card rounded-md overflow-hidden flex border border-card-border/60">
                      <div 
                        className="bg-accent h-full" 
                        style={{ width: `${item.accuracy}%` }} 
                      />
                    </div>
                    {item.total > 0 && (
                      <div className="text-[10px] text-muted text-right">
                        Speed: {item.avgRt} ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Score Metrics and retry button */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3 font-mono text-xs text-muted">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-sans font-medium text-foreground">Score (Correct Answers):</span>
                  <span className="text-2xl font-extrabold text-accent">{correctCount}</span>
                </div>
                <div className="flex justify-between border-t border-card-border/60 pt-3">
                  <span>Overall Accuracy:</span>
                  <span className="font-bold text-foreground">{overallAccuracy}%</span>
                </div>
                <div className="flex justify-between border-t border-card-border/60 pt-3">
                  <span>Avg Response Time:</span>
                  <span className="font-bold text-foreground">{avgResponseTime} ms</span>
                </div>
              </div>

              <button
                onClick={startTest}
                className="btn-base btn-primary w-full cursor-pointer py-3 text-sm font-semibold rounded-lg"
              >
                Restart Math Blitz
              </button>
            </div>
          </div>

          {/* Curated Affiliate Recommendations */}
          <div className="border-t border-card-border/60 pt-8 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>📚</span> Recommended Quantitative Training Assets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Quant prep book */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Finance Interview Prep
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Heard on the Street
                </h4>
                <p className="text-xs leading-normal text-muted">
                  The primary quantitative research study text for investment banking, market making, and proprietary trading algorithms.
                </p>
                <a
                  href="https://amzn.to/3W0P4nQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Research book (~$180)
                </a>
              </div>

              {/* Brilliant subscription */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Interactive Learning
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Brilliant.org Premium
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Interactive logic puzzles, computer science foundations, mathematics matrices, and neural networks courses.
                </p>
                <a
                  href="https://brilliant.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full text-center border border-card-border bg-card px-3 py-1.5 rounded text-xs font-semibold text-foreground transition-standard hover:border-accent hover:text-accent font-mono cursor-pointer"
                >
                  Explore Premium (~$149/yr)
                </a>
              </div>

              {/* Split keyboard */}
              <div className="rounded-xl border border-card-border bg-subtle p-5 flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold">
                  Speed Input Hardware
                </span>
                <h4 className="font-bold text-sm text-foreground">
                  Kinesis Advantage360
                </h4>
                <p className="text-xs leading-normal text-muted">
                  Ortholinear layout with split keyboard columns to align forearm layout, maximizing fast numerical input operations.
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

export default withErrorBoundary(SpeedArithmetic)
