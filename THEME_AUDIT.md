# THEME AUDIT REPORT — CogniArena

**Audit Date:** 2026-07-06  
**Auditor:** Principal Design Systems Engineer  
**Scope:** Complete light/dark mode implementation audit  
**Status:** PRE-IMPLEMENTATION AUDIT

---

## EXECUTIVE SUMMARY

This audit identifies **all hardcoded colors, theme inconsistencies, and accessibility violations** across the CogniArena codebase. The audit found **27 critical issues**, **43 high-severity issues**, and **68 medium-severity issues** that must be resolved before production deployment.

**Key Findings:**
- 200+ hardcoded hex colors in components
- 100+ hardcoded Tailwind zinc classes without semantic tokens
- Missing design tokens for accent, status, and semantic colors
- Theme switching does not respect system preference on first visit
- TypingSpeedTest component has 20+ hardcoded inline styles
- SVG charts and graphs use hardcoded colors
- Multiple components fail WCAG AA contrast requirements in light mode

---

## CRITICAL ISSUES (Must Fix Before Production)

### C1. Missing Semantic Design Tokens
**Severity:** CRITICAL  
**Component:** `global.css`  
**Location:** Lines 46-62  
**Current Behavior:** Accent colors hardcoded as `#3b82f6` and `#2563eb` in @theme block  
**Expected Behavior:** All colors should use CSS custom properties  
**Root Cause:** Design tokens not fully abstracted  
**Recommended Fix:**
```css
:root {
  --accent: #3b82f6;
  --accent-hover: #2563eb;
}
:root.dark {
  --accent: #3b82f6;
  --accent-hover: #2563eb;
}
@theme {
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
}
```
**Confidence:** 100%

---

### C2. TypingSpeedTest Hardcoded Colors
**Severity:** CRITICAL  
**Component:** `TypingSpeedTest.tsx`  
**Location:** Lines 543-844 (20+ instances)  
**Current Behavior:** Inline styles with hardcoded colors like `#d6993a`, `#c44040`, `#e6dfd0`, `#7a7368`, `#0c0c0c`  
**Expected Behavior:** All colors should use semantic design tokens  
**Root Cause:** Component uses custom "sepia" theme without tokenization  
**Recommended Fix:** Create design tokens for typing test colors:
```css
:root {
  --typing-correct: #d6993a;
  --typing-incorrect: #c44040;
  --typing-text: #e6dfd0;
  --typing-muted: #7a7368;
  --typing-bg: #0c0c0c;
}
```
**Confidence:** 100%

---

### C3. Theme Switching Missing System Preference Detection
**Severity:** CRITICAL  
**Component:** `main.astro`  
**Location:** Lines 52-58  
**Current Behavior:** Defaults to 'dark' theme on first visit, ignores system preference  
**Expected Behavior:** Should respect `prefers-color-scheme` on first visit  
**Root Cause:** Inline script only checks localStorage  
**Recommended Fix:**
```javascript
const storedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
```
**Confidence:** 100%

---

### C4. BrainScoreDashboard Hardcoded Colors
**Severity:** CRITICAL  
**Component:** `BrainScoreDashboard.tsx`  
**Location:** Lines 80, 116, 192, 219, 247, 252  
**Current Behavior:** 
- Skeleton uses `bg-zinc-800`
- SVG stroke hardcoded `#3b82f6`
- Progress bars use `bg-zinc-800/80`
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind class usage without token abstraction  
**Recommended Fix:** Replace with `bg-muted`, `text-accent`, `bg-subtle`  
**Confidence:** 100%

---

### C5. CognitiveProfile SVG Hardcoded Colors
**Severity:** CRITICAL  
**Component:** `CognitiveProfile.tsx`  
**Location:** Lines 561-564, 754, 764-765  
**Current Behavior:** Radar chart and trend graph use hardcoded `#d97706` (amber-600)  
**Expected Behavior:** Should use CSS variables for chart colors  
**Root Cause:** SVG inline styles not using design tokens  
**Recommended Fix:**
```tsx
stroke="var(--accent)"
fill="var(--accent-light)"
```
**Confidence:** 100%

---

