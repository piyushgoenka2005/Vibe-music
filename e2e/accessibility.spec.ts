import { test, expect } from "./fixtures";
import { fetchTrendingProduct, gotoStorefront, seedGuestCart } from "./helpers/test-utils";

const PAGES: Array<{
  path: string;
  name: string;
  heading?: string | RegExp;
}> = [
  { path: "/", name: "Home" },
  { path: "/search", name: "Search" },
  { path: "/cart", name: "Cart", heading: /Shopping Cart/i },
  { path: "/compare", name: "Compare" },
  { path: "/contact", name: "Contact" },
  { path: "/login", name: "Login", heading: /Log In/i },
];

test.describe("accessibility basics", () => {
  test("skip to content link targets main landmark", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const skip = page.locator(".skip-to-content");
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(page.locator("#main-content")).toHaveCount(1);
  });

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

  test("checkout form fields have labels", async ({ page, request, requiresDatabase }) => {
    void requiresDatabase;
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
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test("mobile checkout and cart have no horizontal overflow", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/cart", "/checkout", "/search"]) {
      await gotoStorefront(page, path, { timeout: 30_000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(2);
    }
  });

  test("narrow phone homepage and search have no horizontal overflow", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/", "/search"]) {
      await gotoStorefront(page, path, { timeout: 30_000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(2);
    }
  });

  test("compact phone storefront has no horizontal overflow", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 568 });
    const product = await fetchTrendingProduct(request);
    const paths = ["/", "/cart", "/checkout", "/category/guitars", `/product/${product.slug}`];
    for (const path of paths) {
      await gotoStorefront(page, path, { timeout: 30_000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(2);
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

  test("product buy box CTAs meet mobile tap targets", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    await page.setViewportSize({ width: 390, height: 844 });
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const ctas = page.locator(".pdp-buybox__btn");
    await expect(ctas.first()).toBeAttached({ timeout: 15_000 });
    const heights = await ctas.evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().height),
    );
    expect(heights.length).toBeGreaterThan(0);
    for (const [i, height] of heights.entries()) {
      expect(height, `cta ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
