import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_CURRENCIES } from "@/components/layout/currencyLocaleStore";
import {
  EXCHANGE_RATES,
  convertInrToCurrency,
  convertCurrencyToInr,
  getExchangeRate,
} from "@/lib/currency/rates";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amountStr = searchParams.get("amount");
    const to = searchParams.get("to") || searchParams.get("currency");
    const from = (searchParams.get("from") || "INR").toUpperCase();

    if (amountStr) {
      const amount = Number(amountStr);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Invalid amount parameter" }, { status: 400 });
      }

      const targetCurrency = (to || "USD").toUpperCase();

      let inrAmount = amount;
      if (from !== "INR") {
        inrAmount = convertCurrencyToInr(amount, from);
      }

      const convertedAmount = convertInrToCurrency(inrAmount, targetCurrency);
      const rate = getExchangeRate(targetCurrency);

      return NextResponse.json({
        from,
        to: targetCurrency,
        originalAmount: amount,
        inrEquivalent: inrAmount,
        convertedAmount,
        rate,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        baseCurrency: "INR",
        rates: EXCHANGE_RATES,
        currencies: ACTIVE_CURRENCIES,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch currency rates" },
      { status: 500 },
    );
  }
}
