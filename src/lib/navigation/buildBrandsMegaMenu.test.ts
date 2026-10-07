import { describe, expect, it } from "vitest";
import {
  BRANDS_MEGA_MENU_SLUG,
  buildBrandsMegaMenu,
  resolveBrandsMegaMenu,
} from "@/lib/navigation/buildBrandsMegaMenu";
import { ROUTES } from "@/lib/routes";

describe("buildBrandsMegaMenu", () => {
  it("returns null when no brands", () => {
    expect(buildBrandsMegaMenu([])).toBeNull();
  });

  it("groups brands into letter columns with shop-all link", () => {
    const menu = buildBrandsMegaMenu([
      { id: "1", name: "Roland", slug: "roland", productCount: 5 },
      { id: "2", name: "Zoom", slug: "zoom", productCount: 3 },
      { id: "3", name: "Hertz", slug: "hertz", productCount: 2 },
    ]);

    expect(menu?.slug).toBe(BRANDS_MEGA_MENU_SLUG);
    expect(menu?.href).toBe(ROUTES.brands);
    expect(
      menu?.columns.some((column) => column.links.some((link) => link.label === "Roland")),
    ).toBe(true);
    expect(
      menu?.columns.some((column) => column.links.some((link) => link.label === "Shop all brands")),
    ).toBe(true);
  });

  it("resolveBrandsMegaMenu falls back to catalog brands", () => {
    const menu = resolveBrandsMegaMenu(null);
    expect(menu?.slug).toBe(BRANDS_MEGA_MENU_SLUG);
    expect(menu?.columns.length).toBeGreaterThan(0);
  });

  it("includes featured cards for brands with logos", () => {
    const menu = buildBrandsMegaMenu([
      { id: "1", name: "Roland", slug: "roland", productCount: 5 },
      { id: "2", name: "Zoom", slug: "zoom", productCount: 3 },
    ]);

    expect(menu?.featured.length).toBeGreaterThan(0);
    expect(menu?.featured[0]?.href).toContain("/brands/");
  });
});
