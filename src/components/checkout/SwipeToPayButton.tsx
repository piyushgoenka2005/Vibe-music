"use client";

/**
 * Checkout swipe-to-pay — 21st slide button + liquid glass surface
 * @see https://21st.dev/community/components/reuno-ui/slide-button
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { GlassSurface } from "@/components/ui/liquid-glass";

interface SwipeToPayButtonProps {
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  preparing?: boolean;
  label?: string;
}

const HANDLE_INSET = 5;
const HANDLE_SIZE = 54;
const DRAG_THRESHOLD = 0.88;

const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 44,
  mass: 0.75,
};

export default function SwipeToPayButton({
  onConfirm,
  disabled = false,
  loading = false,
  preparing = false,
  label = "Swipe to Pay",
}: SwipeToPayButtonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [maxDrag, setMaxDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const wasLoadingRef = useRef(false);
  const maxDragRef = useRef(0);
  const metricsRef = useRef({
    inset: HANDLE_INSET,
    handleSize: HANDLE_SIZE,
    maxDrag: 0,
  });

  const isLocked = disabled || loading || preparing;

  const dragX = useMotionValue(0);
  const fillWidth = useTransform(dragX, (x) => {
    const { inset, handleSize, maxDrag: max } = metricsRef.current;
    const clamped = max > 0 ? Math.min(Math.max(0, x), max) : 0;
    const trailEnd = clamped + handleSize + inset;
    const maxTrail = max + handleSize + inset;
    return `${Math.min(trailEnd, maxTrail || trailEnd)}px`;
  });
  const labelOpacity = useTransform(dragX, (x) => {
    const max = maxDragRef.current;
    if (max <= 0) return 1;
    const progress = Math.min(Math.max(0, x), max) / max;
    return 1 - progress * 0.88;
  });

  useMotionValueEvent(dragX, "change", (latest) => {
    setIsSwiping(latest > 4);
  });

  const isActive = isDragging || isSwiping || completed;

  const measureMaxDrag = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const styles = getComputedStyle(track);
    const inset = Number.parseFloat(styles.getPropertyValue("--swipe-handle-inset")) || HANDLE_INSET;
    const handleSize =
      Number.parseFloat(styles.getPropertyValue("--swipe-handle-size")) || HANDLE_SIZE;
    const next = Math.max(track.clientWidth - handleSize - inset * 2, 0);
    metricsRef.current = { inset, handleSize, maxDrag: next };
    maxDragRef.current = next;
    return next;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sync = () => {
      const next = measureMaxDrag();
      setMaxDrag(next);
      if (completed) {
        dragX.set(next);
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [completed, dragX, measureMaxDrag]);

  useEffect(() => {
    if (loading) {
      wasLoadingRef.current = true;
      return;
    }

    if (wasLoadingRef.current && completed) {
      wasLoadingRef.current = false;
      const timer = window.setTimeout(() => {
        setCompleted(false);
        setIsSwiping(false);
        dragX.set(0);
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [completed, dragX, loading]);

  const finishSwipe = useCallback(async () => {
    if (completed || isLocked) return;

    setCompleted(true);
    const endX = measureMaxDrag();
    dragX.set(endX);

    try {
      await onConfirm();
    } catch {
      setCompleted(false);
      setIsSwiping(false);
      dragX.set(0);
    }
  }, [completed, dragX, isLocked, measureMaxDrag, onConfirm]);

  const handleDragStart = useCallback(() => {
    if (isLocked || completed) return;
    setIsDragging(true);
  }, [completed, isLocked]);

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isLocked || completed) return;
      const right = measureMaxDrag();
      dragX.set(Math.max(0, Math.min(info.offset.x, right)));
    },
    [completed, dragX, isLocked, measureMaxDrag]
  );

  const handleDragEnd = useCallback(() => {
    if (completed) return;
    setIsDragging(false);

    const right = measureMaxDrag();
    const progress = right > 0 ? dragX.get() / right : 0;

    if (progress >= DRAG_THRESHOLD) {
      void finishSwipe();
      return;
    }

    void animate(dragX, 0, SPRING);
  }, [completed, dragX, finishSwipe, measureMaxDrag]);

  const displayLabel = loading
    ? "Opening Razorpay…"
    : preparing
      ? "Preparing secure checkout…"
      : completed
        ? "Confirming payment…"
        : label;

  const isProcessing = loading || preparing;
  const showDeepBlue = completed || isProcessing;

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (isLocked || completed) return;
      dragControls.start(event);
    },
    [completed, dragControls, isLocked]
  );

  const showIdleMotion =
    !disabled && !showDeepBlue && !isDragging && dragX.get() < 4;

  return (
    <div className="checkout-swipe">
      <motion.div
        ref={trackRef}
        className={[
          "checkout-swipe__track",
          disabled && !isProcessing && "checkout-swipe__track--disabled",
          showDeepBlue && "checkout-swipe__track--confirmed",
          isProcessing && "checkout-swipe__track--processing",
          isActive && "checkout-swipe__track--swiping",
          isDragging && "checkout-swipe__track--dragging",
          showIdleMotion && "checkout-swipe__track--idle",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {!isActive && !showDeepBlue && (
          <GlassSurface tint="rgba(244, 247, 254, 0.45)" />
        )}
        <AnimatePresence initial={false}>
          {!showDeepBlue ? (
            <motion.div
              key="fill"
              className="checkout-swipe__fill"
              style={{ width: fillWidth }}
              aria-hidden
              exit={{ opacity: 0 }}
            >
              <div className="checkout-swipe__liquid" aria-hidden />
            </motion.div>
          ) : (
            <motion.div
              key="fill-complete"
              className="checkout-swipe__fill checkout-swipe__fill--complete"
              initial={false}
              animate={{ width: "100%" }}
              transition={SPRING}
              aria-hidden
            >
              <div className="checkout-swipe__liquid" aria-hidden />
            </motion.div>
          )}
        </AnimatePresence>
        {!isActive && !showDeepBlue && (
          <div className="checkout-swipe__specular" aria-hidden />
        )}

        <AnimatePresence mode="wait">
          {!showDeepBlue ? (
            <motion.span
              key="label"
              className={[
                "checkout-swipe__label",
                isActive && "checkout-swipe__label--swiping",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ opacity: isActive ? 1 : labelOpacity }}
              exit={{ opacity: 0 }}
            >
              {displayLabel}
            </motion.span>
          ) : (
            <motion.span
              key="label-done"
              className="checkout-swipe__label checkout-swipe__label--done"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
            >
              {displayLabel}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!showDeepBlue ? (
            <motion.div
              key="handle"
              className="checkout-swipe__handle-slot"
              drag={isLocked ? false : "x"}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ left: 0, right: maxDrag }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{ x: dragX }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={SPRING}
            >
              <button
                type="button"
                className={[
                  "checkout-swipe__handle",
                  isDragging && "checkout-swipe__handle--dragging",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={isLocked}
                aria-label={displayLabel}
                onPointerDown={handlePointerDown}
              >
                <span className="checkout-swipe__handle-ring" aria-hidden />
                <span className="checkout-swipe__handle-core">
                  <ArrowRight size={22} strokeWidth={2.5} aria-hidden />
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="status"
              className="checkout-swipe__handle-slot"
              style={{ x: dragX }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING}
            >
              <span className="checkout-swipe__handle checkout-swipe__handle--status">
                <span className="checkout-swipe__handle-ring" aria-hidden />
                <span className="checkout-swipe__handle-core">
                  {loading || preparing ? (
                    <Loader2
                      size={22}
                      strokeWidth={2.5}
                      className="checkout-swipe__spin"
                      aria-hidden
                    />
                  ) : (
                    <Check size={22} strokeWidth={2.75} aria-hidden />
                  )}
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="checkout-swipe__hint">
        <ShieldCheck size={13} strokeWidth={2.25} aria-hidden />
        {loading
          ? "Redirecting to Razorpay secure gateway"
          : "Slide right to confirm your payment"}
      </p>
    </div>
  );
}
