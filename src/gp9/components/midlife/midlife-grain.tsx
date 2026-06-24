import { MIDLIFE_GRAIN_URL } from "@/gp9/lib/midlife-tokens";
import { cn } from "@/gp9/lib/utils";

type MidlifeGrainProps = {
  className?: string;
  opacity?: number;
};

export function MidlifeGrain({ className, opacity = 0.3 }: MidlifeGrainProps) {
  return (
    <div
      className={cn("midlife-grain", className)}
      style={{ opacity }}
      aria-hidden
    />
  );
}

export const midlifeGrainStyle = {
  backgroundImage: `url("${MIDLIFE_GRAIN_URL}")`,
  backgroundRepeat: "repeat",
  backgroundPosition: "left top",
  backgroundSize: "89.5px auto",
} as const;
