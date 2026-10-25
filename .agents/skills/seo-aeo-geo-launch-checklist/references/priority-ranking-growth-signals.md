# Priority Ranking & Growth Signals — Topical Authority Playbook

This file is different in kind from the other reference files in this plugin. The main SKILL.md phases
and `bad-seo-practices-prevention-list.md` answer **"is anything broken or risky?"** — a pass/fail gate.
This file answers a different question: **"given a clean, compliant site, what's the actual priority
order for building ranking strength?"** It's a growth-priority framework, not a compliance check, so
nothing here produces a PASS/FAIL — it produces a prioritized action list, ordered by how foundational
each item is (a broken foundation blocks everything built on top of it, regardless of effort spent
elsewhere).

**Use this file when:** the site has already cleared Phases 0-9, and the user asks "what should we
actually do to rank," "what's the priority order," or "how do we build topical authority" — not during
the compliance audit itself.

**Still bound by the same rules as the rest of this plugin:** never fabricate search volume, traffic
estimates, or a ranking probability/timeline guarantee. "Results timelines vary" is honest phrasing;
promising a specific week-by-week ranking outcome is not.

## The priority order, and why this order

Foundational items are listed first because they act as **hard gatekeepers** — a technically broken
site or poor Core Web Vitals score caps the ceiling of everything built on top, no matter how good the
content or how many backlinks follow. Authority-building items come last not because they matter less
long-term, but because they take longest to compound and depend on everything above already being solid.

### 1. Technical SEO & crawlability (highest priority)
Already the subject of Phases 0-3 in the main checklist. Nothing below this line matters if Google can't
crawl, render, and index the site — treat any technical audit failure as blocking, not a parallel
workstream.

### 2. Core Web Vitals & page experience
Already Phase 6. LCP, INP, CLS, mobile-first performance, image compression, and layout stability. Sites
passing these both rank and convert better; failing them holds pages back regardless of content quality.

### 3. High-quality content with strong search-intent match and information gain
The content should fully answer the query in the format users expect (guide, comparison, list, etc.),
lead with the answer, and add something a competitor's page doesn't have — original data, first-hand
testing, or a genuinely distinct point of view. This is the strongest 2026-era ranking correlate after
technical eligibility. Generic, thin, or "me-too" content struggles regardless of how well-optimized its
tags are. Ties directly to Phase 5's E-E-A-T check — this item is what E-E-A-T looks like in practice.

### 4. Topical authority via content clusters
**What it is:** search engines and AI systems evaluate how completely a *site* covers a subject, not
just whether one page ranks for one keyword. A pillar page plus a set of tightly related supporting
pages, cross-linked to each other, demonstrates depth a standalone article can't.

**How to build it without tripping Phase 4's spam-policy gate:**
- Every cluster page must be genuinely useful **on its own** — the doorway-abuse and scaled-content-
  abuse checks in `bad-seo-practices-prevention-list.md` apply with full force here. A cluster of pages
  that differ only by a swapped subtopic keyword is the exact failure mode Google's scaled-content
  policy targets, even when the intent (topical authority) is legitimate.
- Map the cluster before writing: one pillar page (broad, comprehensive) + N subtopic pages (each
  answering one specific angle the pillar can't fully cover in depth) + explicit internal links from
  pillar → each subtopic and subtopic → pillar.
- Prioritize subtopics with genuinely different search intent or angle, not just different keywords for
  the same underlying answer.

### 5. On-page optimization (titles, headings, structure, keywords)
Compelling title tags and meta descriptions, one clear H1, logical heading hierarchy, primary keyword
placed naturally and early, scannable structure. Already checked mechanically in Phase 0 and Phase 8;
this item is the strategic layer on top — writing them well, not just having them present.

### 6. Strategic internal linking
Link from a site's strongest, most relevant existing pages toward the pages being pushed to rank, using
descriptive and varied anchor text (never the same exact-match anchor repeated site-wide — that itself
edges toward the keyword-stuffing pattern in link form). Build a genuine hub-and-spoke structure, not a
flat mesh where every page links to every other page indiscriminately. Internal linking often produces
faster ranking movement than external link-building because it's fully within the site's own control.

### 7. Quality backlinks & authority
Prioritize relevant, authoritative links over raw volume — digital PR, original research others want to
cite, genuine guest contributions to sites that fit the subject matter. **Every backlink tactic here
must be checked against Section 3 of `bad-seo-practices-prevention-list.md`** (link manipulation) before
recommending it: no buying, no PBNs, no reciprocal schemes, no bulk guest-posting-for-links-only. This
takes longer to compound than on-page or technical work — set expectations accordingly, without giving
a specific timeline promise.

### 8. Structured data (schema markup)
Article, FAQ (where genuinely applicable), Organization, Product, LocalBusiness, etc. — matched to what
Phase 7 already checks for validity and non-fabrication. Lower effort, solid supporting signal; not a
substitute for the items above it.

### 9. Mobile-first experience & engagement signals
Mobile usability, fast interactions, readable text, no intrusive interstitials, positive engagement
(time on page, low bounce on key pages). Overlaps with Phase 6; the strategic addition here is
optimizing for genuine user engagement, not just the raw Core Web Vitals numbers.

### 10. Freshness, monitoring & ongoing refinement (maintenance tier)
Update important pages when the underlying information genuinely changes (never just to fake a fresh
date — see the "fake freshness" item in the prevention list), track Search Console performance, refresh
underperforming pages, watch for algorithm shifts. Lower priority than the fundamentals, but this is what
prevents earlier work from decaying.

## Suggested phasing (a rough sequencing pattern, not a guarantee)

- **Early phase:** technical crawlability + Core Web Vitals + basic on-page fixes on the highest-value
  existing pages
- **Middle phase:** content upgrades, intent matching, building out topical clusters, internal linking
- **Ongoing:** authority building (links + sustained E-E-A-T signals) and monitoring

State plainly to the user that actual timelines vary by competition and starting position — technical
and on-page fixes can show movement in weeks, while content authority and backlink-driven authority
typically take months. Never convert this into a specific promised date or ranking position.

## How this interacts with the rest of the plugin

Run the SKILL.md phase gates (0-9) first, every time — this file only becomes relevant once those are
clean or the user explicitly asks for a growth/priority plan alongside or after the compliance audit.
If a growth idea proposed here would require anything flagged in `bad-seo-practices-prevention-list.md`
(e.g., "just generate 200 city pages" for topical authority), stop and flag it there instead of
proceeding — topical authority and content clusters are legitimate goals, but the implementation must
still clear the same spam-policy bar as everything else in this plugin.
