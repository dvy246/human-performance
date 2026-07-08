# Final Production Audit & Logic Optimization Plan

This plan addresses minor logic flaws and edge cases discovered during a deep analysis of the refactored cognitive testing codebase. These changes ensure 100% metric accuracy and system stability for production.

## 1. StroopTest Accuracy Safeguard
**File:** `brain/src/components/tests/StroopTest.tsx`
- **Bug:** Potential `NaN` if `trialCount.current` is 0 (though unlikely, it's a safety flaw).
- **Fix:** Update `totalAccuracy` calculation to use `Math.max(1, trialCount.current)`.

## 2. ClickSpeedTest Precision Fix
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`
- **Bug:** CPS inflation. The 100ms interval check can drift, allowing up to ~99ms of extra clicking time while using the static `duration` as the divisor.
- **Fix:** 
  - Store the actual elapsed time: `const actualElapsed = (performance.now() - startTime.current) / 1000;`.
  - Use `actualElapsed` as the divisor for the final CPS calculation in `finalizeTest`.
  - Optimize `generateChartPath` to skip redundant calculations if `clickRates` hasn't changed.

## 3. F1LightsTest Result Consistency
**File:** `brain/src/components/tests/F1LightsTest.tsx`
- **Audit:** Ensure the dynamic divisor is applied everywhere.
- **Fix:** Verified the previous refactor applied the dynamic divisor to the UI, but ensure the `saveSession` metadata also reflects the correct average calculation.

## 4. ChoiceReactionTest Input Integrity
**File:** `brain/src/components/tests/ChoiceReactionTest.tsx`
- **Audit:** Potential race condition between mouse and keyboard.
- **Fix:** Ensure `handleKeyDown` check `gameState === 'ready'` is strictly enforced and that `clickLock` prevents any overlapping execution if a user triggers both input methods simultaneously.

## 5. Architectural Data Layer Polish
**File:** `brain/src/runtime/dataLayer.ts`
- **Audit:** Verify all `Math.min/max` spread patterns are eliminated.
- **Fix:** Double-check `getHistory` or other utility methods for hidden spreads.

## Verification Steps
- **CPS Accuracy:** Run a 5s Click Speed test and verify the CPS matches `clicks / actual_seconds`.
- **Stroop Safety:** Manually set trial count to 0 in a dev build to ensure no crash.
- **Input Stress Test:** Rapidly mash keys and click during Choice Reaction to ensure only one input registers per trial.
