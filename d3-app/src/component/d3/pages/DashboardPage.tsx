import { useNavigate } from "react-router-dom";
import { Button } from "@/component/ui/button";
import { useD3 } from "../D3Content";
import { FocusRing } from "../FocusRing";
import { D3Avatar, moodLabel } from "../Avatar";
import {
  Timer, Wind, Heart, Droplet, Footprints, BookOpen, ChevronRight, TrendingUp,
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
          <FocusRing value={focusScore} size={150} />
          <div className="flex-1 min-w-[180px] space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Mode</div>
              <div className="font-medium capitalize">{data.mode || "easy"}</div>
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
          <div className="font-display text-4xl mb-3">{screenTimeHours.toFixed(1)}<span className="text-base text-muted-foreground">h</span></div>

          {/* Histogram: last 7 days */}
          <ScreenTimeHistogram todayHours={screenTimeHours} />

          <div className="space-y-2 mt-4 pt-4 border-t border-border/60">
            {data.apps.slice(0, 3).map((a, i) => (
              <div key={a} className="flex items-center justify-between text-sm">
                <span className="capitalize">{a}</span>
                <span className="text-muted-foreground tabular-nums">{(screenTimeHours * (0.5 - i * 0.15)).toFixed(1)}h</span>
              </div>
            ))}
            {data.apps.length === 0 && <div className="text-sm text-muted-foreground">No apps tracked.</div>}
          </div>
        </div>
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
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
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
