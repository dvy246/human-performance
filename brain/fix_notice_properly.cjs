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
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Specifically target the exact div structure
    const oldRegex1 = /<div[^>]*class="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm"[^>]*>[\s\S]*?<strong[^>]*>\s*Self-Tracking Notice:\s*<\/strong>[\s\S]*?<\/div>/gi;
    const oldRegex2 = /<!--\s*Medical\/Scientific Disclaimer Notice\s*-->\s*<div[^>]*class="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm"[^>]*>[\s\S]*?<strong[^>]*>[\s\S]*?Self-Tracking Notice:[\s\S]*?<\/strong>[\s\S]*?<\/div>/gi;
    const oldRegex3 = /<div[^>]*class="rounded-xl border border-card-border bg-subtle p-4 text-xs leading-relaxed text-muted shadow-sm"[^>]*>[\s\S]*?<strong[^>]*>[\s\S]*?Self-Tracking Notice:[\s\S]*?<\/strong>[\s\S]*?<\/div>/gi;
    
    let newContent = content.replace(oldRegex2, replacement);
    if (newContent === content) {
        newContent = content.replace(oldRegex1, replacement);
    }
    if (newContent === content) {
        newContent = content.replace(oldRegex3, replacement);
    }
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed notice in ${t}`);
}
