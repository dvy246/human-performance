# PLAN.md — BrainBenchmarks Engineering Execution Blueprint

**Status:** Master build document — supersedes ambiguity in PRD.md
**Source of truth:** PRD.md (product intent) + this document (execution)
**Audience:** Engineers, AI coding agents, solo builder shipping this with AI assistance
**Last updated:** 2026-07-05

## How to use this document

This is not a rewrite of the PRD — it's the layer underneath it. The PRD says *what* to build and *why the market wants it*. This document says *how it gets built, in what order, in what shape*, so that an engineer (human or AI-assisted) can open any section and start writing code without needing a meeting first.

Read order: Section 1 (critical review) tells you what changed from the PRD and why — read it first, it changes decisions downstream. Sections 2–14 are the actual spec. Section 15 is the phase plan — this is what you build first.

---

## 1. Critical Review of the PRD — What Changes and Why

The PRD's market thesis is sound: the competitor traffic numbers (HumanBenchmark, TypingTest.com, CPSTest.org) are real and independently verifiable, and the "measure → understand → train → track → improve" loop is a legitimate differentiator against sites that only measure. But four assumptions in the PRD are weak enough to change how we build, and one omission is a real risk we need to design around from day one.

### 1.1 "20+ tests at launch" contradicts the PRD's own Phase 1 plan — and both are wrong

Section 6.2 wants 20+ tests at launch; Section 14.3 Phase 1 says "5 essential tests" in weeks 1-4. These can't both be true, and neither number is well-reasoned on its own.

