import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";

export const Intervention = ({
  onClose,
  onBreak,
  onExit,
}: {
  onClose: () => void;
  onBreak: () => void;
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
        <h2 className="font-display text-4xl mb-4 leading-tight">Pause.</h2>
        <p className="text-lg text-muted-foreground mb-2">Are you still in control?</p>
        <p className="text-sm text-muted-foreground mb-10 italic">No judgment. Just a moment to notice.</p>

        <div className="grid gap-3">
          <Button variant="calm" size="lg" onClick={onBreak}>Take a break — I needed this</Button>
          <Button variant="soft" size="lg" onClick={onClose}>Continue, mindfully</Button>
          <Button variant="whisper" size="lg" onClick={onExit ?? onBreak}>Exit the app</Button>
        </div>
      </div>
    </div>
  );
};
