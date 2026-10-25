const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'src/pages/tests');
const dirs = fs.readdirSync(testsDir);
const files = dirs.map(d => path.join(testsDir, d, 'index.astro')).filter(f => fs.existsSync(f));

const replacement = `<!-- Gamer Benchmark Notice -->
    <div
      class="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm"
    >
      <strong class="font-semibold text-foreground">Gamer Benchmark Notice:</strong> This test is designed for reaction timing, mouse precision, and reflex tracking. Built for entertainment and competitive drills.
    </div>`;

let totalReplaced = 0;

for (const file of files) {
    if (file.includes('tests/results')) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // Replace if it has the comment
    newContent = newContent.replace(/<!--\s*Medical\/Scientific Disclaimer Notice\s*-->\s*<div[^>]*>[\s\S]*?Self-Tracking Notice:[\s\S]*?<\/div>/gi, replacement);
    
    // Replace if it only has the div
    if (newContent === content) {
        newContent = newContent.replace(/<div[^>]*>[\s\S]*?Self-Tracking Notice:[\s\S]*?<\/div>/gi, replacement);
    }
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
        totalReplaced++;
    } else {
        console.log(`No match found in ${file}`);
    }
}

console.log(`Total replaced: ${totalReplaced}`);