**Decision: launch with 8 tests, not 5 or 20.** Five is too thin to demonstrate "ecosystem" (the PRD's own stated differentiator vs. HumanBenchmark). Twenty at launch means twenty half-tested, un-benchmarked, unpolished tools competing for the same engineering hours — this is exactly the "feature bloat" the brief tells us to reject. Eight lets us cover one full keyword cluster end-to-end (Reaction Suite, complete) plus one flagship test per remaining cluster (Memory, Typing, Click Speed, Aim, IQ), so the Cognitive Profile (which needs cross-category data — Section 7 of the PRD) is functional from day one instead of bolted on in Phase 2. See Section 4 for the exact eight and Section 15 for sequencing.

### 1.2 Anonymous localStorage-only tracking caps the product's own moat

PRD Section 9.2 is right that no-login-required is the correct default (it's the single biggest lever on completion rate and directly increases pageviews per session — HumanBenchmark's biggest UX complaint isn't the login wall, it's that there isn't one, and yet retention still requires *something* to survive a cleared cache or new device). The PRD acknowledges this ("Sync (Future)") but treats it as a nice-to-have.

**Decision: cross-device sync is a Phase 2 requirement, not a future maybe.** Section 7's whole "Product Moat" argument (progress history network effect, streaks, cognitive age over time) is worthless if a cleared browser cache resets a user's streak to zero — that's a churn cliff, not a moat. We ship an *optional*, frictionless sync (magic-link email or "save my results" with a short recovery code) by end of Phase 2, never required, always skippable. Local-first remains the default; sync is insurance against the exact data loss that undermines every retention feature in Section 8 and 9 of the PRD.

### 1.3 "200+ programmatic pages in weeks 9–12" is the single highest-risk line in the PRD

The PRD's own Section 15 risk table lists "Google algorithm update" as medium-probability/high-impact, and it should be treated as near-certain, not a hedge. Google's Helpful Content signal (folded into core ranking since 2024) specifically targets templated pages with swapped keywords and thin unique value — exactly what "200 pages in one 3-week sprint" produces if built the way most AI-assisted programmatic SEO projects build it.

**Decision: no page ships without a minimum content bar, and the pace is throughput-gated, not calendar-gated.** Section 10 defines the actual template and the non-negotiable per-page content requirements (unique data, not just unique keyword substitution). Phase 3's job is to build the *system* that produces compliant pages fast — the 200-page count is an outcome of quality gates being met repeatedly, not a sprint deadline. If the pipeline can only produce 40 pages that clear the bar in that window, we ship 40.

### 1.4 "Cognitive Age" and IQ-adjacent content sit closer to YMYL than the PRD treats them

The PRD is right that "Cognitive Age" is a strong viral hook (Section 7.2, Section 14.2). What it doesn't address: content that makes claims about cognitive ability, brain health, or IQ is scrutinized by Google's quality raters similarly to health content (adjacent to Your-Money-Your-Life), and by AdSense's ad policy for health & wellness claims. This isn't a reason to cut the feature — it's a reason to build it correctly the first time instead of retrofitting disclaimers after a trust or policy problem.

**Decision:** every score-to-claim mapping (percentile, "cognitive age," skill rating) ships with a visible, plain-language methodology note and an explicit "entertainment/self-tracking tool, not a medical or diagnostic assessment" disclaimer in the same viewport as the claim — not buried in a footer. This is specified in Section 6 and Section 9.

### 1.5 What the PRD gets right and we are keeping as-is

Astro + static-first + Cloudflare Pages, the no-login default, the Skill Radar / weakness-detection concept, and the AdSense-primary monetization model are all sound and are specified in full below, not re-litigated.

### 1.6 One addition not in the PRD: measurement precision is a product-quality issue, not just an engineering detail

Reaction-time and CPS tests are only as credible as their timing precision. A test built on `setTimeout` instead of `requestAnimationFrame` / `performance.now()` will produce visibly wrong numbers compared to HumanBenchmark, and users who game-test on both sites will notice and bounce — this is a trust and retention issue disguised as an implementation detail. Section 11.4 makes this a hard technical requirement, not a suggestion.

### 1.7 Live Competitor Teardown: reactiontimetesting.com

This is a real, live, indexed competitor (Astro-built, per its own generator meta tag — confirming Section 1.5's stack choice is already validated in production for this exact niche) targeting the same Reaction cluster as our Phase 1 launch set. It's a useful teardown because it's further along than a theoretical competitor and further behind than HumanBenchmark, so it shows exactly where a single-vertical "SEO tool site" plateaus. Six findings change or reinforce this plan:

**Finding 1 — It's structurally trapped in one vertical, and that's our biggest exploitable gap.** All five of its tests (Simple, F1 Lights, Sound, Aim Coordination, Color) are reaction/coordination variants — there is no memory, typing, or reasoning test anywhere on the site. It cannot build a real cross-skill profile no matter how good its execution gets, because it has no data outside one Skill Radar axis. **This directly validates Section 1.1's decision** (8 launch tests spanning all 6 axes) — the Cognitive Profile isn't a nice-to-have differentiator against this competitor, it's a category of product they structurally cannot enter without rebuilding their whole site. No plan change needed here; treat this as confirmation the moat is real, not theoretical.

**Finding 2 — Its gamification is a flat list, not a loop.** Five static badges (one per test, threshold-based), no streaks, no daily plan, no weakness-driven recommendations. Its Dashboard tracks stats; it doesn't tell the user what to do next. **This validates Sections 5.3, 7, and 8** (Weakness Detection, richer achievement set, Daily Training Plan) as real competitive separation, not internal over-engineering — do not cut these to save Phase 1 time.

**Finding 3 — Its "About Us" page is a generic mission statement with zero named expertise signal.** No author, no reviewer, no credentials, no team — just "Our Mission / What We Offer / Our Values" boilerplate. For content adjacent to cognitive/health claims (Section 1.4's YMYL concern), this is a real E-E-A-T weakness we can beat cheaply. **Decision: add a named-authorship requirement.** Every methodology page and benchmark-data page must carry a real "Written by / Reviewed by" byline with a genuine one-line credential (even a solo builder's actual background — sports science, software engineering, whatever is true), and `/about-us` must say who is actually behind the site, not just what it believes. This is a Phase 1 content requirement, not a later polish item — see the updated Section 9.7 and 9.5 below.

**Finding 4 — Its methodology citations are a genuine strength worth matching exactly, not just beating.** Its benchmarks page cites two real, named, findable studies (Der & Deary, 2006; Williamson & Feyer, 2000) for its age and sleep-deprivation claims. This is better sourcing discipline than most sites in this niche bother with. **Decision: tighten Section 6.5/9.7** — our `/methodology/` page and every benchmark claim must cite specific, named, linkable sources, not a vague "cited normative data" gesture. Match this competitor's rigor as a floor, not a ceiling.

**Finding 5 — Its "what affects your score" content (monitor refresh rate, input polling rate, Bluetooth vs. wired latency) is specific, genuinely useful, and non-generic.** This is a stronger content pattern than the generic "sleep more, drink less caffeine" advice most competitor pages default to, and it's exactly the kind of page-specific, non-templated fact Section 9.4's thin-content guardrail asks for. **Decision: add an equivalent "what affects your measured score" block to the Section 9.5 test-page template**, populated with real per-test-category hardware/environment factors (e.g., typing: mechanical vs. membrane keyboard latency; aim: mouse DPI and polling rate; not just reaction time's display/input lag).

**Finding 6 — It ships in 7 languages already.** This is a live signal that translated-content SEO scaling is an active tactic being used in this exact niche today, and it's not currently in our plan at any phase. **Decision: add i18n as an explicit Phase 4 candidate** (Section 14) — not earlier, because translating thin or unproven content multiplies a mistake seven times over; only translate pillar content that's already demonstrated ranking/engagement in English.

**One weakness of theirs we should not copy:** its body copy is dense with unnaturally repeated exact-match keyword phrases ("reaction time tester... test reaction time... reaction time checker" stacked within a few sentences). It likely still ranks today, but it reads like SEO copy, not editorial writing, and is a plausible target for future helpful-content-style scrutiny. **Section 9.4 is amended below** with an explicit rule against this pattern.

---

## 2. Product Architecture

### 2.1 System Overview

BrainBenchmarks is a static-first, browser-computed platform. There is no application backend for the core product — every test runs, scores, and stores its result entirely client-side. The only server-side surfaces are: (1) the Astro static build served from Cloudflare's edge, (2) a thin Cloudflare Worker for the optional sync feature (Section 1.2), and (3) build-time data generation for programmatic SEO pages. This keeps infra cost near zero and keeps every test page a static HTML document first, JS-enhanced second — the architecture Google's crawler and Core Web Vitals both reward.

```
                         ┌─────────────────────────────┐
                         │   Astro Static Site (SSG)   │
                         │   Cloudflare Pages CDN       │
                         └───────────────┬─────────────┘
                                         │
        ┌────────────────┬──────────────┼──────────────┬────────────────┐
        │                 │              │              │                │
   Test Pages       Learning Center  Dashboard      Comparison       Programmatic
   (React island     (pure static    (client       Pages (static    SEO Pages
   per test)         MD content)     hydrated)      + client data)   (build-time
                                                                      generated)
        │                 │              │              │                │
        └────────┬────────┴──────────────┴──────────────┴────────────────┘
                  │
          ┌───────▼────────┐
          │  Client Data    │
          │  Layer          │
          │  (Section 11.5) │
          │  localStorage   │
          │  + IndexedDB    │
          └───────┬────────┘
                  │  (optional, explicit opt-in)
          ┌───────▼────────┐
          │ Cloudflare      │
          │ Worker + KV/D1  │
          │ (sync only)     │
          └─────────────────┘
```

### 2.2 Module Map — Why Each Piece Exists

| Module | Purpose | Retention/SEO/Monetization link |
|---|---|---|
| **Test Runtime Core** | Shared state machine (`idle → countdown → running → result`) that every test implements against | Maintainability — 20+ tests share one engine instead of 20 bespoke ones |
| **Scoring Engine** | Pure functions: raw input → score → percentile → skill-category contribution | Feeds Skill Radar and Cognitive Profile — the retention moat |
| **Client Data Layer** | localStorage (settings, flags) + IndexedDB (session history, time series) | Enables Dashboard, streaks, progress timeline without a login |
| **Skill Radar Engine** | Aggregates per-category scores into the 6-axis radar + weakness detection | Core differentiator vs. HumanBenchmark (Section 6/7 of PRD) |
| **Training Recommendation Engine** | Rules-based (not ML at launch) mapping weak skills → suggested next test/drill | Drives return visits — the #1 lever on repeat pageviews |
| **Content/SEO Layer** | MDX-based Learning Center, pillar pages, programmatic comparison pages | Organic traffic acquisition — the entire growth channel |
| **Ad Layer** | AdSense slot components with lazy-load + CLS-safe reserved space | Monetization without harming Core Web Vitals |
| **Sync Worker (Phase 2+)** | Cloudflare Worker + D1, optional account-free recovery code | Prevents data-loss churn (Section 1.2) |

### 2.3 Data Flow — A Single Test Attempt, End to End

1. User lands on `/tests/reaction-time/` (static HTML, fully readable/indexable with no JS).
2. React island (`ReactionTimeTest.tsx`) hydrates on visibility/interaction, not on page load (`client:visible`), keeping initial JS payload near zero.
3. Test runs entirely in-browser using `performance.now()` timing (Section 11.4).
4. On completion, the Scoring Engine computes score + percentile from a static, versioned percentile table shipped at build time (not computed live — see Section 6.5).
5. Result is written to IndexedDB via the Client Data Layer, tagged with test ID, timestamp, score, and derived skill-category deltas.
6. Skill Radar Engine recalculates the 6-axis profile from all IndexedDB history on next Dashboard visit (not on every test — avoid unnecessary recompute).
7. Training Recommendation Engine reads the updated radar and surfaces "train your weakest skill" on the result screen and Dashboard.
8. Optional: user clicks "save my progress," triggering the Sync Worker to issue a recovery code and mirror the IndexedDB snapshot to D1.

---

## 3. Information Architecture

### 3.1 Full Site Map

```
/                                  Home — flagship hook, top tests, live stats
/tests/                           Test hub — category grid, filters
/tests/reaction/                  Category landing (pillar page)
  /tests/reaction/simple/
  /tests/reaction/choice/
  /tests/reaction/audio/
  /tests/reaction/peripheral/
  /tests/reaction/f1-lights/
/tests/memory/                    Category landing (pillar page)
  /tests/memory/sequence/
  /tests/memory/number/
  /tests/memory/visual/
  /tests/memory/verbal/
  /tests/memory/working/
/tests/focus/
  /tests/focus/stroop/
  /tests/focus/sustained-attention/
  /tests/focus/task-switching/
/tests/iq/
  /tests/iq/matrix-reasoning/
  /tests/iq/spatial-rotation/
  /tests/iq/logical-sequences/
/tests/typing/
  /tests/typing/speed-test/
  /tests/typing/practice/
/tests/speed-precision/
  /tests/speed-precision/click-speed/
  /tests/speed-precision/spacebar/
  /tests/speed-precision/aim-trainer/
  /tests/speed-precision/mouse-accuracy/
/compare/                         Programmatic comparison pages (Section 10.4)
  /compare/reaction-time-vs-age/
  /compare/[test]-vs-[test]/
/learn/                           Learning Center — pillar + supporting articles
  /learn/reaction-time/           Pillar
  /learn/reaction-time/how-to-improve-reaction-time/
  /learn/reaction-time/average-reaction-time-by-age/
  /learn/typing/...
  /learn/memory/...
  /learn/glossary/                Glossary hub + per-term pages
/dashboard/                       Client-hydrated, no-index (private, per-user data)
/dashboard/training/              Today's plan
/dashboard/history/               Full session history
/dashboard/achievements/
/profile/
/settings/
/methodology/                     How scores/percentiles/cognitive age are calculated (Section 1.4 trust requirement)
/about/  /privacy/  /terms/  /contact/   Required legal pages
```

### 3.2 Information Architecture Principles

- **Every test has a canonical URL that never changes.** SEO equity compounds only if URLs are stable — no query-param test variants for indexable content.
- **Category pages are pillar pages, not just navigation.** `/tests/reaction/` carries real content (what reaction time measures, average benchmarks, links to all sub-tests and related Learning Center articles) — it's a ranking asset, not a directory listing.
- **`/dashboard/*` is `noindex` and client-only.** It contains no unique crawlable value (it's per-user data) and indexing it would dilute crawl budget.
- **Flat depth for money pages.** Every individual test is exactly 2 levels deep from home (`/tests/[category]/[test]/`). Depth beyond 3 clicks measurably hurts crawl frequency for new domains with limited authority.

---

## 4. Complete Test Ecosystem

### 4.1 Launch Set (Phase 1 — 8 tests, see Section 1.1 for reasoning)

| Test | Category | Why it's in launch, not later |
|---|---|---|
| Simple Reaction Time | Reaction | Highest-volume, most-linked keyword (22K/mo); the industry-standard comparison test — must exist for credibility |
| Choice Reaction Time | Reaction | Completes the Reaction cluster as a pillar-worthy category, not a single orphan test |
| Sequence Memory | Memory | HumanBenchmark's most-played memory test; direct competitive parity needed |
| Typing Speed Test | Typing | Second-highest search volume in the entire keyword universe; must launch even though competition is fierce, because organic + direct/repeat traffic (people bookmarking a typing test) is real regardless of rank |
| Click Speed Test (CPS) | Speed/Precision | Lowest technical complexity, meaningful search volume, low competition — fast SEO win while bigger clusters mature |
| Aim Trainer (Precision, single mode) | Speed/Precision | Differentiated audience (gaming), low domain competition ("aim trainer" ~3K/mo, low difficulty per PRD Section 17) |
| Matrix Reasoning | IQ | Enables the IQ cluster and feeds a distinct Skill Radar axis (Reasoning) — Cognitive Profile needs at least one non-reflex, non-memory data point at launch |
| Stroop Test | Focus | Feeds the Focus/Attention radar axis; well-known enough to have inherent search demand and shareability ("I failed the color test") |

This set deliberately touches all 6 Skill Radar axes (Reaction Speed, Memory, Processing Speed, Precision & Control, Focus & Attention, Reasoning) — the Cognitive Profile must be real from day one, not a Phase 2 retrofit, because it's the PRD's stated flagship moat (PRD Section 7).

### 4.2 Full Ecosystem (Phase 2+ expansion target)

**Reaction Suite**
- Simple Reaction, Choice Reaction, Audio Reaction, Peripheral Reaction, F1 Reflex Trainer, FPS-style Reflex Trainer

**Memory Suite**
- Sequence Memory, Number Memory, Verbal Memory, Visual Memory, Working Memory (n-back), Pattern Memory

**Focus Suite**
- Stroop Test, Sustained Attention (vigilance/lapses), Task Switching, Multi-Tasking Simulator

**IQ & Reasoning Suite**
- Matrix Reasoning, Mental Rotation, Logical Sequences, Processing Speed (symbol matching)

**Speed & Precision Suite**
- Click Speed (1s/5s/10s/30s/60s/100s variants), Spacebar Speed, Mouse Accuracy (static/moving/disappearing targets), Aim Trainer (challenge/precision/tracking/flick modes)

**Typing Suite**
- Typing Speed Test (WPM/CPM/accuracy), Typing Practice (guided drills by weak-finger/weak-key), Code Typing (developer-niche long-tail keyword opportunity, near-zero competition)

**Color/Perception Suite**
- Color Recognition Speed, Color Blindness Screener (high search volume, genuinely useful, easy to build — strong Phase 2 addition not in the original PRD list but cheap to add and high-intent traffic)

**Personality/Self-Report** *(deprioritized — see 4.3)*

### 4.3 What We Are NOT Building, and Why

The PRD's information architecture (user's Section 2 prompt) lists "Personality," "Critical Thinking," "Analytical Thinking," and "Creativity" as categories. These are cut from the roadmap through at least Phase 3:

- **Personality tests** are a different content genre (self-report questionnaires, not timed performance measurement) and pull the product identity away from "Human Performance Platform" toward ARealMe's quiz-farm model — exactly the competitor the PRD explicitly says it wants to differentiate from (PRD Section 3.2). Building this dilutes brand and Skill Radar coherence for traffic that doesn't feed the core loop.
- **"Critical Thinking," "Analytical Thinking," "Creativity"** as named categories don't correspond to a well-defined, buildable, timed test the way "Reasoning" or "Focus" do — they're marketing labels without a measurement design behind them yet. Rather than ship a vague test to check a box, we fold genuinely measurable sub-skills (logical sequences, matrix reasoning, decision-making-under-time) into the existing IQ & Reasoning axis, and revisit dedicated categories only if user research in Phase 4 shows demand for them specifically.

### 4.4 Per-Test Specification Template

Every test (launch or future) must ship with this spec filled out before implementation begins — this is the artifact an AI coding agent should be handed per test:

```
Test ID:              (kebab-case, permanent, used in URL + IndexedDB keys)
Category:             (maps to one Skill Radar axis)
Input mechanism:       (click / keypress / mouse move / touch)
Timing method:         performance.now() + requestAnimationFrame (Section 11.4 — non-negotiable)
Scoring formula:       (pure function, unit-tested independently of UI)
Percentile table:      (static, versioned JSON, build-time — Section 6.5)
Result screen shows:   score, percentile, personal best, delta vs. last attempt,
                       one-line "what this measures," CTA to related test/drill
Share card copy:       (auto-generated, Section 8.4)
Training drill:        (what "practice this" mode looks like, if applicable)
Min/max session time:  (used for engagement/session-duration analytics)
SEO target keyword(s): (primary + 2-3 long-tail, from Section 10.2 cluster map)
```

---

## 5. Unique Proprietary Features

These are the features that make this a "platform" rather than a folder of unrelated widgets — each one exists because it satisfies at least one of SEO / Retention / Engagement / Trust / Monetization / Moat (per the brief's own filter). Anything that didn't clear that bar was cut in Section 4.3 or below.

### 5.1 Skill Radar (Core — ships in Phase 1)

Hexagonal radar across the 6 axes: Reaction Speed, Memory Capacity, Processing Speed, Precision & Control, Focus & Attention, Reasoning Ability. Computed client-side from IndexedDB history using a rolling weighted average (recent attempts weighted higher — see Section 6.4 for the exact decay formula) so the radar reflects current ability, not lifetime average. **Justification filter:** Retention (gives users a reason to take a second, different test to "fill in" a thin axis) + Moat (requires cross-test data no single-test competitor has).

### 5.2 Cognitive Profile & "Cognitive Age" (Core — ships in Phase 1, gated behind 5+ completed tests)

Composite metric mapping Skill Radar performance to an age-equivalent benchmark, using published normative reaction-time/memory-span-by-age research as the reference curve (cited on `/methodology/`, not invented). **Ships with the trust requirement from Section 1.4**: the number is always shown next to a one-line methodology link and a disclaimer that this is a self-tracking/entertainment metric, not a clinical assessment. **Justification filter:** Retention + Trust + the PRD's own stated viral hook (Section 14.2).

### 5.3 Weakness Detection & Training Recommendations (Core — Phase 1)

Rules-based (deliberately not ML at launch — no training data exists yet, and a rules engine is auditable, fast, and sufficient): the two lowest-scoring Skill Radar axes are flagged, and the Dashboard surfaces "train this" links to the relevant test/drill. **Justification filter:** Retention (this is the mechanic that turns a one-time visitor into a return visitor — directly answers PRD pain point 4.2.3, "which skills should I train?").

### 5.4 Adaptive Difficulty (Phase 2)

Tests with a difficulty axis (Sequence Memory, Mouse Accuracy, Aim Trainer) adjust target size/speed/sequence length based on the user's rolling performance, so a returning user is neither bored nor frustrated. **Justification filter:** Engagement + Retention.

### 5.5 Progress Timeline & Skill Decay Tracking (Phase 2)

Line chart of score-over-time per test, plus a "skill decay" nudge (if a previously-strong skill hasn't been practiced in 14+ days, surface a gentle re-test prompt). **Justification filter:** Retention — this is what makes the streak/habit mechanic feel earned rather than arbitrary.

### 5.6 Progress Forecasting (Phase 3, evidence-gated)

Simple linear/logarithmic trend projection ("at your current improvement rate, you'll break 200ms by [date]"). **This ships only if Phase 2 data shows enough users have 10+ data points per test to make the forecast non-embarrassing** — a forecast built on 2 data points is a trust liability, not a feature. Do not build this early; it's listed here so it isn't reinvented ad hoc later.

### 5.7 Explicitly Rejected or Deferred

| Feature (from prompt/PRD) | Decision | Reason |
|---|---|---|
| Skill Relationships ("cross-insights between skills") | Deferred to Phase 4, evidence-gated | Requires real aggregate data across many users to say anything statistically defensible — premature at launch, risks being marketing fluff over substance |
| Full ML-personalized training | Rejected for v1, revisit post-Phase 3 | No training data exists yet; rules engine (5.3) covers 90% of the retention value at near-zero engineering cost |
| Community/social leaderboards at launch | Deferred to Phase 2 | Requires either accounts or a moderation-light anonymous system; ships alongside optional sync (Section 1.2) so it isn't a second identity system bolted on later |

---

## 6. Dashboard

### 6.1 Layout (client-hydrated, `noindex`, per PRD Section 9.1)

```
┌──────────────────────────────────────────────────────────┐
│  Header: streak flame · session count · [Dark/Light]      │
├───────────────────────────┬────────────────────────────────┤
│  SKILL RADAR (hexagon)     │  TODAY'S TRAINING PLAN         │
│  + weakest 2 axes labeled  │  1–3 recommended drills        │
│                            │  (Section 5.3 engine output)   │
├───────────────────────────┼────────────────────────────────┤
│  COGNITIVE PROFILE CARD    │  RECENT ACHIEVEMENTS           │
│  Cognitive Age + methodology│  Last 3 unlocked, icon row     │
│  link (Section 5.2)        │                                │
├───────────────────────────┴────────────────────────────────┤
│  PROGRESS TIMELINE — per-test line chart, 6-week default    │
├──────────────────────────────────────────────────────────┤
│  TEST CATEGORY GRID — quick-launch tiles, weak axes first    │
├──────────────────────────────────────────────────────────┤
│  STATS BAR — sessions · streak · best scores · [Export CSV] │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Section-by-Section Spec

| Section | Data source | Empty state (0 tests taken) | Retention mechanic |
|---|---|---|---|
| Skill Radar | IndexedDB, weighted rolling avg (6.4) | "Take 3 tests to unlock your radar" + CTA to weakest-covered category | Visual incompleteness nudges "fill the hexagon" |
| Today's Training Plan | Weakness Detection engine (5.3) | Generic starter plan (one test per axis) | Changes daily — reason to open dashboard daily |
| Cognitive Profile Card | Cognitive Age calc (5.2), gated at 5+ tests | Locked card with progress bar "2/5 tests to unlock" | Gamifies the unlock itself |
| Recent Achievements | Achievement engine (Section 7) | "No achievements yet" + easiest achievement highlighted | Near-miss framing ("1 more streak day for 🔥 3-Day badge") |
| Progress Timeline | IndexedDB history, per-test | Hidden until 2+ sessions of same test exist | Visualizes improvement — the core promise vs. HumanBenchmark |
| Category Grid | Static + weak-axis sort | All categories shown, no sort applied | Surfaces untried categories to widen data for the radar |
| Stats Bar | IndexedDB aggregate | Zeros shown plainly, no fake data | Export CSV = trust + data portability, costs nothing to build |

### 6.3 Why Every Section Exists

Nothing on this dashboard is decorative. Each section maps to a PRD pain point (Section 4.2): "I take the test once and forget" → Training Plan; "I want to know if I'm improving" → Timeline; "which skills should I train" → Radar + weakness detection; "I want to compare with friends" → deferred social features (5.7) but Export CSV ships now as the manual version of that.

### 6.4 Skill Score Weighting Formula (referenced by 5.1, 6.2)

```
weighted_score(axis) = Σ (score_i × decay(i)) / Σ decay(i)
decay(i) = 0.9 ^ (days_since_attempt_i / 7)
```
Most recent attempts dominate; a strong score from 3 months ago fades but never fully vanishes. This avoids two failure modes: a single lucky attempt permanently inflating a radar axis, and long-time-since-last-test users seeing a radar that ignores their history entirely.

### 6.5 Percentile Tables — Static, Not Live-Computed

Percentiles are precomputed at build time from a seed distribution (named, cited normative-data studies where they exist — e.g., Der & Deary-style age/reaction-time research, cited by author and year exactly as required in Section 9.7, not a vague "published studies" gesture — supplemented by aggregate anonymous data once Phase 2 sync produces enough volume) and shipped as a versioned static JSON per test. **This is a deliberate architecture decision, not a shortcut:** computing percentiles live against a live user database would require a backend and real-time aggregation the static-first architecture explicitly avoids (Section 2.1), and it would make every result page's compute cost scale with traffic — the opposite of what Cloudflare's free tier rewards. Revisit only when Phase 2+ sync data volume justifies a periodic (not live) recompute job.

Every result screen renders the user's score against this distribution as an actual bell-curve/histogram chart with the user's own result plotted on it — not a bare "You're in the 82nd percentile" number with no visual context (Section 1.7 Finding 4 identifies this specific chart type as a proven, worth-matching UX pattern from a live competitor).

---

## 7. Gamification System

### 7.1 Design Constraint: "Premium, Not Childish"

The PRD is explicit that this shouldn't read as a browser game (Section "UX Principles" in the prompt: Apple/Linear/Raycast/Stripe references, not a gaming skin). Gamification here means **visible progress and status**, not badges-for-badges'-sake. Concretely: no confetti-per-click, no cartoon mascots, no XP bars with garish gradients. Achievement unlocks are a quiet toast + a permanent entry in a clean list — closer to a Stripe dashboard "milestone reached" notification than a mobile game reward screen.

### 7.2 Systems, In Priority Order

| System | Ships | Mechanic |
|---|---|---|
| **Streaks** | Phase 1 | Consecutive days with ≥1 completed test. Shown as a single flame + number in the header, not a separate page. |
| **Achievements** | Phase 1 (launch set below) | Milestone-based, permanent, visible in Dashboard + Profile |
| **Personal Bests** | Phase 1 | Per-test, per-user, shown on every result screen ("New PB" or delta vs. existing PB) |
| **Levels/XP** | Phase 2 | Aggregate across all tests — a single "Overall Level" derived from total qualified sessions + skill breadth, not grindable by spamming one test (diminishing returns after 3 attempts/test/day counted toward XP) |
| **Leaderboards** | Phase 2, ships with sync (Section 1.2) | Anonymous handle + recovery code required to appear — no leaderboard entry without opting into the exact sync system that also protects their progress data |
| **Daily/Weekly Challenges** | Phase 2 | Fixed daily test+target combo, same for all users that day (server-defined via a simple static JSON updated by cron, not client-random) — enables "did you beat today's challenge" share content |
| **Seasonal/Community Events** | Phase 4, evidence-gated | Only after Phase 2 challenge data shows real engagement; do not build a events calendar system speculatively |

### 7.3 Launch Achievement Set (aligned to the 8 launch tests, Section 4.1)

- **Speed Demon** — Simple Reaction < 200ms
- **Sharp Recall** — Sequence Memory streak of 8+
- **Typing Pro** — Typing Speed 80+ WPM
- **Click Champion** — CPS 10+ (1s test)
- **Steady Hand** — Aim Trainer 90%+ accuracy
- **Pattern Solver** — Matrix Reasoning full set correct
- **Clear Mind** — Stroop Test <10% error rate
- **3-Day Streak / 7-Day Streak / 30-Day Streak** — consistency tier
- **Full Spectrum** — completed at least one test in all 6 Skill Radar axes (unlocks the Cognitive Profile — ties gamification directly to the core retention feature)

### 7.4 Why Not More at Launch

Every additional achievement is near-zero marginal engineering cost but non-zero design/QA cost (icon, copy, trigger condition, unit test). Nine achievements is enough to make the achievements page feel alive without being a content project in itself; expand per test as new tests ship, not in a separate "gamification sprint."

---

## 8. Brain Training System

### 8.1 The Loop This Section Implements

PRD Section 5.1 frames this as "Duolingo for Human Performance." Duolingo's actual retention mechanic isn't content depth — it's a daily, short, specific task with a visible reason to return. We replicate the mechanic, not the content format.

### 8.2 Daily Training Plan (Phase 1, simplified; Phase 2, full)

**Phase 1 version (rules-based, ships with launch):** On Dashboard load, Weakness Detection (5.3) selects the user's 2 lowest Skill Radar axes and surfaces one test from each as "today's plan" (2 items, ~3-5 minutes total — short by design, so it's completable in a single sitting rather than becoming a chore).

**Phase 2 version:** Adds a third slot — a "maintenance" rep of the user's strongest skill, framed as "keep your edge" — which both prevents skill-decay-driven disengagement (Section 5.5) and gives strong users a reason to open the plan even when they're already good at everything currently tested.

### 8.3 Practice/Drill Mode vs. Test Mode

Every test has two entry points: **Test Mode** (the canonical, percentile-scored, SEO-landing-page version — this is what's indexed and what the PRD's keyword strategy targets) and **Practice Mode** (untimed-pressure variant, repeatable, feeds the daily plan, does not count toward the public percentile comparison but does count toward the user's own Skill Radar). This distinction matters for SEO (the indexed URL must always show the standard test, not a randomized practice variant) and for UX (practice shouldn't feel like it's being judged the same way a benchmark attempt is).

### 8.4 Weekly Performance Review (Phase 2)

Auto-generated, once/week, client-side (no email required at launch — surfaced as a Dashboard card, with optional email digest once sync exists in Phase 2): "This week: 12 sessions, streak maintained, biggest improvement in Memory (+8%), suggested focus for next week." This is the retention layer that bridges daily streaks to the longer-horizon Progress Timeline (5.5/6.2).

### 8.5 What This System Deliberately Does Not Do

No push notifications, no email drip campaigns, and no "streak freeze" monetization at launch — these are retention patterns borrowed from mobile-game/subscription products and they cut against the PRD's own "clean, no-login, low-friction" positioning (PRD Section 5.3, "Anonymous-First Architecture"). Revisit notification-based retention only once the optional-account system (Section 1.2) exists, since it requires a channel (email/push) the anonymous-first architecture doesn't have.

---

## 9. SEO Strategy

### 9.1 Architecture Principle

SEO is not a Phase 3 activity bolted onto a finished product (as the original PRD's Phase 3 "SEO Blitz" framing implies) — every page shipped from Phase 1 onward is built to the same technical and content-depth standard. What genuinely phases is *volume* (few pages early, hundreds later), not *quality bar*.

### 9.2 Keyword Cluster Map (from PRD Section 10.1/17, reorganized into build-order priority)

| Cluster | Priority | Pillar URL | Rationale |
|---|---|---|---|
| Reaction Time | 1 | `/learn/reaction-time/` | Medium competition, medium volume (22K), fastest realistic path to page-1 for a new domain |
| Click Speed / CPS | 1 | `/learn/click-speed/` | Low-medium competition, decent volume, cluster includes many long-tail low-difficulty terms (Kohi click test, jitter click test) |
| Aim Trainer | 1 | `/learn/aim-training/` | Low competition (PRD Section 17: "Low" difficulty), distinct gaming audience |
| Memory Tests | 2 | `/learn/memory-test/` | Medium competition, broad volume (50K), slower but achievable |
| Typing Speed | 3 (long game) | `/learn/typing-speed/` | Highest volume (2.7M) but dominated by a 15+ year incumbent — treat as a multi-year play, not a launch win; still worth building because of direct/bookmark traffic regardless of rank |
| IQ / Reasoning | 3 | `/learn/iq-test/` | High competition, high volume, YMYL-adjacent (Section 1.4) — build carefully, don't rush |

### 9.3 Page Types and Their Jobs

| Page type | Example | Job | Indexed? |
|---|---|---|---|
| **Test page** | `/tests/reaction/simple/` | Convert search intent → tool usage. Contains the tool + a real "what this measures / how it's scored / average by age" content block (300-500 words minimum) below the fold — never a bare widget with no text | Yes |
| **Category pillar** | `/tests/reaction/` | Rank for the head term ("reaction time test"), link out to every sub-test and every relevant Learning Center article | Yes |
| **Learning Center pillar** | `/learn/reaction-time/` | Comprehensive (1500+ words), owns the topic, links to every supporting article and every relevant test | Yes |
| **Supporting article** | `/learn/reaction-time/average-reaction-time-by-age/` | Answers one specific long-tail query in depth (800-1200 words), links back to pillar + relevant test | Yes |
| **Comparison page** | `/compare/reaction-time-vs-age/` | Programmatic, but each instance must contain a genuinely distinct data table/chart (not reworded prose) — see 9.6 | Yes |
| **Glossary term** | `/learn/glossary/working-memory/` | Short (150-300 words), targets definitional queries, internally links heavily | Yes |
| **Dashboard/Profile/Settings** | `/dashboard/` | User utility only, zero unique crawlable content | No — `noindex` |

### 9.4 Thin Content Guardrail (directly answers Section 1.3)

A page is not allowed to ship if it fails any of these:
1. Contains at least one data point, chart, or fact not present on any other page of the site (no page is just a keyword-swapped copy of another).
2. Has a human (or AI-assisted-but-human-reviewed) editorial pass — no raw unedited template output ships.
3. Answers the query completely enough that a reader wouldn't need to click back to search results (this is literally Google's stated helpful-content bar, not an arbitrary internal rule).
4. Links to at least 2 other relevant pages on the site and is linked from at least 1 (no orphan pages — orphans don't get crawled or ranked).
5. **Reads as editorial writing first, keyword-matched second.** No exact-match keyword phrase repeats more than once per ~150 words of body copy. (Observed failure mode in a live competitor, Section 1.7: stacking phrases like "reaction time tester / test reaction time / reaction time checker" within a few sentences reads as SEO copy, depresses dwell time and share-worthiness even where it still ranks, and is a plausible target for future helpful-content-style scrutiny. If a sentence only exists to plant a keyword variant, cut the sentence.)

### 9.5 Content Template — Test Page (the unit that repeats 20+ times)

```
Byline: "Reviewed by [real name], [genuine one-line credential]" — see Section 1.7
Finding 3; every test and methodology page carries this, not just /about-us.

H1: [Test Name] — [primary keyword]
[Interactive test island — above the fold]
[Result/CTA area — result panel includes a distribution-curve chart with the
 user's own score overlaid against the population percentile table (Section 6.5),
 not just a bare percentile number — see Section 1.7 Finding 4]

## What is a [test name]?
2-3 sentences, plain language, no jargon.

## How is it scored?
Explain the metric (ms, WPM, accuracy %) and reference /methodology/.

## Average [test name] scores
Table or chart, segmented by relevant factor (age group / experience level) —
sourced from the static percentile table (Section 6.5), rendered as real content,
not just fed into the widget invisibly. Every benchmark claim cites a specific,
named, linkable source (study, author, year) — not a vague "studies show"
gesture (Section 1.7 Finding 4).

## What affects your measured score
Specific, category-relevant hardware/environment factors — not generic
lifestyle advice only. E.g.: reaction/aim tests → display refresh rate,
input polling rate, wired vs. wireless lag; typing → mechanical vs.
membrane keyboard latency; memory/focus tests → screen brightness/distraction
environment. (Section 1.7 Finding 5 — this is a genuinely useful content
pattern worth matching, not generic filler.)

## How to improve your [test name] score
3-5 concrete tips. Links to the relevant Practice Mode / drill.

## Frequently asked questions
3-5 Q&A pairs, sourced from actual "People Also Ask" / autocomplete data,
marked up with FAQPage schema (Section 9.7).

## Related tests
Internal links to 2-3 tests in the same or adjacent Skill Radar category.
```

### 9.6 Programmatic SEO — Comparison Pages (the highest-risk page type, per Section 1.3)


Template: `/compare/[test]-vs-age/`, `/compare/[test]-vs-profession/` (e.g., gamers vs. non-gamers on reaction time, using aggregated anonymous data once Phase 2 sync provides real segmentation — until then, sourced from cited external normative studies, never fabricated). Each generated page must have a **unique generated chart** (not a static image reused across pages) and **at least 150 words of page-specific analysis** auto-drafted from the underlying data differences, then human-reviewed before publish. Build the generation pipeline as: data → chart config → draft copy → review queue → publish — never data → publish directly. Rate of publishing is gated by review-queue throughput (Section 1.3), explicitly not by a fixed calendar sprint.

### 9.7 Schema & Metadata

- **Every test page:** `SoftwareApplication` or `Quiz`/`Game` schema (whichever Search Console validates cleanly for the page type) + `FAQPage` schema for the FAQ block + `BreadcrumbList`.
- **Every Learning Center article, methodology page, and benchmark-data page:** `Article` schema with a real `author` (name + `sameAs`/credential where applicable — see Section 1.7 Finding 3), `datePublished`, `dateModified`. No page carrying a scientific or benchmark claim ships with a blank or placeholder author field — this is a Phase 1 requirement, not a later E-E-A-T retrofit.
- **Every benchmark claim (age curves, sleep/fatigue effects, hardware-latency figures, etc.):** cites a specific, named, findable source inline (author, year, and a link where the source is public) — a floor set explicitly to match and exceed the sourcing rigor observed in a live competitor (Section 1.7 Finding 4). "Studies show..." with no named source does not clear review.
- **Cognitive Age / percentile claims:** never marked up as `MedicalWebPage` or health-claim schema — this content is explicitly framed as entertainment/self-tracking (Section 1.4), and mismarking it as medical content is both inaccurate and an AdSense health-content policy risk.
- **Meta titles:** `[Primary Keyword] — Free & Accurate | BrainBenchmarks` pattern, unique per page, generated from the per-test spec (Section 4.4), never templated identically across pages.
- **Canonical tags:** self-referencing on every indexed page; Practice Mode variants canonical to their parent Test Mode page (Section 8.3).

### 9.8 AI Overview / Answer Engine Optimization

Structure every Learning Center article and FAQ block so the direct answer appears in the first 1-2 sentences after the heading (the pattern AI Overviews and featured snippets both extract from), followed by supporting depth. Use descriptive `##`/`###` headings that match actual query phrasing (e.g., "How is reaction time measured?" as a literal heading, not "Measurement Methodology"). This is free — it's a writing discipline, not an additional system — and improves both traditional snippet capture and AI-search-engine citation likelihood.

### 9.9 Internal Linking Rules

- Every test page links to its category pillar and 2-3 sibling tests.
- Every Learning Center supporting article links up to its pillar and down to 1-2 relevant tests.
- The homepage links to every category pillar (never buries a category more than 1 click from home).
- No page should require more than 3 clicks from the homepage to reach (reinforces Section 3.2's flat-depth rule).

### 9.10 What Phase Actually Changes

| | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Test pages | 8, full content template | +12 (full ecosystem) | Maintenance/refresh |
| Learning Center pillars | 3 (Reaction, Click Speed, Aim) | +3 (Memory, Typing, IQ) | Depth expansion |
| Supporting articles | ~10 | ~40 | 100+ |
| Comparison pages | 0 | Pipeline built, ~20 published | Scale to 100-200, gated by 9.4/9.6 |
| Glossary | Stub, 10 terms | 40 terms | 100+ terms |

---

## 10. UX Principles

### 10.1 Reference Points, Translated Into Rules

"Apple/Linear/Raycast/Stripe" isn't a mood board note — it translates into concrete, checkable rules:

| Principle | Concrete rule |
|---|---|
| Minimal, not empty | Every screen has one primary action, visually dominant; secondary actions are visually quiet (ghost buttons, not competing colors) |
| Fast | Every test's *interactive* portion loads with zero perceptible delay — this is a Core Web Vitals requirement (Section 12), not just a feel |
| Restrained motion | Transitions are 150-250ms, ease-out, used for state changes only (result reveal, achievement unlock) — never decorative looping animation |
| Dark mode is first-class | Designed in both modes simultaneously, not dark-mode-as-CSS-filter; both themes ship at launch |
| Typography-led hierarchy | Hierarchy comes from type scale and spacing, not color or borders — a Stripe-dashboard trait specifically called out in the brief |
| One accent color | A single, deliberate accent used for CTAs and active states; everything else is neutral grayscale — avoids the "gaming site" rainbow-UI look the PRD explicitly wants to avoid |

### 10.2 Component System

Tailwind for utility styling, a small shared component library (Button, Card, Badge, Radar Chart, Result Panel, Ad Slot) used identically across all 20+ tests — no per-test bespoke styling. This is a retention *and* engineering-velocity decision: visual consistency across tests is what makes the product feel like a platform rather than a pile of widgets (directly addresses PRD Section 3.3's "no existing platform combines... modern, beautiful UI/UX" gap), and a shared component set is what makes adding test #21 take hours, not days.

### 10.3 Accessibility (non-negotiable, not aspirational)

WCAG 2.1 AA minimum: full keyboard operability for every test where physically sensible (reaction/typing tests are inherently pointer/keyboard-based; note in each test's spec, Section 4.4, if a test cannot be made keyboard-accessible and why), visible focus states, color contrast ≥4.5:1 for text, `prefers-reduced-motion` respected for all transitions, and screen-reader-announced result text (not purely visual score reveals). This is both an ethical baseline and a measurable Lighthouse score (Section 12).

### 10.4 Mobile-First, Not Mobile-Adapted

Every test is designed touch-first (the PRD explicitly flags "poor mobile experience" as a competitor weakness, Section 4.2.7). Reaction/click tests must debounce touch events correctly (a known bug class where touch fires both `touchstart` and a synthetic `click`, double-counting fast clicks) — call this out explicitly in QA for every touch-based test.

---

## 11. Technical Architecture

### 11.1 Stack Decision Table

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro | Static-first HTML output, per-component hydration, best-in-class SEO defaults (PRD Section confirmed correct in Section 1.5) |
| Interactive islands | React (with `client:visible` or `client:idle`, never `client:load` by default) | Team familiarity + largest ecosystem (charts, state libs); islands keep per-page JS scoped to only what's interactive |
| Styling | Tailwind CSS | Speed of iteration for an AI-assisted build process; consistent design tokens (Section 10.2) |
| Charts | A lightweight SVG-based chart lib (e.g., a minimal Recharts subset) loaded only on Dashboard/result pages, never on the initial test page bundle | Keeps test-page JS payload minimal — charts aren't needed until after a result exists |
| Client storage | localStorage (settings, flags, small counters) + IndexedDB via a thin wrapper (session history, time-series data) | localStorage is synchronous and fine for tiny data; IndexedDB is required once history grows past a few hundred entries per user (Section 11.5) |
| Hosting | Cloudflare Pages | Free tier, global CDN, native Astro support (PRD Section confirmed correct) |
| Sync backend (Phase 2+) | Cloudflare Worker + D1 (SQLite at the edge) | Stays inside the Cloudflare ecosystem already in use; D1's free tier comfortably covers early-stage volume; avoids standing up a separate database provider |
| Build-time data | Static JSON (percentile tables, keyword cluster manifests, achievement definitions) generated by scripts, committed to repo, consumed by Astro at build time | Keeps the entire test-scoring path servable from a CDN with zero runtime compute (Section 6.5) |

### 11.2 Repository Structure

```
/src
  /components
    /ui/              (Button, Card, Badge, RadarChart, AdSlot — shared, Section 10.2)
    /tests/           (one folder per test, e.g. /simple-reaction/)
      ReactionTest.tsx
      scoring.ts       (pure function, unit tested independently)
      spec.md          (filled per-test template, Section 4.4)
  /runtime
    TestStateMachine.ts   (shared idle→countdown→running→result engine, Section 2.2)
    dataLayer.ts          (IndexedDB/localStorage wrapper, Section 11.5)
    skillRadar.ts         (weighting formula, Section 6.4)
    trainingEngine.ts     (weakness detection + recommendations, Section 5.3)
  /content
    /learn/           (MDX articles — pillars + supporting, Section 9)
    /compare/         (programmatic page data + generation pipeline, Section 9.6)
    /glossary/
  /data
    percentiles/      (versioned static JSON per test, Section 6.5)
    achievements.json (Section 7.3 definitions)
    keywordClusters.json (Section 9.2, drives meta generation)
  /pages
    /tests/[category]/[test]/index.astro
    /learn/...
    /compare/[slug].astro
    /dashboard/...     (client-only shell)
/workers
  /sync                (Cloudflare Worker, Phase 2+, Section 1.2)
/scripts
  generate-comparison-pages.ts
  generate-percentiles.ts
  lighthouse-ci.ts
```

### 11.3 Test State Machine (shared engine, referenced throughout)

Every test implements the same four states so that shared UI (countdown overlay, result panel, share-card generation) works identically across all 20+ tests instead of being reimplemented per test:

```
idle → (user starts) → countdown → (countdown ends) → running → (test-specific completion condition) → result
```

Test-specific logic only owns: what happens during `running`, and the pure scoring function applied at the `running → result` transition. Everything else (timer display, result panel layout, share card, IndexedDB write) is shared runtime code.

### 11.4 Timing Precision Requirement (non-negotiable — see Section 1.6)

- All elapsed-time measurement uses `performance.now()`, never `Date.now()` (subject to system clock adjustment) or `setTimeout` delay assumptions (not guaranteed accurate to the millisecond, especially under load).
- Visual stimulus changes (e.g., reaction-time color change) are synced to `requestAnimationFrame`, not a raw timer callback, to align with actual paint timing.
- Every test's scoring function is unit-tested against synthetic input with known expected timing to catch regressions before they ship as "the site's numbers don't match HumanBenchmark" complaints.

### 11.5 Client Data Layer — Schema

```ts
// IndexedDB: one object store, indexed by testId + timestamp
interface SessionRecord {
  id: string;            // uuid
  testId: string;        // e.g. "reaction-simple"
  category: SkillAxis;   // one of the 6 Skill Radar axes
  timestamp: number;
  rawScore: number;
  normalizedScore: number;  // 0-100, comparable across tests within a category
  percentile: number;       // looked up from static table at write time
  metadata: Record<string, unknown>; // test-specific (e.g., accuracy %, sequence length)
}

// localStorage: small, synchronous, non-history data
interface UserSettings {
  theme: 'light' | 'dark';
  streakCount: number;
  lastActiveDate: string;      // ISO date, drives streak logic
  syncRecoveryCode?: string;   // only if Phase 2 sync opted in
  dismissedNudges: string[];   // e.g., "cognitive-profile-locked-card"
}
```

All reads for Dashboard/Radar/Timeline hit IndexedDB; all reads for streak/theme/settings hit localStorage. This split exists because localStorage is synchronous (fine for tiny, frequently-read flags) while IndexedDB is async and appropriate for the larger, less-frequently-read history dataset — mixing them the other way around either blocks the main thread (large data in localStorage) or adds unnecessary async overhead (tiny flags in IndexedDB).

### 11.6 Performance Budgets (enforced in CI, not aspirational — see Section 13 for full targets)

- Initial HTML payload per test page: no JS required to render the readable content block (Section 9.5 template) — this content must be visible with JS disabled.
- Interactive island JS (per test): budget ceiling of ~50KB gzipped; anything larger triggers a design review before merge.
- No render-blocking third-party scripts above the fold — AdSense loads lazily (Section 12.3).

---

## 12. Monetization

### 12.1 Primary: Google AdSense

Ad placements are designed around a hard rule: **no ad may cause layout shift, and no ad may be placed between a user and their test result.** Concretely:

| Placement | Position | CLS mitigation |
|---|---|---|
| Header banner | Above nav, below top of viewport | Fixed-height reserved container, rendered even before ad loads |
| In-content (Learning Center only) | After 2nd `##` section, never inside the interactive test area | Reserved container, lazy-loaded on scroll-into-view |
| Result-page sidebar/below-fold | Only after the score/result panel is visible | Never placed where it could be mistaken for a "next test" button |
| **Never:** interstitials between test start and result | — | Explicitly rejected — this is the exact "ad-heavy" complaint the PRD identifies as CPSTest.org's core weakness (PRD Section 3.2) |

### 12.2 AdSense Approval Path (Phase 1 exit criterion, not a Phase 2 activity)

Per the platform's own account history context: approval requires genuine content depth (not just tools — the content blocks in Section 9.5 exist partly for this reason), the four required legal pages (`/privacy/`, `/terms/`, `/about/`, `/contact/`), and a minimum organic traffic baseline before applying. **Do not apply for AdSense until the site has the 8 launch tests, 3 Learning Center pillars, and the legal pages live and indexed** — applying too early with thin content risks a rejection that can slow future re-application.

### 12.3 Ad Loading Strategy (ties directly to Section 11.6 performance budget)

AdSense script loads with `loading="lazy"` semantics and is deferred until after the interactive test island has hydrated — ads never compete with the test itself for the main thread on page load. This is a monetization decision that protects the product experience the PRD says is the differentiator (Section 5.2's "clean AdSense integration without ad bloat").

### 12.4 Secondary: Affiliate (Phase 2+)

Given the actual audience overlap (competitive gamers taking Aim Trainer/CPS tests, typists taking the Typing Speed test), the highest-relevance affiliate category is **gaming peripherals and mechanical keyboards** (mice, keyboards, monitors with high refresh rates) — not a generic affiliate network. This is a stronger fit than the PRD's vague "affiliate partnerships" line because it matches actual purchase intent already present in the traffic (someone benchmarking their CPS score is a plausible peripheral buyer), rather than bolting on an unrelated vertical.

### 12.5 Tertiary: Premium Tier (Phase 4+, evidence-gated)

Not built until Phase 4, and only if Phase 2-3 data shows a meaningful fraction of returning users hitting a real limit in the free tier (e.g., wanting longer history retention, advanced export, ad-free). Building a premium tier before there's evidence of what users would pay for risks building the wrong paywall — the PRD's own Section 15 risk table flags "AdSense policy changes" as a reason to diversify revenue, which is valid, but the sequencing should be evidence-first, not calendar-first (same principle applied in Section 1.3 to programmatic SEO).

### 12.6 What We Are Not Doing

No pop-ups, no email-gated content, no "watch an ad to see your result" patterns. These would measurably increase short-term RPM and measurably damage the retention mechanics that are this product's actual moat (Sections 5-8) — a bad trade given the PRD's own framing of AdSense as sustained-over-time revenue, not one-time extraction.

---

## 13. Performance Targets

### 13.1 Lighthouse Budgets (CI-enforced on every PR touching `/pages` or `/components`)

| Metric | Target | Hard floor (blocks merge) |
|---|---|---|
| Performance | 95+ | 90 |
| Accessibility | 100 | 95 |
| Best Practices | 100 | 95 |
| SEO | 100 | 100 (no exceptions — this is the entire growth channel) |
| LCP (Largest Contentful Paint) | < 1.2s | < 2.0s |
| CLS (Cumulative Layout Shift) | < 0.02 | < 0.1 |
| INP (Interaction to Next Paint) | < 100ms | < 200ms |
| Total JS per test page | < 50KB gzipped | < 100KB gzipped |

### 13.2 Why SEO Score Is a Hard 100, Not a Soft Target

Every other metric has a range because real-world tradeoffs exist (a rich interactive test may cost a few performance points). SEO score has zero excuse to miss 100 — missing meta descriptions, missing alt text, or broken canonical tags are pure oversights, not tradeoffs, and this product's entire acquisition channel is organic search (Section 9.1). A CI check that fails the build on any SEO audit regression is mandatory, not optional.

### 13.3 Monitoring Post-Launch

Real User Monitoring (Cloudflare Web Analytics — free, privacy-respecting, no cookie banner required) tracks actual field CWV data per page template, not just lab Lighthouse scores. Field data on the highest-traffic test pages (Reaction, Typing per Section 9.2) is reviewed monthly; any template-wide regression is a Phase-blocking bug, not backlog.

---

## 14. Development Phases

### Phase 1 — Foundation (Weeks 1–5)

**Objective:** Ship a coherent, complete-loop product — not a partial one. "Coherent" means the Cognitive Profile is real from day one (Section 1.1).

**Deliverables:**
- Astro + Cloudflare Pages project scaffolded, CI with Lighthouse budgets wired in (Section 13.1)
- Shared Test State Machine + Client Data Layer (Section 11.3, 11.5)
- 8 launch tests, fully spec'd per Section 4.4, covering all 6 Skill Radar axes (Section 4.1)
- Skill Radar, Cognitive Profile (gated at 5 tests), Weakness Detection (Section 5.1–5.3)
- Dashboard v1 (Section 6, minus Progress Timeline which needs history depth)
- 9 launch achievements + streak system (Section 7.3)
- Daily Training Plan v1 (rules-based, Section 8.2)
- 3 Learning Center pillars (Reaction, Click Speed, Aim) + ~10 supporting articles (Section 9.10)
- 4 legal pages + `/methodology/`
- AdSense application submitted once traffic baseline + content bar is met (Section 12.2)

**Exit criteria:** All 8 tests pass Lighthouse hard floors (13.1); Cognitive Profile produces a real, non-placeholder result for a test user who completes all 8 tests; AdSense approved or resubmission plan in place; site indexed in Google Search Console with zero critical coverage errors.

**Dependencies:** None (this is the first phase).

**Risks:** AdSense rejection on first pass (mitigation: Section 12.2's pre-application checklist); timing-precision bugs discovered late (mitigation: Section 11.4's unit-testing requirement applied from test #1, not retrofitted).

### Phase 2 — Expansion (Weeks 6–12)

**Objective:** Widen the ecosystem and close the retention gap identified in Section 1.2 (sync).

**Deliverables:**
- Remaining tests from the full ecosystem (Section 4.2) — prioritize by cluster priority (Section 9.2)
- Optional sync (Cloudflare Worker + D1, Section 1.2, 11.1)
- Progress Timeline, Skill Decay nudges (Section 5.5)
- Adaptive Difficulty (Section 5.4)
- Levels/XP, Daily/Weekly Challenges, Leaderboards (Section 7.2, gated on sync existing)
- Weekly Performance Review (Section 8.4)
- 3 more Learning Center pillars (Memory, Typing, IQ) + ~30 more supporting articles
- Comparison page generation pipeline built (Section 9.6) — publish first ~20 pages through the full review-queue process

**Exit criteria:** Sync opt-in works end-to-end with a real recovery-code flow tested by someone other than the builder; every published comparison page passes the Section 9.4 thin-content guardrail (spot-audit at least 20%); at least one keyword cluster (Section 9.2) shows measurable ranking movement in Search Console.

**Dependencies:** Phase 1's Client Data Layer and Test State Machine (nothing here should require refactoring Phase 1's core runtime).

**Risks:** Sync introduces the project's first real backend surface — auth-adjacent bugs (recovery code collision, data merge conflicts) need explicit test cases, not just happy-path testing.

### Phase 3 — SEO & Content Scale (Months 4–6, evidence-gated pace)

**Objective:** Scale content volume without breaching the quality bar — throughput-gated per Section 1.3, not calendar-gated.

**Deliverables:**
- Comparison pages scaled toward 100-200, strictly through the review-queue pipeline built in Phase 2
- Glossary expanded to 100+ terms
- Internal linking audit (Section 9.9) — no orphan pages
- First real A/B tests on ad placement (Section 12.1) using accumulated RUM data (Section 13.3)
- Progress Forecasting (Section 5.6) — only if data volume justifies it

**Exit criteria:** Organic traffic shows sustained month-over-month growth (not a one-time spike); no Search Console manual action or algorithmic traffic drop correlated with the content scale-up (if this happens, the response is to pause publishing and audit, not push through).

**Dependencies:** Phase 2's review-queue pipeline must be functioning, not just designed.

**Risks:** This is the phase most exposed to the PRD's own top-listed risk (Google algorithm update, Section 15) — mitigation is architectural (Section 9.4) and behavioral (pace gated by quality, Section 1.3), not something added at this phase.

### Phase 4 — Optimization & Diversified Monetization (Months 7–12)

**Objective:** Turn accumulated data into decisions — this phase is defined by what Phase 1-3 data says is worth building, not a pre-committed feature list.

**Candidate deliverables (each gated on evidence from earlier phases, per Section 5.7 and 12.5):**
- Premium tier, only if usage data shows real demand for specific gated features (Section 12.5)
- Skill Relationships / cross-insights (Section 5.7), only with enough aggregate data to be statistically real
- Affiliate program live (Section 12.4)
- Seasonal/community events (Section 7.2), only if challenge engagement data supports it
- Translated (i18n) versions of proven pillar content (Section 1.7 Finding 6) — only for pages that have already demonstrated ranking and engagement in English; translating unproven content multiplies a mistake rather than a win

**Exit criteria:** Defined per-candidate at the start of the phase based on Phase 1-3 data — this phase does not get a fixed exit checklist today, because committing to one now would repeat the exact "calendar over evidence" mistake corrected in Section 1.3.

---

## 15. Risk Analysis

| Risk | Category | Probability | Impact | Mitigation |
|---|---|---|---|---|
| Google algorithm/helpful-content update penalizes scaled content | SEO | High (treat as near-certain, not "medium" per Section 1.3) | High | Thin-content guardrail (9.4), throughput-gated publishing (1.3), never calendar-gated |
| AdSense rejection or policy action on health/cognitive-adjacent claims | Monetization/Trust | Medium | High | Methodology transparency + disclaimers (1.4, 9.7); never mark up score claims as medical content |
| Established competitors (HumanBenchmark, TypingTest.com) modernize before we gain traction | Competition | Medium | Medium | Differentiate on the loop (measure→train→track), not on copying their content; ship Cognitive Profile as a real moat from Phase 1, not a later differentiator |
| Smaller, single-vertical SEO-first competitors (e.g., reactiontimetesting.com — Section 1.7) out-execute us on content depth/citations within one cluster before our ecosystem advantage compounds | Competition/SEO | Medium | Low-Medium | Match their content rigor (named citations, hardware-factor detail) as a floor per test page (9.5, 9.7); win on cross-skill Cognitive Profile they structurally cannot replicate, not on out-blogging a single-vertical site |
| Timing-precision bugs undermine credibility of scores | Technical/Trust | Medium | High | `performance.now()`/`rAF` requirement is non-negotiable and unit-tested from test #1 (11.4) |
| Data loss (cleared cache/new device) causes churn at exactly the users retention features target | Product | High absent mitigation | High | Optional sync moved to Phase 2 requirement, not "future" (1.2) |
| Programmatic comparison pages ship with duplicate/thin content | SEO | High absent guardrail | High | Mandatory unique-data-point + human-review-queue requirement (9.6) — no direct data→publish path exists in the pipeline |
| Ad placement harms Core Web Vitals / user trust | Monetization/Product | Medium | Medium | Reserved-space, lazy-loaded ad slots; hard CLS budget enforced in CI (12.3, 13.1) |
| Feature bloat slows Phase 1 shipping (20+ tests, "critical thinking," "personality" categories) | Execution | High absent correction | Medium | Launch set cut to 8 (1.1, 4.1); speculative categories explicitly deferred/rejected (4.3) |
| Cognitive Age / percentile claims perceived as pseudo-scientific | Trust | Medium | Medium | Cited normative-data methodology, visible disclaimer in the same viewport as the claim, no invented statistics (1.4, 5.2) |
| Solo/small-team maintenance burden as test count scales | Maintainability | Medium | Medium | Shared Test State Machine + component system (2.2, 11.3, 10.2) — adding test #21 is hours, not a bespoke build |

---

## 16. Summary — What an Engineer Should Do First

1. Read Section 1 in full — it changes defaults elsewhere in this document.
2. Scaffold the repo per Section 11.2.
3. Build the Test State Machine, Client Data Layer, and Scoring Engine (Sections 11.3, 11.5, 2.2) before building a single test UI — every test depends on these three pieces existing and being stable first.
4. Build the 8 launch tests from Section 4.1, each against the per-test spec template in Section 4.4.
5. Wire up Skill Radar → Cognitive Profile → Weakness Detection (Section 5) as soon as 2+ tests exist, so the cross-test loop is validated early, not assumed to work at the end.
6. Ship Dashboard v1 (Section 6), 3 Learning Center pillars (Section 9), legal pages, then apply for AdSense (Section 12.2).
7. Do not start Phase 2 (Section 14) until Phase 1's exit criteria are actually met — the phases in this document are sequential gates, not a Gantt chart.
