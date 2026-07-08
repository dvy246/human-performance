# 01 — Project Architecture Summary

## Project Identity

- **Name**: CogniArena
- **Domain**: cogniarena.com (canonical) / brain-bfn.pages.dev (Cloudflare Pages)
- **Type**: Static cognitive assessment platform (client-side only, no server rendering)
- **Tagline**: "Discover Your Cognitive Potential"

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro | 6.x |
| UI Runtime | React | 19.x |
| CSS | Tailwind CSS | v4 (via Vite plugin) |
| Build Tool | Vite | 7.x |
| Testing | Vitest | (configured) |
| Deployment | Cloudflare Pages | `wrangler pages deploy dist` |
| Sync Backend | Cloudflare Workers + D1 | `cogniarena-sync.divyyadav.workers.dev` |
| Node Requirement | >= 22.12.0 | — |

---

## Architecture Overview

```
brain/
├── src/
│   ├── components/
│   │   ├── tests/           # 24 interactive assessment components
│   │   │   ├── focus/       # 5 Focus Challenge stages
│   │   │   └── gauntlet/    # 5 Gauntlet stages + GauntletTypes
│   │   ├── dashboard/       # 4 dashboard components (BrainScore, CognitiveProfile, History, Records)
│   │   ├── benchmarks/      # 4 benchmark visualization components
│   │   ├── quiz/            # 2 quiz components (CognitiveStyle, IQTest)
│   │   └── ui/              # 11 shared UI components
│   ├── pages/
│   │   ├── tests/           # 23 test pages (Astro + React island)
│   │   ├── learn/           # 23 learn pages (SEO content)
│   │   ├── quiz/            # Quiz hub + 2 quiz sub-pages
│   │   ├── benchmarks/      # Benchmark hub + category detail pages
│   │   ├── dashboard/       # Performance HQ
│   │   ├── gauntlet/        # The Gauntlet page
│   │   ├── challenge/       # Challenge link resolver
│   │   ├── about/           # About page
│   │   ├── contact/         # Contact page
│   │   ├── privacy/         # Privacy Policy
│   │   ├── terms/           # Terms of Service
│   │   ├── methodology/     # Scientific methodology page
│   │   ├── history.astro    # Test history
│   │   ├── records.astro    # Personal records
│   │   ├── 404.astro        # Not Found error page
│   │   ├── 500.astro        # Server Error page
│   │   └── index.astro      # Home page
│   ├── layouts/
│   │   └── main.astro       # Main layout (888 lines) — nav, SEO, theme, analytics
│   ├── runtime/             # Core business logic
│   │   ├── dataLayer.ts     # IndexedDB persistence + sync engine
│   │   ├── calibration.ts   # Monitor refresh rate detection
│   │   ├── skillRadar.ts    # CAI score + radar chart computation
│   │   ├── TestStateMachine.ts  # Test state management
│   │   ├── share.ts         # Challenge encoding + share card canvas generator
│   │   ├── recovery.ts      # Recovery code generation (BIP-39 style)
│   │   └── trainingEngine.ts    # Personas, daily challenges, recommendations
│   ├── data/
│   │   ├── percentiles.json # Percentile lookup tables for 20+ tests
│   │   ├── benchmarks.ts    # Benchmark configs, age/profession data, distribution math
│   │   └── passages.ts      # 100+ typing passages across 12 categories
│   ├── i18n/
│   │   └── translations.ts  # 6 languages (en, es, fr, de, pt, ja)
│   └── styles/
│       └── global.css       # Theme system, animations, Tailwind v4 integration
├── sync-worker/             # Cloudflare Worker for cloud sync
│   ├── index.ts             # Push/pull API with rate limiting
│   └── wrangler.toml        # Worker config (D1 binding)
└── public/                  # Static assets
    ├── _headers             # Cloudflare Pages headers
    ├── _redirects           # Cloudflare Pages redirects
    ├── sitemap.xml          # 60+ URL sitemap
    └── robots.txt           # Crawl directives
```

