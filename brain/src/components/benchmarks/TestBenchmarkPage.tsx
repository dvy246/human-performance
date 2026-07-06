import { useEffect, useState } from 'react';
import { getBenchmarkConfig, type CategoryBenchmarkConfig } from '@/data/benchmarks';
import DistributionCurve from './DistributionCurve';
import AgeBenchmarks from './AgeBenchmarks';
import ProfessionalBenchmarks from './ProfessionalBenchmarks';
import PerformanceFactors from './PerformanceFactors';

interface Props {
  slug: string;
}

export default function TestBenchmarkPage({ slug }: Props) {
  const [config, setConfig] = useState<CategoryBenchmarkConfig | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cfg = getBenchmarkConfig(slug);
    setConfig(cfg || null);

    if (cfg && typeof window !== 'undefined') {
      const crit = cfg.lowerIsBetter ? 'lower' : 'higher';
      import('@/runtime/dataLayer').then(({ dataLayer }) => {
        dataLayer.getPersonalBest(cfg.primaryTestId, crit as 'lower' | 'higher').then(score => {
          setUserScore(score);
          setLoading(false);
        }).catch(() => setLoading(false));
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
        <div className="text-4xl">🔍</div>
        <h2 className="text-lg font-semibold text-foreground">Benchmark Data Not Found</h2>
        <p className="text-sm text-zinc-500">No benchmark data available for this category.</p>
      </div>
    );
  }

  const { title, description, icon, metric, unit, lowerIsBetter, color, distribution, ageData, professionData, factors, testIds } = config;

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent">
          <span>{icon}</span>
          <span>Benchmarks</span>
          <span>&middot;</span>
          <span>{title}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{title} — Population Benchmarks</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {testIds.map(id => (
            <a
              key={id}
              href={`/tests/${id}`}
              className="text-[10px] font-mono bg-subtle text-zinc-500 px-2 py-0.5 rounded-full hover:text-accent hover:bg-accent/10 transition-colors"
            >
              {id.replace(/-/g, ' ')}
            </a>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">Your Personal Best</h2>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-zinc-600 border-t-accent animate-spin" />
              <span className="text-xs text-zinc-500 font-mono">Loading from local storage...</span>
            </div>
          ) : userScore != null ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono text-accent">{userScore}{unit}</span>
              <span className="text-[10px] text-zinc-500 bg-subtle px-2 py-0.5 rounded-full font-mono">{metric}</span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 font-mono italic">No recorded results yet — take a test first!</span>
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
          <AgeBenchmarks data={ageData} metric={metric} lowerIsBetter={lowerIsBetter} />
        </section>
      )}

      {professionData && professionData.length > 0 && (
        <section>
          <ProfessionalBenchmarks data={professionData} lowerIsBetter={lowerIsBetter} />
        </section>
      )}

      <section>
        <PerformanceFactors factors={factors} />
      </section>

      <section className="flex flex-col gap-3 border-t border-card-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">About These Benchmarks</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Population distribution data is derived from CogniArena's aggregated user results for the primary test in this category.
          Age and professional benchmarks are sourced from published peer-reviewed research. Your percentile ranking shows how your
          score compares to all CogniArena users — a higher percentile means you outperformed more people.
          Benchmarks are updated regularly as new data is collected.
        </p>
      </section>
    </div>
  );
}
