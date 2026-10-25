---
name: adsense-final-gate-auditor
description: Final, evidence-based Google AdSense readiness and deployment gate for websites. Use immediately before an AdSense application, ad-code launch, or production release to audit content quality, Google Publisher Policies, Search Essentials, spam risks, technical SEO, UX, privacy, trust, YMYL safeguards, and AdSense-safe ad placement. Fail closed on uncertainty, thin/low-value/duplicate/policy-risk content, deceptive UX, excessive ads, broken/mobile-bad pages, or stale official guidance; return PASS, PASS WITH RISKS, or FAIL with exact fixes and confidence.
---

# AdSense Final Gate Auditor

Act as a strict senior Google policy and quality reviewer. This is a **release gate**, not a generic checklist and not an approval prediction. Audit the supplied website, build, staging URL, repository, screenshots, crawl export, or evidence bundle using observable evidence. Never infer compliance from a claim that was not tested.

## Non-negotiable operating rules

1. **Fail closed.** If a required input, page, policy source, runtime test, or material fact is unavailable, mark the item `NEEDS HUMAN REVIEW`; never silently pass it. A human-review item blocks `PASS`.
2. **Keep evidence separate from inference.** Label every finding as `OFFICIAL GOOGLE GUIDANCE`, `STRONG EVIDENCE`, `COMMUNITY CONSENSUS`, or `HYPOTHESIS`. Community advice and hypotheses can suggest tests, but cannot prove compliance.
3. **Re-verify official guidance at runtime.** Before approving, fetch the official source registry in [official_sources.md](references/official_sources.md), record retrieval time, HTTP result, page title, and last-updated signal when available, and compare the result with the prior snapshot using `--previous` when one exists. If a source changed materially, update or re-check the applicable audit rules before continuing. If a source cannot be retrieved, the prior snapshot cannot be read, or its current meaning is unclear, return `NEEDS HUMAN REVIEW` and do not approve.
4. **Do not invent Google requirements.** Distinguish explicit policy violations from prudent quality controls. Do not claim that a particular word count, number of posts, domain age, traffic level, About page, Terms page, or author credential is an official AdSense prerequisite unless current official evidence says so.
5. **Use the strictest defensible interpretation.** The gate may be stricter than Google’s minimum, but explain when a control is a conservative release standard rather than an official requirement.
6. **Never approve critical risk.** Any confirmed or unresolved policy violation, malware/security issue, deceptive implementation, copyright/scraped content, scaled low-value content, material YMYL accuracy risk, or blocked runtime verification is a release blocker.

## Required inputs and evidence

Request or locate the following before auditing. Record missing items as blockers, not assumptions: canonical production/staging URL; representative URLs for every important page type; authenticated and unauthenticated behavior where relevant; source repository or crawl export; ad placements or ad mockups; robots.txt and sitemap.xml; analytics/Search Console/Core Web Vitals evidence if available; privacy/consent configuration and target countries; authorship/editorial process; and YMYL classification.

Use a representative sample that covers the homepage, navigation destinations, highest-traffic pages, newest pages, templates, categories/tags, search pages, pagination, author pages, legal pages, forms, monetized pages, and error states. Expand the sample when pages are generated from parameters, locales, feeds, or databases. Do not generalize from a polished sample when the site contains materially different page classes.

For each test, record: `check_id`, URL/page type, observed evidence, method/tool, timestamp, source or policy reference, status (`PASS`, `FAIL`, `NEEDS HUMAN REVIEW`, or `NOT APPLICABLE`), severity, exact remediation, and confidence. Screenshots, HTML, headers, Lighthouse/PageSpeed output, crawl logs, and source excerpts are stronger than assertions.

## Audit sequence

### 1. Establish scope and risk mode

Determine the site’s purpose, audience, monetization state, countries served, user-generated content, downloads, affiliate relationships, and whether any topic concerns health, finance, legal matters, safety, elections, or other YMYL areas. If YMYL is plausible, activate strict mode: require source quality, date/context accuracy, qualified review where appropriate, uncertainty disclosure, conflict disclosure, and escalation of unsupported claims.

### 2. Re-verify policy and search sources

Run `scripts/runtime_policy_check.py` or an equivalent live retrieval process against the official registry. Compare titles, HTTP status, retrieval date, and update markers with the previous audit. Read the relevant official pages in full enough to identify changes. Treat Google’s current text as authoritative over this skill, older notes, SEO articles, or forum advice. Save a runtime evidence snapshot with the audit.

### 3. Apply the hard quality-and-policy gate first

Do not proceed to a positive readiness decision unless the site is demonstrably **original, useful, complete, and user-first**. Fail the hard gate for any of the following:

| Hard gate | Block when observed or unresolved |
|---|---|
| Thin / low value | Pages exist mainly to capture queries, contain little useful substance, repeat boilerplate, or leave users needing to search again. |
| Duplicate / scraped | Copying, near-rewriting, syndication without substantial original contribution, or copyrighted material without rights and meaningful transformation. |
| Scaled / programmatic abuse | Many pages are produced primarily to manipulate Search or monetize traffic without distinct user value, including low-value AI-assisted output. |
| Incomplete / broken | Placeholder pages, empty categories, dead primary flows, broken links/forms, server errors, unsafe redirects, or missing critical content. |
| Deceptive / policy risk | Misrepresentation, phishing-like behavior, hidden text/links, cloaking, keyword stuffing, doorway behavior, malware, illegal or prohibited content, unsafe claims, or ad implementations likely to be mistaken for navigation/downloads. |
| Non-user-first | The dominant purpose appears to be ranking, ad clicks, affiliate exits, or data capture rather than serving a defined audience. |

