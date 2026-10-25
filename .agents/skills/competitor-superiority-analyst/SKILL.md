---
name: competitor-superiority-analyst
description: Use whenever the user wants a rigorous, evidence-based competitive analysis before or during product development — "analyze my competitors," "who am I actually up against," "is this niche saturated," "reverse-engineer X," "what should I build to beat X," "find gaps competitors leave open," "free vs paid opportunities," "product superiority strategy," "research the market before I build this." Also trigger when the user hands over a product idea, an existing site or repo, or a candidate niche and asks whether it can win against incumbents, wants a differentiation/go-to-market strategy, or wants to know what functionality, UX, SEO, pricing, or trust gaps competitors leave exploitable. This is NOT a quick "here are 3 similar products" summary — it produces a full evidence-graded dossier on 5 real competitors plus a concrete, engineering-ready blueprint for beating them. Use it instead of answering competitor questions from memory or a single search.
---

# Competitor Superiority Analyst

## What this is for

Most "competitor research" is a shallow list of similar-sounding products with a paragraph of vibes about each. That isn't useful — it doesn't tell anyone what to build. This skill turns competitor research into a decision-making tool: what competitors actually offer, why users pick them anyway, exactly where they're weak, what users are forced to pay for or tolerate, and — critically — what a better product would concretely do differently, translated all the way down to an engineering backlog.

The deliverable is never "here's what competitor X does." It's "here's the gap, here's why it matters to a user, here's what we build instead, and here's why competitors can't easily copy it."

Work through the phases below in order — each phase's output is the input to the next, so skipping ahead (especially straight to "features we should build") produces recommendations that sound plausible but aren't actually grounded in anything.

## Principles to hold onto throughout

- **Evidence over invention.** Never state a competitor's feature, price, traffic, or weakness without having actually observed it. Every claim gets tagged verified / inferred / hypothesis / unknown (see below) — this isn't bureaucratic overhead, it's what stops the final report from being confidently wrong in ways that waste engineering time later.
- **Research before building.** Resist the pull to jump straight into "so here's what we should build." A recommendation is only as good as the market landscape it's responding to — figure out the search landscape, the real competitor set, and the user's actual job-to-be-done first.
- **Competitors are evidence, not instructions.** A competitor doing something a certain way is a data point about what exists, not proof it's correct. Popularity isn't validation — plenty of category leaders carry UX debt or pricing choices that exist for historical reasons, not because they're right.
- **Parity first, then superiority.** Don't recommend novelty for its own sake. Establish what's table-stakes (tier 1), then look for what would make a user actually switch (tiers 2-4). A product with a dozen "differentiating" features but missing something users assume exists will lose regardless of how clever the differentiators are.
- **Think from the user's chair.** The organizing question for every competitor observation is "why would a user choose this, what frustrates them once they're in it, and what would make them leave." Feature lists without this lens produce recommendations nobody asked for.
- **Stay inside ethical bounds.** Analyze only publicly accessible information and normal product usage — public pages, published pricing, documentation, observable behavior, normal signup flows. Never bypass auth, exploit vulnerabilities, circumvent paywalls, scrape proprietary source, impersonate a user, or abuse an API to get data that isn't meant to be public. If a fact isn't obtainable this way, it's `unknown`, not something to work around.

## The workflow

### Phase 0 — Look at what already exists

Before researching anyone else, understand the actual project: what it does, who it's for, what already exists in the repo or product, what technologies are in play, and what the intended monetization and acquisition strategy are. If repository access is available, inspect it — recommending a rebuild of something that already works, or missing that a "gap" is already half-closed internally, undermines everything downstream. Note current strengths and weaknesses honestly; this becomes the baseline every competitor gets compared against later.

### Phase 1 — Map the actual search and market landscape

