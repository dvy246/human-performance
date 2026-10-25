# Internal Linking, Metadata, Sitemap/Robots & Structured Data — Execution Checklist

This file is the **on-page execution layer**: the concrete, checkable specifics for the items the main
SKILL.md phases already gate on (Phase 0 metadata, Phase 1 sitemap, Phase 3 robots.txt, Phase 7 schema,
Phase 8-9 AEO/GEO). Use this file when the user wants the detailed how-to-do-it-right checklist for
these five areas specifically, or when a Phase 0/1/3/7/8/9 finding needs the deeper specifics below to
fix correctly rather than just flag. Same evidence rule as everywhere else in this plugin: every item
needs an actual fetch or file read — never "looks fine" from memory.

---

## 1. Strategic Internal Linking

Internal linking must be **coherent** (follows a real topical structure, not random cross-links) and
**strategic** (deliberately routes authority toward the pages that need to rank), not just "links exist."

- [ ] **Hub-and-spoke structure exists**: a clear pillar/hub page for each major topic, with supporting
      pages linking back to it and it linking out to them — not a flat mesh where every page links to
      every other page indiscriminately
- [ ] **No orphan pages**: every indexable page is reachable from at least one internal link somewhere
      on the site (check against the sitemap — any sitemap URL with zero inbound internal links is an
      orphan and a discoverability risk)
- [ ] **Descriptive, varied anchor text**: anchor text describes the destination page's actual content;
      the same exact-match anchor is not repeated identically across many links (that edges toward the
      keyword-stuffing pattern in link form — see `bad-seo-practices-prevention-list.md` §1 and §3)
- [ ] **Contextual, in-body links prioritized** over only-nav/only-footer links — links placed within
      real body content pass stronger topical relevance signal than boilerplate template links
      repeated on every page
- [ ] **Crawl depth is reasonable**: important pages are reachable within roughly 3 clicks from the
      homepage; don't bury priority pages 6+ links deep
- [ ] **Authority flows toward priority pages**: the site's strongest, most-linked-to existing pages
      link toward the pages currently being pushed to rank — link placement is deliberate, not
      leftover from whatever order pages were created in
- [ ] **No broken internal links**: every internal `<a href>` resolves to a live 200-status page, not a
      404, an old redirect chain, or a page since removed
- [ ] **Redirect chains are not used as internal link targets** — link directly to the final destination
      URL, not through an intermediate redirect (wastes crawl budget and dilutes link equity)
- [ ] **Cluster pages link both directions**: pillar → each subtopic AND subtopic → pillar, per the
      topical-authority pattern in `priority-ranking-growth-signals.md` §4

**Report row:** `Page | Link issue found | Evidence | ACTION`

---

## 2. Clean Metadata — Titles & Descriptions Under Word/Character Limits

- [ ] **Title tag length**: roughly 50-60 characters (Google typically truncates display around
      ~580-600px, which maps loosely to this range) — flag anything meaningfully over 60 characters as
      a truncation risk, not an automatic fail, since actual pixel width varies by character
- [ ] **Meta description length**: roughly 150-160 characters — same truncation-risk framing, not a
      hard technical requirement, but a practical display limit worth respecting
- [ ] **Every title is unique** across the site — no two pages/templates sharing an identical title
- [ ] **Every meta description is unique** — flag any template-wide copy-pasted default description
- [ ] **Primary keyword/topic appears naturally and early** in the title, without stuffing (one clear
      instance, not the keyword repeated within the same tag)
- [ ] **Title and description are genuinely descriptive of the page's actual content** — not generic
      boilerplate ("Home | Company Name" with nothing else) and not clickbait that doesn't match the
      page (a Search Essentials helpfulness concern, not just a length concern)
- [ ] **No placeholder text** left in either field from scaffolding ("Page Title", "Lorem ipsum",
      component default props)

**Report row:** `Page | Title (char count) | Description (char count) | Unique? | PASS/FAIL/RISK`

---

## 3. Clean sitemap.xml

- [ ] Valid XML, UTF-8 encoded
- [ ] Contains **only canonical URLs** — no URL whose own `<link rel="canonical">` points elsewhere
      (full cross-check method in `03-pre-launch-indexing-audit.md` Phase 1, if using the companion skill)
- [ ] No URL in the sitemap returns anything other than HTTP 200 — no 3xx, 4xx, or 5xx entries
- [ ] No URL in the sitemap carries a `noindex` directive (meta robots or `X-Robots-Tag`) — including it
      while blocking it is a direct contradiction that wastes crawl budget
