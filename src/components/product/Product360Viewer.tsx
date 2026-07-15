"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Product360ViewerProps {
  frames: string[];
  productName: string;
}

export default function Product360Viewer({
  frames,
  productName,
}: Product360ViewerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startIndex: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // Preload frames for smooth drag rotation.
    for (const src of frames.slice(0, 24)) {
      const img = new Image();
      img.src = src;
    }
  }, [frames]);

  const setFromDelta = useCallback(
    (deltaX: number, startIndex: number) => {
      if (frames.length === 0) return;
      const steps = Math.round(deltaX / 12);
      const next =
        ((startIndex - steps) % frames.length + frames.length) % frames.length;
      setFrameIndex(next);
    },
    [frames.length]
  );

  if (frames.length === 0) return null;

  const activeSrc = frames[frameIndex] ?? frames[0];

  return (
    <div
      ref={containerRef}
      className="pdp-gallery__spin"
      role="img"
      aria-label={`${productName} 360 degree view. Drag to rotate. Frame ${frameIndex + 1} of ${frames.length}.`}
      onPointerDown={(e) => {
        if (reducedMotion) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = {
          active: true,
          startX: e.clientX,
          startIndex: frameIndex,
        };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active || reducedMotion) return;
        setFromDelta(e.clientX - dragRef.current.startX, dragRef.current.startIndex);
      }}
      onPointerUp={() => {
        dragRef.current.active = false;
      }}
      onPointerCancel={() => {
        dragRef.current.active = false;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt=""
        className="pdp-gallery__photo"
        draggable={false}
        decoding="async"
      />
      <p className="pdp-gallery__spin-hint">
        {reducedMotion
          ? "360° frames available — use next/previous controls"
          : "Drag to rotate · 360°"}
      </p>
      {reducedMotion ? (
        <div className="pdp-gallery__spin-controls">
          <button
            type="button"
            className="pdp-gallery__spin-btn"
            onClick={() =>
              setFrameIndex((i) => (i - 1 + frames.length) % frames.length)
            }
            aria-label="Previous 360 frame"
          >
            ‹
          </button>
          <button
            type="button"
            className="pdp-gallery__spin-btn"
            onClick={() => setFrameIndex((i) => (i + 1) % frames.length)}
            aria-label="Next 360 frame"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
