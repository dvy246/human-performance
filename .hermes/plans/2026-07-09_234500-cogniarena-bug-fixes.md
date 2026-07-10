# CogniArena Production Readiness Bug Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix all identified bugs across test components, routing, and edge cases to make the CogniArena platform production-ready. This plan covers 6 confirmed bugs: DualNBack staircasing mismatch, DecisionSpeed ignoring difficulty timeout, SPA routing flash on CF Pages, PatternReasoning `questionCount` display inconsistency, `redirectToResults` premature navigation, and the existing calibration test failure.

**Architecture:** Each bug fix is scoped to a single file or small group of files. All fixes are independent and can be parallelized. Tests use Vitest with jsdom override per file. Build target: 77 pages via Astro, deployed to Cloudflare Pages.

**Tech Stack:** Astro 6, React 19, TypeScript ~6, Vitest 4, Tailwind 4, Cloudflare Pages

---

### Pre-Fix: Verify Current State

Run the full test suite and build to capture the baseline.

**Step 1:** `cd brain && npm test -- --run`
Expected: 55 pass, 1 fail (calibration.test.ts)

**Step 2:** `cd brain && npm run build`
Expected: 77 pages, 0 errors, ~4 sec

---

## Bug 1: DualNBack — Staircasing Changes n Mid-Block, Breaking Match Detection

**Root cause:** The sequence is generated once at `startTest()` with a fixed `nVal` (e.g., 2). The staircasing in `evaluateTrialResponse()` modifies `currentNRef.current` dynamically (increments to 3 after 3 consecutive correct, decrements on error). But `evaluateTrialResponse` uses `currentNRef.current` to compute `list[idx - currentNRef.current]` — comparing against the wrong n-back offset. 

Example: Sequence generated with n=2. User performs well, staircasing bumps n to 3 mid-block. Now trial evaluation compares `list[idx].position === list[idx-3].position`, but the actual match was generated as `list[idx].position === list[idx-2].position`. Result: positions that were correct matches appear as non-matches and vice versa. The test becomes broken for any user who achieves 3+ consecutive correct trials.

### Task 1.1: Fix DualNBack staircasing to regenerate sequence on level change

**Files:**
- Modify: `brain/src/components/tests/DualNBackTest.tsx`

**Approach:** Two options:
1. **Regenerate on level change** — simplest, most correct: When `n` changes, regenerate the remaining sequence for the new n value and continue from the current trial index.
2. **Pre-generate for all n levels** — generate a sequence where each trial's match targets are determined for the maximum possible n (7), and the evaluation uses whatever n is current. Complex, wastes data.

Go with option 1: regenerate remaining trials when n changes.

