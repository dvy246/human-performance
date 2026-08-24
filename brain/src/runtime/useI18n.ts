import { useState, useEffect, useCallback } from "react"
import { translations, t as globalT, type LangCode } from "../i18n/translations"

/**
 * React hook for i18n translations.
 * Reads language from override prop or window.location.pathname.
 * Returns a t(key, fallback?) function and the active lang.
 */
export function useI18n(overrideLang?: LangCode) {
  const [lang, setLang] = useState<LangCode>(() => {
    if (overrideLang) return overrideLang
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/)
      return (match ? match[1] : "en") as LangCode
    }
    return "en"
  })

  useEffect(() => {
    if (overrideLang) {
      setLang(overrideLang)
      return
    }
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/)
      const detected = (match ? match[1] : "en") as LangCode
      setLang(detected)
    }
  }, [overrideLang])

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return globalT(key, lang, fallback)
    },
    [lang]
  )

  return { t, lang }
}

