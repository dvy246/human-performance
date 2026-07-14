import React, { useState } from "react"

type Style = "visual" | "verbal" | "analytical" | "holistic"

interface Choice {
  text: string
  style: Style
}

interface CQQuestion {
  prompt: string
  choices: Choice[]
}

const questions: CQQuestion[] = [
  {
    prompt: "When trying to understand a complex topic, you prefer:",
    choices: [
      { text: "Looking at diagrams, charts, or mind maps", style: "visual" },
      {
        text: "Reading or listening to detailed explanations",
        style: "verbal",
      },
      { text: "Breaking it down into step-by-step logic", style: "analytical" },
      {
        text: "Getting the big picture first, then filling in details",
        style: "holistic",
      },
    ],
  },
  {
    prompt: "When solving a problem, you tend to:",
    choices: [
      {
        text: "Picture the solution in your mind before acting",
        style: "visual",
      },
      {
        text: "Talk through the problem out loud or write it down",
        style: "verbal",
      },
      { text: "Use systematic logic — if A then B, etc.", style: "analytical" },
      { text: "Trust your intuition and look for patterns", style: "holistic" },
    ],
  },
  {
    prompt: "You remember things best when you:",
    choices: [
      {
        text: "Saw them in an image, video, or demonstration",
        style: "visual",
      },
      { text: "Heard them explained or discussed them", style: "verbal" },
      {
        text: "Understood the underlying rules and structure",
        style: "analytical",
      },
      { text: "Related them to a broader concept or story", style: "holistic" },
    ],
  },
  {
    prompt: "In a group discussion, you are most likely to:",
    choices: [
      { text: "Sketch out ideas on a whiteboard or notepad", style: "visual" },
      {
        text: "Explain your reasoning with words and examples",
        style: "verbal",
      },
      {
        text: "Point out logical flaws or inconsistencies",
        style: "analytical",
      },
      {
        text: "Synthesize different viewpoints into a shared vision",
        style: "holistic",
      },
    ],
  },
  {
    prompt: "When learning a new skill, you:",
    choices: [
      { text: "Watch someone else do it first", style: "visual" },
      {
        text: "Read the instructions or listen to a walkthrough",
        style: "verbal",
      },
      {
        text: "Follow a structured curriculum with clear milestones",
        style: "analytical",
      },
      { text: "Jump in and experiment, learning by doing", style: "holistic" },
    ],
  },
  {
    prompt: "You make decisions based primarily on:",
    choices: [
      {
        text: "What feels intuitively right after weighing options",
        style: "visual",
      },
      { text: "A careful analysis of pros and cons", style: "analytical" },
      {
        text: "What aligns with your values and the bigger picture",
        style: "verbal",
      },
      {
        text: "Concrete data, evidence, and observable facts",
        style: "analytical",
      },
    ],
  },
  {
    prompt: "Your ideal work environment involves:",
    choices: [
      { text: "Whiteboards, visual boards, and design tools", style: "visual" },
      {
        text: "Quiet space for reading, writing, and discussion",
        style: "verbal",
      },
      {
        text: "Spreadsheets, structured data, and clear processes",
        style: "analytical",
      },
      {
        text: "Collaborative open space with room for brainstorming",
        style: "holistic",
      },
    ],
  },
  {
    prompt: "Which statement describes you best?",
    choices: [
      { text: "I think in pictures and mental images", style: "visual" },
      { text: "I think in words and internal dialogue", style: "verbal" },
      {
        text: "I think in systems, rules, and logical sequences",
        style: "analytical",
      },
      {
        text: "I think in concepts, connections, and overarching themes",
        style: "holistic",
      },
    ],
  },
]

const styleData: Record<
  Style,
  { label: string; icon: string; desc: string; strengths: string[] }
