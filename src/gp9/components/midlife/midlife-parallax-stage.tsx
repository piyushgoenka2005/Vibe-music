"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Gp9ModelStatusNote from "@/gp9/components/ui/gp9-model-status-note";
import {
  clamp,
  isCoarsePointer,
  observeSection,
  prefersReducedMotion,
} from "@/gp9/lib/scroll-performance";

type MotionState = {
  scrollY: number;
  px: number;
  py: number;
  tiltX: number;
  tiltY: number;
  scale: number;
  shadowY: number;
  shadowBlur: number;
};

const LERP = 0.11;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const INITIAL: MotionState = {
  scrollY: 72,
  px: 0,
  py: 0,
  tiltX: 0,
  tiltY: 0,
  scale: 0.94,
  shadowY: 48,
  shadowBlur: 72,
};

type MidlifeParallaxStageProps = {
  children: ReactNode;
};

export function MidlifeParallaxStage({ children }: MidlifeParallaxStageProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<MotionState>({ ...INITIAL });
  const currentRef = useRef<MotionState>({ ...INITIAL });
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0, inside: false });

  const applyTransform = useCallback((state: MotionState) => {
    const stage = stageRef.current;
    const shadow = shadowRef.current;
    if (!stage) return;

    stage.style.transform = [
      `translate3d(${state.px.toFixed(2)}px, ${(state.scrollY + state.py).toFixed(2)}px, 0)`,
      `rotateX(${state.tiltX.toFixed(3)}deg)`,
      `rotateY(${state.tiltY.toFixed(3)}deg)`,
      `scale(${state.scale.toFixed(4)})`,
    ].join(" ");

    if (shadow) {
      shadow.style.transform = `translate3d(${(-state.px * 0.35).toFixed(2)}px, ${state.shadowY.toFixed(2)}px, 0) scale(${(
        state.scale * 0.98
      ).toFixed(4)})`;
      shadow.style.filter = `blur(${state.shadowBlur.toFixed(1)}px)`;
      shadow.style.opacity = `${0.42 + state.scale * 0.12}`;
    }
  }, []);

  const updateScrollTarget = useCallback(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const range = zone.offsetHeight - window.innerHeight;
    const progress = range > 0 ? clamp(-zone.getBoundingClientRect().top / range) : 0;

    targetRef.current.scrollY = 72 - progress * 196;
    targetRef.current.scale = 0.94 + progress * 0.06;
    targetRef.current.shadowY = 48 - progress * 18;
    targetRef.current.shadowBlur = 72 - progress * 16;
  }, []);

  const updatePointerTarget = useCallback(() => {
    const { x, y, inside } = pointerRef.current;
    if (!inside || prefersReducedMotion() || isCoarsePointer()) {
      targetRef.current.px = 0;
      targetRef.current.py = 0;
      targetRef.current.tiltX = 0;
      targetRef.current.tiltY = 0;
      return;
    }

    targetRef.current.px = x * 18;
    targetRef.current.py = y * 10;
    targetRef.current.tiltX = -y * 5.5;
    targetRef.current.tiltY = x * 7;
  }, []);

  const loop = useCallback(() => {
    if (!activeRef.current) {
      rafRef.current = null;
      return;
    }

    updateScrollTarget();
    updatePointerTarget();

    const current = currentRef.current;
    const target = targetRef.current;

    current.scrollY = lerp(current.scrollY, target.scrollY, LERP);
    current.px = lerp(current.px, target.px, LERP);
    current.py = lerp(current.py, target.py, LERP);
    current.tiltX = lerp(current.tiltX, target.tiltX, LERP);
    current.tiltY = lerp(current.tiltY, target.tiltY, LERP);
    current.scale = lerp(current.scale, target.scale, LERP);
    current.shadowY = lerp(current.shadowY, target.shadowY, LERP);
    current.shadowBlur = lerp(current.shadowBlur, target.shadowBlur, LERP);

    applyTransform(current);
    rafRef.current = requestAnimationFrame(loop);
  }, [applyTransform, updatePointerTarget, updateScrollTarget]);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      applyTransform({
        scrollY: 0,
        px: 0,
        py: 0,
        tiltX: 0,
        tiltY: 0,
        scale: 1,
        shadowY: 40,
        shadowBlur: 64,
      });
      return;
    }

    const zone = zoneRef.current;
    if (!zone) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = zone.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      pointerRef.current.inside = inside;
      if (!inside) return;

      const nx = (event.clientX / window.innerWidth - 0.5) * 2;
      const ny = (event.clientY / window.innerHeight - 0.5) * 2;
      pointerRef.current.x = clamp(nx, -1, 1);
      pointerRef.current.y = clamp(ny, -1, 1);
    };

    const onPointerLeaveWindow = () => {
      pointerRef.current.inside = false;
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    const unobserve = observeSection(zone, (active) => {
      activeRef.current = active;
      if (active) startLoop();
      else stopLoop();
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeaveWindow);

    startLoop();

    return () => {
      unobserve();
      stopLoop();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeaveWindow);
    };
  }, [applyTransform, startLoop, stopLoop]);

  return (
    <div
      ref={zoneRef}
      data-scroll-engage
      data-lenis-prevent-touch
      className="midlife-parallax-zone"
      aria-label="Midlife Engineering parallax stage"
    >
      <div className="midlife-parallax-sticky">
        <h2 className="midlife-parallax-title">Sound Lab</h2>
        <Gp9ModelStatusNote />
        <div className="midlife-parallax-center">
          <div ref={shadowRef} className="midlife-parallax-shadow" aria-hidden />
          <div ref={stageRef} className="midlife-parallax-stage">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
