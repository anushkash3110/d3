import { useEffect, useState } from "react";
import { BackButton } from "../BackButton";
import { Button } from "@/component/ui/button";
import { mirrorApi, type MirrorAnalysis } from "@/lib/api";

export const MirrorPage = () => {
  const [analysis, setAnalysis] = useState<MirrorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mirrorApi.getAnalysis();
      setAnalysis(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalysis();
  }, []);

  const refreshAnalysis = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await mirrorApi.refreshAnalysis();
      setAnalysis(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh analysis.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-4">
        <BackButton />
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Building your behavioral mirror...
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-4">
        <BackButton />
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
          {error || "No analysis available yet."}
        </div>
        <Button variant="soft" onClick={() => void loadAnalysis()}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Behavioral Mirror</h1>
          <p className="text-sm text-muted-foreground">A personalized psychological reflection from your last 30 days.</p>
        </div>
        <Button variant="trust" onClick={() => void refreshAnalysis()} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh analysis"}
        </Button>
      </header>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Core trigger</div>
        <div className="flex items-start gap-4">
          <div className="text-3xl">{analysis.coreTrigger.icon}</div>
          <div>
            <div className="text-sm text-muted-foreground">{analysis.coreTrigger.label}</div>
            <h2 className="font-display text-2xl leading-tight mb-2">{analysis.coreTrigger.headline}</h2>
            <p className="text-sm text-muted-foreground">{analysis.coreTrigger.body}</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {analysis.patterns.map((pattern, idx) => (
          <article key={`${pattern.title}-${idx}`} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg">{pattern.icon} {pattern.title}</div>
              <span className={`text-xs px-2 py-1 rounded-full ${pattern.type === "warning" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                {pattern.type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{pattern.body}</p>
            <div className="text-xl font-display">{pattern.stat}</div>
            <div className="text-xs text-muted-foreground">{pattern.statLabel}</div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-2xl mb-4">{analysis.prescription.headline}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {analysis.prescription.items.map((item, idx) => (
            <div key={`${item.text}-${idx}`} className="rounded-xl border border-border p-4 text-sm">
              <span className="mr-2">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {analysis.meta && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Avg daily minutes" value={String(analysis.meta.avgDailyMinutes)} />
          <Stat label="Goal met rate" value={`${analysis.meta.goalMetRate}%`} />
          <Stat label="Hours reclaimed" value={String(analysis.meta.hoursReclaimed)} />
          <Stat label="Score improvement" value={`+${analysis.meta.scoreImprovement}`} />
        </section>
      )}

      <footer className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground italic">
        {analysis.closingLine}
      </footer>
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="font-display text-2xl">{value}</div>
  </div>
);
