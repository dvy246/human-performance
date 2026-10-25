# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests.spec.ts >> Cognitive Tests Interactions >> Reaction Time Test flow - early abort
- Location: e2e/tests.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div[role="button"][aria-live="polite"]').locator('text=WAITING')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div[role="button"][aria-live="polite"]').locator('text=WAITING')

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- button "Close guide":
  - img
- text: 📖
- heading "How to Play" [level=2]
- paragraph: Onboarding Guide
- heading "💡 What It Measures" [level=3]
- paragraph: A reaction time test measures the speed at which you respond to a visual stimulus. The screen changes from dark to green, and you click as fast as possible. Our timer uses requestAnimationFrame paint-sync calibration to record responses with sub-millisecond accuracy, eliminating browser rendering jitter.
- heading "📈 How Scoring Works" [level=3]
- paragraph: Your final result is the average of 5 consecutive attempts. This methodology reduces statistical variance caused by anticipation errors, distraction, or random motor twitches. Your average is then compared against our population model to output your percentile rank.
- heading "⚡ Variables Affecting Performance" [level=3]
- paragraph: Display latency (60Hz adds 16.7ms), mouse polling rate (125Hz adds 8ms), wireless Bluetooth lag (8-20ms), and your current fatigue and focus levels all affect your measured score.
- button "Got It"
- complementary:
  - link "CogniArena CogniArena":
    - /url: /
    - img "CogniArena"
    - text: CogniArena
  - text: Discover Your Cognitive Potential
  - navigation:
    - text: Ecosystem
    - link "Home Overview":
      - /url: /
    - link "Population Benchmarks":
      - /url: /benchmarks/
    - link "Dashboard":
      - /url: /dashboard/
    - link "Personal Records":
      - /url: /records/
    - link "Brain Games":
      - /url: /brain-games/
    - link "The Gauntlet Flagship":
      - /url: /gauntlet/
    - group:
      - text: Reaction & Reflexes
      - img
      - link "Visual Reaction":
        - /url: /tests/reaction-time/
      - link "Auditory Reflex":
        - /url: /tests/sound-reaction/
      - link "F1 Start Lights":
        - /url: /tests/f1-lights/
      - link "Choice Reaction":
        - /url: /tests/choice-reaction/
      - link "Color Go/No-Go":
        - /url: /tests/go-no-go/
      - link "Latency & Hz Optimizer":
        - /url: /tests/latency-optimizer/
    - group:
      - text: Memory
      - img
    - group:
      - text: Reasoning
      - img
    - group:
      - text: Focus & Attention
      - img
    - group:
      - text: 🎮 Motor Performance
      - img
    - group:
      - text: Strategy & Logic
      - img
    - group:
      - text: Quizzes
      - img
    - group:
      - text: Learning Center
      - img
  - text: No recent tests yet Calibration Status Online Backup Sync Local Only
  - button "Enable Cloud Sync (Backup)"
  - link "Methodology":
    - /url: /methodology/
  - text: ·
  - link "FAQ":
    - /url: /faq/
  - text: ·
  - link "Privacy Policy":
    - /url: /privacy/
  - text: ·
  - link "Terms":
    - /url: /terms/
