import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/component/ui/button";
import { useD3 } from "../D3Content";
import { Pause, Play, X, Check } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../BackButton";

export const FocusSessionPage = ({ minutes = 25 }: { minutes?: number }) => {
  const navigate = useNavigate();
  const { addFocusSession, data } = useD3();
  const [intent, setIntent] = useState("");
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(false);

  // Moderate/extreme mode requires task-before-unlock
  const requiresIntent = data.mode === "moderate" || data.mode === "extreme";

  useEffect(() => {
    if (!started || !running || completed) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [started, running, completed]);

  useEffect(() => {
    if (started && seconds === 0 && !completed) {
      setCompleted(true);
      addFocusSession();
      toast.success("Session complete", { description: "You returned to yourself. Beautiful work." });
    }
  }, [seconds, started, completed, addFocusSession]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const r = 130;
  const c = 2 * Math.PI * r;
  const pct = 1 - seconds / (minutes * 60);

  if (!started) {
    return (
      <main className="max-w-xl mx-auto px-6 md:px-10 py-16 enter-soft">
        <div className="mb-8"><BackButton /></div>
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">Focus session</div>
        <h1 className="font-display text-4xl md:text-5xl mb-4 leading-tight">{minutes} minutes of <span className="italic text-primary">presence.</span></h1>
        <p className="text-muted-foreground mb-8">Notifications will quiet. Distractions will dim. Be where you are.</p>

        {requiresIntent && (
          <div className="mb-8">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
              What will you complete before continuing?
            </label>
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Write 200 words, finish the report…"
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 outline-none focus:border-primary/40 transition-calm"
            />
            <p className="text-xs text-muted-foreground mt-2 italic">A clear intention is the doorway to deep work.</p>
          </div>
        )}

        <Button
          variant="trust"
          size="xl"
          className="w-full"
          disabled={requiresIntent && !intent.trim()}
          onClick={() => setStarted(true)}
        >
          Begin focus
        </Button>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="min-h-[80vh] max-w-xl mx-auto px-6 md:px-10 py-16 flex flex-col items-center justify-center enter-soft text-center">
        <div className="h-24 w-24 rounded-full bg-gradient-sage flex items-center justify-center mb-8 shadow-rest">
          <Check className="h-10 w-10 text-secondary-foreground" />
        </div>
        <h1 className="font-display text-4xl mb-3">Session complete.</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">You gave {minutes} minutes back to yourself. Your focus score grew.</p>
        <div className="flex gap-3">
          <Button variant="soft" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
          <Button variant="trust" onClick={() => navigate("/activities")}>Choose an activity</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] flex flex-col items-center justify-center px-6 enter-soft">
      <button onClick={() => navigate("/dashboard")} className="absolute top-24 right-6 h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-calm" aria-label="Exit">
        <X className="h-5 w-5" />
      </button>

      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Focus session</div>
      {intent && <div className="text-sm text-muted-foreground mb-8 italic max-w-md text-center">"{intent}"</div>}

      <div className="relative">
        <svg width="320" height="320" className="-rotate-90">
          <circle cx="160" cy="160" r={r} stroke="hsl(var(--muted))" strokeWidth="2" fill="none" />
          <circle
            cx="160" cy="160" r={r}
            stroke="hsl(var(--primary))" strokeWidth="2" fill="none"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-7xl tabular-nums tracking-tight">
            {String(m).padStart(2, "0")}<span className="text-muted-foreground">:</span>{String(s).padStart(2, "0")}
          </div>
          <div className="text-sm text-muted-foreground mt-3 italic">breathe in — hold — breathe out</div>
        </div>
        <div className="absolute inset-12 rounded-full bg-primary-glow/20 breathe -z-10" />
      </div>

      <div className="mt-12 flex items-center gap-4">
        <Button variant="soft" size="lg" onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
        </Button>
        <Button variant="whisper" size="lg" onClick={() => navigate("/dashboard")}>End session</Button>
      </div>
    </main>
  );
};
