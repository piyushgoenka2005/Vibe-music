import "server-only";

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
  } catch {
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
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(html: string): Promise<Buffer | null> {
  const playwrightPdf = await renderWithPlaywright(html);
  if (playwrightPdf) return playwrightPdf;
  return renderWithPuppeteer(html);
}