- main:
  - link "CogniArena":
    - /url: /
    - img "CogniArena"
  - button "Change language":
    - text: 🇺🇸 EN
    - img
  - switch "Toggle theme"
  - text: "60Hz Display | ~8.3ms paint latency (measured: 60Hz)"
  - button "Re-detect":
    - img
    - text: Re-detect
  - navigation "Breadcrumb":
    - link "Home":
      - /url: /
    - text: /
    - link "Tests":
      - /url: /tests/
    - text: / Reaction Time Test
  - heading "Reaction Time Test" [level=1]
  - paragraph: Measure your raw reflex speed in response to visual stimulus. This test utilizes high-precision paint-syncing and hardware refresh-rate calibration for millisecond accuracy.
  - button "⚡ Reaction Time Test When the red screen turns green, click as fast as you can. Attempts 3 5 10 Difficulty Easy Medium Hard Sound Effects 🔊 ON Start Test Press ? for shortcuts":
    - text: ⚡
    - heading "Reaction Time Test" [level=2]
    - paragraph: When the red screen turns green, click as fast as you can.
    - text: Attempts
    - button "3"
    - button "5"
    - button "10"
    - text: Difficulty
    - button "Easy"
    - button "Medium"
    - button "Hard"
    - text: Sound Effects
    - button "🔊 ON"
    - button "Start Test"
    - text: Press ? for shortcuts
  - text: "Monitor calibrated: 60Hz Refresh Rate | Expected Hardware Lag: ~8.3ms"
  - strong: "Gamer Benchmark Notice:"
  - text: This test is designed for reaction timing, mouse precision, and reflex tracking. Built for entertainment and competitive drills.
  - article:
    - heading "How This Test Works" [level=2]
    - text: "1"
    - heading "What It Measures" [level=3]
    - paragraph: A reaction time test measures the speed at which you respond to a visual stimulus. The screen changes from dark to green, and you click as fast as possible. Our timer uses requestAnimationFrame paint-sync calibration to record responses with sub-millisecond accuracy, eliminating browser rendering jitter.
    - text: "2"
    - heading "How Scoring Works" [level=3]
    - paragraph: Your final result is the average of 5 consecutive attempts. This methodology reduces statistical variance caused by anticipation errors, distraction, or random motor twitches. Your average is then compared against our population model to output your percentile rank.
    - heading "What Affects Your Results" [level=3]
    - paragraph: Display latency (60Hz adds 16.7ms), mouse polling rate (125Hz adds 8ms), wireless Bluetooth lag (8-20ms), and your current fatigue and focus levels all affect your measured score.
    - text: Want to understand the science? Read our full guide on
    - link "Reaction Time Science":
      - /url: /learn/reaction-time/
    - text: .
  - text: BB Learn about calibration protocols and scientific formulas on our
  - link "Methodology Page":
    - /url: /methodology/
  - text: .
  - article:
    - heading "What is a Reaction Time Test and how does a Reaction Time Tester work?" [level=2]
    - paragraph:
      - text: A
      - strong: reaction time test
      - text: is a simple esports benchmark designed to measure the speed at which a person responds to a visual, auditory, or physical stimulus. By using a high-precision online
      - strong: reaction time tester
      - text: ", you measure your visual processing speed by clicking or tapping as soon as a dark screen changes to a solid green color. This visual"
      - strong: reaction test
      - text: helps you track raw speed.
    - paragraph:
      - text: Unlike generic click tests, a high-quality
      - strong: reaction time game
      - text: or
      - strong: human reaction test
      - text: records the sub-millisecond paint intervals of the display. The time interval between the paint-sync of the green color and your input trigger is recorded in milliseconds (ms). The faster you react, the lower your score.
  - article:
    - heading "How is the Test Scored?" [level=2]
    - paragraph: Your final result is computed as the **average of 5 consecutive attempts**. This methodology reduces the statistical variance caused by anticipation errors, distraction, or random motor twitches.
    - paragraph: Once your average is calculated, it is compared against our population model. This model outputs your percentile rank, indicating what percentage of the global population you outperform (e.g., a score in the 8th percentile means you reacted faster than 92% of participants).
  - article:
    - heading "What is the Average Reaction Time? (Normative Study Data)" [level=2]
    - paragraph:
      - text: Human reaction speed changes across life stages and training backgrounds. If you are wondering
      - strong: what is the average reaction time
      - text: ", the baseline"
      - strong: average reaction time
      - text: or
      - strong: average human reaction time
      - text: "for visual stimuli is approximately 250ms. Below are average visual reaction times by age group:"
    - table:
      - rowgroup:
        - row "Age Range Average Reaction Time (ms) Performance Class":
          - columnheader "Age Range"
          - columnheader "Average Reaction Time (ms)"
          - columnheader "Performance Class"
      - rowgroup:
        - row "15 – 24 years 220 - 240 ms Elite / Peak":
          - cell "15 – 24 years"
          - cell "220 - 240 ms"
          - cell "Elite / Peak"
        - row "25 – 34 years 240 - 255 ms Excellent":
          - cell "25 – 34 years"
          - cell "240 - 255 ms"
          - cell "Excellent"
        - row "35 – 44 years 255 - 270 ms Average":
          - cell "35 – 44 years"
          - cell "255 - 270 ms"
          - cell "Average"
        - row "45 – 54 years 270 - 290 ms Modest Decay":
          - cell "45 – 54 years"
          - cell "270 - 290 ms"
          - cell "Modest Decay"
        - row "55+ years 290+ ms Cognitive Aging":
          - cell "55+ years"
          - cell "290+ ms"
          - cell "Cognitive Aging"
    - paragraph: "Citation: Normative values modeled from *Der & Deary (2006), Reaction Times and Cognitive Abilities Across the Lifespan*, and *Williamson & Feyer (2000), Cognitive Psychomotor Latency*."
  - article:
    - heading "What Affects Your Measured Score?" [level=2]
    - paragraph: "Many users are surprised by their online scores because they do not account for hardware and browser pipeline delays. In reality, your computer adds significant latency before your click registers:"
    - heading "Display Latency" [level=3]
    - paragraph: A standard 60Hz monitor updates its display once every 16.7ms, meaning you could lose up to 16ms waiting for the screen to refresh. A 144Hz monitor lowers this expected delay to 3.5ms.
    - heading "Polling Latency" [level=3]
    - paragraph: USB input devices poll data periodically. A standard mouse polls at 125Hz (8ms delay), while high-end gaming mice poll at 1000Hz (1ms delay). Wireless connections like Bluetooth add another 8-20ms of lag.
    - heading "Browser & OS" [level=3]
    - paragraph: Operating systems stack window managers and compositors which delay paints. Chrome and Safari also buffer JavaScript execution. This combines to add another 10-30ms of rendering overhead.
  - article:
    - 'heading "How to Improve Reaction Time: Best Exercises" [level=2]'
    - paragraph:
      - text: If you want to know
      - strong: how to improve reaction time
      - text: ", performing the"
      - strong: best exercises for reaction time
      - text: "can help you shave off precious milliseconds:"
    - list:
      - listitem:
        - strong: "Wired Peripherals & High Refresh Rate:"
        - text: Minimize hardware lag. Use a wired mouse and a high-refresh monitor.
      - listitem:
        - strong: "Cognitive & Visual Exercises:"
        - text: Practice regularly on a visual
        - strong: reaction time tester
        - text: or
        - strong: reaction time game
        - text: . Consistent training builds myelin sheaths around motor pathway axons.
      - listitem:
        - strong: "Sleep, Hydration, and Rest:"
        - text: Sleep deprivation slows visual processing. Keeping hydrated and well-rested is the easiest way to boost your score on any
        - strong: human reaction test
        - text: .
      - listitem:
        - strong: "Physical Exercises:"
        - text: Hand-eye coordination drills (like juggling, ball-tossing, or playing fast-paced video games) train your brain to coordinate visual inputs with motor responses.
  - heading "Explore 23+ Assessments" [level=2]
  - paragraph: Explore all esports benchmarks across six domains. Each test runs locally in your browser with sub-millisecond precision.
  - article:
    - heading "Reaction & Reflexes" [level=3]
    - paragraph: Raw speed & sensory pathways
    - heading "Visual Reaction" [level=4]
    - text: Current
    - paragraph: Test your physical reflexes against visual triggers. Calibrate input delay, monitor refresh rate, and view population distributions.
    - link "Auditory Reflex Measure your auditory response speeds to low-latency synthesized sound waves. Contrast hearing triggers against visual pathways. Take Test →":
      - /url: /tests/sound-reaction/
      - heading "Auditory Reflex" [level=4]
      - paragraph: Measure your auditory response speeds to low-latency synthesized sound waves. Contrast hearing triggers against visual pathways.
      - text: Take Test →
    - link "F1 Start Lights Simulate a Grand Prix start gantry. Suppress anticipatory impulse and release motor actions at the exact millisecond lights extinguish. Take Test →":
      - /url: /tests/f1-lights/
      - heading "F1 Start Lights" [level=4]
      - paragraph: Simulate a Grand Prix start gantry. Suppress anticipatory impulse and release motor actions at the exact millisecond lights extinguish.
      - text: Take Test →
    - link "Choice Reaction Map color changes to keys R, G, B, Y. Manage accuracy-speed trade-offs under cognitive decision load with built-in mismatch penalties. Take Test →":
      - /url: /tests/choice-reaction/
      - heading "Choice Reaction" [level=4]
      - paragraph: Map color changes to keys R, G, B, Y. Manage accuracy-speed trade-offs under cognitive decision load with built-in mismatch penalties.
      - text: Take Test →
    - link "Color Go/No-Go Inhibitory motor control. Click only when green flashes; suppress actions for distractors (Red, Blue, Purple). Take Test →":
      - /url: /tests/go-no-go/
      - heading "Color Go/No-Go" [level=4]
      - paragraph: Inhibitory motor control. Click only when green flashes; suppress actions for distractors (Red, Blue, Purple).
      - text: Take Test →
    - link "Aim Coordination Test hand-eye coordination speed. Click targets as they appear and measure your visual-motor response latency. Take Test →":
      - /url: /tests/aim-coordination/
      - heading "Aim Coordination" [level=4]
      - paragraph: Test hand-eye coordination speed. Click targets as they appear and measure your visual-motor response latency.
      - text: Take Test →
    - link "Latency & Hz Optimizer Benchmark your monitor refresh rate, event polling jitter, and true biological latency stack. Take Test →":
      - /url: /tests/latency-optimizer/
      - heading "Latency & Hz Optimizer" [level=4]
      - paragraph: Benchmark your monitor refresh rate, event polling jitter, and true biological latency stack.
      - text: Take Test →
  - article:
    - heading "Memory" [level=3]
    - paragraph: Active working capacity & retention
    - link "Sequence Memory Remember an expanding grid flash sequence, evaluating Miller's Law bounds on working memory capacity. Take Test →":
      - /url: /tests/sequence-memory/
      - heading "Sequence Memory" [level=4]
      - paragraph: Remember an expanding grid flash sequence, evaluating Miller's Law bounds on working memory capacity.
      - text: Take Test →
    - link "Number Memory Recall numeric strings of growing length to evaluate active visual digit spans. Take Test →":
      - /url: /tests/number-memory/
      - heading "Number Memory" [level=4]
      - paragraph: Recall numeric strings of growing length to evaluate active visual digit spans.
      - text: Take Test →
    - link "Visual Pattern Memorize illuminated pattern positions inside dynamic scale matrices. Take Test →":
      - /url: /tests/visual-pattern/
      - heading "Visual Pattern" [level=4]
      - paragraph: Memorize illuminated pattern positions inside dynamic scale matrices.
      - text: Take Test →
    - link "Dual N-Back Track independent auditory tone and visual positions shown N steps back, taxing working memory. Take Test →":
      - /url: /tests/dual-n-back/
      - heading "Dual N-Back" [level=4]
      - paragraph: Track independent auditory tone and visual positions shown N steps back, taxing working memory.
      - text: Take Test →
    - link "Verbal Memory Memorize growing word lists and recall them from distractor sets. Take Test →":
      - /url: /tests/verbal-memory/
      - heading "Verbal Memory" [level=4]
      - paragraph: Memorize growing word lists and recall them from distractor sets.
      - text: Take Test →
  - article:
    - heading "Reasoning" [level=3]
    - paragraph: Fluid logic & non-verbal matrices
    - link "Pattern Reasoning Identify missing items completing linear sequences, 2x2 matrices, progressions, and shape analogies. Take Test →":
      - /url: /tests/pattern-reasoning/
      - heading "Pattern Reasoning" [level=4]
      - paragraph: Identify missing items completing linear sequences, 2x2 matrices, progressions, and shape analogies.
      - text: Take Test →
    - link "Spatial Orientation Mentally rotate grid patterns and match the orientation across timed trials. Take Test →":
      - /url: /tests/spatial-orientation/
      - heading "Spatial Orientation" [level=4]
      - paragraph: Mentally rotate grid patterns and match the orientation across timed trials.
      - text: Take Test →
    - link "Speed Arithmetic Benchmark your mental calculation speed, operator accuracy, and quantitative working memory. Take Test →":
      - /url: /tests/speed-arithmetic/
      - heading "Speed Arithmetic" [level=4]
      - paragraph: Benchmark your mental calculation speed, operator accuracy, and quantitative working memory.
      - text: Take Test →
    - link "Quant-Dev Agility Grid Benchmark boolean logic processing, bitwise arithmetic shift latencies, and base-16 numerical agility. Take Test →":
      - /url: /tests/quant-dev-grid/
      - heading "Quant-Dev Agility Grid" [level=4]
      - paragraph: Benchmark boolean logic processing, bitwise arithmetic shift latencies, and base-16 numerical agility.
      - text: Take Test →
  - article:
    - heading "Focus & Attention" [level=3]
    - paragraph: Selective attention & executive suppression
    - link "Stroop Test Isolate semantic interference. Match visual ink colors ignoring the text name values. Take Test →":
      - /url: /tests/stroop/
      - heading "Stroop Test" [level=4]
      - paragraph: Isolate semantic interference. Match visual ink colors ignoring the text name values.
      - text: Take Test →
    - link "Trail Making Alternate sequences of numbers and letters (1-A-2-B...) to test search speed and cognitive flexibility. Take Test →":
      - /url: /tests/trail-making/
      - heading "Trail Making" [level=4]
      - paragraph: Alternate sequences of numbers and letters (1-A-2-B...) to test search speed and cognitive flexibility.
      - text: Take Test →
    - 'link "Focus Challenge 5-stage attention gauntlet: selective focus, impulse control, task switching, sustained vigilance, working memory under distraction. Take Test →"':
      - /url: /tests/focus-challenge/
      - heading "Focus Challenge" [level=4]
      - paragraph: "5-stage attention gauntlet: selective focus, impulse control, task switching, sustained vigilance, working memory under distraction."
      - text: Take Test →
    - link "Multiple Object Tracking Track moving target dots among distractors. Evaluates dynamic spatial attention, peripheral vision, and visual working memory. Take Test →":
      - /url: /tests/object-tracking/
      - heading "Multiple Object Tracking" [level=4]
      - paragraph: Track moving target dots among distractors. Evaluates dynamic spatial attention, peripheral vision, and visual working memory.
      - text: Take Test →
    - link "The Gauntlet Complete 5 cognitive stages — reaction, memory, focus, reasoning, precision — for a unified CAI score and archetype. Take Test →":
      - /url: /gauntlet/
      - heading "The Gauntlet" [level=4]
      - paragraph: Complete 5 cognitive stages — reaction, memory, focus, reasoning, precision — for a unified CAI score and archetype.
      - text: Take Test →
    - link "Sleep & Chronotype Assess your circadian profile, run a fatigue Stroop test, and design a light-temperature sanctuary. Take Test →":
      - /url: /tests/sleep-sanctuary/
      - heading "Sleep & Chronotype" [level=4]
      - paragraph: Assess your circadian profile, run a fatigue Stroop test, and design a light-temperature sanctuary.
      - text: Take Test →
  - article:
    - heading "Motor Performance" [level=3]
    - paragraph: Spatial mouse control & clicking stamina
    - link "CPS Test Test your clicks-per-second motor stamina over a 10s timeframe, plotting a cadence curve. Take Test →":
      - /url: /tests/click-speed/
      - heading "CPS Test" [level=4]
      - paragraph: Test your clicks-per-second motor stamina over a 10s timeframe, plotting a cadence curve.
      - text: Take Test →
    - link "Aim Precision Acquire 30 targets on our coordinates canvas, tracking offset errors in pixels. Take Test →":
      - /url: /tests/aim-trainer/
      - heading "Aim Precision" [level=4]
      - paragraph: Acquire 30 targets on our coordinates canvas, tracking offset errors in pixels.
      - text: Take Test →
    - link "Mouse Accuracy Click shrinking targets from 80px to 16px. Measures fine motor precision through center offset. Take Test →":
      - /url: /tests/mouse-accuracy/
      - heading "Mouse Accuracy" [level=4]
      - paragraph: Click shrinking targets from 80px to 16px. Measures fine motor precision through center offset.
      - text: Take Test →
    - link "Flick Trainer Flick to 15 random targets, measuring speed and click accuracy. Take Test →":
      - /url: /tests/flick-trainer/
      - heading "Flick Trainer" [level=4]
      - paragraph: Flick to 15 random targets, measuring speed and click accuracy.
      - text: Take Test →
    - link "Typing Speed Benchmark your words per minute (WPM) and typing accuracy against profession-based benchmarks. Take Test →":
      - /url: /tests/typing-speed/
      - heading "Typing Speed" [level=4]
      - paragraph: Benchmark your words per minute (WPM) and typing accuracy against profession-based benchmarks.
      - text: Take Test →
    - link "Ergonomic Architect Generate a personalized workstation blueprint matching your physical geometry and motor alignment. Take Test →":
      - /url: /tests/ergonomic-architect/
      - heading "Ergonomic Architect" [level=4]
      - paragraph: Generate a personalized workstation blueprint matching your physical geometry and motor alignment.
      - text: Take Test →
  - article:
    - heading "Executive Function" [level=3]
    - paragraph: High-level attention gating & flexibility
    - link "Decision Speed Classify 20 numbers as ≥50 or <50 against a 2-second timeout. Measures raw information processing speed. Take Test →":
      - /url: /tests/decision-speed/
      - heading "Decision Speed" [level=4]
      - paragraph: Classify 20 numbers as ≥50 or <50 against a 2-second timeout. Measures raw information processing speed.
      - text: Take Test →
    - link "Planning Tower of Hanoi with 4 disks. Move the stack to the target peg — optimal solution is 15 moves. Take Test →":
      - /url: /tests/planning/
      - heading "Planning" [level=4]
      - paragraph: Tower of Hanoi with 4 disks. Move the stack to the target peg — optimal solution is 15 moves.
      - text: Take Test →
    - link "Prioritization 5 rounds of task scheduling. Maximize points by completing high-value tasks before deadlines. Take Test →":
      - /url: /tests/prioritization/
      - heading "Prioritization" [level=4]
      - paragraph: 5 rounds of task scheduling. Maximize points by completing high-value tasks before deadlines.
      - text: Take Test →
  - heading "Frequently Asked Questions" [level=2]
  - group:
    - text: What is the average human reaction time?
    - img
  - group:
    - text: Can visual reaction speed be trained?
    - img
  - group:
    - text: How does screen refresh rate affect reaction scores?
    - img
  - group:
    - text: Why is mobile touch response slower than a mouse?
    - img
  - group:
    - text: Is this a gaming and reflex benchmark?
    - img
  - group:
    - text: Does caffeine improve motor response times?
    - img
  - group:
    - text: Does age affect reaction times?
    - img
  - group:
    - text: How can I reduce hardware latency for reaction tests?
    - img
  - strong: "Gaming Benchmark Notice:"
  - text: CogniArena is a free gaming, reflex, and esports benchmarking platform. All assessments (including visual/audio reaction speed, sequence memory, clicking frequency, and target precision) and generated metrics (including percentiles, demographic ranks, and CogniArena Index / CAI score) are competitive skill drills designed for gamers and enthusiasts to measure reaction speed, mouse accuracy, and typing speed. Built for entertainment and self-benchmarking purposes.
  - img "CogniArena"
  - text: CogniArena © 2026
  - link "About Us":
    - /url: /about/
  - text: ·
  - link "Contact":
    - /url: /contact/
  - text: ·
  - link "Privacy Policy":
    - /url: /privacy/
  - text: ·
  - link "Terms of Service":
    - /url: /terms/
  - text: ·
  - link "Methodology":
    - /url: /methodology/
  - text: ·
  - link "FAQ":
    - /url: /faq/
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Cognitive Tests Interactions', () => {
  4  |   test.beforeEach(async ({ page }) => { 
  5  |     await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  6  |   });
  7  |   
  8  |   test('Reaction Time Test flow - early abort', async ({ page }) => {
  9  |     await page.goto('/tests/reaction-time/');
  10 |     
  11 |     // Test configuration panel is visible
  12 |     await expect(page.locator('text=Reaction Time Test').first()).toBeVisible();
  13 |     
  14 |     // Find and click start button
  15 |     const startBtn = page.getByRole('button', { name: 'Start Test', exact: true });
  16 |     await expect(startBtn).toBeVisible();
  17 |     await startBtn.click({ force: true });
  18 |     
  19 |     // Verify we enter waiting state
  20 |     const gameArea = page.locator('div[role="button"][aria-live="polite"]');
> 21 |     await expect(gameArea.locator('text=WAITING')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  22 |     
  23 |     // Click while waiting to trigger abort
  24 |     await gameArea.click({ force: true });
  25 |     
  26 |     // Should show abort/too early state
  27 |     await expect(page.locator('text=⚠️')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('Gauntlet flow intro', async ({ page }) => {
  31 |     await page.goto('/gauntlet/');
  32 |     
  33 |     // Check main title
  34 |     await expect(page.locator('h1')).toContainText(/The Gauntlet/i);
  35 |     
  36 |     // Start the gauntlet
  37 |     const startGauntletBtn = page.getByRole('button', { name: 'Begin the Gauntlet', exact: true });
  38 |     if (await startGauntletBtn.isVisible()) {
  39 |       await startGauntletBtn.click({ force: true });
  40 |       
  41 |       // Should show the first stage (Reaction)
  42 |       await expect(page.locator('text=Stage 1/5')).toBeVisible();
  43 |     }
  44 |   });
  45 | });
  46 | 
```