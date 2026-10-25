const fs = require('fs');
const path = require('path');

const learnDir = path.join(__dirname, 'src/pages/learn');
const dirs = fs.readdirSync(learnDir);
const files = dirs.map(d => path.join(learnDir, d, 'index.astro')).filter(f => fs.existsSync(f));

for (const f of files) {
    let lines = fs.readFileSync(f, 'utf8').split('\n');
    let imageCount = 0;
    
    // We only want to keep the FIRST occurrence of image: "https://cogniarena.com/og-image.png" inside the schemaJson array
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('image: "https://cogniarena.com/og-image.png"')) {
            imageCount++;
            if (imageCount > 1) {
                // Delete this line
                lines.splice(i, 1);
                i--; // Adjust index
            }
        }
    }
    
    fs.writeFileSync(f, lines.join('\n'), 'utf8');
    console.log(`Fixed duplicate image in ${f}`);
}
