export type TestState = 'idle' | 'countdown' | 'waiting' | 'ready' | 'result' | 'abort';

export interface TestStateConfig {
  state: TestState;
  instructions: string;
  className: string;
}

export const STATE_CONFIGS: Record<TestState, TestStateConfig> = {
  idle: {
    state: 'idle',
    instructions: 'Click anywhere to begin.',
    className: 'bg-zinc-950 hover:bg-zinc-900 border border-zinc-800'
  },
  countdown: {
    state: 'countdown',
    instructions: 'Get ready...',
    className: 'bg-zinc-950 border border-zinc-800 cursor-wait'
  },
  waiting: {
    state: 'waiting',
    instructions: 'Wait for green...',
    className: 'bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 cursor-pointer'
  },
  ready: {
    state: 'ready',
    instructions: 'CLICK NOW!',
    className: 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 cursor-pointer'
  },
  result: {
    state: 'result',
    instructions: 'Completed.',
    className: 'bg-zinc-950 border border-zinc-800'
  },
  abort: {
    state: 'abort',
    instructions: 'Too early! Click to try again.',
    className: 'bg-rose-950 hover:bg-rose-900 border border-rose-900 cursor-pointer animate-pulse'
  }
};
