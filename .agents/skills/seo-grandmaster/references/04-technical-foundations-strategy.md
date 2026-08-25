# Technical Foundations

Technical SEO serves lever 1 only (can Google find and render the page) — but lever 1 is a hard gate,
not a scoring factor. A page with perfect content that fails lever 1 ranks nowhere. This file covers
the technical issues specific to SaaS marketing sites; for a full live-site technical audit, hand off to
`02-technical-seo-audit.md` and `03-pre-launch-indexing-audit.md`, or `17-live-audit-report-builder.md`
if a real URL needs to be fetched and inspected directly. This file exists to inform planning decisions
before or alongside that audit, not to replace it.

## The SaaS-specific crawlability trap: client-side rendering

Most SaaS marketing sites are built with the same framework as the product app (React, Vue, etc.).
This creates a specific, common failure: if the marketing pages render their primary content via
client-side JavaScript rather than server-side/static rendering, Google's crawler may see an
effectively empty page, or may render it with significant delay that costs indexing priority.

**Recommendation Card**
**Evidence tier:** Supported by Google
**Lever(s):** 1
**Expected impact:** Binary and severe if broken — a page that fails to render for the crawler doesn't
rank at all, regardless of content quality. Fixing it can take a page from zero visibility to full
eligibility.
**Implementation effort:** Medium-to-high if the site needs to move to server-side rendering or static
generation (Next.js, Astro, or similar) after being built client-side-only; low if this was decided
correctly at build time.
**ICE:** Impact 10 / Confidence 9 / Ease 3 → **7.3** (low Ease reflects real migration cost, but this
is worth doing regardless of the score — it's a gate, not a normal tradeoff)
**Supporting evidence:** Directly stated in Google's documentation on how Google discovers, crawls, and
renders pages — the crawler needs to see substantially the same thing a user's browser does.
**Confidence level:** High.
**Potential risks:** None from fixing it; the risk is entirely in not fixing it and not knowing.
**YMYL suitability:** N/A.
**Why (first principles):** This is lever 1 in its purest form — verify with the URL Inspection tool in
Search Console before assuming either way.

## Core Web Vitals — the honest weight, not the hype

Google's own John Mueller has repeatedly and directly addressed how much Core Web Vitals (LCP, INP,
CLS) actually move rankings: it is a real ranking signal and more than a pure tie-breaker, but it does
not replace relevance, and Google has explicitly said not to expect a large ranking swing purely from
fixing Core Web Vitals scores, and that most small/local/early-stage sites shouldn't put it at the top
of their priority list.

