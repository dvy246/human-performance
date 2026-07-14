import percentileData from "./percentiles.json"

export interface DistributionPoint {
  score: number
  percentile: number
}

export interface AgeBenchmark {
  group: string
  value: number
  unit: string
}

export interface ProfessionBenchmark {
  profession: string
  value: number
  label: string
}

export interface Factor {
  icon: string
  title: string
  body: string
}

export interface CategoryBenchmarkConfig {
  slug: string
  title: string
  description: string
  icon: string
  metric: string
  unit: string
  lowerIsBetter: boolean
  color: string
  primaryTestId: string
  testIds: string[]
  distribution?: DistributionPoint[]
  ageData?: AgeBenchmark[]
  professionData?: ProfessionBenchmark[]
  factors: Factor[]
}

function erf(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  const t = 1 / (1 + p * x)
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

function normalCDF(x: number, mean: number, std: number): number {
  return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))))
}

function normalPDF(x: number, mean: number, std: number): number {
  return (
    (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mean) / std) ** 2)
  )
}

function fitNormalFromPercentiles(points: DistributionPoint[]): {
  mean: number
  std: number
} {
  const sorted = [...points].sort((a, b) => a.score - b.score)
  let mean = 0,
    p84 = 0,
    p16 = 0
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].percentile >= 50 && mean === 0) {
      const prev = sorted[Math.max(0, i - 1)]
      const t =
        (50 - prev.percentile) / (sorted[i].percentile - prev.percentile)
      mean = prev.score + t * (sorted[i].score - prev.score)
    }
    if (sorted[i].percentile >= 84 && p84 === 0) {
      const prev = sorted[Math.max(0, i - 1)]
      const t =
        (84 - prev.percentile) / (sorted[i].percentile - prev.percentile)
      p84 = prev.score + t * (sorted[i].score - prev.score)
    }
    if (sorted[i].percentile >= 16 && p16 === 0) {
      const prev = sorted[Math.max(0, i - 1)]
      const t =
        (16 - prev.percentile) / (sorted[i].percentile - prev.percentile)
      p16 = prev.score + t * (sorted[i].score - prev.score)
    }
  }
  const std = mean > p84 ? mean - p84 : p84 - mean
  return { mean, std: std || mean - p16 || mean * 0.3 }
}

const percentileLookup = percentileData as Record<string, DistributionPoint[]>

const ageReaction = [
  { group: "18–24 years", value: 210, unit: "ms" },
  { group: "25–34 years", value: 224, unit: "ms" },
  { group: "35–44 years", value: 238, unit: "ms" },
  { group: "45–54 years", value: 255, unit: "ms" },
  { group: "55–64 years", value: 272, unit: "ms" },
  { group: "65+ years", value: 305, unit: "ms" },
]

const ageMemory = [
  { group: "18–29 years", value: 7, unit: "words" },
  { group: "30–39 years", value: 7, unit: "words" },
  { group: "40–49 years", value: 6, unit: "words" },
  { group: "50–59 years", value: 5, unit: "words" },
  { group: "60+ years", value: 5, unit: "words" },
]

const ageExecutive = [
  { group: "18–29 years", value: 25, unit: "s" },
  { group: "30–39 years", value: 29, unit: "s" },
  { group: "40–49 years", value: 32, unit: "s" },
  { group: "50–59 years", value: 38, unit: "s" },
  { group: "60+ years", value: 45, unit: "s" },
]

const ageFocus = [
  { group: "18–29 years", value: 750, unit: "ms" },
  { group: "30–39 years", value: 800, unit: "ms" },
  { group: "40–49 years", value: 880, unit: "ms" },
  { group: "50–59 years", value: 1000, unit: "ms" },
  { group: "60+ years", value: 1200, unit: "ms" },
]

const ageSpatial = [
  { group: "18–29 years", value: 75, unit: "" },
  { group: "30–39 years", value: 72, unit: "" },
  { group: "40–49 years", value: 68, unit: "" },
  { group: "50–59 years", value: 62, unit: "" },
  { group: "60+ years", value: 55, unit: "" },
]

