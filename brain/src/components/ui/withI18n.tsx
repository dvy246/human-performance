import React from "react"
import { useI18n } from "../../runtime/useI18n"

export function withI18n<P extends object>(
  Component: React.ComponentType<P & { t: (key: string) => string; lang: string }>
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component"
  const Wrapped: React.FC<P> = (props: P) => {
    const { t, lang } = useI18n()
    return <Component {...props} t={t} lang={lang} />
  }
  Wrapped.displayName = `withI18n(${displayName})`
  return Wrapped
}
