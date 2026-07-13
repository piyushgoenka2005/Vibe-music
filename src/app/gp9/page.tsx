"use client";

import { Gp9RouteErrorBoundary } from "@/gp9/components/gp9-route-error-boundary";
import Gp9HomePage from "@/gp9/Gp9HomePage";

export default function Gp9Page() {
  return (
    <Gp9RouteErrorBoundary>
      <Gp9HomePage />
    </Gp9RouteErrorBoundary>
  );
}
