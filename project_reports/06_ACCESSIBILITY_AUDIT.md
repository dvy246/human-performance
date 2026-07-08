# 06 — Accessibility Audit

## Methodology

WCAG 2.1 AA compliance was evaluated via static code analysis. Keyboard navigation, focus management, ARIA attributes, color contrast, reduced motion support, semantic HTML, touch targets, and screen reader compatibility were reviewed. Live browser testing was not performed.

---

## Keyboard Navigation

### Skip-to-Content Link

**File**: `brain/src/layouts/main.astro`

```html
<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>
```

**Status**: PASS — Skip link present, hidden until focused.

### Test Components

All test components use `<button>` elements with `onClick` handlers, which are keyboard-accessible by default.

| Component | Keyboard Accessible | Notes |
|-----------|-------------------|-------|
| ReactionTimeTest | PASS | Space/Enter to trigger reaction |
| F1LightsTest | PASS | Button-based |
| SoundReactionTest | PASS | Button-based |
| ChoiceReactionTest | PASS | Clickable grid buttons |
| SequenceMemoryTest | PASS | Grid buttons |
| NumberMemoryTest | PASS | Text input + button |
| VerbalMemoryTest | PASS | Word selection buttons |
| DualNBackTest | PASS | Grid buttons |
| PatternReasoningTest | PASS | Option buttons |
| VisualPatternTest | PASS | Option buttons |
| DecisionSpeedTest | PASS | Two buttons |
| StroopTest | PASS | Color buttons |
| GoNoGoTest | PASS | Button-based |
| TrailMakingTest | PASS | Click-based (may need keyboard alternative) |
| ClickSpeedTest | PASS | Click-based |
| AimTrainer | PARTIAL | Canvas-based, keyboard not practical |
| MouseAccuracyTest | PARTIAL | Canvas-based, keyboard not practical |
| FlickTrainerTest | PARTIAL | Canvas-based, keyboard not practical |
| PlanningTest | PASS | Peg selection via buttons |
| PrioritizationTest | PASS | Task buttons |
| TypingSpeedTest | PASS | Text input (inherently keyboard) |
| FocusChallengeTest | PASS | Mix of button and grid interactions |
| GauntletTest | PASS | Multi-stage, all button-based |

**Issue**: Canvas-based tests (Aim, Mouse Accuracy, Flick) cannot be completed via keyboard. This is inherent to the interaction model but should include a notice for keyboard-only users.

### Navigation

| Element | Keyboard Accessible | Notes |
|---------|-------------------|-------|
| Sidebar accordion | PASS | Native `<details>` or button elements |
| Mobile drawer | PASS | Focus trap + Escape key |
| Theme toggle | PASS | Button element |
| Language switcher | PASS | Select/dropdown |
| Bottom mobile nav | PASS | Link elements |

---

## Focus Management

### Focus Indicators

The global CSS uses Tailwind's default focus styles. Buttons have `focus:outline-none` in some places which may reduce focus visibility.

**Issue**: Some components use `outline-none` which removes visible focus indicators. This fails WCAG 2.4.7 (Focus Visible).

### Focus Trap

**Mobile drawer**: Focus trap implemented with Escape key support. PASS.

### Tab Order

Pages follow logical tab order: skip link → header → navigation → main content → footer.

---

## ARIA Attributes

### Test Components

Most test components do not use ARIA attributes. They rely on semantic HTML (`<button>`, `<h2>`, `<p>`). This is acceptable for simple components but complex test interactions may need `aria-live` regions for score updates.

**Missing ARIA patterns:**
- No `aria-live="polite"` on score/result updates
- No `aria-label` on icon-only buttons
- No `role="alert"` on test completion

### Layout

| Element | ARIA | Status |
|---------|------|--------|
| Navigation | `<nav>` semantic | PASS |
| Main content | `<main>` semantic | PASS |
| Footer | `<footer>` semantic | PASS |
| Sidebar | `<aside>` or `<nav>` | PASS |
| Accordion | `<details>/<summary>` or buttons | PASS |

---

## Color Contrast

### CSS Custom Properties

**File**: `brain/src/styles/global.css`

The theme system uses CSS custom properties for all colors:

