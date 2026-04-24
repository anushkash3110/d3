import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";

export const Logo = ({ className, withWord = true }: { className?: string; withWord?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-sm">
      <BrainCircuit className="h-6 w-6" />
    </div>
    {withWord && (
      <div className="leading-none">
        <div className="font-display text-2xl tracking-tight text-foreground font-bold">D3</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-0.5">Detox</div>
      </div>
    )}
  </div>
);
