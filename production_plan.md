# Production Plan — BrainBenchmarks

**Status:** Master production document
**Source of truth:** PLAN.md + PRD.md + imp_features.md + competitors.md + codebase audit
**Last updated:** 2026-07-06

---

## 1. Competitive Moat (What Makes This Unbeatable)

| Competitor | Their Strength | Their Weakness | Our Exploit |
|---|---|---|---|
| **HumanBenchmark** (3M/mo) | Brand authority, 10+ years | 8 tests, no tracking, dated UI, no dark mode | **14 tests + BBI + Radar + Training Plan** |
| **reactiontimetesting.com** (live) | Named citations, hardware content, 7 languages | Single vertical (reaction only), no cross-skill profile | **Cognitive Profile across 6 axes they structurally cannot build** |
| **Monkeytype** (typing cult) | Best typing UX | Typing only | **We don't compete on typing — it's one axis of 6** |
| **CPSTest.org** (2.3M/mo) | CPS keyword dominance | Ad-bloated, slow, ugly | **Clean, fast, premium experience — same traffic intent** |
| **Lumosity** (paywalled) | Science brand, large game library | $11.99/mo, mandatory login | **Free, anonymous, instant-play — no friction** |
| **ARealMe.com** (viral quizzes) | Social share loops | Quiz farm, no real measurement | **Real performance data, share cards + challenge URLs** |

### The Moat — 5 Layers Deep

1. **Data moat**: Cross-skill Cognitive Profile (BBI) requires users to take multiple tests — single-test competitors cannot replicate this
2. **Technical moat**: `performance.now()` + `requestAnimationFrame` timing precision + hardware calibration — amateur sites using `setTimeout` produce wrong numbers
3. **UX moat**: Premium dark/light theme, glassmorphism, micro-interactions, responsive — all competitors look dated
4. **Virality moat**: Share cards + challenge-a-friend URLs — zero-login sharing drives Discord/Reddit/Twitter traffic
5. **Retention moat**: Local-first streaks + daily training plan + progress timeline — gives users a reason to return that no single-test site offers

---

## 2. Flagship Test: "The Gauntlet"

**What**: A 5-minute sequential multi-test that tests Reaction → Memory → Focus → Logic → Precision in one session. Outputs a unified "BrainBenchmarks Index" + "Performance Archetype" (e.g., "Rapid Reactor", "Pattern Hunter", "Precision Thinker").

**Why it's the differentiator**: No competitor has this. It's the single feature that makes this not a clone.

**Implementation** (per imp_features.md §1 + PLAN.md §4):

```
Route: /gauntlet/
Component: src/components/tests/GauntletTest.tsx
State machine: idle → reaction(5 trials) → memory(sequence) → 
               focus(stroop) → logic(matrix) → precision(aim) → result
Duration: ~5 minutes total
Output: BBI score, archetype, per-category breakdown, share card
```

The gauntlet reuses existing test logic (reaction, sequence memory, stroop, pattern reasoning, aim trainer) but runs them sequentially in one session with a unified results page.

### Onboarding Funnel

Instead of asking new users "choose a test," the homepage funnels them:

```
Homepage
  ↓
"The BrainBenchmarks Challenge" — CTA
  ↓
Gauntlet (5-min multi-test)
  ↓
Brain Profile + BBI Score + Archetype
  ↓
Dashboard unlocked → Recommendations → Share card
```

This creates a clear user journey and a recognizable flagship experience.

---

## 2b. User Retention Loop

**Problem**: Users take the Gauntlet once, get their profile, and leave.

**Solution**: A recurring content cycle that answers "why should I come back?":

| Frequency | Feature | Data Source | Effort |
|---|---|---|---|
| Daily | **Today's Challenge** — fixed daily test+target combo | `trainingEngine.ts` already generates this | Already built |
| Daily | **Streak counter** — consecutive days with a completed test | `dataLayer.ts` tracks `lastActiveDate` | Already built |
| Weekly | **Weekly Brain Report** — auto-generated summary: sessions logged, streak status, biggest improvement, weakest skill | IndexedDB aggregate + `skillRadar.ts` | ~4h (new Dashboard card + notification) |
| Monthly | **Monthly Performance Review** — trend lines, skill evolution, personal bests updated, recommended focus for next month | Same data source | ~6h (reuses Weekly template with longer time window) |

