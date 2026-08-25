# Article / Single-Page SEO Workflow

Use this when the task is one piece of content: a blog post, a landing page's copy, one specific article or draft. This file is self-contained for that purpose — you don't need the other reference files unless the article involves a topic requiring deep schema or technical work beyond a single page.

## Step 1 — Establish the target before touching the writing

Before editing a word, pin down:
- **Primary keyword**: the exact phrase a real US searcher would type for this topic. Not the internal working title — the actual query phrasing. If the user hasn't specified one, infer it from the topic and state your inference explicitly so it can be corrected.
- **Search intent**: informational (explaining/teaching), commercial (comparing/deciding), transactional (ready to act), or navigational. The content structure below depends entirely on getting this right — an informational query landing on a hard-sell page, or vice versa, has a ranking ceiling no amount of on-page polish fixes.
- **2-4 secondary/long-tail keywords**: natural variations and related questions a searcher might also have, to be woven in naturally, not stuffed.
- **Named competitor content, if any exists**: if you can find 1-2 real, currently-ranking articles for this exact query, fetch them. Note what they cover that this draft doesn't, and what this draft can do better (depth, recency, a genuinely different angle) — don't just imitate their structure.

## Step 2 — Structure

- **One H1**, matching the primary keyword's intent, not necessarily identical wording to a meta title.
- **H2/H3 headers phrased as real questions or specific claims** a US searcher would recognize — "How long does X take" beats "Duration Considerations." This structure also directly determines whether AI answer engines (Google AI Overviews, ChatGPT Search, Perplexity) can cite this content — see the direct-answer-first rule below.
- **Direct-answer-first pattern under every major header**: the first 1-2 sentences after a header should directly answer the question that header poses, with supporting detail after. This is the single highest-leverage structural change for both featured-snippet capture and AI-answer-engine citation.
- **Length determined by what's needed to fully answer the query**, not a fixed word-count target. Padding to hit a number is a worse outcome than a shorter, complete answer.

## Step 3 — On-page elements

- **Title tag**: primary keyword near the front, natural US phrasing, under ~60 characters, written to earn a click (not just a keyword restated).
- **Meta description**: genuinely descriptive of what the reader gets, includes the primary keyword naturally, under ~155 characters.
- **URL slug**: short, keyword-relevant, no unnecessary parameters.
- **Images**: descriptive (not keyword-stuffed) alt text; compressed and appropriately sized.
- **Internal links**: link to at least 1-2 other genuinely relevant pieces of content on the site if they exist; don't force links that aren't actually relevant just to hit a number.

## Step 4 — Content quality pass

- **No keyword stuffing**: scan the draft — no exact-match phrase should repeat more than roughly once per 150 words. If it does, rewrite that section in natural language.
- **No AI-slop patterns**: check specifically for vague filler transitions, unnecessary hedging ("it's important to note that..."), repetitive sentence openers, and generic claims with no specific detail behind them. Rewrite anything that reads this way into concrete, specific language.
- **Every factual or statistical claim cites a real, specific, findable source** — a name, a study, a year, or a direct link. If a claim can't be sourced, soften it to a clearly-labeled opinion/estimate or remove it.
- **Author/expertise signal** if the topic benefits from it (how-to guides, anything health/finance/safety-adjacent, methodology explanations) — a real byline with a genuine credential, not a placeholder.

## Step 5 — FAQ block (add one if there isn't already one)

3-6 questions, phrased exactly as a real US searcher would ask them (typed or spoken), each with a direct-answer-first response. Mark up with `FAQPage` schema — see `06-schema-structured-data.md` for the exact JSON-LD template if this article's page can include structured data. Do not copy an FAQ block from another page on the same site — it must be specific to this article's actual content.

## Step 6 — Schema (if the article lives on a page you control)

At minimum, `Article` schema with a real `author`, `datePublished`, `dateModified`. Add `FAQPage` schema for the FAQ block (Step 5). See `06-schema-structured-data.md` for templates and validation guidance.

## Final compact scorecard for a single article

```
PRIMARY KEYWORD + INTENT:     [stated, with reasoning if inferred]
COMPETITOR CHECK:             [done, with findings — or "no competitor named/found, using default best practice"]
STRUCTURE (H1/H2 questions):  [pass/fail + fix summary]
DIRECT-ANSWER-FIRST:          [pass/fail + fix summary]
TITLE + META:                 [shown, before/after]
KEYWORD DENSITY CHECK:        [pass/fail — note any section rewritten]
SOURCING/CITATIONS:           [pass/fail + what was fixed]
FAQ BLOCK:                    [added/verified, unique to this page]
SCHEMA:                       [Article + FAQPage present and valid, yes/no]
INTERNAL LINKS:                [count + relevance check]

VERDICT: SEO FOUNDATION COMPLETE — or — OPEN ITEMS REMAIN: [list]
```
