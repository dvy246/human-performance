---
name: astro-safe-i18n-migration
description: Safely add multi-language (i18n) support to an existing production Astro.js website without breaking the live English site, altering its existing wording/UI, or leaving pages partially translated. Use this skill whenever the user wants to translate an Astro.js site into other languages, add a language switcher, internationalize an Astro project, or reports bugs from a previous translation/i18n attempt — a broken or subtly changed UI, wording that shifted on existing pages, inconsistent translations, or some text staying in the original language on some pages. Trigger this even if the user doesn't say "i18n" or "skill" explicitly — phrases like "translate my site," "add languages," "the language switcher is buggy," or "translation broke my site" all mean this skill applies. ALWAYS use this skill instead of ad-hoc text replacement for any Astro.js project that is already live in production, since untracked, unverified text-replacement work is the most common cause of website-breaking i18n bugs.
---

# Astro Safe i18n Migration

## Why this skill exists

Three failure modes keep recurring when Astro i18n is attempted ad-hoc, even with access to Astro's documentation:

1. **Silent UI/wording drift.** When hardcoded text gets moved into translation keys, it's easy to accidentally reword, re-punctuate, or shift whitespace around it — the default-locale (usually English) site ends up subtly different from what it was, without anyone deciding to change it.
2. **Partial translation coverage.** Some text gets migrated to the new translation system, some stays hardcoded, and some gets handled by an ad-hoc client-side swap. The result: language switching works on part of the site and silently fails elsewhere, and it looks fine until a user finds the gap.
3. **UI components breaking under translation** — layout overflow from longer translated text, inline markup (bold, links, icons) getting flattened to plain text during extraction, or component logic that was silently depending on the exact English string value and breaks the moment that string changes.

All three are preventable, but only with a workflow that verifies *deterministically* rather than by eyeballing the result. This skill's bundled scripts exist specifically to make those checks automatic instead of relying on "it looked fine when I clicked around."

## Prime directive

**Zero harm to the existing production site.** A working translation system that also changed the English site's wording, spacing, or layout — even slightly — is a failed run, not a partial success. Treat any detected difference on the default locale as a hard stop, not a note-and-continue.

## Non-negotiable rules

- **A dedicated git branch is mandatory, enforced by script, not by memory.** Run `scripts/git-safety-check.sh` before any file changes and before every migration batch. If it fails, stop — do not proceed with changes on `main`/`master` or with an unclean working tree.
- **Never deploy.** The only valid end states are a pushed GitHub branch and a locally running dev server for the user's own manual validation. Do not merge, do not deploy, regardless of how clean the verification looks.
- **Verbatim extraction only.** When moving existing text into a translation dictionary, copy it character-for-character — same punctuation, same casing, same spacing — into the default-locale entry. Never paraphrase, "clean up," or improve wording during extraction. This single rule is what prevents the wording-drift bug.
- **Minimal-diff markup changes.** When wrapping text in a translation lookup, change only what's needed to reference the key. Don't restructure surrounding whitespace or how adjacent elements join. Verify with `scripts/diff-default-locale.sh`, not by visual inspection.
- **Recommend unprefixed default locale.** Configure Astro's i18n routing so the default locale (e.g. English) continues to serve at its existing URLs with no locale prefix (`routing.prefixDefaultLocale: false` or the current-version equivalent — confirm exact syntax via the Astro JS official docs MCP server). Prefixing the default locale would move every existing URL to a new path, breaking bookmarks, backlinks, and indexed search listings — that is itself a form of harm to the production site, distinct from and in addition to any code bug.
- **The Astro JS official docs MCP server is the only authoritative source for Astro API syntax.** Before writing any i18n config or routing code, query it for the syntax matching the installed Astro version (from package.json). Do not rely on remembered syntax. If the MCP server is unavailable or returns nothing, stop and report that rather than guessing.
- **Routing is not translation.** Astro's built-in i18n handles URL routing; it does not translate text. Build one centralized translation source (per-locale dictionary files + one shared lookup function used everywhere) as a separate, deliberate system. No client-side DOM text-swapping, ever — it's the direct cause of translations not persisting across navigation.
- **Astro is MPA by default — lean into that, don't fight it.** Each navigation is a real page load, which is exactly what makes URL-based locale routing persistent by construction. Never make a JS variable or localStorage flag the source of truth for the active locale — the URL is. If the project uses View Transitions/ClientRouter, verify locale correctness immediately after a client-side transition specifically, since that's the one place this MPA guarantee can quietly break.
- **100% text coverage, verified by script, not by self-report.** Every user-facing string gets inventoried up front and checked off against `scripts/check-translation-coverage.sh` output, not against a feeling that "most of it" is done.
- **On any verification failure, revert — don't patch forward.** `git reset`/`git checkout` back to the last verified commit. Debugging on top of an unverified state is how small bugs become site-breaking ones.