**Step 1:** In `evaluateTrialResponse`, after `currentNRef.current` changes (both up and down), regenerate the remaining sequence from `currentIdx + 1` to `TOTAL_TRIALS` with the new n, schedule remaining trials, and `return` early (don't call `runNextTrial` from the old `setTimeout` chain — use a ref to cancel old chain).

**Step 2:** Add a `sequenceGenerationNRef` to track what n was used to generate the current sequence, so we can detect mismatch.

**Step 3:** Run existing tests + manual verification.

**Risk:** Timer chain management. The `runNextTrial` function uses `setTimeout` chaining — need to cancel pending timers and restart with new sequence.

---

## Bug 2: DecisionSpeedTest — Timeout Uses Hardcoded Constant Instead of Difficulty Config

**Root cause:** Line 43 uses `TIMEOUT_MS` (constant 2000) instead of `timeoutMs.current` (which is set from difficulty config via `getDifficultyParams`). The difficulty selector has no effect on actual timeout — it always uses 2 seconds.

### Task 2.1: Fix timeout reference

**Files:**
- Modify: `brain/src/components/tests/DecisionSpeedTest.tsx`

**Step 1:** Change line 43 from `}, TIMEOUT_MS);` to `}, timeoutMs.current);`

**Step 2:** Verify build: `npm run build` — should still be 0 errors.

---

## Bug 3: SPA Routing — `redirectToResults` Causes Full-Page Navigation Flash on Cloudflare Pages

**Root cause:** `redirectToResults()` at `brain/src/runtime/redirectToResults.ts:20` does `window.location.href = '/tests/results/'`, which triggers a full browser page navigation. On Cloudflare Pages, `/tests/results/` is not in the `_redirects` file as a 200 SPA fallback, so the browser fetches the page from the server, causing a 3-second "no page found" flash while the SPA fallback kicks in (only `/challenge/*`, `/tests/flick-trainer`, and `/gauntlet` have explicit fallbacks in `_redirects`).

**Fix options:**
1. **Add generic SPA fallback** to `_redirects` — `/* /index.html 200` — but this would capture ALL routes including API endpoints.
2. **Add specific SPA fallback entries** for all test pages and `/tests/results/`.
3. **Replace `window.location.href` with client-side routing** — use `window.history.pushState` + dispatch a navigation event, or use Astro's built-in client router.

Option 2 is safest for Cloudflare Pages (no risk of capturing API routes). Option 3 is better UX (no flash at all) but requires Astro client-side router setup.

### Task 3.1: Add comprehensive SPA fallback entries to `_redirects`

**Files:**
- Modify: `brain/public/_redirects`

**Step 1:** Add entries for ALL 23 test slugs + `/tests/results/` + `/dashboard/` + `/gauntlet/` + `/benchmarks/*`

```bash
# SPA fallback routes (200 rewrite, not redirect)
/tests/*  /tests/results/  200
/dashboard  /dashboard  200
/benchmarks/*  /benchmarks/index.html  200
/records  /records  200
/history  /history  200
```

Wait — Cloudflare Pages needs a single-page fallback for Astro SPA behavior. Astro outputs static HTML for every route, so `/tests/results/index.html` exists in `dist/`. The issue is that `window.location.href` triggers a navigation that must resolve to an actual file. Since the file exists in `dist/`, this should work... 

Let me re-examine the actual issue. The "3 secs no page found" is likely the `TestResultsPage` component reading `sessionStorage.getItem('cogniarena-last-result')` and finding `null` because:

- `redirectToResults()` sets sessionStorage then immediately navigates
- The new page loads, `TestResultsPage` mounts, reads sessionStorage — this should work synchronously
- BUT if the TestResultsPage is a React island with `client:load`, it may render before the JS hydrates, showing "No Results Found" briefly, then re-rendering when React mounts and reads sessionStorage

That's the real issue: **hydration flash**. The Astro page renders the "No Results Found" fallback first (server-rendered), then React hydrates and re-renders with the actual data from sessionStorage.

### Task 3.2: Prevent hydration flash on results page

**Files:**
- Modify: `brain/src/pages/tests/results/index.astro`
- Modify: `brain/src/components/ui/TestResultsPage.tsx`

**Approach:** Pass sessionStorage data as a data attribute on the server-rendered page, read it on hydration before first render.

But sessionStorage is client-only — Astro can't access it during SSR. Instead, use URL query params:

**Step 1:** Change `redirectToResults()` to pass data via URL params instead of sessionStorage:

```typescript
// redirectToResults.ts
export function redirectToResults(payload: ResultsPayload): void {
  const params = new URLSearchParams();
  params.set('testId', payload.testId);
  params.set('testName', payload.testName);
  params.set('attempts', JSON.stringify(payload.attempts));
  params.set('unit', payload.unit);
  params.set('percentile', String(payload.percentile));
  params.set('personalBest', String(payload.personalBest ?? ''));
  params.set('category', payload.category);
  params.set('average', String(payload.average));
  window.location.href = `/tests/results/?${params.toString()}`;
}
```

**Step 2:** Update `TestResultsPage.tsx` to read from URL params as primary source, with sessionStorage as fallback:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('testId')) {
    setData({
      testId: params.get('testId')!,
      testName: params.get('testName')!,
      attempts: JSON.parse(params.get('attempts')!),
      unit: params.get('unit')!,
      percentile: Number(params.get('percentile')),
      personalBest: params.get('personalBest') ? Number(params.get('personalBest')) : null,
      category: params.get('category')!,
      average: Number(params.get('average')),
    });
    // Clean URL
    window.history.replaceState({}, '', '/tests/results/');
    return;
  }
  // Fallback to sessionStorage
  const raw = sessionStorage.getItem('cogniarena-last-result');
  if (raw) setData(JSON.parse(raw));
}, []);
```

**Step 3:** Update ALL 25 test components to use the new `redirectToResults` signature (compatible — just adding URL params, no signature change).

Wait — this approach has URL-length issues. `attempts` array could be up to 25 numbers... JSON.stringify would make a long URL. Most browsers support up to ~2000 chars in URL, so should be fine for typical attempt counts. But let me think of a cleaner approach.

**Better approach:** Keep sessionStorage for data but add a `hasResult` flag in URL params so the server-rendered Astro page can show a loading state instead of the "No Results Found" fallback:

```typescript
// redirectToResults.ts
export function redirectToResults(payload: ResultsPayload): void {
  try {
    sessionStorage.setItem('cogniarena-last-result', JSON.stringify(payload));
  } catch { /* ignore */ }
  window.location.href = '/tests/results/?hasResult=1';
}
```

```typescript
// TestResultsPage.tsx
// At top, read query param
const hasResultParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('hasResult');

