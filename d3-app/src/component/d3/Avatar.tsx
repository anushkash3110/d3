import { AvatarMood } from "./D3Content";

const FACES: Record<AvatarMood, { eye: string; mouth: string; bg: string; label: string }> = {
  happy: { eye: "︶", mouth: "‿", bg: "bg-gradient-sage", label: "Bright" },
  calm: { eye: "•", mouth: "‿", bg: "bg-gradient-sky", label: "Balanced" },
  tired: { eye: "─", mouth: "︵", bg: "bg-gradient-warmth", label: "Restful" },
};

export const D3Avatar = ({ mood, size = "md" }: { mood: AvatarMood; size?: "sm" | "md" | "lg" }) => {
  const f = FACES[mood];
  const dim = size === "lg" ? "h-32 w-32 text-3xl" : size === "sm" ? "h-10 w-10 text-xs" : "h-16 w-16 text-base";
  return (
    <div className={`${dim} rounded-full ${f.bg} shadow-soft flex items-center justify-center relative breathe`}>
      <div className="flex flex-col items-center leading-none gap-1">
        <div className="flex gap-2 text-foreground/70">
          <span>{f.eye}</span>
          <span>{f.eye}</span>
        </div>
        <div className="text-foreground/70">{f.mouth}</div>
      </div>
    </div>
  );
};

export const moodLabel = (m: AvatarMood) => FACES[m].label;