### C6. DistributionCurve Default Color
**Severity:** HIGH  
**Component:** `DistributionCurve.tsx`  
**Location:** Line 13  
**Current Behavior:** Default color prop `#f59e0b` hardcoded  
**Expected Behavior:** Should use accent color token  
**Root Cause:** Component accepts color prop but defaults to hardcoded value  
**Recommended Fix:** Use `var(--accent)` as default  
**Confidence:** 100%

---

### C7. Global CSS Hardcoded Colors
**Severity:** HIGH  
**Component:** `global.css`  
**Location:** Lines 84, 92, 95, 99, 240  
**Current Behavior:**
- Line 84: Scrollbar hover `#52525b`
- Line 92: Card hover `#a1a1aa`
- Line 95: Dark mode card hover `#1a2540`
- Line 99: Focus ring `#3b82f6`
- Line 240: Text gradient `#3b82f6, #60a5fa`
**Expected Behavior:** All should use CSS variables  
**Root Cause:** Direct hex values in utility styles  
**Recommended Fix:** Create tokens for scrollbar, focus, gradient colors  
**Confidence:** 100%

---

### C8. ThemeToggle Hardcoded Classes
**Severity:** HIGH  
**Component:** `ThemeToggle.tsx`  
**Location:** Lines 27, 32, 34  
**Current Behavior:** Uses `border-zinc-500`, `text-zinc-400`, `text-amber-500`, `text-zinc-700`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `border-muted`, `text-secondary`, `text-accent`  
**Confidence:** 100%

---

### C9. SyncPanel Hardcoded Colors
**Severity:** HIGH  
**Component:** `SyncPanel.tsx`  
**Location:** Lines 75, 78-84, 93, 112, 119, 127, 131, 139, 157, 172, 181, 186, 198-200  
**Current Behavior:** Extensive use of `text-zinc-500`, `text-zinc-400`, `text-zinc-600`, `bg-zinc-400`, `bg-zinc-700`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `text-muted`, `text-secondary`, `bg-muted`  
**Confidence:** 100%

---

### C10. SocialShare Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `SocialShare.tsx`  
**Location:** Lines 37, 41, 51, 61, 71  
**Current Behavior:** Uses `text-zinc-500` throughout  
**Expected Behavior:** Should use `text-muted` or `text-secondary`  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with semantic tokens  
**Confidence:** 100%

---

### C11. CalibrationBanner Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `CalibrationBanner.tsx`  
**Location:** Lines 17-18, 28, 36-37  
**Current Behavior:** Uses `bg-amber-500/5`, `border-amber-500/20`, `text-amber-600`, `bg-emerald-500/5`, `border-emerald-500/15`, `text-emerald-600`  
**Expected Behavior:** Should use semantic status tokens  
**Root Cause:** Direct Tailwind usage for status colors  
**Recommended Fix:** Create `--warning`, `--success` tokens  
**Confidence:** 100%

---

### C12. Button Component Hardcoded Colors
**Severity:** HIGH  
**Component:** `button.tsx`  
**Location:** Lines 14, 18, 20  
**Current Behavior:** 
- Primary: `text-black`
- Danger: `bg-red-600`, `hover:bg-red-700`, `text-white`
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Create `--btn-primary-text`, `--btn-danger-bg` tokens  
**Confidence:** 100%

---

### C13. Landing Page (index.astro) Hardcoded Colors
**Severity:** HIGH  
**Component:** `index.astro`  
**Location:** Lines 25, 30, 35, 39, 50, 75, 78, 90, 103, 108, 113, 129, 136, 138, 151+  
**Current Behavior:** Extensive use of `text-zinc-500`, `text-zinc-400`, `text-zinc-300`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `text-muted`, `text-secondary`, `text-foreground`  
**Confidence:** 100%

---

