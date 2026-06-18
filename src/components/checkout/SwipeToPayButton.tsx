"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Lock } from "lucide-react";

interface SwipeToPayButtonProps {
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  preparing?: boolean;
  label?: string;
}

const HANDLE_INSET = 4;
const COMPLETE_RATIO = 0.88;

export default function SwipeToPayButton({
  onConfirm,
  disabled = false,
  loading = false,
  preparing = false,
  label = "Swipe to pay securely",
}: SwipeToPayButtonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);
  const maxDragRef = useRef(0);
  const [maxDrag, setMaxDrag] = useState(0);
  const startXRef = useRef(0);
  const confirmedRef = useRef(false);
  const wasLoadingRef = useRef(false);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isLocked = disabled || loading || preparing;

  const measureMaxDrag = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const handleWidth = 46;
    return Math.max(track.offsetWidth - handleWidth - HANDLE_INSET * 2, 0);
  }, []);

  const setDragPosition = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), maxDragRef.current);
    dragXRef.current = clamped;
    setDragX(clamped);
  }, []);

  const resetSlider = useCallback(() => {
    draggingRef.current = false;
    confirmedRef.current = false;
    dragXRef.current = 0;
    setDragging(false);
    setConfirmed(false);
    setDragX(0);
  }, []);

  useEffect(() => {
    const syncMax = () => {
      const nextMax = measureMaxDrag();
      maxDragRef.current = nextMax;
      setMaxDrag(nextMax);
      if (confirmedRef.current) {
        setDragPosition(nextMax);
      }
    };

    syncMax();
    window.addEventListener("resize", syncMax);
    return () => window.removeEventListener("resize", syncMax);
  }, [measureMaxDrag, setDragPosition]);

  useEffect(() => {
    if (loading) {
      wasLoadingRef.current = true;
      return;
    }

    if (wasLoadingRef.current && confirmedRef.current) {
      wasLoadingRef.current = false;
      const timer = window.setTimeout(resetSlider, 500);
      return () => window.clearTimeout(timer);
    }
  }, [loading, resetSlider]);

  const finishSwipe = useCallback(async () => {
    if (confirmedRef.current || isLocked) return;

    confirmedRef.current = true;
    setConfirmed(true);
    setDragPosition(maxDragRef.current);

    try {
      await onConfirm();
    } catch {
      resetSlider();
    }
  }, [isLocked, onConfirm, resetSlider, setDragPosition]);

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setDragging(false);

    const current = dragXRef.current;
    if (current >= maxDragRef.current * COMPLETE_RATIO) {
      void finishSwipe();
      return;
    }

    resetSlider();
  }, [finishSwipe, resetSlider]);

  const onPointerMove = useCallback(
    (clientX: number) => {
      if (!draggingRef.current || isLocked || confirmedRef.current) return;
      setDragPosition(clientX - startXRef.current);
    },
    [isLocked, setDragPosition]
  );

  const onPointerDown = useCallback(
    (clientX: number) => {
      if (isLocked || confirmedRef.current) return;

      maxDragRef.current = measureMaxDrag();
      startXRef.current = clientX - dragXRef.current;
      draggingRef.current = true;
      setDragging(true);
    },
    [isLocked, measureMaxDrag]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => onPointerMove(event.clientX);
    const handleUp = () => endDrag();

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, endDrag, onPointerMove]);

  const progress =
    maxDrag > 0 ? dragX / maxDrag : confirmed ? 1 : 0;

  const displayLabel = loading
    ? "Opening Razorpay…"
    : preparing
      ? "Preparing secure checkout…"
      : confirmed
        ? "Confirming payment…"
        : label;

  return (
    <div className="checkout-swipe">
      <div
        ref={trackRef}
        className={`checkout-swipe__track${
          isLocked ? " checkout-swipe__track--disabled" : ""
        }${confirmed ? " checkout-swipe__track--confirmed" : ""}`}
        style={{ "--swipe-progress": progress } as CSSProperties}
      >
        <div
          className="checkout-swipe__fill"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
          aria-hidden
        />
        <span
          className="checkout-swipe__label"
          style={{ opacity: 1 - progress * 0.9 }}
        >
          {displayLabel}
        </span>
        <button
          type="button"
          className="checkout-swipe__handle"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)",
          }}
          onPointerDown={(event) => {
            if (isLocked || confirmedRef.current) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            onPointerDown(event.clientX);
          }}
          disabled={isLocked || confirmed}
          aria-label={displayLabel}
        >
          <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      <p className="checkout-swipe__hint">
        <Lock size={12} aria-hidden />
        {loading
          ? "Redirecting to Razorpay secure gateway"
          : "Drag the handle → to confirm payment"}
      </p>
    </div>
  );
}
