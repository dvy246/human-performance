# CogniArena Quality Audit Report

**Project:** `dvy246/human-performance`
**Stack:** Astro 6 SSR + React 19 + Tailwind CSS 4 + TypeScript
**Target:** Cloudflare Pages + D1
**Audit Date:** 2026-07-07
**Audit Scope:** Feature-by-feature quality audit of all 26+ tests/quizzes/guides

---

## Grading Rubric

| Grade | Meaning |
|-------|---------|
| A | Best-in-class, competitive advantage |
| B | Solid — meets user expectations, minor gaps |
| C | Functional but flawed or notably behind competitors |
| D | Broken or absent in critical dimension |
| F | Non-functional or misleading |

---

## 1. Test-by-Test Audit

### 1.1 Reaction Time Test
**Route:** `/tests/reaction-time` | **Component:** `ReactionTimeTest.tsx` | **Category:** Reaction

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Uses `requestAnimationFrame` double-nested paint sync (`reaction-time` page), `performance.now()` timing, `clickLock` ref for anti-double-fire. Lacks explicit frame timestamp vs. input event offset handling. |
| Difficulty calibration | C | Percentile mapping exists in `percentiles.json` for `reaction-time`. Fixed 5-trial protocol. HumanBenchmark uses 5 trials too (median 273ms). No adaptive trial count. |
| Interaction polish | B | Visual screen-flip (red→green). Clean animation. No explicit countdown indicator before random delay (1-2s). HumanBenchmark has same pattern. |
| Content depth | A | Learning hub article and methodology page explain Hick's Law, paint sync calibration pipeline, retinal transduction. Well above competitor documentation depth. |
| Trust/honesty | B | Methodology page is transparent about rAF sync. However, calibration Hz snapping (rounds to standard rates within 4Hz tolerance) may inflate perceived precision. |
| Accessibility | D | Color-only transition red→green is problematic for red-green color blindness (8% of males). No pattern change or audio cue alternative. |
| Retention hook | D | Shows result + percentile. No trend line, no improvement tip, no "play again with adjusted difficulty." |
| Bug-free | B | No observed runtime bugs. `clickLock` correctly prevents double-submit. Timer uses `useRef` for cleanup. |
| Competitive position | C | HumanBenchmark is the benchmark — simpler UI, 51M+ users, leaderboard. CogniArena matches feature set but lacks the user base for meaningful percentiles. |

**Overall: C+** — Functionally solid, accessible competitor match, but accessibility gap and retention hook missing.

---

### 1.2 Sound Reaction Test
**Route:** `/tests/sound-reaction` | **Component:** `SoundReactionTest.tsx` | **Category:** Reaction

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Web Audio API OscillatorNode (750Hz sine) — theoretically sub-ms audio emission. `clickLock` pattern. Same timing as visual RT. |
| Difficulty calibration | C | Same 5-trial protocol as visual RT. No separate percentile curve (falls under `reaction-time` in skillRadar). |
| Interaction polish | B | Clean audio cue via oscillator. No visual indicator required. However, requires user gesture to init AudioContext (browser policy). |
| Content depth | B | Sound reaction guide exists in learn hub. Methodology explains Web Audio API vs. `<audio>` element. |
| Trust/honesty | B | Transparent about AudioContext latency. |
| Accessibility | A | Audio-only test is inclusive for visually impaired users. Could supplement with visual cue too. |
| Retention hook | D | Same as visual RT — no trend or tips. |
| Bug-free | B | Need user gesture for AudioContext. If context fails, component likely falls silent silently (no error UI observed). |
| Competitive position | C | Not commonly offered as standalone by competitors. HumanBenchmark has "hearing test" (different). Weak positioning. |

**Overall: C** — Novelty feature, good accessibility (audio-only), but shallow retention and silent fail risk.

---

### 1.3 F1 Starting Lights Test
**Route:** `/tests/f1-lights` | **Component:** `F1LightsTest.tsx` | **Category:** Reaction

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | 5-light sequential countdown, measures reaction to final light. Same timing engine as RT. Random delay 0.5-2.5s after lights-out. |
| Difficulty calibration | C | Same 5-trial, percentile under `reaction-time`. Arealme has F1 Reaction Test too (identical concept). |
| Interaction polish | A | Visual light sequence creates anticipation, engaging theme. Unique among reaction tests. |
| Content depth | B | Guide exists under "Peripheral Vision" in learn hub. |
| Trust/honesty | B | Same timing transparency. |
| Accessibility | D | Requires distinguishing red light positions. No audio support. |
| Retention hook | D | No trend tracking. |
| Bug-free | B | `clickLock` and timer patterns consistent. |
| Competitive position | C | Arealme also has F1 Reaction Test. Concept is familiar, not novel. |