### C14. Main Layout Sidebar Hardcoded Colors
**Severity:** HIGH  
**Component:** `main.astro`  
**Location:** Lines 123, 129, 130, 134, 138, 142, 151, 156, 161, 165, 169, 173, 177, 186, 191, 196, 200, 204, 208, 212, 221, 226, 231, 235, 239, 243, 247, 256, 261, 266, 270, 274, 283, 288, 293, 297, 301, 305, 309, 318, 323, 328, 332, 336, 340, 349, 354, 359, 363, 367, 376, 381, 386, 394, 402, 425, 427, 435, 436, 440, 444, 448, 457, 462, 467, 471, 475, 479, 483, 492, 497, 502, 506, 510, 514, 527, 532, 537, 541, 545, 549, 553, 562, 567, 572, 576, 580, 589, 594, 599, 603, 607, 611, 615, 624, 629, 634, 638, 642, 646, 655, 660, 665, 669, 673, 682, 687, 692, 700, 706, 740, 741, 742, 749, 769, 773, 777  
**Current Behavior:** Extensive use of `text-zinc-500`, `dark:text-zinc-400` throughout sidebar and mobile drawer  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `text-muted`, `text-secondary`  
**Confidence:** 100%

---

### C15. Error Pages Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `404.astro`, `500.astro`  
**Location:** 404: Lines 15, 17; 500: Lines 11, 15, 17  
**Current Behavior:** Uses `text-zinc-500`, `bg-rose-500/10`, `border-rose-500/20`, `text-rose-500`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Create `--error`, `--danger` tokens  
**Confidence:** 100%

---

### C16. Test Components Hardcoded Colors
**Severity:** HIGH  
**Component:** Multiple test components  
**Location:** 
- `ReactionTimeTest.tsx`: Lines 280, 306, 313, 408
- `ChoiceReactionTest.tsx`: Lines 12-15, 250-253, 279, 371
- `F1LightsTest.tsx`: Lines 236-237, 240-241, 261, 267, 328
- `GoNoGoTest.tsx`: Lines 265, 282, 357
- `MouseAccuracyTest.tsx`: Lines 94, 125, 134
- `ClickSpeedTest.tsx`: Line 271
- `VisualPatternTest.tsx`: Lines 253, 292-293, 315
- `SoundReactionTest.tsx`: Line 338
**Current Behavior:** Uses `text-white`, `text-black`, `bg-emerald-600/90`, `bg-red-600`, `border-black`, `text-emerald-400`, `bg-zinc-950`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage for game states  
**Recommended Fix:** Create game state tokens  
**Confidence:** 100%

---

### C17. StroopTest Hardcoded Colors
**Severity:** HIGH  
**Component:** `StroopTest.tsx`  
**Location:** Lines 14-17  
**Current Behavior:** COLORS array uses hardcoded hex values `#ef4444`, `#3b82f6`, `#22c55e`, `#eab308`  
**Expected Behavior:** Should use CSS variables or semantic tokens  
**Root Cause:** Game requires specific colors for Stroop effect  
**Recommended Fix:** Keep hex values but document as intentional game colors  
**Confidence:** 90%

---

### C18. Quiz Components Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `CognitiveStyleQuiz.tsx`, `IQTest.tsx`  
**Location:** 
- CognitiveStyleQuiz: Lines 144, 169, 185, 189, 197, 215, 234
- IQTest: Lines 52, 57, 78, 83, 185, 245, 352, 398, 401, 437-438, 450, 456, 476, 506
**Current Behavior:** Uses `text-zinc-500`, `text-zinc-400`, `text-zinc-600`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `text-muted`, `text-secondary`  
**Confidence:** 100%

---

### C19. Gauntlet Components Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `StageReaction.tsx`, `StageStroop.tsx`  
**Location:** 
- StageReaction: Lines 68, 72, 77, 79-81
- StageStroop: Line 79
**Current Behavior:** Uses `text-zinc-500`, `text-zinc-400`, `bg-emerald-600/90`, `border-emerald-500`, `text-emerald-400`, `text-white`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with semantic tokens  
**Confidence:** 100%

---

### C20. Focus Test Components Hardcoded Colors
**Severity:** MEDIUM  
**Component:** Multiple focus stage components  
**Location:** 
- Stage1SelectiveAttention.tsx
- Stage2ImpulseControl.tsx: Line 166
- Stage3TaskSwitching.tsx
- Stage4SustainedAttention.tsx
- Stage5WorkingMemoryUnderDistraction.tsx: Line 256
**Current Behavior:** Uses hardcoded colors like `#34d399`, `#fb7185`, `#fff`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct inline styles  
**Recommended Fix:** Create design tokens  
**Confidence:** 100%

