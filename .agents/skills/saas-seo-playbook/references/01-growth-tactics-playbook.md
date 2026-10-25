# Growth Tactics Playbook

Every tactic below follows the Recommendation Card format from SKILL.md. Read `00-google-foundations.md`
first if you haven't — every "Evidence tier" call here is made against that file. Scores given here
(Impact/Confidence/Ease) are defaults for a typical early-stage/bootstrapped technical SaaS product —
re-score for the specific product in front of you rather than copying these numbers verbatim; state
when you've adjusted a score and why.

---

## Part 1 — Content tactics

### Comparison and "Alternative to [Competitor]" pages
**Evidence tier:** Consistent with Google
**Lever(s):** 2 (helpfulness/intent match), 4 (these pages are also frequently the pages that earn
links from "best X tools" roundups)
**Expected impact:** High, for products with named, actively-searched competitors. Someone searching
"[Competitor] alternative" is mid-evaluation, not browsing — conversion rate from this traffic is
typically well above blog-traffic baseline.
**Implementation effort:** Low-to-medium per page once a template is set (a few hours of honest,
specific comparison writing per competitor); the effort scales with how many competitors are worth
covering.
**ICE:** Impact 8 / Confidence 8 / Ease 7 → **7.7**
**Supporting evidence:** Consistently identified across multiple independent SaaS growth sources as
one of the highest-converting page types; the mechanism (intercepting high-intent evaluation-stage
search) is straightforward and doesn't depend on any unverified claim.
**Confidence level:** High — this is one of the most evidence-backed tactics in the entire playbook,
and it's a direct application of "answer the query the way the person actually meant it," which is
Google-stated.
**Potential risks:** The single biggest failure mode is writing a rigged comparison where the
competitor never wins a single row — readers spot this immediately, it damages trust, and it's the
kind of thing that gets called out publicly (on the competitor's own community, on Reddit) in ways
that actively hurt the brand. Only build a comparison page for a competitor your sales team actually
hears about in real deals — comparing against irrelevant competitors wastes effort and can look
keyword-stuffed rather than genuinely useful. Keep pricing figures current; stale pricing on a
comparison page is a fast trust-killer.
**YMYL suitability:** Fine for any site. If the SaaS product is in a regulated space (fintech,
health-tech), factual claims about the competitor's compliance/security posture need the same
sourcing rigor as any other claim on the site — don't assert something about a competitor you haven't
verified.
**Why (first principles):** Directly serves lever 2 — this is Google's own "did the person get what
they needed" test applied to a real, common search pattern.

---

### Programmatic SEO (use-case pages, integration pages, data-driven pages)
**Evidence tier:** Consistent with Google **only** when each page is generated from genuinely distinct
underlying data (a real integration, a real use case, real per-entity data) — **Avoid** the moment
pages differ only by a swapped keyword/variable with no real data behind the difference.
**Lever(s):** 1 (can multiply crawlable surface area fast — which cuts both ways), 2 (helpfulness, if
and only if genuine)
**Expected impact:** Potentially very high (indie-hacker case studies report traffic and signup
multiples in months) — but the range of outcomes is wide, and includes well-documented total failures
where thousands of generated pages simply never got indexed.
**Implementation effort:** Medium-to-high up front (data modeling, templating, quality control at
scale), low marginal cost per additional page once built — which is exactly what makes it dangerous:
the temptation to keep adding pages past the point where each one adds real value.
**ICE:** Impact 8 / Confidence 5 / Ease 4 → **5.7** (confidence and ease are deliberately kept modest
— this is a tactic that's easy to do badly and requires real judgment to do well; don't let a founder
greenlight this off a high headline-impact number alone)
**Supporting evidence:** Multiple documented case studies of programmatic SEO driving meaningful SaaS
signup growth (integration/use-case pages built from real product data). Equally, a well-documented
indie-hacker case exists of 100,000+ generated pages largely failing to get indexed at all, and this
directly matches Google's stated scaled-content-abuse pattern when pages are thin or near-duplicate.
**Confidence level:** Medium — the tactic's ceiling is real and Google-compatible, but the failure mode
is common enough (and the underlying spam policy explicit enough) that this can't be scored higher
without knowing the specific data model behind the pages.
**Potential risks:** This is the tactic most likely to trip the scaled-content-abuse spam policy in
this entire playbook. Concrete gate before building: for each page, could you honestly say what's
*specifically true on this page and not true on the template's other 500 pages*? If the honest answer
is "just the variable in the title," don't build it. Start with a pilot of 20-50 pages, confirm
indexation and any real traffic/engagement before scaling to hundreds or thousands.
**YMYL suitability:** Needs extra review on YMYL-adjacent sites — programmatically generated pages
making implicit factual claims (e.g., "[Integration] pricing," "[Regulation] compliance for [industry]")
need the same fact-verification per page that a hand-written page would need; don't let the pipeline
skip that step because it's "just a template."
**Why (first principles):** Serves lever 1 and 2 simultaneously when done right, and is Google's own
explicit example of what *not* to do (fan-out pages, scaled content abuse) when done wrong. This is the
tactic where the Search Quality Evaluator gate in SKILL.md matters most — run it per template, not just
per campaign.

---

### Free tools, calculators, and widgets as linkable assets
**Evidence tier:** Consistent with Google (link earning through genuine standalone utility is exactly
the kind of link Google's guidance treats as legitimate, versus a manufactured or bought one)
**Lever(s):** 4 (link/authority — this is arguably the single best link-earning mechanism available to
a SaaS company with no PR budget), 2 (the tool itself is helpful content)
**Expected impact:** High and compounding — a genuinely useful free tool keeps earning links for years
with no ongoing outreach effort, because bloggers and educators cite it as a utility rather than as
marketing.
**Implementation effort:** Medium-to-high (needs to be genuinely good, work without a signup wall, and
produce a shareable output — a score, a report, a visual) — a half-built tool that requires signup or
produces a low-value output won't get linked regardless of promotion.
**ICE:** Impact 8 / Confidence 7 / Ease 5 → **6.7**
**Supporting evidence:** Widely and consistently cited as one of the highest-ROI SaaS link-building
investments across independent sources, with the well-known HubSpot Website Grader as the canonical
example (tens of thousands of earned backlinks over years).
**Confidence level:** High on the mechanism, medium on the specific numbers — exact backlink counts
cited for individual tools are self-reported by the companies that built them and should be treated as
illustrative, not as a benchmark to promise.
**Potential risks:** A tool built and never promoted at all tends to sit unused — some initial outreach
or community-sharing is usually needed to get the first wave of links, after which it can compound
on its own. Requiring signup/email-gate kills most of the link-earning effect; keep the tool itself
fully open.
**YMYL suitability:** Extra care if the tool produces a calculation with real financial/health/legal
consequence (a loan calculator, a dosage calculator) — these need the same accuracy and disclaimer
standards as any other YMYL content, not less because it's "just a tool."
**Why (first principles):** Directly serves lever 4 — this is the clearest example in the whole
playbook of earning authority rather than manufacturing it.

---

### Topical clusters / pillar-and-cluster content architecture
**Evidence tier:** Consistent with Google for the underlying principle (comprehensive topical coverage,
tied together with real internal links, helps Google understand entity relationships and depth of
expertise — both directly traceable to Google's stated preference for content that demonstrates real
knowledge and to its internal-linking guidance). **Experimental** for specific multiplier claims
(e.g., "clustered content earns 3.2x more AI citations") — these are vendor-produced statistics with no
independent verification and should be flagged as such, not repeated as fact.
**Lever(s):** 2 (demonstrated depth/expertise), 5 (topical clusters are also the structure most cited
as helping AI-answer-engine understanding of a site's scope)
**Expected impact:** Medium-to-high, compounding over time — the value shows up gradually as the
cluster fills in and internal links mature, not from any single article.
**Implementation effort:** Medium, ongoing — requires a real content calendar and a maintained internal
linking map, not a one-time project.
**ICE:** Impact 6 / Confidence 6 / Ease 6 → **6.0**
**Supporting evidence:** The underlying mechanism (internal linking helps Google understand site
structure and topical depth) is well-established in Google's own documentation on site organization and
crawling; the specific "3.2x" and similar figures come from SEO-tool marketing content, not Google.
**Confidence level:** High on the structural principle, low on any specific multiplier — present the
architecture recommendation with confidence, present any cited statistic with a clear "unverified
vendor claim" flag.
**Potential risks:** Building clusters around topics with no real product connection just to "cover the
topic" produces exactly the kind of unfocused content that dilutes site-wide helpfulness signals.
Anchor every cluster to what the product genuinely helps with.
**YMYL suitability:** Fine for any site; on YMYL-adjacent sites, cluster content needs the same
per-article sourcing rigor, and clusters shouldn't be built faster than the team can maintain accuracy.
**Why (first principles):** Serves lever 2 and 5 — comprehensiveness genuinely signals expertise, which
is the substance E-E-A-T evaluation is built to detect.

---

### Founder-led / building-in-public content
**Evidence tier:** Consistent with Google (first-hand experience is literally the "Experience" in
E-E-A-T; founder-written content about real product decisions is about as direct a demonstration of
that as exists)
**Lever(s):** 2, 3 (trust — a named, credentialed founder writing about real decisions is a strong
trust signal)
**Expected impact:** Medium for direct search traffic (founder posts rarely target high-volume
keywords), high for community-driven distribution, brand authority, and downstream link-earning (people
link to and quote founders more readily than to anonymous "Team" bylines).
**Implementation effort:** Low-to-medium — mostly time and willingness to publish, not technical build.
**ICE:** Impact 6 / Confidence 6 / Ease 7 → **6.3**
**Supporting evidence:** Consistently identified across indie-hacker sources as a compounding channel
(community engagement, content marketing, social storytelling) that builds credibility over
disciplined, consistent execution rather than any single viral moment.
**Confidence level:** Medium — the trust/authority benefit is well-supported in principle, but the
direct organic-traffic contribution is harder to isolate and shouldn't be oversold on its own.
**Potential risks:** Inconsistency kills this tactic faster than any other on this list — sporadic
posting builds no discernible authority. Overly promotional founder content in communities (Indie
Hackers, Reddit) reads as spam and burns community trust; see the community-engagement entry below.
**YMYL suitability:** Fine, and often especially valuable on YMYL-adjacent sites since a named,
credentialed author with visible real experience directly strengthens the E-E-A-T evaluation that
matters more there.
**Why (first principles):** Directly serves lever 3 — this is one of the most legitimate, low-risk ways
to build genuine trustworthiness signals.

---

## Part 2 — Link and authority tactics

### Digital PR via original data/research
**Evidence tier:** Consistent with Google
**Lever(s):** 4
**Expected impact:** High per successful placement — original research/data reports are cited as
pulling meaningfully more links than typical content, because journalists and bloggers need a citable
number, not another opinion piece.
**Implementation effort:** Medium-to-high (needs real data — product usage data, a survey, an analysis
— plus outreach to journalists/bloggers who cover the space).
**ICE:** Impact 8 / Confidence 6 / Ease 4 → **6.0**
**Supporting evidence:** Consistently cited across SaaS link-building sources as one of the
highest-yield tactics; the mechanism (journalists need citable data) is intuitive and doesn't depend on
platform-specific tricks.
**Confidence level:** Medium-high on the mechanism; effort and outcome both depend heavily on whether
the company has genuinely interesting first-party data to share — don't recommend this to a pre-launch
product with no usage data yet.
**Potential risks:** Cherry-picked or misleading statistics used for a PR hook can boomerang into a
credibility hit if called out — hold the same accuracy bar for a PR stat as for any published claim.
**YMYL suitability:** Needs extra rigor on YMYL-adjacent sites — a data claim used for outreach that
turns out to be wrong is worse there than almost anywhere else on the site.
**Why (first principles):** Directly serves lever 4 through genuinely earned, editorially-placed links.

---

### Unlinked brand mention reclamation
**Evidence tier:** Supported by Google (asking a site to correct/complete a citation to content they
already chose to mention is not link manipulation — it's requesting accurate attribution, consistent
with how Google's own anchor-text guidance frames links as things that should describe what they point
to)
**Lever(s):** 4
**Expected impact:** Low-to-medium volume but high conversion rate on outreach (the site already knows
and trusts the brand enough to have mentioned it) — one of the highest response rates of any
link-building outreach type.
**Implementation effort:** Low — search for brand mentions without a link, send a short, polite
request.
**ICE:** Impact 4 / Confidence 8 / Ease 8 → **6.7**
**Supporting evidence:** Consistently reported as having unusually high positive-response rates
compared to cold outreach generally, for the intuitive reason that there's already a relationship.
**Confidence level:** High — this is low-risk, low-effort, and mechanically sound.
**Potential risks:** Minimal. Don't be pushy if declined; it's a small ask, and pressing it damages the
relationship for no real gain.
**YMYL suitability:** N/A — this is a housekeeping/outreach tactic with no content-safety dimension.
**Why (first principles):** Serves lever 4 with essentially no downside risk — a good default
low-effort action for almost any product stage.

---

### Community-led growth (Indie Hackers, Reddit, Hacker News, niche Slack/Discord, Product Hunt)
**Evidence tier:** Consistent with Google **only** as genuine participation; **Avoid** the moment the
primary activity becomes self-promotion or link-dropping.
**Lever(s):** 2 (indirect — builds the kind of brand recognition and word-of-mouth that later shows up
as branded search and genuine, non-manufactured link mentions), 5 (Reddit and forum threads are
increasingly cited directly by AI answer engines — Perplexity and ChatGPT both retrieve from these
platforms heavily)
**Expected impact:** Medium, highly variable — a single well-received launch post (Product Hunt,
Indie Hackers) can produce a meaningful traffic and signup spike; ongoing genuine participation builds
slower but more durable brand recognition.
**Implementation effort:** Low per interaction, but requires sustained, authentic time investment —
this cannot be batched or automated without immediately becoming the spam pattern to avoid.
**ICE:** Impact 5 / Confidence 6 / Ease 6 → **5.7**
**Supporting evidence:** Repeatedly identified in indie-hacker sources as a core organic-growth channel
for solo/small-team founders specifically, precisely because it requires no ad budget.
**Confidence level:** Medium — highly dependent on execution quality and product fit for the specific
community; a generically-promoted product in a community that doesn't need it performs poorly no matter
how much effort goes in.
**Potential risks:** Every community here has low tolerance for self-promotion; getting flagged as spam
in one community can follow a founder's reputation into others. Never post the same pitch verbatim
across multiple communities close together — that pattern is exactly what community moderators and
spam filters are tuned to catch.
**YMYL suitability:** N/A directly, though claims made casually in community posts (about compliance,
security, efficacy) still need to be accurate — a careless community comment can be screenshotted and
cited elsewhere.
**Why (first principles):** Indirectly serves lever 2 and increasingly lever 5, but only when the
"helpfulness to the community" bar is met first and self-promotion is secondary.

---

### Guest posting
**Evidence tier:** Consistent with Google **only** for genuinely relevant, editorially-reviewed
placements with natural anchor text; **Avoid** for any arrangement that's primarily about volume,
uses exact-match keyword anchors, or where the placement was purchased. Mass/low-quality guest posting
for links has been an explicit Google spam target for over a decade.
**Lever(s):** 4
**Expected impact:** Medium, decreasing over recent years as the tactic became commoditized and more
heavily scrutinized — still viable for a small number of genuinely relevant, high-quality
publications, poor as a scaled/volume strategy.
**Implementation effort:** Medium-high per quality placement (pitching, writing to the host's actual
editorial standard).
**ICE:** Impact 4 / Confidence 4 / Ease 3 → **3.7** (deliberately scored lower than most sources would
suggest — this tactic has a worse effort/risk ratio today than it did five years ago, and this
playbook would rather under-recommend it than have a founder waste a quarter on it)
**Supporting evidence:** Explicitly named in Google's link-spam guidance as a common source of
manipulative linking when done at volume or for guaranteed placement; SaaS growth sources still list it
but consistently caveat it more heavily than other tactics.
**Confidence level:** Medium-low — genuinely relevant placements on genuinely relevant sites can still
work, but "genuinely relevant" is a narrower bar than most agencies pitching this service apply.
**Potential risks:** Paid guest-post placements, or any exchange where money or product access changes
hands specifically for the link, fall under Google's link-spam policies regardless of how the content
reads editorially.
**YMYL suitability:** N/A directly; standard accuracy rules apply to whatever's actually written.
**Why (first principles):** Serves lever 4, but only weakly compared to the other tactics in this file
— rank it below free tools, digital PR, and comparison pages by default.

---

### Integration/marketplace partner listings and "Powered by" embeds
**Evidence tier:** Supported by Google (these are genuine, functional links reflecting a real technical
relationship — exactly the kind of link Google's guidance treats as legitimate)
**Lever(s):** 4
**Expected impact:** Low-to-medium per listing, but compounds automatically as the customer base grows
— every customer who embeds a widget or gets listed in a partner directory becomes a small, ongoing
link source with no additional outreach effort.
**Implementation effort:** Low-to-medium one-time build (the embed/badge feature, the partner directory
submission process).
**ICE:** Impact 5 / Confidence 7 / Ease 7 → **6.3**
**Supporting evidence:** Consistently identified as a scalable, low-maintenance link source once the
mechanism exists — it turns the customer base itself into an ongoing link-earning engine.
**Confidence level:** High on the mechanism; actual volume depends entirely on customer count and
willingness to display the badge/listing.
**Potential risks:** Minimal — the main failure mode is simply not building the feature, not any
downside risk from having it.
**YMYL suitability:** N/A.
**Why (first principles):** Serves lever 4 with a genuinely earned, functionally-justified link — one
of the lowest-risk tactics in this entire file.