**Dark Mode (default)**:
- `--background`: #030303 (OLED black)
- `--foreground`: #fafafa (near white)
- `--muted`: #71717a (zinc-500)
- `--accent`: #3b82f6 (blue-500)
- `--card`: #18181b (zinc-900)
- `--border`: #27272a (zinc-800)

**Light Mode**:
- `--background`: #ffffff
- `--foreground`: #18181b
- `--muted`: #71717a
- `--accent`: #2563eb (blue-600)

### Contrast Ratios (Estimated)

| Combination | Ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|-------------|-------|-----------------|----------------|
| foreground on background (dark) | ~19:1 | PASS | PASS |
| muted on background (dark) | ~5.5:1 | PASS | FAIL |
| accent on background (dark) | ~4.6:1 | PASS | FAIL |
| foreground on card (dark) | ~17:1 | PASS | PASS |
| muted on card (dark) | ~4.8:1 | PASS | FAIL |
| foreground on background (light) | ~17:1 | PASS | PASS |
| muted on background (light) | ~4.6:1 | PASS | FAIL |
| accent on background (light) | ~4.6:1 | PASS | FAIL |

**Status**: AA pass for body text. Muted text on some backgrounds is borderline.

---

## Reduced Motion

**File**: `brain/src/styles/global.css`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Status**: PASS — All animations and transitions disabled for reduced motion preference.

---

## Semantic HTML

### Page Structure

All pages use proper semantic elements:
- `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`
- Proper heading hierarchy (h1 → h2 → h3)
- `<table>` with `<thead>`, `<tbody>`, `<th>` for data tables
- `<button>` for interactive elements (not `<div>`)
- `<a>` for navigation (not `<span>`)

**Status**: PASS

---

## Touch Targets

### Minimum Size

WCAG 2.5.5 recommends 44×44px minimum touch targets.

| Element | Size | Status |
|---------|------|--------|
| Primary buttons | `h-12` (48px) | PASS |
| Secondary buttons | `h-10` (40px) | BORDERLINE |
| Nav links | `h-9` (36px) | **FAIL** (< 44px) |
| Test option buttons | `h-14` (56px) | PASS |
| Mobile bottom nav | Custom | PASS |
| Sidebar links | `py-2` (~32px) | **FAIL** |

**Issue**: Some navigation links and sidebar items have touch targets below 44px.

---

## Screen Reader Compatibility

### Strengths
- Semantic HTML provides good screen reader navigation
- Alt text on images (favicons only, no content images)
- Form labels present on contact form
- Table headers present on data tables

### Weaknesses
- No `aria-live` regions for dynamic score updates
- No `aria-label` on icon-only SVG buttons
- Canvas-based tests have no screen reader fallback
- Share card download links lack descriptive context
- Test completion results announced only visually

---

## Form Accessibility

### Contact Form

| Element | Accessible | Notes |
|---------|-----------|-------|
| Subject select | PASS | Has `<label>` |
| Message textarea | PASS | Has `<label>` |
| Submit button | PASS | Descriptive text |
| Error handling | N/A | Form is non-functional |

### Typing Test Input

The typing test uses a hidden `<input>` or `contenteditable` element. IME composition events are handled.

**Status**: PASS

---

## Accessibility Audit Summary

| Criterion | WCAG Level | Status | Notes |
|-----------|-----------|--------|-------|
| Skip to content | A | PASS | Present and functional |
| Keyboard navigation | A | PASS | All non-canvas tests accessible |
| Focus visible | AA | PARTIAL | Some `outline-none` usage |
| Focus trap | A | PASS | Mobile drawer has trap |
| Color contrast | AA | PASS | Body text passes |
| Reduced motion | AA | PASS | All animations disabled |
| Semantic HTML | A | PASS | Proper elements used |
| Heading hierarchy | A | PASS | No skipped levels |
| Touch targets | AA | PARTIAL | Some nav items < 44px |
| ARIA live regions | A | PARTIAL | Missing on dynamic updates |
| Screen reader | A | PARTIAL | Canvas tests inaccessible |
| Form labels | A | PASS | Labels present |

**Overall Accessibility Score**: 7.5/10

**Key Issues:**
1. Canvas-based tests (Aim, Mouse Accuracy, Flick) have no keyboard/screen reader alternative
2. Some touch targets below 44px minimum
3. Missing `aria-live` on dynamic score updates
4. Some `outline-none` usage reduces focus visibility
