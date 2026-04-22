import { useState } from "react";
import { useD3, AppLimit } from "../D3Content";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Switch } from "@/component/ui/switch";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../BackButton";

const DEFAULT_APPS = [
  { id: "instagram", name: "Instagram", emoji: "📷" },
  { id: "tiktok", name: "TikTok", emoji: "🎵" },
  { id: "youtube", name: "YouTube", emoji: "▶️" },
  { id: "snapchat", name: "Snapchat", emoji: "👻" },
  { id: "x", name: "X / Twitter", emoji: "✕" },
  { id: "reddit", name: "Reddit", emoji: "🟧" },
  { id: "facebook", name: "Facebook", emoji: "📘" },
  { id: "netflix", name: "Netflix", emoji: "🎬" },
];

const MODES = [
  { id: "easy", name: "Easy", description: "Reminders only. Soft nudges." },
  { id: "moderate", name: "Moderate", description: "Task before unlock." },
  { id: "extreme", name: "Extreme", description: "Pomodoro required." },
] as const;

export const BlockingPage = () => {
  const { appLimits, setAppLimits, data, updateData } = useD3();
  const [custom, setCustom] = useState("");

  // Merge default + existing
  const knownIds = new Set(appLimits.map((a) => a.id));
  const presented: AppLimit[] = [
    ...appLimits,
    ...DEFAULT_APPS.filter((a) => !knownIds.has(a.id)).map((a) => ({
      ...a,
      dailyMin: 30,
      sessionMin: 15,
      enabled: false,
    })),
  ];

  const update = (id: string, patch: Partial<AppLimit>) => {
    const exists = appLimits.find((a) => a.id === id);
    if (exists) {
      setAppLimits(appLimits.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    } else {
      const base = presented.find((a) => a.id === id)!;
      setAppLimits([...appLimits, { ...base, ...patch }]);
    }
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    const id = custom.toLowerCase().replace(/\s+/g, "-");
    if (appLimits.some((a) => a.id === id)) {
      toast.error("Already added");
      return;
    }
    setAppLimits([...appLimits, { id, name: custom, emoji: "📱", dailyMin: 30, sessionMin: 15, enabled: true }]);
    setCustom("");
    toast.success(`${custom} added to your control list`);
  };

  const save = () => {
    toast.success("Your control system is active", {
      description: `${appLimits.filter((a) => a.enabled).length} apps under gentle watch.`,
    });
  };

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Control your distractions</h1>
        <p className="text-sm text-muted-foreground">Choose what to watch, set limits, pick your firmness.</p>
      </header>

      {/* Section 1: Apps */}
      <section className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">1 · Select apps & websites</div>
        <h2 className="font-display text-2xl mb-6">What would you like D3 to watch with you?</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {presented.map((a) => (
            <div key={a.id} className={`rounded-2xl border p-4 transition-calm ${a.enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">{a.emoji}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.enabled ? `${a.dailyMin}m daily · ${a.sessionMin}m per session` : "Off"}</div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={(v) => update(a.id, { enabled: v })} />
              </div>
              {a.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <NumberField label="Daily limit (min)" value={a.dailyMin} onChange={(v) => update(a.id, { dailyMin: v })} />
                  <NumberField label="Session limit (min)" value={a.sessionMin} onChange={(v) => update(a.id, { sessionMin: v })} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Input placeholder="Add a custom app or website" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
          <Button variant="soft" onClick={addCustom}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </section>

      {/* Section 3: Mode */}
      <section className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">2 · Choose your control level</div>
        <h2 className="font-display text-2xl mb-6">How firm should D3 be?</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {MODES.map((m) => {
            const sel = data.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { updateData({ mode: m.id }); toast(`${m.name} mode selected`); }}
                className={`text-left rounded-2xl border p-5 transition-calm ${
                  sel ? "border-primary/60 bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-display text-xl">{m.name}</div>
                  {sel && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground">{m.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="trust" size="lg" onClick={save}>Save & apply</Button>
      </div>
      <p className="text-xs text-muted-foreground italic text-center">You are always in control. You can adjust this anytime.</p>
    </main>
  );
};

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="block">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    <Input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || "1")))} className="h-9" />
  </label>
);
