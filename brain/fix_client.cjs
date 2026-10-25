const fs = require('fs');
const path = require('path');

const testNames = [
  'typing-speed',
  'pattern-reasoning',
  'quant-dev-grid',
  'speed-arithmetic',
  'latency-optimizer',
  'ergonomic-architect',
  'trail-making',
  'stroop',
  'dual-n-back',
  'sleep-sanctuary',
  'visual-pattern',
  'number-memory'
];

for (const t of testNames) {
    const file = `src/pages/tests/${t}/index.astro`;
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace client:load with client:visible
    content = content.replace(/client:load/g, 'client:visible');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated client:load to client:visible in ${t}`);
}
