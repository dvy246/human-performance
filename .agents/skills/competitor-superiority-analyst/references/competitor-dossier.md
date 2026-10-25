# The Competitor Dossier (Phase 3, in full)

Build one of these for each of the 5 selected competitors. The point of going this deep isn't thoroughness for its own sake — a shallow dossier produces a shallow blueprint, because Phase 5-9 can only surface opportunities that were actually noticed here. Skipping a section here means that entire category of opportunity (e.g. accessibility, or trust signals) silently disappears from the final recommendations.

## 1. Basic profile

- Product name and company
- URL
- Positioning (how they describe themselves)
- Target audience
- Core job-to-be-done — what is the user actually trying to accomplish

## 2. Functionality analysis

List every meaningful user-facing feature, and categorize each as one of:

- **Core** — the thing the product fundamentally exists to do
- **Supporting** — helps the core feature but isn't the point
- **Advanced** — power-user functionality
- **Differentiating** — what makes this competitor distinct from the others in the set
- **Monetized** — gated behind payment
- **Experimental** — clearly beta/new
- **Missing** — something a user would reasonably expect that isn't there

For the features that actually matter (core, differentiating, and anything monetized), go deeper: what it does, how a user actually gets to it, what the workflow feels like step by step, why it matters to the user, its limitations, any friction in using it, edge cases it seems to handle badly or not at all, and whether it's free or paid.

## 3. Pricing analysis

Cover: what's free, trial limitations, what's paywalled, usage limits, whether ads are shown, subscription structure, one-time payments, feature gates, export restrictions, and any account requirements that gate access.

The specific thing to be hunting for here: **"Competitor charges for X, but this could plausibly be offered free."** Every instance of this needs:

- The competitor limitation (exactly what's gated and how)
- The user value of removing that gate
- Implementation difficulty
- Likely strategic value

This list feeds directly into Phase 8 later — don't just note it in passing, capture it properly here.

## 4. UX analysis

Walk the complete user journey and note friction at each stage: landing page, navigation, information architecture, discovery, onboarding, first-use experience, task completion, feedback states, loading states, error states, empty states, success states, recovery flows (what happens when something goes wrong), export/share flows, account creation, and the mobile experience specifically (not just "responsive" — actually usable on a phone).

Flag every point of *unnecessary* friction — friction that exists for the product's benefit (upsell pressure, forced signup) rather than the user's.

## 5. UI analysis

Evaluate: visual hierarchy, typography, spacing, layout, responsive behavior, component consistency, buttons, forms, cards, navigation, icons, visual feedback, contrast, accessibility, visual density, animations, transitions, microinteractions, and overall perceived quality/credibility.

Be specific about what's genuinely excellent (things worth matching, not just avoiding), what's merely average, what reads as outdated, and what's actively confusing. "Their UI is bad" isn't a finding — "their primary CTA and a secondary link share the same visual weight, so users default to the safer option" is.

## 6. Performance analysis

Where it's actually technically observable (page weight, obvious loading delay, excessive requests, large unoptimized assets, sluggish interactions, mobile performance): note it. Where it isn't observable, say `unknown` — never invent a load time, a Lighthouse score, or a specific metric that wasn't actually measured.

## 7. SEO analysis

Cover: title strategy, heading structure, metadata, what's indexable, whether programmatic SEO is in play, landing-page architecture, internal linking, topical coverage, content strategy, FAQ usage, structured data (where observable in page source), keyword targeting, search-intent alignment, URL architecture, and category architecture.

The goal here is a specific answer to "why is this competitor winning search visibility" — not just a list of technical observations, but the story those observations tell.

## 8. Trust analysis

Credibility, transparency, privacy messaging, security messaging, testimonials, reviews, social proof, explanatory content/documentation, contact/support visibility, brand quality, and overall perceived legitimacy. This category is easy to skip and shouldn't be — trust gaps are often the easiest wins to build against, especially in categories with any YMYL adjacency.

## 9. Conversion analysis

Value proposition clarity, CTA clarity, how pricing is presented, trust barriers to converting, other conversion friction, upsells, signup friction, general monetization pressure, and ad placement. The organizing question: where does this product visibly prioritize its own revenue over the user's experience, and does that create an opening?

---

## Closing each dossier

End each competitor's dossier with an explicit **Strengths**, **Weaknesses**, and **Exploitable Gaps** summary, plus an **Evidence and Confidence** note — a short honest statement of how solid the underlying research was for this particular competitor (some will be well-documented with public pricing pages and changelogs; others will be much thinner, and that should be visible to whoever reads the final report).
