# 04 — SEO Audit

## Technical SEO Overview

CogniArena is a static Astro site deployed on Cloudflare Pages. All SEO is implemented at the page level via the `main.astro` layout and individual page components. There is no server-side rendering or dynamic routing.

---

## Critical SEO Issues

### P0-1: X-Robots-Tag Noindex on Production Domain

**File**: `brain/public/_headers`
```
https://brain-bfn.pages.dev/*
  X-Robots-Tag: noindex
```

**Impact**: If the site is served from `brain-bfn.pages.dev` (the Cloudflare Pages default domain), ALL pages are marked `noindex`. Google will not index any page. If a custom domain (`cogniarena.com`) is configured, this header only applies to the `.pages.dev` domain and is harmless.

**Verification Required**: Confirm whether `cogniarena.com` is set up as a custom domain in Cloudflare Pages. If not, this is a **release blocker**.

**Fix**: Either remove the `_headers` file or change it to only apply to preview deployments. Add production headers with proper indexing directives.

---

### P1-6: Missing `site` Property in Astro Config

**File**: `brain/astro.config.mjs`

The Astro configuration does not define a `site` property. This affects:
- Sitemap generation (if using `@astrojs/sitemap` integration)
- Canonical URL resolution
- OG tag URL generation
- RSS feed URLs

**Impact**: The manual `sitemap.xml` in `public/` is unaffected, but any future Astro integrations relying on `site` will produce incorrect URLs.

**Fix**: Add `site: 'https://cogniarena.com'` to `astro.config.mjs`.

---

## Title Tags

| Page | Title | Length | Status |
|------|-------|--------|--------|
| Home | "CogniArena — Measure Your Cognitive Performance \| 13 Brain Assessments" | 72 chars | **P3-1**: "13" should be "23+" |
| Reaction Time | "Reaction Time Test — Measure Your Reflexes \| CogniArena" | 56 | OK |
| F1 Lights | "F1 Start Lights Test — Reflex Assessment \| CogniArena" | ~55 | OK |
| Sound Reaction | "Sound Reflex Test — Auditory Reaction Time \| CogniArena" | ~58 | OK |
| Choice Reaction | "Choice Reaction Test — Hick's Law Assessment \| CogniArena" | ~58 | OK |
| Sequence Memory | "Sequence Memory Test — Spatial Recall \| CogniArena" | ~50 | OK |
| Number Memory | "Number Memory Test — Digit Span Assessment \| CogniArena" | ~55 | OK |
| Verbal Memory | "Verbal Memory Test — Word Recall \| CogniArena" | ~47 | OK |
| Dual N-Back | "Dual N-Back Test — Working Memory \| CogniArena" | ~48 | OK |
| Pattern Reasoning | "Pattern Reasoning Test — Fluid Logic \| CogniArena" | ~52 | OK |
| Visual Pattern | "Visual Pattern Test — Pattern Completion \| CogniArena" | ~55 | OK |
| Decision Speed | "Decision Speed Test — Quick Choice \| CogniArena" | ~50 | OK |
| Stroop | "Stroop Test — Cognitive Interference \| CogniArena" | ~50 | OK |
| Go/No-Go | "Go/No-Go Test — Impulse Control \| CogniArena" | ~48 | OK |
| Trail Making | "Trail Making Test — Visual Attention \| CogniArena" | ~52 | OK |
| Focus Challenge | "Focus Challenge — 5-Stage Attention Test \| CogniArena" | ~56 | OK |
| Click Speed | "Click Speed Test — CPS Benchmark \| CogniArena" | ~49 | OK |
| Aim Trainer | "Aim Trainer — Precision Assessment \| CogniArena" | ~49 | OK |
| Mouse Accuracy | "Mouse Accuracy Test — Precision \| CogniArena" | ~46 | OK |
| Flick Trainer | "Flick Trainer — Speed & Accuracy \| CogniArena" | ~48 | OK |
| Planning | "Planning Test — Tower of Hanoi \| CogniArena" | ~47 | OK |
| Prioritization | "Prioritization Test — Task Scheduling \| CogniArena" | ~52 | OK |
| Typing Speed | "Typing Speed Test — WPM & Accuracy \| CogniArena" | ~50 | OK |
| Dashboard | "Performance HQ — CogniArena \| Cognitive Command Center" | ~56 | OK |
| Gauntlet | "The Gauntlet – 5-Stage Cognitive Assessment \| CogniArena" | ~58 | OK |
| About | "About CogniArena \| Cognitive Assessment Metrics" | ~48 | OK |
| Contact | "Contact Us \| CogniArena Platform Support" | ~40 | OK |
| Privacy | "Privacy Policy \| CogniArena local-first Privacy" | ~49 | OK |
| Terms | "Terms of Service \| CogniArena" | ~30 | OK |
| Methodology | "Scientific Methodology & Calibration Protocols \| CogniArena" | ~60 | OK |
| Benchmarks | "Cognitive Performance Benchmarks — Population Data \| CogniArena" | ~64 | OK |
| Quiz | "Interactive Quizzes — Cognitive Reasoning & Brain Health \| CogniArena" | ~68 | OK |
| History | "Test History - CogniArena" | ~26 | OK but minimal |
| Records | "Personal Records - CogniArena" | ~30 | OK but minimal |

