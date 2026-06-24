import { ArrowUpRight } from "lucide-react";
import { cn } from "@/gp9/lib/utils";

type NavArrowIconProps = {
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md";
};

export function NavArrowIcon({
  className,
  iconClassName,
  size = "md",
}: NavArrowIconProps) {
  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-all duration-300 group-hover:border-primary/25 group-hover:bg-primary group-hover:text-primary-foreground",
        dimensions,
        className
      )}
      aria-hidden
    >
      <ArrowUpRight className={cn(iconSize, iconClassName)} />
    </span>
  );
}