## UI & component safety rules (strict)

These target UI components breaking under translation specifically — distinct from wording drift and missing coverage above, and the most persistent failure mode if it keeps recurring after those two are already handled:

- **Never flatten inline markup into plain text.** If a source string contains inline HTML (`<strong>`, a link, an icon, a highlighted span), the translation system must preserve that structure — via component composition or safe interpolation — never a plain-string dictionary value that drops the tags. This is automatically caught for the default locale by `diff-default-locale.sh` (a stripped tag changes the English output and fails the diff); hold every other locale to the same structural fidelity, since nothing currently auto-verifies that for non-default locales — see the visual-verification rule below.
- **Never branch logic on translatable string values.** No code may compare, switch, or condition on the literal text of a UI string (e.g. `if (label === "Submit")`). Use a stable, untranslated key/id/enum for any logic instead — display text is for display only. Verify with `scripts/check-string-coupled-logic.sh` before any batch touching that component is considered done.
- **Design for text expansion, not just the source length.** Before migrating a component, check whether its container relies on a fixed width, `white-space: nowrap`, `text-overflow: ellipsis`, or a single-line assumption. Translated text is very often longer than English — commonly 20–35% for many European languages, sometimes more — and can wrap differently for scripts without English-style word-spacing. Fix layout to tolerate that range before the component ships in any non-English locale; don't wait for it to visibly break first.
- **Visually verify every new locale, not just that the build succeeded.** A correct translation key and a passing coverage/diff check do not guarantee an unbroken layout. Render each new locale's key pages — a headless-browser screenshot pass if that tooling is available in this environment, otherwise a manual browser check — and look specifically for overflow, clipped or truncated text, and broken alignment. Do this per batch in Phase 3, not only once at the end of Phase 4.

## SEO requirements (per Google's official documentation)

Sourced directly from Google Search Central's international/multilingual site guidance — not third-party SEO blog claims. Where a common SEO claim isn't something Google's own documentation actually states, it's called out as such below rather than presented as verified.

- **Unique URLs per language, never cookies or browser settings.** Google explicitly recommends different URLs for each language version over adjusting content via cookies/browser detection — Googlebot doesn't reliably vary by location or send `Accept-Language`, so cookie/JS-driven content may simply never get crawled for other locales. This is the same reason client-side language switching was already banned above under the non-negotiable rules — it's a documented SEO requirement too, not only a persistence one.
- **Subdirectories are the recommended URL structure for this project** (e.g. `example.com/es/`) — low maintenance, easy to set up, matches the routing already chosen in Phase 2. Google explicitly lists URL query parameters (`?lang=es`) as **not recommended**.
- **`hreflang` is required whenever different URLs are used per language** — already required in Phase 2/4; this is the specific mechanism Google uses to connect the versions, not an optional enhancement.
- **Never auto-redirect based on detected language or location.** Google explicitly warns against this — it can prevent both users and search engines from ever finding the other versions of the site. Offer a visible switcher/links instead, exactly as already required above.
- **Add cross-links between language versions of the same page**, not just a global site-wide switcher — helps both users and Googlebot discover every locale variant of a given page specifically.
- **Keep each page visibly single-language.** Google determines a page's language from its *visible rendered content*, not `lang` attributes or the URL. This is exactly why the coverage-verification rule above isn't just a UX nicety: a page with translated navigation but untranslated body content (or vice versa) reads to Google as inconsistent — Google's own guidance specifically names mixed-boilerplate-language pages as something to avoid.
- **Treat machine/AI-translated content as needing a quality gate before indexing.** Google states plainly that it doesn't want automated translations indexed if they don't make sense, and that low-quality automated translation risks being viewed as spam. A passing build, coverage check, and diff check mean the migration was executed correctly — they don't mean the translation quality itself is good enough to index. Budget a human proofread (even a light one) per locale before removing any `noindex` or treating that locale as launch-ready for search.
- **Pair `rel="canonical"` with `hreflang`** if any near-duplicate URLs exist for the same language (e.g. a legacy URL and a new one both serving Spanish content).
- **UTF-8 encode any localized URL paths**, and escape them properly when linking to them.

