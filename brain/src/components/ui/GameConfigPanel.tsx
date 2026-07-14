import React, { useState, useEffect } from "react"
import {
  TEST_CONFIGS,
  loadTestConfig,
  saveTestConfig,
  type ConfigOption,
  type GameConfig,
} from "../../runtime/testConfig"
import { useI18n } from "../../runtime/useI18n"

interface GameConfigPanelProps {
  testId: string
  onStart: (config: GameConfig) => void
  /** Optional override for the start button label */
  startLabel?: string
  /** Optional emoji/icon shown above the title */
  icon?: string
  /** Optional title override */
  title?: string
  /** Optional description text */
  description?: string
  /** Optional personal best to display */
  personalBest?: number | null
  /** Optional personal best label */
  personalBestLabel?: string
}

/**
 * Pre-game configuration panel shown before a test starts.
 * Displays difficulty selector, attempt/parameter options, sound toggle,
 * and a "Start Test" button. Persists last-used settings in localStorage.
 */
export default function GameConfigPanel({
  testId,
  onStart,
  startLabel = "Start Assessment",
  icon,
  title,
  description,
  personalBest,
  personalBestLabel,
}: GameConfigPanelProps) {
  const { t } = useI18n()
  const options = TEST_CONFIGS[testId] || []
  const [config, setConfig] = useState<GameConfig>(() => loadTestConfig(testId))
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("cogniarena-muted") !== "true"
  })

  // Persist sound preference globally
  useEffect(() => {
    localStorage.setItem("cogniarena-muted", soundEnabled ? "false" : "true")
  }, [soundEnabled])

  const handleOptionChange = (key: string, value: string | number) => {
    const next = { ...config, [key]: value }
    setConfig(next)
    saveTestConfig(testId, next)
  }

  const handleStart = () => {
    saveTestConfig(testId, config)
    onStart(config)
  }

  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-xl border border-card-border bg-card p-8 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        {/* Icon */}
        {icon && <span className="text-3xl">{icon}</span>}

        {/* Title */}
        {title && (
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            {description}
          </p>
        )}

        {/* Config Options */}
        {options.length > 0 && (
          <div className="mt-2 flex w-full flex-col gap-3">
            {options.map((opt: ConfigOption) => (
              <div key={opt.key} className="flex flex-col gap-1.5">
                <span className="text-left font-mono text-[10px] tracking-widest text-muted uppercase">
                  {opt.label}
                </span>
                <div className="flex gap-2">
                  {opt.options.map((val) => {
                    const isSelected = config[opt.key] === val
                    return (
                      <button
                        key={String(val)}
                        onClick={() => handleOptionChange(opt.key, val)}
                        className={`transition-standard flex-1 cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold ${
                          isSelected
                            ? "border-accent bg-accent text-white"
                            : "border-card-border bg-subtle text-muted hover:border-accent/30"
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sound Toggle */}
        <div className="mt-2 flex w-full items-center justify-between px-1">
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {t("config.sound_effects")}
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`transition-standard flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold ${
              soundEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-card-border bg-subtle text-muted"
            }`}
          >
            <span>{soundEnabled ? "🔊" : "🔇"}</span>
            <span>
              {soundEnabled ? t("config.sound_on") : t("config.sound_off")}
            </span>
          </button>
        </div>

        {/* Personal Best */}
        {personalBest !== null && personalBest !== undefined && (
          <span className="mt-1 font-mono text-xs text-accent">
            {t("config.personal_best")} {personalBest}
            {personalBestLabel ? ` ${personalBestLabel}` : ""}
          </span>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="transition-standard mt-3 h-11 w-full cursor-pointer rounded-lg bg-accent font-mono text-xs font-bold tracking-wider text-white uppercase shadow hover:bg-accent-hover active:scale-[0.98]"
        >
          {startLabel}
        </button>

        <span className="mt-2 font-mono text-[10px] text-muted/50">
          Press ? for shortcuts
        </span>
      </div>
    </div>
  )
}
