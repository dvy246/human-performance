# Bad SEO Practices — The Complete Prevention List

Purpose: a single, checkable list of every practice that gets sites penalized, demoted, or de-indexed.
Cross-reference every audit and every piece of content/strategy advice against this file before it ships.
**If a recommendation matches anything below, it is automatically `Avoid` — no exception for "everyone
does it," no exception for short-term traffic, no exception because a competitor does it and ranks.**

Sourced from: [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies),
[Search Essentials](https://developers.google.com/search/docs/essentials),
[Creating Helpful, Reliable, People-First Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content),
[Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies),
[Page Experience](https://developers.google.com/search/docs/appearance/page-experience),
[Optimizing for Generative AI](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

---

## 1. Content Manipulation

- **Thin content** — pages with little to no original value: near-empty pages, auto-generated filler,
  scraped text with nothing added
- **Scaled content abuse** — bulk-generating pages (AI-assisted or not) without real, distinct value per
  page; includes synonymized/spun duplicates and stitched-together content from multiple sources
- **Doorway pages** — near-identical pages (per-city, per-keyword, per-variant) that funnel users into
  one "real" page instead of each being genuinely useful alone
- **Keyword stuffing** — unnatural repetition or listing of keywords/locations solely to manipulate
  rankings (hard line: no exact-match phrase more than ~once per 150 words of body copy)
- **Duplicate/near-duplicate content** — the same or near-same content across multiple URLs without
  canonicalization, wasting crawl budget and confusing ranking signals
- **Content that promises an answer that doesn't exist** — implying a confirmed date, price, or outcome
  that isn't actually confirmed
- **Fake freshness** — changing a "last updated" date without the underlying content substantially changing
- **AI-generated content with no disclosure and no human value-add** — undisclosed automation posing as
  original expert writing is both a spam-policy and a trust risk

## 2. Cloaking & Deceptive Delivery

- **Cloaking** — showing Googlebot different content than real users see
- **Sneaky redirects** — redirects that send users somewhere different from what was indexed/promised
  (legitimate domain moves, consolidations, and post-login routing are explicitly fine — the violation
  is *deceptive* redirection, not redirection itself)
- **Hidden text or links** — white-on-white text, off-screen CSS, zero-opacity text/links meant only for
  crawlers (legitimate accordions/tabs/tooltips where the content is genuinely present are explicitly fine)
- **Misleading functionality** — a tool/calculator that doesn't actually perform the function it claims,
  or bait-and-switches into ads/dead ends

## 3. Link Manipulation

- **Buying or selling links** that pass ranking credit, without `rel="nofollow"` / `rel="sponsored"`
- **Private blog networks (PBNs)** — networks of sites built mainly to funnel links to a target site
- **Reciprocal link exchange schemes** ("link to me and I'll link to you") run at scale for ranking
- **Excessive guest posting/article marketing** purely for links rather than genuine audience value
- **Linking to bad neighborhoods** — spammy, unrelated, or penalized sites, especially at scale
- **Site reputation abuse** — hosting third-party content mainly to borrow the domain's own ranking
  signals rather than because it fits the site's actual subject matter
- **Automated or bulk comment/forum link-dropping** (user-generated spam) with no moderation

## 4. Technical Self-Sabotage (the silent killers)

- **Sitemap/canonical mismatch** — a sitemap listing URLs whose own canonical tag points elsewhere
- **Redirect-vs-live collision** — a currently-linked or sitemap-listed URL that's also a redirect source
- **Placeholder domains shipped to production** — `[DOMAIN]`, `example.com`, `localhost` left in
  canonical tags, Open Graph URLs, or JSON-LD fields
- **Accidental `noindex`** — an `X-Robots-Tag: noindex` or `<meta name="robots" content="noindex">`
  left over from staging and applied to the live production domain
- **Broken or misconfigured robots.txt** — overly broad `Disallow` rules from staging, or a `Sitemap:`
  directive pointing to the wrong/stale location
- **Gating indexable content behind login** — Googlebot cannot authenticate, so this content is
  invisible to Search regardless of how good it is
- **JS-only navigation with no crawlable `<a href>`** — links that only work via click handlers give
  Googlebot nothing to follow

## 5. Structured Data Abuse

- **Fabricated `AggregateRating`** — schema claiming reviews/ratings that don't genuinely exist on the page
- **Fake author credentials** in `Person`/`Author` schema
- **Schema describing content not actually visible on the page** — any markup field that doesn't match
  what a user would actually see
- **Over-marking up decorative or non-existent structured content** just to try to win a rich result

## 6. Page Experience Violations

- **Intrusive interstitials** blocking access to main content (legitimate age-gates, cookie-consent, and
  one-time login walls for genuinely gated content are treated differently — the violation is blocking
  *organic content* users came for)
- **Excessive ads above the fold** interfering with or disguised as main content
- **Poor Core Web Vitals** — LCP over 2.5s, INP over 200ms, CLS over 0.1, left unaddressed
- **Non-HTTPS delivery** of any page
- **Non-responsive design** that breaks on mobile/tablet viewports

## 7. GEO/AEO Anti-Patterns (things that specifically *don't* help, per Google)

- **Creating an `llms.txt`** file expecting it to affect Google Search — Google Search ignores it
- **Artificially "chunking" content** into fragments for AI parsing — no ideal length or chunking
  requirement exists
- **Rewriting content into unnatural phrasing** to match anticipated AI queries — Google's systems
  already resolve synonyms and intent
- **Pursuing inauthentic third-party "mentions"** across blogs/forums purely as an AI-visibility tactic
- **Over-investing in structured data as an "AI-visibility hack"** — it's for rich-result eligibility,
  not a GEO lever

## 8. E-E-A-T / Trust Violations

- **No author information** where readers would expect it, especially on YMYL content
- **Undisclosed automation** — AI/automation used substantially with no disclosure of use or reasoning
- **Content written primarily to attract search traffic**, not primarily to help the intended audience
  (Google's own most-predictive question for long-term outcomes)
- **Weakening or removing existing trust content** (disclaimers, legal/safety notices) while editing for SEO
- **Loosening the bar for YMYL topics** (health, finance, safety, wellbeing) — this is the one category
  where the bar only ever tightens, never relaxes

## 9. Fabrication & Dishonesty in the Audit/Strategy Process Itself

- **Fabricating search volume, keyword difficulty, traffic estimates, Core Web Vitals scores, or a
  ranking probability** when no live tool result exists this run — say so plainly instead
- **Claiming a page was "optimized" or "verified"** without showing the specific change or evidence
- **Promising or implying a ranking outcome** — no audit, tool, or person can honestly guarantee this

---

## How this file gets used

Before finalizing any recommendation, audit finding, or piece of content produced anywhere in this
plugin, check it against this list. If a proposed tactic matches an item above:

1. **Do not recommend it, silently or otherwise** — flag it explicitly as `Avoid`
2. **Cite which category it falls under** (from the numbered sections above)
3. **Offer the closest white-hat alternative** that serves the same underlying goal, if one exists

This file is the negative-space complement to the phase checklists in `SKILL.md` — the checklists tell
you what to verify is present and correct; this file tells you what must never be introduced, no matter
how it's framed (as a "growth hack," a "quick win," or "what a competitor is already doing").
