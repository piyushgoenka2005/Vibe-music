import { describe, it, expect } from "vitest";
import { HEADER_MEGA_MENUS, MEGA_MENU_BY_SLUG, subCategoryPath } from "@/data/headerMegaMenu";
import { resolveBrandsMegaMenu, BRANDS_MEGA_MENU_SLUG } from "@/lib/navigation/buildBrandsMegaMenu";
import { isHeaderNavItemActive } from "@/lib/navigation/headerNavActive";
import { ROUTES } from "@/lib/routes";

describe("Tier 1: Storefront Navigation & Mega Menus", () => {
  it("provides comprehensive category mega menus with valid links and columns", () => {
    expect(HEADER_MEGA_MENUS.length).toBeGreaterThan(0);

    for (const menu of HEADER_MEGA_MENUS) {
      expect(menu.name).toBeTruthy();
      expect(menu.slug).toBeTruthy();
      expect(menu.href).toMatch(/^\/category\//);
      expect(menu.columns.length).toBeGreaterThan(0);

      // Verify each column has a heading and valid links
      for (const col of menu.columns) {
        expect(col.heading).toBeTruthy();
        expect(col.links.length).toBeGreaterThan(0);
        for (const link of col.links) {
          expect(link.label).toBeTruthy();
          expect(link.href).toBeTruthy();
        }
      }

      // Verify featured cards if present
      for (const feat of menu.featured) {
        expect(feat.title).toBeTruthy();
        expect(feat.href).toBeTruthy();
        expect(feat.image).toBeTruthy();
      }
    }
  });

  it("subCategoryPath routes correctly to category listing with subcat query parameter", () => {
    const electricPath = subCategoryPath("guitars", "Solid Body");
    expect(electricPath).toBe("/category/guitars?subcat=solid-body");

    const acousticPath = subCategoryPath("guitars", "Acoustic-Electric Guitars");
    expect(acousticPath).toContain("/category/guitars?subcat=");
    expect(acousticPath).toContain("acoustic-electric");
  });

  it("resolves brands mega menu dynamically with top brands and A-Z directory link", () => {
    const brandsMenu = resolveBrandsMegaMenu();
    expect(brandsMenu.slug).toBe(BRANDS_MEGA_MENU_SLUG);
    expect(brandsMenu.name).toBe("Brands");
    expect(brandsMenu.href).toBe(ROUTES.brands);
    expect(brandsMenu.columns.length).toBeGreaterThan(0);

    const firstCol = brandsMenu.columns[0];
    expect(firstCol.links.length).toBeGreaterThan(0);
    // Should have links to /brands/...
    expect(firstCol.links[0].href).toMatch(new RegExp(`^${ROUTES.brands}`));
  });

  it("detects active navigation items based on current pathname and category slugs", () => {
    // Exact route match
    expect(
      isHeaderNavItemActive({
        key: "guitars",
        href: "/category/guitars",
        slug: "guitars",
        pathname: "/category/guitars",
      }),
    ).toBe(true);

    // Subpath match (e.g. /category/guitars/electric-guitars)
    expect(
      isHeaderNavItemActive({
        key: "guitars",
        href: "/category/guitars",
        slug: "guitars",
        pathname: "/category/guitars/electric-guitars",
      }),
    ).toBe(true);

    // Brands section active check
    expect(
      isHeaderNavItemActive({
        key: "brands",
        href: ROUTES.brands,
        slug: "brands",
        pathname: "/brands/fender",
      }),
    ).toBe(true);

    // Unrelated page should not be active
    expect(
      isHeaderNavItemActive({
        key: "guitars",
        href: "/category/guitars",
        slug: "guitars",
        pathname: "/rentals",
      }),
    ).toBe(false);
  });

  it("supports fast O(1) lookup via MEGA_MENU_BY_SLUG map", () => {
    const guitarsMenu = MEGA_MENU_BY_SLUG["guitars"];
    expect(guitarsMenu).toBeDefined();
    expect(guitarsMenu.name).toBe("Guitars");

    const nonExistent = MEGA_MENU_BY_SLUG["non-existent-gear"];
    expect(nonExistent).toBeUndefined();
  });
});
