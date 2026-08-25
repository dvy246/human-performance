# GEO/AEO — Structuring for AI Overviews, ChatGPT, and Perplexity

This is the newest and least-settled part of the playbook. Treat everything here with more epistemic
caution than the rest of the file — the field is moving monthly, most published "AI citation studies"
are produced by vendors selling AI-optimization services, and Google itself has been unusually blunt
about which parts of this space are real and which are speculative. Lever 5 (AI discoverability) rides
on top of levers 1-4 — nothing here substitutes for genuine crawlability, helpfulness, and authority.

**Read the AI-response-manipulation note in `00-google-foundations.md` before recommending anything in
this file.** As of May 15, 2026, Google's spam policies explicitly cover attempts to manipulate AI
Overviews and AI Mode on the same footing as classic ranking manipulation — every tactic below is
written to the "genuinely inform the reader" standard already, but flag this explicitly if a request
drifts toward optimizing for an AI citation rather than for the reader.

## The llms.txt verdict — read this before anyone asks to add one

**Evidence tier:** Experimental, trending toward **Avoid-as-an-SEO-tactic** (though genuinely useful for
one narrow, different purpose — see below).

**What it actually is:** A proposed convention (a markdown file at `/llms.txt`) that lets a site
describe itself in AI-friendly format. It is not a standard, and it is not enforced or read by any
major search or AI system's production ranking/citation pipeline as of this writing.

**Supporting evidence, direct from the source:** Google's own John Mueller has stated plainly, on the
record, that no AI system has confirmed using llms.txt, that server logs make it obvious the major
consumer AI chatbots don't even check for the file, and has compared it directly to the old meta
keywords tag — a self-declared claim about a site that search systems learned decades ago not to trust
at face value. Independent large-scale analysis (137,000+ sites) found that AI bots essentially never
request the file on domains where it doesn't already exist — they aren't looking for it — and that of
the requests that do occur, the overwhelming majority come from AI *coding agents and agentic tooling*
(Claude Code and similar), not from search/retrieval bots deciding what to cite. A separate large-scale
correlation study (roughly 300,000 domains) found no statistically significant relationship between
having an llms.txt file and how often a domain gets cited in AI answers.

**Where it does have a real, evidenced use case:** Developer-documentation sites, specifically for AI
coding assistants (Cursor, GitHub Copilot, Claude Code, MCP-based tools) that a *user has explicitly
pointed at the docs* to pull clean, current reference material into a coding session. This is
fundamentally different from hoping a search/answer engine's crawler discovers and trusts the file —
it's a file fetched on demand by a tool the user configured. For a technical SaaS product with public
API documentation, this is a legitimate, low-cost thing to build — just not for the reason "it'll help
us get cited by ChatGPT."

**Recommendation Card**
**Expected impact:** Near-zero for general AI-search citation or Google ranking. Real but narrow for
developer-tool discoverability if the product has API docs and a developer audience.
**Implementation effort:** Low (a markdown file).
**ICE:** Impact 2 / Confidence 8 / Ease 9 → **6.3** — the high score reflects how cheap and low-risk it
is, not how much it matters; don't let a high ICE number on a near-zero-impact item make it look more
important than it is. Present this as "cheap enough to do for the docs-tooling use case, not worth
promising any ranking or citation benefit from."
**Potential risks:** The main risk is entirely reputational/expectational — promising a founder that
llms.txt will move AI-search visibility, when the best current evidence directly contradicts that.
**YMYL suitability:** N/A.
**Why (first principles):** Doesn't clearly serve any of the five levers for search/AI-answer
discovery; serves a genuinely different goal (AI coding-agent tooling) that happens to use a similarly
named file.

## What actually is evidence-backed for AI-answer citation

**Evidence tier:** Consistent with Google for the structural recommendations below — Google's own
guide to optimizing for generative AI features on Search states plainly that the same fundamentals
that earn strong traditional rankings (crawlability, relevance, comprehensiveness, E-E-A-T) are what
feed AI Overviews too, and explicitly warns against creating fan-out variant pages purely to chase AI
citations — the same scaled-content-abuse line applies here as anywhere else.

Practical structural recommendations that are low-risk, mechanically sound, and don't depend on any
unverified vendor statistic:
- **Answer-first writing**: state the direct answer to the implied question in the first sentence
  under each heading, before the supporting explanation. This matches how both traditional featured
  snippets and AI-answer extraction have long worked — it's not a new trick, it's an old one applied to
  a new surface.
- **Use real questions as headings** where that matches genuine reader intent (not keyword-stuffed
  fake questions) — this gives both traditional search and AI extraction a clean unit to pull.
- **Lists and tables for comparative/enumerable content** — structurally easier for any extraction
  system (search snippet, AI answer, or a human skimming) to parse than the same information in dense
  prose.
- **Don't hide content behind interaction** (closed accordions, tabs that require a click) if it's
  meant to be found — render primary content open in the HTML.
- **One clear claim per sentence** in sections meant to be citable — compound, hedge-heavy sentences
  are harder for any extraction system to lift cleanly, and arguably harder for a human reader too.

These are all straightforward applications of "write clearly for the person reading it" — the same
principle Google states for ordinary ranking, just applied with an eye toward extraction.

**Recommendation Card**
**Expected impact:** Medium — plausible and mechanically sound, but AI-citation-specific traffic and
its downstream value (conversion quality of AI-referred visitors is still an open, actively-debated
question among practitioners) is genuinely less understood than traditional organic traffic.
**Implementation effort:** Low — mostly an editing/structuring discipline, not new content.
**ICE:** Impact 6 / Confidence 6 / Ease 8 → **6.7**
**Supporting evidence:** Directly grounded in Google's own AI-features optimization guidance for the
"why," with the specific structural tactics reflecting long-standing featured-snippet best practice
extended to a new surface.
**Confidence level:** Medium — the direction is sound, the exact payoff is not yet independently
quantifiable.
**Potential risks:** None from doing this well; the risk is entirely in over-investing engineering/
content time chasing AI-citation optimization at the expense of the higher-confidence tactics elsewhere
in this playbook.
**YMYL suitability:** Standard accuracy rules apply — a citable, quotable single-sentence claim needs to
be *correct*, especially since AI answer engines strip away surrounding context/caveats when they lift
a sentence.
**Why (first principles):** Serves lever 5, built entirely on top of levers 1-3 being already solid.

## Measuring AI visibility (since Search Console doesn't break this out directly)

There's no dedicated "AI Overview impressions" filter in Google Search Console as of this writing.
The practical approach: maintain a short list (10-30) of real customer questions, run them periodically
against ChatGPT, Perplexity, and Google AI Mode/Overviews manually, and log which brands and URLs get
cited. Treat this as a qualitative directional signal, not a metric to report growth percentages
against — the sample size and manual process make precise trend claims unreliable.

## The vendor-stat problem, stated plainly

This space is currently flooded with specific-sounding statistics from companies selling AEO/GEO
services: "schema increases citations by X%," "clustered content earns Y times more AI citations,"
and similar. These numbers are almost never independently reproducible, are typically drawn from the
vendor's own client base (a biased sample), and serve the vendor's incentive to make their service
sound necessary. Cite the *underlying mechanism* (clear structure helps extraction; comprehensive
topical coverage signals expertise) as Consistent with Google, and flag any specific multiplier as an
unverified claim from an interested party — never present it to the user as if Google confirmed it.