**Phase 0/1 delivers**: Daily challenge + streak (already built). Weekly Report card on Dashboard.
**Phase 2 delivers**: Monthly Review as a dedicated page with exportable PDF.

---

## 2c. Traffic & Distribution Channels

The plan's original assumption was SEO → Traffic → Revenue. Diversification reduces risk:

| Channel | Mechanic | Effort | Impact |
|---|---|---|---|
| **SEO** (primary) | Learning Center pillars + glossary + comparison pages + FAQ schema | Phase 2 | HIGH — sustained organic growth |
| **Discord/Reddit** | Share cards + challenge links: users post results, others try to beat them | Phase 0 (already built) | HIGH — viral loop |
| **Twitter/X** | Share cards auto-generated with score + percentile + challenge URL | Phase 0 (already built) | MEDIUM — influencers |
| **YouTube Shorts / TikTok** | Creators record gauntlet runs, share challenge links. Add "Streamer Mode" (fullscreen, minimal UI, OBS-friendly) in Phase 3 | Phase 3 candidate | HIGH — creator-driven |
| **Direct / Bookmark** | Typing test, reaction test users bookmark the site and return | Phase 0 (already works) | MEDIUM — compounding |

---

## 3. Execution Phases

### Phase 0 — Foundation Fix (Week 1, ~5 days)

**Objective**: Make the app usable in both themes, verify it builds, verify scores are correct.

| # | Task | Files | Verification |
|---|---|---|---|
| 0.1 | **Fix light mode globally**: Replace `text-white` → `text-foreground`, `bg-zinc-950/900` → `bg-subtle`/`bg-panel` across all 14 .tsx components + CognitiveProfile.tsx + all Astro pages | 20+ files (~250 replacements) | Visual check: every page renders readable text in light mode. No invisible text. |
| 0.2 | **Stabilize build**: Run `rm -rf node_modules && npm install --legacy-peer-deps && npm run build` on clean clone. Pin Vite version. | package.json, lockfile | Build produces 22+ static pages with zero errors, zero warnings |
| 0.3 | **Write scoring unit tests**: Each of 8 core launch tests (Reaction, Choice Reaction, F1 Lights, Sound Reaction, CPS, Aim Trainer, Sequence Memory, Stroop) gets `*.test.ts` with known-input → expected-output | `src/components/tests/*.test.ts` (8 new files) | `npx vitest run` passes all tests. Each scoring function tested against 5+ known inputs. |
| 0.4 | **Verify all 14 tests work**: Manual QA pass — play each test on desktop + mobile, verify score saves to IndexedDB, verify dashboard reflects it | All test pages | Every test completes without console errors. Scores persist to localStorage. |
| 0.5 | **Run Lighthouse on 8 launch test pages + homepage + dashboard**: Fix below-threshold items | CSS/JS optimization | All pages ≥90 Performance, ≥95 Accessibility, 100 SEO (hard floor per PLAN.md §13.1) |
| 0.6 | **Promote browser calibration**: Move calibration result (refresh rate, device type, input method) to a visible top-of-page banner on every test page. Already built in `calibration.ts` — just needs UI placement. | All test pages | Every test page shows hardware context. Users see "144Hz — ~6.9ms expected lag" before testing. |
| 0.7 | **Reframe Dashboard → Performance HQ**: Reorganize the Dashboard layout to answer 5 questions: (1) How am I improving? (2) What should I practice? (3) Where am I weak? (4) What changed? (5) What should I do next? Existing data (BBI, radar, recommendations, timeline) covers all 5 — just needs layout/copy changes. | `CognitiveProfile.tsx` + `dashboard/index.astro` | Dashboard answers all 5 questions without requiring a second click. |

### Phase 1 — Flagship + E-E-A-T (Week 2-3, ~8 days)

**Objective**: Build the differentiator, establish trust signals, add SEO-optimized content to every test page.

