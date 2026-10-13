"use client";

import { useCallback } from "react";
import PageLoadSplash, { isPageLoadSplashEnabled } from "@/components/layout/PageLoadSplash";
import { splashScrollOnComplete } from "@/lib/splash/splashScrollOnComplete";

/** Layout-root splash — runs before AppProviders so the sequence cannot get stuck on the SSR boot overlay. */
export default function StorefrontSplashRoot() {
  const onComplete = useCallback(() => {
    splashScrollOnComplete();
  }, []);

  if (!isPageLoadSplashEnabled()) return null;

  return <PageLoadSplash onComplete={onComplete} />;
}
