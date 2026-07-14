interface Props {
  factors: { icon: string; title: string; body: string }[]
}

export default function PerformanceFactors({ factors }: Props) {
  if (!factors || factors.length === 0) return null
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Key Performance Factors
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {factors.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 rounded-lg bg-subtle/50 p-3"
          >
            <span className="mt-0.5 shrink-0 text-base">{f.icon}</span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold text-foreground">
                {f.title}
              </span>
              <span className="text-[11px] leading-relaxed text-muted">
                {f.body}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
