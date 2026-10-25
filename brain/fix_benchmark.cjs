const fs = require('fs');

let content = fs.readFileSync('src/pages/benchmarks/[slug].astro', 'utf8');

content = content.replace(/\s*\[metricDirection\]: true,/g, '');
content = content.replace(/name: "CogniArena Research Team"/g, 'name: "CogniArena Benchmark Labs"');

// Fix DataDownload: we don't really have a JSON download for each, but we can just use the page URL
// Actually, it's safer to remove the distribution array if there is no actual data download.
// Wait, the plan says "fix DataDownload". Maybe changing encodingFormat to "text/html"?
content = content.replace(/encodingFormat: "application\/json"/g, 'encodingFormat: "text/html"');

fs.writeFileSync('src/pages/benchmarks/[slug].astro', content);
