"use client";

import { useCallback, useEffect } from "react";
import { useCurrencyLocaleStore } from "@/components/layout/currencyLocaleStore";
import { getTranslation, type TranslationKey, type SupportedLocale } from "./translations";

export function useTranslation() {
  const locale = useCurrencyLocaleStore((s) => s.locale);
  const isInitialized = useCurrencyLocaleStore((s) => s.isInitialized);
  const init = useCurrencyLocaleStore((s) => s.init);
  const setLocale = useCurrencyLocaleStore((s) => s.setLocale);

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
  }, [isInitialized, init]);

  const isHindi = locale === "hi-IN";

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      return getTranslation(locale, key, fallback);
    },
    [locale],
  );

  return {
    locale: (locale === "hi-IN" ? "hi-IN" : "en-IN") as SupportedLocale,
    isHindi,
    t,
    setLocale,
  };
}

export { getTranslation };
export type { TranslationKey, SupportedLocale };
