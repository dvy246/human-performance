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
    'src/layouts/main.astro',
    'src/i18n/translations.ts',
    'src/data/faqs.ts',
    'src/pages/learn/brain-training/index.astro',
    'src/pages/index.astro',
    'src/pages/faq/index.astro',
    'src/pages/tests/spatial-orientation/index.astro',
    'src/pages/tests/index.astro',
    'src/pages/tests/decision-speed/index.astro',
    'src/pages/tests/reaction-time/index.astro',
    'src/pages/tests/quant-dev-grid/index.astro',
    'src/pages/tests/latency-optimizer/index.astro',
    'src/pages/tests/object-tracking/index.astro',
    'src/pages/tests/choice-reaction/index.astro',
    'src/pages/tests/go-no-go/index.astro',
    'src/pages/brain-games/index.astro',
    'src/pages/quiz/index.astro',
    'src/pages/quiz/iq-test/index.astro',
    'src/pages/about/index.astro',
    'src/pages/compare/human-benchmark-alternative/index.astro',
    'src/pages/gauntlet/index.astro',
    'src/pages/[lang]/index.astro',
    'src/pages/[lang]/faq/index.astro',
    'src/pages/[lang]/tests/index.astro',
    'src/pages/[lang]/quiz/index.astro',
    'src/pages/[lang]/quiz/iq-test/index.astro',
    'src/pages/[lang]/about/index.astro',
    'src/pages/[lang]/compare/human-benchmark-alternative/index.astro',
    'src/pages/[lang]/gauntlet/index.astro'
];

files.forEach(f => {
    replaceInFile(f, c => {
        c = c.replace(/cognitive assessments/gi, 'esports benchmarks');
        c = c.replace(/cognitive assessment/gi, 'esports benchmark');
        c = c.replace(/cognitive ability/gi, 'problem-solving skill');
        c = c.replace(/brain tests/gi, 'reflex tests');
        c = c.replace(/brain test/gi, 'reflex test');
        return c;
    });
});
