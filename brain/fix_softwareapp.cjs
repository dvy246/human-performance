const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'src/pages/tests');
const dirs = fs.readdirSync(testsDir);
const files = dirs.map(d => path.join(testsDir, d, 'index.astro')).filter(f => fs.existsSync(f));

for (const file of files) {
    if (file.includes('tests/results')) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Add operatingSystem and offers to SoftwareApplication
    if (content.includes('"@type": "SoftwareApplication"')) {
        if (!content.includes('operatingSystem: "Web Browser"')) {
            content = content.replace(/(applicationCategory:\s*"GameApplication",)/, '$1\n    operatingSystem: "Web Browser",\n    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },');
        }
    }
    
    // Fix trailing slashes in schemas
    content = content.replace(/(url:\s*"https:\/\/cogniarena\.com[^"]*[^\/])"/g, '$1/"');
    content = content.replace(/(item:\s*"https:\/\/cogniarena\.com[^"]*[^\/])"/g, '$1/"');
    // Ensure we don't accidentally double-slash
    content = content.replace(/\/\/"/g, '/"');
    
    fs.writeFileSync(file, content, 'utf8');
}
console.log('SoftwareApplication schemas and trailing slashes updated in test pages.');
