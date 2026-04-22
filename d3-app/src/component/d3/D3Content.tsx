import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { OnboardingData } from "./Onboarding";

export type AvatarMood = "happy" | "calm" | "tired";

export type AppLimit = { id: string; name: string; emoji: string; dailyMin: number; sessionMin: number; enabled: boolean };

export type D3State = {
  data: OnboardingData;
  setData: (d: OnboardingData) => void;
  updateData: (patch: Partial<OnboardingData>) => void;
  // Activity tracking
  completedActivities: string[];
  toggleActivity: (id: string) => void;
  // Focus sessions
  focusSessionsCompleted: number;
  addFocusSession: () => void;
  // Breaks
  breaksTaken: number;
  addBreak: () => void;
  // Screen time (simulated, hours)
  screenTimeHours: number;
  // Derived
  focusScore: number;
  improvementPct: number;
  mood: AvatarMood;
  // App limits
  appLimits: AppLimit[];
  setAppLimits: (a: AppLimit[]) => void;
  // Reflection result
  reflectionResult: string | null;
  setReflectionResult: (s: string | null) => void;
  // Night mode (auto)
  isNight: boolean;
  // Display name
  displayName: string;
  setDisplayName: (s: string) => void;
};

const SCREEN_TIME_HOURS: Record<string, number> = {
  "Less than 2 hours": 1.4,
  "2 – 4 hours": 3.2,
  "4 – 6 hours": 5.1,
  "6 – 8 hours": 6.8,
  "More than 8 hours": 8.4,
};

const Ctx = createContext<D3State | null>(null);

export const useD3 = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useD3 must be used within D3Provider");
  return c;
};

export const D3Provider = ({ initial, children }: { initial: OnboardingData; children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(initial);
  const [completedActivities, setCompleted] = useState<string[]>([]);
  const [focusSessionsCompleted, setFocus] = useState(0);
  const [breaksTaken, setBreaks] = useState(0);
  const [appLimits, setAppLimits] = useState<AppLimit[]>(() =>
    initial.apps.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      emoji: "📱",
      dailyMin: 30,
      sessionMin: 15,
      enabled: true,
    }))
  );
  const [reflectionResult, setReflectionResult] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initial.name?.trim() || "Friend");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const screenTimeHours = SCREEN_TIME_HOURS[data.screenTime] ?? 4.2;

  const focusScore = useMemo(() => {
    // Base inversely proportional to screen time
    const base = Math.max(20, 95 - screenTimeHours * 7);
    const activityBoost = completedActivities.length * 4;
    const focusBoost = focusSessionsCompleted * 6;
    const breakBoost = breaksTaken * 3;
    return Math.min(100, Math.round(base + activityBoost + focusBoost + breakBoost));
  }, [screenTimeHours, completedActivities.length, focusSessionsCompleted, breaksTaken]);

  const improvementPct = useMemo(() => {
    return Math.max(0, completedActivities.length * 5 + focusSessionsCompleted * 7 + breaksTaken * 3);
  }, [completedActivities.length, focusSessionsCompleted, breaksTaken]);

  const mood: AvatarMood = focusScore >= 75 ? "happy" : focusScore >= 50 ? "calm" : "tired";

  const hour = now.getHours();
  const isNight = hour >= 21 || hour < 6;

  const updateData = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }));
  const toggleActivity = (id: string) =>
    setCompleted((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const addFocusSession = () => setFocus((f) => f + 1);
  const addBreak = () => setBreaks((b) => b + 1);

  return (
    <Ctx.Provider
      value={{
        data,
        setData,
        updateData,
        completedActivities,
        toggleActivity,
        focusSessionsCompleted,
        addFocusSession,
        breaksTaken,
        addBreak,
        screenTimeHours,
        focusScore,
        improvementPct,
        mood,
        appLimits,
        setAppLimits,
        reflectionResult,
        setReflectionResult,
        isNight,
        displayName,
        setDisplayName,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
