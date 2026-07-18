const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../src/pages/tests'),
  path.join(__dirname, '../src/pages') // for gauntlet/index.astro and attention-test/index.astro
];

function removeFaqSchema(content) {
  const index = content.indexOf('"@type": "FAQPage"') !== -1 
    ? content.indexOf('"@type": "FAQPage"') 
    : content.indexOf("'@type': 'FAQPage'");
  if (index === -1) return content;

  // Find the opening brace of this object going backward
  let openBraceIndex = -1;
  let braceCount = 0;
  for (let i = index; i >= 0; i--) {
    if (content[i] === '}') braceCount++;
    if (content[i] === '{') {
      if (braceCount === 0) {
        openBraceIndex = i;
        break;
      }
      braceCount--;
    }
  }

  if (openBraceIndex === -1) return content;

  // Find the matching closing brace going forward
  let closeBraceIndex = -1;
  braceCount = 1;
  for (let i = openBraceIndex + 1; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        closeBraceIndex = i;
        break;
      }
    }
  }

  if (closeBraceIndex === -1) return content;

  // Remove the block from openBraceIndex to closeBraceIndex
  let start = openBraceIndex;
  let end = closeBraceIndex + 1;

  // Check if there is a trailing comma or preceding comma to avoid syntax errors
  let tempEnd = end;
  while (tempEnd < content.length && (content[tempEnd] === ',' || content[tempEnd] === ' ' || content[tempEnd] === '\n' || content[tempEnd] === '\r')) {
    tempEnd++;
  }
  
  // If there is no trailing comma, check if we should strip a preceding comma instead
  if (tempEnd === end) {
    let tempStart = start - 1;
    while (tempStart >= 0 && (content[tempStart] === ' ' || content[tempStart] === '\n' || content[tempStart] === '\r')) {
      tempStart--;
    }
    if (tempStart >= 0 && content[tempStart] === ',') {
      start = tempStart;
    }
  } else {
    end = tempEnd;
  }

  const before = content.slice(0, start);
  const after = content.slice(end);
  
  return removeFaqSchema(before + after);
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLen = content.length;

  // 1. Remove the JSON-LD FAQPage schema block in frontmatter safely via brace balancing
  content = removeFaqSchema(content);

  // 2. Remove the visual HTML FAQ section
  // Matches: <article ...> ... Frequently Asked Questions ... </article>
  // Uses a negative lookahead to ensure we match the leaf-level article container
  const articleRegex = /<article(?:(?!<article)[\s\S])*?Frequently Asked Questions[\s\S]*?<\/article>/g;
  content = content.replace(articleRegex, '');

  // Matches comment-based blocks if any leftovers: <!-- FAQ Section -->
  const commentRegex = /<!-- FAQ Section -->\s*/g;
  content = content.replace(commentRegex, '');

  if (content.length !== originalLen) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned static FAQs from: ${path.basename(filePath)}`);
  }
}

// Traverse tests directory
const testsDir = targetDirs[0];
if (fs.existsSync(testsDir)) {
  fs.readdirSync(testsDir).forEach(sub => {
    const fullSub = path.join(testsDir, sub);
    if (fs.statSync(fullSub).isDirectory()) {
      const indexAstro = path.join(fullSub, 'index.astro');
      if (fs.existsSync(indexAstro)) {
        processFile(indexAstro);
      }
    }
  });
}

// Process gauntlet and attention-test
processFile(path.join(targetDirs[1], 'gauntlet/index.astro'));
processFile(path.join(targetDirs[1], 'attention-test/index.astro'));

console.log('Static FAQ cleanup completed!');
