export interface CalibrationResult {
  hz: number;
  measuredHz: number;
  expectedLagMs: number;
}

export function measureRefreshRate(onComplete: (result: CalibrationResult) => void): () => void {
  if (typeof window === 'undefined' || !window.requestAnimationFrame) {
    onComplete({ hz: 60, measuredHz: 60, expectedLagMs: 16.7 });
    return () => {};
  }

  const frameTimes: number[] = [];
  let lastTime = performance.now();
  let frameCount = 0;
  let rafId: number | null = null;
  const targetFrameCount = 30; // Measure over 30 frames for stability

  function step(now: number) {
    const elapsed = now - lastTime;
    lastTime = now;

    // Skip the first frame to avoid initialization anomaly
    if (frameCount > 0) {
      frameTimes.push(elapsed);
    }

    frameCount++;

    if (frameCount < targetFrameCount) {
      rafId = requestAnimationFrame(step);
    } else {
      const avgDuration = frameTimes.reduce((sum, val) => sum + val, 0) / frameTimes.length;
      
      // Calculate refresh rate (Hz)
      const measuredHz = Number((1000 / avgDuration).toFixed(1));
      let hz = Math.round(measuredHz);

      // Snap to common standard values (tighter 2Hz tolerance for accuracy)
      const standards = [60, 75, 90, 120, 144, 165, 240, 280, 360];
      const snapped = standards.find(s => Math.abs(s - hz) <= 2);
      if (snapped) hz = snapped;

      // Expected display latency is half of one frame interval
      const expectedLagMs = Number((1000 / hz / 2).toFixed(1));

      onComplete({ hz, measuredHz, expectedLagMs });
    }
  }

  rafId = requestAnimationFrame(step);
  
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}
