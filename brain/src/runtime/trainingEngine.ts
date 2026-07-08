import type { CognitiveAverages } from './skillRadar';
import type { SessionRecord } from './dataLayer';

export interface Persona {
  title: string;
  desc: string;
  explanation: string;
}

export interface DailyChallenge {
  testId: string;
  name: string;
  metric: string;
  target: number;
  condition: 'higher' | 'lower';
  desc: string;
}

export interface Recommendation {
  text: string;
  link: string;
  testId: string;
}

/**
 * Curated list of cognitive personas based on strongest scores.
 * All explanations are adjusted to avoid anatomically un-verifiable claims.
 */
export const PERSONAS: Record<keyof CognitiveAverages, Persona> = {
  reaction: {
    title: 'Rapid Reactor',
    desc: 'Sensory Visuomotor Specialist',
    explanation: 'You excel at rapid visual and auditory response triggers. Your motor responses are tuned for fast reflexes.'
  },
  memory: {
    title: 'Pattern Hunter',
    desc: 'Visuospatial Chunking Planner',
    explanation: 'You group sequence coordinates and structural matrices into spatial memory blocks, recalling longer sequences by organizing items into meaningful chunks.'
  },
  processing: {
    title: 'Choice Strategist',
    desc: 'Fast Choice Strategist',
    explanation: 'You maintain fast visual choice-decision paths. When faced with multiple choices, you resolve selection paths cleanly.'
  },
  precision: {
    title: 'Precision Targeter',
    desc: 'Spatial Motor Coordinator',
    explanation: 'You execute fine target adjustments with high accuracy, gliding to target boundaries with minimal coordinate offset errors.'
  },
  focus: {
    title: 'Focus Guardian',
    desc: 'Impulse Control Specialist',
    explanation: 'You display excellent reaction pacing and target discrimination, ignoring distractor stimuli and maintaining high accuracy.'
  },
  stamina: {
    title: 'Stamina Specialist',
    desc: 'Endurance Clicker',
    explanation: 'You maintain highly consistent click cadences. Your motor execution displays high resilience against fatigue and speed degradation.'
  }
};

/**
 * Curated daily challenges pool.
 */
export const CHALLENGE_POOL: DailyChallenge[] = [
  { testId: 'reaction-time', name: 'Visual Reaction', metric: 'ms', target: 240, condition: 'lower', desc: 'Record a reaction score below 240 ms.' },
  { testId: 'click-speed', name: 'Click Speed (CPS)', metric: 'CPS', target: 8.5, condition: 'higher', desc: 'Achieve click speed cadence of 8.5 CPS or higher.' },
  { testId: 'aim-trainer', name: 'Aim Precision', metric: '% Accuracy', target: 92, condition: 'higher', desc: 'Complete Aim Precision with 92% accuracy or higher.' },
  { testId: 'sequence-memory', name: 'Sequence Memory', metric: 'Level', target: 7, condition: 'higher', desc: 'Reach Level 7 or higher in Sequence Memory.' },
  { testId: 'go-no-go', name: 'Color Go/No-Go', metric: 'ms', target: 360, condition: 'lower', desc: 'Complete Go/No-Go under 360 ms average.' },
  { testId: 'sound-reaction', name: 'Sound Reflex', metric: 'ms', target: 200, condition: 'lower', desc: 'Record sound reaction below 200 ms.' },
  { testId: 'choice-reaction', name: 'Choice Grid', metric: 'ms', target: 450, condition: 'lower', desc: 'Complete Choice Grid under 450 ms.' },
  { testId: 'f1-lights', name: 'F1 Start Lights', metric: 'ms', target: 230, condition: 'lower', desc: 'Launch start lights below 230 ms.' },
  { testId: 'stroop', name: 'Stroop Attention', metric: 'ms', target: 800, condition: 'lower', desc: 'Complete Stroop color clash under 800 ms final average score.' },
  { testId: 'pattern-reasoning', name: 'Pattern Reasoning', metric: 'Pts', target: 6000, condition: 'higher', desc: 'Achieve 6,000 Points or higher in Pattern Reasoning.' },
  { testId: 'tmt-partA', name: 'Trail Making A', metric: 'ms', target: 30000, condition: 'lower', desc: 'Complete Trail Making Part A under 30.0 seconds.' },
  { testId: 'tmt-partB', name: 'Trail Making B', metric: 'ms', target: 55000, condition: 'lower', desc: 'Complete Trail Making Part B under 55.0 seconds.' },
  { testId: 'dual-n-back', name: 'Dual N-Back Memory', metric: 'Pts', target: 3000, condition: 'higher', desc: 'Achieve 3,000 Points or higher in Dual N-Back.' },
  { testId: 'typing-speed', name: 'Typing Speed', metric: 'WPM', target: 60, condition: 'higher', desc: 'Type 60 WPM or higher in the Typing Speed Test.' }
];

/**
 * Determines cognitive persona based on the strongest category average.
 */
export function determinePersona(avg: CognitiveAverages): Persona {
  const categories: Array<{ id: keyof CognitiveAverages; label: string }> = [
    { id: 'reaction', label: 'Reaction Speed' },
    { id: 'memory', label: 'Memory Capacity' },
    { id: 'processing', label: 'Processing Speed' },
    { id: 'precision', label: 'Precision & Control' },
    { id: 'focus', label: 'Focus & Attention' },
    { id: 'stamina', label: 'Cognitive Stamina' }
  ];

  let maxVal = -1;
  let strongestCategory: keyof CognitiveAverages = 'reaction';

  categories.forEach(cat => {
    if ((avg[cat.id] || 0) > maxVal) {
      maxVal = avg[cat.id];
      strongestCategory = cat.id;
    }
  });

  return PERSONAS[strongestCategory];
}

/**
 * Generates deterministic daily challenge based on day of month.
 */
export function generateDailyChallengeForDay(day: number): DailyChallenge {
  return CHALLENGE_POOL[day % CHALLENGE_POOL.length];
}

/**
 * Generates adaptive recommendations prioritizing weak categories.
 */
export function getAdaptiveRecommendations(avg: CognitiveAverages): Recommendation[] {
  const recs: Recommendation[] = [];
  const categories: Array<{ id: keyof CognitiveAverages; testId: string; label: string; link: string }> = [
    { id: 'reaction', testId: 'reaction-time', label: 'Visual Reaction', link: '/tests/reaction-time' },
    { id: 'reaction', testId: 'aim-coordination', label: 'Aim Coordination', link: '/tests/aim-coordination' },
    { id: 'memory', testId: 'dual-n-back', label: 'Dual N-Back Memory', link: '/tests/dual-n-back' },
    { id: 'processing', testId: 'pattern-reasoning', label: 'Pattern Reasoning', link: '/tests/pattern-reasoning' },
    { id: 'precision', testId: 'aim-trainer', label: 'Aim Precision', link: '/tests/aim-trainer' },
    { id: 'focus', testId: 'trail-making', label: 'Trail Making Test', link: '/tests/trail-making' },
    { id: 'stamina', testId: 'click-speed', label: 'Click Speed', link: '/tests/click-speed' }
  ];

  const sorted = [...categories].sort((a, b) => {
    const valA = avg[a.id] || 0;
    const valB = avg[b.id] || 0;
    return valA - valB;
  });

  // Take the 2 weakest categories as target training tasks
  sorted.slice(0, 2).forEach(item => {
    recs.push({
      text: `Target Weakness: Train ${item.label} to improve your index.`,
      link: item.link,
      testId: item.testId
    });
  });

  return recs;
}
