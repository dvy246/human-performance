const fs = require('fs');
const path = require('path');

const learnDir = path.join(__dirname, 'src/pages/learn');
const dirs = fs.readdirSync(learnDir);
const files = dirs.map(d => path.join(learnDir, d, 'index.astro')).filter(f => fs.existsSync(f));

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/name: "CogniArena Scientific Review Board"/g, 'name: "CogniArena Benchmark Labs"');
    
    // Also, adding image to Article schema if missing (part of Phase 3)
    if (!content.includes('"image": "https://cogniarena.com/og-image.png"')) {
        content = content.replace(/("@type": "Article",)/, '$1\n      image: "https://cogniarena.com/og-image.png",');
    }
    
    fs.writeFileSync(f, content);
}
