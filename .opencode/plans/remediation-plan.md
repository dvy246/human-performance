# Remediation Plan: CogniArena 3/10 → 10/10

## Strategy

Fix in 4 phases — blocking first, then systemic, then polish.

---

## Phase 1: Blocking Bugs (DO NOT DEPLOY without these)

### 1.1 Fix "Top X%" Display — Inverted Percentile

**Files:** `src/runtime/share.ts:138`, `src/components/dashboard/CognitiveProfile.tsx:825,858`, every test result screen

**Fix:**
- `share.ts:138`: Change `Top ${percentile}%` → `Top ${(100 - percentile).toFixed(1)}%`
- `CognitiveProfile.tsx:825`: Change `Top ${avgPercentile}%` → `Top ${(100 - avgPercentile)}%`
- `CognitiveProfile.tsx:858`: Change `Top ${row.percentile}%` → `Top ${(100 - row.percentile)}%`
- Every test component rendering "Top N%": apply same `100 - percentile` transform

### 1.2 Fix DualNBack — Last Trial Always Dropped

**File:** `src/components/tests/DualNBackTest.tsx:136-140,167-206`

**Root cause:** `evaluateTrialResponse` writes to React state via `setPosMatches`/`setLetterMatches`, then `evaluateResult` reads state before flush.

**Fix:** Use refs instead of state for trial result accumulation:
```typescript
const posMatchesRef = useRef<boolean[]>([]);
const letterMatchesRef = useRef<boolean[]>([]);
```
- `evaluateTrialResponse`: push to `posMatchesRef.current` and `letterMatchesRef.current` directly (no setState)
- `evaluateResult`: read from refs instead of state
- On restart: reset both refs to `[]`
- Keep `setPosMatches`/`setLetterMatches` only for display updates (run after the result calculation)

### 1.3 Fix SpatialOrientation — Rotations Produce Wrong Angles

**File:** `src/components/tests/SpatialOrientationTest.tsx:17-33`

**Root cause:** `Math.round(angle / 90)` rounds 30→0, 60→1 (90°), 120→1 (90°), 150→2 (180°). Only 90° and 180° are correct.

**Fix:** Replace `rotateGrid` with proper rotation:
```typescript
function rotateGrid(grid: number[][], angle: number): number[][] {
  const n = grid.length;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const center = (n - 1) / 2;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = j - center;
      const y = i - center;
      const newX = Math.round(x * cos - y * sin + center);
      const newY = Math.round(x * sin + y * cos + center);
      if (newX >= 0 && newX < n && newY >= 0 && newY < n) {
        out[newY][newX] = grid[i][j];
      }
    }
  }
  return out;
}
```

### 1.4 Fix PrioritizationTest — Stale Closure Loses All Progress

**File:** `src/components/tests/PrioritizationTest.tsx:43-63`

**Root cause:** `setInterval` closure captures `completed = []` from `startRound` render.

**Fix:** Use a ref for `completed`:
```typescript
const completedRef = useRef<number[]>([]);
```
- `doTask`: push to `completedRef.current`, then `setCompleted([...completedRef.current])`
- `startRound`: `completedRef.current = []`
- Interval callback: read `completedRef.current` instead of closure `completed`
- `endRound`: accept done array directly from caller (already passed as param)

### 1.5 Fix Stage5 — Errors Recoverable by Rapid Clicking

**File:** `src/components/tests/focus/Stage5WorkingMemoryUnderDistraction.tsx:128-186`

**Root cause:** After wrong click, `phase` stays `'recall'` during 1.5s timeout. User can click next correct cell and trigger success path.

**Fix:** Add `isErrorRef` guard:
```typescript
const isErrorRef = useRef(false);
```
- On wrong click (line 140): `isErrorRef.current = true` before `clearTimers()`
- `handleCellClick` entry: add `if (isErrorRef.current) return;`
- On `startLevel`: `isErrorRef.current = false`

### 1.6 Add Focus Trap to Mobile Drawer

**File:** `src/layouts/main.astro:734-768`

**Fix:** Add to the inline script:
- `Escape` key → `closeMenu()`
- Focus trap: on open, focus the first focusable element inside drawer. On Tab, cycle focus within drawer elements. Use `document.activeElement` to detect when focus leaves drawer.
- On close: return focus to the toggle button (`document.getElementById('mobile-menu-toggle')`)

### 1.7 Remove Extra `</div>` in index.astro

**File:** `src/pages/index.astro:633-634`

**Fix:** Line 633 has `</section> </div>` — the `</div>` closes the single `<div>` opened on line 11. Remove the orphan `</div>` on line 634.

