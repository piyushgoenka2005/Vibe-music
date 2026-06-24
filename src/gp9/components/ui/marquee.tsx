"use client";

type MarqueeProps = {
  items: string[];
  speed?: "slow" | "normal" | "fast";
};

export function Marquee({ items, speed = "normal" }: MarqueeProps) {
  const duration =
    speed === "slow" ? "40s" : speed === "fast" ? "18s" : "28s";
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border bg-background py-4">
      <div
        className="flex w-max gap-10 whitespace-nowrap text-sm uppercase tracking-[0.2em] text-muted-foreground"
        style={{ animation: `marquee-scroll ${duration} linear infinite` }}
      >
        {loop.map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
