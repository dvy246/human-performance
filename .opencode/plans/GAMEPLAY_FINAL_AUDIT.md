# GAMEPLAY_FINAL_AUDIT.md — CogniArena Production Readiness

**Date:** 2026-07-09
**Status:** 🔴 **Blocking Issues Found — Further Gameplay Work Required**

---

## Executive Summary

CogniArena has a strong architecture, thoughtful SEO foundations, and 23+ cognitive assessments spanning 6 domains. The core game loop is consistent across all tests. The platform supports i18n, local-first storage, calibration, and composite assessments.

**However, the platform cannot ship in its current state.** Every game has at least 1 bug, gameplay issue, or UX problem. The CPS test is fundamentally broken. Several tests lack sound entirely. The homepage misrepresents itself.

---

## Scoring

| Category | Score | Notes |
|---|---|---|
| Gameplay Quality | **4/10** | CPS broken, sound missing in 2 tests, feedback loops weak |
| UX & Navigation | **6/10** | Good layout/sidebar, but dead ends, missing instructions, broken anchors |
| Retention & Engagement | **5/10** | Replay motivation low in memory/focus tests, no pause/skip |
| SEO & Discoverability | **7/10** | Strong foundations, but homepage title is wrong, search schema invalid |
| Mobile Experience | **7/10** | Grids degrade well, bottom nav works |
| Production Readiness | **4/10** | Blocked by P0 CPS bug + multiple P1 gameplay issues |

---

## VERIFIED ISSUES

### P0 — Must Fix Before Release

#### 1. CPS: Duration Selector is Broken
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`
**Severity:** CRITICAL

- `startTest(config)` stores config in `lastConfig.current` but **never calls `setDuration()`**
- Timer always runs for 10 seconds regardless of user selection (5, 10, 30, or 60)
- `setDuration` is declared but **never called**

**Fix:** Read `config.duration` inside `startTest`, call `setDuration(config.duration as Duration)`.

#### 2. CPS: Difficulty Has Zero Effect
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`
**Severity:** HIGH

- `getDifficultyParams` imported but never called
- `testConfig.ts` explicitly excludes `click-speed`
- Difficulty toggle renders three buttons but test behaves identically at all settings

**Fix:** Implement difficulty params or remove the option.

#### 3. CPS: Display CPS ≠ Saved CPS
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`
**Severity:** HIGH

- Result screen uses `(clicks / duration).toFixed(1)` (nominal 10s)
- `finalizeTest` uses `finalClicks / actualElapsed` (actual time)
- These differ — user sees wrong CPS, percentile uses wrong CPS
- `copyChallengeLink` also uses nominal

**Fix:** Use actual `cps` variable from `finalizeTest` everywhere.

#### 4. CPS: 6 Unused Variables (Dead Code)
**File:** `brain/src/components/tests/ClickSpeedTest.tsx`
**Severity:** MEDIUM

- `getDifficultyParams`, `DURATIONS`, `totalAttempts`, `waitRange`, `lastConfig`, `clickTimes`
- Copied from reaction test template, config-reading logic omitted

**Fix:** Remove all dead code.

---

### P1 — Must Fix Before Release

#### 5. Stroop: No Sound
**File:** `brain/src/components/tests/StroopTest.tsx`
**Severity:** HIGH — Feels unfinished.

- `useSound` never imported. No audio feedback at all.

**Fix:** Import `useSound`, add feedback sounds.

#### 6. Number Memory: No Sound
**File:** `brain/src/components/tests/NumberMemoryTest.tsx`
**Severity:** HIGH

- `useSound` never imported.

**Fix:** Import `useSound`, add feedback sounds.

#### 7. Stroop: No Colorblind-Accessible Palette
**File:** `brain/src/components/tests/StroopTest.tsx`
**Severity:** HIGH — Excludes ~8% of male users.

- Uses RED (`#ef4444`) and GREEN (`#22c55e`)
- Red-green colorblindness affects ~8% of males

**Fix:** Replace with blue/orange or add colorblind-friendly toggle.

#### 8. Stroop: Feedback Too Brief / Hidden
**File:** `brain/src/components/tests/StroopTest.tsx`
**Severity:** HIGH

- 500ms duration, `text-xs` in `h-6` container below stimulus
- Player focused on buttons misses feedback entirely

**Fix:** Increase to 800-1000ms with background flash.

#### 9. Go/No-Go: `noGoRate` Named Wrong
**File:** `brain/src/components/tests/GoNoGoTest.tsx`
**Severity:** HIGH

