---
name: seo-aeo-geo-launch-checklist
description: >
  Single bundled plugin that runs one strict, sequential, gated checklist covering pre-launch technical
  indexing, Search Essentials spam-policy compliance, E-E-A-T/YMYL content quality, Core Web Vitals/page
  experience, structured data, AEO (answer/featured-snippet readiness), and GEO (AI answer-engine
  readiness) — sourced only from Google's own published documentation, never SEO folklore. Use whenever
  the user wants a website or article audited end-to-end before or after launch; asks "is this ready to
  launch," "will Google index this," "why isn't my site ranking," "audit my SEO/AEO/GEO," "check my
  robots.txt/sitemap/canonical setup," or wants a full pre-launch technical SEO audit of a codebase. Runs
  as ONE ordered pass (not parallel workstreams) so each phase's findings are verified evidence, not
  assumption, before the next phase begins. Ends in an explicit PASS / PASS WITH RISKS / FAIL launch
  verdict, never a vague "looks good."
---

# SEO + AEO + GEO Launch Checklist — one plugin, one sequential gate

This is a **checklist runner, not a strategy consultant**. Its only job is to walk a site or article
through every phase below, in order, and produce a verifiable pass/fail table for each — never a vague
"looks fine." If the user wants deeper strategic advice (growth roadmaps, ICE-scored tactics, AdSense
prep), that's a different, more consultative job — say so and suggest the broader `seo-grandmaster`
skill if installed. This plugin's whole reason to exist is a **strict, ordered, evidence-gated audit**.

## The one rule that overrides everything else

**Never state a specific probability, percentage, or ranking guarantee.** Rankings depend on factors no
audit controls (competitors, algorithm changes, accumulated trust, real backlinks). This checklist can
only honestly certify: *"no self-inflicted technical, spam-policy, or content-quality issue is blocking
this site's potential"* — never *"this will rank #1."*

## Mandatory prevention check — before finalizing anything

Before any phase result or the final verdict ships, cross-check every finding and every recommendation
against `references/bad-seo-practices-prevention-list.md` — the complete, categorized list of practices
that get sites penalized, demoted, or de-indexed (content manipulation, cloaking, link schemes,
technical self-sabotage, structured-data abuse, page-experience violations, GEO/AEO anti-patterns,
E-E-A-T violations, and audit-process fabrication). If anything found on the site — or anything this
plugin is about to recommend — matches an item on that list, it is automatically flagged `Avoid`, cited
by category, and paired with a white-hat alternative. This check is not optional and not a one-time
read: run it silently at the end of every phase, not just once at the start.

## Evidence rule — applies to every phase, no exceptions

Every checklist item must be answered from something actually fetched or read this run: the real page
HTML, the real config file, the real robots.txt, the real header response. Never write "looks good" or
"appears fine" from memory or assumption. If something can't be checked (no access to hosting config,
no live URL given), say so explicitly and mark that item **UNVERIFIED**, not passed.

## Why sequential, not parallel

Later phases depend on ground truth established earlier. You cannot judge spam-policy risk (Phase 4)
before confirming the page is even indexable (Phases 0-3) — auditing content quality on a page Google
can't crawl is wasted work. Run every phase **in this exact order**, and do not skip ahead:

```
Phase 0  → Meta Tags & On-Page Basics
Phase 1  → Sitemap & Canonical URL Alignment
Phase 2  → Redirects vs. Active Routes
Phase 3  → Robots.txt & Indexation Blockers
   ── GATE: Phases 0-3 must PASS before continuing. A failure here blocks everything downstream. ──
Phase 4  → Search Essentials Spam-Policy Compliance
Phase 5  → Content Quality, E-E-A-T & YMYL
Phase 6  → Page Experience & Core Web Vitals
Phase 7  → Structured Data / Schema
Phase 8  → AEO — Answer & Featured-Snippet Readiness
Phase 9  → GEO — AI Answer-Engine Readiness
   ── Final → Launch Verdict & Monitoring Setup ──
```

If Phases 0-3 turn up a **Critical** issue, still complete the full report for transparency, but the
final verdict caps at **FAIL** regardless of how clean Phases 4-9 look — an unindexable page makes
everything after it moot.

