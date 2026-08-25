# YMYL & Trust Guardrails

YMYL ("Your Money or Your Life") is Google's own category for content that could meaningfully impact a
person's health, financial stability, safety, or legal standing if it's wrong. Google's quality raters
hold YMYL content to a visibly higher E-E-A-T bar than general content — this file exists so this
skill applies that same tightened bar automatically, without waiting to be asked.

## Does this SaaS product's content count as YMYL? (Check every box that applies — any single yes
means treat the relevant content as YMYL)

- [ ] The product is in fintech, insurtech, or handles users' money directly (payments, lending,
      investing, payroll, accounting).
- [ ] The product is in health-tech, or its content gives health/medical/wellness guidance.
- [ ] The product is in legal-tech, or its content gives legal guidance or interprets regulation.
- [ ] The product makes explicit compliance/security claims (SOC 2, HIPAA, GDPR, PCI-DSS) that a buyer
      would rely on for a purchasing or risk decision — the *claims themselves* are YMYL-adjacent even
      if the product category isn't classically YMYL, because a false compliance claim has real
      financial/legal consequence for the buyer.
- [ ] The content includes calculators, estimators, or tools whose output could inform a real
      financial, health, or legal decision (ROI calculators feeding a budget decision, security-risk
      scoring, etc.).
- [ ] The content makes safety- or reliability-critical claims (uptime guarantees relied on for
      business continuity, data-loss-prevention claims).

If none apply, standard review (the pre-publish checklist) is sufficient. If any apply, run this file
as an additional pass on the relevant content — not the whole site necessarily, just the pages/claims
that trip a box above.

## Factual accuracy review

- **Every specific claim needs a traceable source** — a specific statistic, compliance claim, or
  guarantee should point to something checkable (an audit report, a named regulation, an actual test
  result), not "we take security seriously."
- **Don't let marketing language outrun what's actually true.** "Bank-level encryption" and similar
  vague-but-impressive phrases are exactly the kind of language that reads as manipulative to a
  careful reader and to Google's quality-rater standards for trustworthiness — say the specific,
  verifiable thing instead (the actual encryption standard, the actual certification).
- **Review cadence matters for YMYL content specifically** — a compliance claim or pricing figure that
  was true at publish time can become false silently (a certification lapses, a regulation changes).
  Flag YMYL pages for periodic re-verification, not just initial fact-check.

## Authoritativeness and authorship signals

- Named, credentialed authorship matters more here than elsewhere — an anonymous "Team" byline on a
  page making compliance or financial claims is a weaker trust signal than a named person with visible,
  real expertise in the relevant domain.
- If the company doesn't have in-house expertise in the YMYL-adjacent area being discussed (e.g., a
  dev-tools company writing about HIPAA compliance without in-house healthcare-compliance expertise),
  say so honestly in how the content is framed, or get the content reviewed by someone who does have
  that expertise before publishing — don't let confident-sounding prose substitute for actual domain
  authority.

## Citations and sourcing standards

- Cite primary sources (the actual regulation text, the actual audit standard, the actual published
  research) over secondary summaries where practical — this is both more defensible and generally more
  accurate.
- Don't cite a source for a claim it doesn't actually support — this is a common, easy-to-miss failure
  where a citation exists but doesn't actually back the specific number or claim next to it.

## Transparency, privacy, and disclosure

- Any AI-generated or AI-assisted content on YMYL-adjacent pages should be reviewed and fact-checked by
  a person before publishing, and the review should be real, not a rubber stamp — this is exactly the
  scenario Google's spam policies and quality-rater guidelines scrutinize most closely.
- Data-handling claims (what the product does with user data) need to accurately reflect the actual
  privacy policy and actual practice — a marketing page overstating privacy protections relative to the
  real privacy policy is both an SEO trust problem and a genuine legal exposure.
- Disclaimers belong where they add real clarity (a calculator output is an estimate, not financial
  advice) — don't over-disclaim generic content defensively, and don't under-disclaim genuinely
  consequential tools. Match the disclaimer to the actual stakes of the specific page.

## Avoiding overstated claims — the practical test

Before publishing any YMYL-adjacent claim, ask: *if a careful, skeptical expert in this specific
domain read this sentence, would they consider it accurate and appropriately hedged, or would they
consider it an overstatement?* If there's real uncertainty about whether a claim holds up, soften the
language to match the actual confidence level rather than defaulting to the most impressive-sounding
phrasing. This is both the more honest choice and, per Google's own trustworthiness framing, the one
more likely to hold up under quality-rater scrutiny over time.

## When YMYL review changes a recommendation from elsewhere in this playbook

- Programmatic SEO on YMYL-adjacent data (e.g., "[Regulation] compliance guide for [industry]" pages
  generated at scale) needs per-page fact verification, not just per-template — the marginal cost of
  scaling stays low everywhere except here, where each page's accuracy has to be checked individually.
- Digital PR / original research claims used for outreach need the same accuracy bar as any other
  YMYL claim — a PR hook built on a shaky stat is a bigger liability here than elsewhere.
- Comparison pages that touch competitor security/compliance claims need those specific claims
  verified, not just the product's own claims.
