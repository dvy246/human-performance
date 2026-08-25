# GEO & AEO — AI Answer Engines, Featured Snippets, Voice Search

Generative Engine Optimization (GEO) targets AI answer surfaces (Google AI Overviews, ChatGPT Search,
Perplexity, Gemini). Answer Engine Optimization (AEO) targets featured snippets and voice search. Both
reward the same underlying pattern: clear, self-contained, directly-stated answers — treat this section
as reasonable inference grounded in how these systems are documented to extract and synthesize content,
not as a confirmed, reverse-engineered algorithm.

## Direct-answer-first structure (the core pattern, applies to both GEO and AEO)

Under every question-implying header, the first 1-2 sentences must directly and completely answer the
question. Supporting detail, nuance, and examples come after — never before.

**Weak (buried answer):** "There are many factors to consider when thinking about display refresh
rates, including panel technology, GPU output, and cable bandwidth. Understanding these factors can
help you figure out whether your monitor's refresh rate claim is accurate..."

**Strong (direct-answer-first):** "A monitor's advertised refresh rate can differ from what it actually
delivers due to panel technology limits, GPU output constraints, or cable bandwidth. Here's how to
check which applies to your setup..."

**Sharper still — restate the question's own terms in the answer sentence.** An answer that echoes the
actual phrasing of the question it's answering is more directly extractable/citable than one that
answers correctly but in different words. E.g., for "how long should a blog post be," an answer starting
"The ideal blog post length is [X] words" directly restates the question; an answer that only says "aim
for thorough coverage of the topic" answers the same question without restating it, and is a weaker
snippet/citation candidate even if equally accurate.

## Targeting People Also Ask (PAA) and featured snippets as a secondary ranking path

For a high-volume, highly-competitive head term, directly outranking the top 1-2 results may be
unrealistic. Targeting a genuine long-tail question closely related to that head term — one likely to
surface in the PAA box — can place a page's answer visually above lower-ranked organic results on that
same SERP, without needing to beat the head term's top results outright. Practical guidance: target the
long-tail question keyword because it's a good keyword in its own right (real search intent, answerable
well), with PAA placement as a welcome secondary outcome — not the sole reason to write the page.

## Self-contained, extractable statements

A sentence that depends on unstated context is hard for an extraction system to cite safely on its own.
Read key claims (especially FAQ answers) and ask: would this make sense if pulled completely out of the
page and shown alone, with no surrounding context? Rewrite vague pronoun references ("this makes it
better") to name the actual subject explicitly.

## Question-phrased headers

Headers over question-answering content should be phrased as the actual question a person would ask —
including how they'd ask a voice assistant — not an abstract label. "What affects your measured
refresh rate" beats "Contributing Factors" for this purpose specifically.

## List and table content in real markup

Sequential or comparative content needs genuine `<ol>`/`<ul>`/`<table>` markup to become eligible for a
list/table-format snippet. Prose pretending to be a list ("First... then... finally...") doesn't
qualify the same way.

## FAQ schema alignment

Every FAQ question should be phrased exactly as a real person would type or speak it (see
`06-schema-structured-data.md` for the markup itself) — this is the same content serving both
the AEO/GEO structural pattern and the schema requirement simultaneously, so get the phrasing right once
rather than maintaining two versions.

## Competitive citation check (only if named competitors exist)

If the user names real competitors, actually search the target queries in an AI answer engine and note
what's currently being cited — don't assume citation status without checking, and don't treat a single
check as permanent (these surfaces change faster than traditional rankings). If a competitor is being
cited and this content isn't, look specifically for which structural pattern above (direct-answer-first,
self-contained statements, question-phrased headers) the competitor has and this page doesn't.

## Evidence to produce for this phase

For each page: the before/after of the opening sentences under key headers (showing the direct-answer-
first rewrite), and, if a competitive check was run, the actual query used and what was found.