| # | Task | Impact | Detail | Verification |
|---|---|---|---|---|
| 1.1 | **Build The Gauntlet**: Multi-test sequential assessment | HIGH — flagship differentiator | New component + page. Reuses existing test engines. Outputs BBI + archetype + share card. | Complete full gauntlet run. Verify BBI matches manual calculation. |
| 1.2 | **Add real E-E-A-T signal**: Create `/about/` with real author bio + credential. Add byline component ("Written by [name], [credential]") to methodology page and every test page. | HIGH — AdSense/trust requirement | `src/pages/about/index.astro` updated. New byline Astro component. All test pages + methodology page show byline. | Every benchmark-carrying page has a named author with one-line credential. No placeholder or fabricated names. |
| 1.3 | **Add hardware factor content blocks**: "What affects your measured score" section on every test page (PLAN.md §9.5 template requirement) | MEDIUM — unique content, thin-content guardrail | Per-test hardware factors: refresh rate, input latency, DPI, keyboard type, headphone latency, etc. | Every test page has a unique content block not duplicated on any other page. |
| 1.4 | **Add FAQPage JSON-LD schema with real PAA data to every test page**: 3-5 Q&A pairs per test, sourced from actual "People Also Ask" / autocomplete data | HIGH — rich snippet eligibility | Schema injected via layout or per-page frontmatter | Google Rich Results Test validates all FAQ schemas. |
| 1.5 | **Add Weekly Brain Report card to Dashboard**: Auto-generated summary of sessions, streak, biggest improvement, weakest skill. All data already in IndexedDB. | HIGH — retention | New Dashboard card. ~4h. | Weekly Report renders for users with 3+ sessions in the past 7 days. |

### Phase 2 — Content Depth (Week 3-4, ~7 days)

**Objective**: Build the content layer that Google ranks and AdSense approves.

| # | Task | Detail | Content Bar |
|---|---|---|---|
| 2.1 | **Expand 4 Learning Center pillars** to 1000-2000 words each with named citations. Structure each cluster as a hub with supporting articles: e.g. Reaction pillar → "How Reaction Time Works" → "Average by Age" → "Mouse Latency" → "Refresh Rate" → "Sleep/Caffeine Effects" → "Training Drills" | Reaction, Click Speed, Aim, Memory clusters | Every claim cites specific study (author, year, link). No vague "studies show" gestures. |
| 2.2 | **Write 10 supporting articles** (800-1200 words, long-tail keyword targets) | Target clusters per PLAN.md §9.2 priority | Each has unique data point + internal links to pillar + test page |
| 2.3 | **Elevate Pattern Recognition**: Promote PatternReasoningTest to first-class sidebar category alongside Reaction and Memory. Add dedicated `/learn/pattern-recognition/` pillar page. High search volume, high engagement category. | Sidebar nav + new pillar page + homepage placement | Pattern Reasoning appears as primary nav item. Pillar page ranks for "pattern recognition test" keywords. |
| 2.4 | **Build glossary hub + 50 term pages** (150-300 words each) | `/learn/glossary/` + per-term pages | Definitional schema markup, heavy internal linking |
| 2.5 | **Create 10 programmatic comparison pages** with unique generated charts | `/compare/reaction-time-by-age/`, etc. | 150+ words page-specific analysis + unique SVG chart per PLAN.md §9.6 |
| 2.6 | **Data moat foundation**: Once sync (Phase 2) produces aggregate data, publish "Average scores by age/country/device/refresh rate" pages. These use real user data (anonymous, aggregated) that no competitor can replicate without equivalent usage. | `/data/` pages (Phase 4 candidate) | Aggregate data pages published. Dataset becomes the durable competitive moat. |

### Phase 3 — Production Polish (Week 4-5, ~6 days)

**Objective**: Eliminate all UX friction, ensure mobile quality, prepare for traffic.

| # | Task | Detail | Verification |
|---|---|---|---|
| 3.1 | **Mobile touch debounce**: Fix touch events on CPS, Aim Trainer, Reaction tests where taps can double-count | PLAN.md §10.4 requirement | Touch test on mobile device: single tap = single count |
| 3.2 | **Internal linking audit**: No orphan pages. Every page linked from 2+ others. Max 3 clicks from homepage. | PLAN.md §9.9 | Scripted crawl reports zero orphan pages |
| 3.3 | **Accessibility pass**: Keyboard nav on all test pages, ARIA labels on icon buttons, focus management, `prefers-reduced-motion` | WCAG 2.1 AA per PLAN.md §10.3 | Tab through every page — full keyboard operability |
| 3.4 | **Reserved ad slot containers** with CLS-safe fixed heights, lazy-loaded after test completion | PLAN.md §12.3 | Lighthouse CLS < 0.1 with ads loaded. Ads never appear before test result. |
| 3.6 | **Streamer Mode / OBS-friendly layout**: Fullscreen toggle, minimal UI mode that hides navigation, auto-hide cursor during tests. Enables creators to stream gauntlet runs and share challenge URLs. | `main.astro` + new CSS class | Fullscreen API + `.streamer-mode` CSS that hides sidebar/nav/footer. OBS window capture shows only the test. |

