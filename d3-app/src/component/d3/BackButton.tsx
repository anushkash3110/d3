import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  to?: string;
  label?: string;
  className?: string;
};

export const BackButton = ({ to = "/dashboard", label = "Back", className = "" }: Props) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-calm rounded-full px-3 py-1.5 -ml-3 hover:bg-muted/60 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
};
