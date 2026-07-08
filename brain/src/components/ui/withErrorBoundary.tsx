import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  const Wrapped: React.FC<P> = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${displayName})`;
  return Wrapped;
}
