export interface CalibrationResult {
  hz: number
  measuredHz: number
  expectedLagMs: number
}

// Full standard refresh rates from PAL TV to flagship esports displays
export const REFRESH_RATE_STANDARDS = [
  50, 60, 75, 90, 100, 120, 144, 165, 180, 200, 240, 280, 300, 360, 480, 540,
]

export function measureRefreshRate(
  onComplete: (result: CalibrationResult) => void,
  options?: { frameCount?: number; forceFresh?: boolean }
): () => void {
  if (typeof window === "undefined" || !window.requestAnimationFrame) {
    onComplete({ hz: 60, measuredHz: 60, expectedLagMs: 8.3 })
    return () => {}
  }

  // Check sessionStorage cache if not forcing fresh detection
  if (!options?.forceFresh) {
    try {
      const cached = sessionStorage.getItem("cogniarena_display_calibration")
      if (cached) {
        const parsed = JSON.parse(cached) as CalibrationResult
        if (
          parsed &&
          typeof parsed.hz === "number" &&
          parsed.hz >= 50 &&
          REFRESH_RATE_STANDARDS.includes(parsed.hz)
        ) {
          onComplete(parsed)
          return () => {}
        }
      }
    } catch {
      // Ignore sessionStorage failure
    }
  }

  const frameTimes: number[] = []
  let lastTime = performance.now()
  let frameCount = 0
  let rafId: number | null = null
  let timeoutId: number | null = null
  const WARMUP_FRAMES = 2
  const targetFrameCount = (options?.frameCount ?? 45) + WARMUP_FRAMES

  function finalize() {
    if (frameTimes.length === 0) {
      const fallback: CalibrationResult = {
        hz: 60,
        measuredHz: 60,
        expectedLagMs: 8.3,
      }
      onComplete(fallback)
      return
    }

    // Sort to compute robust median and filter multi-vsync dropped frames
    const sorted = [...frameTimes].sort((a, b) => a - b)
    const medianDt = sorted[Math.floor(sorted.length / 2)]

    // Filter out multi-vsync dropped frames (> 1.45 * median) and sub-frame burst noise (< 0.65 * median)
    const fundamentalFrames = sorted.filter(
      (dt) => dt >= 0.65 * medianDt && dt <= 1.45 * medianDt
    )
    const validFrames = fundamentalFrames.length >= 5 ? fundamentalFrames : sorted

    // Trim top and bottom 10% of fundamental frames for sub-millisecond precision
    const k = validFrames.length
    const startIdx = Math.floor(k * 0.1)
    const endIdx = Math.max(startIdx + 1, Math.floor(k * 0.9))
    const trimmed = validFrames.slice(startIdx, endIdx)

    const avgDuration =
      trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length
    const measuredHz = Number((1000 / avgDuration).toFixed(1))

    // Find closest standard refresh rate by nominal frame interval
    let closestStandard = REFRESH_RATE_STANDARDS[0]
    let minDelta = Infinity

    for (const std of REFRESH_RATE_STANDARDS) {
      const nominalDt = 1000 / std
      const delta = Math.abs(avgDuration - nominalDt)
      if (delta < minDelta) {
        minDelta = delta
        closestStandard = std
      }
    }

    const nominalDt = 1000 / closestStandard
    const relativeError = Math.abs(avgDuration - nominalDt) / nominalDt

    // Snap to standard if within 14% tolerance of nominal frame time (e.g. 52-69Hz -> 60Hz; 125-163Hz -> 144Hz)
    let hz = Math.round(measuredHz)
    if (relativeError <= 0.14) {
      hz = closestStandard
    }

    // Expected display latency is half of one frame interval
    const expectedLagMs = Number((1000 / hz / 2).toFixed(1))
    const result: CalibrationResult = { hz, measuredHz, expectedLagMs }

    try {
      sessionStorage.setItem(
        "cogniarena_display_calibration",
        JSON.stringify(result)
      )
    } catch {
      // Ignore sessionStorage quota error
    }

    onComplete(result)
  }

  function step(now: number) {
    const elapsed = now - lastTime
    lastTime = now

    // Skip warmup frames to avoid layout/hydration initialization noise
    // Also ignore outlier frames from background tab pause (>500ms) or <=0.5ms
    if (frameCount >= WARMUP_FRAMES && elapsed > 0.5 && elapsed < 500) {
      frameTimes.push(elapsed)
    }

    frameCount++

    if (frameCount < targetFrameCount) {
      rafId = requestAnimationFrame(step)
    } else {
      finalize()
    }
  }

  // Safety fallback if rAF is blocked or paused in background
  if (typeof window.setTimeout === "function") {
    timeoutId = window.setTimeout(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        finalize()
      }
    }, 2000)
  }

  rafId = requestAnimationFrame(step)

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
  }
}
