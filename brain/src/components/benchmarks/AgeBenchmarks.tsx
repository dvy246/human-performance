import { useI18n } from "@/runtime/useI18n"

interface Props {
  data: { group: string; value: number; unit: string }[]
  metric: string
  lowerIsBetter: boolean
}

export default function AgeBenchmarks({ data, lowerIsBetter }: Props) {
  const { t } = useI18n()
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
        {t("bench.age_group_title", "Age Group Benchmarks")}
      </h3>
      <table className="w-full border-collapse" aria-label="Age Group Benchmarks">
        <thead className="sr-only">
          <tr>
            <th scope="col">Age Group</th>
            <th scope="col">Visual Relative Performance</th>
            <th scope="col">Benchmark Score</th>
          </tr>
        </thead>
        <tbody className="flex flex-col gap-2.5">
          {data.map((d) => {
            const pct = ((d.value - best) / range) * 100
            const barPct = lowerIsBetter ? 100 - pct : pct
            return (
              <tr key={d.group} className="flex items-center gap-3">
                <th scope="row" className="w-24 shrink-0 font-mono text-xs font-normal text-left text-secondary">
                  {d.group}
                </th>
                <td className="h-5 flex-1 overflow-hidden rounded-full bg-subtle p-0">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(2, barPct)}%`,
                      background:
                        "linear-gradient(90deg, rgba(245,158,11,0.3), rgba(245,158,11,0.8))",
                    }}
                  />
                </td>
                <td className="w-16 text-right font-mono text-xs font-bold text-foreground tabular-nums p-0">
                  {d.value}
                  {d.unit}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        {t(
          "bench.source_der_deary",
          'Data source: Der & Deary (2006), "Age and sex differences in reaction time in adulthood: Results from the UK Health and Lifestyle Survey."'
        )}
      </p>
    </div>
  )
}
