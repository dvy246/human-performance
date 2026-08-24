# AdSense Final Gate — Readiness & Deployment Audit

Use this immediately before an AdSense application, ad-code launch, or production release. This is a
**release gate**, not a generic checklist and not an approval prediction. Audit the supplied website,
build, staging URL, repository, screenshots, crawl export, or evidence bundle using observable evidence.
Never infer compliance from a claim that wasn't tested. Act as a strict senior policy and quality
reviewer throughout.

## Non-negotiable operating rules

1. **Fail closed.** If a required input, page, policy source, runtime test, or material fact is
   unavailable, mark the item `NEEDS HUMAN REVIEW` — never silently pass it. Any human-review item
   blocks a `PASS`.
2. **Keep evidence separate from inference.** Label every finding `OFFICIAL GOOGLE GUIDANCE`,
   `STRONG EVIDENCE`, `COMMUNITY CONSENSUS`, or `HYPOTHESIS`. Community advice and hypotheses can
   suggest tests, but can't prove compliance on their own.
3. **Re-verify official guidance at runtime.** Before approving, fetch the official source registry in
   `adsense/official_sources.md`, record retrieval time, HTTP result, page title, and last-updated
   signal when available, and compare against the prior snapshot if one exists. If a source changed
   materially, update or re-check the applicable rules before continuing. If a source can't be
   retrieved or its current meaning is unclear, return `NEEDS HUMAN REVIEW` and don't approve.
4. **Don't invent Google requirements.** Distinguish explicit policy violations from prudent quality
   controls. Don't claim a specific word count, post count, domain age, traffic level, or credential is
   an official AdSense prerequisite unless current official evidence actually says so.
5. **Use the strictest defensible interpretation**, and say so — this gate may be stricter than
   Google's stated minimum; explain when a control is a conservative release standard rather than an
   official requirement.
6. **Never approve critical risk.** Any confirmed or unresolved policy violation, malware/security
   issue, deceptive implementation, copyright/scraped content, scaled low-value content, material YMYL
   accuracy risk, or blocked runtime verification is a release blocker.

## Required inputs and evidence

Request or locate before auditing (record missing items as blockers, not assumptions): canonical
production/staging URL; representative URLs for every important page type; authenticated and
unauthenticated behavior where relevant; source repository or crawl export; ad placements or mockups;
`robots.txt` and `sitemap.xml`; analytics/Search Console/Core Web Vitals evidence if available;
privacy/consent configuration and target countries; authorship/editorial process; YMYL classification.

Sample the homepage, navigation destinations, highest-traffic pages, newest pages, templates,
categories/tags, search pages, pagination, author pages, legal pages, forms, monetized pages, and error
states. Expand the sample for parameter-, locale-, feed-, or database-generated pages — don't generalize
from a polished sample when the site contains materially different page classes.

For each check, record: `check_id`, URL/page type, observed evidence, method/tool, timestamp,
source/policy reference, status (`PASS` / `FAIL` / `NEEDS HUMAN REVIEW` / `NOT APPLICABLE`), severity,
exact remediation, and confidence. Screenshots, HTML, headers, Lighthouse/PageSpeed output, crawl logs,
and source excerpts beat assertions every time.

## Audit sequence

### 1. Establish scope and risk mode
Determine purpose, audience, monetization state, countries served, user-generated content, downloads,
affiliate relationships, and whether any topic touches health, finance, legal matters, safety,
elections, or other YMYL areas. If YMYL is plausible, activate strict mode: require source quality,
date/context accuracy, qualified review where appropriate, uncertainty disclosure, conflict disclosure,
and escalation of unsupported claims — this pairs directly with `14-ymyl-trust-guardrails.md`.

### 2. Re-verify policy and search sources
Run `scripts/runtime_policy_check.py` (or an equivalent live retrieval) against the official registry in
`adsense/official_sources.md`. Compare titles, HTTP status, retrieval date, and update markers against
the previous audit if one exists. Read the relevant official pages in full enough to catch changes.
Treat Google's current text as authoritative over this file, older notes, SEO articles, or forum advice.
Save a runtime evidence snapshot with the audit.

### 3. Apply the hard quality-and-policy gate first
Don't proceed to a positive readiness decision unless the site is demonstrably **original, useful,
complete, and user-first**. Fail the hard gate for any of:

| Hard gate | Block when observed or unresolved |
|---|---|
| Thin / low value | Pages exist mainly to capture queries, contain little real substance, repeat boilerplate, or leave users needing to search again |
| Duplicate / scraped | Copying, near-rewriting, syndication without real original contribution, or copyrighted material without rights and meaningful transformation |
| Scaled / programmatic abuse | Many pages produced primarily to manipulate Search or monetize traffic without distinct user value, including low-value AI-assisted output — see `11-programmatic-seo-playbooks.md` for how to build this correctly instead |
| Incomplete / broken | Placeholder pages, empty categories, dead primary flows, broken links/forms, server errors, unsafe redirects, missing critical content |
| Deceptive / policy risk | Misrepresentation, phishing-like behavior, hidden text/links, cloaking, keyword stuffing, doorway behavior, malware, illegal/prohibited content, unsafe claims, ad implementations likely mistaken for navigation/downloads |
| Non-user-first | The dominant purpose appears to be ranking, ad clicks, affiliate exits, or data capture rather than serving a defined audience |

