
```markdown
# imp_features.md — High-ROI Feature Constraints & Guardrails

**Status:** CRITICAL ADDENDUM to PLAN.md and PRD.md
**Audience:** AI Coding Agents & Engineers
**Purpose:** This document strictly defines the high-ROI features to build and the anti-patterns to avoid. It overrides any conflicting feature bloat in previous documents. The goal is maximum shareability, trust, and retention without sacrificing performance or making pseudo-scientific claims.

---

## 🚨 Phase 1 Strict Build Order (Do not deviate)
To prevent founder burnout and scope creep, Phase 1 is strictly limited to building the following ecosystem:
1. **3 Core Tests:** Simple Reaction Time, Click Speed (CPS), and a single-mode Aim Trainer.
2. **Public Share Cards:** Instant, one-click image generation for sharing results.
3. **Challenge a Friend:** Unique URL generation requiring zero login.
4. **Browser Calibration:** Detect refresh rate and latency to contextualize scores.
5. **The Gauntlet (Flagship Test):** A 3-5 minute multi-test yielding a "Performance Profile".
6. **Monetization:** Clean AdSense integration + Affiliate CTAs.

---

## 🏆 The Core Features (Ranked by Impact)

### 1. The Adaptive Cognitive Gauntlet (Flagship Test) — 10/10
* **What it is:** A 5-minute sequential assessment testing Reaction, Memory, Logic, Focus, and Processing Speed.
* **Why it matters:** This is the brand differentiator. It prevents the site from being just a "HumanBenchmark clone." It outputs a single, comprehensive performance profile.
* **AI Guardrail:** Must output a "Performance Style" (e.g., "Precision Thinker", "Fast Reactor"), NOT a "Brain Age". 

### 2. Public Share Cards & "Challenge a Friend" — 10/10
* **What it is:** Every individual test result generates a beautiful, dark-mode optimized image containing the score, percentile, and a "Can you beat me?" prompt with a unique URL.
* **Why it matters:** This is the primary SEO/traffic strategy. We bypass Google's domain authority requirements by engineering for virality on Discord, Reddit, and Twitter.
* **AI Guardrail:** Must use standard Web APIs (e.g., `html-to-image` or `canvas`) to generate the image client-side. Zero backend processing required for share cards.

### 3. Brain Performance Report — 10/10
* **What it is:** An aggregated dashboard showing Overall Performance Index, Strengths, Weaknesses, and Recommended Training.
* **AI Guardrail (CRITICAL):** Do NOT include predictive medical or pseudo-scientific claims. Specifically, **do not** output "Estimated improvement: +8–12% over 30 days." This is an invented statistic that breaks user trust and risks YMYL/AdSense penalties. Keep recommendations strictly directional (e.g., "Take the Pattern Memory test to train your weakest area").

### 4. Browser Calibration — 9.7/10
* **What it is:** A pre-test calibration step that detects 144Hz+ refresh rates, frame pacing, and device latency, informing the user: *"Your hardware may improve your score by 6–12 ms."*
* **Why it matters:** Builds immense trust. Makes the platform look more authoritative than competitors.
* **AI Guardrail:** Use `requestAnimationFrame` timestamps to calculate actual display refresh rate. Do not guess hardware capabilities based on user-agent strings.

### 5. Gamer Profiles & "Performance Style" — 9.5/10
* **What it is:** A fun interpretation of test patterns mapping to gamer archetypes (e.g., "Precision Thinker", "Analytical Planner") and game suitability (e.g., Valorant, CS2).
* **AI Guardrail:** Must be based *strictly* on the data provided (e.g., "Your reaction time matches the top 10% of FPS players"). Do not make unsubstantiated claims about cognitive health or medical diagnoses.

### 6. Niche Training Modes (F1 Lights & FPS) — 9.8/10
* **What it is:** Themed tests. F1 Lights Trainer (sim-racing) and FPS Training Mode (flicks, tracking).
* **AI Guardrail:** Browser-based FPS aim trainers are performance-sensitive. Keep modes simple (single-target flicks, horizontal tracking). Do not attempt heavy 3D rendering in React Islands; maintain 60/144fps at all costs.

### 7. Brain Profile Dashboard & Timeline — 10/10
* **What it is:** Visualizes skills as progress bars and tracks improvement over weeks.
* **AI Guardrail (CRITICAL):** Individual tests must remain **100% frictionless**. A user searching "reaction time test" must be able to click, test, and see their number instantly. Do NOT force users through a dashboard onboarding flow or multi-test gate just to take a single test. The Dashboard is an opt-in sidebar feature.

---

## 🚫 Explicitly Rejected Features (Do NOT Build)
The AI agent must refuse to implement any of the following, even if requested in older PRD iterations:

* ❌ **"Brain Age" Claims:** Difficult to justify scientifically; undermines trust; risks AdSense health policy flags.
* ❌ **Personality Tests:** Not framed as psychology. "Performance Style" is okay, Myers-Briggs style quizzes are not.
* ❌ **Mandatory Logins / Social Networks / Forums:** Friction kills SEO conversion.
* ❌ **Hundreds of AI-Generated Articles:** We rely on high-quality, link-bait utility tools, not thin programmatic SEO.
* ❌ **Paid Subscriptions:** Not until Phase 4+ (if ever).
* ❌ **Predictive Improvement Claims:** (e.g., "You will improve 12%"). Stick to directional training recommendations.
* ❌ **Medical/Cognitive Health Diagnostics:** This is an entertainment/utility platform, not a medical device.

---

## 🧠 AI Agent Rules of Engagement
1. **Utility over Content:** If given a choice between writing a 1,000-word blog post and polishing the UI/animation of a test, always choose the test UI.
2. **Frictionless Entry:** Core test URLs (e.g., `/tests/reaction-time`) must load the interactive tool above the fold immediately. No interstitials, no mandatory calibrations (calibration is optional/auto-detected).
3. **Trust First:** Never display a statistic, percentile, or claim without a clear, plain-language methodology note nearby.
```