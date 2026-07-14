import React, { useState, useEffect } from "react"
import {
  measureRefreshRate,
  type CalibrationResult,
} from "../../runtime/calibration"

export default function CalibrationBanner() {
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
  const [detecting, setDetecting] = useState(true)

  useEffect(() => {
    const cleanupCalibration = measureRefreshRate((result) => {
      setCalibration(result)
      setDetecting(false)
    })
    return () => cleanupCalibration()
  }, [])

  if (detecting) {
    return (
      <div className="bg-warning-bg border-warning-border flex animate-pulse items-center justify-center gap-2 rounded-lg border px-4 py-2 font-mono text-xs text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Detecting display refresh rate...
      </div>
    )
  }

  if (!calibration) return null

  if (calibration.hz < 60) {
    return (
      <div className="bg-warning-bg border-warning-border flex flex-col items-center gap-1 rounded-lg border px-4 py-2 font-mono text-xs text-warning">
        <span>
          ⚠️ {calibration.hz}Hz display detected — scores may include ~
          {calibration.expectedLagMs}ms paint lag. Consider enabling 60Hz+.
        </span>
        <span className="text-[10px] opacity-70">
          Your monitor: ~{calibration.measuredHz}Hz (calibrated to{" "}
          {calibration.hz}Hz for standard timing)
        </span>
      </div>
    )
  }

  return (
    <div className="bg-success-bg border-success-border flex flex-col items-center gap-0.5 rounded-lg border px-4 py-1.5 font-mono text-xs text-success">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span>
          {calibration.hz}Hz | ~{calibration.expectedLagMs}ms expected display
          lag
        </span>
      </span>
      <span className="text-[10px] opacity-70">
        Your monitor: ~{calibration.measuredHz}Hz (calibrated to{" "}
        {calibration.hz}Hz for standard timing)
      </span>
    </div>
  )
}
