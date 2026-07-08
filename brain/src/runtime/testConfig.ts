/**
 * Per-test configuration registry.
 * Maps each test to its available pre-game options (difficulty, attempts, etc.).
 */

export interface ConfigOption {
  key: string;
  label: string;
  options: (string | number)[];
  default: string | number;
}

export interface GameConfig {
  [key: string]: string | number;
}

export const TEST_CONFIGS: Record<string, ConfigOption[]> = {
  // ── Reaction Tests ──
  'reaction-time': [
    { key: 'attempts', label: 'Attempts', options: [3, 5, 10], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'f1-lights': [
    { key: 'attempts', label: 'Attempts', options: [3, 5, 10], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'sound-reaction': [
    { key: 'attempts', label: 'Attempts', options: [3, 5, 10], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'choice-reaction': [
    { key: 'attempts', label: 'Attempts', options: [3, 5, 10], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'go-no-go': [
    { key: 'attempts', label: 'Attempts', options: [5, 8, 12], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],

  // ── Speed / Precision Tests ──
  'click-speed': [
    { key: 'duration', label: 'Duration (s)', options: [5, 10, 30, 60], default: 10 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'aim-trainer': [
    { key: 'targets', label: 'Targets', options: [15, 30, 50], default: 30 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'aim-coordination': [
    { key: 'targets', label: 'Targets', options: [10, 20, 30], default: 20 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'mouse-accuracy': [
    { key: 'targets', label: 'Targets', options: [10, 20, 30], default: 20 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'flick-trainer': [
    { key: 'targets', label: 'Targets', options: [10, 15, 25], default: 15 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'decision-speed': [
    { key: 'trials', label: 'Trials', options: [10, 20, 30], default: 20 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'typing-speed': [
    { key: 'duration', label: 'Duration (s)', options: [30, 60, 120], default: 60 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],

  // ── Memory Tests ──
  'sequence-memory': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'number-memory': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'visual-pattern': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'verbal-memory': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'dual-n-back': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],

  // ── Focus Tests ──
  'stroop': [
    { key: 'trials', label: 'Trials', options: [15, 20, 30], default: 20 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'trail-making': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'spatial-orientation': [
    { key: 'trials', label: 'Trials', options: [8, 12, 16], default: 12 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'focus-challenge': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'gauntlet': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],

  // ── Processing / Executive Tests ──
  'pattern-reasoning': [
    { key: 'questions', label: 'Questions', options: [3, 5, 8], default: 5 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'planning': [
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
  'prioritization': [
    { key: 'rounds', label: 'Rounds', options: [2, 3, 5], default: 3 },
    { key: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  ],
};

/**
 * Load saved config for a test from localStorage, falling back to defaults.
 */
export function loadTestConfig(testId: string): GameConfig {
  const options = TEST_CONFIGS[testId];
  if (!options) return {};

  const saved: GameConfig = {};
  try {
    const raw = localStorage.getItem(`cogniarena-config-${testId}`);
    if (raw) Object.assign(saved, JSON.parse(raw));
  } catch { /* ignore */ }

  // Fill in defaults for any missing keys
  const result: GameConfig = {};
  for (const opt of options) {
    result[opt.key] = saved[opt.key] ?? opt.default;
  }
  return result;
}

/**
 * Persist config for a test to localStorage.
 */
export function saveTestConfig(testId: string, config: GameConfig): void {
  try {
    localStorage.setItem(`cogniarena-config-${testId}`, JSON.stringify(config));
  } catch { /* ignore quota errors */ }
}

/**
 * Get difficulty-adjusted parameters for a test.
 * Returns a record of parameter overrides based on difficulty level.
 */
export function getDifficultyParams(testId: string, difficulty: string): Record<string, number> {
  const params: Record<string, number> = {};

  // Reaction / F1 Lights / Sound Reaction: wait window
  if (['reaction-time', 'f1-lights', 'sound-reaction'].includes(testId)) {
    if (difficulty === 'Easy') { params.waitMin = 1500; params.waitMax = 4000; }
    else if (difficulty === 'Hard') { params.waitMin = 500; params.waitMax = 2000; }
    else { params.waitMin = 1000; params.waitMax = 3000; }
  }

  // Memory tests: sequence speed
  if (['sequence-memory'].includes(testId)) {
    if (difficulty === 'Easy') { params.flashOn = 600; params.flashOff = 350; }
    else if (difficulty === 'Hard') { params.flashOn = 300; params.flashOff = 120; }
    else { params.flashOn = 450; params.flashOff = 200; }
  }

  // Aim / Click tests: target size multiplier
  if (['aim-trainer', 'aim-coordination', 'mouse-accuracy', 'flick-trainer'].includes(testId)) {
    if (difficulty === 'Easy') params.sizeMultiplier = 1.4;
    else if (difficulty === 'Hard') params.sizeMultiplier = 0.7;
    else params.sizeMultiplier = 1.0;
  }

  // Focus tests: distractor count
  if (['stroop', 'go-no-go'].includes(testId)) {
    if (difficulty === 'Easy') params.distractors = 3;
    else if (difficulty === 'Hard') params.distractors = 6;
    else params.distractors = 4;
  }

  return params;
}
