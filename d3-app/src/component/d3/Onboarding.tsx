import { OnboardShell } from "./OnboardShell";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { ChoiceCard } from "./ChoiceCard";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, User } from "lucide-react";

export type OnboardingData = {
  name: string;
  email: string;
  ageGroup: string;
  screenTime: string;
  sleep: string;
  scrollTime: string;
  scrollReason: string;
  feeling: string;
  apps: string[];
  customApp: string;
  mode: "easy" | "moderate" | "extreme" | "";
};

const empty: OnboardingData = {
  name: "", email: "",
  ageGroup: "", screenTime: "", sleep: "", scrollTime: "", scrollReason: "",
  feeling: "", apps: [], customApp: "", mode: ""
};

const STEPS = [
  { key: "ageGroup", question: "Let's start with you.", subtitle: "A few gentle questions help us understand your rhythm — never to judge, only to support.", eyebrow: "About you", options: ["Under 18", "18 – 24", "25 – 34", "35 – 49", "50+"] },
  { key: "screenTime", question: "How much time do you spend on your phone daily?", subtitle: "An honest answer is the most powerful one.", eyebrow: "Awareness", options: ["Less than 2 hours", "2 – 4 hours", "4 – 6 hours", "6 – 8 hours", "More than 8 hours"] },
  { key: "sleep", question: "When do you usually sleep?", subtitle: "Your nights shape your days.", eyebrow: "Rhythm", options: ["Before 10 PM", "10 PM – 12 AM", "12 AM – 2 AM", "After 2 AM", "It varies"] },
  { key: "scrollTime", question: "When do you scroll the most?", eyebrow: "Patterns", options: ["First thing in the morning", "During work or study", "Evening to unwind", "Late at night in bed", "Throughout the day"] },
  { key: "scrollReason", question: "Why do you reach for your phone?", subtitle: "There's no wrong answer here.", eyebrow: "Reflection", options: ["Boredom", "Stress or anxiety", "Habit — I just do it", "To escape feelings", "Genuine connection"] },
  { key: "feeling", question: "How do you usually feel after scrolling?", eyebrow: "Honesty", options: ["Calm and recharged", "Neutral, just passed time", "A little drained", "Anxious or low", "Regretful"] },
] as const;

const APPS = [
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
  {
    id: "easy" as const,
    name: "Easy",
    tag: "Gentle",
    color: "bg-secondary-soft",
    dot: "bg-secondary",
    description: "Soft reminders and light nudges. No blocking. A whisper, not a wall.",
    bullets: ["Gentle reminders", "Light interventions", "No restrictions"],
  },
  {
    id: "moderate" as const,
    name: "Moderate",
    tag: "Balanced",
    color: "bg-primary-glow",
    dot: "bg-primary-soft",
    description: "Time limits and a small task before you continue. Pause, then proceed.",
    bullets: ["Daily time limits", "Task-before-unlock", "Controlled access"],
  },
  {
    id: "extreme" as const,
    name: "Extreme",
    tag: "Committed",
    color: "bg-accent",
    dot: "bg-destructive/60",
    description: "Strong restrictions with delayed access. For when you're ready to truly reset.",
    bullets: ["Pomodoro-based unlock", "Delayed access", "Strong restrictions"],
  },
];