**Recommendation Card**
**Evidence tier:** Supported by Google (as a real but modest ranking signal — the size of the effect is
itself Google-stated, not inferred)
**Lever(s):** 1 (indirectly — very poor performance can affect crawl efficiency), and primarily
**not** an SEO lever at all but a genuine user-experience and conversion lever, which for a SaaS trial
signup flow often matters more directly to revenue than to rankings.
**Expected impact:** Low-to-modest for rankings specifically; can be meaningful for signup conversion
rate if the site is currently genuinely slow (not just imperfect-scoring).
**Implementation effort:** Varies widely — image optimization and font-loading fixes are cheap; deep
JS bundle rework is expensive.
**ICE:** Impact 4 / Confidence 8 / Ease 6 → **6.0** for "fix it if it's clearly bad"; don't spend
significant engineering time chasing a perfect Lighthouse score once the site is in a reasonable range
— that's chasing a metric past the point Google itself says it matters.
**Supporting evidence:** Multiple direct, on-the-record statements from Google's own Search
Advocate (John Mueller) that Core Web Vitals is more than a tie-breaker but explicitly not a major
ranking lever, and that a big ranking drop purely from Core Web Vitals issues is unlikely.
**Confidence level:** High — this is one of the few tactics in the playbook backed by repeated,
consistent, on-the-record Google statements rather than inference.
**Potential risks:** The real risk here is misallocation — engineering time spent chasing marginal
Core Web Vitals gains that a founder could have spent on content or link-earning tactics with a
meaningfully higher ICE score.
**YMYL suitability:** N/A.
**Why (first principles):** Genuinely slow, broken-feeling pages fail lever 2 (a frustrated user
doesn't feel satisfied) even before touching lever 1 — treat Core Web Vitals as a UX/conversion
investment with a small SEO side-benefit, not the reverse.

## Structured data / schema markup

**Recommendation Card**
**Evidence tier:** Supported by Google for enabling specific rich results (where those rich result
types still exist — see the FAQ note below); **Experimental** for the claim that schema meaningfully
increases AI-answer-engine citation odds (plausible, actively discussed, not independently verified at
the specific multipliers vendors cite).
**Lever(s):** 1 (helps Google parse page structure/entities), 5 (plausibly helps AI engines parse
content faster, though this is not confirmed the way rich-result eligibility is)
**Expected impact:** Low-to-medium directly on rankings (schema does not itself boost ranking position)
but can materially improve click-through rate where it enables an actual rich result in the SERP.
**Implementation effort:** Low — most SaaS site frameworks and CMSs support JSON-LD schema with
modest setup.
**ICE:** Impact 5 / Confidence 6 / Ease 8 → **6.3**
**Supporting evidence:** Google's structured-data documentation directly ties specific schema types to
specific rich-result eligibility (Article, Product, HowTo, SoftwareApplication, Organization, etc.).
**Important caveat:** Google deprecated the FAQ rich result's visual snippet in Search as of May 2026 —
FAQPage schema no longer produces the expandable FAQ snippet it once did. Don't recommend FAQPage
schema on the promise of that visual result anymore; if used, frame it as a content-structuring aid
(clean Q&A format helps readability and may still assist AI-answer parsing) rather than a guaranteed
SERP-feature win. Verify current rich-result eligibility against Google's own gallery before promising
any specific visual outcome, since these deprecate and change.
**Confidence level:** High on setup/eligibility mechanics, low on any AI-citation-multiplier claim —
never repeat a specific "X times more citations" figure as settled fact.
**Potential risks:** Never fabricate schema fields that don't reflect something genuinely true on the
page (fake `AggregateRating` with no real reviews, fake author credentials) — this is both a spam-policy
risk and, for review/rating schema specifically, a Google Merchant/Search policy violation with real
enforcement history.
**YMYL suitability:** Especially important to get right on YMYL-adjacent sites — Organization, Author,
and Article schema with accurate credentials directly support the E-E-A-T evaluation that matters more
there.
**Why (first principles):** Serves lever 1 (structured parsing) and modestly lever 5; treat it as
supporting infrastructure, not a primary growth lever on its own.

## Internal linking architecture

**Recommendation Card**
**Evidence tier:** Supported by Google (Google's own site-organization guidance directly covers how
directory/URL structure and internal links help crawl-frequency understanding and topical grouping)
**Lever(s):** 1, 2, 4 (internal links pass authority from strong pages to newer/weaker ones — this is
explicitly how the "bridge asset" pattern in the link-building playbook works: external links land on
free tools/comparison pages, internal links carry that authority to money pages)
**Expected impact:** Medium, compounding — the effect is structural and shows up gradually as more
content and links accumulate.
**Implementation effort:** Low ongoing cost if built into the content process from the start (every new
page gets 2-3 contextual internal links out, and gets linked from 1-2 relevant existing pages); higher
one-time cost to retrofit a large existing site.
**ICE:** Impact 6 / Confidence 7 / Ease 6 → **6.3**
**Supporting evidence:** Directly covered in Google's site-organization documentation — directory
grouping helps Google learn update-frequency patterns, and links remain the primary discovery
mechanism for new pages.
**Confidence level:** High on the mechanism.
**Potential risks:** Over-optimized, keyword-stuffed anchor text on internal links reads as manipulative
the same way it does externally — keep anchor text natural and descriptive.
**YMYL suitability:** N/A directly.
**Why (first principles):** Directly serves lever 1 (discovery) and is the mechanism by which
externally-earned authority (lever 4) actually reaches the pages that need it (product/pricing pages,
which rarely earn external links directly).

## Canonicalization for SaaS-specific duplicate patterns

SaaS sites commonly generate duplicate/near-duplicate URLs through: marketing UTM parameters, app
sub-paths accidentally exposed to crawling, staging/preview environments left indexable, and
localized/regional pricing pages with near-identical content. None of these trigger a manual penalty
(see the myth-bust in `00-google-foundations.md`) but all of them dilute which URL accumulates
authority and waste crawl budget on a large site. Set canonical tags deliberately rather than relying
on Google's automatic selection, especially for pricing and comparison pages where the "money page"
needs to be unambiguous. For a live-site check of current canonical setup, use the
`03-pre-launch-indexing-audit.md` workflow rather than guessing from the codebase.

## Mobile usability

Mobile-first indexing means Google predominantly uses the mobile version of a page for indexing and
ranking — **[Google-stated]**, not optional or secondary. For SaaS product screenshots, embedded demo
videos, or interactive pricing calculators, verify the mobile rendering specifically rather than only
checking desktop — these are the elements most likely to break or overflow on small viewports on a
product-heavy marketing site.
