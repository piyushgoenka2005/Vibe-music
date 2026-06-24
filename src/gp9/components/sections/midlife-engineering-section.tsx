"use client";

import dynamic from "next/dynamic";
import { MidlifeParallaxStage } from "@/gp9/components/midlife/midlife-parallax-stage";

const MidlifePanel = dynamic(() => import("@/gp9/components/midlife/midlife-panel").then((m) => m.MidlifePanel), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-[580px] w-full max-w-[1080px] items-center justify-center rounded-[14px] bg-[#101010]">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Loading sound lab…</p>
    </div>
  ),
});

const Gp9InstrumentPanel = dynamic(
  () => import("@/gp9/components/gp9").then((m) => m.Gp9InstrumentPanel),
  {
    ssr: false,
    loading: () => (
      <div className="gp9-instrument">
        <p className="text-center text-sm text-muted-foreground">Loading Grand Piano 9…</p>
      </div>
    ),
  }
);

export function MidlifeEngineeringSection() {
  return (
    <section id="midlife" className="relative scroll-mt-24 overflow-x-clip bg-[#ececec]">
      <MidlifeParallaxStage>
        <MidlifePanel />
      </MidlifeParallaxStage>

      <Gp9InstrumentPanel />
    </section>
  );
}
