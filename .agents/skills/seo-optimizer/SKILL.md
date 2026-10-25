---
name: seo-optimizer
description: Comprehensive, self-contained SEO system covering technical SEO, on-page optimization, US-targeted keyword strategy, schema markup, FAQ optimization, E-E-A-T/content trust, and AI answer engine optimization (AEO/GEO) — for both single articles and entire websites. Use this skill whenever the user asks to optimize content or a site for SEO, improve search rankings, write or edit an SEO-friendly article/blog post, audit technical SEO, research or map keywords, add schema markup or FAQs, improve meta tags/titles/descriptions, or make anything "rank better," "more discoverable," or "search-optimized" — even if they don't say the word "SEO" explicitly (e.g., "will Google find this," "why isn't this page ranking," "make this article better for search," "review my site before I launch it"). Trigger for both quick single-page/article requests and full-site audits.
---

# SEO Optimizer

A complete, self-contained SEO system. It does not depend on any other document — everything needed to take a single article or an entire website to a genuinely finished SEO state lives in this skill. Default target audience is **US-based, English-speaking** unless the user specifies otherwise; every keyword, spelling, and phrasing decision should reflect that by default.

## Why this skill is structured the way it is

SEO work fails in two opposite ways: it either stays too generic (a checklist of "best practices" applied with no reference point, which produces plausible-looking but unverified claims of success), or it never actually concludes (endless "could also improve X" without ever saying the foundation is done). This skill is built to avoid both — it forces real evidence at each step (actual meta tags shown, actual competitor pages fetched, actual schema validated) and it forces a real, gated final verdict, so "no more SEO needed" is a claim you can trust rather than an assumption.

## Core rules — apply these regardless of which path below you take

1. **Evidence over assertion.** Every fix and every claim needs something checkable attached: the actual before/after of a tag, the actual schema block, the actual competitor page fetched and what it showed. Never write "optimized for SEO" without showing the specific change.
2. **US targeting is a default constraint, not a suggestion**, unless the user names a different audience: US English spelling ("optimize," "color," "center"), US-natural query phrasing, USD/MM-DD-YYYY where relevant.
3. **Never fabricate search volume, keyword difficulty, or traffic estimates.** If you don't have a live data source, say so and reason from query-construction and real competitor content coverage instead of inventing numbers.
4. **No keyword stuffing, ever.** Concrete, checkable rule: no exact-match keyword phrase should repeat more than roughly once per 150 words of body copy. If you find or write anything denser than that, rewrite it in natural language — in 2026 this is as much a ranking risk as a UX problem.
5. **Do not weaken existing trust content** (disclaimers, legal notices, safety information) while editing for SEO.
6. **Named, real competitors beat generic best practices.** Whenever the user can name 1-3 real competitors, fetch their actual pages and compare directly rather than reasoning from general SEO knowledge alone. If no competitor is named, proceed using strong default practice, but say plainly that this pass is not competitor-verified.
7. **Analytics/tracking setup (Google Analytics, Search Console, tag managers) is out of scope for this skill.** This skill optimizes the content and site itself, not measurement tooling. Don't add it, don't configure it, even if it seems related.

## Step 0 — Figure out which path you're on

Read the request and any provided content/URLs. Two paths, and they need genuinely different workflows — don't force one into the other:

- **Path A — Single article or piece of content** (a blog post, a landing page's copy, one specific page): go to `references/article-seo.md`. This is the common case when someone hands you a draft or a single URL and asks you to make it rank.
- **Path B — Full website or multi-page audit** (an entire site, a set of page templates, "review my site before launch"): go to `references/site-audit-checklist.md`, which is the orchestrating checklist for the six full-site phases below.

If it's ambiguous, ask — but default to Path A if a single piece of content or URL was actually provided, and Path B only if the user is clearly asking about a whole site.

## The six full-site phases (Path B pulls these in; Path A pulls in only what's relevant to one page)

Each phase has its own reference file with the full checklist, rationale, and evidence requirements — read the relevant one before doing that phase's work rather than working from memory of what it probably contains:

| Phase | Reference file | Covers |
|---|---|---|
| 1. Technical foundation | `references/technical-seo.md` | Crawlability, sitemap, canonicals, Core Web Vitals, mobile, structured data validity |
| 2. Keyword strategy | `references/keyword-research.md` | US-targeted keyword mapping, intent matching, cannibalization, gap analysis |
| 3. On-page optimization | `references/on-page-seo.md` | Titles, meta descriptions, headers, URL slugs, content depth, images |
| 4. FAQ & schema | `references/schema-faq.md` | Per-page FAQ requirements, FAQPage/Article/other schema, copy-paste JSON-LD templates |
| 5. Content quality & E-E-A-T | `references/content-eeat.md` | Sourcing/citation rules, authorship signals, avoiding AI-slop patterns, internal linking |
| 6. AI answer engine optimization | `references/aeo-geo.md` | Direct-answer-first structure, AI Overview / ChatGPT Search / Perplexity citation patterns |

## Final deliverable — always end with a real verdict, not a vibe

Whichever path you took, close with a scorecard-style report (Path A: `references/article-seo.md` has its own compact version; Path B: use the full template in `references/site-audit-checklist.md`). The report must end with one explicit line:

- `SEO FOUNDATION COMPLETE — no further structural SEO work identified` — only if every checklist item is genuinely clean with evidence, **or**
- `OPEN ITEMS REMAIN:` followed by a short, specific, prioritized list.

Never issue the "complete" verdict as a courtesy or because the user seems to want to be done — an inflated verdict here defeats the entire point of running this skill. If you're not sure something is clean, say so and mark it open.
