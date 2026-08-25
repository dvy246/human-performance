import React, { useState, useEffect, useRef } from "react"
import { languages, getLocalizedPath, type LangCode } from "../../i18n/translations"

export interface LanguageSwitcherProps {
  initialLang?: LangCode
}

export default function LanguageSwitcher({ initialLang = "en" }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<LangCode>(initialLang)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/)
      const detected = (match ? match[1] : "en") as LangCode
      setCurrentLang(detected)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLanguageChange = (code: LangCode) => {
    setIsOpen(false)
    setCurrentLang(code)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("language", code)
      } catch (e) {}
      if (typeof (window as unknown as { __applyTranslations?: (c: string) => void }).__applyTranslations === "function") {
        (window as unknown as { __applyTranslations: (c: string) => void }).__applyTranslations(code)
      }
      const targetPath = getLocalizedPath(window.location.pathname, code)
      if (window.location.pathname !== targetPath) {
        window.location.href = targetPath
      }
    }
  }

  const currentLanguage =
    languages.find((l) => l.code === currentLang) || languages[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-standard flex cursor-pointer items-center gap-1.5 rounded-md border border-card-border bg-card/60 px-2.5 py-1.5 text-xs text-muted outline-none hover:border-muted hover:bg-hover hover:text-foreground active:scale-95"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">
          {currentLanguage.code.toUpperCase()}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-fade-in absolute top-full right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-card-border bg-card shadow-lg">
          {languages.map((lang) => {
            const targetUrl = typeof window !== "undefined"
              ? getLocalizedPath(window.location.pathname, lang.code)
              : (lang.code === "en" ? "/" : `/${lang.code}`)
            return (
              <a
                key={lang.code}
                href={targetUrl}
                data-astro-prefetch="hover"
                onClick={(e) => {
                  e.preventDefault()
                  handleLanguageChange(lang.code)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-subtle ${
                  currentLang === lang.code
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang === lang.code && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

