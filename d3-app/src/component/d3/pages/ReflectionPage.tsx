import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";
import { useD3 } from "../D3Content";
import { ArrowRight, RotateCcw } from "lucide-react";
import { BackButton } from "../BackButton";
import { api } from "@/lib/api";

const QUESTIONS = [
  {
    q: "How do you feel after scrolling?",
    options: [
      { label: "Calm and recharged", score: 0 },
      { label: "Neutral", score: 1 },
      { label: "A little drained", score: 2 },
      { label: "Anxious or low", score: 3 },
    ],
  },
  {
    q: "Do you feel in control of your screen time?",
    options: [
      { label: "Yes, mostly", score: 0 },
      { label: "Sometimes", score: 1 },
      { label: "Rarely", score: 2 },
      { label: "Almost never", score: 3 },
    ],
  },
  {
    q: "How often do you reach for your phone without thinking?",
    options: [
      { label: "Rarely", score: 0 },
      { label: "A few times a day", score: 1 },
      { label: "Often", score: 2 },
      { label: "Constantly", score: 3 },
    ],
  },
  {
    q: "When did you last feel fully present, no screen?",
    options: [
      { label: "Today", score: 0 },
      { label: "This week", score: 1 },
      { label: "Hard to remember", score: 2 },
      { label: "I can't recall", score: 3 },
    ],
  },
  {
    q: "How is your sleep lately?",
    options: [
      { label: "Restful", score: 0 },
      { label: "Okay", score: 1 },
      { label: "Light, broken", score: 2 },
      { label: "Poor", score: 3 },
    ],
  },
];

const interpret = (score: number, max: number) => {
  const pct = score / max;
  if (pct < 0.25) return { title: "You are improving control", body: "Your patterns are gentle. Keep noticing what nourishes you.", tone: "bg-gradient-sage" };
  if (pct < 0.55) return { title: "You are mostly steady", body: "There's room to slow down. Small daily rituals will move you far.", tone: "bg-gradient-calm" };
  if (pct < 0.8) return { title: "You are slightly digitally overloaded", body: "This is common — and very reversible. Try one focus session today.", tone: "bg-gradient-warmth" };
  return { title: "Your attention is asking for rest", body: "No judgment. Just a clear signal. Consider Extreme mode for a week.", tone: "bg-gradient-dawn" };
};

export const ReflectionPage = () => {
  const { setReflectionResult, focusScore, mood } = useD3();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadJournalEntries = async () => {
      try {
        await api.get<{ entries: Array<{ _id: string }> }>("/journal");
      } catch (error) {
        console.error("Failed to fetch journal entries:", error);
      }
    };

    void loadJournalEntries();
  }, []);

  const max = QUESTIONS.length * 3;
  const total = answers.reduce((a, b) => a + b, 0);

  const select = (score: number) => {
    const next = [...answers, score];
    setAnswers(next);
    if (step + 1 >= QUESTIONS.length) {
      const finishReflection = async () => {
        const result = interpret(next.reduce((a, b) => a + b, 0), max);
        try {
          await api.post("/journal", {
            reflection: `${result.title}. ${result.body}`,
            moodScore: Math.max(1, Math.min(10, 10 - Math.round((next.reduce((a, b) => a + b, 0) / max) * 9))),
            wins: ["Completed D3 reflection"],
          });
        } catch (error) {
          console.error("Failed to save reflection entry:", error);
        }
        setReflectionResult(result.title);
        setDone(true);
      };

      void finishReflection();
    } else {
      setStep((s) => s + 1);
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setDone(false); };

  if (done) {
    const result = interpret(total, max);
    return (
      <main className="max-w-xl mx-auto px-6 md:px-10 py-10 space-y-6">
        <BackButton />
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <div className="text-sm text-muted-foreground mb-3">Your reflection</div>
          <h1 className="font-display text-3xl mb-3 leading-tight">{result.title}</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{result.body}</p>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
            <Stat label="Score" value={`${Math.round((1 - total / max) * 100)}`} />
            <Stat label="Focus" value={focusScore.toString()} />
            <Stat label="Mood" value={mood} />
          </div>
          <Button variant="soft" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4" /> Take it again
          </Button>
        </div>
      </main>
    );
  }

  const q = QUESTIONS[step];

  return (
    <main className="max-w-xl mx-auto px-6 md:px-10 py-10 space-y-6">
      <BackButton />
      <div className="text-sm text-muted-foreground">Question {step + 1} of {QUESTIONS.length}</div>
      <h1 className="font-display text-2xl md:text-3xl leading-snug">{q.q}</h1>

      <div className="grid gap-2">
        {q.options.map((o) => (
          <button
            key={o.label}
            onClick={() => select(o.score)}
            className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-soft transition-calm flex items-center justify-between group"
          >
            <span className="text-sm">{o.label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-calm" />
          </button>
        ))}
      </div>

      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-calm" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
      </div>
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-card/70 backdrop-blur p-3">
    <div className="font-display text-xl capitalize">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);
