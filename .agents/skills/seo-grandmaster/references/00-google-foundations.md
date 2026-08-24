# Google Foundations — the constitution

Everything else in this skill gets checked against this file. It's a synthesis of Google's own
Search Central documentation: the SEO Starter Guide, Search Essentials, the spam policies, the
helpful-content guidance, and Google's guidance on generative-AI content and AI-features
optimization. Where a rule below is directly attributable to Google, it's marked **[Google-stated]**.
Where it's Google's own explicit myth-busting of common SEO folklore, it's marked **[Google myth-bust]**.

## How discovery actually works

- Google finds new pages almost entirely through crawling links from pages it already knows about.
  Submitting a sitemap is optional and doesn't replace having real links (internal or external)
  pointing at a page — **[Google-stated]**. For a SaaS product, this means orphaned pages (built but
  linked from nowhere on the site) are functionally invisible no matter how well-written they are.
- Google's crawler needs to see the same thing a browser does. If a page depends on client-side
  JavaScript to render its primary content, and that rendering fails or times out for the crawler, the
  page can be indexed effectively empty. This is a common, silent failure mode for SaaS marketing
  sites built on the same JS framework as the app. Verify with the URL Inspection tool in Search
  Console — **[Google-stated]**.
- There is no such thing as a manual penalty for having the "same content on two URLs" by accident.
  Google will pick a canonical version itself if you don't specify one. It's inefficient, not
  penalized — **[Google myth-bust]**. Don't let fear of an imaginary duplicate-content penalty drive
  decisions; do fix it because unmanaged duplicates waste crawl budget and confuse which URL
  accumulates authority.

## What actually gets rewarded (the helpful-content standard)

- Google's ranking systems are built around one practical test for every page: *would a person reading
  this feel like they got what they needed, or would they go back and search again?* — **[Google-stated]**.
  This standard is evaluated site-wide, not purely page-by-page: a meaningful amount of unhelpful,
  thin, or search-engine-first content on a domain can suppress the ranking potential of the genuinely
  good content on that same domain. This is why a SaaS blog padded with 40 low-effort posts can hurt
  the 10 genuinely excellent ones.
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is **not itself a ranking
  factor** — it's the framework Google's human quality raters use to evaluate whether content meets
  the helpful-content bar, and it shapes how the automated ranking systems are trained and calibrated
  — **[Google myth-bust + Google-stated]**. Practically: don't chase "E-E-A-T signals" as a checklist
  (author bio, credentials badge) disconnected from the content actually being written by someone with
  real, demonstrable knowledge of the subject. The signal is downstream of the substance, not a
  substitute for it.
- Content quality is judged independent of *how* it was produced. Automation, including AI, has always
  been an acceptable way to produce helpful content (transcripts, scores, structured data-driven
  pages) — the line is whether the *primary purpose* is manipulating rankings rather than helping
  users — **[Google-stated]**.

## The spam policies that actually gate scaled/automated content — read this before any programmatic-SEO plan

These are named, current Google spam policies, not folklore. Anything that matches these patterns is
**Avoid**, full stop:

- **Scaled content abuse**: generating many pages — via AI, scraping, or template-and-swap — where
  little or no distinct value is added per page; stitching/combining content from other pages without
  adding value; creating pages that exist mainly to contain search keywords rather than to help a
  reader. This is explicitly stated to apply *regardless of whether automation, humans, or a mix
  produced the content* — a human writing 5,000 near-identical thin pages is judged the same as a
  script doing it — **[Google-stated]**.
- **Site reputation abuse**: hosting third-party content (including white-label/licensed content) on
  a site specifically to exploit that site's existing ranking authority, even with full first-party
  editorial involvement. Relevant if a SaaS company considers a "sponsored guide" arrangement or
  syndicated content deal that trades on the host's authority — **[Google-stated]**.
- **Expired domain abuse**: buying an expired domain for its existing authority and repurposing it
  with unrelated content to manipulate rankings — **[Google-stated]**.
- Google has explicitly warned against creating separate near-duplicate pages to cover "every possible
  query variation" (fan-out queries) *primarily to manipulate rankings or AI responses* — and adds that
  this is also just an ineffective long-term strategy, since page count alone doesn't signal quality or
  relevance to Google's current systems — **[Google-stated]**. This is the single most important line
  in this entire file for any SaaS team eyeing programmatic SEO: the multiplier has to come from real,
  distinct underlying data (real integrations, real use cases, real customer segments), never from
  swapping one variable in an otherwise-identical template.
