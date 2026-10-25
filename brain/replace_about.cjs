const fs = require('fs');

let content = fs.readFileSync('src/pages/about/index.astro', 'utf8');

content = content.replace(/CogniArena Scientific Review Board/g, "CogniArena Benchmark Labs");
content = content.replace(/5\. Scientific &amp; Editorial Board/g, "5. CogniArena Benchmark Labs");
content = content.replace(/Scientific and editorial board overseeing cognitive calibration formulas, assessment validation protocols, and educational research integrity\./g, "Engineering board overseeing hardware timing calibration, refresh rate synchronization, input polling optimization, and esports aim mechanics.");

content = content.replace(/Methodological Integrity &amp; Editorial Oversight/g, "Hardware Latency & Esports Aim Mechanics");

const oldText1 = `CogniArena's assessments, mathematical models, and educational
              guides are reviewed and maintained under strict methodological standards.
              We ensure our testing protocols adhere to published experimental psychology literature
              (including Hick's Law, Fitts's Law, Miller's 7&plusmn;2 chunking limits, and Corsi block-tapping standards).`;

const newText1 = `CogniArena's assessments, tracking models, and guides are developed under strict hardware calibration standards. We ensure our testing protocols optimize for maximum frame delivery and sub-millisecond input latency. Models adhere to esports mechanics standards (Fitts's Law for FPS mouse precision, minimal render queueing, and low-latency input pooling).`;

content = content.replace(oldText1, newText1);
content = content.replace(/2\. Scientific Methodological Rigor/g, "2. Hardware & Methodological Rigor");

fs.writeFileSync('src/pages/about/index.astro', content);
