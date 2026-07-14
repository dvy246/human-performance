interface Props {
  data: { group: string; value: number; unit: string }[]
  metric: string
  lowerIsBetter: boolean
}

export default function AgeBenchmarks({ data, lowerIsBetter }: Props) {
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
        Age Group Benchmarks
      </h3>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => {
          const pct = ((d.value - best) / range) * 100
          const barPct = lowerIsBetter ? 100 - pct : pct
          return (
            <div key={d.group} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-mono text-xs text-secondary">
                {d.group}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(2, barPct)}%`,
                    background:
                      "linear-gradient(90deg, rgba(245,158,11,0.3), rgba(245,158,11,0.8))",
                  }}
                />
              </div>
              <span className="w-16 text-right font-mono text-xs font-bold text-foreground tabular-nums">
                {d.value}
                {d.unit}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Data source: Der & Deary (2006), "Age and sex differences in reaction
        time in adulthood: Results from the UK Health and Lifestyle Survey."
      </p>
    </div>
  )
}