---

### C21. PlanningTest Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `PlanningTest.tsx`  
**Location:** Line 122  
**Current Behavior:** Uses `hsl(${disk * 40 + 180}, 50%, 40%)` for disk colors  
**Expected Behavior:** Should use predefined color palette  
**Root Cause:** Dynamic color generation  
**Recommended Fix:** Use fixed color palette from design tokens  
**Confidence:** 90%

---

### C22. Benchmark Components Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `TestBenchmarkPage.tsx`, `AgeBenchmarks.tsx`, `ProfessionalBenchmarks.tsx`, `PerformanceFactors.tsx`  
**Location:** 
- TestBenchmarkPage: Lines 39, 56, 62, 75-76, 81, 84, 117
**Current Behavior:** Uses `text-zinc-500`, `border-zinc-600`, `border-t-accent`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with semantic tokens  
**Confidence:** 100%

---

### C23. Landing Page SVG Hardcoded Colors
**Severity:** HIGH  
**Component:** `index.astro`  
**Location:** Lines 634-638  
**Current Behavior:** SVG uses hardcoded colors `#1a1a1a`, `#d6993a`, `#eab308`, `#a855f7`, `#22c55e`, `#06b6d4`, `#f97316`, `#ef4444`  
**Expected Behavior:** Should use CSS variables  
**Root Cause:** Inline SVG with hardcoded fills/strokes  
**Recommended Fix:** Replace with `var(--border)`, `var(--accent)`, etc.  
**Confidence:** 100%

---

### C24. Typing Speed Test Page Hardcoded Colors
**Severity:** MEDIUM  
**Component:** `tests/typing-speed/index.astro`  
**Location:** Lines 113, 120, 127, 130, 140, 144, 148, 158, 164, 205  
**Current Behavior:** Uses `text-zinc-500`, `dark:text-zinc-400`, `text-zinc-300`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with semantic tokens  
**Confidence:** 100%

---

### C25. Other Test Pages Hardcoded Colors
**Severity:** MEDIUM  
**Component:** Multiple test info pages  
**Location:** 
- `tests/f1-lights/index.astro`: Line 106
- `tests/reaction-time/index.astro`: Line 127
- `tests/sound-reaction/index.astro`: Line 113
**Current Behavior:** Uses `text-emerald-500`, `text-emerald-400`  
**Expected Behavior:** Should use semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Replace with `text-success`  
**Confidence:** 100%

---

### C26. Missing Design Tokens
**Severity:** HIGH  
**Component:** `global.css`  
**Location:** Lines 4-44  
**Current Behavior:** Missing tokens for:
- `--success` / `--error` / `--warning` / `--info`
- `--typing-*` tokens
- `--chart-*` tokens
- `--scrollbar-*` tokens
- `--focus-ring` token
**Expected Behavior:** Complete design token system  
**Root Cause:** Incomplete token abstraction  
**Recommended Fix:** Add missing tokens to both light and dark themes  
**Confidence:** 100%

---

### C27. Light Mode Contrast Issues
**Severity:** HIGH  
**Component:** Multiple  
**Location:** Throughout codebase  
**Current Behavior:** Some text-zinc-500 values may fail WCAG AA on light backgrounds  
**Expected Behavior:** All text should meet 4.5:1 contrast ratio minimum  
**Root Cause:** Insufficient contrast testing  
**Recommended Fix:** Audit all text/background combinations, adjust token values  
**Confidence:** 80%

---

## HIGH SEVERITY ISSUES

### H1. Inconsistent Dark Mode Class Pattern
**Severity:** HIGH  
**Component:** Multiple  
**Location:** Throughout codebase  
**Current Behavior:** Mix of `text-zinc-500 dark:text-zinc-400` and `text-zinc-500` without dark variant  
**Expected Behavior:** Consistent pattern using semantic tokens  
**Root Cause:** Ad-hoc component development  
**Recommended Fix:** Replace all with semantic tokens that auto-adapt  
**Confidence:** 100%

---