> = {
  visual: {
    label: "Visual Thinker",
    icon: "👁️",
    desc: "You process information best through images, diagrams, and spatial arrangements. Your mind naturally maps concepts to visual patterns, making you skilled at design, navigation, and recognizing relationships at a glance.",
    strengths: [
      "Spatial reasoning",
      "Pattern recognition",
      "Design intuition",
      "Mind mapping",
    ],
  },
  verbal: {
    label: "Verbal Thinker",
    icon: "💬",
    desc: "You think in words and language. Concepts come alive for you through reading, writing, and discussion. Your strength lies in articulating ideas clearly, making connections through language, and reasoning through narrative.",
    strengths: [
      "Written expression",
      "Vocabulary recall",
      "Argumentation",
      "Explaining concepts",
    ],
  },
  analytical: {
    label: "Analytical Thinker",
    icon: "🔍",
    desc: "You approach the world through logic, systems, and structured reasoning. You excel at breaking complex problems into manageable parts, following chains of cause and effect, and identifying inconsistencies in arguments.",
    strengths: [
      "Critical thinking",
      "Systematic problem solving",
      "Data analysis",
      "Logical reasoning",
    ],
  },
  holistic: {
    label: "Holistic Thinker",
    icon: "🌐",
    desc: "You see the big picture first. Rather than getting lost in details, you naturally synthesize information from multiple sources into coherent wholes. Your strength is understanding how everything connects.",
    strengths: [
      "Big-picture thinking",
      "Synthesizing ideas",
      "Strategic insight",
      "Creativity",
    ],
  },
}

type Phase = "start" | "playing" | "result"

export default function CognitiveStyleQuiz() {
  const [phase, setPhase] = useState<Phase>("start")
  const [current, setCurrent] = useState(0)
  const [scores, setScores] = useState<Record<Style, number>>({
    visual: 0,
    verbal: 0,
    analytical: 0,
    holistic: 0,
  })

  function handleSelect(style: Style) {
    setScores((prev) => ({ ...prev, [style]: prev[style] + 1 }))
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      setPhase("result")
    }
  }

  function handleRestart() {
    setPhase("start")
    setCurrent(0)
    setScores({ visual: 0, verbal: 0, analytical: 0, holistic: 0 })
  }

  if (phase === "start") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-8 text-center">
        <span className="text-5xl">💭</span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Cognitive Style Quiz
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          8 quick questions to discover how you naturally process information.
          Are you a visual, verbal, analytical, or holistic thinker?
        </p>
        <button
          onClick={() => setPhase("playing")}
          className="transition-standard rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  if (phase === "result") {
    const sorted = (Object.entries(scores) as [Style, number][]).sort(
      (a, b) => b[1] - a[1]
    )
    const primary = sorted[0][0]
    const data = styleData[primary]
    const secondary = sorted[1][0]

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">{data.icon}</span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {data.label}
          </h2>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-subtle p-5">
          <p className="text-sm leading-relaxed text-muted">{data.desc}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {data.strengths.map((s) => (
              <span
                key={s}
                className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Your Style Breakdown
          </h3>
          <div className="flex flex-col gap-2">
            {sorted.map(([style, score]) => {
              const pct = Math.round((score / questions.length) * 100)
              const isPrimary = style === primary
              return (
                <div key={style} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-muted">
                    {styleData[style].icon}{" "}
                    {styleData[style].label.split(" ")[0]}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-card-border">
                    <div
                      className={`h-full rounded-full transition-all ${isPrimary ? "bg-accent" : "bg-accent/30"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-muted">
                    {score}/{questions.length}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {secondary && (
          <div className="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted">
            <strong className="text-foreground">Secondary style:</strong>{" "}
            {styleData[secondary].label} &mdash;{" "}
            {styleData[secondary].desc.split(".")[0]}.
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleRestart}
            className="transition-standard rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-mono">
          Question {current + 1} / {questions.length}
        </span>
        <span>Cognitive Style</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-subtle p-5">
        <p className="text-sm leading-relaxed font-medium text-foreground">
          {q.prompt}
        </p>

        <div className="flex flex-col gap-2">
          {q.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleSelect(choice.style)}
              className="transition-standard flex cursor-pointer items-center gap-3 rounded-lg border border-card-border p-3 text-left text-sm hover:border-accent/30 hover:bg-accent/5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-card-border font-mono text-xs text-muted">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-foreground">{choice.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