---

## Routing Map

### Primary Routes (60+ pages)

| Route | Type | Component | Hydration |
|-------|------|-----------|-----------|
| `/` | Home | BrainScoreDashboard | `client:visible` |
| `/tests/{23 tests}` | Test pages | React test islands | `client:visible` |
| `/learn/{23 topics}` | SEO content | Static Astro | None |
| `/dashboard` | Performance HQ | CognitiveProfile | `client:load` |
| `/history` | Test history | HistoryDashboard | `client:load` |
| `/records` | Personal records | PersonalRecords | `client:load` |
| `/gauntlet` | 5-stage assessment | GauntletTest | `client:visible` |
| `/challenge` | Link resolver | Client-side redirect | Inline script |
| `/quiz` | Quiz hub | Static | None |
| `/quiz/iq-test` | IQ test | IQTest | `client:visible` |
| `/quiz/cognitive-style` | Style quiz | CognitiveStyleQuiz | `client:visible` |
| `/benchmarks` | Benchmark hub | Static + data | None |
| `/benchmarks/{slug}` | Category detail | Benchmark components | `client:visible` |
| `/about` | Platform info | Static | None |
| `/contact` | Contact form | Static (mock form) | None |
| `/privacy` | Privacy policy | Static | None |
| `/terms` | Terms of service | Static | None |
| `/methodology` | Scientific basis | Static | None |
| `/404` | Not found | Static (no layout) | None |
| `/500` | Server error | Static (no layout) | None |

---

## Data Architecture

### Local-First Storage (IndexedDB)

- **Database**: CogniArenaDB (v1)
- **Object Store**: `sessions`
- **Record**: `SessionRecord { id, testId, category, timestamp, rawScore, percentile, metadata, synced }`
- **Methods**: `saveSession`, `getHistory`, `getPersonalBest`, `getStreak`, `updateStreak`

### Cloud Sync (Optional)

- **Endpoint**: `https://cogniarena-sync.divyyadav.workers.dev`
- **Push**: POST `/api/sync/push` — batch upsert attempts by recovery hash
- **Pull**: POST `/api/sync/pull` — fetch all attempts by recovery hash
- **Auth**: Anonymous SHA-256 hashed recovery code (6-word mnemonic)
- **Rate Limit**: 20 requests/minute/IP (in-memory, per-worker-instance)

### Percentile System

- **Source**: `percentiles.json` — 20 test-specific lookup tables
- **Format**: `[{ score: number, percentile: number }]` sorted ascending
- **Usage**: Tests look up raw score → percentile rank
- **Issue**: 7+ tests use hardcoded generic tables instead of the JSON data

---

## Cognitive Assessment Suite (24 Tests)

### Reaction Suite
1. **Visual Reaction Time** — 5-trial average, paint-synced rAF timing, anti-cheat (<80ms filter)
2. **F1 Start Lights** — Sequential light reaction, 5-light sequence
3. **Sound Reflex** — Web Audio API 750Hz sine tone, sub-ms latency
4. **Choice Reaction** — 4-target grid, Hick's Law measurement

### Memory Suite
5. **Sequence Memory** — Simon-style grid pattern recall, increasing length
6. **Number Memory** — Digit span recall, increasing length
7. **Verbal Memory** — Word list encoding + recall from distractors
8. **Dual N-Back** — Configurable N-level, visual + auditory stimuli

### Reasoning Suite
9. **Pattern Reasoning** — 4 modes: pattern, matrix, sequence, analogy (SVG shapes)
10. **Visual Pattern** — Visual pattern completion
11. **Decision Speed** — Number ≥50 or <50 binary classification

### Focus Suite
12. **Stroop Test** — Color-word interference task
13. **Go/No-Go** — Impulse control (go on green, inhibit on red)
14. **Trail Making A** — Sequential number connection
15. **Trail Making B** — Alternating number-letter connection
16. **Focus Challenge** — 5-stage attention gauntlet (selective, impulse, switching, sustained, memory under distraction)

