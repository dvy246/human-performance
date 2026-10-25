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

const files = [
    'src/components/ui/GameSearch.tsx',
    'src/i18n/translations.ts',
    'src/data/faqs.ts',
    'src/pages/learn/brain-training/index.astro',
    'src/pages/index.astro',
    'src/pages/tests/sleep-sanctuary/index.astro',
    'src/pages/tests/ergonomic-architect/index.astro',
    'src/pages/tests/index.astro',
    'src/pages/tests/results/index.astro',
    'src/pages/tests/quant-dev-grid/index.astro',
    'src/pages/tests/speed-arithmetic/index.astro',
    'src/pages/tests/latency-optimizer/index.astro',
    'src/pages/quiz/iq-test/index.astro',
    'src/pages/compare/human-benchmark-alternative/index.astro',
    'src/pages/compare/index.astro',
    'src/pages/[lang]/index.astro',
    'src/pages/[lang]/tests/results/index.astro',
    'src/pages/[lang]/compare/human-benchmark-alternative/index.astro',
    'src/pages/color-game/index.astro',
    'src/pages/quiz/index.astro',
    'src/pages/[lang]/learn/index.astro',
    'src/pages/[lang]/learn/[slug]/index.astro',
    'src/pages/[lang]/tests/[slug]/index.astro',
    'src/pages/[lang]/brain-games/index.astro',
    'src/pages/[lang]/quiz/index.astro',
    'src/pages/[lang]/quiz/iq-test/index.astro',
    'src/pages/[lang]/gauntlet/index.astro'
];

files.forEach(f => {
    replaceInFile(f, c => {
        // Cognitive tests
        c = c.replace(/cognitive tests/gi, 'esports benchmarks');
        c = c.replace(/cognitive test/gi, 'esports benchmark');
        c = c.replace(/Cognitive Tests/g, 'Esports Benchmarks');
        c = c.replace(/Cognitive Test/g, 'Esports Benchmark');
        c = c.replace(/cognitive testing/gi, 'esports benchmarking');
        
        // IQ Test
        c = c.replace(/IQ Test/g, 'Logic Benchmark');
        c = c.replace(/IQ test/gi, 'logic benchmark');
        c = c.replace(/IQ Score/g, 'Logic Score');
        c = c.replace(/IQ score/gi, 'logic score');
        c = c.replace(/an IQ /gi, 'a logic ');
        c = c.replace(/IQ and Cognitive Ability/g, 'Logic and Puzzle Solving');
        c = c.replace(/IQ Quiz/gi, 'Logic Quiz');
        c = c.replace(/IQ/g, 'Logic');
        
        // Intelligence
        c = c.replace(/intelligence/gi, 'problem-solving ability');
        c = c.replace(/Intelligence/g, 'Problem-Solving');
        
        return c;
    });
});