## Standalone deep-dive: Google AdSense approval readiness

If the user is preparing an AdSense application, asks "will I get AdSense approved," "is my site ready
for AdSense," or wants an AdSense-specific pre-application check, use
`references/google-adsense-approval-checklist.md`. It's sourced directly from Google's own AdSense Help
pages (eligibility requirements, site-readiness questions, Program policies, Publisher Policies, and
Publisher Restrictions) — fetched live, not from third-party "AdSense checker" tools or unverifiable
numeric folklore (specific wait times, article-count minimums). Run it after Phases 0-9 above, or
standalone if the user only wants the AdSense-specific gate.

## Standalone deep-dive: internal linking, metadata, sitemap/robots, schema & AEO/GEO

If the user asks specifically about internal linking strategy, title/description length limits, sitemap
or robots.txt hygiene, JSON-LD/FAQ schema consistency, or AEO/GEO readiness — either as a drill-down
after a Phase 0/1/3/7/8/9 finding, or as a standalone request without running the full sequential audit
— use `references/internal-linking-metadata-technical-checklist.md`. It's the consolidated execution
detail for exactly those five areas in one file, still bound by the same evidence rule and the
`bad-seo-practices-prevention-list.md` gate as everything else in this plugin.

---

## Phase 0 — Meta Tags & On-Page Basics
*Source: [Search Essentials](https://developers.google.com/search/docs/essentials)*

- [ ] **Title tag**: present, unique per page/template, ~50-60 characters, not a scaffolding placeholder
- [ ] **Meta description**: present, unique per page, ~150-160 characters, not a copy-pasted template default
- [ ] **Robots meta tag**: absent or explicitly `index, follow` on every page meant to be indexed — flag
      any page inheriting an accidental `noindex` from a shared layout component
- [ ] **Viewport meta tag**: present (`width=device-width, initial-scale=1`)
- [ ] **Open Graph URL** (`og:url`): matches the real production URL, no placeholder domain

**Report row:** `Page/template | Item | Found value | PASS/FAIL/UNVERIFIED | Fix`

## Phase 1 — Sitemap & Canonical URL Alignment
*Source: [Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)*

- [ ] Fetch the sitemap; confirm UTF-8 encoding and that no single file exceeds 50,000 URLs / 50MB
- [ ] For each sitemap URL, fetch the page and check its `<link rel="canonical">`
- [ ] **Any sitemap URL whose canonical points elsewhere** → exclude it from the sitemap; keep only the
      canonical target
- [ ] Reverse check: every canonical target that pages actually point to should itself be in the sitemap
- [ ] Confirm the sitemap is (or will be) submitted via Search Console

**Report row:** `Sitemap URL → canonical points to [X] → ACTION: remove/keep`

## Phase 2 — Redirects vs. Active Routes
*Source: [Search Essentials](https://developers.google.com/search/docs/essentials)*

- [ ] Locate the real routing/redirect config for this stack (`astro.config`, `next.config`,
      `vercel.json`, `_redirects`, `netlify.toml`, or equivalent — find the actual one, don't assume)
- [ ] Cross-reference every redirect rule against the sitemap and live navigation
- [ ] **No sitemap URL or nav-linked page should be a redirect source** — redirects only belong on
      legacy, deleted, or intentionally-shortened paths
- [ ] Confirm redirects are proper 301s (or appropriate 3xx), not JS-only or sneaky redirects showing
      Google different content than users see

**Report row:** `[file:line] redirects [source]→[dest], but source is [in sitemap/linked from nav] → ACTION`

## Phase 3 — Robots.txt & Indexation Blockers
*Source: [Search Technical Requirements](https://developers.google.com/search/docs/essentials/technical)*

- [ ] Fetch `robots.txt`: correctly formatted, `Sitemap:` directive points to the exact live sitemap URL
- [ ] No overly broad `Disallow` left over from a staging environment
- [ ] Check production headers (`_headers`, `netlify.toml`, hosting/middleware config) for
      `X-Robots-Tag: noindex` — **must never apply to the production domain**, only to preview/staging
      subdomains (e.g. `*.pages.dev`, `*.vercel.app`)
- [ ] Confirm no page requiring login gates content meant to be indexed (Googlebot can't authenticate)
- [ ] Every indexable page returns HTTP 200 — no accidental 4xx/5xx
- [ ] Once live, verify with an actual `site:yourdomain.com` search rather than assuming

**Report row:** `[config path] — [noindex/robots issue] applies to [scope] → ACTION`

### ── GATE ── Phases 0-3 verdict
State explicitly: **PASS** (all items PASS or acceptably UNVERIFIED-and-noted) or **FAIL — indexing
blocked** (any Critical item failed). If FAIL, name exactly which item and file. Continue to Phase 4
regardless, for a complete report, but the final verdict cannot exceed FAIL if this gate fails.

---

## Phase 4 — Search Essentials Spam-Policy Compliance
*Source: [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies)*
— full detail in `references/spam-policy-categories.md`

Check every named category explicitly — do not skip any, even if the site "seems fine". For the full
expanded list of specific bad practices under each category (with fine-vs-violation examples), see
`references/bad-seo-practices-prevention-list.md`; for category-level fine/violation nuance, see
`references/spam-policy-categories.md`.

- [ ] **Cloaking** — content shown to Googlebot matches what real users see
- [ ] **Doorway abuse** — near-duplicate location/variant pages are each substantively useful alone
- [ ] **Scaled content abuse** — no bulk-generated pages (AI or otherwise) without real distinct value
- [ ] **Thin affiliate content** — original value added, not copied merchant descriptions
- [ ] **Scraped content** — nothing republished without original value or citation
- [ ] **Keyword stuffing** — no unnatural keyword/location repetition
- [ ] **Hidden text/links** — nothing invisible to users but visible to crawlers
- [ ] **Link spam** — no paid/exchanged links without `rel="nofollow"`/`"sponsored"`
- [ ] **Sneaky redirects** — none beyond the legitimate ones already verified in Phase 2
- [ ] **Misleading functionality** — every tool/calculator does what it claims
- [ ] **Site reputation abuse** — third-party content fits the site's actual subject matter
- [ ] **User-generated spam** — spam prevention exists before launch if comments/UGC are accepted

**Report row:** `Category | Evidence checked | PASS/FAIL | If FAIL: specific fix`

## Phase 5 — Content Quality, E-E-A-T & YMYL
*Source: [Creating Helpful, Reliable, People-First Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)*

- [ ] **Who** — bylines exist where expected, link to real author background
- [ ] **How** — AI/automation use in content is disclosed, with a reason given
- [ ] **Why** — content exists to help the audience, not primarily to attract search traffic
- [ ] Passes the self-check: original analysis, bookmark-worthy, no easily-verified factual errors
- [ ] Content is non-commodity — adds beyond what's freely available elsewhere
- [ ] **If YMYL** (health, financial stability, safety, wellbeing): trust signals are especially strong —
      this is the one category where E-E-A-T is weighted even more heavily; when in doubt, treat as YMYL
- [ ] No page implies a confirmed date/outcome/figure that isn't actually confirmed
- [ ] Dates aren't updated without the underlying content substantially changing

**Report row:** `Page | Dimension | Evidence | PASS/FAIL | Fix`

## Phase 6 — Page Experience & Core Web Vitals
*Source: [Understanding Page Experience](https://developers.google.com/search/docs/appearance/page-experience), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)*

- [ ] **LCP** under 2.5s, **INP** under 200ms, **CLS** under 0.1 — name the tool used (PageSpeed
      Insights/CrUX) if live data isn't fetchable in this session; never fabricate a score
- [ ] HTTPS served site-wide
- [ ] No excessive/above-fold ads interfering with main content
- [ ] No intrusive interstitials blocking content access
- [ ] Main content clearly distinguishable from nav/ads
- [ ] Responsive across mobile/tablet/desktop

**Report row:** `Metric | Measured/estimated value | Source | PASS/FAIL/UNVERIFIED`

## Phase 7 — Structured Data / Schema
*Source: [Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)*

- [ ] Schema types match Google's supported types for this content (check the structured-data feature list)
- [ ] Every block validates with no errors (Rich Results Test)
- [ ] Schema describes only content genuinely visible on the page — **never fabricate** ratings, reviews,
      or credentials not actually present
- [ ] Not over-invested as an "AI visibility hack" — schema is for rich-result eligibility, not GEO

**Report row:** `Page | Schema type | Validator result | PASS/FAIL`

## Phase 8 — AEO: Answer & Featured-Snippet Readiness
*Source: [Search Essentials](https://developers.google.com/search/docs/essentials)*

- [ ] Question-phrased H2/H3 headings ("How does X work?") followed by a direct 40-60 word answer
- [ ] Clear "X is..." definition pattern for the core topic
- [ ] Numbered/bulleted list content where steps or rankings apply
- [ ] Comparison tables where relevant
- [ ] FAQ/HowTo schema present and structured correctly where the content type warrants it

**Report row:** `Page | AEO element | Present? | Quality note`

## Phase 9 — GEO: AI Answer-Engine Readiness
*Source: [Optimizing for Generative AI Features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)*

**Do check for:**
- [ ] Genuinely unique point of view or first-hand expertise, not synthesis of what's already published
- [ ] Clear paragraphs/headings for human readability (which also serves AI extraction)
- [ ] Named entity clarity (brand/person/place stated clearly and consistently)
- [ ] Site opted in to Search generative AI features in Search Console

**Explicitly flag as Avoid — Google names these as not helping:**
- [ ] An `llms.txt` file expected to influence Google Search (Google Search ignores it)
- [ ] Content artificially "chunked" for AI parsing (no ideal length/chunking requirement exists)
- [ ] Unnatural phrasing to match anticipated AI queries (Google already understands synonyms/intent)
- [ ] Inauthentic third-party "mentions" pursued purely as an AI-visibility tactic

**Report row:** `Item | Present/Absent | Evidence tier (Supported/Consistent/Avoid) | Note`

---

## Final Output — Launch Verdict

Close every run with one explicit table plus one explicit verdict line — never a bare "looks good":

| Phase | Verdict | Critical issues | Notes |
|---|---|---|---|
| 0-3 Indexing gate | PASS / FAIL | ... | ... |
| 4 Spam policy | PASS / FAIL | ... | ... |
| 5 E-E-A-T/YMYL | PASS / FAIL | ... | ... |
| 6 Page experience | PASS / FAIL / UNVERIFIED | ... | ... |
| 7 Structured data | PASS / FAIL | ... | ... |
| 8 AEO | PASS / partial | ... | ... |
| 9 GEO | PASS / partial | ... | ... |

Then one of:
- **`LAUNCH: PASS`** — no self-inflicted technical, spam-policy, or content-quality issue found (with
  evidence for each phase)
- **`LAUNCH: PASS WITH RISKS`** — indexable and compliant, but specific non-blocking issues remain (list them)
- **`LAUNCH: FAIL`** — the Phase 0-3 gate failed, or a spam-policy Critical was found; list exact fixes
  needed before re-audit

Always close with the reminder: *this verdict certifies nothing self-inflicted is blocking the site —
it is not, and can never honestly be, a ranking guarantee.*

See `references/report-template.md` for the full formatted report structure if the user wants a
polished write-up rather than the inline table above.

## After the gate: priority order for actually building ranking strength

The phases above are a pass/fail compliance gate — they answer "is anything broken or risky?" Once a
site clears them (or the user asks specifically for this instead of a compliance audit), a different
question comes up: "what's the priority order for building ranking strength from here?" That's a growth
question, not a compliance question, so it lives in a separate file rather than mixed into the gates
above: `references/priority-ranking-growth-signals.md`. It covers, in foundational-first priority order:
technical/Core Web Vitals (already this plugin's Phases 0-3/6), content quality and information gain,
**topical authority via content clusters**, on-page optimization, internal linking, backlink authority,
structured data, mobile/engagement signals, and freshness/monitoring. Every growth idea in that file is
still bound by `bad-seo-practices-prevention-list.md` — topical authority built via a scaled/doorway
content cluster is exactly the failure mode Phase 4 exists to catch, so route any "generate N pages for
topical authority" request through that check before proceeding.
