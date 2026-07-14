import React from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const defaultFallback = (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-error/20 bg-error/10 text-lg">
      ⚠
    </div>
    <div>
      <h3 className="text-sm font-semibold text-foreground">
        Something went wrong
      </h3>
      <p className="mt-1 text-xs text-muted">
        This test encountered an unexpected error. Please try again.
      </p>
    </div>
    <button
      onClick={() => window.location.reload()}
      className="h-11 rounded bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
    >
      Reload
    </button>
  </div>
)

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || defaultFallback
    }
    return this.props.children
  }
}
