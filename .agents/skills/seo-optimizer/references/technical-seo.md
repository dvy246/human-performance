# Technical SEO Foundation

The full-site technical checklist. A site can have brilliant content and still fail to rank if any of these are broken — technical issues are often invisible to a casual read-through, so verify each one directly rather than assuming.

## Crawlability & Indexation

- `robots.txt` exists, doesn't accidentally block anything it shouldn't (check for overly broad `Disallow` rules), and correctly disallows pages that genuinely shouldn't be indexed (private dashboards, admin views, thank-you/confirmation pages, internal search-result pages).
- `sitemap.xml` exists, is referenced from `robots.txt`, and is internally consistent with actual live routes — scan the whole file against the real route list, don't sample. No listed URL should 404; no live, indexable page should be missing.
- **One consistent URL format across the entire sitemap** — either every URL has a trailing slash or none do. A mix is a real, checkable inconsistency, not a nitpick — verify by scanning every entry.
- Pages that shouldn't be indexed carry a `noindex` meta tag or header, not just an absence from the sitemap (absence from the sitemap doesn't stop crawling or indexing on its own).

## Canonicalization & Duplicate Content

- Every indexable page has a self-referencing canonical tag.
- Any parameter-variant, filtered, sorted, or tracking-tagged version of a page canonicalizes to the correct primary URL — check this explicitly for any page type that supports query parameters.
- No two distinct URLs serve near-identical content without one canonicalizing to the other.

## Core Web Vitals & Performance

- **LCP (Largest Contentful Paint)**: under ~2.5s on the highest-traffic page templates — measure actual values on a representative page, not just the fastest one.
- **CLS (Cumulative Layout Shift)**: under ~0.1 — check pages with ads, embedded widgets, or late-loading content specifically, since these are the most common CLS sources.
- **INP (Interaction to Next Paint)**: under ~200ms on interactive pages.
- No render-blocking resources above the fold.
- Images properly sized and compressed; lazy-loaded below the fold.
- No unnecessary third-party scripts loaded before they're needed.

## Mobile

- Every key page template renders correctly and is fully usable on a small viewport.
- Touch targets are appropriately sized (roughly 44x44px minimum) and not so close together that mis-taps are likely.
- No horizontal scroll or content overflow on common mobile widths.

## Structured Data

- Test each **unique page template** (not every individual page — one validation per template type is sufficient if the template is consistent) using a schema validator.
- Appropriate schema type per template: `Article` for content pages, `FAQPage` where FAQs exist, `Product`/`SoftwareApplication`/`Quiz` where relevant to the site's actual content type, `BreadcrumbList` on any page with a clear hierarchy, `Organization`/`WebSite` at the site level.
- No schema markup that describes content not actually present on the page (a common, penalizable mistake — e.g., `AggregateRating` schema with no real reviews behind it).

## Links & Site Health

- No broken internal links anywhere in navigation, footer, or in-content links — check systematically, not by browsing a few pages.
- No broken external links in cited sources.
- Every indexable page is reachable within a reasonable number of clicks from the homepage (flat architecture ranks better for a new or growing site than deep nesting).
- No orphan pages — every indexable page is linked from at least one other page.

## Security & Basics

- HTTPS enforced sitewide, no mixed-content warnings (HTTP resources loaded on an HTTPS page).
- Correct HTTP status codes: 200 for live pages, proper 301 redirects for moved content (not 302 for permanent moves), real 404 (or appropriate) status for genuinely missing pages rather than a soft-404 that returns 200.

## Evidence to produce for this phase

For each item above: state what you checked, how you checked it (tool, command, or direct page inspection), and the actual result — not just "verified" with no detail.
