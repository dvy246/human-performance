# `competitor_analyst.md` — Report Structure

Use this as the literal section skeleton for the final deliverable. Fill every section — an empty or one-line section is a signal that phase was rushed, not that there was nothing to say.

```markdown
# Competitor Analysis
_Research date: [date] — recommendations should be re-verified if this document is more than a few months old_

## Executive Summary
[3-5 sentences: what was researched, the single biggest exploitable gap found, and the headline recommendation]

## Product Being Analyzed
[Phase 0 output]

## Market Definition

## Search Intent Landscape
[Phase 1 output]

## Competitor Selection Methodology
[Scoring approach and why these 5]

## Top 5 Competitors

### [Competitor 1 Name]
#### Competitor Profile
#### Functionality
#### Pricing
#### Free vs Paid
#### User Experience
#### UI Analysis
#### SEO Analysis
#### Performance Observations
#### Trust Signals
#### Conversion Strategy
#### Strengths
#### Weaknesses
#### Exploitable Gaps
#### Evidence and Confidence

[... repeat identically for competitors 2-5 ...]

## Cross-Competitor Feature Matrix
[Table: capability rows × competitor columns, our position classified Missing/Behind/Equal/Competitive/Superior/Potential Moat]

## Cross-Competitor UX/UI Matrix

## Free-vs-Paid Opportunity Matrix
[Table: what's gated, by whom, user value, difficulty, strategic value]

## Biggest Market Gaps
[What users clearly need that nobody in the set actually offers]

## Features We Should Build
[From the opportunity list, phases 5-6]

## Features We Should NOT Build
[Explicitly call out things that looked tempting but failed the feasibility/value/differentiation bar — this section matters as much as what to build]

## Product Superiority Strategy
[Tier 1-4 blueprint, phase 6]

## Website Superiority Strategy
[Phase 7 output: architecture, homepage, product interface, visual direction]

## SEO Superiority Strategy

## Monetization Strategy

## Competitive Moat Opportunities
[Tier 4 items specifically, with the reasoning for why they compound / resist copying]

## Engineering Backlog
[P0-P3, phase 9 — feature / user problem / competitor weakness / expected advantage / scope / dependencies / acceptance criteria]

## Launch Priorities
[What must exist for a credible v1, pulled from Tier 1 + P0]

## Risks and Unknowns
[Every claim tagged Hypothesis or Unknown that a reader should know is soft evidence]

## Final Strategic Recommendation
[The actual bottom line — if the reader reads nothing else, what should they take away and do next]
```

## Tier definitions (for the Product Superiority Strategy section)

| Tier | Definition |
|---|---|
| 1 — Parity | Essential to be credible in the category at all |
| 2 — Advantage | Clearly outperforms competitors on something users notice |
| 3 — Differentiation | Novel or unusually valuable capability competitors lack |
| 4 — Moat | Gets harder for competitors to copy over time, not just currently uncopied |

## Engineering backlog item fields

Every backlog item, regardless of priority bucket, needs: **feature**, **user problem**, **competitor weakness exploited**, **expected advantage**, **implementation scope**, **dependencies**, **acceptance criteria**. An item missing acceptance criteria isn't ready to hand to an engineer yet — send it back to Phase 9 rather than including it half-finished.

## A note on tone for the whole document

Never declare something "better" without specifying: better at what, for whom, compared with which named competitor, and based on what evidence. "Our onboarding is better" is not a claim; "unlike [Competitor], which requires account creation before any value is shown, a working result on the first visit removes the #1 signup-friction point we observed across 4 of 5 competitors" is.
