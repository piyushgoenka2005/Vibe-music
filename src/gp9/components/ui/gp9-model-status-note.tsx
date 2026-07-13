"use client";

import { useEffect, useState } from "react";
import {
  GP9_GRAND_GLB_PATH,
  probeGp9GlbAvailable,
  resolveGp9GlbMode,
} from "@/gp9/lib/gp9-model";

/** Honest status chip for Sound Lab — procedural vs studio GLB. */
export default function Gp9ModelStatusNote() {
  const mode = resolveGp9GlbMode();
  const [label, setLabel] = useState(
    mode === "off"
      ? "Procedural showroom"
      : mode === "on"
        ? "Studio GLB"
        : "Checking model…"
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

  return (
    <p className="gp9-model-status" role="status">
      3D model: <strong>{label}</strong>
      {label.startsWith("Procedural") ? (
        <>
          {" "}
          — drop <code>{GP9_GRAND_GLB_PATH}</code> to upgrade (see{" "}
          <code>public/models/README.md</code>).
        </>
      ) : null}
    </p>
  );
}