### Motor Suite
17. **Click Speed** — CPS measurement with time/word modes
18. **Aim Trainer** — Shrinking target precision (Fitts's Law)
19. **Mouse Accuracy** — Decreasing target sizes, offset measurement
20. **Flick Trainer** — Rapid flick-to-target accuracy

### Executive Suite
21. **Planning** — Tower of Hanoi (4 disks, 3 pegs)
22. **Prioritization** — Task scheduling under time pressure (5 rounds)

### Composite
23. **Typing Speed** — Full typing engine (WPM, accuracy, consistency, burst speed)
24. **The Gauntlet** — 5-stage composite (reaction → memory → stroop → matrix → aim)

---

## Scoring Architecture

### CAI (CogniArena Index)

- Computed from 6 cognitive dimensions: Reaction, Memory, Processing, Precision, Focus, Stamina
- Each dimension = average percentile of tests in that category
- CAI = average of active dimension percentiles × 10
- Range: 0–100

### Hexagonal Radar Profile

- SVG-based hexagonal radar chart
- 6 axes: Reaction, Memory, Processing, Precision, Focus, Stamina
- Coordinates computed via `skillRadar.ts`

### Per-Test Scoring

- Each test computes a raw score and maps to percentile via lookup table
- Tests save to IndexedDB with: testId, category, rawScore, percentile, metadata
- Share cards generated via Canvas API (1200×630, PNG data URL)

---

## Theme System

- CSS custom properties for light/dark themes
- Tailwind v4 `@theme` integration maps CSS vars to Tailwind color tokens
- Theme persisted in `localStorage` (`cogniarena-theme`)
- Inline `<script>` in `<head>` prevents FOUC
- `prefers-reduced-motion: reduce` disables all animations

---

## i18n System

- 6 languages: English, Spanish, French, German, Portuguese, Japanese
- Translation keys: nav, footer, mobile nav, hero, how-it-works, FAQ, profile, learning, buttons
- Implementation: `data-i18n` attributes + inline JS translation map
- Non-English translations are incomplete/abbreviated

---

## SEO Architecture

### Per-Page SEO

- Unique `<title>`, `<meta description>`, canonical URL on every page
- Open Graph tags (title, description, type, url)
- Twitter Card tags (summary_large_image)
- JSON-LD structured data: Quiz, FAQPage, Article, SoftwareApplication, ProfilePage, CollectionPage, Dataset

### Sitemap

- `public/sitemap.xml` — 60+ URLs
- Priority and changefreq values set

### Internal Linking

- Sidebar navigation with 7 accordion categories
- "Related Tests" sections on test pages
- Learn pages cross-link to test pages
- Methodology page linked from dashboard and test pages

---

## Deployment Configuration

- **Build**: `npm run build` → Astro static output to `dist/`
- **Deploy**: `npx wrangler pages deploy dist --commit-dirty=true`
- **Project**: `brain-bfn` on Cloudflare Pages
- **Headers**: `X-Robots-Tag: noindex` on `brain-bfn.pages.dev/*`
- **Redirects**: `/challenge/*` → `/challenge/` (200 rewrite)
- **Analytics**: Google Analytics G-9WHJWEWD5L
- **AdSense**: Placeholder `ca-pub-XXXXXXXXXXXXXXXX` (NOT configured)

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| astro | Static site framework |
| react / react-dom | Interactive test islands |
| @astrojs/react | React integration |
| tailwindcss | Utility CSS |
| @tailwindcss/vite | Tailwind v4 Vite plugin |
| vitest | Unit testing |
| wrangler | Cloudflare deployment |

---

## Summary Statistics

- **Total Source Files**: ~100+
- **Test Components**: 24 + 10 sub-stages
- **Astro Pages**: 55+
- **Lines of Code**: ~15,000+
- **Typing Passages**: 100+ across 12 categories
- **Percentile Tables**: 20 test-specific tables
- **i18n Languages**: 6
- **Recovery Code Entropy**: ~28 bits (6 words from 160-word list)
