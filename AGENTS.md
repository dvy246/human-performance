# human-performance

**App:** `brain/` — **CogniArena**: free, high-quality cognitive assessment platform. Static site built to rank on Google via SEO. Root dir (`/`) is a shell with only `tensorlake-opencode` dep.

## Goal

Provide premium-quality, bug-free cognitive tests and quizzes at no cost to enhance users' cognitive abilities. SEO-first statically-generated site targeting US-based audience. 6-language i18n must work error-free across all pages. YMYL (Your Money or Your Life) compliance is critical — all assessments carry prominent disclaimers that they are not medical/diagnostic tools.

**Competitors:** `reactiontimetesting.com`, `humanbenchmarks.com`. We differentiate via breadth (24 tests, gauntlet, quizzes, learning center), retention mechanics (dashboard, records, skill radar, personas, challenges), and SEO depth (schema.org on every page, sitemap, learning guides).

## Commands (run from `brain/`)

| Command | Script |
|---|---|
| dev | `astro dev` |
| build | `astro build` |
| lint | `eslint .` |
| format | `prettier --write \"**/*.{ts,tsx,astro}\"` |
| typecheck | `astro check` |
| test (single run) | `vitest run` |
| test (watch) | `vitest` |
| deploy | `npm run build && npx wrangler pages deploy dist --commit-dirty=true` |

Node >=22.12.0 required. Vite pinned to ^7.3.6 via overrides.

## Testing

- Vitest in `brain/`, matching `src/**/*.test.ts`
- Tests that need browser APIs use `// @vitest-environment jsdom` per-file (vitest config defaults to `node`)
- 4 test files: `calibration.test.ts` (1 pre-existing failure — 141 vs 144Hz snap), `dataLayer.test.ts`, `skillRadar.test.ts`, `trainingEngine.test.ts`
- No integration/e2e tests or external service prerequisites

## Tech Stack (verified from package.json & source)

| Layer | Technology |
|---|---|
| Framework | Astro v6 |
| UI islands | React v19.2.6 (`client:load`/`client:visible`) |
| Styling | Tailwind v4 via `@import "tailwindcss"` (no tailwind.config.js) |
| Language | TypeScript ~6 |
| Build tool | Vite ^7.3.6 (pinned via overrides) |
| Linter | ESLint v10 (flat config, react-hooks + react-refresh plugins) |
| Formatter | Prettier v3.8.3 (prettier-plugin-astro, prettier-plugin-tailwindcss) |
| Test runner | Vitest v4.1.10 |
| Deployment | Cloudflare Pages (brain-bfn.pages.dev → cogniarena.com) |
| Database | IndexedDB (local), Cloudflare D1 (optional sync) |
| Analytics | Google Analytics G-9WHJWEWD5L |
| AdSense | Scaffolded but NOT active (commented out, placeholder pub ID) |

## Project Structure

### Pages (`src/pages/`) — 77 pages, 0 build errors

| Area | Count | Path pattern |
|---|---|---|
| Home | 1 | `/index.astro` |
| Cognitive tests | 23 | `/tests/{slug}/index.astro` |
| The Gauntlet | 1 | `/gauntlet/index.astro` |
| Learn guides | 23 | `/learn/{slug}/index.astro` |
| Learn index | 1 | `/learn/index.astro` |
| Dashboard | 1 | `/dashboard/index.astro` |
| Benchmarks | 7 | `/benchmarks/index.astro`, `/benchmarks/[slug].astro` |
| Quiz | 3 | `/quiz/index.astro`, `/quiz/iq-test`, `/quiz/cognitive-style` |
| Info/legal | 8 | about, contact, faq, methodology, privacy, terms, brain-games, challenge |
| Utilities | 4 | 404, 500, history, records, tests/results, adhd-test, color-game |

### Components (`src/components/`)

