# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests.spec.ts >> Cognitive Tests Interactions >> Gauntlet flow intro
- Location: e2e/tests.spec.ts:30:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /The Gauntlet/i
Error: strict mode violation: locator('h1') resolved to 4 elements:
    1) <h1 data-i18n="gaunt.title" class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">↵The Gauntlet↵</h1> aka locator('h1').filter({ hasText: 'The Gauntlet' })
    2) <h1>Audit</h1> aka locator('#header-left').getByText('Audit', { exact: true })
    3) <h1>No accessibility or performance issues detected.</h1> aka getByText('No accessibility or')
    4) <h1>…</h1> aka locator('h1').filter({ hasText: 'Settings' })

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - button "Close guide" [ref=e6] [cursor=pointer]
    - generic [ref=e10]:
      - generic [ref=e11]: 📖
      - generic [ref=e12]:
        - heading "How to Play" [level=2] [ref=e13]
        - paragraph [ref=e14]: Onboarding Guide
    - generic [ref=e15]:
      - generic [ref=e16]:
        - heading "💡 What It Measures" [level=3] [ref=e17]:
          - generic [ref=e18]: 💡
          - text: What It Measures
        - paragraph [ref=e19]: "A 5-stage composite esports benchmark: visual reaction speed, sequence memory, Stroop interference, matrix reasoning, and aim precision. Measures your performance across five core cognitive domains in one continuous session."
      - generic [ref=e20]:
        - heading "📈 How Scoring Works" [level=3] [ref=e21]:
          - generic [ref=e22]: 📈
          - text: How Scoring Works
        - paragraph [ref=e23]: Each stage produces a score from 0-100. The overall CogniArena Index (CAI) is the average of all five stages. Your percentile compares your CAI against the full population distribution.
      - generic [ref=e24]:
        - heading "⚡ Variables Affecting Performance" [level=3] [ref=e25]
        - paragraph [ref=e26]: Your performance in your weakest domain constrains your overall score (the weakest link effect). Mental fatigue across stages, prior experience with each test type, and hardware quality all affect results.
    - button "Got It" [ref=e28] [cursor=pointer]
  - generic [ref=e29]:
    - complementary [ref=e30]:
      - generic [ref=e31]:
        - link "CogniArena CogniArena" [ref=e32] [cursor=pointer]:
          - /url: /
          - img "CogniArena" [ref=e33]
          - generic [ref=e34]: CogniArena
        - generic [ref=e35]: Discover Your Cognitive Potential
      - navigation [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]: Ecosystem
          - link "Home Overview" [ref=e39] [cursor=pointer]:
            - /url: /
          - link "Population Benchmarks" [ref=e45] [cursor=pointer]:
            - /url: /benchmarks/
          - link "Dashboard" [ref=e50] [cursor=pointer]:
            - /url: /dashboard/
          - link "Personal Records" [ref=e55] [cursor=pointer]:
            - /url: /records/
          - link "Brain Games" [ref=e61] [cursor=pointer]:
            - /url: /brain-games/
          - link "The Gauntlet Flagship" [ref=e67] [cursor=pointer]:
            - /url: /gauntlet/
            - generic [ref=e73]: The Gauntlet
            - generic [ref=e74]: Flagship
        - group [ref=e75]:
          - generic "Reaction & Reflexes" [ref=e76] [cursor=pointer]
        - group [ref=e84]:
          - generic "Memory" [ref=e85] [cursor=pointer]
        - group [ref=e94]:
          - generic "Reasoning" [ref=e95] [cursor=pointer]
        - group [ref=e103]:
          - generic "Focus & Attention" [ref=e104] [cursor=pointer]
          - generic [ref=e112]:
            - link "Stroop Test" [ref=e113] [cursor=pointer]:
              - /url: /tests/stroop/
            - link "Trail Making" [ref=e122] [cursor=pointer]:
              - /url: /tests/trail-making/
            - link "Focus Challenge" [ref=e128] [cursor=pointer]:
              - /url: /tests/focus-challenge/
            - link "Attention Test" [ref=e133] [cursor=pointer]:
              - /url: /attention-test/
            - link "Color Game" [ref=e139] [cursor=pointer]:
              - /url: /color-game/
            - link "Sleep & Chronotype" [ref=e148] [cursor=pointer]:
              - /url: /tests/sleep-sanctuary/
        - group [ref=e154]:
          - generic "🎮 Motor Performance" [ref=e155] [cursor=pointer]:
            - generic [ref=e156]:
              - generic [ref=e157]: 🎮
              - generic [ref=e158]: Motor Performance
        - group [ref=e161]:
          - generic "Strategy & Logic" [ref=e162] [cursor=pointer]
        - group [ref=e171]:
          - generic "Quizzes" [ref=e172] [cursor=pointer]
        - group [ref=e180]:
          - generic "Learning Center" [ref=e181] [cursor=pointer]
      - generic [ref=e190]:
        - generic [ref=e191]: No recent tests yet
        - generic [ref=e193]:
          - generic [ref=e194]: Calibration Status
          - generic [ref=e195]: Online
        - generic [ref=e197]:
          - generic [ref=e198]:
            - generic [ref=e199]: Backup Sync
            - generic [ref=e200]: Local Only
          - button "Enable Cloud Sync (Backup)" [ref=e203]
        - generic [ref=e204]:
          - link "Methodology" [ref=e205] [cursor=pointer]:
            - /url: /methodology/
          - generic [ref=e206]: ·
          - link "FAQ" [ref=e207] [cursor=pointer]:
            - /url: /faq/
          - generic [ref=e208]: ·
          - link "Privacy Policy" [ref=e209] [cursor=pointer]:
            - /url: /privacy/
          - generic [ref=e210]: ·
          - link "Terms" [ref=e211] [cursor=pointer]:
            - /url: /terms/
    - main [ref=e212]:
      - generic [ref=e214]:
        - link "CogniArena" [ref=e215] [cursor=pointer]:
          - /url: /
          - img "CogniArena" [ref=e216]
        - button "Change language" [ref=e219] [cursor=pointer]:
          - generic [ref=e220]: 🇺🇸
          - generic [ref=e221]: EN
        - switch "Toggle theme" [ref=e225] [cursor=pointer]
      - generic [ref=e243]: Calibrating display refresh rate & frame timing...
      - generic [ref=e248]:
        - generic [ref=e249]:
          - navigation "Breadcrumb" [ref=e250]:
            - link "Home" [ref=e251] [cursor=pointer]:
              - /url: /
            - generic [ref=e252]: /
            - generic [ref=e253]: The Gauntlet
          - heading "The Gauntlet" [level=1] [ref=e254]
          - paragraph [ref=e255]:
            - text: A
            - strong [ref=e256]: 5-stage cognitive gauntlet
            - text: ": reaction → memory → focus → logic → precision. Takes ~4 minutes and outputs a unified CogniArena Index score and performance archetype."
        - generic [ref=e262]:
          - generic [ref=e263]: 🏆
          - heading "The Gauntlet" [level=2] [ref=e264]
          - paragraph [ref=e265]: A 5-stage cognitive gauntlet testing reaction, memory, focus, logic, and precision in one session. Takes ~4 minutes.
          - generic [ref=e267]:
            - generic [ref=e268]: Difficulty
            - generic [ref=e269]:
              - button "Easy" [ref=e270] [cursor=pointer]
              - button "Medium" [ref=e271] [cursor=pointer]
              - button "Hard" [ref=e272] [cursor=pointer]
          - generic [ref=e273]:
            - generic [ref=e274]: Sound Effects
            - button "🔊 ON" [ref=e275] [cursor=pointer]:
              - generic [ref=e276]: 🔊
              - generic [ref=e277]: "ON"
          - button "Start Assessment" [ref=e278] [cursor=pointer]
          - generic [ref=e279]: Press ? for shortcuts
        - generic [ref=e280]:
          - strong [ref=e281]: "Self-Tracking Notice:"
          - text: For self-tracking, educational, and cognitive training purposes only. Not a clinical, medical, or diagnostic evaluation.
        - article [ref=e282]:
          - generic [ref=e283]:
            - heading "How This Test Works" [level=2] [ref=e284]
            - generic [ref=e285]:
              - generic [ref=e286]:
                - generic [ref=e287]:
                  - generic [ref=e288]: "1"
                  - heading "What It Measures" [level=3] [ref=e289]
                - paragraph [ref=e290]: "A 5-stage composite esports benchmark: visual reaction speed, sequence memory, Stroop interference, matrix reasoning, and aim precision. Measures your performance across five core cognitive domains in one continuous session."
              - generic [ref=e291]:
                - generic [ref=e292]:
                  - generic [ref=e293]: "2"
                  - heading "How Scoring Works" [level=3] [ref=e294]
                - paragraph [ref=e295]: Each stage produces a score from 0-100. The overall CogniArena Index (CAI) is the average of all five stages. Your percentile compares your CAI against the full population distribution.
          - generic [ref=e296]:
            - heading "What Affects Your Results" [level=3] [ref=e297]
            - paragraph [ref=e298]: Your performance in your weakest domain constrains your overall score (the weakest link effect). Mental fatigue across stages, prior experience with each test type, and hardware quality all affect results.
          - generic [ref=e304]:
            - text: Want to understand the science? Read our full guide on
            - link "Cognitive Training & Focus Science" [ref=e305] [cursor=pointer]:
              - /url: /learn/brain-training/
            - text: .
        - generic [ref=e306]:
          - article [ref=e307]:
            - heading "What is The Gauntlet?" [level=2] [ref=e308]
            - paragraph [ref=e309]:
              - text: The Gauntlet is CogniArena' flagship multi-domain cognitive assessment. Unlike single-metric tests, it challenges
              - strong [ref=e310]: five different cognitive dimensions
              - text: in one continuous session, producing a unified CogniArena Index (CAI) score and a personalized performance archetype.
          - article [ref=e311]:
            - heading "The 5 Stages" [level=2] [ref=e312]
            - generic [ref=e313]:
              - generic [ref=e314]:
                - generic [ref=e315]: ⚡
                - generic [ref=e316]:
                  - heading "1. Visual Reaction" [level=3] [ref=e317]
                  - paragraph [ref=e318]: Raw sensorimotor reflex speed — 5 trials of click-on-green
              - generic [ref=e319]:
                - generic [ref=e320]: 🗂️
                - generic [ref=e321]:
                  - heading "2. Sequence Memory" [level=3] [ref=e322]
                  - paragraph [ref=e323]: Grid pattern recall with increasing length — tests working memory capacity
              - generic [ref=e324]:
                - generic [ref=e325]: 🎨
                - generic [ref=e326]:
                  - heading "3. Stroop Test" [level=3] [ref=e327]
                  - paragraph [ref=e328]: Color-word interference — measures cognitive inhibition and selective attention
              - generic [ref=e329]:
                - generic [ref=e330]: 🧩
                - generic [ref=e331]:
                  - heading "4. Matrix Reasoning" [level=3] [ref=e332]
                  - paragraph [ref=e333]: Pattern completion — tests fluid logic and abstract reasoning
              - generic [ref=e334]:
                - generic [ref=e335]: 🎯
                - generic [ref=e336]:
                  - heading "5. Aim Precision" [level=3] [ref=e337]
                  - paragraph [ref=e338]: Target clicking accuracy — measures fine motor control and hand-eye coordination
        - generic [ref=e339]:
          - generic [ref=e340]:
            - heading "Explore Individual Assessments" [level=2] [ref=e341]
            - paragraph [ref=e342]: Explore all esports benchmarks across six domains. Each test runs locally in your browser with sub-millisecond precision.
          - article [ref=e343]:
            - generic [ref=e344]:
              - heading "Reaction & Reflexes" [level=3] [ref=e345]
              - paragraph [ref=e349]: Raw speed & sensory pathways
            - generic [ref=e350]:
              - link "Visual Reaction Test your physical reflexes against visual triggers. Calibrate input delay, monitor refresh rate, and view population distributions. Take Test →" [ref=e351] [cursor=pointer]:
                - /url: /tests/reaction-time/
                - generic [ref=e352]:
                  - heading "Visual Reaction" [level=4] [ref=e357]
                  - paragraph [ref=e358]: Test your physical reflexes against visual triggers. Calibrate input delay, monitor refresh rate, and view population distributions.
                - generic [ref=e359]: Take Test →
              - link "Auditory Reflex Measure your auditory response speeds to low-latency synthesized sound waves. Contrast hearing triggers against visual pathways. Take Test →" [ref=e360] [cursor=pointer]:
                - /url: /tests/sound-reaction/
                - generic [ref=e361]:
                  - heading "Auditory Reflex" [level=4] [ref=e368]
                  - paragraph [ref=e369]: Measure your auditory response speeds to low-latency synthesized sound waves. Contrast hearing triggers against visual pathways.
                - generic [ref=e370]: Take Test →
              - link "F1 Start Lights Simulate a Grand Prix start gantry. Suppress anticipatory impulse and release motor actions at the exact millisecond lights extinguish. Take Test →" [ref=e371] [cursor=pointer]:
                - /url: /tests/f1-lights/
                - generic [ref=e372]:
                  - heading "F1 Start Lights" [level=4] [ref=e377]
                  - paragraph [ref=e378]: Simulate a Grand Prix start gantry. Suppress anticipatory impulse and release motor actions at the exact millisecond lights extinguish.
                - generic [ref=e379]: Take Test →
              - link "Choice Reaction Map color changes to keys R, G, B, Y. Manage accuracy-speed trade-offs under cognitive decision load with built-in mismatch penalties. Take Test →" [ref=e380] [cursor=pointer]:
                - /url: /tests/choice-reaction/
                - generic [ref=e381]:
                  - heading "Choice Reaction" [level=4] [ref=e387]
                  - paragraph [ref=e388]: Map color changes to keys R, G, B, Y. Manage accuracy-speed trade-offs under cognitive decision load with built-in mismatch penalties.
                - generic [ref=e389]: Take Test →
              - link "Color Go/No-Go Inhibitory motor control. Click only when green flashes; suppress actions for distractors (Red, Blue, Purple). Take Test →" [ref=e390] [cursor=pointer]:
                - /url: /tests/go-no-go/
                - generic [ref=e391]:
                  - heading "Color Go/No-Go" [level=4] [ref=e396]
                  - paragraph [ref=e397]: Inhibitory motor control. Click only when green flashes; suppress actions for distractors (Red, Blue, Purple).
                - generic [ref=e398]: Take Test →
              - link "Aim Coordination Test hand-eye coordination speed. Click targets as they appear and measure your visual-motor response latency. Take Test →" [ref=e399] [cursor=pointer]:
                - /url: /tests/aim-coordination/
                - generic [ref=e400]:
                  - heading "Aim Coordination" [level=4] [ref=e405]
                  - paragraph [ref=e406]: Test hand-eye coordination speed. Click targets as they appear and measure your visual-motor response latency.
                - generic [ref=e407]: Take Test →
              - link "Latency & Hz Optimizer Benchmark your monitor refresh rate, event polling jitter, and true biological latency stack. Take Test →" [ref=e408] [cursor=pointer]:
                - /url: /tests/latency-optimizer/
                - generic [ref=e409]:
                  - heading "Latency & Hz Optimizer" [level=4] [ref=e414]
                  - paragraph [ref=e415]: Benchmark your monitor refresh rate, event polling jitter, and true biological latency stack.
                - generic [ref=e416]: Take Test →
          - article [ref=e417]:
            - generic [ref=e418]:
              - heading "Memory" [level=3] [ref=e419]
              - paragraph [ref=e424]: Active working capacity & retention
            - generic [ref=e425]:
              - link "Sequence Memory Remember an expanding grid flash sequence, evaluating Miller's Law bounds on working memory capacity. Take Test →" [ref=e426] [cursor=pointer]:
                - /url: /tests/sequence-memory/
                - generic [ref=e427]:
                  - heading "Sequence Memory" [level=4] [ref=e434]
                  - paragraph [ref=e435]: Remember an expanding grid flash sequence, evaluating Miller's Law bounds on working memory capacity.
                - generic [ref=e436]: Take Test →
              - link "Number Memory Recall numeric strings of growing length to evaluate active visual digit spans. Take Test →" [ref=e437] [cursor=pointer]:
                - /url: /tests/number-memory/
                - generic [ref=e438]:
                  - heading "Number Memory" [level=4] [ref=e444]
                  - paragraph [ref=e445]: Recall numeric strings of growing length to evaluate active visual digit spans.
                - generic [ref=e446]: Take Test →
              - link "Visual Pattern Memorize illuminated pattern positions inside dynamic scale matrices. Take Test →" [ref=e447] [cursor=pointer]:
                - /url: /tests/visual-pattern/
                - generic [ref=e448]:
                  - heading "Visual Pattern" [level=4] [ref=e453]
                  - paragraph [ref=e454]: Memorize illuminated pattern positions inside dynamic scale matrices.
                - generic [ref=e455]: Take Test →
              - link "Dual N-Back Track independent auditory tone and visual positions shown N steps back, taxing working memory. Take Test →" [ref=e456] [cursor=pointer]:
                - /url: /tests/dual-n-back/
                - generic [ref=e457]:
                  - heading "Dual N-Back" [level=4] [ref=e463]
                  - paragraph [ref=e464]: Track independent auditory tone and visual positions shown N steps back, taxing working memory.
                - generic [ref=e465]: Take Test →
              - link "Verbal Memory Memorize growing word lists and recall them from distractor sets. Take Test →" [ref=e466] [cursor=pointer]:
                - /url: /tests/verbal-memory/
                - generic [ref=e467]:
                  - heading "Verbal Memory" [level=4] [ref=e473]
                  - paragraph [ref=e474]: Memorize growing word lists and recall them from distractor sets.
                - generic [ref=e475]: Take Test →
          - article [ref=e476]:
            - generic [ref=e477]:
              - heading "Reasoning" [level=3] [ref=e478]
              - paragraph [ref=e482]: Fluid logic & non-verbal matrices
            - generic [ref=e483]:
              - link "Pattern Reasoning Identify missing items completing linear sequences, 2x2 matrices, progressions, and shape analogies. Take Test →" [ref=e484] [cursor=pointer]:
                - /url: /tests/pattern-reasoning/
                - generic [ref=e485]:
                  - heading "Pattern Reasoning" [level=4] [ref=e490]
                  - paragraph [ref=e491]: Identify missing items completing linear sequences, 2x2 matrices, progressions, and shape analogies.
                - generic [ref=e492]: Take Test →
              - link "Spatial Orientation Mentally rotate grid patterns and match the orientation across timed trials. Take Test →" [ref=e493] [cursor=pointer]:
                - /url: /tests/spatial-orientation/
                - generic [ref=e494]:
                  - heading "Spatial Orientation" [level=4] [ref=e501]
                  - paragraph [ref=e502]: Mentally rotate grid patterns and match the orientation across timed trials.
                - generic [ref=e503]: Take Test →
              - link "Speed Arithmetic Benchmark your mental calculation speed, operator accuracy, and quantitative working memory. Take Test →" [ref=e504] [cursor=pointer]:
                - /url: /tests/speed-arithmetic/
                - generic [ref=e505]:
                  - heading "Speed Arithmetic" [level=4] [ref=e511]
                  - paragraph [ref=e512]: Benchmark your mental calculation speed, operator accuracy, and quantitative working memory.
                - generic [ref=e513]: Take Test →
              - link "Quant-Dev Agility Grid Benchmark boolean logic processing, bitwise arithmetic shift latencies, and base-16 numerical agility. Take Test →" [ref=e514] [cursor=pointer]:
                - /url: /tests/quant-dev-grid/
                - generic [ref=e515]:
                  - heading "Quant-Dev Agility Grid" [level=4] [ref=e520]
                  - paragraph [ref=e521]: Benchmark boolean logic processing, bitwise arithmetic shift latencies, and base-16 numerical agility.
                - generic [ref=e522]: Take Test →
          - article [ref=e523]:
            - generic [ref=e524]:
              - heading "Focus & Attention" [level=3] [ref=e525]
              - paragraph [ref=e529]: Selective attention & executive suppression
            - generic [ref=e530]:
              - link "Stroop Test Isolate semantic interference. Match visual ink colors ignoring the text name values. Take Test →" [ref=e531] [cursor=pointer]:
                - /url: /tests/stroop/
                - generic [ref=e532]:
                  - heading "Stroop Test" [level=4] [ref=e541]
                  - paragraph [ref=e542]: Isolate semantic interference. Match visual ink colors ignoring the text name values.
                - generic [ref=e543]: Take Test →
              - link "Trail Making Alternate sequences of numbers and letters (1-A-2-B...) to test search speed and cognitive flexibility. Take Test →" [ref=e544] [cursor=pointer]:
                - /url: /tests/trail-making/
                - generic [ref=e545]:
                  - heading "Trail Making" [level=4] [ref=e551]
                  - paragraph [ref=e552]: Alternate sequences of numbers and letters (1-A-2-B...) to test search speed and cognitive flexibility.
                - generic [ref=e553]: Take Test →
              - 'link "Focus Challenge 5-stage attention gauntlet: selective focus, impulse control, task switching, sustained vigilance, working memory under distraction. Take Test →" [ref=e554] [cursor=pointer]':
                - /url: /tests/focus-challenge/
                - generic [ref=e555]:
                  - heading "Focus Challenge" [level=4] [ref=e560]
                  - paragraph [ref=e561]: "5-stage attention gauntlet: selective focus, impulse control, task switching, sustained vigilance, working memory under distraction."
                - generic [ref=e562]: Take Test →
              - link "Multiple Object Tracking Track moving target dots among distractors. Evaluates dynamic spatial attention, peripheral vision, and visual working memory. Take Test →" [ref=e563] [cursor=pointer]:
                - /url: /tests/object-tracking/
                - generic [ref=e564]:
                  - heading "Multiple Object Tracking" [level=4] [ref=e570]
                  - paragraph [ref=e571]: Track moving target dots among distractors. Evaluates dynamic spatial attention, peripheral vision, and visual working memory.
                - generic [ref=e572]: Take Test →
              - generic [ref=e574]:
                - generic [ref=e575]:
                  - heading "The Gauntlet" [level=4] [ref=e581]
                  - generic [ref=e582]: Current
                - paragraph [ref=e583]: Complete 5 cognitive stages — reaction, memory, focus, reasoning, precision — for a unified CAI score and archetype.
              - link "Sleep & Chronotype Assess your circadian profile, run a fatigue Stroop test, and design a light-temperature sanctuary. Take Test →" [ref=e584] [cursor=pointer]:
                - /url: /tests/sleep-sanctuary/
                - generic [ref=e585]:
                  - heading "Sleep & Chronotype" [level=4] [ref=e591]
                  - paragraph [ref=e592]: Assess your circadian profile, run a fatigue Stroop test, and design a light-temperature sanctuary.
                - generic [ref=e593]: Take Test →
          - article [ref=e594]:
            - generic [ref=e595]:
              - heading "Motor Performance" [level=3] [ref=e596]
              - paragraph [ref=e600]: Spatial mouse control & clicking stamina
            - generic [ref=e601]:
              - link "CPS Test Test your clicks-per-second motor stamina over a 10s timeframe, plotting a cadence curve. Take Test →" [ref=e602] [cursor=pointer]:
                - /url: /tests/click-speed/
                - generic [ref=e603]:
                  - heading "CPS Test" [level=4] [ref=e608]
                  - paragraph [ref=e609]: Test your clicks-per-second motor stamina over a 10s timeframe, plotting a cadence curve.
                - generic [ref=e610]: Take Test →
              - link "Aim Precision Acquire 30 targets on our coordinates canvas, tracking offset errors in pixels. Take Test →" [ref=e611] [cursor=pointer]:
                - /url: /tests/aim-trainer/
                - generic [ref=e612]:
                  - heading "Aim Precision" [level=4] [ref=e617]
                  - paragraph [ref=e618]: Acquire 30 targets on our coordinates canvas, tracking offset errors in pixels.
                - generic [ref=e619]: Take Test →
              - link "Mouse Accuracy Click shrinking targets from 80px to 16px. Measures fine motor precision through center offset. Take Test →" [ref=e620] [cursor=pointer]:
                - /url: /tests/mouse-accuracy/
                - generic [ref=e621]:
                  - heading "Mouse Accuracy" [level=4] [ref=e626]
                  - paragraph [ref=e627]: Click shrinking targets from 80px to 16px. Measures fine motor precision through center offset.
                - generic [ref=e628]: Take Test →
              - link "Flick Trainer Flick to 15 random targets, measuring speed and click accuracy. Take Test →" [ref=e629] [cursor=pointer]:
                - /url: /tests/flick-trainer/
                - generic [ref=e630]:
                  - heading "Flick Trainer" [level=4] [ref=e635]
                  - paragraph [ref=e636]: Flick to 15 random targets, measuring speed and click accuracy.
                - generic [ref=e637]: Take Test →
              - link "Typing Speed Benchmark your words per minute (WPM) and typing accuracy against profession-based benchmarks. Take Test →" [ref=e638] [cursor=pointer]:
                - /url: /tests/typing-speed/
                - generic [ref=e639]:
                  - heading "Typing Speed" [level=4] [ref=e644]
                  - paragraph [ref=e645]: Benchmark your words per minute (WPM) and typing accuracy against profession-based benchmarks.
                - generic [ref=e646]: Take Test →
              - link "Ergonomic Architect Generate a personalized workstation blueprint matching your physical geometry and motor alignment. Take Test →" [ref=e647] [cursor=pointer]:
                - /url: /tests/ergonomic-architect/
                - generic [ref=e648]:
                  - heading "Ergonomic Architect" [level=4] [ref=e653]
                  - paragraph [ref=e654]: Generate a personalized workstation blueprint matching your physical geometry and motor alignment.
                - generic [ref=e655]: Take Test →
          - article [ref=e656]:
            - generic [ref=e657]:
              - heading "Executive Function" [level=3] [ref=e658]
              - paragraph [ref=e663]: High-level attention gating & flexibility
            - generic [ref=e664]:
              - link "Decision Speed Classify 20 numbers as ≥50 or <50 against a 2-second timeout. Measures raw information processing speed. Take Test →" [ref=e665] [cursor=pointer]:
                - /url: /tests/decision-speed/
                - generic [ref=e666]:
                  - heading "Decision Speed" [level=4] [ref=e671]
                  - paragraph [ref=e672]: Classify 20 numbers as ≥50 or <50 against a 2-second timeout. Measures raw information processing speed.
                - generic [ref=e673]: Take Test →
              - link "Planning Tower of Hanoi with 4 disks. Move the stack to the target peg — optimal solution is 15 moves. Take Test →" [ref=e674] [cursor=pointer]:
                - /url: /tests/planning/
                - generic [ref=e675]:
                  - heading "Planning" [level=4] [ref=e682]
                  - paragraph [ref=e683]: Tower of Hanoi with 4 disks. Move the stack to the target peg — optimal solution is 15 moves.
                - generic [ref=e684]: Take Test →
              - link "Prioritization 5 rounds of task scheduling. Maximize points by completing high-value tasks before deadlines. Take Test →" [ref=e685] [cursor=pointer]:
                - /url: /tests/prioritization/
                - generic [ref=e686]:
                  - heading "Prioritization" [level=4] [ref=e691]
                  - paragraph [ref=e692]: 5 rounds of task scheduling. Maximize points by completing high-value tasks before deadlines.
                - generic [ref=e693]: Take Test →
      - generic [ref=e694]:
        - heading "Frequently Asked Questions" [level=2] [ref=e695]
        - generic [ref=e696]:
          - group [ref=e697]:
            - generic "What is the CogniArena Gauntlet?" [ref=e698] [cursor=pointer]
          - group [ref=e701]:
            - generic "How does Gauntlet scoring work?" [ref=e702] [cursor=pointer]
          - group [ref=e705]:
            - generic "What is a good Gauntlet score?" [ref=e706] [cursor=pointer]
          - group [ref=e709]:
            - generic "Is the Gauntlet diagnostic for cognitive speed?" [ref=e710] [cursor=pointer]
          - group [ref=e713]:
            - generic "Can I restart a Gauntlet run mid-way?" [ref=e714] [cursor=pointer]
          - group [ref=e717]:
            - generic "How does fatigue affect my Gauntlet score?" [ref=e718] [cursor=pointer]
          - group [ref=e721]:
            - generic "What cognitive skills does the Gauntlet measure?" [ref=e722] [cursor=pointer]
          - group [ref=e725]:
            - generic "Is there a leaderboard for the Gauntlet?" [ref=e726] [cursor=pointer]
      - generic [ref=e729]:
        - generic [ref=e730]:
          - strong [ref=e731]: "Gaming Benchmark Notice:"
          - text: CogniArena is a free gaming, reflex, and esports benchmarking platform. All assessments (including visual/audio reaction speed, sequence memory, clicking frequency, and target precision) and generated metrics (including percentiles, demographic ranks, and CogniArena Index / CAI score) are competitive skill drills designed for gamers and enthusiasts to measure reaction speed, mouse accuracy, and typing speed. Built for entertainment and self-benchmarking purposes.
        - generic [ref=e732]:
          - generic [ref=e733]:
            - img "CogniArena" [ref=e734]
            - generic [ref=e735]: CogniArena
            - generic [ref=e736]: © 2026
          - generic [ref=e737]:
            - link "About Us" [ref=e738] [cursor=pointer]:
              - /url: /about/
            - generic [ref=e739]: ·
            - link "Contact" [ref=e740] [cursor=pointer]:
              - /url: /contact/
            - generic [ref=e741]: ·
            - link "Privacy Policy" [ref=e742] [cursor=pointer]:
              - /url: /privacy/
            - generic [ref=e743]: ·
            - link "Terms of Service" [ref=e744] [cursor=pointer]:
              - /url: /terms/
            - generic [ref=e745]: ·
            - link "Methodology" [ref=e746] [cursor=pointer]:
              - /url: /methodology/
            - generic [ref=e747]: ·
            - link "FAQ" [ref=e748] [cursor=pointer]:
              - /url: /faq/
  - generic [ref=e751]:
    - button [ref=e752]
    - button [ref=e758]
    - button [ref=e762]
    - button [ref=e767]
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
  21 |     await expect(gameArea.locator('text=WAITING')).toBeVisible();
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
> 34 |     await expect(page.locator('h1')).toContainText(/The Gauntlet/i);
     |                                      ^ Error: expect(locator).toContainText(expected) failed
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