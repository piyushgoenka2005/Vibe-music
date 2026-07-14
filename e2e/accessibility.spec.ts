import { test, expect } from "./fixtures";
import { fetchTrendingProduct, seedGuestCart } from "./helpers/test-utils";

const PAGES: Array<{
  path: string;
  name: string;
  heading?: string | RegExp;
}> = [
  { path: "/", name: "Home" },
  { path: "/search", name: "Search" },
  { path: "/cart", name: "Cart", heading: "Cart" },
  { path: "/compare", name: "Compare" },
  { path: "/contact", name: "Contact" },
  { path: "/login", name: "Login", heading: /Log In/i },
];

test.describe("accessibility basics", () => {
  for (const { path, name, heading } of PAGES) {
    test(`${name} has main landmark and h1`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page.locator("main, [role='main']").first()).toBeVisible({
        timeout: 15_000,
      });
      const h1 = heading
        ? page.getByRole("heading", { level: 1, name: heading })
        : page.getByRole("heading", { level: 1 }).first();
      await expect(h1).toBeVisible({ timeout: 25_000 });
    });
  }

  test("checkout form fields have labels", async ({ page, request }) => {
    const product = await fetchTrendingProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    const form = page.locator(".checkout-form");
    await expect(form.getByLabel("Full Name")).toBeVisible({ timeout: 20_000 });
    await expect(form.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
    await expect(form.getByLabel("Phone")).toBeVisible();
  });

  test("mobile homepage has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("mobile checkout and cart have no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/cart", "/checkout", "/search"]) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });

  test("narrow phone homepage and search have no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/", "/search"]) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });

  test("mobile search trending pills meet 44px tap target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const pill = page.locator(".sw-search-landing-bar__trending-pill").first();
    await expect(pill).toBeVisible({ timeout: 20_000 });
    const box = await pill.boundingBox();
    expect(box, "trending pill should render").toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("product sticky bar CTAs meet mobile tap targets", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = page.locator(".pdp-mobile-bar");
    await expect(bar).toBeVisible({ timeout: 15_000 });
    const ctas = bar.locator(".pdp-mobile-bar__cta");
    await expect(ctas.first()).toBeVisible({ timeout: 10_000 });
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await ctas.nth(i).boundingBox();
      expect(box, `cta ${i} should render`).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    const notify = bar.locator(".pdp-mobile-bar__cta--notify");
    if ((await notify.count()) > 0) {
      const barBox = await bar.boundingBox();
      const ctaBox = await notify.boundingBox();
      expect(barBox && ctaBox).toBeTruthy();
      expect(ctaBox!.width).toBeGreaterThan(barBox!.width * 0.7);
    }
  });
});
