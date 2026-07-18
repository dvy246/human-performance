export interface TestEntry {
  slug: string
  title: string
  shortDesc: string
  icon: string
  iconName: string
  category: string
  categorySlug: string
  href: string
}

export interface CategoryGroup {
  name: string
  slug: string
  icon: string
  iconName: string
  subtitle: string
}

export const categories: CategoryGroup[] = [
  {
    name: "Reaction & Reflexes",
    slug: "reaction",
    icon: "⚡",
    iconName: "zap",
    subtitle: "Raw speed & sensory pathways",
  },
  {
    name: "Memory",
    slug: "memory",
    icon: "🧠",
    iconName: "brain",
    subtitle: "Active working capacity & retention",
  },
  {
    name: "Reasoning",
    slug: "reasoning",
    icon: "🧩",
    iconName: "puzzle",
    subtitle: "Fluid logic & non-verbal matrices",
  },
  {
    name: "Focus & Attention",
    slug: "focus",
    icon: "🎯",
    iconName: "crosshair",
    subtitle: "Selective attention & executive suppression",
  },
  {
    name: "Motor Performance",
    slug: "motor",
    icon: "🎮",
    iconName: "gamepad",
    subtitle: "Spatial mouse control & clicking stamina",
  },
  {
    name: "Executive Function",
    slug: "executive",
    icon: "🧭",
    iconName: "compass",
    subtitle: "High-level attention gating & flexibility",
  },
]

function t(
  slug: string,
  title: string,
  shortDesc: string,
  icon: string,
  iconName: string,
  categorySlug: string
): TestEntry {
  const cat = categories.find((c) => c.slug === categorySlug)
  return {
    slug,
    title,
    shortDesc,
    icon,
    iconName,
    category: cat?.name ?? categorySlug,
    categorySlug,
    href: `/tests/${slug}`,
  }
}

