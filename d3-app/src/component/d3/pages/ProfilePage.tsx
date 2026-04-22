import { useNavigate } from "react-router-dom";
import { useD3 } from "../D3Content";
import { D3Avatar, moodLabel } from "../Avatar";
import { FocusRing } from "../FocusRing";
import { Button } from "@/component/ui/button";
import { Settings2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Input } from "@/component/ui/input";
import { toast } from "sonner";
import { BackButton } from "../BackButton";

export const ProfilePage = () => {
  const { data, focusScore, screenTimeHours, mood, completedActivities, focusSessionsCompleted, breaksTaken, displayName, setDisplayName } = useD3();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);

  const heavy = ["6 – 8 hours", "More than 8 hours"].includes(data.screenTime);
  const addiction = heavy ? "High" : "Moderate";

  const resetOnboarding = () => {
    try { localStorage.removeItem("d3.onboarding.v1"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      {/* Header card */}
      <section className="rounded-2xl bg-card border border-border p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <D3Avatar mood={mood} size="md" />
        <div className="flex-1 text-center sm:text-left">
          {editing ? (
            <div className="flex gap-2 mb-2 max-w-sm mx-auto sm:mx-0">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <Button variant="trust" size="sm" onClick={() => { setDisplayName(name || "Friend"); setEditing(false); toast.success("Name updated"); }}>Save</Button>
            </div>
          ) : (
            <h1 className="font-display text-3xl mb-1">{displayName}</h1>
          )}
          <p className="text-sm text-muted-foreground mb-3">Feeling {moodLabel(mood).toLowerCase()} today.</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Chip label="Level" value={addiction} />
            <Chip label="Mode" value={data.mode ? data.mode[0].toUpperCase() + data.mode.slice(1) : "Easy"} />
            <Chip label="Age" value={data.ageGroup || "—"} />
          </div>
        </div>
        <div className="flex sm:flex-col gap-2">
          <Button variant="soft" size="sm" onClick={() => setEditing((e) => !e)}>
            <Settings2 className="h-4 w-4" /> {editing ? "Cancel" : "Edit"}
          </Button>
          <Button variant="trust" size="sm" onClick={() => navigate("/blocking")}>Preferences</Button>
        </div>
      </section>

      {/* Score + stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6 flex items-center justify-center">
          <FocusRing value={focusScore} size={140} label="Focus score" />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <Stat label="Screen time" value={`${screenTimeHours.toFixed(1)}h`} />
          <Stat label="Sleep" value={data.sleep || "—"} />
          <Stat label="Activities" value={completedActivities.length.toString()} />
          <Stat label="Sessions" value={focusSessionsCompleted.toString()} />
          <Stat label="Breaks" value={breaksTaken.toString()} />
          <Stat label="Driver" value={data.scrollReason || "—"} />
        </div>
      </section>

      {/* Reset */}
      <section className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-sm">Reset onboarding</div>
          <div className="text-xs text-muted-foreground">Clear your answers and start over.</div>
        </div>
        <Button variant="whisper" size="sm" onClick={resetOnboarding}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </section>
    </main>
  );
};

const Chip = ({ label, value }: { label: string; value: string }) => (
  <span className="text-xs px-3 py-1 rounded-full bg-muted">
    <span className="text-muted-foreground">{label}: </span>
    <span className="font-medium">{value}</span>
  </span>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-card border border-border p-4">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="font-display text-xl truncate">{value}</div>
  </div>
);