const profReaction = [
  { profession: "Pro Esports Players", value: 180, label: "180 ms" },
  { profession: "Fighter Pilots", value: 190, label: "190 ms" },
  { profession: "Olympic Sprinters", value: 195, label: "195 ms" },
  { profession: "Formula 1 Drivers", value: 205, label: "205 ms" },
  { profession: "Casual Gamers", value: 230, label: "230 ms" },
  { profession: "General Population", value: 255, label: "255 ms" },
]

const profMotor = [
  { profession: "Court Reporters", value: 99, label: "200+ WPM" },
  {
    profession: "Professional Transcriptionists",
    value: 90,
    label: "80-100 WPM",
  },
  { profession: "Pro Esports (Valorant/CS)", value: 85, label: "85/100" },
  { profession: "Programmers", value: 78, label: "65-80 WPM" },
  { profession: "Competitive FPS Players", value: 75, label: "75/100" },
  { profession: "Casual Gamers", value: 65, label: "65/100" },
  { profession: "General Population", value: 50, label: "40 WPM" },
]

const profMemory = [
  { profession: "Memory Athletes", value: 11, label: "11/12 words" },
  { profession: "Polyglots", value: 9, label: "9/12 words" },
  { profession: "University Students", value: 7, label: "7/12 words" },
  { profession: "General Population", value: 6, label: "6/12 words" },
]

const profSpatial = [
  { profession: "Pilots", value: 88, label: "88/100" },
  { profession: "Surgeons", value: 85, label: "85/100" },
  { profession: "Architects", value: 82, label: "82/100" },
  { profession: "Engineers", value: 78, label: "78/100" },
  { profession: "General Population", value: 62, label: "62/100" },
]

function getDist(testId: string): DistributionPoint[] {
  return percentileLookup[testId] || []
}