- `Math.random() < noGoRate` actually controls Go trial probability
- Higher value = more Go trials = easier test
- Name suggests opposite behavior

**Fix:** Rename to `goRate` or invert logic.

#### 10. Go/No-Go: False Alarms Don't Consume Attempts
**File:** `brain/src/components/tests/GoNoGoTest.tsx`
**Severity:** HIGH

- False alarm adds no entry to `attempts`
- `totalAttempts` limit never reached from false alarms
- Test extends indefinitely if player keeps clicking distractors

**Fix:** Add false alarm to `attempts`.

#### 11. Go/No-Go: No Correct Inhibition Feedback
**File:** `brain/src/components/tests/GoNoGoTest.tsx`
**Severity:** HIGH

- When player correctly withholds response on distractor, screen silently transitions
- No positive reinforcement

**Fix:** Show brief green flash or "✓ Correct!" indicator.

#### 12. Focus Challenge: `calibrationHz` Hardcoded to 60
**File:** `brain/src/components/tests/FocusChallengeTest.tsx`
**Severity:** HIGH

- All 5 stages receive hardcoded 60Hz
- On 120Hz+ displays, stimulus timing is incorrect

**Fix:** Run `measureRefreshRate` in component, pass actual calibration.

#### 13. Focus Challenge: `personalBest: null` in Results
**File:** `brain/src/components/tests/FocusChallengeTest.tsx`
**Severity:** HIGH

- `redirectToResults` passes `personalBest: null`
- PB is fetched async but ignored
- "New PB" badge never shows

**Fix:** Pass actual PB value.

#### 14. Number Memory: Stale `highestLevel` Closure
**File:** `brain/src/components/tests/NumberMemoryTest.tsx`
**Severity:** HIGH — Final score may be incorrect.

- `handleSubmit` captures `highestLevel` from closure
- Functional updater on line 123 doesn't update the closure value
- Line 145 uses stale value for final score

**Fix:** Use ref for `highestLevel`.

#### 15. Reaction Time: Challenge Link Uses Hardcoded `/5`
**File:** `brain/src/components/tests/ReactionTimeTest.tsx`
**Severity:** HIGH

- Line 272: `attempts.reduce(...) / 5` ignores user's attempt count
- Wrong if user configured 3 or 10 attempts

**Fix:** Replace `/5` with `/ totalAttempts.current`.

#### 16. Focus Challenge: Stale `stageResults` Closure
**File:** `brain/src/components/tests/FocusChallengeTest.tsx`
**Severity:** HIGH

- `handleStageComplete` captures `stageResults` from closure
- Not wrapped in `useCallback`
- Async stage completion may lose prior results

**Fix:** Use functional updater: `setStageResults(prev => [...prev, result])`.

#### 17. Homepage Title is "Reaction Time Test"
**File:** `brain/src/pages/index.astro`
**Severity:** HIGH — Misrepresents the platform.

- Title: `"Reaction Time Test — Free Online Reflex & Cognitive Assessment | CogniArena"`
- H1: `"Free Reaction Time Test — Measure Your Reflexes"`
- Homepage is platform hub, not a single test page

**Fix:** Change to `"CogniArena — Free Cognitive Performance Tests & Brain Training"`.

#### 18. Homepage: Broken Anchor Link
**File:** `brain/src/pages/index.astro`
**Severity:** HIGH

- Line 165: `<a href="/tests/focus-challenge#learn">`
- Target page has no `id="learn"` element

**Fix:** Add `id="learn"` on focus-challenge page or remove `#learn`.

#### 19. Typing Speed Missing from Homepage
**File:** `brain/src/pages/index.astro`
**Severity:** HIGH

- `/tests/typing-speed` exists but has no card in any category grid
- Undiscoverable from visual suite

**Fix:** Add card to Motor Performance category.

#### 20. Results Page: Missing Assessment Name
**File:** `brain/src/components/ui/TestResultsPage.tsx`
**Severity:** HIGH

- Page doesn't display `data.testName` anywhere
- URL is always `/tests/results/` regardless of test
- User may not know what test they just took

**Fix:** Add `<h2>{data.testName} Results</h2>` to page header.

---

### P2 — Should Fix Before Release

