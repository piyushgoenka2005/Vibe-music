"use client";

import Link from "next/link";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";

export function MobileFixedFooter() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="#dealers"
        className="group flex w-full items-center justify-between rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        <span>Enquire about GP-9</span>
        <NavArrowIcon
          size="sm"
          className="border-white/20 bg-white/10 text-background group-hover:bg-background group-hover:text-foreground"
        />
      </Link>
    </div>
  );
}
