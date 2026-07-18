import React, { useState, useEffect } from "react"
import { useI18n } from "../../runtime/useI18n"

export default function HowToPlayModal() {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [guideData, setGuideData] = useState<{
    measures: string
    scoring: string
    affects: string
  } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const pathname = window.location.pathname

    // Parse slug from URL: /tests/reaction-time -> reaction-time, /gauntlet -> gauntlet
    let testSlug: string | null = null
    if (pathname === "/gauntlet" || pathname === "/gauntlet/") {
      testSlug = "gauntlet"
    } else {
      const match = pathname.match(/^\/tests\/([^/]+)/)
      if (match) {
        const parsed = match[1]
        if (parsed !== "results" && parsed !== "") {
          testSlug = parsed
        }
      }
    }

    if (!testSlug) return
    setSlug(testSlug)

    const seen = localStorage.getItem(`seen_guide_${testSlug}`)
    if (seen) return

    // If not seen, wait for the DOM guidelines to be available
    let attempts = 0
    const interval = setInterval(() => {
      const measures = document.querySelector("[data-guide-measures]")?.textContent || ""
      const scoring = document.querySelector("[data-guide-scoring]")?.textContent || ""
      const affects = document.querySelector("[data-guide-affects]")?.textContent || ""

      if (measures || scoring) {
        setGuideData({ measures, scoring, affects })
        setIsVisible(true)
        clearInterval(interval)
      } else {
        attempts++
        if (attempts > 50) {
          clearInterval(interval)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Expose global trigger for re-opening
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleShowModal = () => {
      const measures = document.querySelector("[data-guide-measures]")?.textContent || ""
      const scoring = document.querySelector("[data-guide-scoring]")?.textContent || ""
      const affects = document.querySelector("[data-guide-affects]")?.textContent || ""
      setGuideData({ measures, scoring, affects })
      setIsVisible(true)
    }

    ;(window as any).__showHowToPlayModal = handleShowModal

    return () => {
      delete (window as any).__showHowToPlayModal
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    if (slug) {
      localStorage.setItem(`seen_guide_${slug}`, "true")
    }
  }

  if (!isVisible || !guideData) return null

  return (
    <div className="animate-fade-in fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-card-border bg-card/95 p-6 md:p-8 shadow-2xl backdrop-blur-md animate-fade-in-up">
        {/* Glow decoration */}
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-muted transition-all hover:bg-hover hover:text-foreground cursor-pointer"
          aria-label="Close guide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent text-xl">
            📖
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t("modal.how_to_play")}
            </h2>
            <p className="text-xs text-muted uppercase tracking-wider font-mono">
              Onboarding Guide
            </p>
          </div>
        </div>

        {/* Content Modules */}
        <div className="space-y-5 mb-8">
          {guideData.measures && (
            <div className="rounded-xl border border-card-border/50 bg-subtle p-4">
              <h3 className="mb-1.5 font-bold text-sm text-foreground flex items-center gap-2">
                <span className="text-accent">💡</span> {t("modal.what_it_measures")}
              </h3>
              <p className="text-xs leading-relaxed text-muted">{guideData.measures}</p>
            </div>
          )}

          {guideData.scoring && (
            <div className="rounded-xl border border-card-border/50 bg-subtle p-4">
              <h3 className="mb-1.5 font-bold text-sm text-foreground flex items-center gap-2">
                <span className="text-accent">📈</span> {t("modal.how_scoring_works")}
              </h3>
              <p className="text-xs leading-relaxed text-muted">{guideData.scoring}</p>
            </div>
          )}

          {guideData.affects && (
            <div className="rounded-xl border border-card-border/50 bg-subtle/50 p-4">
              <h3 className="mb-1.5 font-bold text-xs text-secondary uppercase tracking-wider font-mono">
                ⚡ {t("modal.variables_affecting_performance")}
              </h3>
              <p className="text-xs leading-relaxed text-muted">{guideData.affects}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-accent/10"
          >
            {t("modal.got_it")}
          </button>
        </div>
      </div>
    </div>
  )
}
