# Pre-Launch Technical Indexing Audit

**Purpose:** guarantee crawlability and indexability before launch. Nothing else in this skill matters
if Google can't crawl and index the page in the first place — run this first, and treat every item
below as launch-blocking until proven otherwise. Report every issue found with exact file paths and a
clear fix plan, not a general description.

## 1. Sitemap & Canonical URL Alignment

- Fetch the sitemap (static or dynamically generated) and list every URL in it.
- For each sitemap URL, fetch the page and check its `<link rel="canonical">` tag.
- **If any sitemap URL's canonical tag points to a different URL**, that's a canonical-consolidation
  signal telling Google the sitemap URL isn't the "real" one — exclude the non-canonical URL from the
  sitemap and keep only the URL it actually canonicalizes to.
- Cross-check the reverse direction too: every canonical target that pages actually point to should
  itself appear in the sitemap (a canonical target missing from the sitemap is a discoverability gap).

**Report format:** `[sitemap URL] → canonical points to [different URL] → ACTION: remove from sitemap,
verify [canonical target] is present instead.`

## 2. Redirects vs. Active Routes

- Locate the actual routing/redirect configuration file for this stack (`astro.config.mjs`,
  `next.config.js`, `vercel.json`, `_redirects`, `netlify.toml`, or equivalent — find the real one in
  this codebase, don't assume a framework default).
- Cross-reference every redirect rule against the sitemap and the site's live navigation.
- **No sitemap URL, and no page reachable from primary navigation, should be a redirect source.** A
  redirect should only exist for a legacy path, a deleted page, or an intentional short URL — never for
  a URL that's currently being actively linked to or listed as canonical.
- If a redirect source and a sitemap/nav target collide, that's a real bug: either the sitemap/nav is
  pointing at a stale URL that should be updated to the final destination, or the redirect rule is
  accidentally intercepting a URL that should be live.

**Report format:** `[redirect rule, exact file + line] redirects [source] → [destination], but [source]
is also: [in the sitemap / linked from nav] → ACTION: [update the link to point directly at the
destination / remove the erroneous redirect rule].`

## 3. Canonical Tag Verification

- Check every page template/layout file that renders a canonical tag (and any JSON-LD schema block
  that includes a URL field).
- **The canonical URL must match the actual live production URL of that page** — not a relative path
  that could resolve incorrectly, not a hardcoded example.
- **Search specifically for placeholder values** left over from scaffolding or templates: `[DOMAIN]`,
  `example.com`, `localhost`, `yoursite.com`, or any other obvious placeholder — in canonical tags, Open
  Graph URLs, and JSON-LD `url`/`@id` fields. A single placeholder domain shipped to production silently
  breaks canonicalization and entity resolution for every page using that template.

**Report format:** `[template file path] — canonical/schema URL field contains [placeholder value] →
ACTION: replace with the real production domain, verify across every page instance using this template.`

## 4. Indexation Blockers

- Check every production header configuration (`_headers`, `netlify.toml`, hosting platform settings,
  middleware) for `X-Robots-Tag: noindex` or equivalent.
- **This header should never apply to the main production domain.** If a `noindex` header exists, it
  should be scoped specifically to a preview/staging subdomain (e.g., a `*.pages.dev` or
  `*.vercel.app` preview deployment) — never to the real, live, customer-facing domain.
- Fetch `robots.txt` and confirm: it's correctly formatted, it doesn't contain an overly broad
  `Disallow` left over from a staging environment, and its `Sitemap:` directive points to the exact,
  correct, live sitemap URL (not a relative path that could resolve wrong, not a stale path from a
  prior sitemap location).

**Report format:** `[config file path] — [noindex header / robots.txt issue found] applies to
[production domain / scope] → ACTION: [scope restriction / correction], with the exact corrected
config shown.`

## Final output for this phase

A table: `File Path | Issue Found | Exact Evidence | Severity | Fix`. Severity should default to
**Critical** for every item in this file — a genuine indexing blocker is not a medium-priority
polish item, it's the difference between existing in search results and not existing at all.

Do not close this phase with "looks fine" from a visual skim — every check above requires an actual
fetch, an actual file read, or an actual header inspection. If you couldn't check something (e.g., no
access to the hosting platform's header configuration), say so explicitly rather than assuming it's
fine.
