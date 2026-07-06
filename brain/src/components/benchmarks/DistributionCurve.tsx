import { computeFittedDistribution, type DistributionPoint } from '@/data/benchmarks';
import { useEffect, useRef, useState } from 'react';

interface Props {
  distribution?: DistributionPoint[];
  userScore?: number | null;
  lowerIsBetter: boolean;
  metric: string;
  unit: string;
  color?: string;
}

export default function DistributionCurve({ distribution = [], userScore, lowerIsBetter, metric, unit, color = '#f59e0b' }: Props) {
  const { mean, std, pdfPoints } = computeFittedDistribution(distribution);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 600, h: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      if (width > 0) setDim({ w: Math.max(300, width), h: Math.max(200, width * 0.45) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const padding = { top: 24, right: 24, bottom: 56, left: 56 };
  const plotW = dim.w - padding.left - padding.right;
  const plotH = dim.h - padding.top - padding.bottom;

  const scores = pdfPoints.map(p => p.x);
  const minX = Math.min(...scores);
  const maxX = Math.max(...scores);
  const rangeX = maxX - minX || 1;

  const pdfValues = pdfPoints.map(p => p.y);
  const maxY = Math.max(...pdfValues) * 1.12;

  const toX = (v: number) => padding.left + ((v - minX) / rangeX) * plotW;
  const toY = (v: number) => padding.top + plotH - (v / maxY) * plotH;

  const pathD = pdfPoints.map((p, i) => {
    const x = toX(p.x);
    const y = toY(p.y);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join('') + `L${toX(pdfPoints[pdfPoints.length - 1].x)},${toY(0)}L${toX(pdfPoints[0].x)},${toY(0)}Z`;

  let userPercentile: number | null = null;
  let userX: number | null = null;
  if (userScore != null && distribution.length >= 2) {
    const sorted = [...distribution].sort((a, b) => a.score - b.score);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (userScore >= sorted[i].score && userScore <= sorted[i + 1].score) {
        const t = (userScore - sorted[i].score) / (sorted[i + 1].score - sorted[i].score);
        userPercentile = sorted[i].percentile + t * (sorted[i + 1].percentile - sorted[i].percentile);
        break;
      }
    }
    if (userPercentile == null) {
      if (userScore <= sorted[0].score) userPercentile = sorted[0].percentile;
      else userPercentile = sorted[sorted.length - 1].percentile;
    }
    userX = toX(Math.max(minX, Math.min(maxX, userScore)));
  }

  const userY = userX != null ? toY(normalPDFAt(userScore!, mean, std)) : 0;

  const medianX = toX(mean);

  const tickSteps = 5;
  const ticks: { v: number; label: string }[] = [];
  for (let i = 0; i <= tickSteps; i++) {
    const v = minX + (rangeX / tickSteps) * i;
    const label = rangeX > 100 ? Math.round(v).toString() : v.toFixed(1);
    ticks.push({ v, label });
  }

  const pctLabels = [25, 50, 75, 90];
  const percentilesWithError = distribution.length >= 2
    ? pctLabels.map(p => {
        for (let i = 0; i < distribution.length - 1; i++) {
          if (p >= distribution[i].percentile && p <= distribution[i + 1].percentile) {
            const t = (p - distribution[i].percentile) / (distribution[i + 1].percentile - distribution[i].percentile);
            return { pct: p, score: distribution[i].score + t * (distribution[i + 1].score - distribution[i].score) };
          }
        }
        return null;
      }).filter(Boolean) as { pct: number; score: number }[]
    : [];

  return (
    <div ref={containerRef} className="w-full bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Population Distribution</h3>
        {userPercentile != null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Your percentile:</span>
            <span className="font-bold font-mono text-accent">{userPercentile.toFixed(1)}th</span>
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${dim.w} ${dim.h}`} className="w-full h-auto" style={{ maxHeight: dim.h }}>
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path d={pathD} fill="url(#curveFill)" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {percentilesWithError.map(p => {
          const x = toX(Math.max(minX, Math.min(maxX, p.score)));
          return (
            <g key={p.pct}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotH} stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" className="text-zinc-600" />
              <text x={x} y={padding.top - 6} textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">{p.pct}%</text>
            </g>
          );
        })}

        {medianX && (
          <line x1={medianX} y1={padding.top} x2={medianX} y2={padding.top + plotH + 8} stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,3" className="text-zinc-400" />
        )}

        {userX != null && (
          <g>
            <line x1={userX} y1={padding.top} x2={userX} y2={padding.top + plotH} stroke={color} strokeWidth="2.5" />
            <circle cx={userX} cy={userY} r="5" fill={color} stroke="var(--color-card)" strokeWidth="2" />
            <text x={userX} y={userY - 12} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" fontFamily="system-ui">
              You
            </text>
          </g>
        )}

        {ticks.map(t => {
          const x = toX(t.v);
          return (
            <g key={t.v}>
              <line x1={x} y1={padding.top + plotH} x2={x} y2={padding.top + plotH + 6} stroke="currentColor" strokeWidth="1" className="text-zinc-600" />
              <text x={x} y={padding.top + plotH + 18} textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">{t.label}</text>
            </g>
          );
        })}

        {userPercentile != null && userX != null && (
          <g>
            <rect x={Math.min(userX + 10, dim.w - 160)} y={padding.top + plotH - 48} width="150" height="38" rx="6" fill="var(--color-card)" stroke={color} strokeWidth="1" opacity="0.95" />
            <text x={Math.min(userX + 20, dim.w - 150)} y={padding.top + plotH - 32} fill={color} fontSize="11" fontWeight="bold" fontFamily="system-ui">
              {metric}: {userScore}{unit}
            </text>
            <text x={Math.min(userX + 20, dim.w - 150)} y={padding.top + plotH - 20} className="fill-zinc-400" fontSize="10" fontFamily="monospace">
              {lowerIsBetter ? 'Faster than' : 'Better than'} {(100 - userPercentile!).toFixed(1)}% of users
            </text>
          </g>
        )}

        <text x={padding.left + plotW / 2} y={dim.h - 4} textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="system-ui">
          {metric}{unit ? ` (${unit})` : ''}
        </text>
        <text x={10} y={padding.top + plotH / 2} textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="system-ui" transform={`rotate(-90, 10, ${padding.top + plotH / 2})`}>
          Frequency
        </text>
      </svg>
    </div>
  );
}

function normalPDFAt(x: number, mean: number, std: number): number {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
}
