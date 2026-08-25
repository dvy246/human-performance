# Audit matrix

Use the matrix as a sampling and reporting aid. A check is not complete until its evidence, method, source, status, severity, fix, and confidence are recorded.

## Severity and status

| Severity | Meaning | Release effect |
|---|---|---|
| Critical | Confirmed or likely policy violation, malware/security compromise, deceptive ad/navigation behavior, copyright/scraped content, scaled low-value abuse, material YMYL harm, or blocked official-source verification. | Immediate FAIL. |
| High | Material thin/duplicate/incomplete content, broken primary flow, mobile-hostile experience, serious privacy/consent gap, widespread crawl/indexing failure, or unreliable claims. | FAIL until fixed or explicitly resolved by current evidence. |
| Medium | Important quality, trust, accessibility, performance, or technical issue that reduces user value but is not independently a policy violation. | May permit PASS WITH RISKS only if no material uncertainty remains. |
| Low | Local polish or optimization opportunity. | Does not block by itself. |

`PASS` means evidence supports the control. `FAIL` means evidence contradicts it. `NEEDS HUMAN REVIEW` means the evidence, legal interpretation, policy meaning, or site behavior is insufficiently clear. `NOT APPLICABLE` must include a reason.

## Check groups

| ID range | Group | Required checks |
|---|---|---|
| SCOPE-01..05 | Scope and sampling | Purpose, audience, monetization, countries, page classes, YMYL classification, representative coverage. |
| SRC-01..04 | Source verification | Official host, current retrieval, expected title, update/hash comparison, material-change review. |
| CONTENT-01..14 | Content quality | Originality, information gain, completeness, intent satisfaction, duplicate/scraped material, scaled/programmatic patterns, AI-assisted value, readability, accuracy, citations, bylines, first-hand experience, update integrity, user value. |
| POLICY-01..16 | AdSense/Publisher Policy | Prohibited content, restricted content, IP, deception, dangerous content, sexual content, dishonest behavior, invalid traffic incentives, ad placement, navigation, pop-ups, redirects, malware, traffic sources, UGC moderation, policy ambiguity. |
| TECH-01..18 | Technical SEO | HTTPS, status codes, canonical, robots, sitemap, indexability, crawlable links, titles, descriptions, headings, semantic HTML, redirects, pagination, hreflang, structured data, duplicate URLs, blocked assets, error handling. |
| UX-01..18 | UX and AdSense-safe UX | Navigation, mobile, accessibility, loading, LCP/INP/CLS, layout stability, visual hierarchy, ad balance, ad-label clarity, no deceptive UI, no ad overload or interference, no misleading layout, no spammy navigation, no broken/mobile-bad pages, empty states, forms, 404s. Any ad-balance or overload finding is an evidence-based conservative UX control unless a current official policy directly applies; do not invent a numeric ad limit. |
| TRUST-01..12 | Trust and privacy | About/context, contact, authors, editorial process, privacy accuracy, terms where relevant, consent, revocation, HTTPS/security, brand consistency, disclosures, YMYL safeguards. |
| RELEASE-01..05 | Final gate | Hard gate, critical blockers, source freshness, unresolved human review, decision and confidence. |

## Hard-gate tests

The following are mandatory binary release gates. Test both the site-wide pattern and representative page instances.

| Gate | Passing evidence | Failing evidence |
|---|---|---|
| Original and useful | Distinct analysis, reporting, experience, tools, data, or explanation solves the defined audience’s task. | Commodity rewriting, copied/scraped content, or pages that add no meaningful value. |
| Complete | Main task, context, limitations, next steps, and key links work for the page’s purpose. | Placeholder, empty, misleadingly incomplete, dead flow, or users must immediately search again for the answer. |
| User-first | The site has a coherent purpose and content is useful when reached directly. | Dominant purpose is ranking manipulation, ad clicks, affiliate exits, or lead capture. |
| Policy-safe | No confirmed prohibited content, deceptive practices, invalid-click incentives, unsafe behavior, or IP abuse. | Any confirmed violation, or material ambiguity that cannot be resolved. |
| UX-safe | Navigation is clear, ads do not masquerade as controls or overwhelm content, and mobile/core flows work. | Deceptive layout, materially interfering ad presentation, spammy navigation, broken pages, or mobile failure. Treat “overwhelm” as a conservative UX gate unless a current official policy directly applies. |
| Current evidence | Official sources and test artifacts are current and reproducible. | Stale, inaccessible, conflicting, or unverified evidence. |

## Conservative scoring

Scores are internal communication aids, not Google metrics, approval thresholds, or approval probabilities. Start each domain at 100 and subtract only for evidence-backed issues: Critical 35–60, High 15–30, Medium 5–14, Low 1–4, capped at zero. Apply a hard floor of 49 to the affected domain for any unresolved critical or high issue. Overall readiness is the weighted minimum of Policy 30%, Content 25%, UX 15%, Technical 10%, Trust 10%, and evidence coverage 10%; a hard-gate failure overrides every score. Risk Score is 100 minus the overall readiness score, increased by unresolved material uncertainty up to 100. Confidence reflects observed evidence coverage and source freshness, not the score.

Never convert the number into an assertion that Google will approve the site. The decision is governed by the release logic in SKILL.md.