**All titles include brand name "CogniArena"**. Good consistency.

---

## Meta Descriptions

All pages have unique meta descriptions. Lengths are within the recommended 120–160 character range. Descriptions include relevant keywords and calls to action.

**Status**: PASS

---

## Canonical URLs

| Page | Canonical | Status |
|------|-----------|--------|
| All test pages | `https://cogniarena.com/tests/{slug}` | OK |
| All learn pages | `https://cogniarena.com/learn/{slug}` | OK |
| Dashboard | `https://cogniarena.com/dashboard` | OK |
| Gauntlet | `https://cogniarena.com/gauntlet` | OK |
| About | `https://cogniarena.com/about` | OK |
| Contact | `https://cogniarena.com/contact` | OK |
| Privacy | `https://cogniarena.com/privacy` | OK |
| Terms | `https://cogniarena.com/terms` | OK |
| Methodology | `https://cogniarena.com/methodology` | OK |
| Benchmarks | `https://cogniarena.com/benchmarks` | OK |
| Quiz | `https://cogniarena.com/quiz` | OK |
| History | **MISSING** | **P1-1** |
| Records | **MISSING** | **P1-1** |

---

## Open Graph Tags

All pages using the main layout receive:
- `og:title` — from page title
- `og:description` — from page description
- `og:type` — "website"
- `og:url` — from canonical URL
- `og:site_name` — "CogniArena"

**Status**: PASS

---

## Twitter Card Tags

All pages using the main layout receive:
- `twitter:card` — "summary_large_image"
- `twitter:title` — from page title
- `twitter:description` — from page description

**Status**: PASS

---

## JSON-LD Structured Data

### Home Page
- FAQPage schema (5 questions) — OK
- SoftwareApplication schema — OK

### Test Pages (23 pages)
- Quiz schema — OK on all
- FAQPage schema (3 FAQs each) — OK on all

### Learn Pages (23 pages)
- Article schema with author "Dr. Alan Vanc" — OK
- **Issue**: "Dr. Alan Vanc" has no bio page or verifiable identity (E-E-A-T concern)

### Gauntlet
- Quiz schema — OK
- **P3-2**: Typo "Flaghsip" in schema description

### Dashboard
- ProfilePage schema — OK

### Benchmarks
- CollectionPage + Dataset schemas — OK

### Quiz Hub
- CollectionPage + 2 Quiz schemas — OK

### 404/500
- No schema (correct — these are noindex)

---

## Sitemap

**File**: `public/sitemap.xml` (388 lines)

- 60+ URLs
- Includes all test pages, learn pages, benchmark pages, quiz pages, legal pages
- `priority` and `changefreq` values set
- `loc` elements use `https://cogniarena.com` base

