"use client";

import { useEffect, useState } from "react";
import { probeGp9GlbAvailable, resolveGp9GlbMode } from "@/gp9/lib/gp9-model";

/** Honest status chip for Sound Lab — procedural vs studio GLB. */
export default function Gp9ModelStatusNote() {
  const mode = resolveGp9GlbMode();
  const [label, setLabel] = useState(
    mode === "off" ? "Procedural showroom" : mode === "on" ? "Studio GLB" : "Checking model…",
  );

  useEffect(() => {
    if (mode === "off") {
      setLabel("Procedural showroom");
      return;
    }
    if (mode === "on") {
      setLabel("Studio GLB");
      return;
    }

    let cancelled = false;
    void probeGp9GlbAvailable().then((ok) => {
      if (cancelled) return;
      setLabel(ok ? "Studio GLB loaded" : "Procedural showroom");
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const isProcedural = label.startsWith("Procedural");

  return (
    <p className="gp9-model-status" role="status">
      3D showroom: <strong>{isProcedural ? "Interactive procedural piano" : label}</strong>
      {isProcedural ? <> — playable keys, finishes, and camera presets in your browser.</> : null}
    </p>
  );
}
