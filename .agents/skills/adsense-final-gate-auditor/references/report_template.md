# Final audit report template

Use this structure exactly unless the user requests another format. Keep the executive summary readable, but preserve the tables for traceability.

## Executive summary

State the decision, what was audited, the most important blocker or risk, evidence coverage, source freshness, and confidence. State explicitly that the result is not a guarantee of Google approval.

## Decision and scores

| Field | Result |
|---|---|
| Decision | PASS / PASS WITH RISKS / FAIL |
| Confidence | NN% with rationale |
| Overall Readiness Score | 0–100 |
| Policy Compliance Score | 0–100 |
| Content Quality Score | 0–100 |
| Technical Score | 0–100 |
| UX Score | 0–100 |
| Trust Score | 0–100 |
| Risk Score | 0–100; higher is worse |
| Hard-gate result | PASS / FAIL / NEEDS HUMAN REVIEW |
| Runtime source verification | PASS / FAIL / NEEDS HUMAN REVIEW |
| YMYL mode | ON / OFF / UNCERTAIN |

## Blockers and human-review items

| ID | Status | Severity | Problem and evidence | Why it matters | Official evidence | Exact fix | Priority | Expected impact | Confidence |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |

Use one row per issue. “Official evidence” must be a current Google URL or state `No official rule found; conservative quality control` when the item is a prudential standard rather than a direct policy requirement.

## AdSense-safe UX result

Describe whether the UI is non-deceptive, ad-balanced, non-spammy, usable on mobile, and free of broken or misleading flows. Include the tested viewport sizes, page types, ad mockups/placements, and any exact CSS/component or layout fixes.

## Passed checks

Summarize meaningful passed checks with the test method, sample coverage, date, and evidence classification. Do not list untested claims as passes.

## Release conditions

List exact, testable conditions for resubmission or deployment. For every blocker, state the artifact or rerun that will prove the fix.

## Evidence and source register

| Evidence ID | Artifact or URL | Retrieved/tested | Classification | Notes/limitations |
|---|---|---|---|---|
|  |  |  |  |  |

## Human-review queue

For each unresolved item, state the smallest next human decision or test. Examples include legal review of consent language, expert review of a YMYL claim, rights confirmation for an image, or interpretation of conflicting current Google guidance.
