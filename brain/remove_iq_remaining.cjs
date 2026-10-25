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

replaceInFile('src/layouts/main.astro', c => {
    c = c.replace(/29\+ cognitive assessments including IQ test, typing test, memory games/gi, '29+ esports benchmarks including logic benchmark, typing test, and memory games');
    c = c.replace(/IQ Test/g, 'Logic Benchmark');
    return c;
});

replaceInFile('src/pages/learn/iq-test/index.astro', c => {
    c = c.replace(/IQ Test/gi, 'Logic Benchmark');
    c = c.replace(/IQ test/gi, 'logic benchmark');
    c = c.replace(/IQ tests/gi, 'logic benchmarks');
    return c;
});

replaceInFile('src/pages/brain-games/index.astro', c => {
    c = c.replace(/Free IQ Test/gi, 'Free Logic Benchmark');
    return c;
});

replaceInFile('src/pages/[lang]/learn/[slug]/index.astro', c => {
    c = c.replace(/IQ Test/gi, 'Logic Benchmark');
    return c;
});
