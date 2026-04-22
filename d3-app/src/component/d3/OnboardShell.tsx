import { Logo } from "./Logo";
import { Progress } from "./Progress";
import { Button } from "@/component/ui/button";
import { ArrowLeft } from "lucide-react";

interface OnboardShellProps {
  step: number;
  total: number;
  onBack?: () => void;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const OnboardShell = ({ step, total, onBack, eyebrow, title, subtitle, children, footer }: OnboardShellProps) => (
  <div className="min-h-screen bg-gradient-dawn flex flex-col">
    <header className="px-6 md:px-10 py-6 flex items-center justify-between gap-6 max-w-3xl mx-auto w-full">
      <Logo />
      <div className="flex-1 max-w-[260px]">
        <Progress value={step} total={total} />
      </div>
    </header>

    <main className="flex-1 px-6 md:px-10 pb-32 pt-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        {onBack ? (
          <Button variant="whisper" size="icon" onClick={onBack} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : <div className="h-11 w-11" />}
        {eyebrow && (
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</span>
        )}
      </div>

      <div className="enter-soft">
        <h1 className="font-display text-4xl md:text-5xl text-foreground leading-[1.05] mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </main>

    {footer && (
      <footer className="fixed bottom-0 inset-x-0 border-t border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-4 flex items-center justify-end gap-3">
          {footer}
        </div>
      </footer>
    )}
  </div>
);
