import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";
import type { InterventionPayload } from "@/lib/api";

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
        <h2 className="font-display text-4xl mb-4 leading-tight">
          {intervention?.task?.icon ? `${intervention.task.icon} Pause.` : "Pause."}
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
