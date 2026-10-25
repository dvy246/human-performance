# Spam Policy Categories — Expanded Detail

Source: [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies)

Use this file when Phase 4 turns up something ambiguous and the short checklist in SKILL.md isn't
enough to judge it. Each category below includes what's explicitly fine (so you don't over-flag) and
what's explicitly a violation.

| Category | Explicitly FINE | Explicitly a VIOLATION |
|---|---|---|
| Cloaking | Responsive design serving different HTML by device/viewport | Serving different *content or intent* to Googlebot vs. users |
| Doorway abuse | Genuinely distinct per-city/per-state pages with real local content, pricing, or availability differences | Near-identical pages differing only by a swapped city/keyword, funneling to one "real" page |
| Scaled content abuse | AI-assisted drafting reviewed and substantially edited by a human, adding real value | Bulk AI (or human) page generation with no distinct value per page — this is the single most common way indie/SaaS sites get penalized |
| Thin affiliation | Original testing, comparison tables, real photos/screenshots, genuine pros/cons | Copy-pasted merchant product descriptions with an affiliate link bolted on |
| Scraping | Quoting with attribution and adding original analysis | Republishing another site's content with no original value or citation |
| Keyword stuffing | Natural use of the target term and its synonyms | Exact-match phrase repeated more than ~once per 150 words of body copy |
| Hidden text/links | Legitimate accordions, tabs, sliders, tooltips (content is genuinely there, just progressively disclosed) | White-on-white text, off-screen CSS, zero-opacity text/links meant only for crawlers |
| Link spam | Editorial links earned because content is genuinely useful | Paid or exchanged links without `rel="nofollow"`/`"sponsored"`; PBNs; reciprocal-link schemes |
| Sneaky redirects | Domain moves, consolidation, post-login routing | Redirects that show Google different content/intent than what users land on |
| Misleading functionality | A calculator/tool that does exactly what it claims | Bait-and-switch into ads, dead ends, or a tool that doesn't actually function |
| Site reputation abuse | Guest content genuinely on-topic for the site's actual subject matter | Third-party content hosted mainly to borrow the domain's existing ranking signals |
| User-generated spam | Moderated comments/forums with spam filtering active | Unmoderated UGC sections that fill with spam links pre- or post-launch |

**When in doubt on any of these, treat it as a violation and flag it** — the cost of over-flagging (a
brief follow-up conversation) is far lower than the cost of a manual action or algorithmic demotion
after launch.
