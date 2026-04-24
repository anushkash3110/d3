import { ReactNode, useEffect, useState } from "react";
import { Logo } from "./Logo";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/component/ui/button";
import { Bell, Home, Activity, ShieldCheck, BarChart3, Sparkles, Timer, Wind, Moon, Brain } from "lucide-react";
import { useD3 } from "./D3Content";
import { D3Avatar } from "./Avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover";
import { interventionApi } from "@/lib/api";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/blocking", label: "Block", icon: ShieldCheck },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/mirror", label: "My Mirror", icon: Brain },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { mood, isNight, displayName, focusScore, screenTimeHours, completedActivities } = useD3();
  const navigate = useNavigate();
  const [pendingInterventions, setPendingInterventions] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    const loadPending = async () => {
      try {
        const response = await interventionApi.pending();
        setPendingInterventions(response.intervention ? 1 : 0);
      } catch {
        setPendingInterventions(0);
      }
    };

    void loadPending();
    const intervalId = setInterval(() => {
      void loadPending();
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Build gentle, contextual notifications
  const notifications: { icon: typeof Bell; title: string; body: string; action?: () => void; cta?: string }[] = [];
  if (isNight) {
    notifications.push({
      icon: Moon,
      title: "Night mode is on",
      body: "Warmer tones engaged. Consider winding down.",
      action: () => navigate("/reset"),
      cta: "Quick reset",
    });
  }
  if (screenTimeHours >= 4) {
    notifications.push({
      icon: Wind,
      title: "Time for a breath",
      body: `You've been on screens a while today. A 2-minute reset can help.`,
      action: () => navigate("/reset"),
      cta: "Take a break",
    });
  }
  if (focusScore < 60) {
    notifications.push({
      icon: Timer,
      title: "Try a focus session",
      body: "A short 25-minute session will lift your focus score.",
      action: () => navigate("/focus"),
      cta: "Start timer",
    });
  }
  if (completedActivities.length === 0) {
    notifications.push({
      icon: Sparkles,
      title: "One small activity",
      body: "Pick one mindful action — your day will feel different.",
      action: () => navigate("/activities"),
      cta: "See activities",
    });
  }

  return (
    <div className={`min-h-screen ${isNight ? "bg-gradient-warmth" : "bg-background"} transition-calm`}>
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/dashboard")} className="shrink-0">
            <Logo />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm transition-calm flex items-center gap-2 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div
              className="text-[10px] px-2 py-1 rounded-full border border-border bg-card text-muted-foreground"
              title="Pending interventions (debug)"
            >
              debug interventions: {pendingInterventions}
            </div>
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="whisper" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Gentle nudges</div>
                  <div className="text-sm font-medium">Notifications</div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      All quiet. You're doing well.
                    </div>
                  ) : (
                    notifications.map((n, i) => {
                      const Icon = n.icon;
                      return (
                        <button
                          key={i}
                          onClick={n.action}
                          className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-calm border-b border-border/50 last:border-0 flex gap-3"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">{n.body}</div>
                            {n.cta && <div className="text-xs text-primary mt-1">{n.cta} →</div>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile avatar */}
            <button onClick={() => navigate("/profile")} aria-label="Profile" className="rounded-full hover:opacity-80 transition-calm">
              <D3Avatar mood={mood} size="sm" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border/60 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-xs transition-calm flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {children}

      {isNight && (
        <div className="fixed bottom-6 right-6 z-30 max-w-xs rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-rest p-4 enter-soft">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Night mode</div>
          <div className="text-sm">Warmer tones engaged. Your mind needs rest, {displayName}.</div>
        </div>
      )}
    </div>
  );
};
