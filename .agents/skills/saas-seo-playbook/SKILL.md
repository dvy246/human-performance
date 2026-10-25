---
name: saas-seo-playbook
description: >
  Evidence-based SEO growth playbook for technical SaaS, built from Google's official docs plus
  verified indie-hacker/SaaS case evidence, cross-referenced so nothing manipulative or unsupported
  gets recommended. Use for SaaS SEO/content growth strategy, prioritizing tactics (programmatic SEO,
  "alternative to" pages, free tools as linkable assets, digital PR, link building, community growth,
  topical authority), "should I do X for SEO" questions, ICE-scored roadmaps, pre-publish checklists,
  or judging if llms.txt/AI Overview optimization/scaled programmatic pages are safe under Google's
  spam policies. Also trigger for YMYL review (fintech, health-tech, legal, compliance-claim SaaS).
  Distinct from seo-mastery/seo-geo-aeo, which audit an existing live URL — this answers "what to
  build/prioritize next," not "what's broken now" (pairs well with those). Trigger without the word
  "SEO" too — "what to write for signups," "is a free tool worth it for backlinks," "should I make
  comparison pages," "does llms.txt help rank."
---

# SaaS SEO Growth Playbook

A strategy and prioritization system for growing organic search (and AI-search) visibility for a
technical SaaS product, built on one non-negotiable premise: **every recommendation has to survive
contact with Google's actual, published rules** — not SEO-Twitter folklore, not vendor blog posts
optimized to sell tools, and not "this worked once for someone." Google's own documentation
(bundled in `references/00-google-foundations.md`) is the constitution here. Community-sourced
indie-hacker and SaaS tactics are the tactics layer, but every one of them has been checked against
that constitution before it's allowed into the playbook.

## Why this exists, in one sentence

Founders don't need another 47-item SEO checklist — they need to know which 3 things to do this
month, why those 3 and not the other 44, and what could go wrong if they're done carelessly.

## How this skill relates to your other SEO skills

- **seo-mastery** and **seo-geo-aeo** answer "what's wrong with this specific live site right now" —
  they fetch real pages and audit them. Reach for them when there's a URL to inspect.
- **This skill** answers "what should we build, write, or prioritize next, and why" — it's a strategy
  and decision-support layer for a SaaS product that may not fully exist yet, or that needs a growth
  roadmap rather than a bug list. Use it for planning; hand off to the audit skills for verification
  once something ships.

---

## First principles: the only five levers that actually exist

Every tactic in this playbook maps to one of these. If a recommendation doesn't clearly serve one of
them, it doesn't belong in the roadmap, no matter how popular it is on X or Indie Hackers.

1. **Can Google find and render the page?** (crawlability, indexability, JS rendering) — nothing else
   matters if this fails. SaaS apps built as client-side-rendered SPAs fail this constantly.
2. **Does the page satisfy the person who typed the query, without sending them back to search?**
   This is Google's own stated bar for helpfulness — read literally, it's a better editorial test than
   any keyword-density rule.
3. **Does the site, as a whole, look like it was made by people who know what they're talking about
   and can be trusted?** This is evaluated site-wide, not page-by-page — a handful of thin, unhelpful
   pages can suppress otherwise-good pages on the same domain.
4. **Do other independent sources point at this page because it earned it?** Links and brand mentions
   are still one of the strongest authority signals, and increasingly feed AI-citation authority too.
5. **Can an AI answer engine (Google AI Overviews, ChatGPT, Perplexity) extract a clean, attributable
   answer from this page and its surrounding brand presence?** A newer, additive lever — it rides on
   top of levers 1–4, it doesn't replace them.

Technical SEO serves lever 1. Content quality and E-E-A-T serve levers 2–3. Link building and digital
PR serve lever 4. GEO/AEO structuring serves lever 5. Every recommendation card below should say which
lever(s) it pulls.

---

## The evidence classification system

Every tactic in the reference files is tagged with exactly one of these. Use the same system when the
user asks about a tactic that isn't already documented — research it, then classify it honestly rather
than defaulting to "Consistent with Google" because that's the comfortable answer.

