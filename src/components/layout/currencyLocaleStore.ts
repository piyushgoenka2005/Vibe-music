import { create } from "zustand";

export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  flag: string;
}

export interface LocaleItem {
  code: string;
  name: string;
  nativeName: string;
  shortLabel: string;
  flag: string;
}

export const ACTIVE_CURRENCIES: CurrencyItem[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 1.0, flag: "🇮🇳" },
  { code: "USD", name: "US Dollar", symbol: "$", rate: 0.012, flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.011, flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", rate: 0.0095, flag: "🇬🇧" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 0.044, flag: "🇦🇪" },
];

export const ACTIVE_LOCALES: LocaleItem[] = [
  { code: "en-IN", name: "English (India)", nativeName: "English", shortLabel: "EN", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", shortLabel: "हि", flag: "🇮🇳" },
];

const CURRENCY_STORAGE_KEY = "vibe_currency";
const LOCALE_STORAGE_KEY = "vibe_locale";

function getInitialCurrency(): string {
  if (typeof window === "undefined") return "INR";
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && ACTIVE_CURRENCIES.some((c) => c.code === saved)) return saved;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)vibe_currency=([^;]+)/);
    if (cookieMatch && ACTIVE_CURRENCIES.some((c) => c.code === cookieMatch[1])) {
      return cookieMatch[1];
    }
  } catch {
    // Ignore storage errors
  }
  return "INR";
}

function getInitialLocale(): string {
  if (typeof window === "undefined") return "en-IN";
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && ACTIVE_LOCALES.some((l) => l.code === saved)) return saved;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)vibe_locale=([^;]+)/);
    if (cookieMatch && ACTIVE_LOCALES.some((l) => l.code === cookieMatch[1])) {
      return cookieMatch[1];
    }
  } catch {
    // Ignore storage errors
  }
  return "en-IN";
}

interface CurrencyLocaleState {
  currency: string;
  locale: string;
  isInitialized: boolean;
  init: () => void;
  setCurrency: (code: string) => void;
  setLocale: (code: string) => void;
}

export const useCurrencyLocaleStore = create<CurrencyLocaleState>((set) => ({
  currency: "INR",
  locale: "en-IN",
  isInitialized: false,
  init: () => {
    const currency = getInitialCurrency();
    const locale = getInitialLocale();
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = locale;
    }
    set({ currency, locale, isInitialized: true });
  },
  setCurrency: (code: string) => {
    const normalized = code.toUpperCase();
    if (!ACTIVE_CURRENCIES.some((c) => c.code === normalized)) return;
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
      document.cookie = `vibe_currency=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(
        new CustomEvent("vibe:currency-change", { detail: { currency: normalized } }),
      );
    } catch {
      // Ignore storage errors
    }
    set({ currency: normalized });
  },
  setLocale: (code: string) => {
    if (!ACTIVE_LOCALES.some((l) => l.code === code)) return;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      document.cookie = `vibe_locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.lang = code;
      }
      window.dispatchEvent(new CustomEvent("vibe:locale-change", { detail: { locale: code } }));
    } catch {
      // Ignore storage errors
    }
    set({ locale: code });
  },
}));
