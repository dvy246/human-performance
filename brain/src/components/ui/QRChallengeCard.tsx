import React, { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { encodeChallenge } from '../../runtime/share';
import { formatTopPercentile } from '../../runtime/percentileLookup';

const REACTION_TESTS = ['reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction', 'go-no-go', 'aim-coordination'];

function isLowerBetter(testId: string): boolean {
  return REACTION_TESTS.includes(testId);
}

const TEST_SLUGS: Record<string, string> = {
  'tmt-partA': 'trail-making',
  'tmt-partB': 'trail-making',
};

interface QRChallengeCardProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  score: number;
  scoreLabel: string;
  testName: string;
  percentile?: number;
}

export default function QRChallengeCard({ isOpen, onClose, testId, score, scoreLabel, testName, percentile }: QRChallengeCardProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [challengeUrl, setChallengeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    generateQR();
  }, [isOpen]);

  const generateQR = async () => {
    try {
      const token = encodeChallenge({ testId, score });
      const url = `${window.location.origin}/tests/${TEST_SLUGS[testId] || testId}?challenge=${token}`;
      setChallengeUrl(url);

      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 280;

      await QRCodeLib.toCanvas(canvas, url, {
        width: 280,
        margin: 2,
        color: { dark: '#ffffff', light: '#030303' },
      });

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/favicon-96x96.png';
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = reject;
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logoSize = 52;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.fillStyle = '#030303';
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
      }

      if (qrCanvasRef.current) {
        const dest = qrCanvasRef.current;
        dest.width = canvas.width;
        dest.height = canvas.height;
        const dCtx = dest.getContext('2d');
        dCtx?.drawImage(canvas, 0, 0);
      }
      setQrReady(true);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  };

  const handleDownload = () => {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 500;
    cardCanvas.height = 680;
    const ctx = cardCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, 500, 680);

    ctx.strokeStyle = '#1c1c1f';
    ctx.lineWidth = 16;
    ctx.strokeRect(0, 0, 500, 680);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, 484, 664);

    const gradient = ctx.createRadialGradient(250, 340, 20, 250, 340, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
    gradient.addColorStop(1, 'rgba(3, 3, 3, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 680);

    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(250, 250, 250, 0.5)';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(testName.toUpperCase(), 250, 68);

    ctx.fillStyle = '#fafafa';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(scoreLabel, 250, 120);

    if (percentile !== undefined) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = '500 18px sans-serif';
      ctx.fillText(`${formatTopPercentile(percentile, isLowerBetter(testId))} globally`, 250, 152);
    }

    if (qrCanvasRef.current) {
      ctx.drawImage(qrCanvasRef.current, 110, 195, 280, 280);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Scan to challenge me!', 250, 520);

    ctx.fillStyle = 'rgba(250, 250, 250, 0.3)';
    ctx.font = '13px monospace';
    ctx.fillText('cogniarena.com', 250, 555);

    const hexCenter = 40;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const x = hexCenter + 12 * Math.cos(angle);
      const y = 640 + 12 * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('CA', hexCenter, 643);

    const link = document.createElement('a');
    link.download = `cogniarena-${testId}-challenge.png`;
    link.href = cardCanvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#1c1c1f] p-6 max-w-sm w-full shadow-2xl"
        style={{ backgroundColor: '#030303' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[8px] font-bold text-accent font-mono">CA</div>
            <span className="text-[10px] font-mono text-muted uppercase">Challenge Card</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-subtle border border-card-border flex items-center justify-center text-muted hover:text-foreground text-xs cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-5">
          <span className="text-accent text-[10px] font-mono uppercase tracking-widest">{testName}</span>
          <h3 className="text-2xl font-bold text-white mt-1">{scoreLabel}</h3>
          {percentile !== undefined && (
            <p className="text-accent text-sm font-medium mt-0.5">
              {formatTopPercentile(percentile, isLowerBetter(testId))} globally
            </p>
          )}
        </div>

        <div className="flex justify-center mb-5">
          <canvas ref={qrCanvasRef} className="rounded-lg" style={{ width: 240, height: 240 }} />
        </div>

        <p className="text-white/60 text-sm text-center mb-5">Scan to challenge me!</p>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!qrReady}
            className="flex-1 h-11 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold text-xs font-mono uppercase transition-standard active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            Download Card
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 h-11 rounded-lg bg-subtle border border-card-border text-foreground hover:bg-panel font-semibold text-xs font-mono uppercase transition-standard active:scale-95 cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