### Phase 4 — AdSense Readiness (Week 5-6)

**Objective**: Meet AdSense approval criteria and apply.

| # | Task | Detail | Criteria |
|---|---|---|---|---|
| 4.1 | **Content audit for AdSense policies**: Scan all pages for health claims, YMYL-adjacent language, insufficient content | PRD §1.4, PLAN §12.2 | No medical claims. No "cognitive age" without disclaimer. No predictive improvement claims. |
| 4.2 | **Wait for content maturity**: Apply when Phase 2 content is published and site has been live long enough to develop an organic presence. Traffic helps approval odds but is not a formal AdSense requirement. | Site has been live 3+ months with consistent content | Organic traffic baseline established. |
| 4.3 | **Apply for AdSense** | Only after content maturity + indexation verified | Approval or resubmission plan documented per PLAN.md §12.2 |

---

## 4. Design System Standards (from UI/UX Pro Max Audit)

The existing codebase uses "Modern Dark (Cinema Mobile)" profile with amber accent:

| Element | Current (global.css) | Standard | Action |
|---|---|---|---|
| Background | `#030303` (dark), `#fafafa` (light) | ✓ Correct | Keep |
| Accent | `#d97706` (amber) | ✓ Matches | Keep |
| Font | Inter + JetBrains Mono | ✓ Clean, professional | Keep |
| Cards | Glassmorphism with `border-card-border` | ✓ Correct | Keep, ensure light mode contrast |
| Animations | 150-300ms, ease-out | ✓ Per §7 guidelines | Keep |
| Reduced motion | `@media prefers-reduced-motion` | ✓ Required | Keep |

**Anti-patterns to fix:**

| Anti-pattern | Location | Fix |
|---|---|---|
| Hardcoded `text-white` | All 14 test components + dashboard | Use `text-foreground` (semantic token) |
| Hardcoded `bg-zinc-950`/`bg-zinc-900` | All 14 test components + dashboard | Use `bg-subtle`/`bg-panel` (semantic tokens) |
| Emojis in sidebar nav (if added) | `main.astro` navigation | Use SVG icons (Lucide/Heroicons) |
| Missing focus states | Various interactive elements | Add `focus-visible:ring-2 focus-visible:ring-accent` |
| Missing touch debounce | CPS, Aim, Reaction tests | Add `touch-action: manipulation` + debounce touch events per PLAN.md §10.4 |
| Missing aria-labels on icon buttons | SyncPanel, ThemeToggle, SocialShare | Add descriptive `aria-label` attributes |

---

## 5. YMYL Risk Assessment

**Risk level: LOW-MODERATE.** This is a performance benchmarking tool, not a health/diagnostic platform.

**Mitigations in place (✓):**
- ✓ No medical schema markup (SoftwareApplication/Quiz only)
- ✓ Methodology page with cited sources
- ✓ Non-medical framing (entertainment/self-improvement)
- ✓ Legal pages (Privacy, Terms, Contact, About)
- ✓ No "Brain Age" claims (explicitly banned in imp_features.md)

**Mitigations needed (✗):**
- ✗ Named author/editor with credentials on every benchmark-data page (Phase 1.2)
- ✗ Clear disclaimers on pages with percentile/cognitive data: "This is a self-tracking tool for entertainment and personal improvement purposes. Not a medical or diagnostic assessment." (Phase 1.2)
- ✗ No predictive improvement claims (already banned in imp_features.md — verify no code generates them)

---

## 6. Feature Priority Reference Table