- **`ui/`** — 18 shared components: `HowItWorks.astro`, `ExploreTests.astro`, `ErrorBoundary.tsx`, `LanguageSwitcher.tsx`, `ThemeToggle.tsx`, `SyncPanel.tsx`, `OnboardingFlow.tsx`, `KeyboardShortcuts.tsx`, `TestResultsPage.tsx`, `LoadingSkeletons.tsx`, `EnhancedShare.tsx`, `SocialShare.tsx`, `RecentTests.tsx`, `CalibrationBanner.tsx`, `GameConfigPanel.tsx`, `QRChallengeCard.tsx`, `button.tsx`, `withErrorBoundary.tsx`
- **`tests/`** — 25 core test React components (one per test, including FocusChallengeTest, GauntletTest)
- **`tests/gauntlet/`** — 5 gauntlet stages: `StageReaction`, `StageSequenceMemory`, `StageStroop`, `StageMatrix`, `StageAim` + `GauntletTypes.ts`
- **`tests/focus/`** — 5 focus challenge stages: `Stage1SelectiveAttention`, `Stage2ImpulseControl`, `Stage3TaskSwitching`, `Stage4SustainedAttention`, `Stage5WorkingMemoryUnderDistraction` + `StageTypes.ts`
- **`benchmarks/`** — `TestBenchmarkPage`, `DistributionCurve`, `AgeBenchmarks`, `ProfessionalBenchmarks`, `PerformanceFactors`
- **`dashboard/`** — `CognitiveProfile`, `BrainScoreDashboard`, `TestSummaryGrid`, `PersonalRecords`, `MultiTrendChart`, `CrossTestBarChart`, `HistoryDashboard`, `CompletionTracker`
- **`quiz/`** — `IQTest`, `CognitiveStyleQuiz`

### Data (`src/data/`)

- **`tests.ts`** — Test metadata manifest: `TestEntry` interface, 6 categories (Reaction & Reflexes, Memory, Reasoning, Focus & Attention, Motor Performance, Executive Function), `allTests[]` (24 entries), `getTestsByCategory()`, `getTestBySlug()`
- **`percentiles.json`** — Score-to-percentile lookup tables per test (~173 lines)
- **`benchmarks.ts`** — Benchmark config for 7 categories: distribution curves via error function, age data, profession data, influencing factors
- **`passages.ts`** — Typing test passage library: 3 categories (general, technology, coding), ~30 passages

### Runtime (`src/runtime/`)

- **`dataLayer.ts`** — IndexedDB `CogniArenaDB`: `saveSession()`, `getHistory()`, `getPersonalBest()`, `syncToCloud()`, `getUnsyncedCount()`. Store: `sessions`
- **`percentileLookup.ts`** — `lookupPercentile(testId, score, lowerIsBetter)`, `formatTopPercentile()`
- **`skillRadar.ts`** — `computeCategoryAverages(records)` → 6 cognitive axes (reaction, memory, processing, precision, focus, stamina). `calculateBbiScore()` → CAI (CogniArena Index) 0–1000. `getRadarCoordinates()` → SVG polygon points
- **`trainingEngine.ts`** — 6 `PERSONAS` (Rapid Reactor, Pattern Hunter, Choice Strategist, Precision Targeter, Focus Guardian, Stamina Specialist). `generateDailyChallenge()`, `getRecommendations()`
- **`calibration.ts`** — `measureRefreshRate()` via rAF over 30 frames, snaps to standards (60/75/90/120/144/165/240/280/360), calculates expected lag
- **`testConfig.ts`** — `TEST_CONFIGS` registry, `loadTestConfig()`, `saveTestConfig()`, `getDifficultyParams()`
- **`recovery.ts`** — `generateRecoveryCode()` (8-word BIP-39-style mnemonic from 192-word list), `hashRecoveryCode()` via SHA-256 SubtleCrypto
- **`share.ts`** — `encodeChallenge()`/`decodeChallenge()` (URL-safe base64), `generateShareCard()` (1200x630 canvas OG card)
- **Hooks** — `useVisibilityGuard.ts`, `useBeforeUnload.ts`, `useSound.ts` (Web Audio oscillator), `useI18n.ts`
- **`redirectToResults.ts`** — sessionStorage payload + redirect to `/tests/results/`

### Layouts

- **`main.astro`** (906 lines) — Single site-wide layout. Includes: dark/light theme inline script, favicons/manifest, canonical URL, OG tags, Twitter cards, JSON-LD (Organization + WebSite on every page, plus per-page schemas via `schemaJson` prop), i18n inline data script, Google Analytics (G-9WHJWEWD5L), Google AdSense (commented out), skip-to-content link, desktop sidebar with accordion nav (6 categories + quizzes + learning center), mobile hamburger drawer + bottom nav, CalibrationBanner, `<slot/>`, footer with disclaimer (clearly states "not medical/diagnostic"), LanguageSwitcher, ThemeToggle, SyncPanel, RecentTests, KeyboardShortcuts, OnboardingFlow

