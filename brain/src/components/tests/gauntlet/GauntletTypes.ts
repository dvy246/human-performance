import { determinePersona } from '../../../runtime/trainingEngine';
import type { CognitiveAverages } from '../../../runtime/skillRadar';

export interface GauntletStageResult {
  stageIndex: number;
  stageName: string;
  score: number;
  rawScore: number;
  category: keyof CognitiveAverages;
  metrics: Record<string, number>;
}

export interface StageProps {
  onComplete: (result: GauntletStageResult) => void;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export const STAGE_CONFIGS = [
  { index: 0, name: 'Visual Reaction', emoji: '⚡', duration: '~30s', category: 'reaction' as const },
  { index: 1, name: 'Sequence Memory', emoji: '🗂️', duration: '~60s', category: 'memory' as const },
  { index: 2, name: 'Stroop Test', emoji: '🎨', duration: '~40s', category: 'focus' as const },
  { index: 3, name: 'Matrix Reasoning', emoji: '🧩', duration: '~60s', category: 'processing' as const },
  { index: 4, name: 'Aim Precision', emoji: '🎯', duration: '~40s', category: 'precision' as const },
];

export function computeGauntletScore(results: GauntletStageResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
}

export function getArchetype(results: GauntletStageResult[]): { title: string; desc: string } {
  const cats: Record<string, number> = {};
  results.forEach(r => { cats[r.category] = (cats[r.category] || 0) + r.score; });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const top = entries[0]?.[0] || 'reaction';
  const archetypes: Record<string, { title: string; desc: string }> = {
    reaction: { title: 'Rapid Reactor', desc: 'Your reflexes fire before conscious thought. Sensory-motor speed is your edge.' },
    memory: { title: 'Pattern Hunter', desc: 'You encode and retrieve complex patterns effortlessly. Your memory is your weapon.' },
    processing: { title: 'Choice Strategist', desc: 'You resolve complex decisions quickly and accurately. Mental speed is your strength.' },
    precision: { title: 'Precision Targeter', desc: 'Your motor control is surgical. Fine adjustments and accuracy define you.' },
    focus: { title: 'Iron Mind', desc: 'Distractions bounce off you. Sustained concentration is your superpower.' },
  };
  return archetypes[top] || { title: 'Balanced', desc: 'Well-rounded cognitive profile across all domains.' };
}

export function getPerformanceColor(score: number): string {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-accent';
  if (score >= 50) return 'text-warning';
  return 'text-error';
}
