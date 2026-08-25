import React, { useState, useEffect, useCallback } from "react"
import {
  measureRefreshRate,
  type CalibrationResult,
} from "../../runtime/calibration"
import { useI18n } from "../../runtime/useI18n"

export default function CalibrationBanner() {
  const { t } = useI18n()
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [detecting, setDetecting] = useState(true)

  const runCalibration = useCallback((forceFresh = false) => {
    setDetecting(true)
    const cleanup = measureRefreshRate(
      (result) => {
        setCalibration(result)
        setDetecting(false)
      },
      { forceFresh, frameCount: 50 }
    )
    return cleanup
  }, [])

  useEffect(() => {
    const cleanup = runCalibration(false)
    return () => cleanup()
  }, [runCalibration])

  if (detecting) {
    return (
      <div className="flex animate-pulse items-center justify-center gap-2 rounded-lg border border-warning-border bg-warning-bg px-4 py-2 font-mono text-xs text-warning">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-warning" />
        <span>{t("calibration.detecting", "Calibrating display refresh rate & frame timing...")}</span>
      </div>
    )
  }

  if (!calibration) return null

  const isLowHz = calibration.hz < 60

  return (
    <div
      className={`group relative flex flex-col items-center justify-between gap-1 rounded-lg border px-4 py-1.5 font-mono text-xs transition-colors sm:flex-row ${
        isLowHz
          ? "border-warning-border bg-warning-bg text-warning"
          : "border-success-border bg-success-bg text-success"
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            isLowHz ? "bg-warning" : "bg-success"
          }`}
        />
        <span className="font-semibold">
          {calibration.hz}Hz Display
        </span>
        <span className="text-[11px] opacity-80">
          | ~{calibration.expectedLagMs}ms paint latency
        </span>
        <span className="hidden text-[10px] opacity-60 md:inline">
          (measured: {calibration.measuredHz}Hz)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => runCalibration(true)}
          title="Re-calibrate display refresh rate"
          className="inline-flex cursor-pointer items-center gap-1 rounded border border-current/20 px-1.5 py-0.5 text-[10px] opacity-75 transition-all hover:bg-current/10 hover:opacity-100 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span>Re-detect</span>
        </button>
      </div>
    </div>
  )
}
