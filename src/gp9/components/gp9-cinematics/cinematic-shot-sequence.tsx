"use client";

import { forwardRef } from "react";
import type { Gp9CinematicShot } from "@/gp9/lib/gp9-cinematic-shots";
import { cn } from "@/gp9/lib/utils";

export type CinematicShotSequenceProps = {
  shot: Gp9CinematicShot;
  className?: string;
};

export const CinematicShotSequence = forwardRef<HTMLElement, CinematicShotSequenceProps>(
  function CinematicShotSequence({ shot, className }, ref) {
    return (
      <section
        ref={ref}
        className={cn("gp9-cinematic-shot", className)}
        data-shot-id={shot.id}
        aria-label={shot.title}
      >
        <div className="gp9-cinematic-shot-inner">
          <span className="gp9-cinematic-shot-label">{shot.label}</span>
          <p className="gp9-cinematic-shot-subtitle">{shot.subtitle}</p>
          <h2 className="gp9-cinematic-shot-title">{shot.title}</h2>
          <p className="gp9-cinematic-copy">{shot.body}</p>
        </div>
      </section>
    );
  }
);
