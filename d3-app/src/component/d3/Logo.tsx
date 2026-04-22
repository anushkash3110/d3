import { cn } from "@/lib/utils";

export const Logo = ({ className, withWord = true }: { className?: string; withWord?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="relative h-9 w-9">
      <div className="absolute inset-0 rounded-full bg-gradient-sky shadow-soft" />
      <div className="absolute inset-[7px] rounded-full bg-card/80 backdrop-blur-sm" />
      <div className="absolute inset-[14px] rounded-full bg-secondary breathe" />
    </div>
    {withWord && (
      <div className="leading-none">
        <div className="font-display text-xl tracking-tight">D3</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">Detox</div>
      </div>
    )}
  </div>
);