Don't pick competitors off the top of your head or from one lucky search. Identify the primary search intents around the product — informational, transactional, tool/utilitarian, commercial-investigation, long-tail — and search across several of them. Build a candidate pool from multiple queries before narrowing anyone out. Note which domains show up repeatedly, which results are products vs. content vs. tools, and what SERP features (featured snippets, shopping panels, AI overviews) dominate — that tells you as much about the opportunity as any single competitor does.

### Phase 2 — Select the 5 strongest competitors, with a reason for each

Score candidates rather than picking by gut feel. A reasonable default weighting — adjust when better evidence points elsewhere:

| Factor | Weight |
|---|---|
| Search visibility | 25% |
| Estimated organic reach | 20% |
| Product relevance | 20% |
| Feature depth | 15% |
| User-intent overlap | 10% |
| Brand / user traction | 10% |

Prefer direct product competitors; include indirect ones only if they genuinely satisfy a large share of the same job-to-be-done. For each of the 5, record: name, URL, primary use case, target audience, visibility evidence, estimated traffic (as an *estimate*, never asserted as fact), major keyword/query types, monetization, pricing, free vs. paid tiers, primary differentiator, why it was selected, and a confidence level. Never claim a competitor has "the highest traffic" unless the evidence actually supports it — hedge appropriately.

### Phase 3 — Build a full dossier on each competitor

This is the deep-research phase and the largest piece of work. Read **`references/competitor-dossier.md`** for the complete field-by-field breakdown (functionality, pricing, UX, UI, performance, SEO, trust, conversion) before starting — it defines exactly what "complete" looks like for each competitor so nothing important gets skipped.

### Phase 4 — Stop analyzing competitors individually; build the comparison matrix

Once every dossier exists, compare across all five at once: feature coverage and quality, free vs. paid, UX, UI, mobile, performance, accessibility, SEO, trust, monetization, onboarding, differentiation. For each important capability, classify the current product's position as **Missing / Behind / Equal / Competitive / Superior / Potential Moat**. From this matrix, pull out: what everyone has (table stakes), what only some have, what everyone does poorly, what users clearly need but nobody offers, paywalled functionality that could plausibly be free, and where competitors have genuinely strong defensive advantages worth respecting rather than underestimating.

### Phase 5 — Turn weaknesses into opportunities

Every opportunity needs all six of these filled in, not just "they're missing X":

- **Weakness** — what's actually wrong with the competitor experience
- **User pain** — why it matters to a real user, not just aesthetically
- **Solution** — what the product should do instead
- **Advantage** — why that's actually better, specifically
- **Difficulty** — Low / Medium / High
- **Strategic value** — Low / Medium / High / Critical, plus whether it's genuine differentiation or just parity

Prioritize by user impact × competitive gap × feasibility × search value × conversion value × retention value — an opportunity that scores well on impact but is trivially copyable next quarter is worth less than it looks.

### Phase 6 — Write the product superiority blueprint

Sort every recommendation into a tier so priority is unambiguous:

1. **Tier 1 — Parity.** Table-stakes required to be credible in the category at all.
2. **Tier 2 — Advantage.** Clearly outperforms competitors on something users notice.
3. **Tier 3 — Differentiation.** Novel or unusually valuable capability competitors lack entirely.
4. **Tier 4 — Moat.** Advantages that get *harder* for competitors to copy over time (data effects, workflow lock-in, compounding content, etc.) — not just currently uncopied.

For each item: exact functionality, user benefit, implementation concept, priority, which competitor weakness it exploits, whether the competitor charges for it and whether this product should give it away free, and its SEO / conversion / retention impact.

### Phase 7 — Translate strategy into actual site and product structure

Don't stop at "the UI should be better" — specify site architecture (navigation, landing pages, tool pages, category pages, comparison pages, FAQ strategy, internal linking, conversion paths), the homepage (above-the-fold value prop, primary/secondary CTA, trust elements, objection handling), and the product interface itself (layout, states — empty/loading/error/success — mobile behavior, accessibility). The resulting direction should read as intentional and premium where appropriate, not as a checklist of generic AI-generated patterns — no arbitrary glassmorphism, no decorative elements without purpose, no cards or gradients added just because they're common.

