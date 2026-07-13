"use client";

import { Gp9Image as Image } from "@/gp9/components/gp9-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/gp9/lib/utils";
import {
  frameIndexFromProgress,
  nearestFixFrameIndex,
  preloadFrames,
  resolveSpinnerConfig,
  type SpinnerConfig,
} from "@/gp9/lib/gp9-spinner";
import { ROLAND_GALLERY } from "@/gp9/lib/gp9-assets";

type ProductSpinnerProps = {
  className?: string;
};

export function ProductSpinner({ className }: ProductSpinnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startProgress: 0 });

  const [config, setConfig] = useState<SpinnerConfig | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resolved = await resolveSpinnerConfig();
      if (cancelled) return;

      setConfig(resolved);
      const framesToPreload =
        resolved.mode === "roland" ? resolved.frames.slice(0, 12) : resolved.frames;

      await preloadFrames(framesToPreload, (loaded, total) => {
        if (!cancelled) setLoadPct(Math.round((loaded / total) * 100));
      });

      if (!cancelled) {
        setLoading(false);
        if (resolved.mode === "roland") {
          preloadFrames(resolved.frames.slice(12));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setFromProgress = useCallback(
    (p: number) => {
      if (!config) return;
      const next = frameIndexFromProgress(p, config.frames.length);
      setProgress(p);
      setFrameIndex(next);
    },
    [config]
  );

  const onPointerDown = useCallback(
    (clientX: number) => {
      dragRef.current = { active: true, startX: clientX, startProgress: progress };
    },
    [progress]
  );

  const onPointerMove = useCallback(
    (clientX: number) => {
      if (!dragRef.current.active || !config) return;
      const delta = clientX - dragRef.current.startX;
      const sensitivity = config.mode === "gallery" ? 0.004 : 0.002;
      setFromProgress(dragRef.current.startProgress - delta * sensitivity);
    },
    [config, setFromProgress]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => onPointerMove(e.clientX);
    const onUp = () => onPointerUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onPointerMove, onPointerUp]);

  if (reducedMotion) {
    return (
      <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary", className)}>
        <Image
          src={`${ROLAND_GALLERY}/gp-9_angle_open_gal.jpg`}
          alt="Roland GP-9 digital grand piano"
          fill
          className="object-contain p-6"
        />
      </div>
    );
  }

  if (!config || loading) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-border bg-secondary",
          className
        )}
      >
        <div className="h-1 w-40 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${loadPct}%` }} />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Loading 360° view… {loadPct}%
        </p>
      </div>
    );
  }

  const currentSrc = config.frames[frameIndex];
  const activeDot = nearestFixFrameIndex(progress);

  return (
    <div className={cn("select-none", className)}>
      <div
        ref={containerRef}
        data-lenis-prevent
        className="relative aspect-[4/3] w-full cursor-grab overflow-hidden rounded-2xl border border-border bg-muted active:cursor-grabbing"
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentSrc}
          alt={`Roland GP-9 view frame ${frameIndex + 1}`}
          className="h-full w-full object-contain p-4 md:p-8"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">
            {config.mode === "roland" ? "Roland 360° sequence" : "Gallery rotation"} — drag to rotate
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {config.fixFrames.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`View angle ${i + 1}`}
            onClick={() => setFromProgress(config.fixFrames[i])}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              activeDot === i ? "scale-125 bg-primary" : "bg-border hover:bg-muted-foreground"
            )}
          />
        ))}
      </div>
    </div>
  );
}
