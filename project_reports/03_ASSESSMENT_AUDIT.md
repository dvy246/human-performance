# 03 — Assessment Audit

## Methodology

Each assessment was audited via static code analysis of its React component. Logic flow, timing mechanisms, scoring formulas, percentile lookups, anti-cheat measures, state management, data persistence, and share functionality were verified. Runtime behavior could not be executed; findings are based on code correctness.

---

## 1. Visual Reaction Time (`ReactionTimeTest.tsx`, 427 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Timing mechanism | PASS | Double `requestAnimationFrame` for paint-synced start. `performance.now()` for sub-ms precision. |
| Attempt count | PASS | 5 attempts, averaged. |
| Random delay | PASS | 2–5 seconds between attempts. |
| Anti-cheat | PASS | Filters scores < 80ms (anticipation threshold). |
| Percentile lookup | PASS | Uses `percentiles.json` → `reaction-time` table correctly. |
| Score calculation | PASS | Average of 5 valid attempts in ms. |
| State machine | PASS | idle → countdown → waiting → ready → result → abort. |
| Data persistence | PASS | `dataLayer.saveSession` with testId, category, rawScore, percentile. |
| Share card | PASS | Canvas-generated 1200×630 PNG. |
| Challenge link | PASS | Encodes testId + score via Base64. |
| Hardware calibration | PASS | Displays Hz, expected display lag. |
| Keyboard support | PASS | Space/Enter to trigger. |
| Restart | PASS | "Try Again" resets to intro. |
| Distribution chart | PASS | SVG normal curve with user score pin. |

**Verdict**: PASS — Gold standard implementation.

---

## 2. F1 Start Lights (`F1LightsTest.tsx`, 358 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Timing mechanism | PASS | `performance.now()` after light sequence. |
| Light sequence | PASS | 5 sequential lights → all out → react. |
| Random delay | PASS | Variable timing between lights. |
| Anti-cheat | PASS | Early click detection (jump start). |
| Percentile lookup | PASS | Uses `percentiles.json` → `f1-lights` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |
| Restart | PASS | Available. |

**Verdict**: PASS

---

