import { useD3 } from "../D3Content";
import { FocusRing } from "../FocusRing";
import { BackButton } from "../BackButton";

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

  const apps = data.apps.length ? data.apps : ["instagram", "youtube", "others"];
  const weights = apps.map((_, i) => Math.max(0.5, 1 - i * 0.18));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const slices = apps.map((id, i) => ({
    label: id.charAt(0).toUpperCase() + id.slice(1),
    pct: Math.round((weights[i] / totalW) * 100),
    color: PALETTE[i % PALETTE.length],
  }));

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = (new Date().getDay() + 6) % 7;
  const series = [40, 65, 50, 78, 45, 30, 60].map((b, i) => (i === today ? Math.max(b, focusScore) : b));

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
          <FocusRing value={focusScore} size={170} label="Focus score" />
          <div className="mt-5 grid grid-cols-3 gap-3 w-full">
            <MiniStat label="Sessions" value={focusSessionsCompleted} />
            <MiniStat label="Activities" value={completedActivities.length} />
            <MiniStat label="Hours" value={screenTimeHours.toFixed(1)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border p-6">
        <div className="text-sm font-medium mb-4">Weekly focus</div>
        <div className="flex items-end gap-3 h-32">
          {series.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-md transition-calm ${i === today ? "bg-primary" : "bg-primary-soft/70"}`}
                style={{ height: `${b}%` }}
              />
              <div className="text-xs text-muted-foreground">{days[i]}</div>
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
