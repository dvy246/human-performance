const fs = require('fs');

function replaceInFile(path, replaceFn) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    let newContent = replaceFn(content);
    if (content !== newContent) {
        fs.writeFileSync(path, newContent, 'utf8');
        console.log(`Updated ${path}`);
    }
}

// 1. main.astro
replaceInFile('src/layouts/main.astro', c => 
    c.replace(/brain training platform/gi, 'esports benchmarking platform')
);

// 2. i18n
replaceInFile('src/i18n/translations.ts', c => 
    c.replace(/brain training/gi, 'reflex training')
);
replaceInFile('src/pages/[lang]/index.astro', c => 
    c.replace(/brain training/gi, 'reflex training')
);

// 3. index.astro (Homepage title)
replaceInFile('src/pages/index.astro', c => {
    c = c.replace(/Brain Training/g, 'Esports Benchmarks');
    c = c.replace(/brain training/g, 'reflex training');
    return c;
});

// 4. tests/index.astro
replaceInFile('src/pages/tests/index.astro', c => 
    c.replace(/Brain Training Hub/gi, 'Esports Benchmark Hub')
);

// 5. brain-games/index.astro
replaceInFile('src/pages/brain-games/index.astro', c => {
    c = c.replace(/brain training/gi, 'reflex training');
    c = c.replace(/Brain Training/gi, 'Reflex Training');
    return c;
});

// 6. learn index pages
replaceInFile('src/pages/[lang]/learn/index.astro', c => 
    c.replace(/brain training/gi, 'reflex training')
);
replaceInFile('src/pages/[lang]/learn/[slug]/index.astro', c => 
    c.replace(/brain training/gi, 'reflex training')
);

// 7. learn/brain-training/index.astro (The dedicated guide)
replaceInFile('src/pages/learn/brain-training/index.astro', c => {
    c = c.replace(/Brain Training & Mind Power Science Guide/gi, 'Reflex Training & Esports Mechanics Guide');
    c = c.replace(/brain training, mind power development/gi, 'reflex training, aiming development');
    c = c.replace(/cognitive brain training/gi, 'esports reflex training');
    c = c.replace(/brain training/gi, 'reflex training');
    c = c.replace(/Brain Training/gi, 'Reflex Training');
    return c;
});

