import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";
import { X, Pause, Play } from "lucide-react";

export const FocusMode = ({ minutes = 25, onExit }: { minutes?: number; onExit: () => void }) => {
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pct = 1 - seconds / (minutes * 60);
  const r = 130;
  const c = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-calm flex flex-col items-center justify-center px-6 enter-soft">
      <button
        onClick={onExit}
        className="absolute top-6 right-6 h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-calm"
        aria-label="Exit focus"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-12">Focus session</div>

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

      <div className="mt-16 flex items-center gap-4">
        <Button variant="soft" size="lg" onClick={() => setRunning(r => !r)}>
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
        </Button>
        <Button variant="whisper" size="lg" onClick={onExit}>End session</Button>
      </div>

      <p className="absolute bottom-10 text-xs text-muted-foreground max-w-sm text-center">
        Notifications are muted. Distractions are dimmed. Be where you are.
      </p>
    </div>
  );
};