## 3. Sound Reflex (`SoundReactionTest.tsx`, 382 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Audio mechanism | PASS | Web Audio API `OscillatorNode` at 750Hz. Sub-ms latency. |
| Timing | PASS | `performance.now()` at audio scheduling time. |
| Random delay | PASS | Variable pre-sound silence. |
| Anti-cheat | PASS | Early click filter. |
| Percentile lookup | PASS | Uses `percentiles.json` → `sound-reaction` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 4. Choice Reaction (`ChoiceReactionTest.tsx`, 388 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Task | PASS | 4-target grid, click matching target. Hick's Law measurement. |
| Timing | PASS | `performance.now()` per trial. |
| Trial count | PASS | Multiple trials with random targets. |
| Percentile lookup | PASS | Uses `percentiles.json` → `choice-reaction` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 5. Sequence Memory (`SequenceMemoryTest.tsx`, 269 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Simon-style grid pattern recall. Increasing sequence length. |
| Level progression | PASS | Starts at 1, increases on success. |
| Display time | PASS | Scales with sequence length. |
| Error handling | PASS | Game over on wrong recall. |
| Percentile lookup | PASS | Uses `percentiles.json` → `sequence-memory` table. |
| Data persistence | PASS | Saves level reached. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 6. Number Memory (`NumberMemoryTest.tsx`, 408 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Digit span recall. Increasing digit count. |
| Level progression | PASS | Starts short, increases. |
| Display time | PASS | Scales with digit count. |
| Input validation | PASS | Text input for recalling numbers. |
| Percentile lookup | PASS | Uses `percentiles.json` → `number-memory` table. |
| Data persistence | PASS | Saves level reached. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 7. Verbal Memory (`VerbalMemoryTest.tsx`, 171 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Word list encoding → recall from distractors. |
| Level progression | PASS | 3 + level words, max 12. Max level 12. |
| Encoding time | PASS | `min(3000, len * 1200)` ms. |
| Distractor generation | PASS | Equal count of target words + distractors, shuffled. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` with `[10,20,...,100]` mapping instead of `percentiles.json` → `verbal-memory` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation is incorrect.

---

## 8. Dual N-Back (`DualNBackTest.tsx`, 435 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Configurable N-level. Visual position + auditory letter. |
| Scoring | PASS | Points based on correct dual matches. |
| N-level progression | PASS | Adaptive difficulty. |
| Percentile lookup | PASS | Uses `percentiles.json` → `dual-n-back` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 9. Pattern Reasoning (`PatternReasoningTest.tsx`, 610 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Question types | PASS | 4 modes: pattern, matrix, sequence, analogy. |
| SVG generation | PASS | Colored shapes (circles, squares, triangles, diamonds, stars, crosses). |
| Scoring | PASS | 200–1000 pts per correct answer (speed-weighted). |
| Percentile calculation | **FAIL** | Uses `Math.round((score / 5000) * 100)` instead of `percentiles.json` → `pattern-reasoning` table. The JSON table has non-linear distribution; this linear formula is inaccurate. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |
| Mode rotation | PASS | "Next Format" button cycles through modes. |

**Verdict**: PARTIAL PASS — Percentile calculation uses linear formula instead of lookup table.

---

## 10. Visual Pattern (`VisualPatternTest.tsx`, 399 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Visual pattern completion. |
| Percentile lookup | PASS | Uses `percentiles.json` → `visual-pattern` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 11. Decision Speed (`DecisionSpeedTest.tsx`, 146 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Number ≥50 or <50 binary classification. 20 trials, 2s timeout. |
| Scoring | PASS | Accuracy × 60 + speedScore × 0.4. |
| Timeout handling | PASS | Unanswered = 2000ms RT. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `decision-speed` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## 12. Stroop Test (`StroopTest.tsx`, 301 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Color-word interference task. |
| Timing | PASS | RT per trial, average computed. |
| Congruent/incongruent | PASS | Mixed trials. |
| Percentile lookup | PASS | Uses `percentiles.json` → `stroop` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 13. Go/No-Go (`GoNoGoTest.tsx`, 388 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Go on green, inhibit on red. |
| Timing | PASS | RT for go trials. |
| Impulse control | PASS | Commission errors tracked. |
| Percentile lookup | PASS | Uses `percentiles.json` → `go-no-go` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 14. Trail Making (`TrailMakingTest.tsx`, 355 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Sequential connection (Part A: numbers, Part B: alternating). |
| Timing | PASS | Total completion time in ms. |
| Touch support | PASS | Click/tap to connect. |
| Percentile lookup | PASS | Uses `percentiles.json` → `trail-making` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 15. Focus Challenge (`FocusChallengeTest.tsx`, 426 lines + 5 stages)

| Aspect | Status | Details |
|--------|--------|---------|
| 5-stage flow | PASS | Selective Attention → Impulse Control → Task Switching → Sustained Attention → Working Memory Under Distraction. |
| Stage scoring | PASS | Each stage 0–100, overall computed. |
| Stability metric | PASS | Coefficient of variation-based. |
| Distraction resistance | PASS | Average of stages 1, 3, 4. |
| Processing speed | PASS | Average of stages 0, 2. |
| Weak stage detection | PASS | Threshold < 65, recommends specific tests. |
| 7-day plan | PASS | Personalized training plan. |
| Challenge mode | PASS | Reads `?challenge=` param. |
| Percentile lookup | PASS | Uses `percentiles.json` → `focus-challenge` table correctly. |
| Data persistence | PASS | Saves to IndexedDB with full stage metadata. |
| Share card | PASS | Generated. |

**Verdict**: PASS — Excellent implementation with detailed metrics.

### Focus Stages (5 sub-components)

| Stage | Component | Lines | Status |
|-------|-----------|-------|--------|
| 1. Selective Attention | Stage1SelectiveAttention | 164 | PASS |
| 2. Impulse Control | Stage2ImpulseControl | 197 | PASS |
| 3. Task Switching | Stage3TaskSwitching | 173 | PASS |
| 4. Sustained Attention | Stage4SustainedAttention | 211 | PASS |
| 5. Working Memory Under Distraction | Stage5WorkingMemoryUnderDistraction | 315 | PASS |

---

## 16. Click Speed (`ClickSpeedTest.tsx`, 332 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | CPS measurement. Time/word modes. |
| WPM calculation | PASS | (chars/5) / minutes. |
| Modes | PASS | 15/30/60/120s time, 10/25/50/100 word. |
| Percentile lookup | PASS | Uses `percentiles.json` → `click-speed` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 17. Aim Trainer (`AimTrainer.tsx`, 366 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Shrinking targets. Fitts's Law measurement. |
| Scoring | PASS | Distance-based accuracy score. |
| Target sizes | PASS | Progressive difficulty. |
| Percentile lookup | PASS | Uses `percentiles.json` → `aim-trainer` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PASS

---

## 18. Mouse Accuracy (`MouseAccuracyTest.tsx`, 145 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | 25 targets, 5 sizes (80→22px). Offset measurement. |
| Scoring | PASS | Average offset from center. |
| Target progression | PASS | Sizes decrease every 5 targets. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `mouse-accuracy` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## 19. Flick Trainer (`FlickTrainerTest.tsx`, 151 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | 15 instant-appearing targets. Flick + click. |
| Scoring | PASS | Hit percentage + average RT. |
| Target radius | PASS | 22px constant. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `flick-trainer` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## 20. Planning (`PlanningTest.tsx`, 153 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Tower of Hanoi. 4 disks, 3 pegs. |
| Optimal moves | PASS | 2^4 - 1 = 15. |
| Scoring | PASS | Based on move ratio + time. |
| Move validation | PASS | Can only place smaller on larger disk. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `planning` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## 21. Prioritization (`PrioritizationTest.tsx`, 205 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | 5 rounds of task scheduling. 10s per round. |
| Scoring | PASS | Points based on task value + deadline bonus. |
| Task generation | PASS | Random from 10-task pool. |
| Time management | PASS | Effort cost vs. point value trade-off. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `prioritization` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## 22. Typing Speed (`TypingSpeedTest.tsx`, 842 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| WPM calculation | PASS | `(correctChars / 5) / minutes`. |
| Raw WPM | PASS | No error penalty. |
| Accuracy | PASS | `correctChars / totalChars * 100`. |
| Consistency | PASS | Variance-based metric. |
| Burst speed | PASS | Per-word WPM tracking. |
| Time modes | PASS | 15/30/60/120s. |
| Word modes | PASS | 10/25/50/100 words. |
| Passage system | PASS | 12 categories, 100+ passages. |
| Cursor positioning | PASS | Monkeytype-style absolute positioning. |
| Line management | PASS | Auto-scroll, wrap lines. |
| Paste prevention | PASS | Blocks paste events. |
| IME handling | PASS | Composition event handling. |
| Error highlighting | PASS | Per-character error tracking. |
| Performance timeline | PASS | WPM + accuracy chart over time. |
| Error heatmap | PASS | Per-character error visualization. |
| Percentile lookup | PASS | Uses `percentiles.json` → `typing-speed` table. |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |
| Restart | PASS | Available mid-test. |

**Verdict**: PASS — Most comprehensive test implementation.

---

## 23. The Gauntlet (`GauntletTest.tsx`, 229 lines + 5 stages)

| Aspect | Status | Details |
|--------|--------|---------|
| 5-stage flow | PASS | Reaction → Sequence Memory → Stroop → Matrix → Aim. |
| Stage scoring | PASS | Each stage 0–100, overall = average. |
| Archetype system | PASS | Based on strongest stage performance. |
| Stage transitions | PASS | Score display + "Up Next" preview. |
| Personal best | PASS | Tracked via IndexedDB. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `gauntlet` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB with full stage metadata. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

### Gauntlet Stages (5 sub-components)

| Stage | Component | Lines | Status |
|-------|-----------|-------|--------|
| A. Reaction | StageReaction | 85 | PASS |
| B. Sequence Memory | StageSequenceMemory | 126 | PASS |
| C. Stroop | StageStroop | 92 | PASS |
| D. Matrix | StageMatrix | 91 | PASS |
| E. Aim | StageAim | 105 | PASS |

---

## 24. Spatial Orientation (`SpatialOrientationTest.tsx`, 273 lines)

| Aspect | Status | Details |
|--------|--------|---------|
| Mechanism | PASS | Spatial orientation assessment. |
| Percentile lookup | **FAIL** | Uses inline generic `lookupPercentile` instead of `percentiles.json` → `spatial-orientation` table. **(P1-5)** |
| Data persistence | PASS | Saves to IndexedDB. |
| Share card | PASS | Generated. |

**Verdict**: PARTIAL PASS — Percentile calculation incorrect.

---

## Percentile Issue Summary (P1-5)

**8 tests use hardcoded generic percentile tables instead of `percentiles.json`:**

| Test | Component | Has JSON Entry? | Uses JSON? |
|------|-----------|-----------------|------------|
| Verbal Memory | VerbalMemoryTest.tsx | Yes | NO |
| Decision Speed | DecisionSpeedTest.tsx | Yes | NO |
| Mouse Accuracy | MouseAccuracyTest.tsx | Yes | NO |
| Flick Trainer | FlickTrainerTest.tsx | Yes | NO |
| Planning | PlanningTest.tsx | Yes | NO |
| Prioritization | PrioritizationTest.tsx | Yes | NO |
| Pattern Reasoning | PatternReasoningTest.tsx | Yes | NO (uses linear formula) |
| Spatial Orientation | SpatialOrientationTest.tsx | Yes | NO |
| The Gauntlet | GauntletTest.tsx | Yes | NO |

**Generic table used by all:**
```
[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100] → [0.5, 2, 6, 14, 28, 46, 66, 84, 95, 99, 99.9]
```

**Impact**: Percentile scores are inaccurate and misleading for these 8+ tests. Users see wrong percentile rankings.

**Fix**: Import `percentiles.json` and use test-specific lookup tables (same pattern as `FocusChallengeTest.tsx` and `ReactionTimeTest.tsx`).

---

## Assessment Audit Summary

| Status | Count | Percentage |
|--------|-------|------------|
| PASS | 15 | 62.5% |
| PARTIAL PASS | 9 | 37.5% |
| FAIL | 0 | 0% |

**15 of 24 assessments** are fully correct.
**9 of 24 assessments** have incorrect percentile calculations (P1-5).

**Tests with correct percentile implementation:**
- ReactionTimeTest, F1LightsTest, SoundReactionTest, ChoiceReactionTest
- SequenceMemoryTest, NumberMemoryTest, DualNBackTest
- VisualPatternTest, StroopTest, GoNoGoTest, TrailMakingTest
- ClickSpeedTest, AimTrainerTest, TypingSpeedTest
- FocusChallengeTest (gold standard for multi-stage)

**Tests requiring percentile fix:**
- VerbalMemoryTest, DecisionSpeedTest, MouseAccuracyTest, FlickTrainerTest
- PlanningTest, PrioritizationTest, PatternReasoningTest, SpatialOrientationTest, GauntletTest
