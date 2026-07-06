import React, { useState, useEffect } from 'react';
import { measureRefreshRate, type CalibrationResult } from '../../runtime/calibration';

export default function CalibrationBanner() {
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    measureRefreshRate((result) => {
      setCalibration(result);
      setDetecting(false);
    });
  }, []);

  if (detecting) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs font-mono text-amber-600 dark:text-amber-400 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Detecting display refresh rate...
      </div>
    );
  }

  if (!calibration) return null;

  if (calibration.hz < 60) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-600 dark:text-amber-400">
        <span>⚠️</span>
        <span>{calibration.hz}Hz display detected — scores may include ~{calibration.expectedLagMs}ms paint lag. Consider enabling 60Hz+.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-1.5 px-4 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-xs font-mono text-emerald-600 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>{calibration.hz}Hz | ~{calibration.expectedLagMs}ms expected display lag</span>
    </div>
  );
}
