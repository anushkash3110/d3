import { Logo } from "./Logo";
import { Button } from "@/component/ui/button";
import { OnboardingData } from "./Onboarding";
import {
  Sparkles, Timer, Wind, Heart, Moon, Droplet, Footprints, BookOpen, ChevronRight, Bell
} from "lucide-react";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Resting hours";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Winding down";
};

interface DashboardProps {
  data: OnboardingData;
  onStartFocus: () => void;
  onShowIntervention: () => void;
}

const SCREEN_TIME_HOURS: Record<string, number> = {
  "Less than 2 hours": 1.4,
  "2 – 4 hours": 3.2,
  "4 – 6 hours": 5.1,
  "6 – 8 hours": 6.8,
  "More than 8 hours": 8.4,
};

export const Dashboard = ({ data, onStartFocus, onShowIntervention }: DashboardProps) => {
  const hours = SCREEN_TIME_HOURS[data.screenTime] ?? 4.2;
  const focusScore = Math.round(Math.max(20, 92 - hours * 7));
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const bars = [40, 65, 50, 78, 45, 30, 60];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="whisper" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-9 w-9 rounded-full bg-gradient-sage flex items-center justify-center text-secondary-foreground text-sm font-medium">
              You
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-10">
        {/* Greeting + focus score */}
        <section className="enter-soft">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">{greeting()}</div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mb-3">
            A quiet moment, <span className="italic text-primary">just for you.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            You're in <span className="font-medium text-foreground capitalize">{data.mode || "easy"}</span> mode today. Move slowly. Notice what arises.
          </p>
        </section>

        {/* Focus score + screen time */}
        <section className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 rounded-3xl bg-gradient-calm p-8 shadow-soft relative overflow-hidden">
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Focus score · today</div>
              <div className="flex items-end gap-4 mb-6">
                <div className="font-display text-7xl leading-none">{focusScore}</div>
                <div className="text-muted-foreground mb-2">/ 100</div>
              </div>
              <div className="flex items-end gap-2 h-20">
                {bars.map((b, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-md ${i === 4 ? "bg-primary" : "bg-primary-soft/70"}`}
                      style={{ height: `${b}%` }}
                    />
                    <div className="text-[10px] text-muted-foreground">{days[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-8 shadow-soft">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Screen time</div>
            <div className="font-display text-5xl leading-none mb-1">{hours.toFixed(1)}<span className="text-xl text-muted-foreground">h</span></div>
            <div className="text-sm text-muted-foreground mb-6">today, so far</div>
            <div className="space-y-3">
              {data.apps.slice(0, 3).map((a, i) => (
                <div key={a} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{a}</span>
                  <span className="text-muted-foreground tabular-nums">{(hours * (0.5 - i * 0.15)).toFixed(1)}h</span>
                </div>
              ))}
              {data.apps.length === 0 && (
                <div className="text-sm text-muted-foreground">No apps tracked yet.</div>
              )}
            </div>
          </div>
        </section>

        {/* Action cards */}
        <section className="grid md:grid-cols-3 gap-5">
          <ActionCard
            icon={<Timer className="h-5 w-5" />}
            title="Start a focus session"
            description="25 minutes of quiet, undistracted attention."
            cta="Begin"
            onClick={onStartFocus}
            tone="primary"
          />
          <ActionCard
            icon={<Wind className="h-5 w-5" />}
            title="Quick reset"
            description="Three slow breaths. A moment to return to yourself."
            cta="Breathe"
            onClick={onShowIntervention}
            tone="sage"
          />
          <ActionCard
            icon={<Heart className="h-5 w-5" />}
            title="Reflect"
            description="A gentle check-in. How are you, really?"
            cta="Open"
            onClick={() => {}}
            tone="warm"
          />
        </section>

        {/* Replacement activities */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl">Instead of scrolling, try…</h2>
            <span className="text-xs text-muted-foreground">Small, real, restorative</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Droplet className="h-5 w-5" />, t: "Drink water", s: "Your body is asking." },
              { icon: <Footprints className="h-5 w-5" />, t: "Walk a little", s: "5 minutes is enough." },
              { icon: <Wind className="h-5 w-5" />, t: "Breathe deeply", s: "Reset your system." },
              { icon: <BookOpen className="h-5 w-5" />, t: "Read a page", s: "Slow your mind down." },
            ].map(c => (
              <div key={c.t} className="rounded-2xl bg-card border border-border p-5 hover:shadow-soft transition-calm">
                <div className="h-10 w-10 rounded-xl bg-secondary-soft text-secondary-foreground flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <div className="font-medium mb-1">{c.t}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{c.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Reflection */}
        <section className="rounded-3xl bg-gradient-warmth p-8 md:p-10 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Evening reflection</span>
          </div>
          <h3 className="font-display text-3xl mb-4 max-w-xl leading-tight">How are you feeling, right now?</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {["😌 Calm", "🙂 Steady", "😐 Neutral", "😕 Restless", "😞 Drained"].map(e => (
              <button key={e} className="px-5 py-2.5 rounded-full bg-card border border-border text-sm hover:border-primary/40 hover:shadow-soft transition-calm">
                {e}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground italic max-w-lg">
            "Awareness is the first thread of change. You're already pulling it."
          </p>
        </section>

        {/* Night mode banner */}
        <section className="rounded-3xl bg-card border border-border p-6 flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <Moon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Night mode activates at 9:30 PM</div>
            <div className="text-sm text-muted-foreground">Warmer tones, quieter screens. Your mind needs rest.</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8 italic">
          You are always in control. D3 is here to whisper, not to demand.
        </footer>
      </main>
    </div>
  );
};

const ActionCard = ({
  icon, title, description, cta, onClick, tone,
}: {
  icon: React.ReactNode; title: string; description: string; cta: string; onClick: () => void;
  tone: "primary" | "sage" | "warm";
}) => {
  const tones = {
    primary: "bg-gradient-sky",
    sage: "bg-gradient-sage",
    warm: "bg-gradient-warmth",
  };
  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-soft hover:shadow-rest transition-calm flex flex-col">
      <div className={`h-11 w-11 rounded-2xl ${tones[tone]} flex items-center justify-center mb-5 text-foreground/80`}>
        {icon}
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{description}</p>
      <Button variant="soft" onClick={onClick} className="self-start">
        {cta} <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
