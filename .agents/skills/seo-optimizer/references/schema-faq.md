# FAQ & Structured Data (Schema Markup)

## The FAQ rule

Every content-bearing indexable page should have a genuine, page-specific FAQ section — this is one of the highest-leverage, lowest-cost SEO investments available, because it directly feeds both traditional featured snippets and AI answer engines (see `references/aeo-geo.md`).

- **3-6 questions per page**, phrased exactly as a real US searcher would type or speak them — not abstract restatements ("Methodology Considerations" is not a question; "How accurate is this test?" is).
- **Every FAQ must be specific to that page's actual content.** If you find identical or near-identical FAQ blocks copy-pasted across multiple pages, that's a real problem worth fixing, not a shortcut worth keeping — rewrite each to be genuinely specific, even if several pages cover related ground.
- **Direct-answer-first**: the answer's first 1-2 sentences directly answer the question; supporting detail follows. This exact structure is what gets extracted into a featured snippet or an AI-generated answer box.

## FAQPage Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Exact question text as a real user would ask it",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Direct answer in the first sentence, followed by supporting detail if useful."
      }
    }
  ]
}
```

Repeat the object inside `mainEntity` for each FAQ pair. Validate this against a schema testing tool before considering the phase complete — a syntactically invalid block is worse than no block, since it can trigger manual-action-style warnings in Search Console (even though this skill doesn't configure Search Console itself, invalid schema is still a real risk worth avoiding).

## Article Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page title",
  "author": {
    "@type": "Person",
    "name": "Real name, not a placeholder"
  },
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "description": "Same as or consistent with the meta description"
}
```

Do not leave `author` as a placeholder or omit it — a blank or fake author field is a real E-E-A-T weakness (see `references/content-eeat.md`), not just a schema-completeness checkbox.

## BreadcrumbList Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "https://example.com/category/" },
    { "@type": "ListItem", "position": 3, "name": "Current Page", "item": "https://example.com/category/page/" }
  ]
}
```

## Other Common Schema Types — use only where genuinely applicable

- `Product` — only for actual product pages with real price/availability data.
- `SoftwareApplication` / `Quiz` / `Game` — for interactive tools, quizzes, or app-like pages, where it validates cleanly for that content type.
- `Organization` / `WebSite` — site-level, typically on the homepage, establishing the brand entity.
- `AggregateRating` / `Review` — **only if real reviews or ratings actually exist on the page.** Marking up ratings that don't exist is a real, penalizable form of schema abuse — never add this speculatively.

## Evidence to produce for this phase

For each unique page template: which schema type(s) were added or verified, the actual JSON-LD block, and confirmation it validates. For the FAQ rule: a scan result confirming no duplicate FAQ blocks exist across pages, and a sample of 2-3 actual FAQ entries per page type showing they're genuinely page-specific.