| Tag | Meaning | Bar for using this tag |
|---|---|---|
| **Supported by Google** | Google's own documentation (Search Central, Search Console Help, official blog) directly states this helps, or directly names it as a ranking/quality signal. | Must be traceable to an actual Google source, not a paraphrase of one. |
| **Consistent with Google** | Not stated by name, but a clear, low-risk application of a stated Google principle (e.g., "answer the query directly" → comparison pages that honestly compare two products). | The underlying principle must be one you can point to in Google's docs. |
| **Experimental** | Practitioners report results, but Google has not confirmed it, evidence is thin/self-reported/vendor-produced, or the mechanism is plausible but unverified (llms.txt is the canonical current example — real practitioners use it, Google has explicitly said no Search system reads it). | Say so plainly. Never present vendor "3.2x more citations"-style stats as fact — flag them as unverified claims from a party with an incentive to inflate them. |
| **Avoid** | Contradicts a named Google spam policy, or the honest cost/benefit is bad even where not explicitly banned (e.g., scaling pages by query-variation alone, buying links, fake urgency/scarcity UI, undisclosed AI-generated bulk content). | If it maps to a named spam policy in `references/00-google-foundations.md`, cite which one. |

**Never recommend anything tagged Avoid.** If the user explicitly asks about a black-hat or gray-hat
tactic, explain why it's classified Avoid (cite the specific spam policy) and offer the closest
white-hat alternative that serves the same underlying goal.

---

## ICE prioritization — how the roadmap gets ordered

