import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";
import type { InterventionPayload } from "@/lib/api";
import { Camera, Music, PlaySquare, Ghost, MessageCircle, MessageSquare, Users, Film, Smartphone } from "lucide-react";

const getAppIcon = (appName: string) => {
  const name = appName.toLowerCase();
  if (name.includes("instagram")) return <Camera className="h-8 w-8 text-pink-500" />;
  if (name.includes("tiktok")) return <Music className="h-8 w-8 text-indigo-500" />;
  if (name.includes("youtube")) return <PlaySquare className="h-8 w-8 text-red-500" />;
  if (name.includes("snapchat")) return <Ghost className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />;
  if (name.includes("twitter") || name.includes("x")) return <MessageCircle className="h-8 w-8 text-sky-500" />;
  if (name.includes("reddit")) return <MessageSquare className="h-8 w-8 text-orange-500" />;
  if (name.includes("facebook")) return <Users className="h-8 w-8 text-blue-500" />;
  if (name.includes("netflix")) return <Film className="h-8 w-8 text-red-500" />;
  return <Smartphone className="h-8 w-8 text-primary" />;
};

export const Intervention = ({
  intervention,
  onClose,
  onBreak,
  onCompleteTask,
  onSkipTask,
  onExit,
}: {
  intervention?: InterventionPayload | null;
  onClose: () => void;
  onBreak: () => void;
  onCompleteTask?: () => void;
  onSkipTask?: () => void;
  onExit?: () => void;
}) => {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShrink(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 transition-all duration-700"
      style={{
        backgroundColor: shrink ? "hsl(var(--background) / 0.55)" : "hsl(var(--background) / 0)",
        backdropFilter: shrink ? "blur(24px)" : "blur(0px)",
        WebkitBackdropFilter: shrink ? "blur(24px)" : "blur(0px)",
      }}
    >
      <div
        className="max-w-md w-full text-center transition-all duration-1000 ease-out"
        style={{
          transform: shrink ? "scale(1)" : "scale(0.96)",
          opacity: shrink ? 1 : 0,
        }}
      >
        <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-card shadow-rest flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-gradient-sky breathe" />
        </div>
        <div className="flex justify-center mb-4">
          {intervention?.triggerApp ? getAppIcon(intervention.triggerApp) : getAppIcon(intervention?.message?.match(/You've been on (.+) for a while/)?.[1] || "screen")}
        </div>
        <h2 className="font-display text-4xl mb-4 leading-tight">
          Pause.
        </h2>
        <p className="text-lg text-muted-foreground mb-2">{intervention?.message || "You've been scrolling for a while."}</p>
        <p className="text-sm text-muted-foreground mb-2 italic">
          {intervention?.task?.title || "Take a moment to reset."}
        </p>
        {intervention?.task?.description && (
          <p className="text-xs text-muted-foreground mb-6">{intervention.task.description}</p>
        )}
        {!!intervention?.task?.steps?.length && (
          <div className="text-left rounded-xl border border-border bg-card p-3 mb-6 space-y-1">
            {intervention.task.steps.map((step) => (
              <div key={step} className="text-xs text-muted-foreground">{step}</div>
            ))}
          </div>
        )}

        <div className="grid gap-3">
          <Button variant="calm" size="lg" onClick={onCompleteTask ?? (onExit ?? onBreak)}>
            {intervention?.mode === "lock" ? "Start focus session" : "Complete task"}
          </Button>
          <Button variant="soft" size="lg" onClick={onBreak}>Take break</Button>
          <Button variant="whisper" size="lg" onClick={onSkipTask ?? onClose}>Skip once</Button>
        </div>
      </div>
    </div>
  );
};