A short page can still pass if its purpose is inherently concise and it fully solves the reader's task —
word count is never a quality proxy.

### 4. Audit content quality and trust
Assess originality, information gain, depth appropriate to intent, completeness, factual accuracy,
readability, first-hand experience, bylines where expected, author/about transparency, editorial review,
citations where material claims require them, real update dates, and clear "who, how, why" signals.
Compare representative pages against relevant search results or source material to catch commodity
rewriting. For YMYL, unsupported or materially misleading claims are blockers. Run
`20-humanizer-content-authenticity.md` as part of this step — content that reads as AI-slop is exactly
the "low-value AI-assisted output" pattern that fails the hard gate above.

### 5. Audit AdSense and Publisher Policy compliance
Inspect every monetized page and content class for invalid-click incentives, deceptive ad placement, ads
near navigation/download controls, pop-ups/pop-unders, unwanted redirects, malware, prohibited or
restricted content, copyright/IP abuse, dangerous or derogatory material, sexual content, dishonest
behavior, unreliable harmful claims, privacy violations, and traffic-source risks. Confirm ads don't
dominate the page or make primary content hard to find. If a policy category is unclear, cite the
current official wording and mark `NEEDS HUMAN REVIEW`.

### 6. Audit technical SEO and crawlability
Cross-reference `02-technical-seo-audit.md` and `03-pre-launch-indexing-audit.md` for the full mechanics
— verify status codes, HTTPS/mixed-content behavior, indexability, canonical consistency, robots.txt,
sitemap coverage, crawlable links, titles/descriptions/headings, semantic HTML, pagination, redirects,
hreflang where used, structured-data validity, duplicate URL controls, and absence of accidental noindex
or blocked resources. Structured data is an enhancement, not proof of content quality; indexability is
not the same thing as AdSense approval.

### 7. Audit UX, mobile, accessibility, and performance
Test key tasks on narrow and wide viewports, keyboard navigation, focus order, readable contrast, labels
and error states, loading/empty states, 404 handling, touch targets, intrusive interstitials, layout
stability, and clear visual hierarchy. Use current Core Web Vitals targets as evidence (LCP under 2.5s,
INP under 200ms, CLS under 0.1 are Google's "good" thresholds) without turning them into a fabricated
AdSense-approval formula — this is a conservative quality gate, not a claim that Google publishes this
exact approval calculation. A materially broken or mobile-hostile page blocks the release decision.

### 8. Audit privacy, consent, and security
Check the privacy notice against actual data collection, cookies, analytics, ad technology, sharing,
retention, rights, and contact information. Verify region-appropriate consent behavior, non-deceptive
choices, revocation/change controls, HTTPS, secure forms, dependency hygiene, exposed secrets, and
malware or injected pages. Legal sufficiency is jurisdiction-specific — unresolved legal uncertainty is
`NEEDS HUMAN REVIEW`, not `PASS`.

### 9. Produce the decision

- **FAIL**: any confirmed critical blocker, any failed hard gate, or any unresolved `NEEDS HUMAN REVIEW`
  on a material policy, quality, privacy, security, YMYL, mobile, or runtime-verification item. This is
  this gate's own internal release rule, not a claim that Google uses the identical decision algorithm.
- **PASS WITH RISKS**: no critical blockers, no unresolved material policy uncertainty, but documented
  non-blocking risks or conservative recommendations remain. Label each recommendation as either
  official Google guidance or an internal conservative control, and state plainly this isn't a guarantee
  of Google approval.
- **PASS**: only when all required evidence is current, the hard gate passes, no critical/high-severity
  issue remains, all required source verification succeeded, and remaining human-review items are
  genuinely non-material. An internal readiness result, never a prediction or guarantee.

## Mandatory final report format

```text
Decision: PASS | PASS WITH RISKS | FAIL
Confidence: NN% (explain evidence coverage, source freshness, remaining uncertainty)
Audit timestamp: YYYY-MM-DDTHH:MM:SSZ
Scope: domains, environments, sampled URL classes, exclusions

Scores (0-100; explain the scoring basis)
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
State whether the UI is non-deceptive, ad-balanced, non-spammy, usable on mobile, and free of broken
or misleading flows. List evidence and fixes.

Passed checks
Summarize checks that passed, citing the evidence source or test output.

Release conditions
List the exact conditions that must be met before resubmission or deployment.

Evidence and source register
List URLs, retrieval timestamps, artifacts, and evidence classification. Official sources first.
```

Use `NEEDS HUMAN REVIEW` whenever evidence is incomplete, a current policy can't be interpreted
confidently, legal or YMYL judgment is required, sources conflict, or a source-change comparison hasn't
been resolved. The fail-closed treatment is this gate's internal control, not an official Google scoring
rule — explain the smallest next test or decision a human must make.

## Reference navigation

Read `adsense/official_sources.md` for the live source registry and runtime-change procedure. Read
`adsense/audit_matrix.md` for check IDs, severities, evidence standards, and scoring. Read
`adsense/report_template.md` when producing the final report. Use `scripts/runtime_policy_check.py` to
create a source-verification snapshot before any approval decision.
