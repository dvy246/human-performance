import { useState, useEffect, useCallback } from "react"
import { translations, type LangCode } from "../i18n/translations"

declare global {
  interface Window {
    __getCurrentLang?: () => string
  }
}

/**
 * React hook for i18n translations.
 * Reads current language from window.__getCurrentLang() (set by i18n.js)
 * and listens to cogniarena:langchange events.
 * Returns a t(key) function for looking up translations.
 */
export function useI18n() {
  const [lang, setLang] = useState<LangCode>(() => {
    if (typeof window !== "undefined" && window.__getCurrentLang) {
      return (window.__getCurrentLang() as LangCode) || "en"
    }
    return "en"
  })

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: string }>
      if (customEvent.detail?.lang) {
        setLang(customEvent.detail.lang as LangCode)
      }
    }

    window.addEventListener("cogniarena:langchange", handleLangChange)
    return () =>
      window.removeEventListener("cogniarena:langchange", handleLangChange)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const dict = translations[lang] || translations["en"] || {}
      return dict[key] || translations["en"]?.[key] || key
    },
    [lang]
  )

  return { t, lang }
}
