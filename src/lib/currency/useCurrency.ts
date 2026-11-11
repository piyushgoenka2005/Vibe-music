"use client";

import { useCallback, useEffect } from "react";
import {
  ACTIVE_CURRENCIES,
  ACTIVE_LOCALES,
  useCurrencyLocaleStore,
} from "@/components/layout/currencyLocaleStore";
import {
  convertInrToCurrency,
  convertCurrencyToInr,
  formatPrice,
  formatPricePrecise,
  formatDisplayPriceWithCurrency,
  getCurrencySymbol,
} from "./rates";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/shared/currency";

export function useCurrency() {
  const currency = useCurrencyLocaleStore((s) => s.currency);
  const locale = useCurrencyLocaleStore((s) => s.locale);
  const isInitialized = useCurrencyLocaleStore((s) => s.isInitialized);
  const init = useCurrencyLocaleStore((s) => s.init);
  const setCurrency = useCurrencyLocaleStore((s) => s.setCurrency);
  const setLocale = useCurrencyLocaleStore((s) => s.setLocale);

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
  }, [isInitialized, init]);

  const activeCurrency = ACTIVE_CURRENCIES.find((c) => c.code === currency) ?? ACTIVE_CURRENCIES[0];
  const activeLocale = ACTIVE_LOCALES.find((l) => l.code === locale) ?? ACTIVE_LOCALES[0];
  const isBase = currency === "INR";
  const rate = activeCurrency.rate;
  const symbol = getCurrencySymbol(currency);

  const format = useCallback(
    (inrAmount: number, options?: Intl.NumberFormatOptions) => {
      return formatPrice(inrAmount, currency, locale, options);
    },
    [currency, locale],
  );

  const formatPrecise = useCallback(
    (inrAmount: number) => {
      return formatPricePrecise(inrAmount, currency, locale);
    },
    [currency, locale],
  );

  const formatDisplay = useCallback(
    (price: number, salePrice?: number | null) => {
      return formatDisplayPriceWithCurrency(price, salePrice, currency, locale);
    },
    [currency, locale],
  );

  const convert = useCallback(
    (inrAmount: number) => {
      return convertInrToCurrency(inrAmount, currency);
    },
    [currency],
  );

  const toInr = useCallback(
    (foreignAmount: number) => {
      return convertCurrencyToInr(foreignAmount, currency);
    },
    [currency],
  );

  return {
    currency,
    locale,
    activeCurrency,
    activeLocale,
    isBase,
    rate,
    symbol,
    isInitialized,
    setCurrency,
    setLocale,
    format,
    formatPrecise,
    formatDisplay,
    convert,
    toInr,
    formatInr: formatCurrency,
    formatInrPrecise: formatCurrencyPrecise,
  };
}
