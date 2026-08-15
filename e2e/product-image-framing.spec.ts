import { test, expect } from "./fixtures";

test.describe("product image framing", () => {
  test("homepage carousel product images have no resting scale above 1", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const photo = page.locator(".premium-product-carousel .product-suggest__item-photo").first();
    const count = await photo.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await expect(photo).toBeVisible({ timeout: 15_000 });
    const transform = await photo.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === "none" || transform.includes("matrix")).toBe(true);
    if (transform !== "none") {
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      if (matrix) {
        const parts = matrix[1]!.split(",").map((v) => Number.parseFloat(v.trim()));
        const scaleX = parts[0] ?? 1;
        const scaleY = parts[3] ?? 1;
        expect(scaleX).toBeLessThanOrEqual(1.01);
        expect(scaleY).toBeLessThanOrEqual(1.01);
      }
    }
  });
});
