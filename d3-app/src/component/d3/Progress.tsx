import { cn } from "@/lib/utils";

export const Progress = ({ value, total }: { value: number; total: number }) => {
  const pct = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-muted-foreground tabular-nums w-10">
        {String(value).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </div>
      <div className="relative h-[3px] flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-sky transition-calm")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
