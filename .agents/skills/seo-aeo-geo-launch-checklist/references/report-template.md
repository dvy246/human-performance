# Polished Report Template

Use when the user wants a client-ready or stakeholder-ready write-up instead of just the inline
phase tables from SKILL.md. This can be delivered as a markdown artifact, or as a docx/pdf if the
`docx` or `pdf` skill is available — check those skills' SKILL.md before generating either file format.

## Structure

1. **Cover / title** — domain audited, date, "SEO + AEO + GEO Pre-Launch Audit"
2. **Executive verdict** — the single `LAUNCH: PASS / PASS WITH RISKS / FAIL` line, in one sentence of
   plain-English context (what's strong, what's the single most urgent blocker if any)
3. **Phase-by-phase results** — one section per phase (0 through 9), each with its checklist table
   exactly as produced during the audit — do not paraphrase away the specific evidence
4. **Critical path to launch** — every FAIL item across all phases, in priority order, each with:
   exact file/page, exact issue, exact fix
5. **Non-blocking recommendations** — PASS WITH RISKS items, lower urgency
6. **What's already working** — genuine strengths found, with the specific evidence (don't manufacture
   praise; if nothing stands out beyond baseline compliance, say so plainly)
7. **Post-launch monitoring plan** — Search Console verification, sitemap submission confirmation,
   Core Web Vitals report cadence, opt-in check for Search generative AI features reporting

## Rules for this report

- Every claim traces to something actually fetched/read this run — no invented scores, no invented
  Core Web Vitals numbers, no invented backlink or authority metrics
- Never state a ranking probability or guarantee anywhere in the report, including the executive verdict
- If a phase item was UNVERIFIED (no access to check it), say so explicitly in that section rather than
  omitting it or assuming a pass