**Overall: C+** — Thematically engaging, same issues as reaction time family.

---

### 1.4 Choice Reaction Test (Hick's Law Grid)
**Route:** `/tests/choice-reaction` | **Component:** `ChoiceReactionTest.tsx` | **Category:** Reaction/Processing

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | 4-choice grid. Hick's Law framework documented. Measures decision overhead by subtracting simple RT base (stated in methodology but unclear if computed per-user or assumed). |
| Difficulty calibration | C | Percentile under `reaction-time` category. No separate calibration despite different cognitive demand. |
| Interaction polish | B | 4-quadrant grid, random target position. Functional but utilitarian. |
| Content depth | A | Multiple layers: methodology explains Hick's Law logarithmic scaling, learn guide covers decision complexity. |
| Trust/honesty | B | Methodology transparent. Subtracting base RT for "pure decision overhead" stated but implementation not verified. |
| Accessibility | D | Color + position based — no auditory alternative. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent patterns. |
| Competitive position | B | Fewer competitors offer choice RT specifically. HumanBenchmark doesn't have it. Differentiation potential. |

**Overall: C+** — Unique feature with strong content backing, but still in the reaction bucket without separate calibration.

---

### 1.5 Go/No-Go Test
**Route:** `/tests/go-no-go` | **Component:** `GoNoGoTest.tsx` | **Category:** Focus

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | A | True Go/No-Go paradigm with commission errors (false alarms) and omission errors (misses). Measures inhibition control — a known construct in cognitive psychology. |
| Difficulty calibration | C | Percentile under `focus` category, no separate curve. |
| Interaction polish | B | Green (go) / red (no-go) stimuli, rapid presentation. Clear instruction set. |
| Content depth | B | Learn hub guide covers inhibitory control. |
| Trust/honesty | A | Commission/omission error separation is a well-established metric. |
| Accessibility | D | Red/green color-dependent. Problematic for color blindness. |
| Retention hook | D | No trend. |
| Bug-free | B | `clickLock` and `submittedRef` patterns standard. |
| Competitive position | B | Rarely offered as standalone test. Strong differentiator. |

**Overall: C+** — Solid construct validity, rare competitor offering, but accessibility gap.

---

### 1.6 Sequence Memory Test
**Route:** `/tests/sequence-memory` | **Component:** `SequenceMemoryTest.tsx` | **Category:** Memory

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | 4x4 grid, Simon-says style. Measures spatial span. HumanBenchmark equivalent uses 3x3 grid with 9 squares. 4x4 with 16 squares = harder ceiling but sparser grid for same sequence length → different task difficulty. |
| Difficulty calibration | C | Percentile in `percentiles.json` — but HumanBenchmark sequence memory has massive user base (millions) for accurate population curves. CogniArena's limited user pool reduces accuracy. |
| Interaction polish | B | Clean grid highlight animation. Sound cues on square press. |
| Content depth | B | Learn hub guide on serial position effects, chunking strategies. |
| Trust/honesty | B | Standard implementation. |
| Accessibility | C | Visual + audio cues on press — partially accessible. No Haptics API. |
| Retention hook | D | Shows level reached. No trend. |
| Bug-free | B | Consistent patterns. |
| Competitive position | C | Direct HumanBenchmark clone (sequence memory is their most popular test). Loses on user base and polish. |

**Overall: C** — Direct competitor match, loses on community size.

---

### 1.7 Number Memory Test
**Route:** `/tests/number-memory` | **Component:** `NumberMemoryTest.tsx` | **Category:** Memory

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Digit span presentation/reproduction. Standard working memory paradigm. |
| Difficulty calibration | C | Progressive digit length. HumanBenchmark "Chimp Test" uses same pattern with stronger population data. |
| Interaction polish | B | Clean number presentation. |
| Content depth | B | Learn hub guide on Miller's Law, phonological loop. |
| Trust/honesty | B | Standard. |
| Accessibility | A | Number-based, fully screen-reader compatible. |
| Retention hook | D | Maximum digits reached. No trend. |
| Bug-free | B | Consistent. |
| Competitive position | C | Direct HumanBenchmark competitor, plus Arealme's number memory test. No differentiator. |

**Overall: C** — Commodity test, no competitive edge.

---