// If hasResultParam is true, show loading spinner instead of "No Results Found"
if (!data) {
  if (hasResultParam) {
    return <LoadingSkeleton />;
  }
  // existing fallback UI...
}
```

Wait, this still won't prevent the flash because `hasResultParam` is evaluated at React hydration time, not during SSR. The Astro page renders the `<TestResultsPage client:load />` which includes the fallback div...

**Most pragmatic fix:** Add a `_redirects` entry and let the hydration flash be handled by a short loading state. The real user pain is the 3-second CF Pages routing delay, not the 200ms hydration flash. So fix the `_redirects` first.

### Task 3.1 (revised): Add comprehensive SPA fallback entries

**Files:**
- Modify: `brain/public/_redirects`

Add these entries:
```
/tests/results  /tests/results  200
/dashboard  /dashboard  200
/records  /records  200
/history  /history  200
/benchmarks/*  /benchmarks/  200
```

### Task 3.3: Add loading state to TestResultsPage

**Files:**
- Modify: `brain/src/components/ui/TestResultsPage.tsx`

**Step 1:** Add a brief loading spinner state that appears when data is null but the URL has a `hasResult` param. The `redirectToResults` sets `?hasResult=1` as a signal.

**Step 2:** After loading data from sessionStorage, clean the URL with `history.replaceState`.

---

## Bug 4: PatternReasoning — `questionCount` Display Shows Hardcoded "5" Regardless of Config

**Root cause:** Line 577 displays `Q {currentIdx + 1} / 5` — hardcoded "5" instead of `questionCount.current`.

### Task 4.1: Fix display to use actual question count

**Files:**
- Modify: `brain/src/components/tests/PatternReasoningTest.tsx`

**Step 1:** Change line 577 from `/ 5` to `/ {questionCount.current}`.

**Step 2:** Build verification.

---

## Bug 5: PatternReasoning — `generateSequenceQuestion` Uses Wrong Shape in Sequence Display

**Root cause:** The `generateSequenceQuestion()` function picks a random `seqShapeIdx` for the display sequence (line 278) but `Shape` (line 268) was picked for the correct answer. The shapes shown in `q.sequence` use `SeqShape`, while the correct answer options use `SeqShape` too — this is actually consistent since both sequence items and answer use the same `SeqShape`. However, `shapeIdx` (line 267) is unused — it's randomized but never used. This is not a functional bug per se, but dead code.

Actually, re-checking: the rotations are applied to `SeqShape` consistently. The `shapeIdx` line 267 is indeed dead code (unused variable). Not critical, skip for now.

## Bug 6: DualNBack — Keyboard Handler Dependency Array Causes Stale Closures

**Root cause:** Line 298, the `useEffect` for keyboard handling depends on `[gameState, handleMatchPosition, handleMatchLetter]`. `handleMatchPosition` and `handleMatchLetter` are `useCallback` hooks that depend on `[gameState, currentIdx, n]`. When `n` changes via staircasing, the handlers are recreated, but the effect re-subscribes. This is actually working correctly due to React's dependency tracking — but the cleanup/re-add cycle on every n change could cause a brief window where keyboard events are dropped.

**No fix needed** — this is correct React patterns. The cleanup is immediate and the new listener is added synchronously.

## Bug 7: DualNBack — Memory Leak / Timer Cleanup Issue

**Root cause:** `speakLetter` calls `window.speechSynthesis.cancel()` each time a new letter is spoken. This cancels the PREVIOUS utterance, which is correct. However, if the user restarts or the component unmounts, `speechSynthesis.cancel()` is called in the cleanup effect (line 68). Good — this is already handled.

But there's a subtler issue: `runNextTrial` sets `sequenceTimerRef` and `trialTimerRef` but if `startTest` is called again (restart), the old timers from a previous run are not cleared. `startTest` clears state but not the timer refs — `runNextTrial` does clear them at lines 165/171 but only during execution. If restart happens while timers are pending, the old timers fire and interfere.

### Task 7.1: Clear timers on startTest

**Files:**
- Modify: `brain/src/components/tests/DualNBackTest.tsx`

**Step 1:** In `startTest`, add timer cleanup before launching new sequence:
```typescript
if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
```

**Step 2:** Also cancel speech synthesis on restart (prevents stale audio):
```typescript
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.cancel();
}
```

---

## Pre-Existing: Calibration Test Failure (141Hz → 144Hz Snap)

**Root cause:** The test expects 141Hz to snap to 144Hz but the calibration code returns 141. The snap logic in `calibration.ts` likely doesn't handle values between 140-143 correctly — 141 is closer to 144 (diff=3) than 120 (diff=21) or 165 (diff=24), but the snap table may not include 144 as a standard.

### Task 8.1: Fix calibration snap logic or update test

**Files:**
- Either: `brain/src/runtime/calibration.ts` (fix code)
- Or: `brain/src/runtime/__tests__/calibration.test.ts` (update expected value)

**Step 1:** Read calibration.ts to understand the snap table.

**Step 2:** If 141Hz isn't snapping to 144 because the snap logic uses rounding instead of closest-match, fix the logic. Otherwise if 144 isn't in the standards list, add it or update the test.

---

## Summary of All Tasks

| # | Bug | Severity | File(s) |
|---|-----|----------|---------|
| 1 | DualNBack staircasing breaks match detection | CRITICAL | `DualNBackTest.tsx` |
| 2 | DecisionSpeed ignores difficulty timeout | MEDIUM | `DecisionSpeedTest.tsx` |
| 3 | SPA routing flash on CF Pages | MEDIUM | `_redirects`, `TestResultsPage.tsx`, `redirectToResults.ts` |
| 4 | PatternReasoning hardcoded question count | LOW | `PatternReasoningTest.tsx` |
| 7 | DualNBack timer leak on restart | MEDIUM | `DualNBackTest.tsx` |
| 8 | Calibration test 141→144Hz snap | LOW | `calibration.ts` or test |

**Order:** Bug 1 first (critical), then Bug 7 (same file), then Bug 2 (simple), then Bug 3 (routing), then Bug 4 (cosmetic), then Bug 8.

**Verification:** After all fixes:
1. `npm run build` — 77 pages, 0 errors
2. `npm test -- --run` — 56 pass (calibration fix should resolve the 1 failure)
3. Manual smoke: open DualNBack, PatternReasoning, DecisionSpeed in browser, complete tests, verify results page shows immediately