### Styles (`src/styles/global.css`)

- Tailwind v4 via `@import "tailwindcss"`
- CSS custom properties for light + dark themes (background/text/border/accent/status/shadow/button tokens)
- `@theme` block mapping CSS vars to Tailwind classes
- Utility classes: `glow-*` (8 colors), `hero-glow`, `hero-gradient-text`, stagger-1–8 delays
- Animations: `fadeInUp`, `fadeIn`, `slideInLeft`, `slideInRight`, `pulse-glow`, `shimmer`
- `prefers-reduced-motion` disables all animations
- Print styles

### i18n (`src/i18n/`)

- **`translations.ts`** (~4000+ lines) — Full dictionary for 6 languages: `en`, `es`, `fr`, `de`, `pt`, `ja`
- Keys organized by section: nav, footer, mobile, hero, how-it-works, FAQ, profile, learning, buttons, test UI, results, per-test strings
- Client engine: `public/i18n.js` (120 lines) — reads `window.__i18nData` (populated by layout inline script), applies to `[data-i18n]` (text), `[data-i18n-html]` (with XSS sanitization), `[data-i18n-placeholder]`, `[data-i18n-title]`. Fires `cogniarena:langchange`. Language in `localStorage.getItem('language')`

### Sync Worker (`brain/sync-worker/`)

- Separate CF Worker (`cogniarena-sync`), deploys independently from Astro app
- `wrangler.toml`: `DB` binding → `cogniarena_db` (D1). TODO: replace `database_id` before deploy
- `index.ts` (251 lines): `POST /api/sync/push` (batch upload, max 100 attempts), `POST /api/sync/pull` (fetch all attempts by recovery hash). Rate-limited (10 req/min/IP via D1 table). 1MB body limit. D1 batch inserts with `ON CONFLICT` ignore. CORS locked to `cogniarena.com`, `www.cogniarena.com`, `brain-bfn.pages.dev`
- `schema.sql`: `rate_limits` table (ip, count, reset_time) with index

### Public Assets

- Favicons: SVG, ICO, 96x96 PNG, apple-touch-icon, web-app-manifest (192+512)
- `site.webmanifest`: PWA, display standalone, theme #000000
- `og-image.svg`: Default OG share image
- `robots.txt`: Allow all, sitemap `https://cogniarena.com/sitemap.xml`
- `sitemap.xml` (447 lines, 60+ URLs, priorities 1.0→0.5, lastmod July 2026)
- `_headers`: `brain-bfn.pages.dev/*` → `X-Robots-Tag: noindex` (blocks staging)
- `_redirects`: SPA fallback; SEO redirects (`/reaction-time-test` → `/tests/reaction-time` 301, etc.)

### Config Files

- **`astro.config.mjs`**: `site: 'https://cogniarena.com'`, integrations: `[react()]`, vite plugins: `[tailwindcss()]`
- **`tsconfig.json`**: extends `astro/tsconfigs/strict`, alias `@/*` → `./src/*`, JSX react-jsx
- **`vitest.config.ts`**: env node (per-file jsdom override), include `src/**/*.test.ts`
- **`eslint.config.js`**: flat config, extends `js.recommended` + `tseslint.recommended` + `react-hooks` + `react-refresh/vite`, files `**/*.{ts,tsx}`, ignores `dist`, `.astro`
- **`.prettierrc`**: semi false, singleQuote false, plugins astro + tailwindcss

## SEO (Critical — YMYL Risk)

### What's implemented (all verified from source)