```diff
-    </section> </div>
-  </div>
+    </section>
+  </div>
```

---

## Phase 2: Systemic Data Integrity (spans 21 test files)

### 2.1 Add `clickLock.current = true` to All 4 Reaction Tests

**Files:** `ReactionTimeTest.tsx:90`, `F1LightsTest.tsx`, `SoundReactionTest.tsx`, `ChoiceReactionTest.tsx`

**Pattern:** Each has `clickLock = useRef(false)` but never sets it to `true`. Copy the pattern from `GoNoGoTest.tsx:165`:
```typescript
// At the start of the scoring path (after all guards pass):
clickLock.current = true;
```
- Reset to `false` when preparing for next trial (in `queueNextSignal`/equivalent)

### 2.2 Add Cleanup to All Mount `useEffect` Blocks — All 21 Tests

**Pattern:** Every test file's initial `useEffect([])` fetches personal best, decodes challenge, etc. None return cleanup.

**Fix:** Add a `mountedRef` pattern to every test:
```typescript
useEffect(() => {
  let mounted = true;
  
  dataLayer.getPersonalBest('test-id', 'lower').then(pb => {
    if (mounted) setPersonalBest(pb);
  });
  
  // ... other async ops with `if (mounted)` guard
  
  return () => { mounted = false; };
}, []);
```

### 2.3 Add `.catch()` to Every Promise Chain

**Files:** All 21 test files, `CognitiveProfile.tsx`, `BrainScoreDashboard.tsx`

**Find pattern:** Every `.then(...)` without `.catch(...)`. Every `await dataLayer.saveSession(...)` without try/catch.

**Fix:** Add `.catch(console.error)` to every `.then()` call. Wrap `saveSession` calls in try/catch. Example:
```typescript
// Before
dataLayer.getPersonalBest('reaction-time', 'lower').then(pb => setPersonalBest(pb));
// After
dataLayer.getPersonalBest('reaction-time', 'lower').then(pb => { if (mounted) setPersonalBest(pb); }).catch(console.error);

// Before
await dataLayer.saveSession({...});
// After
try {
  await dataLayer.saveSession({...});
} catch (err) {
  console.error('Failed to save session:', err);
  // Optionally show user-facing error toast
}
```

### 2.4 Store and Cancel All `requestAnimationFrame` Handles

**Files:** All tests using double-rAF pattern

**Find pattern:** `requestAnimationFrame(() => { requestAnimationFrame(() => { ... }) })` with no handle storage.

**Fix:** 
```typescript
const rafHandle = useRef<number>(0);
// Store:
rafHandle.current = requestAnimationFrame(() => { ... });
// Cancel in unmount cleanup:
return () => cancelAnimationFrame(rafHandle.current);
```

### 2.5 Replace Stale Closure State Reads with Functional Updaters

**Files:** `MouseAccuracyTest.tsx:37-46`, `FlickTrainerTest.tsx:37-45`, `DecisionSpeedTest.tsx:26-44`, and all tests using `[...stateArray, newItem]` pattern

**Fix:** Replace direct reads with functional updaters:
```typescript
// Before
const newOffsets = [...offsets, offset];
setOffsets(newOffsets);
setTrial(trial + 1);
// After
setOffsets(prev => [...prev, offset]);
setTrial(prev => prev + 1);
```

### 2.6 Add Double-Submit Guard to All `finalize`/`finishTest` Functions

**Files:** All 21 tests

**Fix:** Add `submittedRef` guard to every finalize function:
```typescript
const submittedRef = useRef(false);
// In finalizeTest/finishTest/endRound:
if (submittedRef.current) return;
submittedRef.current = true;
// Reset on restart: submittedRef.current = false;
```

### 2.7 Fix StroopTest — Double-Counting During Feedback Window

**File:** `src/components/tests/StroopTest.tsx:91-116`

**Fix:** Add `lockedRef` guard:
```typescript
const lockedRef = useRef(false);
// In handleAnswer:
if (lockedRef.current) return;
lockedRef.current = true;

// In nextTrial:
lockedRef.current = false;
```

---

## Phase 3: Accessibility, SEO, and UI

### 3.1 Add Skip-to-Content Link

**File:** `src/layouts/main.astro`

**Fix:** Add as first child of `<body>`:
```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded-md focus:font-semibold focus:text-sm">
  Skip to main content
</a>
```
Add `id="main-content"` to the `<main>` element at line 668.

### 3.2 Add `aria-hidden="true"` to All Decorative Emoji Spans

**File:** `src/layouts/main.astro`

