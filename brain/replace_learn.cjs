const fs = require('fs');
const path = require('path');

// 1. Fix verbal-memory
let vmContent = fs.readFileSync('src/pages/learn/verbal-memory/index.astro', 'utf8');
const vmOld = `Verbal memory is highly sensitive to neurodegenerative
          conditions, particularly Alzheimer's disease, where early damage to
          the entorhinal cortex and hippocampus impairs the encoding of new
          verbal information while leaving older lexical knowledge intact.`;
const vmNew = `In gaming and esports, working memory chunking is vital for shot-calling, tracking enemy cooldowns, and memorizing complex strat-books or build orders.`;
vmContent = vmContent.replace(vmOld, vmNew);
fs.writeFileSync('src/pages/learn/verbal-memory/index.astro', vmContent);

// 2. Fix trail-making
let tmContent = fs.readFileSync('src/pages/learn/trail-making/index.astro', 'utf8');
const tmOld = `In clinical settings, the Trail Making Test is a
          primary diagnostic tool for assessing cognitive impairment, dementia,
          and fitness to drive, as it reflects the visual attention and mental
          flexibility needed to navigate complex environments.`;
const tmNew = `In tactical gaming, tracking multiple moving targets and rapidly switching focus between the minimap, ammo counts, and crosshair reflects the same visual attention and mental flexibility measured by this benchmark.`;
tmContent = tmContent.replace(tmOld, tmNew);
fs.writeFileSync('src/pages/learn/trail-making/index.astro', tmContent);

// 3. Update author across all 23 files
const learnDir = path.join(__dirname, 'src/pages/learn');
const dirs = fs.readdirSync(learnDir);
const files = dirs.map(d => path.join(learnDir, d, 'index.astro')).filter(f => fs.existsSync(f));

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/name: "Dr\. Alan Vanc"/g, 'name: "CogniArena Benchmark Labs"');
    content = content.replace(/url: "https:\/\/cogniarena\.com\/about\/"/g, 'url: "https://cogniarena.com/about/"');
    
    // Also, adding image to Article schema if missing (part of Phase 3)
    if (!content.includes('"image": "https://cogniarena.com/og-image.png"')) {
        content = content.replace(/("@type": "Article",)/, '$1\n      image: "https://cogniarena.com/og-image.png",');
    }
    
    fs.writeFileSync(f, content);
}
