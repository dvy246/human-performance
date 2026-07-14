import React, { useEffect } from "react"

export default function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Don't trigger if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case "r":
          // Restart test - look for restart button
          const restartBtn = document.querySelector(
            '[data-shortcut="restart"]'
          ) as HTMLButtonElement
          if (restartBtn) {
            e.preventDefault()
            restartBtn.click()
          }
          break

        case "escape":
          // Exit test - look for exit button
          const exitBtn = document.querySelector(
            '[data-shortcut="exit"]'
          ) as HTMLButtonElement
          if (exitBtn) {
            e.preventDefault()
            exitBtn.click()
          }
          break

        case " ":
        case "enter":
          // Start test - look for start button
          const startBtn = document.querySelector(
            '[data-shortcut="start"]'
          ) as HTMLButtonElement
          if (startBtn) {
            e.preventDefault()
            startBtn.click()
          }
          break

        case "h":
          // Go home
          if (e.target === document.body) {
            e.preventDefault()
            window.location.href = "/"
          }
          break

        case "?":
          // Show keyboard shortcuts help
          const helpModal = document.getElementById("keyboard-shortcuts-help")
          if (helpModal) {
            e.preventDefault()
            helpModal.classList.toggle("hidden")
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return null
}

export function KeyboardShortcutsHelp() {
  return (
    <div
      id="keyboard-shortcuts-help"
      className="fixed inset-0 z-[90] flex hidden items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-lg border border-card-border bg-card p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Start test</span>
            <kbd className="rounded border border-card-border bg-subtle px-2 py-1 font-mono text-xs">
              Space / Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Restart test</span>
            <kbd className="rounded border border-card-border bg-subtle px-2 py-1 font-mono text-xs">
              R
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Exit test</span>
            <kbd className="rounded border border-card-border bg-subtle px-2 py-1 font-mono text-xs">
              Esc
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Go home</span>
            <kbd className="rounded border border-card-border bg-subtle px-2 py-1 font-mono text-xs">
              H
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Show this help</span>
            <kbd className="rounded border border-card-border bg-subtle px-2 py-1 font-mono text-xs">
              ?
            </kbd>
          </div>
        </div>

        <button
          onClick={() =>
            document
              .getElementById("keyboard-shortcuts-help")
              ?.classList.add("hidden")
          }
          className="mt-6 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
