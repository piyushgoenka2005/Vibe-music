/**
 * Browser check of admin real-time behaviour (Playwright Chromium):
 *   1. Products → Categories (client nav) lists every category.
 *   2. A category created in a second admin tab appears in the first tab without reload.
 *   3. An open storefront product page picks up an admin rename on focus.
 *
 * Writes (and cleans up) data, so it refuses non-localhost targets unless ALLOW_REMOTE_WRITES=1.
 * Usage: npm run seed:e2e-admin && npm run verify:admin-live-ui
 */
import { chromium, type Page } from "@playwright/test";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "e2e-admin@vibemusic.test";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "E2eAdminPassword!123456";

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL) && process.env.ALLOW_REMOTE_WRITES !== "1") {
  console.error(`Refusing to write to ${BASE_URL} (set ALLOW_REMOTE_WRITES=1 to override).`);
  process.exit(1);
}

const TAG = `live-${Date.now().toString(36)}`;
const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message.split("\n")[0] : String(error) });
  }
}

async function apiInPage<T>(page: Page, method: string, path: string, body?: unknown): Promise<T> {
  return page.evaluate(
    async ({ method, path, body }) => {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
      return res.json();
    },
    { method, path, body },
  ) as Promise<T>;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];

  const adminA = await context.newPage();
  adminA.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await adminA.goto(`${BASE_URL}/admin/login`);
  const login = await adminA.evaluate(
    async ({ email, password }) =>
      (await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })).status,
    { email: EMAIL, password: PASSWORD },
  );
  if (login !== 200) throw new Error(`login failed: ${login}`);

  let createdCategoryId: string | null = null;

  await check("Products → Categories shows categories", async () => {
    await adminA.goto(`${BASE_URL}/admin/products`);
    await adminA.locator("tbody tr").first().waitFor({ timeout: 60_000 });
    await adminA.getByRole("link", { name: "Categories", exact: true }).first().click();
    await adminA.waitForURL("**/admin/categories");
    const allButton = adminA.getByRole("button", { name: /^All \(\d+\)$/ });
    await allButton.waitFor({ timeout: 30_000 });
    const label = await allButton.textContent();
    const count = Number(label?.match(/\d+/)?.[0] ?? 0);
    if (count === 0) throw new Error(`categories page shows ${label}`);
  });

  await check("category created in another tab appears without reload", async () => {
    const adminB = await context.newPage();
    await adminB.goto(`${BASE_URL}/admin/categories`);
    const created = await apiInPage<{ category: { id: string } }>(adminB, "POST", "/api/admin/categories", {
      name: `Live ${TAG}`,
      slug: `live-${TAG}`,
    });
    createdCategoryId = created.category.id;
    await adminA.getByText(`Live ${TAG}`).waitFor({ timeout: 5_000 });
    await adminB.close();
  });

  await check("open storefront product page updates after admin rename", async () => {
    const list = await apiInPage<{ products: Array<{ id: string }> }>(adminA, "GET", "/api/admin/products?limit=1&status=active");
    const id = list.products[0]!.id;
    const { product } = await apiInPage<{ product: Record<string, unknown> }>(adminA, "GET", `/api/admin/products/${id}`);
    const storefront = await context.newPage();
    storefront.on("pageerror", (e) => errors.push(`storefront pageerror: ${e.message}`));
    await storefront.goto(`${BASE_URL}/product/${String(product.slug)}`);
    // Storefront polls in the background, so "networkidle" never settles: wait for the
    // first /api/storefront/version response (the baseline the live refresher compares to).
    await storefront.waitForResponse((res) => res.url().includes("/api/storefront/version"), {
      timeout: 60_000,
    });
    try {
      await apiInPage(adminA, "PUT", `/api/admin/products/${id}`, { ...product, name: `${String(product.name)} ${TAG}` });
      await storefront.waitForTimeout(1_000);
      await storefront.evaluate(() => window.dispatchEvent(new Event("focus")));
      await storefront.getByText(TAG).first().waitFor({ timeout: 15_000 });
    } finally {
      await apiInPage(adminA, "PUT", `/api/admin/products/${id}`, product);
      await storefront.close();
    }
  });

  if (createdCategoryId) {
    await apiInPage(adminA, "DELETE", `/api/admin/categories/${createdCategoryId}`).catch(() => undefined);
  }
  await browser.close();

  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  if (errors.length) console.log(`\nBrowser errors:\n  ${errors.slice(0, 10).join("\n  ")}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${failed ? "FAIL" : "PASS"}: ${results.length - failed}/${results.length} live UI checks`);
  process.exit(failed ? 1 : 0);
}

void main();
