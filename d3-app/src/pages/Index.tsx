import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Onboarding, OnboardingData } from "@/component/d3/Onboarding";
import { D3Provider } from "@/component/d3/D3Content";
import { AppShell } from "@/component/d3/AppShell";
import { DashboardPage } from "@/component/d3/pages/DashboardPage";
import { ActivitiesPage } from "@/component/d3/pages/ActivitiesPage";
import { ProfilePage } from "@/component/d3/pages/ProfilePage";
import { AnalyticsPage } from "@/component/d3/pages/AnalyticsPage";
import { BlockingPage } from "@/component/d3/pages/BlockingPage";
import { ReflectionPage } from "@/component/d3/pages/ReflectionPage";
import { FocusSessionPage } from "@/component/d3/pages/FocusSessionPage";
import { QuickResetPage } from "@/component/d3/pages/QuickResetPage";
import { Intervention } from "@/component/d3/Intervention";

const InnerApp = () => {
  const [intervene, setIntervene] = useState(false);
  const navigate = useNavigate();

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/blocking" element={<BlockingPage />} />
        <Route path="/reflection" element={<ReflectionPage />} />
        <Route path="/focus" element={<FocusSessionPage />} />
        <Route path="/reset" element={<QuickResetPage />} />
      </Routes>

      {intervene && (
        <Intervention
          onClose={() => setIntervene(false)}
          onBreak={() => { setIntervene(false); navigate("/reset"); }}
          onExit={() => { setIntervene(false); navigate("/dashboard"); }}
        />
      )}
    </AppShell>
  );
};

const Index = () => {
  // Onboarding always shows on every load (no persistence)
  const [data, setData] = useState<OnboardingData | null>(null);

  const handleComplete = (d: OnboardingData) => {
    setData(d);
  };

  if (!data) return <Onboarding onComplete={handleComplete} />;
  return (
    <D3Provider initial={data}>
      <InnerApp />
    </D3Provider>
  );
};

export default Index;