export const Onboarding = ({ onComplete }: { onComplete: (data: OnboardingData) => void }) => {
  const [data, setData] = useState<OnboardingData>(empty);
  // Steps: 0 brand intro, 1 name+email, 2..7 questions, 8 permission, 9 apps, 10 mode, 11 result
  const [step, setStep] = useState(0);
  const TOTAL = 11;

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const update = <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  // Step 0: Brand intro — logo + name + Get Started
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-dawn flex items-center justify-center px-6 py-16 overflow-hidden">
        <div className="max-w-md w-full text-center">
          {/* Logo bloom */}
          <div
            className="mx-auto mb-12 relative h-36 w-36 opacity-0 animate-[scale-in_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-sky shadow-rest breathe" />
            <div
              className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl opacity-0 animate-[fade-in_1.2s_ease-out_forwards]"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="absolute inset-7 rounded-full bg-card/80 backdrop-blur-sm" />
            <div className="absolute inset-14 rounded-full bg-gradient-sage" />
          </div>

          <div
            className="text-xs uppercase tracking-[0.32em] text-muted-foreground mb-5 opacity-0 animate-[fade-in_0.7s_ease-out_forwards]"
            style={{ animationDelay: "1.0s" }}
          >
            Welcome to
          </div>

          <h1 className="font-display text-5xl md:text-6xl leading-[1.02] text-foreground mb-3">
            {["Digital", "Dopamine", "Detox"].map((word, i) => (
              <span
                key={word}
                className="inline-block opacity-0 animate-[fade-in_0.7s_cubic-bezier(0.22,1,0.36,1)_forwards] mr-3 last:mr-0"
                style={{ animationDelay: `${1.4 + i * 0.25}s` }}
              >
                {i === 1 ? <span className="italic text-primary">{word}</span> : word}
              </span>
            ))}
          </h1>

          <div
            className="text-sm tracking-[0.4em] text-muted-foreground/70 mb-12 opacity-0 animate-[fade-in_0.8s_ease-out_forwards]"
            style={{ animationDelay: "2.4s" }}
          >
            D · 3
          </div>

          <div
            className="opacity-0 animate-[fade-in_0.7s_ease-out_forwards]"
            style={{ animationDelay: "2.9s" }}
          >
            <Button variant="trust" size="xl" onClick={next} className="w-full">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Explanation + name + email
  if (step === 1) {
    const emailValid = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    const canContinue = data.name.trim().length >= 2 && data.email.trim().length > 0 && emailValid;

    return (
      <div className="min-h-screen bg-gradient-dawn flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full enter-soft">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
              A gentle beginning
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-foreground mb-5">
              Take a breath.<br />
              <span className="italic text-primary">You're here.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              D3 isn't here to demand your attention. It's here to help you reclaim it — gently, on your terms.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={data.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Your name"
                maxLength={60}
                className="pl-10 h-12 rounded-xl bg-card border-border"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={data.email}
                onChange={e => update("email", e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
                className="pl-10 h-12 rounded-xl bg-card border-border"
              />
            </div>
            {!emailValid && (
              <p className="text-xs text-destructive px-1">Please enter a valid email address.</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="whisper" size="lg" onClick={back}>Back</Button>
              <Button variant="trust" size="lg" onClick={next} disabled={!canContinue} className="flex-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center italic pt-2">
              Takes about 2 minutes. No rush.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Questions: steps 2..7
  if (step >= 2 && step <= 7) {
    const q = STEPS[step - 2];
    const value = data[q.key as keyof OnboardingData] as string;
    return (
      <OnboardShell
        step={step}
        total={TOTAL}
        onBack={back}
        eyebrow={q.eyebrow}
        title={q.question}
        subtitle={"subtitle" in q ? (q as any).subtitle : undefined}
        footer={
          <Button variant="trust" size="lg" disabled={!value} onClick={next}>
            Continue <ArrowRight />
          </Button>
        }
      >
        <div className="grid gap-3">
          {q.options.map(opt => (
            <ChoiceCard
              key={opt}
              label={opt}
              selected={value === opt}
              onClick={() => update(q.key as any, opt as any)}
            />
          ))}
        </div>
      </OnboardShell>
    );
  }

  // Step 8: Permission intro
  if (step === 8) {
    return (
      <OnboardShell
        step={8}
        total={TOTAL}
        onBack={back}
        eyebrow="Permission"
        title="A quiet ask, before we go further."
        subtitle="To gently support you, D3 needs permission to monitor and softly intervene with the apps and sites that pull you in."
        footer={
          <>
            <Button variant="whisper" size="lg" onClick={next}>Not now</Button>
            <Button variant="trust" size="lg" onClick={next}>I allow this <ArrowRight /></Button>
          </>
        }
      >
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          {[
            { t: "Visibility", d: "We see which apps you open and for how long — never the content inside." },
            { t: "Soft overlays", d: "When patterns suggest a loop, we'll show a brief, optional pause." },
            { t: "Always reversible", d: "Disable any permission, anytime, in one tap. You stay in charge." },
          ].map((r, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-9 w-9 rounded-full bg-secondary-soft text-secondary-foreground flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</div>
              <div>
                <div className="font-medium">{r.t}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6 italic">
          You are always in control. You can adjust this anytime.
        </p>
      </OnboardShell>
    );
  }

  // Step 9: Choose apps
  if (step === 9) {
    const toggle = (id: string) =>
      update("apps", data.apps.includes(id) ? data.apps.filter(a => a !== id) : [...data.apps, id]);
    return (
      <OnboardShell
        step={9}
        total={TOTAL}
        onBack={back}
        eyebrow="Choose what you want control over"
        title="Which spaces pull you in?"
        subtitle="Select the apps and sites you'd like D3 to help you with. Add your own if needed."
        footer={
          <Button variant="trust" size="lg" disabled={data.apps.length === 0} onClick={next}>
            Continue <ArrowRight />
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 mb-6">
          {APPS.map(a => (
            <ChoiceCard
              key={a.id}
              label={a.name}
              icon={<span>{a.emoji}</span>}
              selected={data.apps.includes(a.id)}
              onClick={() => toggle(a.id)}
            />
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-border p-4 flex items-center gap-3">
          <span className="text-xl">＋</span>
          <input
            value={data.customApp}
            onChange={e => update("customApp", e.target.value)}
            placeholder="Add a custom app or website"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {data.customApp && (
            <button
              onClick={() => { update("apps", [...data.apps, data.customApp]); update("customApp", ""); }}
              className="text-sm text-primary font-medium"
            >Add</button>
          )}
        </div>
      </OnboardShell>
    );
  }

  // Step 10: Mode selection
  if (step === 10) {
    return (
      <OnboardShell
        step={10}
        total={TOTAL}
        onBack={back}
        eyebrow="Set your control level"
        title="How firm should D3 be?"
        subtitle="Choose what feels right today. You can soften or strengthen this anytime."
        footer={
          <Button variant="trust" size="lg" disabled={!data.mode} onClick={next}>
            Continue <ArrowRight />
          </Button>
        }
      >
        <div className="grid gap-4">
          {MODES.map(m => {
            const selected = data.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => update("mode", m.id)}
                className={`text-left rounded-2xl border p-6 transition-calm ${
                  selected
                    ? "border-primary/60 bg-card shadow-rest"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-soft"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl ${m.color} flex items-center justify-center shrink-0`}>
                    <div className={`h-3 w-3 rounded-full ${m.dot}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <div className="font-display text-2xl">{m.name}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{m.tag}</div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{m.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.bullets.map(b => (
                        <span key={b} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground italic mt-6 text-center">
          You are always in control. You can adjust this anytime.
        </p>
      </OnboardShell>
    );
  }

  // Step 11: Result
  if (step === 11) {
    // Simple heuristic
    const heavy = ["6 – 8 hours", "More than 8 hours"].includes(data.screenTime);
    const escapist = ["To escape feelings", "Stress or anxiety"].includes(data.scrollReason);
    const drained = ["A little drained", "Anxious or low", "Regretful"].includes(data.feeling);
    const score = (heavy ? 2 : 1) + (escapist ? 1 : 0) + (drained ? 1 : 0);
    const level = score >= 3 ? "High" : score >= 2 ? "Moderate" : "Mild";
    const pct = Math.min(95, 30 + score * 18);

    return (
      <div className="min-h-screen bg-gradient-dawn flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full enter-soft">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Your gentle reflection</div>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mb-4">
              You're carrying a <span className="italic text-primary">{level.toLowerCase()}</span> attention load.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              This isn't a verdict — it's a starting point. Many people feel exactly this way. Together, we'll find lighter ground.
            </p>
          </div>

          <div className="rounded-3xl bg-card shadow-rest p-8 mb-8">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-sm text-muted-foreground">Attention load</div>
              <div className="font-display text-3xl">{level}</div>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-6">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-sky pause-shimmer"
                style={{ width: `${pct}%`, backgroundImage: "linear-gradient(90deg, hsl(var(--primary-soft)), hsl(var(--secondary)), hsl(var(--primary-soft)))" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { l: "Daily use", v: data.screenTime || "—" },
                { l: "Top driver", v: data.scrollReason || "—" },
                { l: "Mode chosen", v: data.mode ? data.mode[0].toUpperCase() + data.mode.slice(1) : "—" },
              ].map(s => (
                <div key={s.l} className="rounded-2xl bg-muted/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.l}</div>
                  <div className="text-xs font-medium leading-tight">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="trust" size="xl" className="w-full" onClick={() => onComplete(data)}>
            Enter your calm space <ArrowRight />
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4 italic">
            "The first step is awareness. You've already taken it."
          </p>
        </div>
      </div>
    );
  }

  return null;
};