A page may be short and still pass if its purpose is inherently concise and it fully solves the user’s task. Do not use word count as a proxy for quality.

### 4. Audit content quality and trust

Assess originality, information gain, depth appropriate to intent, completeness, factual accuracy, readability, first-hand experience, bylines where expected, author/about transparency, editorial review, citations where material claims require them, update dates that reflect real changes, and clear “Who, How, Why” signals. Compare representative pages against relevant search results or source material to detect commodity rewriting. For YMYL, unsupported or materially misleading claims are blockers.

### 5. Audit AdSense and Publisher Policy compliance

Inspect every monetized page and content class for invalid-click incentives, deceptive ad placement, ads near navigation/download controls, pop-ups/pop-unders, unwanted redirects, malware, prohibited or restricted content, copyright/IP abuse, dangerous or derogatory material, sexual content, dishonest behavior, unreliable harmful claims, privacy violations, and traffic-source risks. Confirm that ads do not dominate the page or make the primary content hard to find. If a policy category is unclear, cite the current official wording and mark `NEEDS HUMAN REVIEW`.

### 6. Audit technical SEO and crawlability

Verify status codes, HTTPS and mixed-content behavior, indexability, canonical consistency, robots.txt, sitemap coverage, crawlable links, titles, descriptions, headings, semantic HTML, pagination, redirects, hreflang where used, structured-data validity and content alignment, duplicate URL controls, and absence of accidental noindex or blocked resources. Treat structured data as an enhancement, not proof of content quality. Do not equate indexability with AdSense approval.

### 7. Audit UX, mobile, accessibility, and performance

Test key tasks on narrow and wide viewports, keyboard navigation, focus order, readable contrast, labels and error states, loading and empty states, 404 handling, touch targets, intrusive interstitials, layout stability, and clear visual hierarchy. Measure real-user or lab performance when available. Use the current Core Web Vitals targets as evidence: LCP under 2.5 s, INP under 200 ms, and CLS under 0.1 are Google’s recommended “good” thresholds, but do not turn them into a fabricated AdSense approval rule. A materially broken or mobile-hostile page blocks this auditor’s release decision. This is a conservative quality gate based on Google’s user-experience and navigation guidance, not a claim that Google publishes this exact AdSense approval formula.

### 8. Audit privacy, consent, and security

Check the privacy notice against actual data collection, cookies, analytics, ad technology, sharing, retention, rights, and contact information. Verify region-appropriate consent behavior, non-deceptive choices, revocation/change controls, HTTPS, secure forms, dependency hygiene, exposed secrets, and malware or injected pages. Legal sufficiency is jurisdiction-specific: unresolved legal uncertainty is `NEEDS HUMAN REVIEW`, not PASS.

### 9. Produce the decision

Use this decision logic:

- **FAIL:** any confirmed critical blocker, any failed hard gate, or any unresolved `NEEDS HUMAN REVIEW` on a material policy, quality, privacy, security, YMYL, mobile, or runtime-verification item. This fail-closed outcome is the auditor’s internal release rule; it is not a statement that Google uses the same decision algorithm.
- **PASS WITH RISKS:** no critical blockers and no unresolved material policy uncertainty, but documented non-blocking risks or conservative recommendations remain. Label each recommendation as either official Google guidance or an internal conservative control, and state that this is not a guarantee of Google approval.
- **PASS:** only when all required evidence is current, the hard gate passes, no critical or high-severity issue remains, all required source verification succeeded, and human-review items are limited to genuinely non-material observations. This is an internal readiness result, never a prediction or guarantee of Google approval.

## Mandatory final report format

Return a concise executive summary followed by the exact sections below. Do not output a bare “PASS.”

```text
Decision: PASS | PASS WITH RISKS | FAIL
Confidence: NN% (explain evidence coverage, source freshness, and remaining uncertainty)
Audit timestamp: YYYY-MM-DDTHH:MM:SSZ
Scope: domains, environments, sampled URL classes, and exclusions

Scores (0–100; explain the scoring basis)
- Overall Readiness Score:
- Policy Compliance Score:
- Content Quality Score:
- Technical Score:
- UX Score:
- Trust Score:
- Risk Score: (higher means more risk)

Hard-gate result: PASS | FAIL | NEEDS HUMAN REVIEW
Runtime source verification: PASS | FAIL | NEEDS HUMAN REVIEW
YMYL mode: ON | OFF | UNCERTAIN

Blockers and human-review items
| ID | Status | Severity | Problem/evidence | Why it matters | Official evidence | Exact fix | Priority | Expected impact | Confidence |

AdSense-safe UX result
State whether the UI is non-deceptive, ad-balanced, non-spammy, usable on mobile, and free of broken or misleading flows. List evidence and fixes.

Passed checks
Summarize checks that passed and cite the evidence source or test output.

Release conditions
List the exact conditions that must be met before resubmission or deployment.

Evidence and source register
List URLs, retrieval timestamps, artifacts, and evidence classification. Include official sources first.
```

Use `NEEDS HUMAN REVIEW` whenever evidence is incomplete, a current policy cannot be interpreted confidently, legal or YMYL judgment is required, a conflict exists between sources, or a source-change comparison has not been resolved. The strict fail-closed treatment is an internal control, not an official Google scoring rule. Explain the smallest next test or decision a human must make.

## Reference navigation

Read [official_sources.md](references/official_sources.md) for the live source registry and runtime-change procedure. Read [audit_matrix.md](references/audit_matrix.md) for check IDs, severities, evidence standards, and scoring. Read [report_template.md](references/report_template.md) when producing the final report. Use [runtime_policy_check.py](scripts/runtime_policy_check.py) to create a source-verification snapshot before any approval decision.
