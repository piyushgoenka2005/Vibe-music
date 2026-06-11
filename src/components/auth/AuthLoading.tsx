"use client";

import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-[20rem] w-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}
