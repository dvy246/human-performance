/**
 * Per-test configuration registry.
 * Maps each test to its available pre-game options (difficulty, attempts, etc.).
 */

export interface ConfigOption {
  key: string
  label: string
  options: (string | number)[]
  default: string | number
}

export interface GameConfig {
  [key: string]: string | number
}

export const TEST_CONFIGS: Record<string, ConfigOption[]> = {
  // ── Reaction Tests ──
  "reaction-time": [
    { key: "attempts", label: "Attempts", options: [3, 5, 10], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "f1-lights": [
    { key: "attempts", label: "Attempts", options: [3, 5, 10], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "sound-reaction": [
    { key: "attempts", label: "Attempts", options: [3, 5, 10], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "choice-reaction": [
    { key: "attempts", label: "Attempts", options: [3, 5, 10], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "go-no-go": [
    { key: "attempts", label: "Attempts", options: [5, 8, 12], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],

  // ── Speed / Precision Tests ──
  "click-speed": [
    {
      key: "duration",
      label: "Duration (s)",
      options: [5, 10, 30, 60],
      default: 10,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "aim-trainer": [
    { key: "targets", label: "Targets", options: [15, 30, 50], default: 30 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "aim-coordination": [
    { key: "targets", label: "Targets", options: [10, 20, 30], default: 20 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "mouse-accuracy": [
    { key: "targets", label: "Targets", options: [10, 20, 30], default: 20 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "flick-trainer": [
    { key: "targets", label: "Targets", options: [10, 15, 25], default: 15 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "decision-speed": [
    { key: "trials", label: "Trials", options: [10, 20, 30], default: 20 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "typing-speed": [
    {
      key: "duration",
      label: "Duration (s)",
      options: [30, 60, 120],
      default: 60,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],

  // ── Memory Tests ──
  "sequence-memory": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "number-memory": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "visual-pattern": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "verbal-memory": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "dual-n-back": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],

  // ── Focus Tests ──
  stroop: [
    { key: "trials", label: "Trials", options: [15, 20, 30], default: 20 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "trail-making": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "spatial-orientation": [
    { key: "trials", label: "Trials", options: [8, 12, 16], default: 12 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  "focus-challenge": [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  gauntlet: [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],

  // ── Processing / Executive Tests ──
  "pattern-reasoning": [
    { key: "questions", label: "Questions", options: [3, 5, 8], default: 5 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  planning: [
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
  prioritization: [
    { key: "rounds", label: "Rounds", options: [2, 3, 5], default: 3 },
    {
      key: "difficulty",
      label: "Difficulty",
      options: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  ],
}

/**
 * Load saved config for a test from localStorage, falling back to defaults.
 */
export function loadTestConfig(testId: string): GameConfig {
  const options = TEST_CONFIGS[testId]
  if (!options) return {}

  const saved: GameConfig = {}
  try {
    const raw = localStorage.getItem(`cogniarena-config-${testId}`)
    if (raw) Object.assign(saved, JSON.parse(raw))
  } catch {
    /* ignore */
  }

  // Fill in defaults for any missing keys
  const result: GameConfig = {}
  for (const opt of options) {
    result[opt.key] = saved[opt.key] ?? opt.default
  }
  return result
}

/**
 * Persist config for a test to localStorage.
 */
export function saveTestConfig(testId: string, config: GameConfig): void {
  try {
    localStorage.setItem(`cogniarena-config-${testId}`, JSON.stringify(config))
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Get difficulty-adjusted parameters for a test.
 * Returns a record of parameter overrides based on difficulty level.
 */
/**
 * Get difficulty-adjusted parameters for a test.
 * Returns partial params; caller should merge with defaults.
 */
export function getDifficultyParams(
  testId: string,
  difficulty: string
): Record<string, number | string> {
  const params: Record<string, number | string> = {}

  // ── Reaction Tests: wait window narrows, valid-response window shrinks ──
  if (testId === "reaction-time") {
    if (difficulty === "Easy") {
      params.waitMin = 2500
      params.waitMax = 5000
    } else if (difficulty === "Hard") {
      params.waitMin = 1000
      params.waitMax = 2500
    } else {
      params.waitMin = 2000
      params.waitMax = 5000
    }
  }

  if (testId === "f1-lights") {
    if (difficulty === "Easy") {
      params.waitMin = 1200
      params.waitMax = 3500
    } else if (difficulty === "Hard") {
      params.waitMin = 500
      params.waitMax = 1800
    } else {
      params.waitMin = 800
      params.waitMax = 3000
    }
  }

  if (testId === "sound-reaction") {
    if (difficulty === "Easy") {
      params.waitMin = 2500
      params.waitMax = 5000
    } else if (difficulty === "Hard") {
      params.waitMin = 1000
      params.waitMax = 2500
    } else {
      params.waitMin = 2000
      params.waitMax = 5000
    }
  }

  if (testId === "choice-reaction") {
    if (difficulty === "Easy") {
      params.waitMin = 1500
      params.waitMax = 4000
      params.penaltyMs = 0
    } else if (difficulty === "Hard") {
      params.waitMin = 800
      params.waitMax = 2000
      params.penaltyMs = 150
    } else {
      params.waitMin = 1200
      params.waitMax = 3500
      params.penaltyMs = 150
    }
  }

  if (testId === "go-no-go") {
    if (difficulty === "Easy") {
      params.waitMin = 1500
      params.waitMax = 3500
      params.noGoRate = 0.25
      params.omissionMs = 2000
    } else if (difficulty === "Hard") {
      params.waitMin = 600
      params.waitMax = 1500
      params.noGoRate = 0.5
      params.omissionMs = 1000
    } else {
      params.waitMin = 1000
      params.waitMax = 3000
      params.noGoRate = 0.35
      params.omissionMs = 1500
    }
  }

  // ── Memory Tests: starting length, display time, flash speed ──
  if (testId === "number-memory") {
    if (difficulty === "Easy") {
      params.startLen = 4
      params.displayBase = 3000
      params.displayPerLevel = 600
    } else if (difficulty === "Hard") {
      params.startLen = 6
      params.displayBase = 1000
      params.displayPerLevel = 400
    } else {
      params.startLen = 5
      params.displayBase = 2000
      params.displayPerLevel = 500
    }
  }

  if (testId === "sequence-memory") {
    if (difficulty === "Easy") {
      params.flashOn = 600
      params.flashOff = 350
      params.startLen = 2
    } else if (difficulty === "Hard") {
      params.flashOn = 300
      params.flashOff = 120
      params.startLen = 4
    } else {
      params.flashOn = 450
      params.flashOff = 200
      params.startLen = 3
    }
  }

  if (testId === "visual-pattern") {
    if (difficulty === "Easy") {
      params.startGrid = 3
      params.startTiles = 3
      params.displayBase = 2000
      params.displayPerLevel = 300
    } else if (difficulty === "Hard") {
      params.startGrid = 4
      params.startTiles = 5
      params.displayBase = 1000
      params.displayPerLevel = 150
    } else {
      params.startGrid = 3
      params.startTiles = 4
      params.displayBase = 1500
      params.displayPerLevel = 200
    }
  }

  if (testId === "verbal-memory") {
    if (difficulty === "Easy") {
      params.startListSize = 3
      params.maxLevel = 10
    } else if (difficulty === "Hard") {
      params.startListSize = 5
      params.maxLevel = 15
    } else {
      params.startListSize = 3
      params.maxLevel = 12
    }
  }

  if (testId === "dual-n-back") {
    if (difficulty === "Easy") {
      params.startN = 1
      params.trials = 15
      params.matchRate = 0.3
    } else if (difficulty === "Hard") {
      params.startN = 2
      params.trials = 25
      params.matchRate = 0.4
    } else {
      params.startN = 2
      params.trials = 20
      params.matchRate = 0.35
    }
  }

  // ── Precision Tests: target size (except ClickSpeed which is pure speed) ──
  if (
    [
      "aim-trainer",
      "aim-coordination",
      "mouse-accuracy",
      "flick-trainer",
    ].includes(testId)
  ) {
    if (difficulty === "Easy") params.sizeMultiplier = 1.4
    else if (difficulty === "Hard") params.sizeMultiplier = 0.7
    else params.sizeMultiplier = 1.0
  }

  if (testId === "typing-speed") {
    if (difficulty === "Easy") {
      params.passageComplexity = "simple"
    } else if (difficulty === "Hard") {
      params.passageComplexity = "hard"
    } else {
      params.passageComplexity = "medium"
    }
  }

  // ── Focus Tests: distractor count, incongruent ratio, node count ──
  if (testId === "stroop") {
    if (difficulty === "Easy") {
      params.incongruentRatio = 0.3
      params.trialTimeoutMs = 5000
    } else if (difficulty === "Hard") {
      params.incongruentRatio = 0.7
      params.trialTimeoutMs = 3000
    } else {
      params.incongruentRatio = 0.5
      params.trialTimeoutMs = 4000
    }
  }

  if (testId === "trail-making") {
    if (difficulty === "Easy") {
      params.nodeCount = 15
      params.penaltyMs = 2000
    } else if (difficulty === "Hard") {
      params.nodeCount = 25
      params.penaltyMs = 3000
    } else {
      params.nodeCount = 20
      params.penaltyMs = 2000
    }
  }

  if (testId === "spatial-orientation") {
    if (difficulty === "Easy") {
      params.choicesPerTrial = 3
      params.trialTimeoutMs = 0
    } else if (difficulty === "Hard") {
      params.choicesPerTrial = 4
      params.trialTimeoutMs = 15000
    } else {
      params.choicesPerTrial = 4
      params.trialTimeoutMs = 0
    }
  }

  // ── Reasoning Tests ──
  if (testId === "pattern-reasoning") {
    if (difficulty === "Easy") {
      params.questions = 3
      params.ruleTypes = 3
    } else if (difficulty === "Hard") {
      params.questions = 8
      params.ruleTypes = 4
    } else {
      params.questions = 5
      params.ruleTypes = 4
    }
  }

  // ── Executive / Planning Tests ──
  if (testId === "planning") {
    if (difficulty === "Easy") {
      params.diskCount = 3
    } else if (difficulty === "Hard") {
      params.diskCount = 5
    } else {
      params.diskCount = 4
    }
  }

  if (testId === "prioritization") {
    if (difficulty === "Easy") {
      params.roundTime = 12
    } else if (difficulty === "Hard") {
      params.roundTime = 8
    } else {
      params.roundTime = 10
    }
  }

  if (testId === "decision-speed") {
    // trials is user-selectable via TEST_CONFIGS; difficulty only changes timeout
    if (difficulty === "Easy") {
      params.timeoutMs = 3000
    } else if (difficulty === "Hard") {
      params.timeoutMs = 1500
    } else {
      params.timeoutMs = 2000
    }
  }

  return params
}