- **Page titles**: Unique `<title>` with " | CogniArena" suffix on all ~66 pages
- **Meta descriptions**: Every page has unique `<meta name="description">`
- **OG tags**: og:type, og:title, og:description, og:url, og:site_name, og:image, og:image:width/height/alt
- **Twitter cards**: twitter:card (summary_large_image), title, description, image
- **Canonical URLs**: `<link rel="canonical">` on every page via layout prop
- **JSON-LD schemas**: Organization + WebSite on every page. Per-page: FAQPage, Quiz, SoftwareApplication, ProfilePage, CollectionPage, Dataset, BreadcrumbList, WebPage, ItemList
- **Sitemap**: 60+ URLs, priorities, changefreqs
- **Robots.txt**: Allow all, sitemap link
- **Heading hierarchy**: h1→h2→h3 on all pages
- **img alt**: All `<img>` tags have `alt` attributes (verified audit)
- **Calibration accuracy**: measurement disclaimer on latency-sensitive tests

### YMYL Requirements (MUST enforce before any change)

YMYL = "Your Money or Your Life". Cognitive assessments touching attention, memory, or brain function are YMYL-adjacent. Google expects E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).

Current protections (all verified):
1. **Footer disclaimer** (layout:789–791): "CogniArena is an educational, self-tracking, and cognitive training platform... not medical, diagnostic, clinical, psychiatric, or neuropsychological evaluations"
2. **Per-test disclaimers**: Every test page has a self-tracking notice box
3. **FAQ schema on every test**: Includes Q&A "Is this a medical diagnostic tool?" → explicit "No"
4. **Terms of Service** (terms/index.astro:31): "not medical, diagnostic, or clinical evaluations"
5. **Privacy policy**: Mentions local-first storage, no personal data collection
6. **44px tap targets**: 20 elements flagged below threshold (h-8/h-9 buttons) — not yet fixed

**Rules:**
- NEVER remove or weaken disclaimers
- NEVER make diagnostic/medical claims (e.g. "improves IQ", "treats ADHD")
- Pharma-grade language prohibited: "cure", "treat", "diagnose", "prescribe"
- Always phrase as "self-tracking", "entertainment", "cognitive training"
- Any new page must include: disclaimer + FAQPage with "Is this a medical diagnostic tool?" Q&A
- Schema.org markup required on every page

### AdSense (verified — NOT active)

- Script exists in layout (commented out): `ca-pub-XXXXXXXXXXXXXXXX` placeholder
- Privacy policy (s3) mentions AdSense cookies
- Status: **Not active**. Publisher ID is placeholder. Activate by uncommenting script + replacing with real pub ID

## Architecture Summary

```
public/          → static assets, sitemap, robots, i18n.js
src/
  components/    → React islands (tests, UI, dashboard, benchmarks, quiz)
  data/          → test manifest, percentiles, benchmarks config, typing passages
  i18n/          → 6-language translations (~4k lines)
  layouts/       → main.astro (single site-wide layout)
  pages/         → 77 Astro pages (23 tests + 23 learn + gauntlet + dashboard + benchmarks + quiz + info)
  runtime/       → IndexedDB data layer, percentile lookup, skill radar, training engine, hooks
  styles/        → global.css (Tailwind v4 + theme tokens)
sync-worker/     → separate CF Worker for optional D1 sync
```

- 24 tests total: 23 individual + 1 Gauntlet (5-stage composite)
- 6 cognitive axes: reaction, memory, processing, precision, focus, stamina
- 6 categories in sidebar: Reaction & Reflexes, Memory, Reasoning, Focus & Attention, Motor Performance, Executive Function
- 6 personas in training engine
- 2 quizzes: IQ test (pattern/matrix/sequence), Cognitive Style

## Test Page Conventions

Every test page under `src/pages/tests/{slug}/index.astro` MUST include:

- **How This Test Works** — `<HowItWorks>` component after the disclaimer, explaining what the test measures, how scoring works, and what affects results. Each page defines unique props (`whatItMeasures`, `howScoringWorks`, `whatAffectsResults`).
- **Explore All Tests** — `<ExploreTests currentSlug="{slug}" />` replacing the old 3-test Related Tests pill section. Renders all 24+ tests as category-grouped cards with descriptions.

Shared components live in `src/components/ui/`:
- `ExploreTests.astro` — full test grid sourced from `src/data/tests.ts`
- `HowItWorks.astro` — standardized 2-column card layout with FAQPage schema

Component slug maps directly to directory name (`reaction-time/` → slug `reaction-time`). The Gauntlet at `/gauntlet` uses slug `gauntlet`.

## Verified & Fixed Bugs (Phases 3-4 — June–July 2026)