Score every candidate tactic 1–10 on each axis, once you've researched it enough to score honestly
(don't guess a number to fill the cell):

- **Impact** — if this works, how much does it move organic traffic/signups/qualified pipeline? Scale
  to the size of the product, not to some abstract maximum — a 10 for a 2-person SaaS is not the same
  absolute traffic as a 10 for a funded company with a sales team.
- **Confidence** — how sure are you this will actually produce the impact, given the evidence tier
  above and how well-matched the tactic is to this specific product/niche? Supported-by-Google tactics
  with direct competitive precedent score higher than Experimental ones by default.
- **Ease** — inverse of effort. A free tool that takes 3 weeks to build scores lower on Ease than a
  week of comparison-page writing, even if Impact is similar.

`ICE score = (Impact + Confidence + Ease) / 3`. Sort the backlog by this, but don't treat it as
gospel — surface it as a starting order and say plainly where two items are close enough that founder
preference or sales-team input should break the tie.

**The Recommendation Card** — every tactic recommendation, whether from the reference files or
researched live, gets presented in this shape. Don't skip fields; "N/A" is a legitimate answer for
YMYL suitability on a tactic that clearly isn't content-facing, but say so rather than omitting it.

```
### [Tactic name]
**Evidence tier:** Supported by Google / Consistent with Google / Experimental / Avoid
**Lever(s):** 1 (crawl) / 2 (helpfulness) / 3 (trust) / 4 (authority) / 5 (AI discoverability)
**Expected impact:** [concrete, scaled to this product — not "huge" or "significant"]
**Implementation effort:** [rough time/skill cost]
**ICE:** Impact X / Confidence Y / Ease Z → score
**Supporting evidence:** [what you found, and where — name the source]
**Confidence level:** [why the score above, in one sentence]
**Potential risks:** [what goes wrong if done carelessly, or if it works too well too fast]
**YMYL suitability:** [fine for any site / needs extra review on YMYL sites / not applicable]
**Why (first principles):** [one sentence tying it back to one of the five levers]
```

---

## Step 0 — figure out which workflow the user needs

- **"Build me a growth strategy / content roadmap / what should we work on"** → read
  `references/01-growth-tactics-playbook.md` in full, score everything relevant against ICE, present
  as a prioritized roadmap using the Recommendation Card format above. Ask about the product, ICP, and
  current traffic/content baseline first if none of that is in context — the roadmap is worthless
  without knowing what stage the product is at.
- **"Should I do [specific tactic]?"** (programmatic SEO, comparison pages, llms.txt, a free tool,
  guest posting, etc.) → find that tactic in `references/01-growth-tactics-playbook.md` or
  `references/03-geo-aeo-ai-search.md`, answer with a single Recommendation Card, and go deeper only
  if asked.
- **"Is this technically sound / will Google even index this"** for something not-yet-live → pull from
  `references/02-technical-foundations.md`. For a page that's already live, prefer seo-mastery or
  seo-geo-aeo instead — they can actually fetch and check it.
- **"Check this page before I publish it"** → walk through `references/04-pre-publish-checklist.md`
  against the actual draft/URL provided.
- **The product or content touches money, health, safety, or legal/financial claims** (fintech,
  health-tech, security compliance claims, legal-tech, or a dev-tool blog making claims about data
  safety/compliance) → apply `references/05-ymyl-trust-guardrails.md` on top of whichever workflow
  above is running, not instead of it.
- Ambiguous → ask one clarifying question about product stage and goal before producing a full roadmap;
  don't ask if the user already gave enough context to make a reasonable default assumption.

## Reference files

| File | Covers |
|---|---|
| `references/00-google-foundations.md` | Extracted first-principles rules from Google's official SEO Starter Guide, Search Essentials, spam policies, and helpful-content guidance — the constitution everything else is checked against |
| `references/01-growth-tactics-playbook.md` | Content tactics (programmatic SEO, comparison/alternative pages, topical clusters, free tools as linkable assets, founder-led content) and link/authority tactics (digital PR, mention reclamation, community growth, guest posting), each as a full Recommendation Card |
| `references/02-technical-foundations.md` | Crawlability/indexability for JS-heavy SaaS apps, Core Web Vitals (with the real, Google-sourced nuance on how much it matters), schema/structured data, internal linking architecture, canonicalization |
| `references/03-geo-aeo-ai-search.md` | Structuring content for AI Overviews/ChatGPT/Perplexity citation, the llms.txt verdict, measuring AI visibility, what's evidence vs. vendor hype in this fast-moving space |
| `references/04-pre-publish-checklist.md` | Per-page checklist: UX, technical SEO, accessibility, performance, structured data, metadata, internal links, canonicalization, mobile |
| `references/05-ymyl-trust-guardrails.md` | YMYL detection for SaaS specifically, factual-accuracy and authorship review, citation standards, disclosure/privacy checks, when to apply stricter review |

---

## The Search Quality Evaluator gate — mandatory before finalizing any recommendation

Before presenting a final roadmap or a single recommendation card, run this check silently and revise
until it passes:

> *If a Google Search Quality Rater, or a Google search engineer, read this exact recommendation and
> the page it would produce, what specifically would they flag?* Would they see it as content built to
> satisfy a searcher, or content built to satisfy an algorithm? Would they see genuine added value on
> page #4,000 of a programmatic set, or a template with the city name swapped out? Would they see an
> honest comparison, or a rigged one that never lets the competitor win a single row?

If the honest answer is "they'd flag this," revise the recommendation — narrow the scope, add a
genuine-value requirement, cut the page count, add a disclosure — until it wouldn't be flagged. This
is not a formality; it's the actual filter that separates the tactics in this playbook from the ones
that got left out.

## Hard rules — apply throughout, every workflow

1. **Never fabricate traffic numbers, keyword volume, difficulty scores, or ranking probabilities.**
   If there's no live tool result this session, reason from the evidence tier and named competitor
   precedent instead, and say plainly that figures aren't tool-verified.
2. **Never present a vendor's self-reported stat as settled fact.** "Sites with schema get cited 3.2x
   more" is a claim from a company selling AEO services — cite it as "one vendor's unverified claim,"
   not as a number to plan around.
3. **Scaled/templated content is only ever Consistent-with-Google when each page carries real,
   distinct value** (real data, a real use case, a real integration) — not when pages differ only by a
   swapped keyword. This is literally Google's own scaled-content-abuse policy; treat it as a hard
   line, not a style preference.
4. **No link-buying, no PBNs, no reciprocal-link schemes, no undisclosed sponsored content presented
   as editorial.** These map to named Google link-spam policies — always Avoid, no exceptions for
   "everyone does it."
5. **Community engagement (Indie Hackers, Reddit, Hacker News, niche Slack/Discord) must be genuine
   participation, not link-drop spam** — the moment self-promotion becomes the primary activity, both
   the community and Google's spam systems treat it as manipulation.
6. **Don't recommend a technical SaaS tactic without naming which of the five levers it serves** —
   this is what keeps the playbook first-principles instead of checklist-shaped.
7. **YMYL context always tightens the bar, never loosens it.** If in doubt about whether something
   qualifies as YMYL for this product, treat it as YMYL.