- [ ] No single sitemap file exceeds 50,000 URLs or 50MB uncompressed (split + sitemap index if it does)
- [ ] `<lastmod>` values are accurate and reflect genuine content changes, not artificially bumped to
      fake freshness (see `bad-seo-practices-prevention-list.md` §1)
- [ ] Sitemap is reachable at a stable, predictable URL and is (or will be) submitted via Search Console

**Report row:** `Sitemap URL | Issue found | Evidence | ACTION`

---

## 4. Clean robots.txt

- [ ] Correctly formatted (valid directive syntax, no typos in `User-agent`/`Disallow`/`Allow`)
- [ ] `Sitemap:` directive present and points to the exact, correct, live sitemap URL — not a stale
      path, not a relative path that could resolve incorrectly
- [ ] No overly broad `Disallow: /` or similar left over from a staging/pre-launch environment
- [ ] Nothing the site actually wants indexed is accidentally disallowed
- [ ] Any legitimately blocked paths (admin panels, internal search results, duplicate parameter URLs)
      are blocked deliberately and narrowly, not as a blanket rule that catches good content too
- [ ] robots.txt itself is reachable at `/robots.txt` and returns HTTP 200

**Report row:** `robots.txt line | Issue found | ACTION`

---

## 5. Structured Data (JSON-LD) & FAQ Consistency

- [ ] Every JSON-LD block is valid — no syntax errors, passes the Rich Results Test
- [ ] **FAQ schema questions and answers match the visible on-page content exactly** — no schema
      containing Q&A pairs that don't actually appear rendered on the page (this is a direct
      structured-data-abuse risk, not just a mismatch)
- [ ] **FAQ schema is used consistently** across pages that have genuine FAQ content — don't add it to
      some FAQ sections and skip it on others with no reason
- [ ] Organization/brand schema (name, logo, URL, `sameAs` social profiles) is **identical across every
      page that includes it** — conflicting brand details across pages confuses entity resolution
- [ ] No fabricated fields anywhere: no `AggregateRating` without real reviews, no `Person`/author
      credentials that don't reflect a real author, no field describing something not actually on the page
- [ ] Schema type matches content type (don't mark up a blog post as `Product`, or a service page as
      `Article` if it isn't one)
- [ ] No duplicate/conflicting schema blocks for the same entity on the same page

**Report row:** `Page | Schema type | Validator result | Consistency check | PASS/FAIL`

---

## 6. AEO/GEO Readiness Checklist (consolidated)

This mirrors Phases 8-9 of the main SKILL.md, gathered here for a single execution pass when the user
wants just this slice rather than the full sequential audit.

**AEO — Answer & featured-snippet readiness:**
- [ ] Question-phrased H2/H3 headings ("How does X work?", "What is Y?") each followed by a direct,
      concise answer (roughly 40-60 words) immediately below
- [ ] A clear "X is..." definition sentence for the page's core topic
- [ ] Numbered or bulleted list content wherever steps, rankings, or discrete items apply
- [ ] Comparison tables wherever the content is inherently comparative
- [ ] FAQ/HowTo schema present and structured correctly where the content genuinely warrants it (see
      §5 above for the consistency requirement)

**GEO — AI answer-engine readiness:**
- [ ] Content offers a genuinely unique point of view or first-hand expertise, not a synthesis of
      what's already published elsewhere
- [ ] Clear paragraph/heading structure that serves human readability first (which also serves AI
      extraction as a side effect, not the other way around)
- [ ] Named entity clarity — brand/person/place stated consistently, matching the Organization schema
- [ ] Site opted in to Search generative AI features in Search Console, if applicable

**Explicitly avoid (Google names these as not helping — do not recommend):**
- [ ] An `llms.txt` file expected to influence Google Search
- [ ] Artificially "chunking" content for AI parsing
- [ ] Unnatural phrasing written specifically to match anticipated AI queries
- [ ] Inauthentic third-party "mentions" pursued purely as an AI-visibility tactic

**Report row:** `Page | AEO/GEO element | Present? | Evidence tier (Supported/Consistent/Avoid) | Note`

---

## How this file fits with the rest of the plugin

Run the main SKILL.md sequential phases first for a full pre-launch audit — this file is the deeper
execution detail for five specific areas within that sequence (Phases 0, 1, 3, 7, 8, 9), useful either
as a drill-down when one of those phases fails, or as a standalone checklist when the user only wants
this slice (e.g., "just check my internal linking and schema" without a full re-audit). Every item here
is still bound by `bad-seo-practices-prevention-list.md` — nothing in this file overrides that gate.
