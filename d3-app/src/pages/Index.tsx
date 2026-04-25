import { useEffect, useRef, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Onboarding, OnboardingData } from "@/component/d3/Onboarding";
import { D3Provider } from "@/component/d3/D3Content";
import { useD3 } from "@/component/d3/D3Content";
import { AppShell } from "@/component/d3/AppShell";
import { DashboardPage } from "@/component/d3/pages/DashboardPage";
import { ActivitiesPage } from "@/component/d3/pages/ActivitiesPage";
import { ProfilePage } from "@/component/d3/pages/ProfilePage";
import { AnalyticsPage } from "@/component/d3/pages/AnalyticsPage";
import { BlockingPage } from "@/component/d3/pages/BlockingPage";
import { ReflectionPage } from "@/component/d3/pages/ReflectionPage";
import { FocusSessionPage } from "@/component/d3/pages/FocusSessionPage";
import { QuickResetPage } from "@/component/d3/pages/QuickResetPage";
import { BehavioralMirror } from "@/pages/BehavioralMirror";
import { Intervention } from "@/component/d3/Intervention";
import { api, interventionApi, type InterventionPayload } from "@/lib/api";

const defaultOnboardingData: OnboardingData = {
  name: "",
  email: "",
  password: "",
  ageGroup: "",
  screenTime: "",
  sleep: "",
  scrollTime: "",
  scrollReason: "",
  feeling: "",
  apps: [],
  customApp: "",
  mode: "",
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const DISTRACTING_ROUTES = new Set(["/dashboard", "/activities", "/analytics", "/blocking", "/reflection"]);
const MODE_INTERACTION_THRESHOLD: Record<"easy" | "moderate" | "extreme", number> = {
  easy: 35,
  moderate: 20,
  extreme: 12,
};

const useActivityMonitor = (onTrigger: () => void, isEnabled: boolean) => {
  useEffect(() => {
    if (!isEnabled) return;

    let sessionTimer: NodeJS.Timeout | null = null;
    let idleTimer: NodeJS.Timeout | null = null;

    const handleInteraction = () => {
      // Clear idle timer since the user is interacting
      if (idleTimer) clearTimeout(idleTimer);

      // Start a 5-minute continuous activity timer if not already running
      if (!sessionTimer) {
        sessionTimer = setTimeout(() => {
          onTrigger();
          sessionTimer = null;
        }, 300000); // 5 minutes
      }

      // Reset the continuous timer if the user is inactive for 60 seconds
      idleTimer = setTimeout(() => {
        if (sessionTimer) {
          clearTimeout(sessionTimer);
          sessionTimer = null;
        }
      }, 60000);
    };

    const events = ["mousemove", "scroll", "keydown", "click"];
    events.forEach((e) => window.addEventListener(e, handleInteraction, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleInteraction));
      if (sessionTimer) clearTimeout(sessionTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [onTrigger, isEnabled]);
};

const InnerApp = () => {
  const { data, appLimits } = useD3();
  const [intervene, setIntervene] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState<InterventionPayload | null>(null);
  const [todayScreenMinutes, setTodayScreenMinutes] = useState(0);
  const interactionCountRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;
  const token = localStorage.getItem("token");
  const isDistractingRoute = DISTRACTING_ROUTES.has(path);
  const hasActiveBlocking = appLimits.some((limit) => limit.enabled);
  const currentMode = (data.mode || "easy") as "easy" | "moderate" | "extreme";
  const interactionThreshold = MODE_INTERACTION_THRESHOLD[currentMode];

  useEffect(() => {
    if (!token) return;

    const loadTodayScreenTime = async () => {
      try {
        const response = await api.get<{ entries: Array<{ date: string; totalMinutes: number }> }>("/screen-time");
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayEntry = response.entries.find((entry) => new Date(entry.date).toISOString().slice(0, 10) === todayKey);
        setTodayScreenMinutes(todayEntry?.totalMinutes || 0);
      } catch (error) {
        console.error("Failed to load screen time history:", error);
      }
    };

    void loadTodayScreenTime();
  }, [token]);

  useEffect(() => {
    if (!token || !isDistractingRoute || !hasActiveBlocking) return;

    const intervalId = setInterval(() => {
      setTodayScreenMinutes((prev) => {
        const next = prev + 1;
        void api
          .post("/screen-time", {
            date: new Date().toISOString(),
            totalMinutes: next,
            entertainmentMinutes: next,
            notes: "Auto-logged from frontend activity tracker",
          })
          .catch((error) => {
            console.error("Failed to auto-log screen time:", error);
          });
        return next;
      });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, isDistractingRoute, hasActiveBlocking]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(() => {
      void interventionApi
        .pending()
        .then((response) => {
          if (!response.intervention || response.intervention.status !== "pending") return;
          setActiveIntervention((existing) => {
            if (existing?.interventionId === response.intervention?._id) return existing;
            return {
              interventionId: response.intervention._id,
              mode: response.intervention.mode,
              action: response.intervention.mode === "lock" ? "FORCE_FOCUS" : response.intervention.mode === "gentle" ? "SHOW_REMINDER" : "SHOW_TASK",
              task: {
                type: response.intervention.taskType,
                icon: "🌿",
                title: response.intervention.taskAssigned || "Mindful Break",
                description: "Take a short mindful break before continuing.",
                durationSeconds: 60,
                category: "mindfulness",
              },
              message: `You've been on ${response.intervention.triggerApp} for a while. Time for a reset.`,
              pomodoroMinutes: 25,
            };
          });
          setIntervene(true);
        })
        .catch(() => {
          // ignore background polling failures
        });
    }, 20000);
    return () => clearInterval(intervalId);
  }, [token]);

  const onShowIntervention = useCallback(() => {
    if (intervene) return;
    void interventionApi
      .trigger({
        appName: path.replace("/", "") || "screen",
        continuousMinutes: Math.max(1, Math.round(todayScreenMinutes)),
      })
      .then((payload) => {
        setActiveIntervention(payload);
        setIntervene(true);
      })
      .catch(() => {
        setIntervene(true);
      });
  }, [intervene, path, todayScreenMinutes]);

  useActivityMonitor(
    onShowIntervention,
    !!token && isDistractingRoute && hasActiveBlocking && path !== "/focus"
  );

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/mirror" element={<ProtectedRoute><BehavioralMirror /></ProtectedRoute>} />
        <Route path="/blocking" element={<ProtectedRoute><BlockingPage /></ProtectedRoute>} />
        <Route path="/reflection" element={<ProtectedRoute><ReflectionPage /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusSessionPage /></ProtectedRoute>} />
        <Route path="/reset" element={<QuickResetPage />} />
      </Routes>

      {intervene && (
        <Intervention
          intervention={activeIntervention}
          onClose={() => {
            // Easy mode allows dismissing intervention overlays.
            if (currentMode === "easy") {
              setIntervene(false);
              setActiveIntervention(null);
            } else {
              navigate("/reset");
            }
          }}
          onBreak={() => {
            setIntervene(false);
            setActiveIntervention(null);
            navigate("/reset");
          }}
          onCompleteTask={() => {
            if (activeIntervention?.interventionId) {
              void interventionApi.complete(activeIntervention.interventionId).catch((error) => {
                console.error("Failed to complete intervention:", error);
              });
            }
            setIntervene(false);
            const shouldFocus = activeIntervention?.mode === "lock" || activeIntervention?.task?.type === "pomodoro";
            setActiveIntervention(null);
            navigate(shouldFocus ? "/focus" : "/dashboard");
          }}
          onSkipTask={() => {
            if (activeIntervention?.interventionId) {
              void interventionApi.skip(activeIntervention.interventionId).catch((error) => {
                console.error("Failed to skip intervention:", error);
              });
            }
            setIntervene(false);
            setActiveIntervention(null);
          }}
          onExit={() => {
            setIntervene(false);
            setActiveIntervention(null);
            navigate(currentMode === "extreme" ? "/focus" : "/dashboard");
          }}
        />
      )}
    </AppShell>
  );
};

const Index = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [data, setData] = useState<OnboardingData | null>(() => {
    const cached = localStorage.getItem("d3.onboarding.v1");
    if (!cached) return null;
    try {
      return { ...defaultOnboardingData, ...JSON.parse(cached) };
    } catch {
      return null;
    }
  });

  const handleComplete = (d: OnboardingData) => {
    localStorage.setItem("d3.onboarding.v1", JSON.stringify(d));
    setData(d);
    setToken(localStorage.getItem("token"));
  };

  useEffect(() => {
    const syncAuth = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", syncAuth);
    window.addEventListener("d3-auth-changed", syncAuth as EventListener);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("d3-auth-changed", syncAuth as EventListener);
    };
  }, []);

  useEffect(() => {
    if (data) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const bootstrapFromProfile = async () => {
      try {
        const response = await api.get<{
          profile?: {
            ageRange?: string;
            distractionTriggers?: string[];
            preferredFocusSessionMinutes?: number;
          };
        }>("/onboarding");

        const hydrated: OnboardingData = {
          ...defaultOnboardingData,
          ageGroup: response.profile?.ageRange || "",
          apps: response.profile?.distractionTriggers || [],
        };
        setData(hydrated);
      } catch {
        // If token is invalid, api helper redirects to onboarding.
      }
    };

    void bootstrapFromProfile();
  }, [data]);

  // Render onboarding whenever the user is logged out.
  // This prevents redirect loops between "/" and protected routes.
  if (!token || !data) return <Onboarding onComplete={handleComplete} />;
  return (
    <D3Provider initial={data}>
      <InnerApp />
    </D3Provider>
  );
};

export default Index;
