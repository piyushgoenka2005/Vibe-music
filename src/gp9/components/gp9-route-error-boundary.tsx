"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { gp9Path } from "@/gp9/lib/base-path";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Keeps /gp9 recoverable when a section (e.g. 3D) throws without blanking the whole app. */
export class Gp9RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[gp9]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="premium-home gp9-page flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Grand Piano</p>
        <h1 className="font-display text-3xl text-foreground">This section had a problem</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Something in the GP-9 experience failed to load. You can retry or return to the shop.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
          <Link
            href={gp9Path()}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground"
            onClick={() => this.setState({ error: null })}
          >
            Reload GP-9
          </Link>
          <Link
            href={ROUTES.home}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
