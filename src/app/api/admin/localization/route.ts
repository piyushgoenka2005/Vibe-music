import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  isActive: boolean;
  symbolPosition: "prefix" | "suffix";
  decimalPlaces: number;
}

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  direction: "ltr" | "rtl";
  translationCoverage: number;
}

export interface RegionalPreferences {
  timezone: string;
  dateFormat: string;
  numberFormat: "indian" | "international";
  fiscalYearStart: string;
  gstEnabled: boolean;
  fulfillmentStateCode: string;
  fulfillmentStateName: string;
}

let currenciesState: CurrencyConfig[] = [
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    exchangeRate: 1.0,
    isBase: true,
    isActive: true,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 0.012,
    isBase: false,
    isActive: true,
    symbolPosition: "prefix",
    decimalPlaces: 2,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchangeRate: 0.011,
    isBase: false,
    isActive: true,
    symbolPosition: "prefix",
    decimalPlaces: 2,
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    exchangeRate: 0.0095,
    isBase: false,
    isActive: true,
    symbolPosition: "prefix",
    decimalPlaces: 2,
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    exchangeRate: 0.044,
    isBase: false,
    isActive: true,
    symbolPosition: "prefix",
    decimalPlaces: 2,
  },
];

let localesState: LocaleConfig[] = [
  {
    code: "en-IN",
    name: "English (India)",
    nativeName: "English",
    isDefault: true,
    isActive: true,
    direction: "ltr",
    translationCoverage: 100,
  },
  {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 95,
  },
  {
    code: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 88,
  },
  {
    code: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 85,
  },
  {
    code: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 82,
  },
  {
    code: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 86,
  },
  {
    code: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    isDefault: false,
    isActive: true,
    direction: "ltr",
    translationCoverage: 80,
  },
];

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

let regionalPreferencesState: RegionalPreferences = {
  timezone: "Asia/Kolkata (IST, UTC+05:30)",
  dateFormat: "DD/MM/YYYY",
  numberFormat: "indian",
  fiscalYearStart: "01-04",
  gstEnabled: true,
  fulfillmentStateCode: "19",
  fulfillmentStateName: "West Bengal",
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("settings:read", request);

    let currencies = currenciesState;
    let locales = localesState;
    let preferences = regionalPreferencesState;

    if (isPostgresConfigured()) {
      try {
        const record = await prisma.localizationSetting.findUnique({
          where: { id: "default" },
        });

        if (record) {
          if (Array.isArray(record.currencies) && record.currencies.length > 0) {
            currencies = record.currencies as unknown as CurrencyConfig[];
            currenciesState = currencies;
          }
          if (Array.isArray(record.locales) && record.locales.length > 0) {
            locales = record.locales as unknown as LocaleConfig[];
            localesState = locales;
          }
          if (record.preferences && typeof record.preferences === "object") {
            preferences = {
              ...regionalPreferencesState,
              ...(record.preferences as unknown as Partial<RegionalPreferences>),
            };
            regionalPreferencesState = preferences;
          }
        } else {
          await prisma.localizationSetting.create({
            data: {
              id: "default",
              currencies: currenciesState as unknown as Prisma.InputJsonValue,
              locales: localesState as unknown as Prisma.InputJsonValue,
              preferences: regionalPreferencesState as unknown as Prisma.InputJsonValue,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      } catch {
        // Safe fallback to in-memory defaults
      }
    }

    return NextResponse.json({
      currencies,
      locales,
      preferences,
      stats: {
        baseCurrency: "INR (₹)",
        totalCurrencies: currencies.length,
        activeLocales: locales.filter((l) => l.isActive).length,
        timezone: "Asia/Kolkata (IST)",
        gstMode: "Dynamic Intra/Inter-state",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load localization settings";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();

    if (Array.isArray(body.currencies)) {
      currenciesState = body.currencies;
    }

    if (Array.isArray(body.locales)) {
      localesState = body.locales;
    }

    if (body.preferences && typeof body.preferences === "object") {
      regionalPreferencesState = {
        ...regionalPreferencesState,
        ...body.preferences,
      };
    }

    if (isPostgresConfigured()) {
      try {
        await prisma.localizationSetting.upsert({
          where: { id: "default" },
          create: {
            id: "default",
            currencies: currenciesState as unknown as Prisma.InputJsonValue,
            locales: localesState as unknown as Prisma.InputJsonValue,
            preferences: regionalPreferencesState as unknown as Prisma.InputJsonValue,
            updatedAt: new Date().toISOString(),
          },
          update: {
            currencies: currenciesState as unknown as Prisma.InputJsonValue,
            locales: localesState as unknown as Prisma.InputJsonValue,
            preferences: regionalPreferencesState as unknown as Prisma.InputJsonValue,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch {
        // Non-blocking fallback to in-memory state
      }
    }

    return NextResponse.json({
      success: true,
      currencies: currenciesState,
      locales: localesState,
      preferences: regionalPreferencesState,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update localization settings";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
