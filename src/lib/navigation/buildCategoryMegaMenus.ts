import { HEADER_MEGA_MENUS, type MegaMenuItem, type MegaMenuColumn } from "@/data/headerMegaMenu";
import { categoryPath } from "@/lib/routes";
import { getCategoryHeroImage, getMegaMenuFeaturedImage } from "@/lib/categoryImages";
import { slugify } from "@/lib/slug";
import type { Category } from "@/types/category";

type HeaderSubcategory = Pick<Category, "id" | "name" | "slug"> & {
  sortOrder?: number;
  children?: HeaderSubcategory[];
};

/**
 * Builds the fixed department menus with live submenu links.
 * Database/taxonomy changes can update submenu links, but never the approved
 * department labels, routes, order, or presence in the main header.
 */
export function buildCategoryMegaMenus(
  categories: Category[],
  taxonomySubcategories?: ReadonlyMap<string, HeaderSubcategory[]>,
): MegaMenuItem[] {
  if (!categories || categories.length === 0) {
    if (!taxonomySubcategories || taxonomySubcategories.size === 0) return HEADER_MEGA_MENUS;
    const baselineMenus = HEADER_MEGA_MENUS.map((baseline) => {
      const subcategories = taxonomySubcategories.get(baseline.slug);
      if (!subcategories) return baseline;
      const columns: MegaMenuColumn[] = baseline.columns.map((column) => ({
        heading: column.heading,
        links: [],
      }));
      subcategories.forEach((subcategory, index) => {
        columns[index % columns.length]?.links.push({
          label: subcategory.name,
          href: categoryPath(subcategory.slug),
          children: subcategory.children?.map((child) => ({
            label: child.name,
            href: `${categoryPath(baseline.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
          })),
        });
      });
      columns[columns.length - 1]?.links.push({
        label: `Shop all ${baseline.name}`,
        href: baseline.href,
      });
      return { ...baseline, columns };
    });

    const baselineSlugs = new Set(HEADER_MEGA_MENUS.map((m) => m.slug));
    const extraTaxonomyMenus: MegaMenuItem[] = [];
    for (const [taxSlug, subs] of taxonomySubcategories.entries()) {
      if (baselineSlugs.has(taxSlug) || !subs || subs.length === 0) continue;
      const taxName = taxSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const numCols = subs.length >= 8 ? 3 : subs.length >= 4 ? 2 : 1;
      const columns: MegaMenuColumn[] = Array.from({ length: numCols }, (_, i) => ({
        heading: i === 0 ? taxName : "More",
        links: [],
      }));
      subs.forEach((sub, i) => {
        columns[i % numCols]?.links.push({
          label: sub.name,
          href: categoryPath(sub.slug),
          children: sub.children?.map((child) => ({
            label: child.name,
            href: `${categoryPath(taxSlug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
          })),
        });
      });
      columns[columns.length - 1]?.links.push({
        label: `Shop all ${taxName}`,
        href: categoryPath(taxSlug),
      });
      extraTaxonomyMenus.push({
        slug: taxSlug,
        name: taxName,
        href: categoryPath(taxSlug),
        columns,
        featured: [
          {
            title: taxName,
            href: categoryPath(taxSlug),
            image:
              getMegaMenuFeaturedImage(taxSlug, "featured") ||
              getCategoryHeroImage(taxSlug) ||
              "/brand/header-logo.webp",
          },
          {
            title: `Shop ${taxName}`,
            href: `${categoryPath(taxSlug)}?sort=newest`,
            image: getMegaMenuFeaturedImage(taxSlug, "secondary") || "/images/New Guitar.png",
          },
        ],
      });
    }

    return [...baselineMenus, ...extraTaxonomyMenus];
  }

  const subCategoriesByParent = new Map<string, HeaderSubcategory[]>();

  for (const cat of categories) {
    if (cat.parentId) {
      const existing = subCategoriesByParent.get(cat.parentId) ?? [];
      existing.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
      });
      subCategoriesByParent.set(cat.parentId, existing);
    }
  }

  const matchedCategoryIds = new Set<string>();

  const baselineMenus = HEADER_MEGA_MENUS.map((baseline) => {
    const dbMain = categories.find(
      (category) =>
        !category.parentId &&
        (category.slug === baseline.slug ||
          category.id === baseline.slug ||
          category.name.toLowerCase() === baseline.name.toLowerCase() ||
          category.id === `cat-${baseline.slug}` ||
          category.id === `cat_${baseline.slug}`),
    );

    if (dbMain) {
      matchedCategoryIds.add(dbMain.id);
    }

    if (!dbMain && !taxonomySubcategories?.has(baseline.slug)) return baseline;

    const hasTaxonomySubcategories = taxonomySubcategories?.has(baseline.slug) ?? false;
    const dbSubs =
      taxonomySubcategories?.get(baseline.slug) ??
      (dbMain ? taxonomySubcategories?.get(dbMain.slug) : undefined) ??
      (dbMain ? subCategoriesByParent.get(dbMain.id) : undefined) ??
      [];
    const sortedDbSubs = [...dbSubs].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );

    if (sortedDbSubs.length === 0) {
      return {
        ...baseline,
        name: baseline.name,
        href: baseline.href,
        featured:
          dbMain?.imageUrl || dbMain?.featuredImageUrls?.length
            ? baseline.featured.map((card, index) => ({
                ...card,
                image:
                  dbMain?.featuredImageUrls?.[index] ||
                  (index === 0 ? dbMain?.imageUrl : undefined) ||
                  card.image,
              }))
            : baseline.featured,
      };
    }

    // When taxonomy data is available, it is authoritative: deleted taxonomy
    // rows must not survive as static submenu links.
    const columns: MegaMenuColumn[] = baseline.columns.map((col) => ({
      heading: col.heading,
      links: hasTaxonomySubcategories ? [] : [...col.links],
    }));

    if (hasTaxonomySubcategories) {
      sortedDbSubs.forEach((sub, index) => {
        const targetColumn = columns[index % columns.length];
        targetColumn?.links.push({
          label: sub.name,
          href: categoryPath(sub.slug),
          children: sub.children?.map((child) => ({
            label: child.name,
            href: `${categoryPath(baseline.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
          })),
        });
      });

      const lastColumn = columns[columns.length - 1];
      if (lastColumn) {
        lastColumn.links.push({
          label: `Shop all ${baseline.name}`,
          href: baseline.href,
        });
      }

      const featured =
        dbMain?.imageUrl || dbMain?.featuredImageUrls?.length
          ? baseline.featured.map((card, index) => ({
              ...card,
              image:
                dbMain?.featuredImageUrls?.[index] ||
                (index === 0 ? dbMain?.imageUrl : undefined) ||
                card.image,
            }))
          : baseline.featured;

      return { ...baseline, columns, featured };
    }

    // Track which DB subcategories matched existing links in the columns
    const matchedSubIds = new Set<string>();

    for (const col of columns) {
      col.links = col.links.map((link) => {
        const match = sortedDbSubs.find(
          (sub) =>
            sub.name.toLowerCase() === link.label.toLowerCase() ||
            link.href.includes(sub.slug) ||
            (link.label.toLowerCase().includes(sub.name.toLowerCase()) && sub.name.length > 3),
        );
        if (match) {
          matchedSubIds.add(match.id);
          return {
            label: match.name,
            href: categoryPath(match.slug),
            children: match.children?.map((child) => ({
              label: child.name,
              href: `${categoryPath(baseline.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
            })),
          };
        }
        return link;
      });
    }

    // Check if any subcategory matches a column heading directly (e.g. "Electric", "Acoustic")
    for (const sub of sortedDbSubs) {
      if (matchedSubIds.has(sub.id)) continue;
      const targetCol = columns.find(
        (col) =>
          col.heading.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(col.heading.toLowerCase()),
      );
      if (targetCol) {
        matchedSubIds.add(sub.id);
        targetCol.links.unshift({
          label: sub.name,
          href: categoryPath(sub.slug),
          children: sub.children?.map((child) => ({
            label: child.name,
            href: `${categoryPath(baseline.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
          })),
        });
      }
    }

    // Any DB subcategories that didn't match existing static links get added to the last column
    const unmatchedSubs = sortedDbSubs.filter((sub) => !matchedSubIds.has(sub.id));
    if (unmatchedSubs.length > 0) {
      unmatchedSubs.forEach((sub, subIdx) => {
        const targetCol = columns[subIdx % columns.length];
        if (targetCol) {
          targetCol.links.push({
            label: sub.name,
            href: categoryPath(sub.slug),
            children: sub.children?.map((child) => ({
              label: child.name,
              href: `${categoryPath(baseline.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
            })),
          });
        }
      });
    }

    const featured =
      dbMain?.imageUrl || dbMain?.featuredImageUrls?.length
        ? baseline.featured.map((card, index) => ({
            ...card,
            image:
              dbMain?.featuredImageUrls?.[index] ||
              (index === 0 ? dbMain?.imageUrl : undefined) ||
              card.image,
          }))
        : baseline.featured;

    return {
      ...baseline,
      name: baseline.name,
      href: baseline.href,
      columns,
      featured,
    };
  });

  const baselineSlugs = new Set(HEADER_MEGA_MENUS.map((m) => m.slug));
  const baselineNames = new Set(HEADER_MEGA_MENUS.map((m) => m.name.toLowerCase()));

  // Dynamic root categories from database that are not covered by baseline departments
  const dynamicCategoryMenus: MegaMenuItem[] = [];

  const unmatchedRootCategories = categories.filter(
    (category) =>
      !category.parentId &&
      !matchedCategoryIds.has(category.id) &&
      !baselineSlugs.has(category.slug) &&
      !baselineNames.has(category.name.toLowerCase()),
  );

  for (const cat of unmatchedRootCategories) {
    const dbSubs = taxonomySubcategories?.get(cat.slug) ?? subCategoriesByParent.get(cat.id) ?? [];
    const sortedDbSubs = [...dbSubs].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );

    let columns: MegaMenuColumn[];
    if (sortedDbSubs.length > 0) {
      const numCols = sortedDbSubs.length >= 8 ? 3 : sortedDbSubs.length >= 4 ? 2 : 1;
      columns = Array.from({ length: numCols }, (_, index) => ({
        heading: index === 0 ? cat.name : "More",
        links: [],
      }));

      sortedDbSubs.forEach((sub, index) => {
        columns[index % numCols]?.links.push({
          label: sub.name,
          href: categoryPath(sub.slug),
          children: sub.children?.map((child) => ({
            label: child.name,
            href: `${categoryPath(cat.slug)}?subcat=${encodeURIComponent(slugify(child.name))}`,
          })),
        });
      });

      columns[columns.length - 1]?.links.push({
        label: `Shop all ${cat.name}`,
        href: categoryPath(cat.slug),
      });
    } else {
      columns = [
        {
          heading: cat.name,
          links: [
            { label: `All ${cat.name}`, href: categoryPath(cat.slug) },
            { label: "New Arrivals", href: `${categoryPath(cat.slug)}?sort=newest` },
            { label: "Best Sellers", href: `${categoryPath(cat.slug)}?sort=bestselling` },
            { label: `Shop all ${cat.name}`, href: categoryPath(cat.slug) },
          ],
        },
      ];
    }

    const card1 =
      cat.imageUrl ||
      cat.featuredImageUrls?.[0] ||
      getMegaMenuFeaturedImage(cat.slug, "featured") ||
      getCategoryHeroImage(cat.slug) ||
      "/brand/header-logo.webp";
    const card2 =
      cat.featuredImageUrls?.[1] || getMegaMenuFeaturedImage(cat.slug, "secondary") || card1;

    dynamicCategoryMenus.push({
      slug: cat.slug,
      name: cat.name,
      href: categoryPath(cat.slug),
      columns,
      featured: [
        {
          title: cat.name,
          href: categoryPath(cat.slug),
          image: card1,
        },
        {
          title: `Shop ${cat.name}`,
          href: `${categoryPath(cat.slug)}?sort=newest`,
          image: card2,
        },
      ],
    });
  }

  const canonicalAccessories = categories.find((category) => category.slug === "accessories");
  const normalizedBaselineMenus = canonicalAccessories
    ? baselineMenus.map((menu) =>
        menu.slug === "accessories"
          ? {
              ...menu,
              slug: canonicalAccessories.slug,
              href: categoryPath(canonicalAccessories.slug),
            }
          : menu,
      )
    : baselineMenus;

  return [...normalizedBaselineMenus, ...dynamicCategoryMenus];
}