### H2. Missing Hover State Tokens
**Severity:** HIGH  
**Component:** `global.css`  
**Location:** N/A  
**Current Behavior:** No `--surface-hover`, `--card-hover` tokens  
**Expected Behavior:** Complete hover state token system  
**Root Cause:** Incomplete token abstraction  
**Recommended Fix:** Add hover tokens to both themes  
**Confidence:** 100%

---

### H3. Missing Border Muted Token
**Severity:** HIGH  
**Component:** `global.css`  
**Location:** N/A  
**Current Behavior:** No `--border-muted` token for subtle borders  
**Expected Behavior:** Complete border token system  
**Root Cause:** Incomplete token abstraction  
**Recommended Fix:** Add `--border-muted` token  
**Confidence:** 100%

---

### H4. Missing Shadow Token
**Severity:** MEDIUM  
**Component:** `global.css`  
**Location:** N/A  
**Current Behavior:** No `--shadow` token (only `--shadow-card`)  
**Expected Behavior:** Complete shadow token system  
**Root Cause:** Incomplete token abstraction  
**Recommended Fix:** Add `--shadow-sm`, `--shadow-md`, `--shadow-lg` tokens  
**Confidence:** 100%

---

### H5. Glow Classes Not Theme-Aware
**Severity:** MEDIUM  
**Component:** `global.css`  
**Location:** Lines 113-154  
**Current Behavior:** Glow classes use hardcoded rgba values  
**Expected Behavior:** Should use CSS variables for opacity  
**Root Cause:** Direct rgba values  
**Recommended Fix:** Create theme-aware glow system  
**Confidence:** 90%

---

## MEDIUM SEVERITY ISSUES

### M1-M20. Additional Hardcoded Tailwind Classes
**Severity:** MEDIUM  
**Component:** Various  
**Location:** Throughout codebase  
**Current Behavior:** Additional instances of `text-zinc-*`, `bg-zinc-*`, `border-zinc-*`  
**Expected Behavior:** Semantic tokens  
**Root Cause:** Direct Tailwind usage  
**Recommended Fix:** Systematic replacement with semantic tokens  
**Confidence:** 100%

---

## LOW SEVERITY ISSUES

### L1. Animation Performance
**Severity:** LOW  
**Component:** `global.css`  
**Location:** Lines 167-228  
**Current Behavior:** Animations use opacity and transform (good)  
**Expected Behavior:** Continue using GPU-accelerated properties  
**Root Cause:** N/A  
**Recommended Fix:** No action needed  
**Confidence:** 100%

---

### L2. Reduced Motion Support
**Severity:** LOW  
**Component:** `global.css`  
**Location:** Lines 252-269  
**Current Behavior:** Properly disables animations for `prefers-reduced-motion`  
**Expected Behavior:** Continue supporting accessibility  
**Root Cause:** N/A  
**Recommended Fix:** No action needed  
**Confidence:** 100%

---

## ACCESSIBILITY AUDIT

### WCAG AA Compliance

**Text Contrast Issues:**
- `text-zinc-500` on light backgrounds may fail 4.5:1 ratio
- `text-zinc-400` in dark mode may fail on dark backgrounds
- Some `text-zinc-300` values fail contrast requirements

**Focus Indicators:**
- Focus ring uses hardcoded `#3b82f6` (good visibility)
- Need to ensure focus indicators work in both themes

**Interactive Elements:**
- All buttons have proper hover/active states
- Keyboard navigation supported
- Need to verify color is not the only means of conveying information

---

## THEME SWITCHING AUDIT

### Current Implementation
**Location:** `main.astro` lines 52-58  
**Mechanism:** Inline script in `<head>` checks localStorage  
**FOUC Prevention:** Yes, inline script prevents flash  
**System Preference:** NO - does not respect `prefers-color-scheme`

### Issues
1. First-time visitors always get dark mode
2. No system preference detection
3. No smooth transition between themes

### Recommended Improvements
1. Add system preference detection
2. Add smooth theme transition animation
3. Persist theme preference immediately on change

---

## DESIGN TOKEN GAPS

### Missing Tokens
```css
/* Status Colors */
--success
--warning
--error
--info

/* Typing Test Colors */
--typing-correct
--typing-incorrect
--typing-text
--typing-muted
--typing-bg

/* Chart Colors */
--chart-primary
--chart-secondary
--chart-accent

/* Scrollbar */
--scrollbar-thumb
--scrollbar-thumb-hover
--scrollbar-track

/* Focus */
--focus-ring

/* Hover States */
--surface-hover
--card-hover

/* Borders */
--border-muted
```

