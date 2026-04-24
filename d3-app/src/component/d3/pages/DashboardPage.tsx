import { useNavigate } from "react-router-dom";
import { Button } from "@/component/ui/button";
import { useD3 } from "../D3Content";
import { FocusRing } from "../FocusRing";
import { D3Avatar, moodLabel } from "../Avatar";
import { useEffect, useState, type ReactNode } from "react";
import { api, scoreApi, type ScoreHistoryEntry, type ScoreOverview } from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/component/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  Timer, Wind, Heart, Droplet, Footprints, BookOpen, ChevronRight, TrendingUp, Target, Activity, Flame
} from "lucide-react";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Winding down";
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, focusScore, screenTimeHours, improvementPct, mood, displayName, completedActivities } = useD3();
  const [scoreOverview, setScoreOverview] = useState<ScoreOverview | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [recalculating, setRecalculating] = useState(false);
  const [analytics, setAnalytics] = useState<{
    metrics?: { avgScreenTimeLast7Days?: number; focusStreak?: number };
    recentScreenTime?: Array<{ totalMinutes: number }>;
    focusSessionsPerDay?: Array<{ day: string; sessions: number }>;
    screenTimeTrend?: Array<{ day: string; hours: number }>;
    streakProgress?: Array<{ day: string; streak: number }>;
    demoAnalytics?: {
      focusScore?: number;
      appBreakdown?: Array<{ label: string; minutes: number; pct: number }>;
      weeklyFocus?: Array<{ day: string; score: number; date: string }>;
      metrics?: {
        sessions?: number;
        activities?: number;
        hours?: number;
      };
      controlScore?: {
        currentScore?: number;
        streakDays?: number;
      };
    };
  } | null>(null);

  const loadDashboardData = async () => {
    try {
      const [analyticsResponse, overviewResponse, historyResponse] = await Promise.all([
        api.get<{
          metrics: { avgScreenTimeLast7Days: number; focusStreak: number };
          recentScreenTime: Array<{ totalMinutes: number }>;
          focusSessionsPerDay: Array<{ day: string; sessions: number }>;
          screenTimeTrend: Array<{ day: string; hours: number }>;
          streakProgress: Array<{ day: string; streak: number }>;
        }>("/dashboard/analytics"),
        scoreApi.getOverview(),
        scoreApi.getHistory(7),
      ]);
      setAnalytics(analyticsResponse);
      setScoreOverview(overviewResponse);
      setScoreHistory(historyResponse.history || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await scoreApi.recalculate();
      } catch (error) {
        console.error("Failed to run initial score recalculation:", error);
      }
      await loadDashboardData();
    };
    void bootstrap();
  }, []);

  const effectiveScreenHours =
    analytics?.demoAnalytics?.metrics?.hours ??
    (analytics?.metrics?.avgScreenTimeLast7Days !== undefined ? analytics.metrics.avgScreenTimeLast7Days / 60 : screenTimeHours);
  const focusStreak = scoreOverview?.streak ?? analytics?.demoAnalytics?.controlScore?.streakDays ?? analytics?.metrics?.focusStreak ?? 0;
  const effectiveFocusScore = scoreOverview ? Math.round(scoreOverview.currentScore / 10) : analytics?.demoAnalytics?.focusScore ?? focusScore;

  const screenBreakdown = analytics?.demoAnalytics?.appBreakdown || [];
  const topApps = screenBreakdown.length
    ? screenBreakdown.slice(0, 3).map((entry) => ({
        name: entry.label,
        hours: entry.minutes / 60,
      }))
    : data.apps.slice(0, 3).map((a, i) => ({
        name: a,
        hours: effectiveScreenHours * (0.5 - i * 0.15),
      }));

  const hasNonZeroFocusSessions =
    (analytics?.focusSessionsPerDay || []).some((item) => (item.sessions || 0) > 0);
  const hasNonZeroStreakProgress =
    (analytics?.streakProgress || []).some((item) => (item.streak || 0) > 0);
  const hasNonZeroScreenTrend =
    (analytics?.screenTimeTrend || []).some((item) => (item.hours || 0) > 0);

  const uniqueByDate = new Map<string, ScoreHistoryEntry>();
  for (const entry of scoreHistory) {
    uniqueByDate.set(entry.date, entry);
  }
  const today = new Date();
  const weeklyHistory = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    weeklyHistory.push(uniqueByDate.get(key) || { date: key, score: 0, delta: 0, reason: "No data" });
  }

  const focusPerDayData =
    analytics?.focusSessionsPerDay && analytics.focusSessionsPerDay.length > 0 && hasNonZeroFocusSessions
      ? analytics.focusSessionsPerDay
      : weeklyHistory.length > 0
        ? weeklyHistory.map((item) => ({
            day: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
            sessions: Math.max(0, Math.round(item.score / 20)),
          }))
        : (analytics?.demoAnalytics?.weeklyFocus || []).map((item) => ({
            day: item.day,
            sessions: Math.max(0, Math.round(item.score / 20)),
        }));

  const screenTimeTrendData =
    analytics?.screenTimeTrend && analytics.screenTimeTrend.length > 0 && hasNonZeroScreenTrend
      ? analytics.screenTimeTrend
      : (analytics?.demoAnalytics?.weeklyFocus || []).map((item) => ({
          day: item.day,
          hours: Number(((item.score / 100) * Math.max(0.8, effectiveScreenHours)).toFixed(1)),
        }));

  const streakProgressData =
    analytics?.streakProgress && analytics.streakProgress.length > 0 && hasNonZeroStreakProgress
      ? analytics.streakProgress
      : weeklyHistory.length > 0
        ? weeklyHistory.map((item, idx) => ({
            day: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
            streak: idx + 1,
          }))
        : (analytics?.demoAnalytics?.weeklyFocus || []).map((item, idx) => ({
            day: item.day,
            streak: idx + 1,
        }));

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8">
      {/* Greeting */}
      <section className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground mb-1">{greeting()}, {displayName}</div>
          <h1 className="font-display text-3xl md:text-4xl">A quiet moment for you.</h1>
        </div>
        <div className="flex items-center gap-3">
          <D3Avatar mood={mood} size="sm" />
          <div className="text-sm">
            <div className="text-muted-foreground text-xs">Today</div>
            <div className="font-medium">{moodLabel(mood)}</div>
          </div>
        </div>
      </section>

      {/* Score + Screen time */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl bg-card border border-border p-6 flex items-center gap-6 flex-wrap">
          <FocusRing value={effectiveFocusScore} size={150} />
          <div className="flex-1 min-w-[180px] space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Mode</div>
              <div className="font-medium capitalize">{data.mode || "easy"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Focus streak</div>
              <div className="font-medium">{focusStreak} day{focusStreak === 1 ? "" : "s"}</div>
            </div>
            {improvementPct > 0 && (
              <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                <TrendingUp className="h-4 w-4" /> +{improvementPct}% today
              </div>
            )}
            <Button variant="soft" size="sm" onClick={() => navigate("/analytics")}>
              View analytics <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-xs text-muted-foreground">Screen time today</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 7 days</div>
          </div>
          <div className="font-display text-4xl mb-3">{effectiveScreenHours.toFixed(1)}<span className="text-base text-muted-foreground">h</span></div>

          {/* Histogram: last 7 days */}
          <ScreenTimeHistogram todayHours={effectiveScreenHours} />

          <div className="space-y-2 mt-4 pt-4 border-t border-border/60">
            {topApps.map((app) => (
              <div key={app.name} className="flex items-center justify-between text-sm">
                <span className="capitalize">{app.name}</span>
                <span className="text-muted-foreground tabular-nums">{Math.max(0, app.hours).toFixed(1)}h</span>
              </div>
            ))}
            {topApps.length === 0 && <div className="text-sm text-muted-foreground">No apps tracked.</div>}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <div className="text-xs text-muted-foreground">Control score</div>
          </div>
          <div className="font-display text-3xl text-primary">{scoreOverview?.currentScore ?? 0}</div>
        </div>
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <div className="text-xs text-muted-foreground">Current level</div>
          </div>
          <div className="text-lg font-medium text-amber-600 dark:text-amber-400">{scoreOverview?.levelEmoji || "😔"} {scoreOverview?.level || "Struggling"}</div>
        </div>
        <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div className="text-xs text-muted-foreground">Weekly average</div>
          </div>
          <div className="font-display text-3xl text-green-600 dark:text-green-400">{scoreOverview?.weeklyAvgScore ?? 0}</div>
        </div>
        <div className="rounded-2xl bg-orange-500/5 border border-orange-500/20 p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div className="font-display text-3xl text-orange-600 dark:text-orange-400">{scoreOverview?.streak ?? 0}d</div>
          </div>
          <Button
            size="sm"
            variant="trust"
            disabled={recalculating}
            onClick={async () => {
              setRecalculating(true);
              try {
                await scoreApi.recalculate();
                await loadDashboardData();
              } catch (error) {
                console.error("Manual score recalculation failed:", error);
              } finally {
                setRecalculating(false);
              }
            }}
          >
            {recalculating ? "Recalculating..." : "Recalculate score"}
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <ChartCard title="Focus sessions per day">
          <ChartContainer
            className="h-40 w-full"
            config={{ sessions: { label: "Sessions", color: "hsl(var(--primary))" } }}
          >
            <BarChart data={focusPerDayData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sessions" fill="var(--color-sessions)" radius={6} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Screen time trend (hours)">
          <ChartContainer
            className="h-40 w-full"
            config={{ hours: { label: "Hours", color: "hsl(var(--secondary))" } }}
          >
            <LineChart data={screenTimeTrendData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="hours" stroke="var(--color-hours)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Streak progress">
          <ChartContainer
            className="h-40 w-full"
            config={{ streak: { label: "Streak", color: "hsl(var(--accent-foreground))" } }}
          >
            <LineChart data={streakProgressData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="streak" stroke="var(--color-streak)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-xl mb-4">Quick actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard icon={Timer} title="Focus session" description="25 minutes of deep work." onClick={() => navigate("/focus")} />
          <ActionCard icon={Wind} title="Quick reset" description="A short break to reset." onClick={() => navigate("/reset")} />
          <ActionCard icon={Heart} title="Reflect" description="A gentle check-in." onClick={() => navigate("/reflection")} />
        </div>
      </section>

      {/* Activities */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl">Try this instead</h2>
          <button onClick={() => navigate("/activities")} className="text-sm text-primary hover:underline">
            See all ({completedActivities.length} done)
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Droplet, t: "Drink water" },
            { icon: Footprints, t: "Walk a little" },
            { icon: Wind, t: "Breathe" },
            { icon: BookOpen, t: "Read a page" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.t}
                onClick={() => navigate("/activities")}
                className="text-left rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-calm"
              >
                <Icon className="h-5 w-5 text-secondary-foreground mb-3" />
                <div className="font-medium text-sm">{c.t}</div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
        D3 is here to whisper, not to demand.
      </footer>
    </main>
  );
};

const ActionCard = ({ icon: Icon, title, description, onClick }: {
  icon: typeof Timer; title: string; description: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="text-left rounded-2xl bg-card border border-border p-5 hover:border-primary/40 hover:shadow-soft transition-calm flex items-start gap-4"
  >
    <div className="h-10 w-10 rounded-xl bg-secondary-soft flex items-center justify-center shrink-0">
      <Icon className="h-5 w-5 text-secondary-foreground" />
    </div>
    <div className="flex-1">
      <div className="font-medium mb-1">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
  </button>
);

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <div className="text-xs text-muted-foreground mb-3">{title}</div>
    {children}
  </div>
);

// 7-day screen time histogram. Gently varies around today's hours so the
// chart feels alive even before real tracking data exists.
const ScreenTimeHistogram = ({ todayHours }: { todayHours: number }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  // Deterministic pseudo-random offsets so bars don't reshuffle on each render
  const offsets = [-0.8, 0.4, -1.2, 0.9, -0.3, 1.1, 0];
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6

  const values = offsets.map((o, i) =>
    i === todayIdx ? todayHours : Math.max(0.5, todayHours + o)
  );
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1.5 h-20" role="img" aria-label="Screen time over the last 7 days">
      {values.map((v, i) => {
        const isToday = i === todayIdx;
        const heightPct = (v / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-md transition-calm ${
                  isToday
                    ? "bg-gradient-to-t from-primary to-primary-glow shadow-soft"
                    : "bg-muted hover:bg-muted-foreground/20"
                }`}
                style={{ height: `${Math.max(8, heightPct)}%` }}
                title={`${v.toFixed(1)}h`}
              />
            </div>
            <span className={`text-[10px] tabular-nums ${isToday ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
};
