export interface ChallengePayload {
  testId: string;
  score: number;
}

// URL-safe Base64 encoding
export function encodeChallenge(payload: ChallengePayload): string {
  try {
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch (e) {
    console.error('Error encoding challenge:', e);
    return '';
  }
}

// URL-safe Base64 decoding
export function decodeChallenge(hash: string): ChallengePayload | null {
  try {
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch (e) {
    console.error('Error decoding challenge:', e);
    return null;
  }
}

// Canvas-based Share Card Generator (Linear-inspired visual design, 1200x630 resolution)
export function generateShareCard(
  testName: string,
  scoreLabel: string,
  percentile: number
): Promise<string> {
  return new Promise((resolve) => {
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Draw Background (Deep OLED Black #030303)
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, 1200, 630);

    // 2. Draw Ambient Glow (Subtle gold/amber radial glow from center)
    const gradient = ctx.createRadialGradient(600, 315, 50, 600, 315, 600);
    gradient.addColorStop(0, 'rgba(217, 119, 6, 0.12)'); // Amber-600 low opacity
    gradient.addColorStop(1, 'rgba(3, 3, 3, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // 3. Draw Tech Grid lines (subtle UI background vibe)
    ctx.strokeStyle = 'rgba(28, 28, 31, 0.4)';
    ctx.lineWidth = 1;
    // Horizontal lines
    for (let y = 0; y < 630; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }
    // Vertical lines
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }

    // 4. Draw Outer Border Glow Accent
    ctx.strokeStyle = '#1c1c1f';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 1200, 630);

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)'; // Amber accent border highlight
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 1180, 610);

    // Wait for fonts to load or fallback gracefully
    ctx.textBaseline = 'middle';

    // 5. Draw Header Logo Block (BrainBenchmarks)
    ctx.fillStyle = '#d97706'; // Accent color
    ctx.fillRect(100, 95, 36, 36);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('B', 118, 113);

    ctx.fillStyle = '#fafafa';
    ctx.font = 'semibold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BrainBenchmarks', 152, 113);

    ctx.fillStyle = 'rgba(250, 250, 250, 0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('MEASURE. UNDERSTAND. IMPROVE.', 360, 113);

    // 6. Draw Category/Test Subtitle
    ctx.fillStyle = 'rgba(250, 250, 250, 0.5)';
    ctx.font = '20px monospace';
    ctx.fillText(testName.toUpperCase(), 100, 230);

    // 7. Draw The Score (Bold numerical statement)
    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText(scoreLabel, 100, 310);

    // 8. Draw Percentile Statement
    ctx.fillStyle = '#d97706'; // Gold Accent
    ctx.font = 'medium 28px sans-serif';
    ctx.fillText(`Top ${percentile}% of the global population`, 100, 390);

    // 9. Draw CTA / Challenge invitation
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px sans-serif';
    ctx.fillText('Can you beat my score?', 100, 480);

    // 10. Draw Footer Watermark URL
    ctx.fillStyle = 'rgba(250, 250, 250, 0.3)';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Scan to challenge or visit: brainbenchmarks.com', 1100, 520);

    // Resolve as dataURL image
    resolve(canvas.toDataURL('image/png'));
  });
}