export const allTests: TestEntry[] = [
  // Reaction & Reflexes
  t(
    "reaction-time",
    "Visual Reaction",
    "Test your physical reflexes against visual triggers. Calibrate input delay, monitor refresh rate, and view population distributions.",
    "⚡",
    "zap",
    "reaction"
  ),
  t(
    "sound-reaction",
    "Auditory Reflex",
    "Measure your auditory response speeds to low-latency synthesized sound waves. Contrast hearing triggers against visual pathways.",
    "🔊",
    "volume",
    "reaction"
  ),
  t(
    "f1-lights",
    "F1 Start Lights",
    "Simulate a Grand Prix start gantry. Suppress anticipatory impulse and release motor actions at the exact millisecond lights extinguish.",
    "🏎️",
    "flag",
    "reaction"
  ),
  t(
    "choice-reaction",
    "Choice Reaction",
    "Map color changes to keys R, G, B, Y. Manage accuracy-speed trade-offs under cognitive decision load with built-in mismatch penalties.",
    "🔢",
    "hash",
    "reaction"
  ),
  t(
    "go-no-go",
    "Color Go/No-Go",
    "Inhibitory motor control. Click only when green flashes; suppress actions for distractors (Red, Blue, Purple).",
    "🛡️",
    "shield",
    "reaction"
  ),
  t(
    "aim-coordination",
    "Aim Coordination",
    "Test hand-eye coordination speed. Click targets as they appear and measure your visual-motor response latency.",
    "🎯",
    "crosshair",
    "reaction"
  ),

  // Memory
  t(
    "sequence-memory",
    "Sequence Memory",
    "Remember an expanding grid flash sequence, evaluating Miller's Law bounds on working memory capacity.",
    "🗂️",
    "layers",
    "memory"
  ),
  t(
    "number-memory",
    "Number Memory",
    "Recall numeric strings of growing length to evaluate active visual digit spans.",
    "🔢",
    "hash",
    "memory"
  ),
  t(
    "visual-pattern",
    "Visual Pattern",
    "Memorize illuminated pattern positions inside dynamic scale matrices.",
    "🧩",
    "puzzle",
    "memory"
  ),
  t(
    "dual-n-back",
    "Dual N-Back",
    "Track independent auditory tone and visual positions shown N steps back, taxing working memory.",
    "🧠",
    "brain",
    "memory"
  ),
  t(
    "verbal-memory",
    "Verbal Memory",
    "Memorize growing word lists and recall them from distractor sets.",
    "📝",
    "file-text",
    "memory"
  ),

  // Reasoning
  t(
    "pattern-reasoning",
    "Pattern Reasoning",
    "Identify missing items completing linear sequences, 2x2 matrices, progressions, and shape analogies.",
    "🧩",
    "puzzle",
    "reasoning"
  ),
  t(
    "spatial-orientation",
    "Spatial Orientation",
    "Mentally rotate grid patterns and match the orientation across timed trials.",
    "🔄",
    "refresh",
    "reasoning"
  ),

  // Focus & Attention
  t(
    "stroop",
    "Stroop Test",
    "Isolate semantic interference. Match visual ink colors ignoring the text name values.",
    "🎨",
    "palette",
    "focus"
  ),
  t(
    "trail-making",
    "Trail Making",
    "Alternate sequences of numbers and letters (1-A-2-B...) to test search speed and cognitive flexibility.",
    "🧭",
    "compass",
    "focus"
  ),
  t(
    "focus-challenge",
    "Focus Challenge",
    "5-stage attention gauntlet: selective focus, impulse control, task switching, sustained vigilance, working memory under distraction.",
    "🎯",
    "crosshair",
    "focus"
  ),
  t(
    "object-tracking",
    "Multiple Object Tracking",
    "Track moving target dots among distractors. Evaluates dynamic spatial attention, peripheral vision, and visual working memory.",
    "👁️",
    "compass",
    "focus"
  ),
  t(
    "gauntlet",
    "The Gauntlet",
    "Complete 5 cognitive stages — reaction, memory, focus, reasoning, precision — for a unified CAI score and archetype.",
    "🏰",
    "castle",
    "focus"
  ),

  // Motor Performance
  t(
    "click-speed",
    "CPS Test",
    "Test your clicks-per-second motor stamina over a 10s timeframe, plotting a cadence curve.",
    "🖱️",
    "mouse",
    "motor"
  ),
  t(
    "aim-trainer",
    "Aim Precision",
    "Acquire 30 targets on our coordinates canvas, tracking offset errors in pixels.",
    "🎯",
    "crosshair",
    "motor"
  ),
  t(
    "mouse-accuracy",
    "Mouse Accuracy",
    "Click shrinking targets from 80px to 16px. Measures fine motor precision through center offset.",
    "🎯",
    "crosshair",
    "motor"
  ),
  t(
    "flick-trainer",
    "Flick Trainer",
    "Flick to 15 random targets, measuring speed and click accuracy.",
    "⚡",
    "zap",
    "motor"
  ),
  t(
    "typing-speed",
    "Typing Speed",
    "Benchmark your words per minute (WPM) and typing accuracy against profession-based benchmarks.",
    "⌨️",
    "keyboard",
    "motor"
  ),

  // Executive Function
  t(
    "decision-speed",
    "Decision Speed",
    "Classify 20 numbers as ≥50 or <50 against a 2-second timeout. Measures raw information processing speed.",
    "⚡",
    "zap",
    "executive"
  ),
  t(
    "planning",
    "Planning",
    "Tower of Hanoi with 4 disks. Move the stack to the target peg — optimal solution is 15 moves.",
    "♟️",
    "git-branch",
    "executive"
  ),
  t(
    "prioritization",
    "Prioritization",
    "5 rounds of task scheduling. Maximize points by completing high-value tasks before deadlines.",
    "📊",
    "chart-bar",
    "executive"
  ),
  t(
    "latency-optimizer",
    "Latency & Hz Optimizer",
    "Benchmark your monitor refresh rate, event polling jitter, and true biological latency stack.",
    "⚡",
    "zap",
    "reaction"
  ),
  t(
    "ergonomic-architect",
    "Ergonomic Architect",
    "Generate a personalized workstation blueprint matching your physical geometry and motor alignment.",
    "🖱️",
    "mouse",
    "motor"
  ),
  t(
    "sleep-sanctuary",
    "Sleep & Chronotype",
    "Assess your circadian profile, run a fatigue Stroop test, and design a light-temperature sanctuary.",
    "🌙",
    "compass",
    "focus"
  ),
  t(
    "speed-arithmetic",
    "Speed Arithmetic",
    "Benchmark your mental calculation speed, operator accuracy, and quantitative working memory.",
    "🔢",
    "hash",
    "reasoning"
  ),
  t(
    "quant-dev-grid",
    "Quant-Dev Agility Grid",
    "Benchmark boolean logic processing, bitwise arithmetic shift latencies, and base-16 numerical agility.",
    "💻",
    "keyboard",
    "reasoning"
  ),
]

export function getTestsByCategory(): {
  category: CategoryGroup
  tests: TestEntry[]
}[] {
  return categories.map((cat) => ({
    category: cat,
    tests: allTests.filter((t) => t.categorySlug === cat.slug),
  }))
}

export function getTestBySlug(slug: string): TestEntry | undefined {
  return allTests.find((t) => t.slug === slug)
}