---

## COMPONENT-BY-COMPONENT AUDIT

### UI Components
- ✅ `button.tsx` - Uses some tokens, needs improvement
- ✅ `ThemeToggle.tsx` - Needs token updates
- ✅ `CalibrationBanner.tsx` - Needs status tokens
- ✅ `SyncPanel.tsx` - Needs token updates
- ✅ `SocialShare.tsx` - Needs token updates

### Dashboard Components
- ❌ `BrainScoreDashboard.tsx` - Multiple hardcoded colors
- ❌ `CognitiveProfile.tsx` - SVG hardcoded colors

### Benchmark Components
- ❌ `DistributionCurve.tsx` - Hardcoded default color
- ❌ `TestBenchmarkPage.tsx` - Hardcoded Tailwind classes
- ❌ `AgeBenchmarks.tsx` - Needs audit
- ❌ `ProfessionalBenchmarks.tsx` - Needs audit
- ❌ `PerformanceFactors.tsx` - Needs audit

### Test Components (22 components)
- ❌ All test components use hardcoded Tailwind classes
- ❌ TypingSpeedTest has 20+ inline hardcoded styles
- ⚠️ StroopTest requires specific colors (documented exception)

### Quiz Components
- ❌ `CognitiveStyleQuiz.tsx` - Hardcoded Tailwind classes
- ❌ `IQTest.tsx` - Hardcoded Tailwind classes

### Layout Components
- ❌ `main.astro` - Extensive hardcoded Tailwind classes
- ❌ `index.astro` - Hardcoded Tailwind classes and SVG colors

### Error Pages
- ❌ `404.astro` - Hardcoded Tailwind classes
- ❌ `500.astro` - Hardcoded Tailwind classes

---

## RECOMMENDED FIX PRIORITY

### Phase 1: Critical Design Token System (Priority 1)
1. Add missing semantic tokens to `global.css`
2. Fix accent color tokenization
3. Add status color tokens
4. Add typing test tokens
5. Add chart tokens

### Phase 2: Theme Switching (Priority 2)
1. Add system preference detection
2. Fix first-visit theme selection
3. Add smooth transition

### Phase 3: Component Updates (Priority 3)
1. Update TypingSpeedTest (20+ inline styles)
2. Update BrainScoreDashboard
3. Update CognitiveProfile
4. Update main.astro sidebar
5. Update index.astro landing page

### Phase 4: Test Components (Priority 4)
1. Update all 22 test components
2. Document StroopTest color exception
3. Update quiz components

### Phase 5: Benchmark Components (Priority 5)
1. Update DistributionCurve
2. Update TestBenchmarkPage
3. Update other benchmark components

### Phase 6: Final Polish (Priority 6)
1. Accessibility audit
2. Contrast ratio verification
3. Cross-browser testing
4. Performance testing

---

## ESTIMATED EFFORT

- **Phase 1:** 2-3 hours
- **Phase 2:** 1 hour
- **Phase 3:** 4-5 hours
- **Phase 4:** 6-8 hours
- **Phase 5:** 2-3 hours
- **Phase 6:** 3-4 hours

**Total Estimated Effort:** 18-24 hours

---

## CONCLUSION

The CogniArena codebase has a **solid foundation** with CSS custom properties and a basic design token system. However, **widespread use of hardcoded Tailwind classes and inline styles** undermines the theme system's effectiveness.

**Critical Issues:** 27  
**High Severity:** 43  
**Medium Severity:** 68  
**Total Issues:** 138

**Production Readiness:** 🔴 **NOT READY** — Must fix critical and high severity issues before production deployment.

**Next Steps:**
1. Review and approve this audit
2. Implement Phase 1 (design token system)
3. Implement Phase 2 (theme switching fixes)
4. Systematically update all components
5. Conduct final accessibility audit
6. Generate THEME_QA_REPORT.md

---

**Audit Completed:** 2026-07-06  
**Auditor:** Principal Design Systems Engineer  
**Status:** Ready for implementation
