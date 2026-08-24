import React, { useState, useEffect } from "react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read directly from DOM classList for instant sync
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
    setMounted(true)

    // Listen to system theme changes if no manual preference is saved
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const next = e.matches ? "dark" : "light"
        setTheme(next)
        if (next === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }

    mediaQuery.addEventListener("change", handleSystemChange)
    return () => mediaQuery.removeEventListener("change", handleSystemChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }

    // Update mobile theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        nextTheme === "dark" ? "#000000" : "#f8fafc"
      )
    }

    // Dispatch event for canvas & charts
    window.dispatchEvent(
      new CustomEvent("cogniarena:themechange", { detail: { theme: nextTheme } })
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-8 w-14 cursor-pointer items-center rounded-full border border-card-border bg-subtle p-1 shadow-inner transition-colors duration-300 outline-none hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent active:scale-95 before:absolute before:-inset-2 before:content-['']"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Background Track Icons */}
      <span
        className={`absolute left-1.5 z-0 flex h-5 w-5 items-center justify-center text-amber-500 transition-opacity duration-300 ${
          isDark ? "opacity-70 group-hover:opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </span>

      <span
        className={`absolute right-1.5 z-0 flex h-5 w-5 items-center justify-center text-blue-400 transition-opacity duration-300 ${
          !isDark ? "opacity-70 group-hover:opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>

      {/* The sliding thumb */}
      <div
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300 transform ${
          isDark
            ? "translate-x-6 bg-accent text-white shadow-blue-500/30"
            : "translate-x-0 bg-amber-500 text-white shadow-amber-500/30"
        } ${!mounted ? "transition-none" : ""}`}
      >
        {isDark ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </div>
    </button>
  )
}
