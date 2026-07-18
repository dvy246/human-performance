const fs = require('fs');
const path = require('path');

const faqsData = {
  "reaction-time": [
    { q: "What is the average human reaction time?", a: "The average human visual reaction time to a light stimulus is approximately 250ms to 280ms. Sound reaction time is typically faster, averaging around 170ms." },
    { q: "Can visual reaction speed be trained?", a: "Yes. While genetics establish a baseline reaction threshold, consistent visual coordination drills, training, and gaming can trim your reaction time by 20ms to 50ms." },
    { q: "How does screen refresh rate affect reaction scores?", a: "Higher refresh rates (e.g. 144Hz, 240Hz, 360Hz) display target changes sooner. A 360Hz display draws frames every 2.7ms, compared to 16.7ms on 60Hz, reducing input lag." },
    { q: "Why is mobile touch response slower than a mouse?", a: "Mobile touch digitizers process inputs in grids, adding 15ms to 40ms of touch latency compared to physical microswitch mouse buttons." },
    { q: "Is this reaction test a medical diagnostic tool?", a: "No. This test is designed for self-tracking, performance benchmarking, and cognitive training. It does not replace a clinical neurological evaluation." },
    { q: "Does caffeine improve motor response times?", a: "Yes. Caffeine acts as a central nervous system stimulant, temporarily accelerating neurotransmission and reducing reaction latency." },
    { q: "Does age affect reaction times?", a: "Yes. Reaction times generally increase slowly with age, showing a gradual deceleration of 2ms to 4ms per decade after age 24." },
    { q: "How can I reduce hardware latency for reaction tests?", a: "Use a wired 1000Hz polling-rate mouse, turn off V-Sync in browser settings, and close background CPU-heavy applications." }
  ],
  "sound-reaction": [
    { q: "What is the average auditory reaction speed?", a: "The average human response to an auditory stimulus is approximately 140ms to 160ms, which is significantly faster than the visual reaction threshold." },
    { q: "Why is sound reaction faster than visual reaction?", a: "The auditory pathway takes fewer synaptic connections to reach the brainstem (about 8-10ms) compared to the retinal pathway to the visual cortex (about 20-40ms)." },
    { q: "Does headphone latency affect my sound score?", a: "Yes. Bluetooth headphones add 50ms to 150ms of audio transmission lag. For maximum accuracy, use wired headphones." },
    { q: "Can background noise slow sound reaction time?", a: "Yes. High ambient noise levels increase cognitive filtering load, delaying the auditory response trigger." },
    { q: "Is the auditory reaction test diagnostic for ADHD?", a: "No. This test is a self-tracking cognitive benchmark and is not a clinical diagnosis tool for attention deficits." },
    { q: "Does age impact auditory reaction speed?", a: "Yes. Auditory reaction speed declines slightly with age, but typically at a slower rate than visual spatial reaction speed." },
    { q: "Does hydration affect sound reflex scores?", a: "Yes. Dehydration decreases cell volume and slows neural conduction, resulting in slower reflex speeds." },
    { q: "What is the best browser setting for audio speed tests?", a: "Ensure the browser uses low-latency Web Audio API oscillators, disable audio enhancements in OS settings, and run tests in quiet settings." }
  ],
  "f1-lights": [
    { q: "What is the average reaction speed of an F1 driver?", a: "F1 drivers react in approximately 100ms to 200ms when the red start lights extinguish, relying on intense visual anticipation and motor drills." },
    { q: "What constitutes a jump start in F1?", a: "Reacting in under 100ms is classified as a jump start because it is faster than the physical limits of human neural processing without anticipation." },
    { q: "How to improve reaction times on the F1 lights simulator?", a: "Focus on the dark space beneath the red lights, use a high-refresh monitor, and use a wired microswitch mouse." },
    { q: "Does age slow F1 start reactions?", a: "Yes, visual motor reaction speeds decline slowly with age, but consistent reflex training can maintain fast response thresholds." },
    { q: "Is the F1 reaction test a clinical diagnostic tool?", a: "No, this is an entertainment simulator designed to let fans compare their reaction speeds against professional motorsport baselines." },
    { q: "Does caffeine help with F1 start times?", a: "Yes, central nervous system stimulants like caffeine reduce motor trigger latency, temporarily boosting reaction times." },
    { q: "Why does the F1 lights test randomize the start delay?", a: "To prevent users from predicting or rhythmically timing the start, ensuring they react solely to the visual extinction of the lights." },
    { q: "How does input device polling rate affect F1 scores?", a: "A 1000Hz gaming mouse sends coordinates every 1ms, whereas a standard 125Hz mouse adds up to 8ms of random click input delay." }
  ],
  "choice-reaction": [
    { q: "What is a choice reaction test?", a: "A choice reaction test measures the time it takes to process a stimulus and select the correct response key from multiple alternatives." },
    { q: "What is Hick's Law in choice reaction?", a: "Hick's Law states that choice reaction time increases logarithmically with the number of options or stimulus choices available." },
    { q: "What is the average choice reaction speed?", a: "The average choice reaction speed ranges from 350ms to 500ms, which is slower than simple reaction time due to decision-making overhead." },
    { q: "Does choice reaction measure IQ or processing speed?", a: "It measures processing speed, sensory gating, and choice execution efficiency, which correlate with cognitive speed but do not represent a full IQ score." },
    { q: "Is choice reaction diagnostic for cognitive decay?", a: "No. While research uses choice tests to monitor cognitive changes, this tool is strictly for educational tracking and self-assessment." },
    { q: "How can I train choice reaction speed?", a: "Familiarize yourself with key positions (R, G, B, Y) to reduce muscle search latency and develop automatic motor responses." },
    { q: "Why do wrong choices carry reaction time penalties?", a: "Penalties prevent 'button mashing' or random guessing, forcing users to prioritize accuracy and visual discrimination." },
    { q: "Does fatigue affect choice reaction scores?", a: "Yes, mental fatigue significantly slows choice selection times as the brain takes longer to filter distractors and resolve decision paths." }
  ],
  "go-no-go": [
    { q: "What is the Go/No-Go cognitive test?", a: "The Go/No-Go test measures response inhibition and motor suppression, assessing the brain's ability to withhold automatic reactions." },
    { q: "What is a commission error (false alarm)?", a: "A commission error occurs when a user clicks on a distractor target (No-Go), indicating a failure of executive impulse control." },
    { q: "What is the average reaction speed on a Go/No-Go test?", a: "The average response speed on correct Go trials is 300ms to 400ms, which is slower than simple reaction tests due to stimulus evaluation." },
    { q: "Is the Go/No-Go test used to diagnose ADHD?", a: "No. While clinical settings use Go/No-Go tests to evaluate attention control, this version is strictly a self-tracking cognitive drill." },
    { q: "How can I reduce false alarms in a Go/No-Go test?", a: "Slow down your response pace slightly to give your visual cortex enough time to confirm the target color before clicking." },
    { q: "Does age affect Go/No-Go performance?", a: "Yes. Executive suppression capabilities peak in early adulthood and slowly decline, though training helps retain inhibition control." },
    { q: "What is the omission error rate?", a: "An omission error is failing to click on a correct Go target. It indicates a lapse in sustained attention or vigilance." },
    { q: "Does sleep deprivation impact Go/No-Go scores?", a: "Yes, sleep deprivation causes a spike in both false alarms (impulsivity) and missed targets (inattention)." }
  ],
  "aim-coordination": [
    { q: "What is aim coordination tracking?", a: "Aim coordination tracking measures hand-eye sync by tracking your ability to hit targets moving in predictable or random trajectories." },
    { q: "How can I train mouse aim coordination?", a: "Practice visual tracking drills at moderate mouse DPI settings, using forearm movements instead of wrist articulation." },
    { q: "What is the average aim target response speed?", a: "Average target coordination acquisition speed ranges from 400ms to 600ms per hit, depending on target size and distance." },
    { q: "Is aim coordination a clinical motor diagnostic?", a: "No, this test is an educational self-tracking metric for coordination and gaming reflex tracking." },
    { q: "Does screen refresh rate affect target tracking?", a: "Yes, higher refresh rates (144Hz+) provide smoother target trajectories, allowing your visual tracking system to coordinate pointer moves." },
    { q: "What DPI settings are best for aim precision?", a: "Most precision users prefer 400 to 800 DPI with moderate operating system sensitivity to prevent cursor overshoot." },
    { q: "What is target offset tracking?", a: "Offset tracking measures how far from the exact center of the target your pointer clicked, indicating precision control." },
    { q: "Does finger fatigue slow aim coordination scores?", a: "Yes, physical muscle strain in the hand or wrist slows joint activation times and reduces tracking accuracy." }
  ],
  "sequence-memory": [
    { q: "What is sequence memory?", a: "Sequence memory measures visual-spatial working memory span by requiring you to recall an expanding grid flash sequence." },
    { q: "What is the average sequence memory score?", a: "The average healthy adult score on a sequence memory test is 7 to 9 steps, matching Miller's Law on visual-spatial chunks." },
    { q: "Can sequence memory be improved?", a: "Yes, using memory strategies like chunking sequences into geometric patterns (e.g. triangles, lines) increases recall limits." },
    { q: "Is this test diagnostic for spatial working memory disorders?", a: "No, this is a self-assessment and training game and is not a clinical diagnostic tool." },
    { q: "Why is sequence memory harder than number memory?", a: "Sequence memory requires spatial coordinate mapping and serial recall, whereas number memory can be chunked phonologically." },
    { q: "Does age affect visual-spatial sequence recall?", a: "Yes, spatial working memory capacity peaks in the mid-20s and shows a gradual decline over time." },
    { q: "Does screen size affect sequence memory?", a: "Yes, larger screens require wider eye movements, increasing spatial search overhead compared to compact screens." },
    { q: "What is the impact of distractions on memory scores?", a: "Visual or auditory distractions disrupt the active mental rehearsal loop, causing sequence recall to decay rapidly." }
  ],
  "number-memory": [
    { q: "What is the digit span memory test?", a: "The digit span test measures auditory-visual working memory capacity by asking you to recall strings of numbers of increasing length." },
    { q: "What is Miller's Law (Magic Number Seven)?", a: "Miller's Law states that the average human working memory can hold approximately 7±2 chunks of information simultaneously." },
    { q: "How can I improve my number memory score?", a: "Use chunking techniques (grouping numbers into blocks of 3 or 4) or associate sequences with familiar dates or codes." },
    { q: "Does number memory measure IQ?", a: "While digit span is a component in formal IQ tests (like WAIS), this standalone online version is not a diagnostic IQ test." },
    { q: "Is digit span used to screen for dementia?", a: "Yes, clinical cognitive assessments use digit span tests, but this site's version is strictly for educational tracking." },
    { q: "What is the difference between visual and verbal digit recall?", a: "Visual digit recall relies on spelling pathways, whereas phonological loops occur when subvocalizing the numbers." },
    { q: "Does age decline digit memory scores?", a: "Yes, phonological working memory peaks in early adulthood and slowly decays, but regular memory drills help maintain it." },
    { q: "Does typing speed affect my number memory score?", a: "No, the test gives you unlimited input time so typing latency does not affect your final memory score." }
  ],
  "visual-pattern": [
    { q: "What is the visual pattern test?", a: "The visual pattern test measures visual-spatial working memory by presenting a grid with a matrix of active cells to recall." },
    { q: "What is the average visual pattern score?", a: "The average visual pattern recall score is approximately 10 to 12 tiles in a grid." },
    { q: "How to improve visual pattern recall?", a: "Group active tiles into spatial clusters or look for symmetry and negative space configurations in the grid layout." },
    { q: "Is this test diagnostic for neurological spatial deficits?", a: "No. This test is a self-tracking tool and is not a clinical neuropsychological evaluation." },
    { q: "Does grid size affect pattern recall?", a: "Yes, larger grids increase visual complexity and introduce spatial distractors, raising the cognitive load." },
    { q: "Can spatial memory be trained?", a: "Yes, regular visual-spatial exercises can expand visual block recall limits by strengthening active visual working memory." },
    { q: "Why is visual memory different from verbal memory?", a: "Visual memory maps spatial coordinates in the right hemisphere of the brain, while verbal memory maps linguistic constructs in the left." },
    { q: "Does mental fatigue affect visual pattern scores?", a: "Yes, visual processing speed and visual recall capacity are highly sensitive to sleep deprivation and cognitive exhaustion." }
  ],
  "dual-n-back": [
    { q: "What is the Dual N-Back task?", a: "Dual N-Back is a working memory training game where you track a sequence of visual positions and audio letters simultaneously, identifying matches 'N' steps back." },
    { q: "Does Dual N-Back increase fluid intelligence?", a: "Studies suggest that consistent Dual N-Back training increases fluid intelligence (general problem-solving speed) by expanding working memory." },
    { q: "What is the average Dual N-Back level?", a: "Most beginners start at 1-Back or 2-Back. Advanced trainees can maintain tracking at 3-Back or 4-Back." },
    { q: "How does Dual N-Back train the brain?", a: "It forces the brain to continuously update visual and auditory sensory stores, filtering out old inputs while encoding new ones." },
    { q: "Is Dual N-Back diagnostic for ADHD?", a: "No. While often used to train attention control in people with ADHD, it is not a diagnostic tool." },
    { q: "What is the best strategy for Dual N-Back?", a: "Develop a rhythmic subvocalization loop for the letters while keeping a relaxed spatial gaze on the grid targets." },
    { q: "How long should I train on Dual N-Back?", a: "Research recommends training for 20 minutes a day, 4 to 5 times a week, to see focus gains." },
    { q: "Why is Dual N-Back so difficult?", a: "It requires divided attention and continuous memory updating, preventing the brain from using simple passive storage shortcuts." }
  ],
  "verbal-memory": [
    { q: "What is a verbal memory test?", a: "A verbal memory test measures your recognition memory for words, evaluating your ability to distinguish between seen and new words." },
    { q: "What is the average verbal memory score?", a: "The average score on a verbal memory word test is approximately 30 to 45 words before making 3 strikes." },
    { q: "How can I improve verbal memory?", a: "Subvocalize words as they appear, create a quick narrative link between consecutive words, or visualize the object described." },
    { q: "Is the verbal memory test diagnostic for cognitive decline?", a: "No, this online test is designed for self-tracking and is not a clinical assessment for dementia or cognitive impairment." },
    { q: "Why do we make false positive errors on words?", a: "The brain uses semantic generalization, confusing similar words (e.g. 'house' and 'home') if word-encoding focus is weak." },
    { q: "Does vocabulary size affect verbal memory scores?", a: "A larger active vocabulary makes encoding faster as the brain has pre-existing semantic associations for the words." },
    { q: "Can verbal memory be trained?", a: "Yes, verbal mnemonics, reading, and recognition memory drills help optimize language storage and retrieval pathways." },
    { q: "How does stress impact verbal word memory?", a: "High cortisol levels disrupt hippocampal function, impairing verbal word recall and word association processing." }
  ],
  "pattern-reasoning": [
    { q: "What is a pattern reasoning test?", a: "Pattern reasoning measures visual logic and fluid intelligence by requiring you to solve matrix patterns and missing shape sequences." },
    { q: "Does pattern reasoning test measure IQ?", a: "Pattern matrices are similar to Ravens Progressive Matrices used in IQ tests, but this standalone version does not provide a formal IQ score." },
    { q: "What is fluid intelligence?", a: "Fluid intelligence is the capacity to think logically, analyze patterns, and solve novel problems independent of acquired knowledge." },
    { q: "How to improve pattern reasoning scores?", a: "Deconstruct shapes into variables: check rotation angles, count sides, trace shifting colors, and analyze row/column rules." },
    { q: "Is this test diagnostic for learning disorders?", a: "No. This test is an educational self-assessment tool and is not a clinical learning check." },
    { q: "What is the difference between fluid and crystallized intelligence?", a: "Fluid intelligence is raw logic and problem-solving speed, while crystallized intelligence is acquired knowledge and vocabulary." },
    { q: "Does age affect fluid reasoning scores?", a: "Fluid intelligence typically peaks in late adolescence or early 20s and declines slowly, while training helps sustain it." },
    { q: "Does this test have a time limit?", a: "Different test settings offer timed or untimed trials, with timed grids assessing processing speed under pressure." }
  ],
  "spatial-orientation": [
    { q: "What is spatial orientation testing?", a: "Spatial orientation measures mental rotation, requiring you to determine your perspective or coordinate directions from a 3D visual perspective." },
    { q: "What is mental rotation?", a: "Mental rotation is the cognitive ability to rotate 2D or 3D representations of objects in your mind's eye." },
    { q: "How can I train spatial orientation?", a: "Practice rotating basic blocks, playing 3D orientation puzzles, or visualizing architectural designs from different angles." },
    { q: "Is spatial orientation diagnostic for spatial deficits?", a: "No, this is a cognitive self-tracking game and does not replace a clinical neuropsychological check." },
    { q: "Do video games improve spatial rotation skills?", a: "Yes, fast-paced 3D spatial video games (like flight simulators or first-person shooters) strongly develop spatial orientation." },
    { q: "Are men or women better at spatial tests?", a: "Studies show slight average demographic differences, but training and experience are the strongest predictors of individual scores." },
    { q: "Does age decline spatial rotation speed?", a: "Spatial processing is one of the fluid abilities that shows a gradual decrease with age, but active visual training mitigates this." },
    { q: "How does spatial orientation relate to math skills?", a: "Visual-spatial processing shares neural pathways in the parietal lobe with quantitative calculation and spatial mapping." }
  ],
  "stroop": [
    { q: "What is the Stroop Effect?", a: "The Stroop Effect is the cognitive delay that occurs when processing conflicting information, such as reading the word 'Blue' printed in Red ink." },
    { q: "What does the Stroop test measure?", a: "It measures selective attention, cognitive flexibility, and processing speed, checking your ability to suppress automatic reactions." },
    { q: "What is the average Stroop reaction time?", a: "The average reaction time for matching color trials is 500ms, while conflicting (incongruent) trials average 700ms to 900ms." },
    { q: "Is the Stroop test used to diagnose brain injury?", a: "Clinical Stroop tests are used by neuropsychologists to assess executive deficits, but this online version is not a medical diagnostic tool." },
    { q: "Can I train to overcome the Stroop interference?", a: "Yes. Regular training helps you focus visual attention on the physical ink color while gating the word-reading impulse." },
    { q: "What is the incongruent trial in Stroop?", a: "An incongruent trial is when the color word and the font color clash, requiring maximum cognitive suppression to select correctly." },
    { q: "How does fatigue affect Stroop interference?", a: "Mental exhaustion decreases executive control, causing a wider reaction gap between congruent and incongruent trials." },
    { q: "Why is word reading automatic?", a: "Word reading is a highly practiced skill. For literate adults, word reading is faster and more automatic than color identification." }
  ],
  "trail-making": [
    { q: "What is the Trail Making Test (TMT)?", a: "The Trail Making Test measures cognitive flexibility and processing speed by requiring you to connect targets in sequence (Part A: 1-2-3; Part B: 1-A-2-B)." },
    { q: "What is the difference between TMT Part A and Part B?", a: "Part A measures visual search and scanning, while Part B introduces rule-switching (alternating numbers and letters), requiring higher cognitive load." },
    { q: "What is the average score for TMT Part B?", a: "For healthy adults, completing TMT Part B in under 60 seconds is typical. Scores above 90 seconds can indicate slower switching speeds." },
    { q: "Is this test diagnostic for cognitive impairment?", a: "Clinical TMT tests screen for executive dysfunction. However, this online version is for self-tracking and is not a diagnostic tool." },
    { q: "How can I improve my Trail Making score?", a: "Scan ahead visually to locate the next target in the sequence while clicking the current one to reduce target search time." },
    { q: "Does mouse latency affect TMT scores?", a: "Minor input delay can impact scores, but visual scanning speed and cognitive rule-switching are the primary factors." },
    { q: "Why do errors carry a time penalty in Trail Making?", a: "Time penalties enforce accuracy, preventing users from guessing paths and emphasizing visual accuracy." },
    { q: "Does age impact Trail Making performance?", a: "Yes, task-switching speeds decrease gradually with age as executive processing time increases." }
  ],
  "focus-challenge": [
    { q: "What is the Focus Challenge test?", a: "The Focus Challenge is a 5-stage cognitive assessment measuring selective attention, impulse control, task-switching, sustained vigilance, and working memory." },
    { q: "How is the composite Focus Score calculated?", a: "The score aggregates your accuracy, reaction time consistency, and target discrimination across all five attention stages." },
    { q: "Can I use the Focus Challenge to diagnose ADHD?", a: "No. This test tracks focus metrics but cannot diagnose ADHD or attention disorders. Consult a licensed psychologist for diagnosis." },
    { q: "How long is the Focus Challenge?", a: "The full assessment takes approximately 5 minutes, testing your sustained attention capacity under visual distractions." },
    { q: "What is the sustained vigilance stage?", a: "The vigilance stage requires you to maintain focus on rare target changes over a longer duration, measuring focus stability." },
    { q: "How do audio-visual distractions affect scores?", a: "Distractions challenge your sensory gating, forcing your prefrontal cortex to filter noise to maintain target tracking." },
    { q: "What is the average score on the Focus Challenge?", a: "A score of 700 to 850 indicates strong, stable attention control, while scores below 500 suggest potential focus fatigue." },
    { q: "Can I train to improve my focus score?", a: "Yes, regular practice with attention-demanding drills can improve your score by optimizing selective focus and impulse control." }
  ],
  "gauntlet": [
    { q: "What is the CogniArena Gauntlet?", a: "The Gauntlet is a 5-stage composite test checking reaction speed, sequence memory, Stroop interference, reasoning matrices, and aim precision in one run." },
    { q: "How does Gauntlet scoring work?", a: "It calculates a combined index (0 to 1000) based on your performance across all five stages, comparing your score to the global database." },
    { q: "What is a good Gauntlet score?", a: "A score above 800 is elite (top 10%), while a score between 500 and 700 represents typical cognitive performance." },
    { q: "Is the Gauntlet diagnostic for cognitive speed?", a: "No. The Gauntlet is a gaming challenge designed for cognitive tracking, esports benchmarking, and self-assessment." },
    { q: "Can I restart a Gauntlet run mid-way?", a: "Yes, there is a quit/restart button to return to the config menu if you make an error, though this resets the current run's metrics." },
    { q: "How does fatigue affect my Gauntlet score?", a: "Because it tests multiple cognitive domains back-to-back, the Gauntlet is highly sensitive to mental fatigue and sleep loss." },
    { q: "What cognitive skills does the Gauntlet measure?", a: "It measures raw motor reflexes, visual-spatial memory, selective attention, inductive reasoning, and hand-eye targeting." },
    { q: "Is there a leaderboard for the Gauntlet?", a: "Yes, personal records are cached locally, and sync features allow you to compare your scores on the global leaderboard." }
  ],
  "click-speed": [
    { q: "What is a Click Speed Test (CPS)?", a: "The Click Speed Test measures your clicking frequency in Clicks Per Second (CPS) over a set duration (typically 5, 10, or 60 seconds)." },
    { q: "What is the average human CPS score?", a: "The average human click speed ranges from 6 to 9 clicks per second on standard computer mice." },
    { q: "What clicking techniques increase click speed?", a: "Techniques like Jitter Clicking (vibrating forearm muscles) and Butterfly Clicking (alternating two fingers on one button) can push scores above 12-15 CPS." },
    { q: "Can click speed tests cause wrist strain?", a: "Yes. High-frequency clicking can cause strain or Repetitive Strain Injury (RSI). Always warm up and stretch your fingers." },
    { q: "Does my mouse hardware affect click speed?", a: "Yes. Gaming mice with optical microswitches have shorter travel distances and zero debounce delay, allowing for faster click registration." },
    { q: "Is click speed test clinically diagnostic?", a: "No, this is a motor training game and competitive speed metric for gaming." },
    { q: "Does CPS decline with age?", a: "Yes. Joint mobility and motor conduction speed decline slowly, but consistent finger training helps maintain finger speed." },
    { q: "Why is the 60-second click test harder than the 5-second test?", a: "The 60-second test measures muscular endurance and clicking stamina, causing hand fatigue that drops your average CPS." }
  ],
  "aim-trainer": [
    { q: "What is the visual Aim Trainer test?", a: "The Aim Trainer measures target acquisition speed and visual reaction by tracking how quickly you can click targets appearing on a grid." },
    { q: "What is a good average time on the Aim Trainer?", a: "An average response time of 350ms to 450ms per target is typical for experienced users. Elite gamers score below 300ms." },
    { q: "How to improve aiming speed and precision?", a: "Keep your mouse hand relaxed, use forearm movements for large shifts, and configure your mouse sensitivity (DPI) properly." },
    { q: "What is Fitts's Law in target selection?", a: "Fitts's Law states that the time required to move to a target is a function of the target's distance and its size." },
    { q: "Is this aim trainer diagnostic for motor coordination?", a: "No. This tool is designed for gaming practice, target speed training, and motor reflex self-tracking." },
    { q: "Does mouse weight affect aiming speed?", a: "Yes. Ultra-light gaming mice (under 60g) reduce static friction, helping you initiate cursor movements faster." },
    { q: "What mouse DPI is best for the Aim Trainer?", a: "Most users use 800 DPI with moderate system sensitivity to achieve a balance between speed and pinpoint accuracy." },
    { q: "Does screen size affect aiming scores?", a: "Yes, larger monitors require wider physical cursor sweeps. Keeping the game container compact can improve score metrics." }
  ],
  "mouse-accuracy": [
    { q: "What is the Mouse Accuracy test?", a: "The Mouse Accuracy test measures your clicking precision by requiring you to hit targets that shrink over time." },
    { q: "What is the average accuracy score?", a: "An accuracy score above 90% at moderate speeds is typical. Hitting smaller targets requires careful pointer control." },
    { q: "How can I train mouse precision?", a: "Slow down your click rate, focus on clicking the exact center of targets, and ensure mouse acceleration (precision pointer enhancement) is disabled in your OS." },
    { q: "Why do targets shrink in this test?", a: "Target shrinking simulates time pressure, forcing you to balance speed with clicking accuracy before the target disappears." },
    { q: "Is mouse accuracy test diagnostic for tremors?", a: "No. While motor tremors affect scores, this test is an educational gaming metric and not a clinical diagnosis tool." },
    { q: "What hardware setup is best for mouse precision?", a: "Use a high-quality mousepad, a gaming mouse with zero sensor acceleration, and clean mouse feet." },
    { q: "Does mouse grip style affect accuracy?", a: "Yes. Claw and fingertip grips offer precise micro-adjustments for small targets, while palm grip is better for large sweeps." },
    { q: "Can I play this test on a trackpad?", a: "You can, but trackpads have high translation latency and lack microswitch buttons, which will significantly lower your accuracy scores." }
  ],
  "flick-trainer": [
    { q: "What is a Flick Trainer test?", a: "The Flick Trainer measures your speed and precision when making rapid 'flick' movements from a central point to targets that appear briefly." },
    { q: "What is a good flick reaction time?", a: "A flick time of under 350ms with over 80% accuracy is typical for advanced shooters and precision gamers." },
    { q: "How do I build muscle memory for flicks?", a: "Practice at a consistent mouse DPI setting, always return your cursor to the center, and practice slow, accurate swipes before increasing speed." },
    { q: "Does mouse acceleration hurt flick training?", a: "Yes. Mouse acceleration changes cursor distance based on speed, disrupting muscle memory. Disable it in your OS settings." },
    { q: "Is the flick trainer diagnostic for motor tracking?", a: "No. This test is a gaming benchmark and motor coordination drill, not a clinical motor evaluation." },
    { q: "Why do targets disappear so quickly?", a: "Brief target lifetimes force you to initiate rapid motor plans, training your reflexes and spatial coordination." },
    { q: "What mouse DPI is recommended for flicking?", a: "Most precision users prefer 400 to 800 DPI to avoid cursor overshoot when making rapid hand movements." },
    { q: "Does wrist posture affect flick performance?", a: "Yes. Keep your wrist straight and pivot from your elbow and shoulder to prevent strain and improve movement consistency." }
  ],
  "typing-speed": [
    { q: "What is the average typing speed (WPM)?", a: "The average human typing speed is approximately 40 Words Per Second (WPM). Professional typists average 75 to 90 WPM." },
    { q: "How is typing accuracy calculated?", a: "Accuracy is the percentage of correctly typed characters relative to the total characters entered, with backspace corrections factored in." },
    { q: "How can I improve my typing speed?", a: "Use touch typing techniques (positioning fingers on home row keys), look at the screen instead of your hands, and practice regularly." },
    { q: "Does keyboard switch type affect typing speed?", a: "Yes. Many typists prefer mechanical keyboards with tactile switches (like brown or blue switches) for clean feedback, though linear switches are quieter." },
    { q: "Is the typing test a diagnostic tool?", a: "No. This is a typing training tool and speed assessment, not a clinical assessment for learning or motor difficulties." },
    { q: "What is the difference between net WPM and gross WPM?", a: "Gross WPM measures raw typing speed, while net WPM subtracts penalties for uncorrected errors to emphasize accuracy." },
    { q: "Why is posture important for typing?", a: "Keeping your wrists straight and elbows at a 90-degree angle prevents fatigue and reduces the risk of repetitive strain injuries (RSI)." },
    { q: "Can children take the typing speed test?", a: "Yes. Learning touch typing early helps kids develop muscle memory and increases computer literacy speeds." }
  ],
  "decision-speed": [
    { q: "What is a decision speed test?", a: "The decision speed test measures the time it takes to analyze visual rules and sort items into target zones." },
    { q: "What does decision speed measure?", a: "It measures processing speed, visual categorization efficiency, and decision thresholds under time pressure." },
    { q: "What is the average decision speed score?", a: "Average item sorting time ranges from 500ms to 700ms, depending on target complexity." },
    { q: "Is decision speed diagnostic for ADHD or dementia?", a: "No. This is a self-tracking cognitive game and is not a clinical diagnosis for attention or memory conditions." },
    { q: "How can I train decision speed?", a: "Minimize target search time by looking at the sorting color or rule card before the item appears in the sorting field." },
    { q: "How does cognitive fatigue affect decision speed?", a: "Fatigue slows sensory processing, making it take longer for the brain to resolve rule matches and initiate motor plans." },
    { q: "Why do incorrect choices carry time penalties?", a: "Penalties prevent users from guessing randomly, enforcing rule accuracy over simple motor speed." },
    { q: "Can I play the decision speed test on mobile?", a: "Yes, the test is responsive and supports swipe gestures, though keyboard shortcuts on desktop provide the fastest input speeds." }
  ],
  "planning": [
    { q: "What is the Tower of London planning test?", a: "The planning test (adapted from the Tower of London task) measures visual planning, forward thinking, and executive problem-solving." },
    { q: "What does this test measure?", a: "It measures the capacity of your working memory to plan a sequence of moves in your head before executing them." },
    { q: "How is the planning score calculated?", a: "Scores are based on the number of moves taken to reach the target peg layout, compared to the minimum moves mathematically required." },
    { q: "Is the planning test diagnostic for executive dysfunction?", a: "Clinical versions are used to assess prefrontal cortex damage, but this online version is strictly for self-tracking and training." },
    { q: "How can I improve my planning scores?", a: "Avoid moving pegs immediately. Analyze the target layout, work backward from the goal, and plan the entire move sequence first." },
    { q: "What is the average moves ratio?", a: "Most users solve intermediate levels within 1 to 2 extra moves of the optimal path, while advanced users solve them optimally." },
    { q: "Does age affect planning capabilities?", a: "Executive planning capacities peak in early adulthood and decline slowly, but consistent mental puzzles help retain these skills." },
    { q: "Why is working memory important for planning?", a: "Your brain must hold temporary intermediate states of the pegs in your head, which relies on visual working memory space." }
  ],
  "prioritization": [
    { q: "What is the prioritization test?", a: "The prioritization test measures your ability to schedule tasks and react to urgency triggers under a dynamic cognitive load." },
    { q: "What does prioritization measure?", a: "It measures multitasking capability, working memory scheduling, and task prioritization under time pressure." },
    { q: "What is a task urgency mismatch?", a: "Mismatching occurs when a user focuses on low-priority items while high-urgency tasks expire, indicating poor attention gating." },
    { q: "Is this test diagnostic for executive ADHD symptoms?", a: "No. This test tracks executive pacing but is not a clinical diagnostic tool for attention-deficit disorders." },
    { q: "How can I train prioritization skills?", a: "Filter out low-urgency distractors, check task timers regularly, and focus your motor efforts on expiring tasks first." },
    { q: "What is the average prioritization accuracy?", a: "Healthy adults typically complete 80% to 90% of high-urgency tasks, with scores dropping under high task density." },
    { q: "How does stress affect task prioritization?", a: "Moderate stress can focus attention on urgent tasks, but extreme stress impairs task-switching, causing users to freeze." },
    { q: "Does input device speed affect prioritization scores?", a: "Yes, keyboard shortcuts or responsive touch sweeps make task selection faster, allowing more time for decisions." }
  ],
  "latency-optimizer": [
    { q: "What is response latency in displays?", a: "Response latency is the time delay between your physical click and the screen rendering the visual update, including input and frame lag." },
    { q: "What does the Latency Optimizer measure?", a: "It measures physical click reaction delay across different monitor refresh rates (60Hz vs 144Hz vs 240Hz+)." },
    { q: "How does 144Hz decrease reaction lag?", a: "A 144Hz display draws frames every 6.9ms compared to 16.7ms on a 60Hz display, reducing frame display lag by 9.8ms." },
    { q: "What causes input lag in web browsers?", a: "Input lag is caused by OS input queues, GPU compositing lag, display panel response times, and browser V-Sync rendering delay." },
    { q: "Is this test diagnostic for sensory latency?", a: "No, this is a hardware telemetry check and reflex optimization utility." },
    { q: "How to minimize browser display lag?", a: "Disable browser V-Sync, enable hardware acceleration, use wired inputs, and close background tabs." },
    { q: "Does operating system theme affect latency?", a: "Usually no, but compositor settings (like transparency effects in Windows or macOS) can add minor frame rendering delays." },
    { q: "What polling rate should I set for my mouse?", a: "Use 1000Hz or higher. A 1000Hz polling rate updates cursor position every 1ms, minimizing input queuing delay." }
  ],
  "ergonomic-architect": [
    { q: "What is desk ergonomics?", a: "Desk ergonomics is the science of designing the workspace to fit the user, optimizing posture to reduce muscle strain and fatigue." },
    { q: "How does screen height impact neck fatigue?", a: "The top of your monitor should be at or slightly below eye level. Looking down or up strain neck joints and causes fatigue." },
    { q: "What is the 90-90-90 rule in seating?", a: "Keep elbows, hips, and knees at a 90-degree angle, with feet flat on the floor to minimize strain." },
    { q: "How to configure desk height?", a: "Your desk height should allow your forearms to rest parallel to the desk surface with relaxed shoulders while typing." },
    { q: "Is this calculator a medical diagnostic?", a: "No. This tool provides posture advice based on standard ergonomics guidelines and is not a medical prescription." },
    { q: "Does posture affect cognitive test performance?", a: "Yes. Ergonomic posture reduces physical fatigue and discomfort, helping you maintain focus during cognitive tasks." },
    { q: "Why should I use a monitor arm?", a: "A monitor arm allows you to adjust height, tilt, and depth, adapting your display to your height and reducing neck strain." },
    { q: "What is the 20-20-20 rule for eye strain?", a: "Every 20 minutes, look at an object at least 20 feet away for 20 seconds to relax your eye focusing muscles." }
  ],
  "sleep-sanctuary": [
    { q: "What is a chronotype?", a: "A chronotype is your body's natural disposition to be awake or asleep at certain times, classified as Lion, Bear, Wolf, or Dolphin." },
    { q: "How does sleep debt affect cognitive scores?", a: "Accumulated sleep debt slows reaction time, degrades working memory capacity, and increases false alarm rates." },
    { q: "What is the circadian rhythm?", a: "The circadian rhythm is a natural, internal process that regulates the sleep-wake cycle, repeating roughly every 24 hours." },
    { q: "How can I improve sleep hygiene?", a: "Maintain a consistent sleep schedule, block blue light before bed, keep your room cool, and avoid caffeine in the afternoon." },
    { q: "Is this calculator a medical tool for insomnia?", a: "No. This is a self-tracking tool for chronotype scheduling and is not a clinical sleep therapy or diagnostic tool." },
    { q: "Why do I feel groggy after 8 hours of sleep?", a: "Waking up mid-cycle (during deep NREM sleep) causes sleep inertia. Syncing wake times with 90-minute sleep cycles reduces grogginess." },
    { q: "How does blue light affect melatonin?", a: "Blue light from screens suppresses melatonin secretion, shifting your circadian phase and delaying sleep onset." },
    { q: "What is the optimal bedroom temperature for sleep?", a: "Ergonomists recommend keeping the bedroom between 60°F and 67°F (15°C to 19°C) to support core body cooling." }
  ],
  "speed-arithmetic": [
    { q: "What is the Speed Arithmetic test?", a: "Speed Arithmetic is a timed visual calculation test measuring mental math speed and accuracy under time pressure." },
    { q: "How does mental math train the brain?", a: "It exercises working memory and attention gating by forcing the brain to store intermediate numbers while solving steps." },
    { q: "What is the average score on the 60-second math blitz?", a: "Most adults solve 15 to 25 equations correctly, while quants and math competitors score above 40." },
    { q: "Is speed math diagnostic for dyscalculia?", a: "No. This test is an educational self-tracking metric for cognitive speed, not a diagnostic tool for learning difficulties." },
    { q: "How can I calculate equations faster?", a: "Learn mental shortcuts, such as rounding numbers to the nearest ten, solving left-to-right, or chunking digits." },
    { q: "Why is accuracy important in speed math?", a: "Errors carry score penalties, ensuring users focus on calculation precision rather than simple speed-guessing." },
    { q: "Does fatigue impact mental math performance?", a: "Yes, mathematical retrieval is highly sensitive to mental fatigue, sleep debt, and stress." },
    { q: "Can children take this test?", a: "Yes. Basic arithmetic training early helps build confidence, speed, and mental agility." }
  ],
  "quant-dev-grid": [
    { q: "What is the Quant-Dev Agility Grid?", a: "The Quant-Dev Agility Grid is a cognitive benchmark testing bitwise shifts, hexadecimal algebra, and logic gate chains." },
    { q: "What does this test measure?", a: "It measures quantitative logic, system memory indexing, and rapid problem-solving for quants and developers." },
    { q: "What is a logic gate chain?", a: "It is a sequence of boolean operators (AND, OR, XOR) that must be evaluated in order to find the final true/false state." },
    { q: "How does hex algebra work?", a: "Hexadecimal algebra involves performing math in base-16 (0-9, A-F), requiring you to translate values mentally." },
    { q: "Is this test diagnostic for system logic skills?", a: "No, this is a professional cognitive benchmark and is not a formal diagnostic credential." },
    { q: "How can I improve my Quant-Dev score?", a: "Master binary bit shifts, memorize basic hex conversions, and practice gate evaluation shortcuts." },
    { q: "What is the average score on the Quant Grid?", a: "A score of 15 to 25 correct answers in 60 seconds is typical for developers, while quants score 35+." },
    { q: "Does keyboard input improve scores?", a: "Yes, using the physical number pad on a desktop keyboard is faster than clicking on the screen keypad." }
  ],
  "attention-test": [
    { q: "What does the Attention & Focus battery measure?", a: "The battery measures selective attention, impulse control, task-switching latency, and sustained focus." },
    { q: "Is this test diagnostic for ADHD?", a: "No. CogniArena's attention battery is a self-tracking tool. It cannot screen, treat, or diagnose clinical conditions like ADHD or ADD." },
    { q: "How long is the attention assessment?", a: "The complete screening battery takes 5-7 minutes, presenting four distinct tests of focus." },
    { q: "What is response inhibition?", a: "Response inhibition is the cognitive capacity to withhold automatic reactions to distractors, measured in Go/No-Go tasks." },
    { q: "Why are there different types of attention?", a: "The brain processes attention through separate neural networks: alert vigilance (alerting), target tracking (orienting), and rule control (executive)." },
    { q: "How can I train to improve my focus scores?", a: "Consistent attention-demanding drills, structured breaks, and healthy sleep help sustain focus levels." },
    { q: "Does screen glare affect focus scores?", a: "Yes, visual discomfort and glare increase processing time, reducing attention metrics." },
    { q: "What should I do if my scores are below average?", a: "If you have daily attention challenges, consult a licensed healthcare professional for a medical evaluation." }
  ]
};

// Write faqsData to src/data/faqs.ts
const codeContent = `// Centralized SEO FAQs Database
export interface FAQItem {
  q: string;
  a: string;
}

export const FAQS_DATABASE: Record<string, FAQItem[]> = ${JSON.stringify(faqsData, null, 2)};

export function getFaqsForSlug(slug: string): FAQItem[] {
  return FAQS_DATABASE[slug] || [];
}

export function hasFaqsForPath(slug: string): boolean {
  return !!FAQS_DATABASE[slug];
}

export function getFaqSchemaForSlug(slug: string): object {
  const faqs = getFaqsForSlug(slug);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };
}
`;

fs.writeFileSync(path.join(__dirname, '../brain/src/data/faqs.ts'), codeContent);
console.log('Centralized FAQs database written successfully!');
