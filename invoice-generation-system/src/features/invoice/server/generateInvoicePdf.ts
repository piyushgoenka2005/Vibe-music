import "server-only";

type PdfEngine = "playwright" | "puppeteer";

export type GenerateInvoicePdfResult =
  | { ok: true; buffer: Buffer; engine: PdfEngine }
  | { ok: false; reason: string };

async function renderWithPlaywright(html: string): Promise<Buffer | null> {
  try {
    const playwrightName = "playwright";
    const { chromium } = (0, eval)(`require("${playwrightName}")`) as {
      chromium: {
        launch: (options?: { headless?: boolean }) => Promise<{
          newPage: () => Promise<{
            setContent: (
              content: string,
              options?: { waitUntil?: string }
            ) => Promise<void>;
            pdf: (options?: {
              format?: string;
              printBackground?: boolean;
            }) => Promise<Buffer>;
          }>;
          close: () => Promise<void>;
        }>;
      };
    };

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      return await page.pdf({ format: "A4", printBackground: true });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.warn(
      "[invoice-pdf] Playwright unavailable:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function renderWithPuppeteer(html: string): Promise<Buffer | null> {
  try {
    const puppeteerName = "puppeteer";
    const puppeteer = (0, eval)(`require("${puppeteerName}")`) as {
      launch: (options: { args: string[]; headless?: boolean }) => Promise<{
        newPage: () => Promise<{
          setContent: (
            content: string,
            options: { waitUntil: string }
          ) => Promise<void>;
          pdf: (options: {
            format: string;
            printBackground: boolean;
          }) => Promise<Buffer>;
        }>;
        close: () => Promise<void>;
      }>;
    };

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      return await page.pdf({ format: "A4", printBackground: true });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.warn(
      "[invoice-pdf] Puppeteer unavailable:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Prefer Playwright, then Puppeteer. Both are optional peer deps on the VPS. */
export async function generateInvoicePdfResult(
  html: string
): Promise<GenerateInvoicePdfResult> {
  const playwrightPdf = await renderWithPlaywright(html);
  if (playwrightPdf) {
    return { ok: true, buffer: playwrightPdf, engine: "playwright" };
  }

  const puppeteerPdf = await renderWithPuppeteer(html);
  if (puppeteerPdf) {
    return { ok: true, buffer: puppeteerPdf, engine: "puppeteer" };
  }

  return {
    ok: false,
    reason:
      "No PDF engine available. Install Playwright (`npx playwright install chromium`) or Puppeteer on the server, then set INVOICE_PDF_ENABLED=true.",
  };
}

/** @deprecated Prefer generateInvoicePdfResult for diagnostics. */
export async function generateInvoicePdf(html: string): Promise<Buffer | null> {
  const result = await generateInvoicePdfResult(html);
  return result.ok ? result.buffer : null;
}