### Phase 8 — Find what's paywalled that shouldn't be

Build a dedicated free-vs-paid pass: what do competitors paywall, usage-limit, gate behind an account, or push into an upsell that a user would genuinely value having free? For each candidate, weigh user value against actual infrastructure/economic cost, how hard it would be for a well-funded competitor to just also make free (if trivial, it's not much of an advantage), and the effect on organic acquisition and switching incentive. Do not recommend giving away something expensive to run just because a competitor charges for it — check economic feasibility before it goes in the blueprint.

### Phase 9 — Convert strategy into an engineering backlog

Everything upstream is worthless if it doesn't turn into actionable tickets. Bucket into P0 (launch-critical), P1 (competitive advantage), P2 (differentiation), P3 (future moat). Each item needs: feature, user problem, competitor weakness it addresses, expected advantage, implementation scope, dependencies, and acceptance criteria. When repo access exists, map items to actual files, components, routes, or modules rather than leaving them abstract.

### Phase 10 — Attack your own conclusions before calling it done

Before finalizing, actually interrogate the analysis: Are these really competitors, or did SEO competitors get confused with product competitors? Was a weakness overestimated, or personal taste mistaken for UX evidence? Are any facts unsupported or any traffic numbers overconfident? Is the blueprint actually differentiating, or is it quietly just copying competitors? Are the "free" recommendations economically realistic, and could a competitor trivially copy the proposed advantage next sprint? Did the pass cover mobile, accessibility, SEO, and monetization, or just the parts that were interesting to look at? Revise wherever this turns up a soft spot — this step is what separates a report that sounds smart from one that's actually reliable.

## Evidence framework

Tag every non-obvious claim with one of these — never let an inference read like a verified fact:

| Tag | Meaning |
|---|---|
| **Verified** | Directly observed, or strongly supported by reliable evidence |
| **Inferred** | A reasoned conclusion from multiple observations, not directly stated anywhere |
| **Hypothesis** | Plausible, but not yet sufficiently verified |
| **Unknown** | Evidence isn't available or adequate — say so explicitly rather than filling the gap |

## Tool usage

Use whatever search and page-fetching tools are available to do real, multi-source research — prefer a competitor's own site/docs for feature and pricing claims, and independent sources for traffic or reputation claims. Run independent research tasks in parallel when they don't depend on each other's results. After each batch of results: check evidence quality, reconcile anything contradictory, decide a confidence level, and only then decide the next research step — don't run extra searches just to pad the source count once the evidence is actually sufficient.

## The final deliverable

Produce (or update) a file named `competitor_analyst.md` — this is the canonical strategic document, not a chat summary. Read **`references/report-template.md`** for the exact section structure to follow, including the cross-competitor matrices, the free-vs-paid opportunity table, and the engineering backlog format. Date the report so future readers know when the research was current, and use tables wherever a comparison benefits from one rather than prose.

## Before calling it done, check all of these

- At least 5 relevant competitors were systematically evaluated, selected by evidence rather than gut feel
- Each competitor has individual functionality, pricing, UX, UI, SEO, trust, and conversion analysis
- Free-vs-paid opportunities were explicitly identified and economically sanity-checked
- Every weakness cited was converted into a concrete, actionable product opportunity
- Parity requirements (tier 1) are kept separate from genuine differentiation (tiers 2-4)
- Concrete site/UI/UX recommendations exist, not just "make it better"
- Recommendations are translated into a prioritized engineering backlog
- Unsupported claims were removed or explicitly labeled uncertain
- Phase 10's adversarial review actually happened and changed something (or you can explain why not)
- `competitor_analyst.md` exists, is dated, and every strategic recommendation in it traces back to a specific piece of competitor evidence

If any of these aren't true, the analysis isn't finished yet — go back to the relevant phase rather than writing around the gap.
