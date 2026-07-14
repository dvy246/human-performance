interface Props {
  data: { profession: string; value: number; label: string }[]
  lowerIsBetter: boolean
}

export default function ProfessionalBenchmarks({ data, lowerIsBetter }: Props) {
  if (!data || data.length === 0) return null
  const best = lowerIsBetter
    ? Math.min(...data.map((d) => d.value))
    : Math.max(...data.map((d) => d.value))
  const worst = lowerIsBetter
    ? Math.max(...data.map((d) => d.value))
    : Math.min(...data.map((d) => d.value))
  const range = worst - best || 1

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Professional Benchmarks
      </h3>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => {
          const pct = ((d.value - best) / range) * 100
          const barPct = lowerIsBetter ? 100 - pct : pct
          return (
            <div key={d.profession} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-secondary">
                {d.profession}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(2, barPct)}%`,
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(59,130,246,0.8))",
                  }}
                />
              </div>
              <span className="w-20 text-right font-mono text-xs font-bold text-foreground tabular-nums">
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Benchmarks compiled from published research and population studies.
        Individual results vary.
      </p>
    </div>
  )
}
