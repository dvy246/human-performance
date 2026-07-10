# React SVG DOM Property Warnings — Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix 19 React "Invalid DOM property" console warnings across 10 TSX component files by converting SVG hyphenated attributes to their JSX camelCase equivalents.

**Architecture:** Each fix is a simple find-and-replace per file. All changes are identical in nature — `stroke-width` → `strokeWidth`, `stroke-linecap` → `strokeLinecap`, `stroke-linejoin` → `strokeLinejoin`. No logic changes. `.astro` files are NOT affected (HTML-native, correct).

**Tech Stack:** React 19, TypeScript ~6, JSX

---

## Task 1: ThemeToggle.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/ui/ThemeToggle.tsx:34,36`

**Fix:** In the sun and moon SVG icons, replace hyphens with camelCase:
- `stroke-width="2"` → `strokeWidth="2"` (2 places)
- `stroke-linecap="round"` → `strokeLinecap="round"` (2 places)
- `stroke-linejoin="round"` → `strokeLinejoin="round"` (2 places)

**Verification:** `npm run build` — 0 errors, no new SVG warnings in console

---

## Task 2: ClickSpeedTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/ClickSpeedTest.tsx:345,353`

**Fix:** Two SVG icons (download arrow + share/chain) — replace hyphens with camelCase on all three attributes at both locations.

---

## Task 3: AimTrainer.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/AimTrainer.tsx:376,384`

**Fix:** Same two SVG icons (download + share) — replace hyphens with camelCase.

---

## Task 4: AimCoordinationTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/AimCoordinationTest.tsx:365,373`

**Fix:** Same two SVG icons — replace hyphens with camelCase.

---

## Task 5: ChoiceReactionTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/ChoiceReactionTest.tsx:404,412`

**Fix:** Two SVG icons — replace hyphens with camelCase.

---

## Task 6: F1LightsTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/F1LightsTest.tsx:386,394`

**Fix:** Two SVG icons — replace hyphens with camelCase.

---

## Task 7: GoNoGoTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/GoNoGoTest.tsx:481,489`

**Fix:** Two SVG icons — replace hyphens with camelCase.

---

## Task 8: ReactionTimeTest.tsx (1 occurrence)

**Files:**
- Modify: `brain/src/components/tests/ReactionTimeTest.tsx:449`

**Fix:** One SVG icon (download arrow) — replace `stroke-width`, `stroke-linecap`, `stroke-linejoin` with camelCase.

**Note:** Line 302 has `stroke-width="2"` but no `stroke-linecap`/`stroke-linejoin` — fix that one too.

---

## Task 9: SequenceMemoryTest.tsx (1 occurrence)

**Files:**
- Modify: `brain/src/components/tests/SequenceMemoryTest.tsx:303`

**Fix:** One SVG icon — replace hyphens with camelCase.

---

## Task 10: SoundReactionTest.tsx (2 occurrences)

**Files:**
- Modify: `brain/src/components/tests/SoundReactionTest.tsx:394,402`

**Fix:** Two SVG icons — replace hyphens with camelCase.

---

## Final Verification

Run build and confirm:
- `npm run build` — 77 pages, 0 errors
- Browser console on any test page — zero "Invalid DOM property" warnings related to `stroke-width`, `stroke-linecap`, or `stroke-linejoin`

---

## Summary

| # | File | Occurrences |
|---|------|-------------|
| 1 | `ThemeToggle.tsx` | 2 |
| 2 | `ClickSpeedTest.tsx` | 2 |
| 3 | `AimTrainer.tsx` | 2 |
| 4 | `AimCoordinationTest.tsx` | 2 |
| 5 | `ChoiceReactionTest.tsx` | 2 |
| 6 | `F1LightsTest.tsx` | 2 |
| 7 | `GoNoGoTest.tsx` | 2 |
| 8 | `ReactionTimeTest.tsx` | 2 (lines 302 + 449) |
| 9 | `SequenceMemoryTest.tsx` | 1 |
| 10 | `SoundReactionTest.tsx` | 2 |
| | **Total** | **19**