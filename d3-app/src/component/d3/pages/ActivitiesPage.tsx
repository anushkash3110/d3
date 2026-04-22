import { useD3 } from "../D3Content";
import { Check, Droplet, Footprints, Wind, BookOpen, Sun, Music, NotebookPen, Trees } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../BackButton";

const ACTIVITIES = [
  { id: "water", icon: Droplet, title: "Drink water", note: "Your body is asking." },
  { id: "walk", icon: Footprints, title: "Go for a walk", note: "Even 5 minutes counts." },
  { id: "breathe", icon: Wind, title: "Breathe deeply", note: "4 in, hold, 6 out." },
  { id: "read", icon: BookOpen, title: "Read a page", note: "Slow your mind down." },
  { id: "sun", icon: Sun, title: "Step outside", note: "Daylight resets your rhythm." },
  { id: "music", icon: Music, title: "Listen, fully", note: "One song, eyes closed." },
  { id: "journal", icon: NotebookPen, title: "Write 3 lines", note: "Whatever comes to mind." },
  { id: "stretch", icon: Trees, title: "Stretch slowly", note: "Your shoulders thank you." },
];

export const ActivitiesPage = () => {
  const { completedActivities, toggleActivity } = useD3();

  const handle = (id: string, title: string) => {
    const wasDone = completedActivities.includes(id);
    toggleActivity(id);
    if (!wasDone) toast.success("Good job", { description: `${title} — small steps build big change.` });
  };

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Activities</h1>
        <p className="text-muted-foreground text-sm">Tap when you complete one. Your focus score grows with every choice.</p>
      </header>

      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{completedActivities.length}</span> of {ACTIVITIES.length} done today
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {ACTIVITIES.map((a) => {
          const done = completedActivities.includes(a.id);
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => handle(a.id, a.title)}
              className={`text-left rounded-xl border p-4 transition-calm flex items-center gap-3 ${
                done ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                done ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.note}</div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-calm ${
                done ? "bg-primary border-primary text-primary-foreground" : "border-border"
              }`}>
                {done && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
};
