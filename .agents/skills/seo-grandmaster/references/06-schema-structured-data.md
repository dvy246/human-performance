# Schema & Structured Data

Structured data doesn't directly boost rankings on its own, but it's how a page becomes eligible for
rich results, and it's a real signal search engines and AI answer engines use to understand entities
and content type correctly. Every schema block must describe something genuinely true on the page —
fabricated structured data is a real policy risk, covered as a hard rule below.

## Site-level schema (every site needs this)

- **`Organization`/`WebSite`** on the homepage — real brand name, real logo URL, real `sameAs` links to
  actual owned social/profile URLs (verify each one actually resolves, don't add placeholders).
- **`BreadcrumbList`** on any page more than one level deep, matching the actual visible/navigable
  breadcrumb trail exactly.

## Content-type-specific schema

Use the most specific applicable type, not a generic fallback:
- Reference/guide content → `Article` or `LearningResource`.
- Interactive tools/apps → `WebApplication` or `SoftwareApplication`, only where genuinely applicable.
- Step-by-step content → `HowTo`.
- Product/pricing pages → `Product` with real price/availability data — never placeholder pricing.

## FAQ schema (high-leverage, low-cost — prioritize this)

- 3-6 genuinely page-specific questions per page — never a duplicated FAQ block copy-pasted across
  multiple pages, which both dilutes uniqueness and risks a search engine picking an unintended page to
  show for a given question.
- Direct-answer-first: the answer text should lead with the actual answer in the first sentence, with
  supporting detail after (this is the same structural pattern that helps in `08-geo-aeo-structural-patterns.md`).
- Questions phrased the way a real person would actually type or ask them — not an artificially
  keyword-stuffed question form.

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Real question, naturally phrased]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Direct answer first, 1-2 sentences, then supporting detail if needed]"
      }
    }
  ]
}
```

## Validation (non-negotiable)

- Every schema block must be syntactically valid JSON-LD — parse it, don't eyeball it.
- Run every unique page template through Google's Rich Results Test at least once — a schema block that
  "looks right" but fails validation is worse than no schema at all, since it risks a Search Console
  warning.
- Every `sameAs`, `url`, or `@id` field must resolve to the real production domain — check specifically
  for leftover placeholder values (`example.com`, `[DOMAIN]`, `localhost`) the same way the pre-launch
  indexing audit checks canonical tags.

## Hard rule: no fabricated structured data

Never add:
- An `AggregateRating` or `Review` with no real reviews behind it.
- A fake or templated `author` name/credential.
- Any field describing information the page doesn't genuinely contain.

This isn't just a missed-opportunity issue — Google treats fabricated structured data as a real spam
signal, and it can trigger a manual action. If the real data doesn't exist yet, leave that schema field
out entirely rather than inventing a plausible-looking value.

## Evidence to produce for this phase

The actual JSON-LD block per page type, the actual Rich Results Test result (pass/fail with any errors
shown), and confirmation that every external URL referenced in schema was checked and resolves.
