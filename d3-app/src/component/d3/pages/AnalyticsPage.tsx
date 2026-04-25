import { useEffect, useMemo, useState } from "react";
import { useD3 } from "../D3Content";
import { FocusRing } from "../FocusRing";
import { BackButton } from "../BackButton";
import { api, scoreApi, type ScoreHistoryEntry, type ScoreOverview } from "@/lib/api";

const PALETTE = [
  "hsl(210 60% 70%)",
  "hsl(145 35% 65%)",
  "hsl(32 50% 75%)",
  "hsl(220 35% 75%)",
  "hsl(160 25% 60%)",
  "hsl(20 30% 70%)",
  "hsl(280 20% 75%)",
  "hsl(190 30% 70%)",
];

export const AnalyticsPage = () => {
  const { data, screenTimeHours, focusScore, completedActivities, focusSessionsCompleted } = useD3();


  const [scoreOverview, setScoreOverview] = useState<ScoreOverview | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);

  const normalizedWeeklyHistory = useMemo(() => {
    const byDate = new Map<string, ScoreHistoryEntry>();
    for (const entry of scoreHistory) {
      byDate.set(entry.date, entry);
    }

    const today = new Date();
    const days: ScoreHistoryEntry[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const key = d.toISOString().slice(0, 10);
      const existing = byDate.get(key);
      days.push(existing || { date: key, score: 0, delta: 0, reason: "No data" });
    }
    return days;
  }, [scoreHistory]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [overviewResponse, historyResponse] = await Promise.all([
          scoreApi.getOverview(),
          scoreApi.getHistory(7),
        ]);
        setScoreOverview(overviewResponse);
        setScoreHistory(historyResponse.history || []);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    };

    void loadAnalytics();
  }, []);

  const slices = useMemo(() => {

    const apps = data.apps.length ? data.apps : ["instagram", "youtube", "others"];
    const weights = apps.map((_, i) => Math.max(0.5, 1 - i * 0.18));
    const totalW = weights.reduce((a, b) => a + b, 0);
    return apps.map((id, i) => ({
      label: id.charAt(0).toUpperCase() + id.slice(1),
      pct: Math.round((weights[i] / totalW) * 100),
      color: PALETTE[i % PALETTE.length],
    }));
  }, [data.apps]);

  const weeklyFocus = useMemo(() => {
    if (normalizedWeeklyHistory.length > 0) {
      const scores = normalizedWeeklyHistory.map((entry) => entry.score);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const range = Math.max(1, maxScore - minScore);
      return normalizedWeeklyHistory.map((entry) => ({
        day: new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" }),
        score: Math.round(((entry.score - minScore) / range) * 100),
      }));
    }


    return days.map((day, i) => ({ day, score: 0 }));
  }, [focusScore, normalizedWeeklyHistory]);

  const uiFocusScore = scoreOverview ? Math.round(scoreOverview.currentScore / 10) : focusScore;
  const uiSessions = focusSessionsCompleted;
  const uiActivities = completedActivities.length;
  const uiHours = Number(screenTimeHours.toFixed(1));

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Analytics</h1>
        <p className="text-sm text-muted-foreground">A gentle look at where your attention goes.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="text-sm font-medium mb-4">Screen time by app</div>
          <div className="flex items-center gap-6 flex-wrap">
            <PieChart slices={slices} size={180} />
            <div className="space-y-2 flex-1 min-w-[140px]">
              {slices.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="capitalize flex-1">{s.label}</span>
                  <span className="text-muted-foreground tabular-nums">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center justify-center">
          <FocusRing value={uiFocusScore} size={170} label="Focus score" />
          <div className="mt-5 grid grid-cols-3 gap-3 w-full">
            <MiniStat label="Sessions" value={uiSessions} />
            <MiniStat label="Activities" value={uiActivities} />
            <MiniStat label="Hours" value={uiHours.toFixed(1)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border p-6">
        <div className="text-sm font-medium mb-4">Weekly focus</div>
        <div className="flex items-end gap-3 h-32">
          {weeklyFocus.map((item) => (
            <div key={item.day} className="flex-1 h-full flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-calm bg-primary"
                  style={{ height: `${Math.max(8, item.score)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">{item.day}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center">
    <div className="font-display text-xl">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const PieChart = ({ slices, size = 180 }: { slices: { label: string; pct: number; color: string }[]; size?: number }) => {
  const r = size / 2;
  const cx = r;
  const cy = r;
  let cumulative = 0;
  const total = slices.reduce((a, s) => a + s.pct, 0) || 1;

  const paths = slices.map((s, i) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += s.pct;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={i} d={d} fill={s.color} stroke="hsl(var(--card))" strokeWidth="2" />;
  });

  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="hsl(var(--card))" />
    </svg>
  );
};