All verified by reading actual source. 19 bugs confirmed and fixed:

### Phase 3 — Original 13 (pre-July)

#### Fixed in focus/ stages
- **Stage2 (ImpulseControl.tsx):** `clickedDistractorRef` never reset in `runTrial()` — once a distractor was clicked, ALL subsequent trials got false-alarm penalties. Fixed at `Stage2ImpulseControl.tsx:117`.
- **Stage3 (TaskSwitching.tsx):** Off-by-one in `isSwitch()` (compared N+1 vs N-1, skipping trial N). Fixed by setting `prevRuleRef` to current rule ID at `Stage3TaskSwitching.tsx:84`.
- **Stage4 (SustainedAttention.tsx):** Inner glitch `setTimeout` not pushed to `glitchTimersRef` — orphaned timers after test ends. Fixed at `Stage4SustainedAttention.tsx:89-93`.

#### Fixed in individual tests
- **PrioritizationTest:** Stale closures in `endRound` captured `results`/`round` from initial render, corrupting score accumulation. Fixed by using `resultsRef`/`roundRef` instead of state.
- **PatternReasoningTest:** Stale `answers` in `finishTest` closure — accuracy metadata missing the last answer. Fixed by using `answersRef`.
- **DualNBackTest:** Stale `n` in `generateSequence(n)` — used state (old value) instead of `startN`. Also `formatTopPercentile(accuracy)` was passing accuracy (0-100) instead of percentile (0-99). Fixed: `startN` arg + `resultPercentile` state.
- **ReactionTimeTest:** `metadata: { attempts }` used stale state instead of `allAttempts` parameter. Fixed.
- **TrailMakingTest:** Penalties display hardcoded `2000` instead of `penaltyDuration.current`. Fixed.
- **ClickSpeedTest:** Cadence chart showed cumulative CPS (avg since start), not instantaneous CPS per 100ms interval. Fixed by using `intervalClicksRef`.
- **DecisionSpeedTest:** Side effects (`setPhase`, `finalize`, `setTimeout`) inside `setTrial` state updater — React Strict Mode double-invocation bug. Moved all side effects out of updater.
- **NumberMemoryTest:** Race condition between async `finishTest` and "Try Again" — continuing `finishTest` could overwrite new game state. Fixed by adding `submittedRef` guards after each await.
- **SoundReactionTest:** Missing `useVisibilityGuard` — timer could fire after tab switch. Fixed.

### Phase 4 — 25-File Checklist & Polish (July 2026)

#### Fixed bugs
- **SequenceMemoryTest.tsx:108:** `newSeq` not defined (pre-existing type error, never built). Fixed: replaced with `sequenceRef.current`.
- **VisualPatternTest.tsx:** Mount `useEffect` missing cleanup — interval leaked on unmount. Fixed: added `return` to clear `timerRef`.
- **VerbalMemoryTest.tsx:** `beginTest()` didn't reset `submittedRef.current = false` — second game's `finalize` silently skipped saving. Fixed.
- **SpatialOrientationTest.tsx:** Same `submittedRef` reset gap as VerbalMemoryTest. Fixed.
- **StageReaction.tsx:** No `respondedRef` in 'ready' handler — double-click could record duplicate RT and corrupt average. Fixed.
- **StageStroop.tsx:** No `respondedRef` in `handleAnswer` — double-click could advance trial twice. Fixed.
- **StageMatrix.tsx:** No `respondedRef` in `handlePick` — same double-answer vulnerability. Fixed.
- **StageAim.tsx:** No `respondedRef` in `handleClick` — double-click could corrupt offset tracking. Fixed.

#### Restart buttons added on result screens (missing explicit restart)
- **F1LightsTest.tsx** — added "Restart Assessment" button
- **SoundReactionTest.tsx** — added "Restart Assessment" button
- **ChoiceReactionTest.tsx** — added "Restart Assessment" button
- **GoNoGoTest.tsx** — added "Restart Assessment" button

#### Verified clean (all 5 checks pass, no changes needed)
ReactionTimeTest, ClickSpeedTest, AimTrainer, AimCoordinationTest, MouseAccuracyTest, FlickTrainerTest, TypingSpeedTest, DecisionSpeedTest, PlanningTest, PrioritizationTest, NumberMemoryTest, DualNBackTest, PatternReasoningTest, StroopTest, TrailMakingTest, GauntletTest, StageSequenceMemory (gauntlet), FocusChallengeTest + 5 focus stages

