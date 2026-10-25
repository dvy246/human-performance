import React from "react"
import { ErrorBoundary } from "./ErrorBoundary"
import { I18nProvider } from "../../runtime/useI18n"
import type { LangCode } from "../../i18n/translations"

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P & { lang?: LangCode }> {
  const displayName = Component.displayName || Component.name || "Component"
  const Wrapped: React.FC<P & { lang?: LangCode }> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <I18nProvider lang={props.lang}>
        <Component {...props} />
      </I18nProvider>
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${displayName})`
  return Wrapped
}