### 1.8 Visual Pattern Memory Test
**Route:** `/tests/visual-pattern` | **Component:** `VisualPatternTest.tsx` | **Category:** Memory

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Grid pattern memorization + reproduction. Standard spatial memory task. |
| Difficulty calibration | C | Progressive grid size. Same population data limitation. |
| Interaction polish | B | Tap-to-toggle cell grid. Functional. |
| Content depth | B | Learn hub on Gestalt principles, pattern completion. |
| Trust/honesty | B | Standard. |
| Accessibility | C | Grid interaction requires visual identification of toggled cells. Moderate accessibility. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent. |
| Competitive position | C | Commonly available. |

**Overall: C** — Adequate but unremarkable.

---

### 1.9 Dual N-Back Test
**Route:** `/tests/dual-n-back` | **Component:** `DualNBackTest.tsx` | **Category:** Memory

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Standard dual n-back (visual position + auditory letter). 20 trials. N defaults to 2. Dual-channel working memory updating. |
| Difficulty calibration | B | Adaptive n-level could improve calibration. Currently fixed N with pass/fail determining next attempt. Lacks staircasing algorithm used in research. |
| Interaction polish | B | Clean dual-stimulus presentation. |
| Content depth | B | Learn hub on n-back transfer effects, dlPFC engagement. |
| Trust/honesty | A | Well-validated research paradigm. Acknowledges transfer effect debate in learn content. |
| Accessibility | C | Visual position (grid) + auditory letter. Dual-channel is actually good for accessibility but visual position grid is screen-reader hostile. |
| Retention hook | D | No trend tracking of n-level over time. |
| Bug-free | B | Consistent timer patterns. |
| Competitive position | B | Not offered by HumanBenchmark. Brain Workshop (open source) is the main competitor. Stronger scientific grounding than most tests. |

**Overall: B-** — Scientifically strongest test in the suite, but lacks adaptive difficulty and trend tracking.

---

### 1.10 Verbal Memory Test
**Route:** `/tests/verbal-memory` | **Component:** `VerbalMemoryTest.tsx` | **Category:** Memory

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Word presentation + old/new discrimination. Recognition memory paradigm. |
| Difficulty calibration | C | HumanBenchmark version tracks number of words remembered (much simpler measure). CogniArena uses recognition (old/new), which is easier than free recall. |
| Interaction polish | B | Clean word presentation loop. |
| Content depth | B | Learn hub on phonological loop capacity, word span. |
| Trust/honesty | B | Standard. |
| Accessibility | A | Text-based, screen-reader compatible. |
| Retention hook | D | Final score only. |
| Bug-free | B | Consistent. |
| Competitive position | C | HumanBenchmark's version is the known benchmark. Word set size and composition matter for fairness — not documented. |

**Overall: C** — Functional, but recognition paradigm is weaker than recall for measuring verbal memory.

---