- **AI-response manipulation is now spam by the same rules as ranking manipulation.** On May 15, 2026,
  Google updated its Search spam policies' own top-level definition of spam to explicitly add
  "attempting to manipulate generative AI responses in Google Search" alongside the existing "attempting
  to manipulate Search systems into ranking content highly." Reporting on the change (Search Engine
  Land, Search Engine Roundtable, and others, citing Google's own Search Central documentation) names
  the newly-covered tactics as things like biased/rigged comparison listicles built specifically to be
  cited by AI Overviews or AI Mode, and other "recommendation poisoning" attempts aimed at those
  surfaces — **[Google-stated, dated May 15, 2026 — after this skill's base training data, verify the
  live spam-policies page if this matters to a launch decision]**. Practically: every GEO/AEO tactic in
  `08-geo-aeo-structural-patterns.md` and `09-geo-aeo-ai-search-strategy.md` was already written to the
  "genuinely help the reader, structure honestly" standard, so nothing in this skill needs to change —
  but any AI-visibility tactic that only makes sense as a way to game an AI Overview citation rather than
  to genuinely inform a reader is now **Avoid** on the same explicit footing as classic ranking spam,
  not just a gray area.

## SERP appearance and on-page basics — what's real, what's myth

- **[Google-stated]**: Title tags and meta descriptions genuinely influence the title link and snippet
  shown in results; write them unique per page, clear, and accurate to the page's actual content.
  Anchor text on internal and external links should describe the destination, so both users and Google
  understand what's being linked to before clicking.
- **[Google-stated]**: Outbound links to sources you don't fully vouch for, and any link inside
  user-generated content (comments, forum posts), should carry `nofollow` (or `ugc`/`sponsored` as
  appropriate) so the site isn't implicitly vouching for content it didn't create.
- **[Google myth-bust]**: The meta keywords tag is not used by Google at all — don't spend time on it.
- **[Google myth-bust]**: Keywords in a domain name or URL path have "hardly any effect" on ranking
  beyond showing up in the visible breadcrumb — registering exact-match-keyword domains is not a
  meaningful SEO lever.
- **[Google myth-bust]**: There is no minimum or maximum content-length target. Length itself is not a
  ranking factor; the correlation some tools show between longer content and better rankings is
  because longer, naturally-written content tends to cover more real subtopics — the coverage is what
  helps, not the word count.
- **[Google myth-bust]**: Heading order (H1 → H2 → H3 strictly nested) doesn't affect ranking. It
  matters for accessibility (screen readers) and for Claude/humans skimming structure — do it for
  those reasons, not because Google's algorithm cares about heading hierarchy per se.
- **[Google myth-bust]**: PageRank (link-based authority) is one signal among hundreds Google uses now
  — not the dominant factor it was in the early 2000s. Don't over-index a strategy purely on
  link-volume chasing.

## Images, video, and promotion

- **[Google-stated]**: Place images near the text that gives them context, and write alt text that
  describes the actual relationship between the image and the surrounding content — this is both an
  accessibility requirement and a discovery signal for Google Images.
- **[Google-stated]**: Video content benefits from a standalone page, near relevant text, with
  descriptive titles and descriptions — the same title-writing principles apply as for text pages.
- **[Google-stated]**: Promotion (social, community engagement, word of mouth, newsletters, offline)
  is explicitly endorsed as a legitimate way to help both users and Google discover new content — but
  Google also explicitly warns that *over*-promotion can read as manipulation both to audiences (who
  disengage) and to Google's systems. There's no bright line given; the practical read is that
  promotion should always be secondary to something genuinely worth promoting, not a substitute for it.

## Generative AI content — the actual Google position

- **[Google-stated]**: Using AI to help write content is not, by itself, against any policy. The
  violation is producing content *at scale* with the primary purpose of manipulating rankings, with
  little added value per page — see Scaled Content Abuse above. A human editing and fact-checking every
  AI-assisted page, adding real examples and verifying claims, is on the right side of this line; a
  pipeline that publishes AI output unreviewed at volume is not.
- For e-commerce specifically, Google Merchant Center requires AI-generated product images and
  AI-generated title/description fields to carry disclosure metadata — relevant if a SaaS product has
  any e-commerce or marketplace component.

## What this means in practice for a SaaS content operation

Read literally, these rules add up to a simple operating model: **write for the specific person who
typed the query, make sure Google can technically see what you wrote, earn links because the content
deserved them, and never let the page count outrun the amount of genuinely distinct value on the
site.** Every tactic in `10-growth-tactics-ice-playbook.md` is checked against this model before it's
allowed to carry a "Consistent with Google" tag.
