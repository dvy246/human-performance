const fs = require('fs');

const filesToFix = [
  'decision-speed',
  'flick-trainer',
  'focus-challenge',
  'mouse-accuracy',
  'object-tracking',
  'planning',
  'prioritization',
  'reaction-time',
  'spatial-orientation',
  'typing-speed',
  'verbal-memory'
];

const replacement = `<!-- Gamer Benchmark Notice -->
    <div
      class="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm"
    >
      <strong class="font-semibold text-foreground">Gamer Benchmark Notice:</strong> This test is designed for reaction timing, mouse precision, and reflex tracking. Built for entertainment and competitive drills.
    </div>`;

for (const t of filesToFix) {
    const file = `src/pages/tests/${t}/index.astro`;
    if (!fs.existsSync(file)) continue;
    
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    let startIdx = -1;
    let endIdx = -1;
    
    // Find the notice block
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Self-Tracking Notice:') || lines[i].includes('Medical/Scientific Disclaimer Notice')) {
            // Found the notice, let's trace back to the <div or <!--
            let j = i;
            while (j >= 0 && !lines[j].includes('<div') && !lines[j].includes('<!--')) {
                j--;
            }
            if (lines[j].includes('<!--')) {
                startIdx = j;
            } else if (lines[j-1] && lines[j-1].includes('<!--')) {
                startIdx = j-1;
            } else {
                startIdx = j;
            }
            
            // Trace forward to the closing </div>
            let k = i;
            while (k < lines.length && !lines[k].includes('</div>')) {
                k++;
            }
            endIdx = k;
            break;
        }
    }
    
    if (startIdx !== -1 && endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 1, replacement);
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        console.log(`Fixed notice in ${t}`);
    } else {
        console.log(`Could not find notice in ${t}`);
    }
}
