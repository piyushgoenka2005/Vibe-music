import { describe, expect, it } from "vitest";
import {
  isHeaderBrandsActive,
  isHeaderDealsActive,
  isHeaderGrandPianoActive,
  isHeaderProgramsActive,
  isHeaderGuidesActive,
  isHeaderMegaMenuActive,
  isHeaderNavItemActive,
} from "@/lib/navigation/headerNavActive";
import { ROUTES } from "@/lib/routes";

describe("headerNavActive", () => {
  it("marks mega menu categories active on category pages", () => {
    expect(isHeaderMegaMenuActive("/category/guitars", "guitars")).toBe(true);
    expect(isHeaderMegaMenuActive("/category/keys", "guitars")).toBe(false);
  });

  it("marks mega menu categories active on scoped search results", () => {
    expect(isHeaderMegaMenuActive("/search/results", "guitars", "guitars")).toBe(true);
    expect(isHeaderMegaMenuActive("/search/results", "guitars", "drums-percussion")).toBe(false);
  });

  it("marks utility links active on their routes", () => {
    expect(isHeaderBrandsActive("/brands/hertz")).toBe(true);
    expect(isHeaderDealsActive("/deals")).toBe(true);
    expect(isHeaderDealsActive("/search/results", "deals")).toBe(true);
    expect(isHeaderGuidesActive("/blog/studio-setup")).toBe(true);
    expect(isHeaderGrandPianoActive("/gp9")).toBe(true);
    expect(isHeaderProgramsActive("/programs")).toBe(true);
    expect(isHeaderProgramsActive("/rentals")).toBe(true);
    expect(isHeaderProgramsActive("/gear-exchange")).toBe(true);
  });

  it("resolves nav item keys consistently", () => {
    expect(
      isHeaderNavItemActive({
        key: "keyboards-synthesizers",
        href: "/category/keyboards-synthesizers",
        slug: "keyboards-synthesizers",
        pathname: "/category/keyboards-synthesizers",
      }),
    ).toBe(true);

    expect(
      isHeaderNavItemActive({
        key: "gp9",
        href: ROUTES.gp9,
        pathname: "/gp9",
      }),
    ).toBe(true);
  });
});
