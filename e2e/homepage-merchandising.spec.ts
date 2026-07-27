import { test, expect } from "./fixtures";

interface HomepageProductItem {
  id: string;
  name: string;
  requiresVariantSelection?: boolean;
}

interface HomepageSection {
  key: string;
  items?: HomepageProductItem[];
}

test.describe("homepage merchandising", () => {
  test("carousel cards show Choose options for multi-variant products", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const response = await request.get("/api/homepage");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { sections?: HomepageSection[] };

    const variantItem = body.sections
      ?.flatMap((section) => section.items ?? [])
      .find((item) => item.requiresVariantSelection);

    test.skip(!variantItem, "No multi-variant product on homepage carousel");

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const card = page.locator(
      `.product-suggest__item[data-id="${variantItem!.id}"]`
    );
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(
      card.getByRole("button", { name: /choose options/i })
    ).toBeVisible();
  });

  test("homepage API marks variant products consistently", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const response = await request.get("/api/homepage");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { sections?: HomepageSection[] };

    const items =
      body.sections?.flatMap((section) => section.items ?? []) ?? [];
    test.skip(items.length === 0, "Homepage API returned no product items in sections");

    for (const item of items) {
      expect(typeof item.requiresVariantSelection).toBe("boolean");
    }
  });
});