**Fix:** Every `<span>` containing emoji in sidebar links needs `aria-hidden="true"` (~70 instances). Pattern: `<span aria-hidden="true">🏠</span>`. Target all lines 123-360 and 409-643.

### 3.3 Add `twitter:image` Meta Tag

**File:** `src/layouts/main.astro:85-87`

**Fix:** Add after `twitter:description`:
```html
<meta name="twitter:image" content="https://cogniarena.com/og-image.png" />
```

### 3.4 Fix Duplicate `og:site_name`

**File:** `src/layouts/main.astro:80-81`

**Fix:** Remove the duplicate on line 81 (keep one instance).

### 3.5 Fix Invalid Tailwind Colors

**Files:** `src/layouts/main.astro` (zinc-650), `src/pages/index.astro` (zinc-550), all test pages (zinc-550/450/555)

**Fix:** Replace with valid Tailwind zinc values:
- `text-zinc-650` → `text-zinc-500` (or `text-zinc-400` depending on context)
- `text-zinc-550` → `text-zinc-500` (dark mode: `dark:text-zinc-400`)
- `text-zinc-450` → `text-zinc-400`
- `text-zinc-555` → `text-zinc-500`

### 3.6 Fix `<a>` Wrapping `<button>` — Invalid HTML

**File:** `src/pages/index.astro:50-59` (2 instances)

**Fix:** Replace `<a href="..."><button>...</button></a>` with styled `<a>`:
```html
<a href="/tests/focus-challenge" class="px-5 h-9 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold text-xs transition-standard active:scale-95 cursor-pointer inline-flex items-center justify-center">
  Accept Challenge
</a>
```

### 3.7 Add `theme-color` Meta Tag

**File:** `src/layouts/main.astro` — add in `<head>`:
```html
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
```

### 3.8 Add Global `:focus-visible` Rule

**File:** `src/styles/global.css`

**Fix:** Add:
```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

### 3.9 Complete the Reduced Motion Block

**File:** `src/styles/global.css:207-219`

**Fix:** Add missing classes:
```css
.stagger-1, .stagger-2, .stagger-3, .stagger-4,
.stagger-5, .stagger-6, .stagger-7, .stagger-8 {
  animation: none !important;
  animation-delay: 0s !important;
}
```

### 3.10 Fix Canvas Font Weights in Share Card

**File:** `src/runtime/share.ts`

**Fix:** Replace non-standard font-weight keywords with numeric:
- `'semibold 24px sans-serif'` → `'600 24px sans-serif'`
- `'medium 28px sans-serif'` → `'500 28px sans-serif'`
- `'semibold 18px sans-serif'` → `'600 18px sans-serif'`
- `'20px monospace'` → `'500 20px monospace'` (or drop the weight entirely since monospace is fine)

### 3.11 Add Missing `schemaJson` to 3 Test Pages

**Files:** `src/pages/tests/planning/index.astro`, `spatial-orientation/index.astro`, `decision-speed/index.astro`

**Fix:** Add `schemaJson` prop matching the pattern from other test pages:
```typescript
const schemaJson = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "Planning Test — CogniArena",
  "description": "Tower of Hanoi puzzle...",
  "about": { "@type": "Thing", "name": "Executive Function / Planning Ability" },
  "timeRequired": "PT3M",
  "assesses": ["Planning", "Problem Solving"]
};
```

---

## Phase 4: Orchestrators and Stage Fixes

### 4.1 Add `onComplete` Guard to Both Orchestrators

**Files:** `GauntletTest.tsx:34-46`, `FocusChallengeTest.tsx:163-177`

**Fix:** Add `completedRef` guard:
```typescript
const stageCompletedRef = useRef(false);
// In handleStageComplete:
if (stageCompletedRef.current) return;
stageCompletedRef.current = true;
// Reset on stage change (when currentIdx/currentStage changes, reset):
useEffect(() => { stageCompletedRef.current = false; }, [currentIdx]);
```

### 4.2 Fix Gauntlet StageSequenceMemory Score Formula

**File:** `src/components/tests/gauntlet/StageSequenceMemory.tsx:62`

**Fix:** Change denominator to use max possible levels:
```typescript
const score = Math.max(0, Math.min(100, Math.round((correctCount / MAX_LEVEL) * 70 + 30)));
```
Where `MAX_LEVEL` is the maximum sequence length (10).

### 4.3 Fix Focus Challenge Stage 3 — switchEff Always 100

**File:** `src/components/tests/focus/Stage3TaskSwitching.tsx:42`

**Fix:** Implement actual switching cost:
```typescript
const switchEff = Math.max(0, Math.min(100, Math.round(
  switchCountRef.current > 0 
    ? 100 - (switchCountRef.current / (TOTAL_TRIALS - 1)) * 50 
    : 100
)));
// Include switchEff in score calculation:
const score = Math.max(0, Math.min(100, Math.round(
  acc * 70 + (switchEff / 100) * 30
)));
```

### 4.4 Reset Stale State on Restart (Orchestrators)

**Files:** `GauntletTest.tsx:94,184`, `FocusChallengeTest.tsx:228,379`

**Fix:** Ensure ALL state vars are reset:
```typescript
setPhase('intro');
setCurrentIdx(0);
setResults([]);
setOverallScore(0);
setShareImage(null);
// Add:
setPersonalBest(null);
submittedRef.current = false;
stageCompletedRef.current = false;
```

### 4.5 Fix Floating Promises in Orchestrators

**Files:** `GauntletTest.tsx:41`, `FocusChallengeTest.tsx:172`

**Fix:** Either await before setPhase, or use void + .catch:
```typescript
if (result.stageIndex + 1 >= STAGE_CONFIGS.length) {
  setPhase('results');
  void finalizeAll(total, updated).catch(console.error);
}
```

---

## Phase 5: Runtime and Data Layer

### 5.1 Fix Grandmaster Planner Achievement False Positive

**File:** `src/components/dashboard/CognitiveProfile.tsx:284`

**Fix:** Add null guards:
```typescript
case 'grandmaster_planner':
  return history.some(r => 
    r.testId === 'planning' && 
    r.metadata != null &&
    typeof r.metadata.moves === 'number' &&
    typeof r.metadata.optimalMoves === 'number' &&
    r.metadata.moves === r.metadata.optimalMoves
  );
