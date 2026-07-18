import React, { useState, useEffect, useRef } from "react"
import { allTests, type TestEntry } from "../../data/tests"

interface GameSearchProps {
  variant?: "default" | "compact"
}

export default function GameSearch({ variant = "default" }: GameSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TestEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter tests based on search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const term = query.toLowerCase()
    const filtered = allTests.filter(
      (test) =>
        test.title.toLowerCase().includes(term) ||
        test.shortDesc.toLowerCase().includes(term) ||
        test.category.toLowerCase().includes(term)
    )

    setResults(filtered)
    setIsOpen(true)
    setActiveIndex(-1)
  }, [query])

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < results.length) {
        window.location.href = results[activeIndex].href
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const isCompact = variant === "compact"

  return (
    <div
      ref={containerRef}
      className={`relative w-full z-40 ${
        isCompact ? "max-w-[120px] sm:max-w-[180px] md:max-w-[240px]" : "max-w-md mx-auto"
      }`}
    >
      {/* Search Input Bar */}
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted`}
        >
          <svg
            className={isCompact ? "h-3.5 w-3.5" : "h-5 w-5"}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder={isCompact ? "Search..." : "Search 29+ cognitive tests & games..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-8 bg-card/85 border border-card-border/70 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-muted/70 shadow-sm ${
            isCompact ? "py-1 pr-7 text-xs h-8 focus:max-w-[180px] md:focus:max-w-[300px]" : "pr-4 py-3 text-sm h-11"
          }`}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-muted hover:text-foreground cursor-pointer"
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 bg-card/95 border border-card-border rounded-xl shadow-xl backdrop-blur-md overflow-hidden max-h-72 overflow-y-auto animate-fade-in ${
            isCompact ? "right-0 w-64 sm:w-80 md:w-96" : "w-full"
          }`}
        >
          {results.length > 0 ? (
            <div className="py-1 divide-y divide-card-border/30">
              {results.map((test, index) => {
                const isActive = index === activeIndex
                return (
                  <a
                    key={test.slug}
                    href={test.href}
                    className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive ? "bg-accent/10 text-foreground" : "hover:bg-hover text-foreground/90"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{test.icon}</span>
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-tight">{test.title}</span>
                        <span className="px-1 py-0.2 text-[8px] font-semibold font-mono tracking-wider uppercase rounded bg-subtle text-accent border border-accent/10">
                          {test.category}
                        </span>
                      </div>
                      <span className="text-[10px] leading-normal text-muted line-clamp-1">
                        {test.shortDesc}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-center text-muted text-[10px]">
              No assessments found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
