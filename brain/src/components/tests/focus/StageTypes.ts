export interface StageResult {
  stageIndex: number;
  stageName: string;
  score: number;
  metrics: Record<string, number>;
}

export interface StageProps {
  onComplete: (result: StageResult) => void;
  calibrationHz: number;
}

export interface StageConfig {
  index: number;
  name: string;
  description: string;
  emoji: string;
  duration: string;
}

export const STAGE_CONFIGS: StageConfig[] = [
  { index: 0, name: 'Selective Attention', description: 'Find the target among distractions', emoji: '🎯', duration: '~30s' },
  { index: 1, name: 'Impulse Control', description: 'Ignore fake notifications', emoji: '🛡️', duration: '~30s' },
  { index: 2, name: 'Task Switching', description: 'Switch between rules rapidly', emoji: '🔄', duration: '~40s' },
  { index: 3, name: 'Sustained Attention', description: 'Stay focused for 90 seconds', emoji: '🧘', duration: '~90s' },
  { index: 4, name: 'WM Under Distraction', description: 'Remember sequences through noise', emoji: '🧠', duration: '~45s' },
];

export function computeOverallScore(stageResults: StageResult[]): number {
  if (stageResults.length === 0) return 0;
  const total = stageResults.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / stageResults.length);
}

export function getPerformanceLabel(score: number): string {
  if (score >= 90) return 'Elite Focus';
  if (score >= 75) return 'Sharp';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Distractible';
  return 'Scattered';
}

export function getPerformanceColor(score: number): string {
  if (score >= 90) return 'text-success';
  if (score >= 75) return 'text-accent';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}
