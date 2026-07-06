import type { CSSProperties, ReactNode } from "react";
import "@/styles/marquee.css";

export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  sequenceClassName?: string;
  duration?: string;
  ariaLabel?: string;
  role?: string;
  pauseOnHover?: boolean;
}

export default function Marquee({
  children,
  className = "",
  trackClassName = "",
  sequenceClassName = "",
  duration = "32s",
  ariaLabel,
  role = "presentation",
  pauseOnHover = true,
}: MarqueeProps) {
  const pauseClass = pauseOnHover ? " marquee--pause-hover" : "";

  return (
    <div
      className={`marquee${pauseClass}${className ? ` ${className}` : ""}`}
      role={role}
      aria-label={ariaLabel}
    >
      <div
        className={`marquee__track${trackClassName ? ` ${trackClassName}` : ""}`}
        style={{ "--marquee-duration": duration } as CSSProperties}
      >
        <div className={`marquee__sequence${sequenceClassName ? ` ${sequenceClassName}` : ""}`}>
          {children}
        </div>
        <div
          aria-hidden="true"
          className={`marquee__sequence marquee__sequence--clone${sequenceClassName ? ` ${sequenceClassName}` : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
