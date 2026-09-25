"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionName: string;
}

interface State {
  hasError: boolean;
}

export default class HomeSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[homepage:${this.props.sectionName}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          className="homepage-section-fallback"
          aria-label={`${this.props.sectionName} unavailable`}
        >
          <p className="homepage-section-fallback__text">
            This section is temporarily unavailable. The rest of the store is still open.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}
