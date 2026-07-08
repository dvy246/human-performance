# Refactoring Plan: Cognitive Testing Architectural Overhaul

This plan outlines the systematic refactoring of the cognitive testing codebase to fix architectural flaws, stale closures, memory leaks, and data scaling issues while maintaining type safety and performance.

## 1. StroopTest.tsx Refactoring
**File:** `brain/src/components/tests/StroopTest.tsx`

- **Stale Closure Fix:** 
  - Add `correctCountRef`, `congruentScoresRef`, and `incongruentScoresRef` using `useRef`.
  - Update these refs inside `handleAnswer` alongside the state updates.
  - Modify `finishTest` to read values from these refs instead of state variables.
- **Memory Leak Fix:**
  - Introduce `feedbackTimerRef` to track the 500ms feedback timeout.
  - Update `handleAnswer` to store the timeout handle in `feedbackTimerRef`.
  - Ensure `timerRef` and `feedbackTimerRef` are cleared in `startTest` and the `useEffect` cleanup block.
- **Async Execution Sync:**
  - Update `finishTest` to `await dataLayer.getPersonalBest` before calling `redirectToResults`.

## 2. VerbalMemoryTest.tsx Refactoring
**File:** `brain/src/components/tests/VerbalMemoryTest.tsx`

- **Metric Scaling Fix:**
  - In `finalize`, change the `percentile` parameter in `redirectToResults` to use `correct` (raw count) instead of `score` (percentage).
- **Timeout Safety:**
  - Create `levelTimerRef` to track the 400ms `startLevel` timeout.
  - Clear `levelTimerRef` in the component's unmount cleanup.

## 3. ClickSpeedTest.tsx Refactoring
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`

- **Initialization Logic:**
  - Remove the synthetic `handleClick` call from `startTest`.
  - Implement a clean initialization in `startTest` that sets `gameState` to `idle` (or directly to `clicking` if we want to start immediately, but the prompt says to configure timestamps and states directly).
  - Ensure the first physical click registers as click #1.

## 4. NumberMemoryTest.tsx & ChoiceReactionTest.tsx Refactoring
- **NumberMemoryTest.tsx:**
  - Map the 30ms `setInterval` to `timerRef`.
  - Add `clearInterval(timerRef.current)` to the `useEffect` cleanup.
  - Use functional update for `highestLevel`: `setHighestLevel(prev => Math.max(prev, level))`.
- **ChoiceReactionTest.tsx:**
  - Create `pressedKeyTimerRef` for the 150ms `pressedKey` timeout.
  - Clear `pressedKeyTimerRef` on unmount.

## 5. F1LightsTest.tsx Refactoring
**File:** `brain/src/components/tests/F1LightsTest.tsx`

- **Dynamic Divisor:**
  - Replace the hardcoded `/ 5` divisor with `/ Math.max(1, attempts.length)` in the result display view (line 341).

## 6. Systemwide Tab Visibility Engine
- **New Hook:** Create `brain/src/runtime/useVisibilityGuard.ts`.
  - Implement a hook that listens for `blur` and `visibilitychange`.
  - It should accept a callback to pause or invalidate the test.
- **Integration:** 
  - Apply `useVisibilityGuard` to all 6 test components.

## 7. Architectural Data Layers (src/runtime/)
- **dataLayer.ts:**
  - Implement module-level caching for the `IDBDatabase` connection.
  - Replace `Math.min(...scores)` and `Math.max(...scores)` with `.reduce()` based implementations to avoid stack overflow on large datasets.
- **share.ts:**
  - Replace `escape`/`unescape` with `TextEncoder`/`TextDecoder` in `encodeChallenge` and `decodeChallenge`.
  - Add `await document.fonts.ready` at the beginning of `generateShareCard`.

## Verification Plan
- **Type Checking:** Run `tsc` to ensure zero type errors.
- **Runtime Verification:** 
  - Verify Stroop scores are accurate after the feedback delay.
  - Check that tab switching pauses or resets tests.
  - Confirm Verbal Memory percentiles are correctly calculated from raw counts.
  - Ensure Click Speed starts at 0 and first click is 1.
  - Test data persistence with the new connection pooling.
