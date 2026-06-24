"use client";

import { cn } from "@/gp9/lib/utils";

type SectionHeadingProps = {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  label,
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "px-6 md:px-12 lg:px-20",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {label ? (
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      ) : null}
      <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
