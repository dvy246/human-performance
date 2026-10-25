import React from "react"
import { useI18n } from "../../runtime/useI18n"
import type { LangCode } from "../../i18n/translations"

export function withI18n<P extends object>(
  Component: React.ComponentType<P & { t: (key: string) => string; lang: string }>
): React.FC<P & { lang?: LangCode }> {
  const displayName = Component.displayName || Component.name || "Component"
  const Wrapped: React.FC<P & { lang?: LangCode }> = (props) => {
    const { t, lang } = useI18n(props.lang)
    return <Component {...props} t={t} lang={lang} />
  }
  Wrapped.displayName = `withI18n(${displayName})`
  return Wrapped
}
