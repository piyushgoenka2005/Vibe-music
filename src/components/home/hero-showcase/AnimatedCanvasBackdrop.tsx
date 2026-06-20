"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
}

interface AnimatedCanvasBackdropProps {
  panX: number;
  panY: number;
  pointerX: number;
  pointerY: number;
}

export default function AnimatedCanvasBackdrop({
  panX,
  panY,
  pointerX,
  pointerY,
}: AnimatedCanvasBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const visibleRef = useRef(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 48 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.15 + Math.random() * 0.75,
        speed: 0.0008 + Math.random() * 0.0016,
        size: 0.6 + Math.random() * 1.4,
        alpha: 0.08 + Math.random() * 0.22,
      }));
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);

      if (!visibleRef.current) return;

      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width * (0.5 + pointerX * 0.08 + panX * 0.02);
      const cy = height * (0.48 + pointerY * 0.06 + panY * 0.02);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.55);
      glow.addColorStop(0, "rgba(18, 83, 237, 0.14)");
      glow.addColorStop(0.45, "rgba(18, 83, 237, 0.05)");
      glow.addColorStop(1, "rgba(3, 8, 20, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      if (!reducedMotion) {
        time += 1;

        for (const particle of particlesRef.current) {
          particle.angle += particle.speed;
          const orbitX =
            cx +
            Math.cos(particle.angle + time * 0.0012) * particle.radius * width * 0.42;
          const orbitY =
            cy +
            Math.sin(particle.angle * 1.15 + time * 0.0009) * particle.radius * height * 0.28;

          ctx.beginPath();
          ctx.fillStyle = `rgba(120, 170, 255, ${particle.alpha})`;
          ctx.arc(orbitX, orbitY, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = "rgba(18, 83, 237, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, width * 0.34, height * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy, width * 0.48, height * 0.3, 0.12, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [panX, panY, pointerX, pointerY, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="hero-showcase__canvas absolute h-full w-full cursor-move select-none touch-pan-y"
      aria-hidden
    />
  );
}
