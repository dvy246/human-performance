# Technical SEO Foundation

Covers crawlability basics not already handled in `pre-launch-indexing-audit.md`, Core Web Vitals,
mobile-friendliness, and JavaScript rendering pitfalls. A site can have excellent content and still
underperform if any of these are broken — verify each directly, never assume.

## Core Web Vitals — real thresholds, honestly framed

- **LCP (Largest Contentful Paint)**: target under ~2.5s on representative, real (not cherry-picked)
  page templates. Measure via Google PageSpeed Insights (pagespeed.web.dev) — never estimate this
  number without the real tool.
- **CLS (Cumulative Layout Shift)**: target under ~0.1. Check pages with ads, embeds, or late-loading
  content specifically — the most common source.
- **INP (Interaction to Next Paint)**: target under ~200ms on genuinely interactive pages.
- **Honest framing, not a myth**: perfect Core Web Vitals will not make thin or low-quality content
  rank well. Failing these metrics functions more as a tiebreaker against a site when competing against
  another of similar content quality — real, worth fixing, but not a substitute for the content-quality
  and E-E-A-T work in the other reference files.

## Crawlability & Rendering

- No render-blocking resources above the fold; images properly sized, compressed, and lazy-loaded below
  the fold; no unnecessary third-party scripts loading before needed.
- **JavaScript rendering pitfalls**: if primary content/headings only appear after client-side hydration
  (not present in the raw server-rendered HTML), that's a real risk — Googlebot's JS rendering is
  generally reliable per Google's own documentation, but AI/answer-engine crawlers are less consistently
  documented to execute JS the same way. Prefer static/SSR output for content-bearing pages wherever the
  framework supports it.
- Correct HTTP status codes: 200 for live pages, 301 (not 302) for permanent moves, real 404/410 for
  genuinely missing content — never a soft-404 that returns 200.

## Mobile

- Google indexes mobile-first — a template broken on mobile is effectively broken for indexing purposes,
  not just a UX inconvenience.
- Test every key page template at common mobile widths specifically (375px is a good baseline), not
  just "responsive" in the abstract. Where possible, also do a genuine manual check on a real mobile
  device, not only an automated mobile-friendliness checker — some rendering issues (font legibility,
  real tap-target feel, actual scroll behavior) only show up on real hardware.
- Touch targets ~44x44px minimum, adequately spaced.
- Zero unintentional horizontal scroll/overflow.

## Poor UX (Search Essentials category, checked concretely here)

- No intrusive interstitials blocking content on load or scroll, especially on mobile — this is
  explicitly documented by Google as a negative page-experience signal, not an inference.
- Fast perceived responsiveness ties directly back to the Core Web Vitals above.

## Evidence to produce for this phase

For each item: what was checked, how (tool/command/direct inspection), and the actual result — not
just "verified" with no detail. Any Core Web Vitals claim must cite the actual PageSpeed Insights (or
equivalent real tool) result, never an estimate.