*Not included above, and deliberately so:* claims that adding languages directly "lowers keyword competition" or "increases organic traffic" are common in third-party SEO content but aren't things Google's own documentation states — they're a plausible business rationale for doing this work, not a verified technical requirement, so they're kept separate from the sourced rules above.

## Workflow

### Phase 0 — Baseline safety snapshot
1. Read `package.json` to confirm the installed Astro version.
2. Run `scripts/git-safety-check.sh` — it will refuse to continue if you're on `main`/`master` or the tree isn't clean, and tell you the branch-creation command if so.
3. Once on a dedicated branch, run `scripts/snapshot-baseline.sh` — this builds the site and saves the current (pre-i18n) output as the regression baseline. Do not delete this until the whole migration is verified and handed off.

### Phase 1 — Full text inventory
Enumerate every source of user-facing text — not just page body copy:
- `.astro` pages and components, layouts
- Content Collections / MDX frontmatter and body
- JSON/YAML/JS data files feeding the UI
- Client-side JS strings
- Meta tags, titles, structured data text
- Alt text, aria-labels
- Form labels, placeholders, CTAs
- Error/empty/loading states

Produce one inventory list (file → text → type). This is the checklist Phase 4 must reconcile against — nothing is "done" until it's crossed off here. Query the Astro JS official docs MCP server for the current officially-documented translation pattern matching this project's content structure (plain pages vs. Content Collections).

### Phase 2 — Architecture decision (stop-and-approve gate)
Query the Astro JS official docs MCP server to confirm, for the installed version: the i18n config shape, the current `astro:i18n` helper functions, and whether the project uses View Transitions/ClientRouter (and if so, the current pattern for keeping locale correct across transitions).

Design:
- One centralized translation source (e.g. `src/i18n/<locale>.json` + one shared lookup function). No per-page one-off logic.
- A language switcher that changes the route/locale (never a text swap, never an auto-redirect based on detected language/location — see the SEO requirements section).
- `hreflang`/alternate-locale tags in the shared layout head, plus cross-links between language versions of the same page.
- Default locale unprefixed, non-default locales as subdirectories — per the non-negotiable rule above and the SEO requirements section.
- A plan for inline markup (bold, links, icons) in translatable strings — component composition or safe interpolation, never plain-text flattening.
- Identify components with fixed-width/no-wrap/single-line assumptions that will need layout adjustment for longer translated text, per the UI safety rules above.

Cross-check the design against the Phase 1 inventory — confirm every text type has a concrete migration path, including data-driven/JSON content.

**Stop here.** Present the inventory summary, the architecture decision, and the batch plan for Phase 3. Do not write implementation code until the user approves this plan.

### Phase 3 — Incremental migration
For each small, testable batch (by route/section — never the whole site at once):
1. Run `scripts/git-safety-check.sh` before starting the batch.
2. Migrate that batch's text into translation keys, following verbatim-extraction, minimal-diff, and inline-markup-preservation rules.
3. Run `scripts/diff-default-locale.sh` — this must PASS (zero unexpected differences) before you consider the batch done. Any diff here is the wording/UI-drift bug resurfacing; fix it before continuing.
4. Run `scripts/check-translation-coverage.sh` scoped to whichever locales are populated so far. Investigate every flagged string — confirm it's a genuine miss (fix it) or an intentional shared string like a brand name (note it and move on).
5. Run `scripts/check-string-coupled-logic.sh` against this batch's components. Fix any flagged logic before continuing — don't defer it to a later batch.
6. Visually verify this batch's pages in at least one non-English locale for overflow, truncation, or broken alignment, per the UI safety rules above — a passing build and passing scripts are necessary but not sufficient.
7. Cross off the batch's items in the Phase 1 inventory.
8. Commit with a clear message and push to GitHub. Never let more than one unverified batch accumulate before committing.

