# Programmatic SEO — Building Pages at Scale Without Tripping Scaled-Content-Abuse

Use this file whenever the task is building many similar pages targeting different keywords, entities,
or locations from a template and a data set: directory pages, location pages, comparison pages,
integration pages, "[keyword] + [city]" pages, or any "generate N pages for SEO" request.

**Read `00-google-foundations.md` first if you haven't.** Google's scaled-content-abuse policy is the
single biggest risk in this file, and it applies "regardless of whether automation, humans, or a mix
produced the content" — a human manually writing 5,000 near-identical thin pages is judged exactly the
same as a script doing it. Every playbook below is only ever **Consistent with Google** when each page
carries real, distinct value; the instant pages differ only by a swapped variable with nothing else
behind the difference, the whole set becomes **Avoid**, no matter how well the copy reads.

## Initial assessment — ask before designing anything

If a product-marketing context file already exists in the project, read it first and only ask about
what it doesn't cover. Otherwise, establish:

1. **Business context** — what's the product/service, who's the audience, what's the conversion goal
   for these pages specifically?
2. **Opportunity assessment** — what search pattern exists, how many potential pages, what's the
   realistic volume distribution (a handful of high-volume terms plus a long tail, usually)?
3. **Competitive landscape** — who ranks for these terms now, what do their pages actually look like,
   can this site realistically compete given its current authority?

## Core principles

1. **Unique value per page, not swapped variables.** Every page needs something specific to it beyond
   the template — real data, a real use case, a real integration, a real local detail. Maximize
   differentiation; the more genuinely distinct, the safer and the more likely to rank independently.
2. **Data defensibility hierarchy** (strongest to weakest): proprietary data you created > product-
   derived data from your own users > user-generated/community data > licensed/exclusive data > public
   data anyone can access. Public data alone, with no added analysis or context, is the weakest
   foundation for a programmatic set — it's the easiest for a search engine (and a reader) to find
   duplicated across a dozen competing sites.
3. **Clean URL structure — subfolders, not subdomains.** Subfolders consolidate domain authority;
   subdomains split it. `yoursite.com/templates/resume/` beats `templates.yoursite.com/resume/`.
4. **Genuine search-intent match.** Each page has to actually answer what a person searching that exact
   phrase wants — not just contain the phrase.
