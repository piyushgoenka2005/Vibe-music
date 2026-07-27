import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/contact", "/cart", "/login", "/search"];

test.describe("axe accessibility gate", () => {
  test("homepage main landmark has no critical axe violations", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("main, [role='main']").first()).toBeVisible({
      timeout: 20_000,
    });

    const results = await new AxeBuilder({ page })
      .include("main, [role='main']")
      .disableRules(["aria-required-children", "aria-required-parent"])
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      critical.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n")
    ).toEqual([]);
  });

  for (const path of PAGES) {
    test(`${path} has no critical axe violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page.locator("main, [role='main']").first()).toBeVisible({
        timeout: 20_000,
      });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const critical = results.violations.filter((v) => v.impact === "critical");

      expect(
        critical,
        critical
          .map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)
          .join("\n")
      ).toEqual([]);
    });
  }
});
