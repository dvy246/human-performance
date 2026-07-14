import { useEffect, useState } from "react"
import type { CategoryBenchmarkConfig } from "@/data/benchmarks"
import DistributionCurve from "./DistributionCurve"
import AgeBenchmarks from "./AgeBenchmarks"
import ProfessionalBenchmarks from "./ProfessionalBenchmarks"
import PerformanceFactors from "./PerformanceFactors"

interface Props {
  config: CategoryBenchmarkConfig
}

export default function TestBenchmarkPage({ config }: Props) {
  const [userScore, setUserScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const crit = config.lowerIsBetter ? "lower" : "higher"
      import("@/runtime/dataLayer")
        .then(({ dataLayer }) => {
          dataLayer
            .getPersonalBest(config.primaryTestId, crit as "lower" | "higher")
            .then((score) => {
              setUserScore(score)
              setLoading(false)
            })
            .catch(() => setLoading(false))
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [config])

  const {
    title,
    description,
    icon,
    metric,
    unit,
    lowerIsBetter,
    color,
    distribution,
    ageData,
    professionData,
    factors,
    testIds,
  } = config

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-accent uppercase">
          <span>{icon}</span>
          <span>Benchmarks</span>
          <span>&middot;</span>
          <span>{title}</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {title} — Population Benchmarks
        </h1>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {testIds.map((id) => (
            <a
              key={id}
              href={`/tests/${id}`}
              className="rounded-full bg-subtle px-2 py-0.5 font-mono text-[10px] text-muted transition-colors hover:bg-accent/10 hover:text-accent"
            >
              {id.replace(/-/g, " ")}
            </a>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Your Personal Best
          </h2>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-card-border border-t-accent" />
              <span className="font-mono text-xs text-muted">
                Loading from local storage...
              </span>
            </div>
          ) : userScore != null ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-accent">
                {userScore}
                {unit}
              </span>
              <span className="rounded-full bg-subtle px-2 py-0.5 font-mono text-[10px] text-muted">
                {metric}
              </span>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted italic">
              No recorded results yet — take a test first!
            </span>
          )}
        </div>

        <DistributionCurve
          distribution={distribution}
          userScore={userScore}
          lowerIsBetter={lowerIsBetter}
          metric={metric}
          unit={unit}
          color={color}
        />
      </section>

      {ageData && ageData.length > 0 && (
        <section>
          <AgeBenchmarks
            data={ageData}
            metric={metric}
            lowerIsBetter={lowerIsBetter}
          />
        </section>
      )}

      {professionData && professionData.length > 0 && (
        <section>
          <ProfessionalBenchmarks
            data={professionData}
            lowerIsBetter={lowerIsBetter}
          />
        </section>
      )}

      <section>
        <PerformanceFactors factors={factors} />
      </section>

      <section className="flex flex-col gap-3 border-t border-card-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">
          About These Benchmarks
        </h2>
        <p className="text-xs leading-relaxed text-muted">
          Population distribution data is derived from CogniArena's aggregated
          user results for the primary test in this category. Age and
          professional benchmarks are sourced from published peer-reviewed
          research. Your percentile ranking shows how your score compares to all
          CogniArena users — a higher percentile means you outperformed more
          people. Benchmarks are updated regularly as new data is collected.
        </p>
      </section>
    </div>
  )
}