5. **Quality over quantity, always.** A hundred genuinely good pages outperforms ten thousand thin ones,
   both for ranking (per Google's own scaled-content-abuse policy) and for the site's overall
   helpfulness signal, which is evaluated site-wide — a large volume of thin pages can suppress the
   ranking potential of the genuinely good pages on the same domain.
6. **Avoid the classic penalties**: no doorway pages, no keyword stuffing, no duplicate content, no page
   that exists mainly to capture a query rather than to help the person who typed it.

## The playbooks

| Playbook | Pattern | Example |
|---|---|---|
| Templates | "[Type] template" | "resume template" |
| Curation | "best [category]" | "best website builders" |
| Conversions | "[X] to [Y]" | "$10 USD to GBP" |
| Comparisons | "[X] vs [Y]" | "Webflow vs WordPress" |
| Examples | "[type] examples" | "landing page examples" |
| Locations | "[service] in [location]" | "dentists in Austin" |
| Personas | "[product] for [audience]" | "CRM for real estate" |
| Integrations | "[product A] [product B] integration" | "Slack Asana integration" |
| Glossary | "what is [term]" | "what is pSEO" |
| Translations | Localized content per language | — |
| Directory | "[category] tools" | "AI copywriting tools" |
| Profiles | "[entity name]" | "Stripe CEO" |

Playbooks layer: "best coworking spaces in San Diego" is Curation + Locations at once.

**Choosing a playbook from what you have:**

| If you have... | Consider... |
|---|---|
| Proprietary data | Directories, Profiles |
| A product with integrations | Integrations |
| A design/creative product | Templates, Examples |
| A multi-segment audience | Personas |
| A local/regional presence | Locations |
| A tool or utility product | Conversions |
| Real content/expertise | Glossary, Curation |
| A clear competitor landscape | Comparisons |

## Implementation framework

### 1. Keyword pattern research
Identify the repeating structure and its variables. Estimate how many unique, genuinely-distinct
combinations actually exist — not just how many are theoretically generatable. Validate demand: without
a live keyword tool, reason from query construction and real competitor coverage rather than inventing
volume numbers (see the no-fabrication hard rule in `SKILL.md`). Note the likely volume distribution —
a small number of head terms plus a long tail is typical, and the long tail is usually where
programmatic pages have the best realistic shot at ranking early on.

### 2. Data requirements
Identify what data actually populates each page, whether it's first-party/proprietary, scraped,
licensed, or public (see the defensibility hierarchy above), and how it stays current — stale data on a
programmatic page is a fast trust-killer and, for anything YMYL-adjacent, a real accuracy risk (see
`14-ymyl-trust-guardrails.md`).

### 3. Template design
- Header with the target keyword, phrased naturally.
- A genuinely unique intro per page — not just the template with variables swapped in.
- Data-driven sections that actually change based on the underlying data, not boilerplate around it.
- Related-page and internal links relevant to that specific page.
- CTAs matched to the query's actual intent (informational vs. transactional).
- Conditional content blocks and original per-page insights/analysis wherever the data supports them —
  this is the concrete mechanism that turns "swapped variable" into "genuinely distinct value."

### 4. Internal linking architecture — hub and spoke
A main category page (hub) links down to every individual programmatic page (spoke); spokes cross-link
to genuinely related siblings. No orphan pages — every generated page needs to be reachable from the
site's real navigation or a real hub page, not just present in an XML sitemap. Use breadcrumbs with
structured data (see `06-schema-structured-data.md`) to reinforce the hierarchy for both users and
search engines.

### 5. Indexation strategy
Prioritize the highest-value pattern combinations for initial launch rather than publishing everything
at once. `noindex` genuinely thin variations rather than deleting them outright if they still serve a
real (if minor) user need. Manage crawl budget thoughtfully on large sites — a sitemap explosion of
10,000+ thin pages can slow discovery of the pages that actually matter. Separate sitemaps by page type
make monitoring indexation rate per pattern much easier.

## Quality checks

### Pre-launch checklist
**Content quality:**
- [ ] Each page provides genuinely unique value beyond the swapped variable
- [ ] Each page actually answers its specific target query's intent
- [ ] Readable and useful on its own, not just as part of a set

**Technical SEO** (cross-reference `02-technical-seo-audit.md` and `06-schema-structured-data.md`):
- [ ] Unique titles and meta descriptions across the entire set — scan programmatically, don't
      spot-check
- [ ] Proper heading structure per page
- [ ] Schema markup implemented and validated per template
- [ ] Page speed acceptable at the template level, not just on one sample page

**Internal linking:**
- [ ] Every page connected to real site architecture (see hub-and-spoke above)
- [ ] Related pages actually linked, not just present in a sitemap
- [ ] No orphan pages

**Indexation:**
- [ ] In the XML sitemap
- [ ] Genuinely crawlable (check for accidental blocks on the template, not just one instance)
- [ ] No conflicting `noindex` on pages meant to rank

### Post-launch monitoring
Track indexation rate, rankings, traffic, engagement, and conversion **per pattern**, not just in
aggregate — a pattern that isn't indexing or converting is a signal to pause and fix before scaling
further, not a reason to generate more pages hoping volume fixes it. Watch specifically for: thin-
content warnings in Search Console, ranking drops across the set, manual actions, and crawl errors.

**Start with a pilot** of 20-50 pages, confirm real indexation and engagement, before scaling to
hundreds or thousands — this is the single most effective safeguard against the scaled-content-abuse
failure mode, and it mirrors the ICE-scoring caution already applied to this tactic in
`10-growth-tactics-ice-playbook.md`.

## Common mistakes

- **Thin content**: swapping a city name into otherwise-identical copy with no real local detail.
- **Keyword cannibalization**: multiple generated pages effectively targeting the same query.
- **Over-generation**: creating pages for combinations with no real search demand, just because the
  data technically allows it.
- **Poor data quality**: outdated or incorrect underlying data, which compounds across every page that
  uses it.
- **Ignoring UX**: pages built to exist for a crawler rather than for the person who lands on them.

## Output format

**Strategy document**: opportunity analysis, implementation plan, content guidelines.
**Page template spec**: URL structure, title/meta templates, content outline, schema markup plan.

## The Search Quality Evaluator gate (mandatory before scaling any pilot)

Before greenlighting a full rollout beyond the pilot, run the gate from `SKILL.md`: if a Google Search
Quality Rater read this exact template rendered with real data, what would they flag? Genuine added
value on page #4,000 of the set, or a template with the city name swapped out? If the honest answer is
"they'd flag this," narrow the scope or add a genuine-value requirement before scaling further.
