import { describe, expect, it } from "vitest";
import { HEADER_MEGA_MENUS } from "@/data/headerMegaMenu";
import { buildCategoryMegaMenus } from "./buildCategoryMegaMenus";

describe("buildCategoryMegaMenus", () => {
  it("keeps the approved header departments fixed while enriching their subcategories", () => {
    const menus = buildCategoryMegaMenus([
      { id: "cat-guitars", name: "Renamed Guitars", slug: "changed-guitars", sortOrder: 1 },
      {
        id: "sub-guitar",
        name: "Modular Synths",
        slug: "guitars-modular-synths",
        parentId: "cat-guitars",
        sortOrder: 1,
      },
    ]);

    expect(menus.map((menu) => menu.slug)).toEqual(HEADER_MEGA_MENUS.map((menu) => menu.slug));
    expect(menus[0]).toMatchObject({
      name: "Guitars",
      href: "/category/guitars",
    });
  });

  it("keeps DJ and Accessories beside Microphones in the canonical All Categories order", () => {
    const menus = buildCategoryMegaMenus([
      { id: "cat-microphones", name: "Microphones", slug: "microphones-wireless", sortOrder: 6 },
      { id: "cat-dj", name: "DJ", slug: "dj-equipment", sortOrder: 7 },
      {
        id: "cat-accessories",
        name: "Accessories",
        slug: "cables-cases-accessories",
        sortOrder: 8,
      },
    ]);

    const slugs = menus.map((menu) => menu.slug);
    const microphoneIndex = slugs.indexOf("microphones-wireless");

    expect(slugs.slice(microphoneIndex, microphoneIndex + 3)).toEqual([
      "microphones-wireless",
      "dj-equipment",
      "cables-cases-accessories",
    ]);
  });

  it("uses taxonomy subcategories without changing the department menu", () => {
    const menus = buildCategoryMegaMenus(
      [{ id: "cat-guitars", name: "Guitars", slug: "guitars", sortOrder: 1 }],
      new Map([
        [
          "guitars",
          [{ id: "taxonomy-1", name: "Electric Guitars", slug: "guitars-electric-guitars" }],
        ],
      ]),
    );

    expect(menus[0]?.columns.flatMap((column) => column.links)).toContainEqual({
      label: "Electric Guitars",
      href: "/category/guitars-electric-guitars",
    });
  });

  it("adds product types as hover children for each taxonomy subcategory", () => {
    const menus = buildCategoryMegaMenus(
      [{ id: "cat-guitars", name: "Guitars", slug: "guitars", sortOrder: 1 }],
      new Map([
        [
          "guitars",
          [
            {
              id: "taxonomy-1",
              name: "Electric Guitars",
              slug: "guitars-electric-guitars",
              children: [
                {
                  id: "taxonomy-2",
                  name: "Solid Body",
                  slug: "guitars-electric-guitars-solid-body",
                },
              ],
            },
          ],
        ],
      ]),
    );

    const electric = menus[0]?.columns
      .flatMap((column) => column.links)
      .find((link) => link.label === "Electric Guitars");
    expect(electric?.children).toEqual([expect.objectContaining({ label: "Solid Body" })]);
  });

  it("uses the admin image for featured cards in an existing menu", () => {
    const imageUrl = "https://cdn.example.com/studio.jpg";
    const menus = buildCategoryMegaMenus([
      {
        id: "cat-studio",
        name: "Studio",
        slug: "studio-recording",
        imageUrl,
        sortOrder: 1,
      },
    ]);

    const studioMenu = menus.find((menu) => menu.slug === "studio-recording");
    expect(studioMenu?.featured[0]?.image).toBe(imageUrl);
    expect(studioMenu?.featured[1]?.image).not.toBe(imageUrl);
  });

  it("uses independently configured images for each featured card", () => {
    const featuredImageUrls = [
      "https://cdn.example.com/one.jpg",
      "https://cdn.example.com/two.jpg",
    ];
    const menus = buildCategoryMegaMenus([
      {
        id: "cat-studio",
        name: "Studio",
        slug: "studio-recording",
        featuredImageUrls,
        sortOrder: 1,
      },
    ]);

    const studioMenu = menus.find((menu) => menu.slug === "studio-recording");
    expect(studioMenu?.featured.map((card) => card.image)).toEqual(featuredImageUrls);
  });
});
