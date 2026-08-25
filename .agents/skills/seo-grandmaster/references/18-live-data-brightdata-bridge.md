# Live-Data Audits via Bright Data (When Available)

Plain `web_fetch`/`curl`-style fetching cannot see JavaScript-injected schema markup (Yoast, RankMath,
AIOSEO, Next.js), client-side-injected canonical/hreflang tags, or real parsed SERP results. If the
**Bright Data connector or CLI (`bdata`)** is connected and available in this environment, prefer it for
those specific checks — it renders the page through Bright Data's rendering layer first, so JS-injected
`<script type="application/ld+json">` blocks and client-side tag injection become visible, and
`bdata search` returns real parsed Google/Bing/Yandex results for indexation, ranking, and
cannibalization checks.

**If it isn't available**, don't block on it — run the audit with standard `web_fetch` per
`16-full-site-audit-checklist.md` or `17-live-audit-report-builder.md`, and note in the report's
Out-of-Scope section that JS-injected schema and live SERP position couldn't be independently verified
this run, naming Bright Data (or Google Search Console / Rich Results Test for schema, and manual SERP
checks for ranking) as the tool that would close that gap.

## When to reach for it

- **Mode A — single-page deep audit**: a specific URL, or "why isn't this page ranking." Covers the
  page, its `robots.txt`, its `sitemap.xml`, and the homepage if different.
- **Mode B — site-wide audit**: a domain or "audit my site." Sitemap-stratified sampling, default
  10-15 pages (the person can ask for a larger budget in plain language — "audit 30 pages").
- **SERP checks fire only on a clear signal** — a named target keyword, "why am I not ranking for X,"
  or a question about a specific page's performance. Generic "audit my site" doesn't trigger keyword-
  ranking SERP pulls. The one always-on exception: a single `site:<domain>` search as an indexation
  proxy — cheap enough to always run once per audit.

## Hard rules when using it

1. **Never claim "no schema found" without actually running the rendered check** — Bright Data already
   renders JavaScript, so there's no detection-limitation excuse for missing JS-injected schema.
2. **Every finding needs evidence** — the actual command run plus an output excerpt. No exceptions, no
   fabricated findings, ever.
3. **Anything it genuinely can't measure goes to an Out-of-Scope Notes section** with a pointer to the
   right tool: Core Web Vitals field data → PageSpeed Insights; Coverage detail → Google Search Console;
   backlinks → a dedicated backlink tool. Being explicit about limits is part of the report's honesty,
   not a weakness in it.
4. **Parallelize page fetches** rather than looping sequentially over a sampled URL list.
5. **No SERP fishing** — keyword-ranking queries only fire on an actual signal per the rule above.

## Deeper reference

If the `brightdata-plugin:seo-audit` skill/plugin is installed and enabled, its own bundled reference
files (`audit-framework.md` for the five-tier priority order, `bdata-recipes.md` for the concrete
command recipes, `site-type-playbooks.md` for SaaS/e-commerce/blog/local/multilingual specifics, and
`output-templates.md` for its report shape) are the authoritative, detailed source for exact commands —
defer to that plugin's own instructions for the mechanics rather than reproducing them here. This file
exists so the rest of this SEO skill knows *when* to reach for that plugin and what ground rules to
apply, not to duplicate its full command reference.