### 1.11 Pattern Reasoning Test (Fluid Intelligence)
**Route:** `/tests/pattern-reasoning` | **Component:** `PatternReasoningTest.tsx` | **Category:** Processing

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | C | 4 formats (pattern, matrix, sequence, analogy) in single component via mode state. Question generation is string/ReactNode representation — no visual matrix rendering. Real matrix reasoning tests (Raven's, IDRlabs) use actual visual grids which are fundamentally different cognitive tasks. Text descriptions of visual patterns may measure reading comprehension more than fluid reasoning. |
| Difficulty calibration | C | Exactly 5 questions per session regardless of performance. No adaptive difficulty. Fixed length means unreliable measurement. |
| Interaction polish | C | Text-description based pattern questions instead of visual grids. Far less engaging than IDRlabs' visual matrix test. |
| Content depth | A | Methodology page covers Gf (fluid intelligence). Multiple learn guides. |
| Trust/honesty | C | The text-description format is a significant departure from established matrix reasoning tests. Not disclosed in documentation that this differs from standard Raven's-style matrices. |
| Accessibility | B | Text-based patterns are screen-reader accessible (unusual for reasoning tests). |
| Retention hook | D | Score only. |
| Bug-free | B | 4 query-param format variants are client-side only (identical SSR HTML for all 4 — confirmed via curl). |
| Competitive position | D | IDRlabs and Arealme offer true visual matrix tests with image-based grids. Text descriptions of patterns is a weaker proxy for fluid intelligence measurement. |

**Overall: D** — The text-description format is the weakest test in the suite. Unlike competitors who render actual visual matrices, CogniArena describes patterns in words, which fundamentally changes what's being measured. This needs architectural rework.

---

### 1.12 Spatial Orientation Test (Mental Rotation)
**Route:** `/tests/spatial-orientation` | **Component:** `SpatialOrientationTest.tsx` | **Category:** Processing

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | C | Mental rotation of 3D objects via 2D screen. Classic Shepard & Metzler paradigm referenced in methodology. However, text-description based representations again — no true 3D rendering. |
| Difficulty calibration | C | Fixed set of items. |
| Interaction polish | C | Text/description-based. Arealme uses actual image-based 3D cube renderings. |
| Content depth | A | Methodology explains Shepard & Metzler (50ms/degree rotation). Learn guide covers mental rotation. |
| Trust/honesty | C | Same text-description issue as pattern reasoning. |
| Accessibility | C | Visual descriptions. |
| Retention hook | D | Score only. |
| Bug-free | B | Consistent. |
| Competitive position | D | Arealme's spatial intelligence test uses real 3D renderings with image-based questions. Text descriptions significantly limit validity. |

**Overall: D** — Same fundamental issue as pattern reasoning. Text descriptions of spatial problems are not equivalent to actual visual-spatial tasks.

---

### 1.13 Stroop Test
**Route:** `/tests/stroop` | **Component:** `StroopTest.tsx` | **Category:** Focus

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Classic Stroop paradigm (congruent vs. incongruent color-word trials). Measures cognitive inhibition. |
| Difficulty calibration | C | Standard congruent/incongruent mix. No adaptive timing. |
| Interaction polish | B | Color word display, button press for ink color. Functional. |
| Content depth | B | Learn hub guide on Stroop effect, automaticity, interference. |
| Trust/honesty | A | Well-validated paradigm. |
| Accessibility | D | Requires color perception. Color names displayed (partially accessible via text) but answering requires identifying ink color. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent timer patterns. |
| Competitive position | B | Widely available but psychologically validated. Unexploited differentiator. |

**Overall: C+** — Validated construct, but needs better implementation details.

---

### 1.14 Trail Making Test (TMT)
**Route:** `/tests/trail-making?mode=partB` | **Component:** `TrailMakingTest.tsx` | **Category:** Focus / Executive

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | A | Part A (number sequence) + Part B (number-letter alternation). Standard clinical TMT. Measures cognitive flexibility, set-shifting. Switch cost is a well-validated metric. |
| Difficulty calibration | B | Random node placement adds variability. Penalty for errors (5s). Ratio scoring (Part B / Part A). |
| Interaction polish | B | Click-to-connect nodes in sequence. Clean but competitive interaction. |
| Content depth | A | Learn hub guide on cognitive set shifting, switch costs, prefrontal engagement. Clinical relevance documented. |
| Trust/honesty | A | TMT is a clinically validated assessment. Ratio metric standard in neuropsychology. |
| Accessibility | D | Visual node layout + click-to-connect. No audio alternative. |
| Retention hook | D | Score only. |
| Bug-free | B | Node generation with random placement. Edge case risk: nodes too close together on small screens. |
| Competitive position | A | Almost no web competitors offer TMT. Psychology-Tools.com offers TMT but as printable PDF, not interactive. Strong differentiator. |

**Overall: B** — Strongest test in the suite: clinically validated, rare as interactive web test, strong content. Accessibility is major gap.

---

### 1.15 Focus Challenge (5-Stage Composite)
**Route:** `/tests/focus-challenge` | **Component:** `FocusChallengeTest.tsx` + 5 stage components | **Category:** Focus

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Composite score across 5 distinct sub-stages: SelectiveAttention, ImpulseControl, TaskSwitching, SustainedAttention (90s), WMUnderDistraction. Each measures a different attention construct. Overall score = simple average. |
| Difficulty calibration | B | Each stage independently scored. Normalizes to 0-100 scale per stage. Weaker stages weighted equally — potentially good (balanced) or bad (worse-performing stage drags score equally). |
| Interaction polish | A | Multiple interaction patterns per stage. SustainedAttention is a 90s endurance task — genuinely challenging. WMUnderDistraction combines memory + noise — effectively hard. |
| Content depth | A | Unique composite test with documented stage configs (`StageTypes.ts`). Methodology maps to distinct attentional networks. |
| Trust/honesty | B | Sub-stage scoring is transparent. Composite averaging is simple but reasonable. |
| Accessibility | D | Multi-modal (visual, timing-dependent). No accessibility accommodations observed. |
| Retention hook | D | Score + performance label (Elite/Sharp/Moderate/Distractible/Scattered). No trend. |
| Bug-free | B | 5-stage orchestration is complex — risk of state issues between transitions. |
| Competitive position | A | No direct competitor offers a 5-stage attention composite. Unique feature. |

**Overall: B+** — Most innovative test in the suite. Unique competitive position. Accessibility and trend tracking are gaps.

---

### 1.16 Click Speed Test (CPS)
**Route:** `/tests/click-speed` | **Component:** `ClickSpeedTest.tsx` | **Category:** Stamina

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Click counter over fixed duration (default 10s). CPS = clicks / seconds. Standard. |
| Difficulty calibration | C | Single 10s mode only. Arealme CPS offers 10 duration options (1s, 3s, 5s, 10s, 15s, 30s, 60s, 100s, 180s marathon, 900s ultramarathon). |
| Interaction polish | C | Simple button click. No real-time CPS chart. Arealme shows real-time CPS + average CPS + visual indicator for left/middle/right clicks. |
| Content depth | C | Learn hub on muscle activation, polling rate benchmarks. No click technique documentation (jitter/butterfly/drag clicking). |
| Trust/honesty | B | Straightforward measurement. |
| Accessibility | C | Simple click — accessible with assistive tech. |
| Retention hook | D | Score only. No local records (Arealme has local records). |
| Bug-free | B | Simple counter. Low bug risk. |
| Competitive position | D | Arealme CPS is the dominant player: 37M+ users, mobile apps (iOS/Android/Chrome), world records hall of fame, detailed stats by country/profession, 10 duration options, real-time chart, click type indicators, challenge mode, easter eggs. CogniArena's CPS is a basic implementation. |

**Overall: D** — Massively outclassed by Arealme CPS on every dimension. Single duration, no chart, no records, no mobile app.

---

### 1.17 Aim Trainer
**Route:** `/tests/aim-trainer` | **Component:** `AimTrainerTest.tsx` | **Category:** Precision

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Target-acquisition paradigm. Measures DPI-independent pixel distance from center and acquisition time. Fitts's Law referenced. |
| Difficulty calibration | C | Fixed target size and appearance rate. No adaptive difficulty. |
| Interaction polish | B | Click-targets appear on screen. Functional. |
| Content depth | B | Fitts's Law documented in methodology. Learn hub guide. |
| Trust/honesty | B | Standard. |
| Accessibility | D | Visual target clicking only. |
| Retention hook | D | Score only. |
| Bug-free | B | Consistent patterns. |
| Competitive position | C | Arealme Aim Trainer offers customizable target size, speed, visual stats. HumanBenchmark aim test (click 30 targets) is simpler but more polished. |

**Overall: C** — Functional but basic vs. competitors.

---

### 1.18 Mouse Accuracy Test
**Route:** `/tests/mouse-accuracy` | **Component:** `MouseAccuracyTest.tsx` | **Category:** Precision

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Sub-pixel offset measurement from target center. Precision metrics. |
| Difficulty calibration | C | Fixed target size and arrangement. |
| Interaction polish | B | Grid of targets, click accurately. |
| Content depth | B | Learn hub on fine motor control, motor unit recruitment. |
| Trust/honesty | B | Standard. |
| Accessibility | D | Visual only. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent. |
| Competitive position | C | Unusual as standalone — typically combined with aim trainer. |

**Overall: C** — Specialized but basic.

---

### 1.19 Flick Trainer
**Route:** `/tests/flick-trainer` | **Component:** `FlickTrainerTest.tsx` | **Category:** Precision

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Flick-shot paradigm: acquire one target, immediately next appears. Measures speed-accuracy tradeoff. |
| Difficulty calibration | C | Fixed target sizes and distances. |
| Interaction polish | B | Consecutive targets. Clean. |
| Content depth | B | Learn hub on smooth pursuit, motion prediction. |
| Trust/honesty | B | Standard. |
| Accessibility | D | Visual only. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent. |
| Competitive position | C | Common aim trainer variant. |

**Overall: C** — Adequate.

---

### 1.20 Typing Speed Test
**Route:** `/tests/typing-speed` | **Component:** `TypingSpeedTest.tsx` + `TypingEngine` class | **Category:** Stamina

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | A | Custom TypingEngine class tracks WPM, accuracy, consistency, burst speed. Raw vs. net WPM distinction. Most technically sophisticated component (42930 chars). |
| Difficulty calibration | B | Fixed word set. No adaptive difficulty based on skill level. |
| Interaction polish | B | Character-by-character inline feedback. Missed/incorrect chars highlighted. |
| Content depth | B | Learn hub reference. |
| Trust/honesty | A | Multiple metrics provide nuanced picture. |
| Accessibility | C | Keyboard-based, inherently accessible to keyboard users. |
| Retention hook | D | Score only. TypingTest.com tracks history, badges, goals across devices (account required). |
| Bug-free | B | Custom engine is complex — edge cases in backspace handling, punctuation, capitalization. |
| Competitive position | C | TypingTest.com dominates: lessons, certification, games, custom tests, account sync, badges, benchmarks. Monkeytype (open source) offers more features. CogniArena's engine is solid but lacks ecosystem. |

**Overall: C+** — Best engine in the suite, but feature-poor vs. competitors. No lessons, no certification, no history tracking.

---

### 1.21 Decision Speed Test
**Route:** `/tests/decision-speed` | **Component:** `DecisionSpeedTest.tsx` | **Category:** Executive

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Binary choice paradigm. Measures processing speed. Drift-diffusion model referenced in benchmarks. |
| Difficulty calibration | C | Simple left/right discrimination. No adaptive timing. |
| Interaction polish | B | Clean binary interface. |
| Content depth | B | Learn hub on processing speed, binary classification, cognitive throughput. |
| Trust/honesty | B | Standard. |
| Accessibility | C | Left/right keys — accessible. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent. |
| Competitive position | B | Uncommon standalone test. Potential differentiator. |

**Overall: C+** — Functional, novel, but shallow.

---

### 1.22 Planning Test (Tower of Hanoi)
**Route:** `/tests/planning` | **Component:** `PlanningTest.tsx` | **Category:** Executive

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | A | Tower of Hanoi is a well-established executive function assessment. Measures planning depth, problem-solving. |
| Difficulty calibration | B | Progressive disk count increases difficulty. |
| Interaction polish | B | Click-to-move disk interface. Functional but could be more polished (drag-and-drop?). |
| Content depth | B | Learn hub on Tower of Hanoi, prefrontal planning. |
| Trust/honesty | A | Classic validated paradigm. |
| Accessibility | D | Visual disk manipulation required. |
| Retention hook | D | Minimum moves tracked. No comparison to optimal solution. |
| Bug-free | B | Standard move validation. |
| Competitive position | B | Uncommon as interactive web test. |

**Overall: C+** — Classic paradigm, well implemented, but lacks optimal-solution comparison and accessibility.

---

### 1.23 Prioritization Test
**Route:** `/tests/prioritization` | **Component:** `PrioritizationTest.tsx` | **Category:** Executive

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | B | Task scheduling simulation. Measures prioritization ability under time constraints. |
| Difficulty calibration | C | Fixed set of tasks. |
| Interaction polish | B | Task list with urgency/importance indicators. Eisenhower matrix style. |
| Content depth | B | Learn hub on task scheduling, attentional resource allocation. |
| Trust/honesty | B | Novel construct — less validated than other tests. |
| Accessibility | C | List-based, partially screen-reader accessible. |
| Retention hook | D | Standard. |
| Bug-free | B | Consistent. |
| Competitive position | B | Rare test type — strong differentiator potential. |

**Overall: C+** — Novel but unvalidated construct. Needs clearer scoring rationale.

---

### 1.24 The Gauntlet (5-Stage Composite)
**Route:** `/gauntlet` | **Component:** `GauntletTest.tsx` | **Category:** Composite

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | A | 5-domain composite: reaction, memory, inhibition, reasoning, precision. Holistic cognitive assessment. |
| Difficulty calibration | B | Each stage scored independently. Composite reflects weakest link. |
| Interaction polish | A | Multi-stage format creates progression narrative. |
| Content depth | A | Full page explains all 5 stages. Unique offering. |
| Trust/honesty | B | Transparent about composite weighting. |
| Accessibility | D | Diverse interaction types — no single accessibility mode possible. |
| Retention hook | D | Score only. Trend tracking would be powerful here. |
| Bug-free | B | Stage orchestration complexity. |
| Competitive position | A | No direct competitor offers a multi-domain gauntlet. Unique selling point. |

**Overall: B+** — Best feature for differentiation. Trend tracking over time would make it exceptional.

---

### 1.25 IQ Test (Quiz)
**Route:** `/quiz/iq-test` | **Component:** `IQTest.tsx` | **Category:** Quiz

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | D | 20 questions across 4 domains. No standardization to population norms. No time limit disclosed. No score-to-IQ conversion explained. |
| Difficulty calibration | D | Fixed 20 questions. No adaptive difficulty. |
| Interaction polish | B | Clean quiz interface. |
| Content depth | C | H2 says "Free IQ Test" — minimal content. No explanation of score meaning. |
| Trust/honesty | F | IQ tests require standardized administration, population-normalized scoring, and validation. "20 questions, 4 domains" with no disclosed psychometric properties is misleading. IDRlabs at least cites sources. |
| Accessibility | B | Text-based, screen-reader compatible. |
| Retention hook | D | Score only. |
| Bug-free | B | Simple quiz format — low bug risk. |
| Competitive position | F | Real IQ tests (WAIS, Stanford-Binet) take 60-90 minutes with trained administrators. Online "IQ tests" are entertainment, not measurement. CogniArena's does not distinguish itself from other entertainment IQ quizzes while still calling itself an "IQ Test." |

**Overall: F** — Ethically problematic. Calling a 20-question browser quiz an "IQ Test" without standardization, norms, or validation disclosures is misleading. Should be rebranded as "Cognitive Reasoning Quiz" or similar entertainment label.

---

### 1.26 Cognitive Style Quiz
**Route:** `/quiz/cognitive-style` | **Component:** `CognitiveStyleQuiz.tsx` | **Category:** Quiz

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| Measurement correctness | C | Self-report quiz classifying into Visual/Verbal/Analytical/Holistic. Not a validated psychometric instrument. |
| Difficulty calibration | N/A | Self-report, no difficulty concept. |
| Interaction polish | B | Clean multiple-choice. |
| Content depth | D | Minimal explanation of categories or their practical implications. |
| Trust/honesty | C | Cognitive styles are debated in psychology (lack of strong validity evidence). Disclosed as "quiz" not "test." |
| Accessibility | B | Text-based, screen-reader compatible. |
| Retention hook | C | Result categorization at least gives closure. |
| Bug-free | B | Simple format. |
| Competitive position | C | Common quiz type — no differentiator. |

**Overall: C** — Harmless entertainment. Clear entertainment labeling reduces ethical concern.

---

## 2. Cross-Cutting Findings

### 2.1 Accessibility
**Score: D** — Pervasive across all visual-reaction tests:
- Red/green color-only transitions in ReactionTime, GoNoGo, F1Lights affect 8% of males
- No haptic feedback, no audio alternatives for visual tests
- No focus management for keyboard navigation
- No reduced-motion preferences respected
- ARIA labels inconsistent across components
- **Exception:** SoundReaction (audio-only, inherently accessible), VerbalMemory and NumberMemory (text-based, screen-reader friendly)

### 2.2 Retention Hooks
**Score: D** — System-wide gap:
- No test tracks improvement trends over time
- Dashboard shows radar but doesn't show change over sessions
- No streak tracking, no achievements/badges
- Share cards exist (SocialShare component + download links in 13+ tests) but no persistent progress tracking
- No email/subscription for progress alerts
- **Exception:** The radar dashboard is a good foundation but lacks time dimension

### 2.3 Percentiles Data Quality
**Score: C+**
- `percentiles.json` contains percentile curves for 20+ tests (reaction-time, focus-challenge, gauntlet, verbal-memory, spatial-orientation, mouse-accuracy, flick-trainer, decision-speed, planning, prioritization, click-speed, aim-trainer, sequence-memory, number-memory, choice-reaction, sound-reaction, f1-lights, go-no-go, stroop, visual-pattern, pattern-reasoning, trail-making, typing-speed, dual-n-back)
- However, these curves are literature/estimate-based, not derived from actual user population data
- User base too small for statistically meaningful real-population percentiles
- `benchmarks.ts` has hardcoded age/profession data but this is literature-based, not from user population

### 2.4 Calibration System
**Score: C**
- Snaps Hz to standard rates (60/75/90/120/144/165/240/280/360) within 4Hz tolerance
- This means a 143Hz monitor reads as 144Hz (harmless) but also a 59Hz monitor reads as 60Hz (misleading)
- Double-rAF paint sync is genuinely good practice
- Calibration banner shown to user — transparency is positive

### 2.5 Page Performance
**Score: D**
- Homepage: 313KB SSR HTML (due to inline Tailwind CSS + JS hydration)
- Test pages: ~230KB each
- No code splitting per test page (all JS bundled)
- No image optimization (OG image served raw)
- AdSense lazy-loaded after 1.5s (good practice)
- No performance budget enforced

### 2.6 SEO
**Score: B+**
- Sitemap.xml with 64 URLs
- Per-page canonical URLs, meta descriptions, OG tags
- Schema.org JSON-LD on all pages
- Clean URL structure
- robots.txt proper
- Missing: test variant URLs (`?format=` query params) not in sitemap

### 2.7 Code Quality
**Score: B**
- Consistent patterns: `clickLock` ref, `submittedRef`, `useRef` for timers
- TypingEngine is well-architected
- Data layer abstraction (IndexedDB + optional D1 sync) is clean
- Automated tests exist (vitest configured, 4 test files: calibration, dataLayer, skillRadar, trainingEngine) but no component/integration tests for UI
- Some inline styles mixed with Tailwind classes
- Duplicate patterns across 20+ test components could be extracted

### 2.8 Comparative Positioning Summary

| Category | CogniArena | Top Competitor | Gap |
|----------|-----------|----------------|-----|
| Test breadth | 20+ tests | HumanBenchmark (8 tests) | **Advantage** |
| Composite tests | 2 (Gauntlet, Focus Challenge) | None | **Advantage** |
| User base | Unknown (likely <10K) | HumanBenchmark 51M+ | Critical |
| Mobile support | Web only | Arealme has iOS/Android apps | Significant |
| CPS test | Basic, 1 duration | Arealme 10 durations, 37M users | Severe |
| Typing test | Good engine, no ecosystem | TypingTest.com/Monkeytype | Significant |
| Pattern reasoning | Text descriptions | IDRlabs visual matrices | Critical |
| Leaderboards | None | HumanBenchmark global rankings | Missing |
| Training mode | None | Monkeytype, TypingTest.com | Missing |
| Certification | None | TypingTest.com | Missing |
| Accessibility | Poor | Industry standard | Critical |
| Content depth | Excellent (learn + methodology) | Minimal competitor docs | **Advantage** |

---

## 3. Prioritized Issues for Fix

### Critical (ethical / competitive / user-facing)
1. **Rename "IQ Test"** to "Cognitive Reasoning Quiz" or similar — current label is misleading (psychometric validity absent)
2. **Pattern Reasoning: replace text descriptions with actual visual grids** (SVG/canvas rendered patterns) — current implementation measures reading comprehension, not fluid intelligence
3. **Spatial Orientation: use rendered 3D objects** instead of text descriptions
4. **CPS: add multiple durations and a real-time chart** to approach Arealme parity (at minimum: 5s/10s/30s/60s)

### High (functional quality)
5. **Validate percentile curves with real user data** — curves exist for 20+ tests but are literature-based, not from actual user population
6. **Fix benchmarks SSR flash** — React component shows "Benchmark Data Not Found" during SSR because config is loaded in useEffect instead of synchronously
7. **Add trend tracking** — store session history per test and show change arrows on dashboard
8. **Red/green color accessibility** — add pattern/text changes to reaction tests for color blindness

### Medium (polish)
9. **AdSense production ID** — replace `ca-pub-placeholder` before launch
10. **Implement automated tests** — vitest configured but unused
11. **Reduce page sizes** — code-split test bundles, lazy-load non-critical CSS
12. **Add TrailMaking technique docs** — mention node proximity risk on small screens

### Low (nice-to-have)
13. **Add shareable result cards** (OG image generation per test)
14. **Add "play again with adjusted difficulty"** retention hook
15. **Implement adaptive difficulty** for DualNBack, PatternReasoning

---

## 4. Overall Verdict

**Grade: C+** — CogniArena has exceptional breadth (20+ tests, 2 unique composite assessments) and content depth (learn center, methodology) that exceeds any competitor. The engineering architecture is clean and the TypingEngine shows genuine technical sophistication.

However, critical gaps undermine the project:

1. **Two tests measure the wrong thing** — PatternReasoning and SpatialOrientation use text descriptions instead of visual/spatial renderings, fundamentally altering what they measure
2. **"IQ Test" is ethically problematic** without standardization or validation disclosure
3. **Percentile curves exist but lack real-user validation** — `percentiles.json` has curves for 20+ tests but they are literature-based, not from actual user population
4. **Retention infrastructure is incomplete** — share cards exist but no trends, no records, no streaks, no achievements
5. **Accessibility is poor** across visual-reaction tests
6. **CPS is massively outclassed** by Arealme's 37M-user dominant offering

The project's genuine strengths — composite tests (Gauntlet, FocusChallenge), content depth, Trail Making clinical validity — are currently undermined by architectural choices in the reasoning tests and the missing retention layer. With fixes to the critical issues, this could compete effectively as a "broad but deep" alternative to HumanBenchmark's "narrow but polished" approach.