| Feature | Impact | Effort | Phase | Why |
|---|---|---|---|---|
| Share Cards + Challenge Links | ⭐⭐⭐⭐⭐ | Already built | P0 | Virality — zero-login social distribution |
| BrainBenchmarks Challenge (Gauntlet) | ⭐⭐⭐⭐⭐ | 3-5 days | P0 | Flagship — the product identity |
| Browser Calibration | ⭐⭐⭐⭐⭐ | Already built; ~1h UI work | P0 | Trust — shows hardware context |
| Weekly Brain Report | ⭐⭐⭐⭐ | 4h | P1 | Retention — reason to return weekly |
| Performance HQ Dashboard | ⭐⭐⭐⭐ | 3h redesign | P1 | Retention — answers "what should I do next?" |
| Pattern Recognition as primary category | ⭐⭐⭐⭐ | ~2h | P1 | SEO + engagement — high-search category |
| Learning Center content clusters | ⭐⭐⭐⭐⭐ | Phase 2 scope | P1 | SEO — pillar pages for head terms |
| Glossary (50+ terms) | ⭐⭐⭐ | Phase 2 scope | P1 | SEO — definitional long-tail queries |
| FAQ Schema on test pages | ⭐⭐⭐⭐ | ~2h | P1 | SEO — rich snippet eligibility |
| Programmatic comparison pages | ⭐⭐⭐⭐ | Phase 2 scope | P2 | SEO — comparison long-tail traffic |
| Streamer Mode / OBS overlay | ⭐⭐⭐⭐ | 2-3 days | P2 | Distribution — creator-driven traffic |
| Aggregate data insights | ⭐⭐⭐⭐⭐ | Phase 4+ | P3 | Long-term moat — data no competitor can copy |
| Monthly Performance Review | ⭐⭐⭐⭐ | 2 days | P2 | Retention — longer-horizon progress tracking |

---

## 7. Key Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Code quality issues from AI-generated components (14 tests written by AI agent without tests) | HIGH | HIGH | Scoring unit tests (0.3) catch logic bugs. Manual QA pass (0.4) catches UI/runtime bugs. |
| Build breaks on fresh `npm install` due to Vite/Tailwind version conflict | HIGH | HIGH | Pin Vite in overrides + explicit devDependency. Test on clean clone before Phase 1. |
| Light mode fix misses some components (invisible text in light mode) | MEDIUM | HIGH | Systematic grep for `text-white`, `bg-zinc-9`, `bg-black`, `bg-neutral-` across all `src/`. Batch fix. Visual review every page in light mode. |
| AdSense rejection on first application | MEDIUM | HIGH | Apply only after Phase 2 content is live + indexed + showing organic traffic. No health claims. Clear disclaimers. |
| Google Helpful Content update targets thin SEO pages | LOW | HIGH | Content bar per PLAN.md §9.4 — no page ships without unique data + human editorial pass. |
| Fabricated names/bypass caught by Google (E-E-A-T penalty) | MEDIUM | MEDIUM | Phase 1.2 replaces all placeholder bylines with real author/credential. No fabricated names. |
| Touch double-counting on CPS/click tests on mobile | MEDIUM | HIGH | Phase 3.1 explicitly debounces touch events per PLAN.md §10.4. |

---

## 8. Build Order Summary

```
Week 1:  Fix light mode + verify build + write tests + QA all tests + 
         Lighthouse + calibration prominence + Dashboard → Performance HQ
         ↳ This must complete before anything else — the app is broken in light mode

Week 2-3: Build Gauntlet + E-E-A-T + hardware content + FAQ schema + 
          Weekly Brain Report + Pattern Recognition elevation
         ↳ Flagship test + retention + trust signals in parallel

Week 3-4: Expand Learning Center clusters + write articles + glossary + 
          comparison pages + data moat foundation
         ↳ Content depth for rankings + AdSense

Week 4-5: Mobile touch fix + internal linking + accessibility + 
          ad slots + Streamer Mode
         ↳ Production polish + creator distribution

Week 5-6: AdSense content audit + verify indexation + apply
         ↳ Revenue readiness (traffic helps but is not a gate)
```

**Sequencing dependencies:**
- Phase 0 → Phase 1 (0 must complete before 1 starts — broken light mode blocks all UI work)
- Phase 1 → Phase 2 (gauntlet must ship before content cluster optimization)
- Phase 2 + 3 can overlap (content writing is independent from mobile/accessibility fixes)
- Phase 4 is gated on content maturity, not traffic

---

## 9. Success Criteria

### Launch Gate (Phase 0 completion)
- [ ] All 14 tests work correctly in both light and dark mode
- [ ] Build succeeds on fresh `npm install` with zero errors
- [ ] All scoring functions have unit tests passing
- [ ] Lighthouse: ≥90 Performance, ≥95 Accessibility, 100 SEO on all 8 launch test pages

### AdSense Gate (Phase 4 completion)
- [ ] All pages have real author bylines with credentials
- [ ] All pages pass AdSense content review (no health claims, no YMYL signals)
- [ ] 500+ daily organic visitors sustained for 2+ weeks
- [ ] Privacy Policy, Terms, About, Contact pages live and accurate
- [ ] Ad slots implemented with CLS-safe reserved containers