```

### 5.2 Fix Falsy Score Display (0 treated as '--')

**File:** `src/components/dashboard/CognitiveProfile.tsx:426`

**Fix:** `{bbiScore !== null && bbiScore !== undefined ? bbiScore : '--'}` instead of `bbiScore || '--'`

### 5.3 Fix `JSON.parse` Crash in dataLayer

**File:** `src/runtime/dataLayer.ts:246-248`

**Fix:** Wrap in try/catch:
```typescript
let metadataObj: Record<string, unknown> = {};
if (typeof item.metadata === 'string') {
  try { metadataObj = JSON.parse(item.metadata); } catch { metadataObj = {}; }
} else {
  metadataObj = item.metadata || {};
}
```

### 5.4 Fix TrailMaking Display Bug

**File:** `src/components/tests/TrailMakingTest.tsx:285`

**Fix:** Use the actual percentile from `finishTest` (stored in state), not `100 - timeInSeconds`:
```typescript
<span className="...">{personalBest !== null ? `Top ${100 - personalBest}%` : '--'}</span>
```

### 5.5 Handle Division by Zero Edge Cases

**Files:** `AimTrainer.tsx:292`, `TrailMakingTest.tsx:306-307`, `FlickTrainerTest.tsx:126`

**Fix:** Add guard:
```typescript
// AimTrainer.tsx:292
{clicks > 0 ? Math.round((30 / clicks) * 100) : 0}%
// TrailMakingTest.tsx:306
{(elapsedTime + penalties) > 0 ? (nodes.length / ((elapsedTime + penalties) / 1000)).toFixed(1) : '0.0'}/s
// FlickTrainerTest.tsx:126
{results.length > 0 ? Math.min(...results.map(r => r.rt)) : 0}
```

---

## Files Modified (Summary)

| Phase | Files | Changes |
|-------|-------|---------|
| P1 | 9 files | Blocking bug fixes |
| P2 | 25 files | Systemic data integrity |
| P3 | 8 files | Accessibility, SEO, CSS |
| P4 | 5 files | Orchestrator fixes |
| P5 | 5 files | Runtime fixes |
| **Total** | **~52 files** | |

---

## Testing After Fixes

1. **Unit tests:** Run `npm test` — verify all 56 tests still pass
2. **Typecheck:** Run `astro check` — 0 errors
3. **Build:** Run `astro build` — 37+ pages succeed
4. **Manual QA each test:**
   - Rapid double-click → only one score recorded
   - Navigate away mid-test → no warnings/errors
   - Background tab → timing resumes correctly
   - Refresh mid-test → clean state on return
   - 5 simultaneous tabs → no state corruption
5. **Accessibility audit:** Tab through entire site, verify skip link, focus trap, aria labels
6. **Cross-browser:** Chrome, Firefox, Safari, Edge
7. **Performance:** Lighthouse audit for CLS, LCP, INP
8. **Share card:** Verify "Top 5%" displays correctly for 95th percentile
