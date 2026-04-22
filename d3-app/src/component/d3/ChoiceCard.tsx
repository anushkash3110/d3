import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ChoiceCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const ChoiceCard = ({ label, description, selected, onClick, icon, className }: ChoiceCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative w-full text-left rounded-2xl border bg-card p-5 transition-calm",
      "hover:border-primary/40 hover:shadow-soft",
      selected
        ? "border-primary/60 bg-primary-glow/40 shadow-soft"
        : "border-border",
      className
    )}
  >
    <div className="flex items-start gap-4">
      {icon && (
        <div className={cn(
          "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-xl transition-calm",
          selected ? "bg-card shadow-soft" : "bg-muted"
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</div>
        )}
      </div>
      <div
        className={cn(
          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-calm shrink-0 mt-0.5",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </div>
  </button>
);
