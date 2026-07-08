import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const defaultFallback = (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center gap-4">
    <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-lg">
      ⚠
    </div>
    <div>
      <h3 className="text-foreground font-semibold text-sm">Something went wrong</h3>
      <p className="text-muted text-xs mt-1">
        This test encountered an unexpected error. Please try again.
      </p>
    </div>
    <button
      onClick={() => window.location.reload()}
      className="px-4 h-8 rounded bg-accent hover:bg-accent-hover text-white font-medium text-xs transition-colors"
    >
      Reload
    </button>
  </div>
);

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || defaultFallback;
    }
    return this.props.children;
  }
}
