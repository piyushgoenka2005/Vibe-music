"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/gp9/components/header";
import { CinematicShotSequence } from "@/gp9/components/gp9-cinematics/cinematic-shot-sequence";
import { useCinematicScroll } from "@/gp9/components/gp9-cinematics/use-cinematic-scroll";
import {
  GP9_CINEMATIC_DEMO_NOTES,
  GP9_CINEMATIC_SHOTS,
} from "@/gp9/lib/gp9-cinematic-shots";
import { getPerformanceMode } from "@/gp9/lib/gp9-runtime";
import { gp9Path } from "@/gp9/lib/base-path";
import { cn } from "@/gp9/lib/utils";

const ShowroomCanvas = dynamic(
  () => import("@/gp9/components/gp9-scene").then((m) => m.ShowroomCanvas),
  { ssr: false, loading: () => <div className="gp9-showcase-canvas-loading">Loading 3D…</div> }
);

export default function Gp9ShowcasePage() {
  const layoutRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const copyColRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeShot, setActiveShot] = useState(0);
  const [demoNotes, setDemoNotes] = useState<Set<number>>(new Set());

  const shot = GP9_CINEMATIC_SHOTS[activeShot] ?? GP9_CINEMATIC_SHOTS[0];
  const sceneClass = getPerformanceMode(shot.performanceModeId).sceneClass;

  const handleActiveShot = useCallback((index: number) => {
    setActiveShot(index);
  }, []);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shot.id === "touch") {
      setDemoNotes(new Set(GP9_CINEMATIC_DEMO_NOTES));
      return;
    }
    if (shot.id === "recital" || shot.id === "showcase") {
      setDemoNotes(new Set([60, 64, 67]));
      return;
    }
    setDemoNotes(new Set());
  }, [shot.id]);

  useCinematicScroll({
    enabled: mounted && !reducedMotion,
    layoutRef,
    pinRef,
    copyColRef,
    onActiveShot: handleActiveShot,
  });

  const playingBoost = demoNotes.size > 0 ? 0.85 : 0.15;

  return (
    <main className="premium-home gp9-page gp9-showcase-page" data-lenis-prevent>
      <Header />
      <div className="gp9-showcase-hero">
        <span className="gp9-showcase-hero-badge">GP-9 CINEMATIC</span>
        <h1 className="gp9-showcase-hero-title">Seven showcase shots</h1>
        <p className="gp9-showcase-hero-copy">
          Scroll through seven camera moves — each shot retunes lighting, lid, and choreography on
          the live showroom canvas.
        </p>
        <div className="gp9-showcase-hero-actions">
          <Link href={gp9Path("/#midlife")} className="premium-btn premium-btn--outline premium-btn--lg">
            Play instrument
          </Link>
          <a href="#gp9-cinematic-start" className="premium-btn premium-btn--primary premium-btn--lg">
            Begin sequence
          </a>
        </div>
      </div>

      <div
        id="gp9-cinematic-start"
        ref={layoutRef}
        className={cn("gp9-showcase-layout", sceneClass, demoNotes.size > 0 && "gp9-showcase-layout--playing")}
      >
        <div className="gp9-showcase-canvas-col">
          <div ref={pinRef} className="gp9-showcase-canvas-sticky">
            <div className="gp9-showcase-canvas-glow" aria-hidden />
            <div className="gp9-showcase-canvas-frame">
              {mounted && !reducedMotion ? (
                <ShowroomCanvas
                  lidOpen={shot.lidOpen}
                  activeNotes={demoNotes}
                  performanceModeId={shot.performanceModeId}
                  finishId={shot.finishId}
                  cameraPreset={shot.cameraPreset}
                  enableOrbit={shot.cameraPreset === "orbit"}
                  playingBoost={playingBoost}
                  className="gp9-showcase-canvas"
                />
              ) : (
                <div className="gp9-showcase-canvas-fallback" role="img" aria-label="GP-9 piano" />
              )}
            </div>
            <div className="gp9-showcase-canvas-hud" aria-live="polite">
              <span>{shot.label}</span>
              <span>{shot.title}</span>
            </div>
          </div>
        </div>

        <div ref={copyColRef} className="gp9-showcase-copy-col">
          {reducedMotion ? (
            <div className="gp9-showcase-reduced">
              {GP9_CINEMATIC_SHOTS.map((s) => (
                <CinematicShotSequence key={s.id} shot={s} />
              ))}
            </div>
          ) : (
            GP9_CINEMATIC_SHOTS.map((s) => <CinematicShotSequence key={s.id} shot={s} />)
          )}
        </div>
      </div>

      <footer className="gp9-showcase-footer">
        <p>Cinematic showcase · live showroom canvas</p>
        <Link href={gp9Path("/#midlife")} className="gp9-showcase-footer-link">
          Open Sound Lab → Play
        </Link>
      </footer>
    </main>
  );
}