### Phase 4 — Full-site verification
Before declaring anything done:
- Enumerate every route across every locale; confirm each builds and renders with zero errors.
- Run `scripts/check-translation-coverage.sh` across **all** target locales — zero unresolved flags.
- Run `scripts/check-string-coupled-logic.sh` across the full `src/` tree — zero unresolved flags.
- Run `scripts/diff-default-locale.sh` one final time against the full, completed multi-locale build.
- Visually verify every locale's key pages (not just the batch spot-checks from Phase 3) for overflow, truncation, or broken alignment.
- Confirm internal links/nav preserve the active locale when navigating, and that cross-links between language versions of the same page exist.
- Confirm no auto-redirect based on detected language/location exists anywhere on the site.
- Confirm `hreflang`/alternate-locale tags and translated meta/alt text are correct per locale (verify the exact current pattern via the Astro JS official docs MCP server — getting this wrong creates duplicate-content SEO problems, not just cosmetic ones). Pair with `rel="canonical"` if any near-duplicate URLs exist for the same language.
- If any target language is right-to-left, verify layout doesn't break in that locale.
- If View Transitions/ClientRouter is in use, verify locale correctness immediately after a client-side transition specifically.
- Run a full production build for the entire multi-locale site: zero errors, zero missing-route warnings.
- Flag that a human proofread of each locale is still recommended before removing any `noindex` or treating it as launch-ready for search — per the SEO requirements section, passing every check above confirms the migration executed correctly, not that translation quality is good enough to index.

### Phase 5 — Handoff
- Push the final verified branch to GitHub.
- Start the local dev server and report the exact local URL.
- Do NOT merge or deploy. State explicitly that this is awaiting the user's manual validation before any merge.

## Bundled scripts

All in `scripts/`, POSIX shell, no external dependencies beyond `git`, `npm`, `diff`, and standard Unix tools:

- **`git-safety-check.sh [branch-prefix]`** — refuses to proceed if on `main`/`master` or if the working tree has uncommitted changes. Run before Phase 0 and before every Phase 3 batch.
- **`snapshot-baseline.sh [build-dir] [default-locale]`** — builds the project and saves the output as the pre-migration baseline. Run once, at Phase 0, before any i18n changes exist.
- **`diff-default-locale.sh [build-dir] [default-locale]`** — rebuilds and diffs current output against the Phase 0 baseline. A clean pass means the default locale is byte-identical to before migration started; any diff is a regression to fix, not a note to log. Assumes the default locale is unprefixed at the same paths as the baseline (see the routing recommendation above) — if the default locale is deliberately prefixed instead, adjust the comparison path per the comments in the script.
- **`check-translation-coverage.sh <build-dir> <default-locale-dict.json> <locale> [locale...]`** — extracts substantial strings (15+ characters) from the default-locale dictionary and flags any that appear verbatim in another locale's built output. A real signal for "this wasn't actually translated," not a guarantee of full coverage — always cross-check flags against the Phase 1 inventory, and expect occasional intentional false positives (brand names, proper nouns).
- **`check-string-coupled-logic.sh <default-locale-dict.json> <src-dir>`** — flags any source-code line that directly compares (`===`, `==`, `.includes(`, `case`) against a translatable dictionary string. Catches UI logic silently depending on exact English text, which breaks the moment that text is translated.

## Inputs to confirm before starting

- Project repo path / GitHub remote
- Target languages (at least 5 — note any right-to-left language explicitly)
- Default locale (defaults to `en`)
- Content structure (plain `.astro` pages / Content Collections / mixed — confirm in Phase 1 if unsure)
