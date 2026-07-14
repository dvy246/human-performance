import React, { useState, useEffect, useRef } from "react"

declare global {
  interface Window {
    __applyTranslations?: (lang: string) => void
    __getCurrentLang?: () => string
  }
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState("en")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("language")
    if (stored && languages.find((l) => l.code === stored)) {
      setCurrentLang(stored)
      // Apply stored language on mount
      if (window.__applyTranslations) {
        window.__applyTranslations(stored)
      }
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

  const handleLanguageChange = (code: string) => {
    setCurrentLang(code)
    localStorage.setItem("language", code)
    setIsOpen(false)

    // Apply translations across all pages
    if (window.__applyTranslations) {
      window.__applyTranslations(code)
    } else {
      document.documentElement.lang = code
    }

    // Show notification
    const langName = languages.find((l) => l.code === code)?.name || code
    showNotification(`Language changed to ${langName}`)
  }

  const showNotification = (message: string) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed top-4 right-4 z-[200] px-4 py-2 bg-card border border-card-border rounded-lg shadow-lg text-sm text-foreground animate-fade-in"
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.opacity = "0"
      notification.style.transition = "opacity 0.3s"
      setTimeout(() => notification.remove(), 300)
    }, 2000)
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
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
