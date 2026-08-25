# Launch Gate & Post-Launch Monitoring

Close every workflow in this skill with this file — a real verdict, and a real monitoring plan, not just
a list of findings left hanging.

## Launch Validation Gate

Before issuing any verdict:
- [ ] Every Critical item from `03-pre-launch-indexing-audit.md` is resolved with evidence, not just
      marked done.
- [ ] Every Search Essentials category from `01-spam-policies-and-troubleshooting.md` has been checked,
      not assumed clean.
- [ ] Sitemap fetched fresh and cross-checked against live routes one final time — things drift during
      the fixing process itself, so the last check should be genuinely last.
- [ ] Every schema block validated one final time across every unique template.
- [ ] A representative page from every unique template tested on both mobile and desktop.

**Issue one explicit verdict — never leave it ambiguous, and never issue it as a courtesy:**
- `SEO FOUNDATION COMPLETE — no further structural SEO work identified, with evidence for each item`, or
- `OPEN ITEMS REMAIN: [specific, prioritized list]`

If there's genuine uncertainty about whether something is clean, it isn't — mark it open and state
exactly what would need to be checked to close it.

## What this verdict does and does not mean

`SEO FOUNDATION COMPLETE` means every controllable, documented factor in this skill has been checked
and addressed with real evidence. It does **not** mean, and must never be phrased as meaning, a
guaranteed ranking outcome or a specific ranking-probability percentage — that depends on factors this
skill doesn't control (competitor behavior, algorithm changes, accumulated domain trust, real backlink
profile). Say this plainly in the final report rather than letting a clean verdict imply more than it
actually can.

## Post-Launch Monitoring Plan

| Action | Tool | Cadence | Why |
|---|---|---|---|
| Submit sitemap | Google Search Console | Immediately at launch | Confirms Google has a current map rather than relying on organic discovery alone |
| Request indexing on key pages | Search Console URL Inspection | Immediately at launch, and after any major new/changed page | Speeds up initial indexing of the pages that matter most |
| Monitor Coverage/Indexing report | Google Search Console | Weekly for the first month, monthly after | Catches crawl errors, unexpected noindex states, or sitemap drift early |
| Re-check Core Web Vitals | PageSpeed Insights / Search Console's field-data report | Monthly, and after any significant frontend change | Field data takes time to accumulate and can diverge from lab data |
| Refresh underperforming pages using real Search Console query/impression data | Google Search Console | Ongoing, once impression data exists | Real query data reveals intent mismatches and content gaps that can't be seen pre-launch. Specifically: look for queries already generating impressions but low clicks/poor position — these are validated real demand (Google already associates the page with the query) that can often be captured by adding a matching heading, FAQ entry, or dedicated section, rather than guessing at new content ideas from scratch. |
| Re-run this entire skill | This skill | After any major content, template, or IA change | A one-time pass goes stale the moment the site changes meaningfully |
| Check AI answer engine citation status | Manual search in target AI engines for key queries | Quarterly, or when a named competitor changes | A newer, faster-moving signal than traditional rankings |

## Priority triage order when multiple open items exist

1. Anything blocking indexing entirely (robots.txt, noindex, canonical pointing elsewhere) — first,
   regardless of anything else, since nothing else matters if the page can't be indexed at all.
2. Anything with real policy/trust risk (fabricated schema, thin/duplicate programmatic content,
   weakened trust content) — second, since these carry downside risk beyond just "not ranking well."
3. Remaining structural SEO items, roughly in the order the reference files are listed in `SKILL.md`,
   since each layer depends somewhat on the one before it being solid.
4. Everything else, opportunistically, whenever a related component is already being touched.
