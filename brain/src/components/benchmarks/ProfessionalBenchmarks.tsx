interface Props {
  data: { profession: string; value: number; label: string }[];
  lowerIsBetter: boolean;
}

export default function ProfessionalBenchmarks({ data, lowerIsBetter }: Props) {
  if (!data || data.length === 0) return null;
  const best = lowerIsBetter ? Math.min(...data.map(d => d.value)) : Math.max(...data.map(d => d.value));
  const worst = lowerIsBetter ? Math.max(...data.map(d => d.value)) : Math.min(...data.map(d => d.value));
  const range = worst - best || 1;

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Professional Benchmarks</h3>
      <div className="flex flex-col gap-2.5">
        {data.map(d => {
          const pct = ((d.value - best) / range) * 100;
          const barPct = lowerIsBetter ? 100 - pct : pct;
          return (
            <div key={d.profession} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-36 shrink-0">{d.profession}</span>
              <div className="flex-1 h-5 bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(2, barPct)}%`, background: 'linear-gradient(90deg, rgba(59,130,246,0.3), rgba(59,130,246,0.8))' }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-foreground w-20 text-right tabular-nums">{d.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed">
        Benchmarks compiled from published research and population studies. Individual results vary.
      </p>
    </div>
  );
}
