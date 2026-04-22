import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/component/ui/button";
import { useD3 } from "../D3Content";
import { Wind, Check } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../BackButton";

const SUGGESTIONS = [
  { id: "breath-3", title: "3 deep breaths", duration: "1 min", body: "Slow in for 4, hold for 4, out for 6. Three times." },
  { id: "stretch", title: "Shoulder stretch", duration: "2 min", body: "Roll your shoulders back. Soften your jaw. Release your tongue from the roof of your mouth." },
  { id: "water", title: "Glass of water", duration: "2 min", body: "Stand. Walk to the kitchen. Drink slowly. Notice the temperature." },
  { id: "look-far", title: "Look at the horizon", duration: "1 min", body: "Find the furthest object you can see. Let your eyes rest there." },
  { id: "walk", title: "Five-minute walk", duration: "5 min", body: "No phone. Just movement. Notice what's around you." },
  { id: "music", title: "One full song", duration: "4 min", body: "Eyes closed. No multitasking. Just listen." },
];

export const QuickResetPage = () => {
  const navigate = useNavigate();
  const { addBreak } = useD3();
  const [picked, setPicked] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && seconds <= 0) {
      setRunning(false);
      addBreak();
      toast.success("Reset complete", { description: "You came back to yourself. Beautifully done." });
    }
  }, [seconds, running, addBreak]);

  const start = (id: string, mins: number) => {
    setPicked(id);
    setSeconds(mins * 60);
    setRunning(true);
  };

  const sel = SUGGESTIONS.find((s) => s.id === picked);

  if (running && sel) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (
      <main className="min-h-[80vh] max-w-md mx-auto px-6 py-16 flex flex-col items-center justify-center text-center enter-soft">
        <div className="h-24 w-24 rounded-full bg-gradient-sky flex items-center justify-center mb-8 breathe">
          <Wind className="h-10 w-10 text-foreground/70" />
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">{sel.title}</div>
        <div className="font-display text-6xl tabular-nums mb-4">{String(Math.max(0, m)).padStart(2, "0")}:{String(Math.max(0, s)).padStart(2, "0")}</div>
        <p className="text-muted-foreground italic max-w-xs mb-10">{sel.body}</p>
        <Button variant="whisper" onClick={() => { setRunning(false); navigate("/dashboard"); }}>End early</Button>
      </main>
    );
  }

  if (picked && !running && seconds <= 0) {
    return (
      <main className="min-h-[80vh] max-w-md mx-auto px-6 py-16 flex flex-col items-center justify-center text-center enter-soft">
        <div className="h-24 w-24 rounded-full bg-gradient-sage flex items-center justify-center mb-8 shadow-rest">
          <Check className="h-10 w-10 text-secondary-foreground" />
        </div>
        <h1 className="font-display text-4xl mb-3">Beautifully done.</h1>
        <p className="text-muted-foreground mb-8">You took a real break. Your focus score grew.</p>
        <div className="flex gap-3">
          <Button variant="soft" onClick={() => { setPicked(null); }}>Another one</Button>
          <Button variant="trust" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Quick reset</h1>
        <p className="text-sm text-muted-foreground">Pick one. A few minutes is enough.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => start(s.id, parseInt(s.duration))}
            className="text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-soft transition-calm"
          >
            <div className="flex items-baseline justify-between mb-2">
              <div className="font-display text-xl">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.duration}</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </button>
        ))}
      </div>
    </main>
  );
};