export const categoryConfigs: CategoryBenchmarkConfig[] = [
  {
    slug: "reaction",
    title: "Reaction & Reflexes",
    description:
      "Population benchmarks for visual and auditory reaction speed, including simple reaction time, F1 start lights, choice reaction, and go/no-go inhibition.",
    icon: "⚡",
    metric: "Reaction Time",
    unit: "ms",
    lowerIsBetter: true,
    color: "#f59e0b",
    primaryTestId: "reaction-time",
    testIds: [
      "reaction-time",
      "f1-lights",
      "sound-reaction",
      "choice-reaction",
      "go-no-go",
    ],
    distribution: getDist("reaction-time"),
    ageData: ageReaction,
    professionData: profReaction,
    factors: [
      {
        icon: "😴",
        title: "Sleep & Fatigue",
        body: "After 18 hours awake, reaction speed drops 20–30%. Prioritize 7–9 hours of sleep for peak reflexes across all reaction-based tasks.",
      },
      {
        icon: "☕",
        title: "Caffeine",
        body: "100mg of caffeine can improve simple and choice reaction speed by 10–20ms, with peak effect ~45 minutes after consumption.",
      },
      {
        icon: "🖥️",
        title: "Monitor & Latency",
        body: "A 60Hz monitor adds 16.7ms display latency. Higher refresh rates and wired peripherals reduce total system lag for more accurate readings.",
      },
      {
        icon: "🧮",
        title: "Hick's Law",
        body: "Each additional choice adds ~50–70ms to reaction time. Simple RT tests pure speed, while choice RT tests decision efficiency.",
      },
    ],
  },
  {
    slug: "memory",
    title: "Memory",
    description:
      "Population benchmarks for short-term and working memory, including digit span, verbal recall, visual patterns, sequence memory, and dual n-back.",
    icon: "🧠",
    metric: "Memory Score",
    unit: "",
    lowerIsBetter: false,
    color: "#3b82f6",
    primaryTestId: "verbal-memory",
    testIds: [
      "sequence-memory",
      "number-memory",
      "visual-pattern",
      "dual-n-back",
      "verbal-memory",
    ],
    distribution: getDist("verbal-memory"),
    ageData: ageMemory,
    professionData: profMemory,
    factors: [
      {
        icon: "🧠",
        title: "Miller's Law",
        body: "Short-term memory holds 7±2 items on average. Chunking groups items into meaningful units, expanding effective capacity by 50–100%.",
      },
      {
        icon: "🗣️",
        title: "Phonological Loop",
        body: "Verbal memory relies on subvocal rehearsal. The word-length effect means shorter words are recalled better than longer ones.",
      },
      {
        icon: "😴",
        title: "Sleep Consolidation",
        body: "Sleep within 12 hours of encoding improves recall by 15–30%. REM sleep specifically enhances spatial and visual pattern memory.",
      },
      {
        icon: "🔗",
        title: "Dual N-Back Transfer",
        body: "N-back training engages the dorsolateral prefrontal cortex. Adaptive protocols show 2–3x larger working memory gains than fixed difficulty.",
      },
    ],
  },
  {
    slug: "reasoning",
    title: "Reasoning",
    description:
      "Population benchmarks for fluid intelligence and spatial reasoning, including pattern recognition, matrix reasoning, and mental rotation.",
    icon: "🧩",
    metric: "Reasoning Score",
    unit: "",
    lowerIsBetter: false,
    color: "#8b5cf6",
    primaryTestId: "spatial-orientation",
    testIds: ["pattern-reasoning", "spatial-orientation"],
    distribution: getDist("spatial-orientation"),
    ageData: ageSpatial,
    professionData: profSpatial,
    factors: [
      {
        icon: "🧠",
        title: "Fluid Intelligence",
        body: "Pattern reasoning is the hallmark of fluid intelligence (Gf) — the ability to solve novel problems independently of acquired knowledge.",
      },
      {
        icon: "🔄",
        title: "Mental Rotation",
        body: "Shepard & Metzler (1971) showed rotation time increases linearly with angular disparity at ~50ms per degree of rotation.",
      },
      {
        icon: "📚",
        title: "Cognitive Reserve",
        body: "Lifelong cognitive engagement slows age-related decline in fluid reasoning by 30–50%. Education shows moderate correlation (r≈0.4).",
      },
      {
        icon: "🎮",
        title: "Training Effects",
        body: "Action video game training improves mental rotation speed by 15–25%. Spatial training induces gray matter changes in the parietal cortex.",
      },
    ],
  },
  {
    slug: "focus",
    title: "Focus & Attention",
    description:
      "Population benchmarks for sustained attention, selective attention, and cognitive inhibition — including the Stroop test, trail making, and the focus challenge.",
    icon: "🎯",
    metric: "Focus Score",
    unit: "",
    lowerIsBetter: false,
    color: "#10b981",
    primaryTestId: "focus-challenge",
    testIds: ["stroop", "trail-making", "focus-challenge"],
    distribution: getDist("focus-challenge"),
    ageData: ageFocus,
    factors: [
      {
        icon: "⏱️",
        title: "Sustained Attention",
        body: "Concentration naturally wanes 15–20 minutes into a task. The attention decline curve is a key metric of cognitive endurance.",
      },
      {
        icon: "🎨",
        title: "The Stroop Effect",
        body: "Reading is automatic. Naming ink color instead creates interference that slows response by 200–400ms — a measure of inhibition.",
      },
      {
        icon: "🔄",
        title: "Cognitive Flexibility",
        body: "Task-switching (Trail Making Part B) engages the prefrontal cortex. Switch cost increases 40–60% when alternating between rules.",
      },
      {
        icon: "😴",
        title: "Fatigue & Inhibition",
        body: "Sleep deprivation increases Stroop interference by 30–50% and impairs no-go accuracy. Self-control degrades first under fatigue.",
      },
    ],
  },
  {
    slug: "motor",
    title: "Motor Performance",
    description:
      "Population benchmarks for hand-eye coordination, aiming precision, clicking speed, and fine motor control — governed by Fitts's Law.",
    icon: "🎮",
    metric: "Motor Score",
    unit: "",
    lowerIsBetter: false,
    color: "#ef4444",
    primaryTestId: "mouse-accuracy",
    testIds: [
      "aim-trainer",
      "click-speed",
      "mouse-accuracy",
      "flick-trainer",
      "typing-speed",
    ],
    distribution: getDist("mouse-accuracy"),
    professionData: profMotor,
    factors: [
      {
        icon: "📐",
        title: "Fitts's Law",
        body: "Movement time increases with distance and decreases with target size: MT = a + b·log₂(2D/W). Larger, closer targets are always faster.",
      },
      {
        icon: "🖱️",
        title: "Equipment Matters",
        body: "1000Hz polling rate wired mice register in 1ms vs 8–15ms for Bluetooth. High DPI enables finer granularity for precision tasks.",
      },
      {
        icon: "🔄",
        title: "Speed-Accuracy Trade-Off",
        body: "Rushing increases error rate exponentially. The optimal balance is ~85–95% accuracy for most aiming and clicking tasks.",
      },
      {
        icon: "🏋️",
        title: "Warm-Up & Fatigue",
        body: "Aiming improves 10–20% after 5–10 minutes warm-up. Sustained clicking declines ~20% over 10 seconds due to muscle fatigue.",
      },
    ],
  },
  {
    slug: "executive",
    title: "Executive Function",
    description:
      "Population benchmarks for executive control, including decision speed, planning, and task prioritization — prefrontal cortex-driven cognitive management.",
    icon: "🧭",
    metric: "Executive Score",
    unit: "",
    lowerIsBetter: false,
    color: "#3b82f6",
    primaryTestId: "planning",
    testIds: ["decision-speed", "planning", "prioritization"],
    distribution: getDist("planning"),
    ageData: ageExecutive,
    factors: [
      {
        icon: "♟️",
        title: "Forward Planning",
        body: "The Tower of London task requires look-ahead planning 2–3 moves deep. The branching factor grows exponentially with depth.",
      },
      {
        icon: "⚡",
        title: "Processing Speed",
        body: "Decision speed follows a drift-diffusion model: evidence accumulates to a threshold. Higher thresholds improve accuracy but slow decisions.",
      },
      {
        icon: "📋",
        title: "Task Switching",
        body: 'Switching between tasks incurs a 100–300ms "switch cost." Frequent switching reduces throughput more than sustained single-tasking.',
      },
      {
        icon: "😴",
        title: "Executive Fatigue",
        body: "Sleep deprivation reduces planning depth by ~1 move. Under fatigue, people default to urgent-but-low-importance tasks.",
      },
    ],
  },
  {
    slug: "gauntlet",
    title: "The Gauntlet",
    description:
      "Composite benchmark across 5 cognitive domains: reaction, memory, inhibition, reasoning, and precision — your overall cognitive performance score.",
    icon: "🏰",
    metric: "Gauntlet Score",
    unit: "",
    lowerIsBetter: false,
    color: "#f59e0b",
    primaryTestId: "gauntlet",
    testIds: ["gauntlet"],
    distribution: getDist("gauntlet"),
    factors: [
      {
        icon: "🧠",
        title: "Composite Assessment",
        body: "The Gauntlet tests 5 distinct cognitive domains for a holistic performance metric. Balance across domains predicts overall score.",
      },
      {
        icon: "📉",
        title: "Fatigue Cascade",
        body: "Performance typically declines across stages due to mental fatigue. The decline rate is a measure of cognitive endurance.",
      },
      {
        icon: "🏋️",
        title: "Training Transfer",
        body: "Improvements in individual tests transfer partially to the Gauntlet. Cross-domain training produces the largest gains.",
      },
      {
        icon: "🎯",
        title: "The Weakest Link",
        body: "Your Gauntlet score is constrained by your weakest domain. Targeted training on weak areas raises the composite score fastest.",
      },
    ],
  },
]

export const benchmarkSlugs = categoryConfigs.map((c) => c.slug)

export function getBenchmarkConfig(
  slug: string
): CategoryBenchmarkConfig | undefined {
  return categoryConfigs.find((c) => c.slug === slug)
}

export function computeFittedDistribution(points?: DistributionPoint[]): {
  mean: number
  std: number
  pdfPoints: { x: number; y: number }[]
} {
  if (!points || points.length < 2) {
    return { mean: 50, std: 20, pdfPoints: [] }
  }
  const { mean, std } = fitNormalFromPercentiles(points)
  const scores = points.map((p) => p.score)
  const min = scores.reduce((a, b) => Math.min(a, b), scores[0])
  const max = scores.reduce((a, b) => Math.max(a, b), scores[0])
  const padding = (max - min) * 0.15
  const step = (max - min + padding * 2) / 150
  const pdfPoints: { x: number; y: number }[] = []
  for (let x = min - padding; x <= max + padding; x += step) {
    pdfPoints.push({ x, y: normalPDF(x, mean, std) })
  }
  return { mean, std, pdfPoints }
}
