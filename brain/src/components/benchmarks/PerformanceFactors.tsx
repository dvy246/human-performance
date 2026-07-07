interface Props {
  factors: { icon: string; title: string; body: string }[];
}

export default function PerformanceFactors({ factors }: Props) {
  if (!factors || factors.length === 0) return null;
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Key Performance Factors</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {factors.map(f => (
          <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-subtle/50">
            <span className="text-base mt-0.5 shrink-0">{f.icon}</span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs font-semibold text-foreground">{f.title}</span>
              <span className="text-[11px] text-muted leading-relaxed">{f.body}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
