# Live URL Audit + Downloadable Client Report (SEO / GEO / AEO)

Use this workflow when the person hands you a live URL or domain and wants a full audit **plus** a
polished, downloadable report — not just an in-chat answer. It fetches the real site, scores it across
SEO, GEO, and AEO, and produces a client-ready deliverable. Pairs with `16-full-site-audit-checklist.md`
(which is the deeper, phase-by-phase mechanics this file's scoring draws on) but is self-contained for
the specific job of "audit this URL and give me something I can hand to a client or stakeholder."

## Step 1 — Confirm scope before fetching anything

Ask: **"Would you like a Quick Audit (top priority issues and scores, 1-2 minutes) or a Full Audit
(comprehensive analysis across all dimensions, 5-10 minutes)?"** Skip this only if the request already
states it unambiguously ("do a full audit of...", "quick audit please").

## Step 2 — Fetch and collect data

Never assume what a site does or doesn't have until you've actually looked — a page can't be flagged
"missing" unless its absence has been confirmed by fetching.

**Homepage + discovery**: fetch the URL for full raw HTML (meta tags, schema, headings, nav, body).
From it, map the real site structure — About, Team, Services, Case Studies, Blog, FAQ, Contact, etc.
Fetch `{domain}/robots.txt` and `{domain}/sitemap.xml` in parallel to confirm crawl directives and pages
that exist even if absent from nav.

**Key pages**: prioritize About/Team (E-E-A-T signals), Services/Work (content depth), Case
Studies/Portfolio (trust signals), Blog/Resources (content strategy, AEO potential), Contact (NAP data),
FAQ (AEO signals).

- **Quick Audit**: homepage plus up to 6 high-signal pages.
- **Full Audit**: crawl as many meaningful pages as exist, no arbitrary cap — work the priority order
  above, then individual service/product pages, then everything else discovered via sitemap or internal
  links that appears content-rich. Skip only pages with no real signal: Privacy Policy, Terms, login/
  account pages, thank-you pages, and paginated archives beyond page 2.

If the primary URL fails to load, tell the person, confirm the URL is publicly accessible, and offer a
framework audit (general recommendations without live evidence) as a fallback. If secondary pages fail,
note it and continue with what's available — an incomplete audit beats no audit.

If the Bright Data connector is available (see `18-live-data-brightdata-bridge.md`), prefer it for this
fetch step — it renders JavaScript, so JS-injected schema (Yoast, RankMath, AIOSEO, Next.js) and
client-side canonical/hreflang tags become visible in a way plain HTML fetching can't detect.

## Step 3 — Analyze the signals

Base every conclusion on everything actually fetched, not just the homepage. Never flag something as
"missing" if it was found on another page during the crawl.

**SEO signals** — technical on-page (title/meta length and presence, heading hierarchy, URL structure,
canonical, robots meta, viewport, alt text, internal links, Open Graph/Twitter Card), content quality
(depth relative to the query, freshness signals, readability), structured data (schema types present,
syntactic validity). Full mechanics in `02-technical-seo-audit.md`, `05-keyword-onpage-strategy.md`, and
`06-schema-structured-data.md`.

**GEO signals** (Generative Engine Optimization — Perplexity, ChatGPT Search, AI Overviews, Gemini) —
E-E-A-T signals (named authors, About page depth, contact info, trust signals, Organization schema),
content for AI synthesis (factual density, clear up-front claims, source citations, comprehensiveness,
entity clarity), technical GEO (rich schema types, HTTPS, clean crawlability, `sameAs` entity links).
Full mechanics in `07-eeat-content-quality.md` and `08-geo-aeo-structural-patterns.md`.

**AEO signals** (Answer Engine Optimization — featured snippets, PAA, voice search) — direct-answer
paragraphs under question headers, definition patterns, list/table content, FAQ and HowTo schema,
question-phrased headings, Speakable schema, conversational/long-tail phrasing, local NAP signals where
relevant. Full mechanics in `08-geo-aeo-structural-patterns.md`.

## Step 4 — Score and give a brief in-chat recap

Score each dimension 1-10: 1-3 critical/likely-invisible, 4-5 below average, 6-7 decent foundation,
8-9 strong, 10 exemplary. Keep the in-chat response brief — orient the person while the document
generates, don't write the full report twice:

```
## [Site Name] — [Quick/Full] SEO/GEO/AEO Audit
Pages reviewed: [count and list]   Audit date: [date]

| Dimension | Score | Status |
|---|---|---|
| SEO | X/10 | Needs Work / On Track / Strong |
| GEO | X/10 | ... |
| AEO | X/10 | ... |

Top 3 priorities: [one sentence each, named specifically]
Biggest strength: [one sentence, the most notable thing working well]

Full findings, signal-by-signal analysis, and the priority recommendations matrix are in the report below.
```

## Step 5 — Generate the downloadable report

Immediately after the recap, produce the full report as a `.docx` (and `.pdf` if requested) — don't ask
first, just produce it, and say "Generating your downloadable report now..."

**Read `/mnt/skills/public/docx/SKILL.md` before building the document** — it has the current,
correct method for constructing and validating a `.docx` in this environment; don't hand-roll the
document-building code from memory, since the right library calls and validation steps live there.

**Report design system** (carry this into whatever construction method the docx skill specifies):
- Color palette: navy `1B2A4A` (headers/cover), accent blue `2563EB`, score green `16A34A` (8-10),
  score amber `D97706` (5-7), score red `DC2626` (1-4), light section background `EFF6FF`, alternating
  table-row gray `F8F9FA`, borders `E2E8F0`, dark text `1E293B`.
- Typography: a clean sans-serif throughout — title ~36pt bold, H1 ~24pt bold, H2 ~18pt bold, H3 ~14pt
  bold, body ~11pt, footer ~9pt.
- Page setup: US Letter, 1-inch margins.

**Report structure, in order:**
1. Cover page — site domain as the hero element, "SEO / GEO / AEO Audit Report" subtitle, audit type,
   a 3-column score summary table (SEO/GEO/AEO) color-coded by score band.
2. Executive summary — a short shaded callout (3-5 sentences: what's strong, the most urgent issue, one
   key opportunity, specific to this site) plus the scores table with a one-line takeaway per dimension.
3. Pages audited — table of every URL fetched, page type, and a short note per page.
4. SEO analysis — sub-sectioned Technical On-Page / Content Quality / Structured Data, each finding as
   Signal | Finding | Status (color-coded Good/Needs Attention/Missing).
5. GEO analysis — same structure: E-E-A-T Assessment / Content for AI Synthesis / Technical GEO.
6. AEO analysis — same structure: Featured Snippet Eligibility / Structured Answer Formats / Voice
   Search Readiness.
7. Priority recommendations matrix — Priority | Issue | Dimension | Effort | Impact, color-coded by
   priority (Critical/High/Medium/Quick Win).
8. What's working well — genuine strengths with specific evidence from the crawl.
9. Glossary (Full Audit only) — brief plain-English definitions of SEO/GEO/AEO for anyone unfamiliar.

Header/footer on every page except the cover: site domain and "SEO / GEO / AEO Audit Report" in the
header; page number in the footer. Use a neutral footer line (e.g. the person's own name or brand, or
none at all) rather than any third-party skill-author attribution.

Save the output to `/mnt/user-data/outputs/` with a filename like `seo-audit-example-com-2026-08-13.docx`
(domain with hyphens, ISO date), and use `present_files` to hand it to the person once built.

## Step 6 — Invite next steps

"Would you like me to go deeper on any specific area? I can also audit additional pages, compare this
site against a competitor's URL, or re-run the audit after changes are made."

## Important principles

- **Audit the whole site, not just the starting URL.** "Add a Team page" is only a valid recommendation
  if a Team page genuinely doesn't exist anywhere on the site — confirm that by actually crawling before
  suggesting it.
- **Be specific, not generic.** Every finding references something actually observed. Quote real text
  when it illustrates the point; name the actual page with the issue.
- **Be honest about what can't be assessed from HTML alone** — Core Web Vitals field data, true mobile
  rendering, backlink profile, and domain authority need PageSpeed Insights, Search Console, or a
  backlink tool respectively. Name the right tool rather than guessing a number.
- **Calibrate tone to the findings.** Don't manufacture problems on a genuinely solid site; don't soften
  urgency on a genuinely broken one.
- **GEO and AEO are still-emerging disciplines** — if the audience seems unfamiliar with the terms, a
  sentence or two of plain-English framing goes a long way before diving into findings.
- **Make the report earn its download.** It should read like something an agency would charge for, not
  a printout of the chat — specific evidence, genuinely informative tables, real design polish.
