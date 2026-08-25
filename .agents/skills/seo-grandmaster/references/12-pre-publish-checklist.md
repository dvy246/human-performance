# Pre-Publish Checklist

Run through every section for any page about to go live — a comparison page, a use-case page, a blog
post, a programmatic-SEO template. Don't skip sections because the page "obviously" passes; the value
of a checklist is catching the thing that seemed obvious and wasn't. If the site is YMYL-adjacent, run
`14-ymyl-trust-guardrails.md` as an additional pass on top of this one, not instead of it.

## UX and content quality
- [ ] Would a reader who typed the target query feel like they got what they needed, or would they
      likely go back and search again? (Google's own literal test — apply it literally.)
- [ ] Does the page say something the top 3 currently-ranking pages for this query don't already say
      equally well? If not, what's the actual reason to publish this version?
- [ ] Is every factual claim traceable to a real source, and is that source current (not stale
      pricing, deprecated features, or an outdated statistic)?
- [ ] For comparison pages specifically: does the competitor win at least one honest, real comparison
      row? A comparison where the competitor never wins anything reads as rigged.
- [ ] Is the page free of filler sections added purely to hit a word count? (Length itself isn't a
      ranking factor — cut anything that doesn't add real coverage.)

## Technical SEO
- [ ] Unique, descriptive `<title>` tag under ~60 characters, primary topic near the front.
- [ ] Unique meta description that accurately previews the page (not a copy-paste from another page).
- [ ] Single clear canonical URL set (not left to Google's automatic selection if there's any
      plausible duplicate).
- [ ] Confirmed the page's primary content is present in server-rendered/initial HTML, not solely
      injected by client-side JS after load (verify via "view source" or a rendering test, not just
      what's visible in the browser).
- [ ] Descriptive URL slug (words a person would recognize, not an ID or hash).
- [ ] Internal links: at least 1-2 contextual links pointing to this new page from relevant existing
      pages, and 2-3 outbound internal links from this page to relevant existing content.

## Accessibility
- [ ] Heading structure is logically nested (for screen readers and skimmability — not because Google
      ranks on heading order, it doesn't, but real readers and assistive tech benefit).
- [ ] All meaningful images have descriptive alt text that reflects their actual relationship to the
      surrounding content (not keyword-stuffed, not "image1.png").
- [ ] Sufficient color contrast on any custom-styled text/buttons.
- [ ] Interactive elements (comparison toggles, pricing calculators, accordions) are keyboard-
      navigable, and any content meant to be discoverable isn't hidden inside an unopened accordion.

## Performance
- [ ] Images compressed and appropriately sized for their display dimensions (a common, easy win on
      SaaS pages with product screenshots).
- [ ] No obvious layout shift from late-loading fonts/embeds/ads (CLS).
- [ ] Page doesn't depend on a heavy client-side bundle just to show static marketing content.
- [ ] Treat this as "fix if clearly bad," not "chase a perfect Lighthouse score" — see the Core Web
      Vitals nuance in `04-technical-foundations-strategy.md`.

## Structured data
- [ ] Schema markup (if used) reflects fields that are genuinely true on this specific page — no
      fabricated ratings, fake review counts, or borrowed author credentials.
- [ ] If FAQ-style content is included, don't rely on FAQPage schema for a rich-result promise — that
      visual snippet was deprecated in Google Search in May 2026; use the Q&A structure for readability
      and possible AI-extraction benefit instead.
- [ ] Organization/Author schema (where used) matches real, verifiable entities.

## Metadata and canonicalization
- [ ] Open Graph / social preview tags set, so the page previews correctly when shared (relevant for
      community-led growth and social distribution).
- [ ] No accidental `noindex` tag left over from a staging environment.
- [ ] robots.txt doesn't inadvertently block this page or its assets.

## Mobile usability
- [ ] Verify the mobile rendering specifically for anything interactive (pricing calculators, embedded
      demos, comparison tables) — these are the elements most likely to overflow or break on small
      viewports, and mobile is what Google predominantly indexes from.

## The Search Quality Evaluator gate (repeat from SKILL.md — apply per page, not just per campaign)
- [ ] If a Google Search Quality Rater read this exact page, what would they flag? If the honest
      answer is "the thin content," "the rigged comparison," or "the templated feel," fix it before
      publishing, not after.