| # | Issue | File | Fix |
|---|---|---|---|
| 21 | Sequence Memory: No celebration pause between rounds | `SequenceMemoryTest.tsx:130-134` | Add 500-800ms delay |
| 22 | Sequence Memory: `playSequence` not cancellable on unmount | `SequenceMemoryTest.tsx:98-110` | Add `mounted` ref check |
| 23 | Sequence Memory: Difficulty only changes flash timing | `SequenceMemoryTest.tsx:66-68` | Add grid size/start length variation |
| 24 | Focus Challenge: No pause/skip mechanism | `FocusChallengeTest.tsx` | Add pause button |
| 25 | Focus Challenge: Difficulty is single generic scalar | `testConfig.ts:256-260` | Add per-stage params |
| 26 | Go/No-Go: False alarm screen shows no score context | `GoNoGoTest.tsx:345-361` | Add progress indicator |
| 27 | Reaction Time: Result area is clickable (accidental restart) | `ReactionTimeTest.tsx:160-162` | Remove click handler from results |
| 28 | Homepage: SearchAction schema points to nonexistent endpoint | `main.astro:47` | Remove SearchAction or implement search |
| 29 | Trail Making appears in two categories | `index.astro` | Consolidate or clarify |
| 30 | Dashboard subtitle too technical | `dashboard/index.astro:30` | Simplify to 2 sentences |
| 31 | Results "Challenge a Friend" links to same URL as "Play Again" | `TestResultsPage.tsx:246` | Use share mechanism instead |

---

## Gameplay Scores by Test

| Test | Score | Status |
|---|---|---|
| Click Speed (CPS) | **3/10** | 🔴 Blocked (P0) |
| Stroop | **4/10** | 🔴 Blocked (P1) |
| Number Memory | **5/10** | 🔴 Blocked (P1) |
| Go/No-Go | **5/10** | 🔴 Blocked (P1) |
| Focus Challenge | **5/10** | 🔴 Blocked (P1) |
| Sequence Memory | **6/10** | ⚠️ Needs work (P2) |
| Reaction Time | **6/10** | ⚠️ Needs work (P1+P2) |
| F1 Lights | 7/10 | ✅ Minor polish |
| Sound Reaction | 7/10 | ✅ Minor polish |
| Choice Reaction | 7/10 | ✅ Minor polish |
| Visual Pattern | 7/10 | ✅ Minor polish |
| Verbal Memory | 7/10 | ✅ Minor polish |
| Dual N-Back | 7/10 | ✅ Minor polish |
| Spatial Orientation | 7/10 | ✅ Minor polish |
| Trail Making | 7/10 | ✅ Minor polish |
| Pattern Reasoning | 7/10 | ✅ Minor polish |
| Planning | 7/10 | ✅ Minor polish |
| Prioritization | 7/10 | ✅ Minor polish |
| Decision Speed | 7/10 | ✅ Minor polish |
| Aim Trainer | 7/10 | ✅ Minor polish |
| Aim Coordination | 7/10 | ✅ Minor polish |
| Mouse Accuracy | 7/10 | ✅ Minor polish |
| Flick Trainer | 7/10 | ✅ Minor polish |
| Typing Speed | 7/10 | ✅ Minor polish |

---

## Difficulty Scaling Verdict

| Test | Differentiation | Verdict |
|---|---|---|
| Reaction Time | Wait range widens/narrows | ✅ Meaningful |
| F1 Lights | Wait range adjusts | ✅ Meaningful |
| Sound Reaction | Wait range adjusts | ✅ Meaningful |
| Choice Reaction | Wait + penalty | ✅ Meaningful |
| **Go/No-Go** | Params exist but noGoRate named wrong | ❌ Broken |
| **Click Speed** | No effect at all | ❌ Broken |
| **Sequence Memory** | Flash timing only | ⚠️ Too shallow |
| Number Memory | Start length + display time | ✅ Meaningful |
| Visual Pattern | Grid + tiles + display | ✅ Meaningful |
| Verbal Memory | List size + max level | ✅ Meaningful |
| Dual N-Back | Start N + trials + match rate | ✅ Meaningful |
| Stroop | Incongruent ratio + timeout | ✅ Meaningful |
| Trail Making | Node count + penalty | ✅ Meaningful |
| Spatial Orientation | Choices + timeout | ✅ Meaningful |
| **Focus Challenge** | Single scalar (0.8/1.0/1.3) | ❌ Too generic |
| **Gauntlet** | Single scalar (0.8/1.0/1.3) | ❌ Too generic |
| Pattern Reasoning | Question count + rule types | ✅ Meaningful |
| Planning | Disk count (3/4/5) | ✅ Meaningful |
| Prioritization | Round time (12/10/8s) | ✅ Meaningful |
| Decision Speed | Timeout (3000/2000/1500ms) | ✅ Meaningful |

