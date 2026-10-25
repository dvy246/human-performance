import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { translations, t as globalT, type LangCode } from "../i18n/translations"

export const I18nContext = createContext<LangCode | undefined>(undefined)

export function I18nProvider({
  lang,
  children,
}: {
  lang?: LangCode
  children: React.ReactNode
}) {
  return React.createElement(I18nContext.Provider, { value: lang }, children)
}

/**
 * React hook for i18n translations.
 * Reads language from override prop, I18nContext, or window.location.pathname.
 * Returns a t(key, fallback?) function and the active lang.
 */
export function useI18n(overrideLang?: LangCode) {
  const contextLang = useContext(I18nContext)
  const initialLang: LangCode =
    overrideLang ||
    contextLang ||
    (() => {
      if (typeof window !== "undefined") {
        const match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/)
        return (match ? match[1] : "en") as LangCode
      }
      return "en"
    })()

  const [lang, setLang] = useState<LangCode>(initialLang)

  useEffect(() => {
    if (overrideLang) {
      setLang(overrideLang)
      return
    }
    if (contextLang) {
      setLang(contextLang)
      return
    }
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/)
      const detected = (match ? match[1] : "en") as LangCode
      setLang(detected)
    }
  }, [overrideLang, contextLang])

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return globalT(key, lang, fallback)
    },
    [lang]
  )

  return { t, lang }
}