#### SEO/UX audit (July 2026)
- **Page titles:** PASS — all 25 test + 24 learn pages have unique titles
- **img alt:** PASS — all `<img>` tags have `alt` attributes
- **44px tap targets:** 20 elements below 44px (h-8/h-9 buttons: ErrorBoundary, SocialShare, SyncPanel, ThemeToggle, gauntlet stages, index CTAs) — flagged not fixed
- **FAQ schema:** PASS — FAQPage on all pages with 3+ substantive Q&A pairs
- **Build:** 77 pages, 4.42s, 0 errors
- **Tests:** 55 pass, 1 pre-existing fail (calibration.test.ts 141→144Hz snap)

### Phase 5 — July 2026 (formatTopPercentile, Difficulty, Restart During Gameplay, How to Play)

#### formatTopPercentile fix (pervasive across 20+ call sites)
- **`percentileLookup.ts`**: `formatTopPercentile()` now accepts `lowerIsBetter` param, returns `"Top X%"` (above-average) or `"Bottom X%"` (below-average) as full string — eliminates misleading "Top 0.1%" for poor scores.
- Updated all 20+ call sites across test components, dashboard, and shared components to pass `lowerIsBetter` flag.

#### Difficulty selector fixes (4 tests)
- **PatternReasoningTest**: Added `getDifficultyParams` call + `difficultyRuleTypes` ref — difficulty was completely ignored before.
- **FlickTrainerTest**: Added `getDifficultyParams` + `sizeMultiplier` ref.
- **AimCoordinationTest**: Added `getDifficultyParams` + `sizeMultiplier` ref, applied to target radius.
- **ClickSpeedTest**: Added `getDifficultyParams` import and call.

#### VerbalMemoryTest enhancements
- Added `formatTopPercentile` percentile badge in results display.
- Increased distractor word pool (2x Easy, 3x Hard) — more variety in choices.
- Fixed level display to use `startListSize.current + level - 1` instead of hardcoded `3 + level`.

#### GoNoGoTest accuracy metric
- Added accuracy % (hit rate) to result screen alongside false alarms and personal best.

#### GoNoGoTest dark mode text visibility
- Color name text was hardcoded `text-black` — poor contrast on dark backgrounds like PURPLE (#8b5cf6).
- Added `getContrastText(hex)` luminance function using WCAG relative luminance formula.
- Color name now dynamically uses `text-black` or `text-white` based on background luminance.

#### Persistent restart buttons during gameplay (all 25 tests)
- Added small ✕ button at top-right corner visible during all playing phases:
  - **With `flex justify-between` header bars** (easiest): StroopTest, DualNBackTest, AimTrainer, FlickTrainerTest, MouseAccuracyTest, VisualPatternTest
  - **Early-return pattern**: VerbalMemoryTest (encoding + recall), DecisionSpeedTest, PrioritizationTest, PlanningTest, SpatialOrientationTest, GauntletTest
  - **Single-container pattern** (added `relative` wrapper): ReactionTimeTest, GoNoGoTest, ClickSpeedTest, SoundReactionTest, F1LightsTest, ChoiceReactionTest, TrailMakingTest, NumberMemoryTest, SequenceMemoryTest, PatternReasoningTest, AimCoordinationTest, TypingSpeedTest
  - FocusChallengeTest skipped (already had "Quit" button during gameplay).
- Button goes back to intro/idle config screen, allowing difficulty change mid-session.

#### How to Play toggle in Focus Challenge stages
- All 5 focus stages (Stage1–Stage5) now have a `?` toggle button next to the trial counter during gameplay.
- Clicking shows a collapsible instructions panel with stage-specific rules.
- State managed via `showHelp` local state.
- Does not interfere with game timing or scoring.

#### Build & test status
- Build: 77 pages, 0 errors
- Tests: 55 pass, 1 pre-existing (calibration 141→144Hz snap)
- All changes verified clean

### Pre-existing (known, not from any audit)
- **calibration.test.ts:** 1 pre-existing test failure (unrelated).