---

## Onboarding Review

- **Focus Challenge stages:** ✅ Already have numbered how-to-play steps
- **All 22+ standalone tests:** ❌ Still use single-paragraph descriptions
- **CPS Test:** Description says "10-second test" but user can select 5-60s
- **Typing Speed:** No header instructions at all
- **Reaction Time:** No numbered steps, single paragraph

---

## Navigation / Dead Ends

| Page | Risk | Notes |
|---|---|---|
| About | ⚠️ | No content-level outgoing links |
| Contact | ⚠️ | Same |
| Privacy | ⚠️ | Same |
| Terms | ⚠️ | Same |
| Methodology | ⚠️ | Same |
| Learn pages | ⚠️ | Only 1 link out to corresponding test |
| `/learn/reaction-time/` | 🔴 | **Zero** content-level links to any test |
| Test results | ✅ | Links: Play Again, Dashboard, 2 related tests |

**Missing:** Sequential Previous/Next test navigation (entire platform).

---

## SEO Critical Issues

| # | Issue | Severity |
|---|---|---|
| 1 | Homepage title is "Reaction Time Test" — brand-last, too narrow | HIGH |
| 2 | SearchAction schema → non-existent search endpoint | MEDIUM |
| 3 | No `@id` on WebPage schema | LOW |
| 4 | Duplicate Organization schema (page + layout) | MEDIUM |
| 5 | Typing Speed has no homepage card | MEDIUM |
| 6 | Broken `#learn` anchor link | MEDIUM |

---

## Final Verdict

### 🟢 Production Ready
None of the assessments meet this bar.

### 🟡 Minor Polish Remaining
F1 Lights, Sound Reaction, Choice Reaction, Visual Pattern, Verbal Memory, Dual N-Back, Spatial Orientation, Trail Making, Pattern Reasoning, Planning, Prioritization, Decision Speed, Aim Trainer, Aim Coordination, Mouse Accuracy, Flick Trainer, Typing Speed

### 🔴 Further Gameplay Work Required

| Assessment | Blocking Issues |
|---|---|
| **Click Speed (CPS)** | Duration broken (P0), difficulty broken (P1), CPS display bug (P1), dead code |
| **Stroop** | No sound (P1), no colorblind access (P1), feedback too brief (P1) |
| **Number Memory** | No sound (P1), stale closure bug (P1) |
| **Go/No-Go** | noGoRate bug (P1), false alarms infinite (P1), no inhibition feedback (P1) |
| **Focus Challenge** | PB null (P1), calibration hardcoded (P1), stale closures (P1), no pause (P2) |
| **Sequence Memory** | No celebration (P2), uncancellable animation (P2), shallow difficulty (P2) |
| **Reaction Time** | Challenge avg hardcoded (P1), accidental restart (P2) |

**Additionally:** Results page missing assessment name, homepage title misrepresents platform, instructions still use paragraphs (22+ tests), no sequential navigation, 4 pages are content dead-ends.

---

## Recommended Phases

### Phase 1 — P0 Fixes (~1 hour)
1. CPS: Read `config.duration`, call `setDuration()`
2. CPS: Use actual CPS on result screen
3. CPS: Remove dead code
4. Homepage: Fix `#learn` anchor

### Phase 2 — P1 Fixes (~4-6 hours)
5. Stroop: Sound, colorblind palette, feedback duration
6. Number Memory: Sound, stale closure fix
7. Go/No-Go: Fix noGoRate, fix false alarm attempts, add inhibition feedback
8. Focus Challenge: Fix PB null, use real calibration, fix stale closures
9. Reaction Time: Fix challenge avg divisor, add restart button
10. Homepage: Fix title/H1, add Typing Speed card
11. Results page: Add assessment name

### Phase 3 — P2 UX (~3-4 hours)
12. Sequence Memory: Celebration pause, cancellable animation, difficulty tuning
13. Focus Challenge: Pause button, per-stage difficulty tuning
14. Dashboard: Simplify subtitle
15. Fix SearchAction schema
16. Numbered instructions for all standalone tests
17. Sequential navigation between assessments

### Phase 4 — Launch
18. Final regression pass
19. Verify all P0/P1 fixes
20. Production deploy
