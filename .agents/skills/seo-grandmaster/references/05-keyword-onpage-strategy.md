# US-Targeted Keyword Strategy & On-Page Optimization (Without Stuffing)

Default target audience is **US-based, English-speaking** unless the user specifies otherwise — every
keyword, spelling, and phrasing decision should reflect that by default (US spelling: "optimize,"
"color," "center"; US-natural query phrasing; USD/MM-DD-YYYY where relevant).

## Step 1 — Map every page to keywords before touching on-page copy

For each page: one **primary keyword** and 2-4 **secondary/long-tail keywords**, chosen the way a real
US searcher would actually phrase the query — not a restatement of internal product jargon. Honest
methods, without a live search-volume tool:
- Construct the query the way a person actually speaks it, not the way a spec sheet is written.
- Reason from common query patterns (question words, "X vs Y" comparison phrasing, modifiers like
  "free," "best," "near me" where geographically relevant).
- If named competitors exist, fetch their actual titles/H1s/URL slugs and compare directly rather than
  guessing.

**Never fabricate a specific search-volume or keyword-difficulty number.** If there's no live data
source this run, say so plainly and reason from query construction and real competitor coverage.

### The four real selection factors, and one important precision note

When a real keyword tool is available, weigh: **volume** (searches/month), **competition** (how hard it
is to rank), **relevance** (would this traffic actually convert/matter to the site), and **site
authority** (an older, established site with a track record of quality content generally finds it
easier to rank for a given keyword than a brand-new site). **Precision note**: "Domain Authority" as a
specific named score is a third-party metric (Moz's), not a metric Google itself calculates, discloses,
or confirms using — treat any specific DA number as a directional proxy at most, never as a stated
Google ranking factor. The underlying idea (accumulated site trust/track record matters) is a reasonable
inference; the specific score is not something to cite as Google-confirmed.

**Practical strategy for a new or smaller site**: prioritize lower-competition, clearly-relevant
keywords first to gain traction and accumulated authority, rather than opening with the highest-volume,
highest-competition head terms the site has no realistic near-term chance of winning.

### Verify intent by actually checking the real SERP, not just the keyword's phrasing

A keyword can look like a perfect match by volume and topic while actually serving a completely
different intent than assumed. Before committing to a keyword: search it (or reason from known SERP
patterns for that query type) and check what's *actually* ranking — the real content type, not just the
term. If the real results serve a different audience/intent than the page being planned, that's a
mismatch no amount of on-page optimization will fix — pick the more precisely-matching variant instead.

## Step 1b — Prioritize keywords already close to ranking (if historical data exists)

If the site has existing Search Console data, check for pages already ranking on page 2 (positions
~11-20) for relevant terms — moving a page from position 15 to position 8 is often realistically easier,
and drives disproportionately more traffic, than taking a brand-new page from nothing to page 1. Name
the real tool this requires (Search Console position/query data, or a paid tool like Ahrefs/Semrush for
deeper competitive/backlink analysis) rather than estimating position without it.

## Step 2 — Check for keyword cannibalization

Two or more pages effectively targeting the same primary keyword splits ranking signal instead of
concentrating it. Resolve by differentiating the pages' actual angle/intent, or consolidating into one
stronger page with a redirect from the other.

## Step 3 — Confirm search-intent match

Every page's content type must match its target query's actual intent:
- **Informational** ("how does X work") → explanatory content.
- **Commercial investigation** ("best X," "X vs Y") → comparison-oriented content.
- **Transactional** ("buy X," "X near me") → action-oriented, low-friction content.
- **Navigational** (looking for a known page/brand) → make sure that exact page is easy to find.

A mismatch here is a ranking ceiling — no amount of title/meta/header polish fixes a page answering the
wrong kind of question for its target query.

## On-Page Elements

**Title tags**: primary keyword near the front, phrased how a US searcher would recognize it, under
~60 characters, written to earn the click (an ad for the page, not a label), unique sitewide — scan
programmatically for duplicates, don't spot-check. Practical tip: look at what's already ranking for
the target keyword before finalizing — Google generally has limited patience for highly unconventional
title formats on competitive terms, so a clear, front-loaded title tends to outperform a clever one.

**Meta descriptions**: genuinely descriptive, includes the primary keyword naturally, 150-165
characters, unique per page. Note honestly: Google frequently rewrites the displayed snippet from
on-page content (often from a clear heading structure) regardless of what's in the meta description —
write a good one anyway, but don't treat it as guaranteed to display verbatim.

**Headers**: exactly one H1 per page matching primary keyword intent (not necessarily identical text to
the title tag); logical H2/H3 hierarchy with no skipped levels; secondary keywords in H2/H3 only where
it fits naturally; question-phrased headers where the content answers a question (this feeds directly
into `08-geo-aeo-structural-patterns.md`). Favor clear, literal headings over clever/branded ones on any page where
ranking matters — a reader (and Google) should be able to understand the page's content by skimming
headings alone; save wordplay for places where ranking isn't the goal.

**Keyword placement checklist** (practical convention, not an official Google requirement, but
widely-observed good practice): primary keyword present in the title tag, meta description, at least
one or two H2s where it fits naturally, the URL slug, image file names for genuinely relevant images,
and naturally within the body — never forced into every location if it reads unnaturally anywhere.

**Body content**: depth determined by what's needed to fully answer the query, not a fixed word-count
target — a complete 400-word answer beats a padded 1200-word one. Content should genuinely satisfy the
reader without needing to click back and try another result. A genuinely thorough FAQ section is a
legitimate way to add real depth to an otherwise-concise page (see `06-schema-structured-data.md`)
— this is depth through real additional value, not padding.

**Internal and external linking** (practical convention): aim for a genuinely relevant handful of
internal links to the page from other related pages (roughly 3 is a reasonable practical target, not a
strict rule), and 1-3 external links out to relevant, trusted, authoritative sources where genuinely
useful to the reader — external links to real authority sources are themselves a minor trust signal, not
just an internal-linking exercise.

**Meaningful visuals**: images should illustrate the actual concept, not be generic stock filler — check
what images are already appearing in the real SERP for the target query (screenshots, diagrams,
comparison charts) to understand what searchers and Google already expect for that query type, and align
with it rather than guessing.

**Table of contents with jump links**: for longer guide/reference pages, a real table of contents with
in-page anchor links improves skimmability and is a legitimate way to become eligible for Google
building sitelinks or an expanded snippet directly from it — implement with genuine `id` attributes on
headings and real anchor links, not a decorative-only list.

**URLs**: short, keyword-relevant slugs; no unnecessary parameters on canonical/indexable URLs;
consistent formatting sitewide (hyphens not underscores, consistent casing and trailing-slash
convention).

## The Anti-Stuffing Rule (concrete, checkable, non-negotiable)

**No exact-match keyword phrase should repeat more than roughly once per 150 words of body copy.** If
you find or write anything denser than that, rewrite it in natural language. This is treated as a real
ranking risk and Search Essentials violation category (see
`01-spam-policies-and-troubleshooting.md`), not a stylistic nicety. When in doubt, favor
natural variation (synonyms, related terms, natural phrasing) over exact-match repetition — semantic
relevance from varied, natural language outperforms forced repetition.

## Optional: video for how-to/tutorial-shaped keywords

For queries where video results are already documented to dominate the SERP (how-to and tutorial-shaped
searches especially), text content alone may be structurally capped in how high it can rank regardless
of quality — check the real SERP for the target query first. If video results are prominent there,
producing accompanying video content is a legitimate situational tactic, not a universal requirement —
**[Optional]**, apply only where the real SERP evidence supports it.

## Evidence to produce for this phase

A keyword map table (`Page URL | Primary Keyword | Secondary Keywords | Search Intent | Match Quality`),
the actual before/after of title/meta/H1 for a representative sample (or every page if the count is
small), and the result of a sitewide duplicate-title/duplicate-meta scan.
