# Full-Site SEO Audit & Certification

The orchestrating checklist for a whole-website pass. Work through the phases in order — each builds
on the one before it (keyword strategy before on-page copy, on-page copy before FAQ/schema layered on
top of it). Read each phase's dedicated reference file when you reach it rather than working from
memory of what it probably covers. This file is the "what's broken / what's missing right now" audit;
for "what should we build or prioritize next," use `10-growth-tactics-ice-playbook.md` instead (they
pair well — audit first, then roadmap).

## Before starting, gather (ask the user if not already given)

```
DOMAIN / SITE:
NICHE / INDUSTRY:
TARGET AUDIENCE:      (default: US-based, English-speaking, unless told otherwise)
LIVE PAGE LIST:       (sitemap URL, or key page templates)
NAMED COMPETITORS:    (2-5 real URLs — strongly recommended; without these, competitive
                       comparisons default to general best practice and should be labeled as such)
GOAL OF THIS AUDIT:   (pre-launch check / ongoing health check / "why did traffic drop" /
                       AdSense readiness / all of the above)
```

## Phase order

1. **Crawlability & indexing** → `03-pre-launch-indexing-audit.md` (always run first — nothing else
   matters if the page can't be indexed)
2. **Technical foundation** → `02-technical-seo-audit.md` (add `04-technical-foundations-strategy.md`
   too if the site is a JS-heavy SaaS app)
3. **Search Essentials & spam-policy check** → `01-spam-policies-and-troubleshooting.md`
4. **Keyword strategy & on-page optimization** → `05-keyword-onpage-strategy.md`
5. **Schema & structured data** → `06-schema-structured-data.md`
6. **Content quality & E-E-A-T** → `07-eeat-content-quality.md`
7. **GEO/AEO — AI answer engines** → `08-geo-aeo-structural-patterns.md`
8. **YMYL guardrails** → `14-ymyl-trust-guardrails.md`, only if the site trips any box in that file
9. **AdSense readiness gate** → `19-adsense-final-gate.md`, only if the user is preparing an AdSense
   application, ad-code launch, or production release — otherwise skip this phase entirely
10. **Live-data verification** → `18-live-data-brightdata-bridge.md`, if the Bright Data connector/CLI
    is available and JS-rendered schema, hreflang, or live SERP checks are needed

Apply the Core Rules and the Evidence Classification System from the main `SKILL.md` throughout every
phase — they're not a separate step, they're constraints on every step. Run the Search Quality
Evaluator gate (also in `SKILL.md`) before finalizing the report.

## Final Deliverable — Full-Site SEO Certification Report

```
## Phase 1 — Crawlability & Indexing
[findings + fixes, with evidence, per 03-pre-launch-indexing-audit.md]

## Phase 2 — Technical Foundation
[findings + fixes, with evidence, per 02-technical-seo-audit.md]

## Phase 3 — Search Essentials & Spam-Policy Check
[per-category pass/fail, per 01-spam-policies-and-troubleshooting.md]

## Phase 4 — Keyword Strategy & On-Page
[keyword map table + cannibalization/gap findings + before/after evidence + duplicate-title/meta scan]

## Phase 5 — Schema & Structured Data
[per-page-template table: schema type(s) present | valid (Y/N) | Rich Results Test result]

## Phase 6 — Content Quality & E-E-A-T
[unsourced-claims list + resolution, authorship check, AI-slop findings]

## Phase 7 — GEO/AEO (AI Answer Engines)
[direct-answer-first spot-check examples + competitive citation findings if applicable]

## Phase 8 — YMYL Guardrails (if applicable)
[which boxes tripped, and the additional review applied]

## Phase 9 — AdSense Readiness (if requested)
[Decision: PASS / PASS WITH RISKS / FAIL — full report per 19-adsense-final-gate.md]

## Named-Competitor Comparison
[for each named competitor: 2-3 specific things they do that this site now matches or exceeds, and
anything they still do better — state plainly, don't force a "we win everywhere" conclusion if it isn't
true]

## SEO Scorecard
| Phase | Status | Evidence |
|---|---|---|
| 1. Crawlability & Indexing | complete / open | ... |
| 2. Technical Foundation | complete / open | ... |
| 3. Search Essentials | complete / open | ... |
| 4. Keywords & On-page | complete / open | ... |
| 5. Schema | complete / open | ... |
| 6. Content/E-E-A-T | complete / open | ... |
| 7. GEO/AEO | complete / open | ... |
| 8. YMYL | complete / open / N/A | ... |
| 9. AdSense Gate | pass / pass with risks / fail / N/A | ... |

## VERDICT
SEO FOUNDATION COMPLETE — no further structural SEO work identified
-- or --
OPEN ITEMS REMAIN: [short, specific, prioritized list]
```

## The one rule that matters most for this report

Do not issue the "complete" verdict unless every row in the scorecard is genuinely clean with real
evidence behind it. A report that rounds up to "done" to be agreeable defeats the entire purpose of
running this skill — the user is relying on this verdict to mean they can actually stop doing SEO work,
not that the work looks plausible. If you're not sure something is clean, it isn't — mark it open and
say what would need to be checked to close it.
