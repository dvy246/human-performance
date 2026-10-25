const fs = require('fs');

const testNames = [
  'spatial-orientation',
  'planning',
  'decision-speed',
  'mouse-accuracy',
  'prioritization',
  'dual-n-back',
  'flick-trainer',
  'visual-pattern'
];

for (const t of testNames) {
    const file = `src/pages/tests/${t}/index.astro`;
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix position 2
    content = content.replace(/position: 2,\s*name: "[^"]*",\s*item: "https:\/\/cogniarena\.com\/"/g, 'position: 2,\n        name: "Tests",\n        item: "https://cogniarena.com/tests/"');
    
    // Fix position 1 (trailing slash)
    content = content.replace(/name: "Home",\s*item: "https:\/\/cogniarena\.com"/g, 'name: "Home",\n        item: "https://cogniarena.com/"');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${t}`);
}