**Status**: PASS — comprehensive and well-structured.

---

## Robots.txt

**File**: `public/robots.txt`

**Status**: Present. Allows all crawlers. References sitemap.

---

## Internal Linking

### Navigation Links
- Sidebar: 7 accordion categories with all test links — OK
- Mobile bottom nav: Home, Tests, History, Profile — OK
- Footer: About, Contact, Privacy, Terms, Methodology — OK

### Cross-Links
- Test pages → Related tests — OK
- Test pages → Methodology page — OK
- Learn pages → Corresponding test pages — OK
- Dashboard → Methodology page — OK
- Gauntlet → Individual test pages — OK
- Focus Challenge → Recommended tests — OK

### Broken Links
- **P1-2**: 404 page → `/learn` (does not exist)

### Orphan Pages
- No orphan pages detected. All pages are reachable from navigation or internal links.

---

## Heading Hierarchy

All pages follow proper heading hierarchy:
- Single `<h1>` per page
- `<h2>` for major sections
- `<h3>` for subsections
- No skipped heading levels

**Status**: PASS

---

## URL Structure

| Pattern | Example | Status |
|---------|---------|--------|
| `/tests/{kebab-case}` | `/tests/reaction-time` | OK |
| `/learn/{kebab-case}` | `/learn/reaction-time` | OK |
| `/benchmarks/{slug}` | `/benchmarks/reaction` | OK |
| `/quiz/{kebab-case}` | `/quiz/iq-test` | OK |
| `/about`, `/contact`, etc. | — | OK |

All URLs are lowercase, kebab-case, and descriptive. No trailing slash issues.

---

## FAQ Schema Coverage

| Page Type | FAQ Count | JSON-LD FAQ | Match | Status |
|-----------|-----------|-------------|-------|--------|
| Test pages (23) | 3 each | Yes | Visible + Schema | OK |
| Home page | 5 | Yes | Visible + Schema | OK |
| Gauntlet | 2 | Yes | Visible + Schema | OK |
| Learn pages (23) | 2 each | No | Visible only | **P2**: Missing FAQ schema |
| Focus Challenge | 3 | Yes | Visible + Schema | OK |

**Issue**: Learn pages have visible FAQ sections but no corresponding FAQPage JSON-LD schema. This is a missed SEO opportunity.

---

## Image Alt Text

- Favicon files: Present (ico, svg, png)
- No content images with missing alt text detected in Astro templates
- React components use SVG icons inline (no img tags)

**Status**: PASS

---

## Duplicate Content

- Test pages and learn pages have distinct content (interactive test vs. educational article)
- No duplicate meta descriptions detected
- Canonical URLs prevent duplicate indexing

**Status**: PASS

---

## Thin Pages

| Page | Word Count | Status |
|------|-----------|--------|
| History (`/history`) | ~20 words | **P2**: Very thin |
| Records (`/records`) | ~20 words | **P2**: Very thin |
| Learn pages (3) | ~100 words each | **P2**: Thin for "pillar pages" |

---

## SEO Audit Summary

| Category | Score | Notes |
|----------|-------|-------|
| Title tags | 9/10 | P3-1: Wrong assessment count on home |
| Meta descriptions | 10/10 | Unique, well-lengthed |
| Canonical URLs | 8/10 | P1-1: Missing on history/records |
| OG/Twitter tags | 10/10 | Complete |
| JSON-LD schemas | 8/10 | P3-2: Typo. Learn pages missing FAQ schema |
| Sitemap | 10/10 | Comprehensive |
| Internal linking | 8/10 | P1-2: Broken /learn link on 404 |
| Heading hierarchy | 10/10 | Proper |
| URL structure | 10/10 | Clean |
| Indexability | 2/10 | **P0-1**: Possible noindex on production |

**Overall SEO Score**: 8.3/10 (would be 9.5/10 after fixing P0 and P1 issues)
