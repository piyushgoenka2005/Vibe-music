import { HEADER_MEGA_MENUS, type MegaMenuItem, type MegaMenuColumn } from "@/data/headerMegaMenu";
import { categoryPath, ROUTES } from "@/lib/routes";
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
    return HEADER_MEGA_MENUS.map((baseline) => {
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
            href: `${ROUTES.searchResults}?q=${encodeURIComponent(child.name)}&category=${encodeURIComponent(baseline.slug)}`,
          })),
        });
      });
      columns[columns.length - 1]?.links.push({
        label: `Shop all ${baseline.name}`,
        href: baseline.href,
      });
      return { ...baseline, columns };
    });
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

  return HEADER_MEGA_MENUS.map((baseline) => {
    const dbMain = categories.find(
      (category) =>
        !category.parentId &&
        (category.slug === baseline.slug ||
          category.id === baseline.slug ||
          category.name.toLowerCase() === baseline.name.toLowerCase()),
    );

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
            href: `${ROUTES.searchResults}?q=${encodeURIComponent(child.name)}&category=${encodeURIComponent(baseline.slug)}`,
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
              href: `${ROUTES.searchResults}?q=${encodeURIComponent(child.name)}&category=${encodeURIComponent(baseline.slug)}`,
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
            href: `${ROUTES.searchResults}?q=${encodeURIComponent(child.name)}&category=${encodeURIComponent(baseline.slug)}`,
          })),
        });
      }
    }

    // Any DB subcategories that didn't match existing static links get added to the last column
    const unmatchedSubs = sortedDbSubs.filter((sub) => !matchedSubIds.has(sub.id));
    if (unmatchedSubs.length > 0) {
      const targetCol = columns[columns.length - 1];
      if (targetCol) {
        for (const sub of unmatchedSubs) {
          targetCol.links.unshift({
            label: sub.name,
            href: categoryPath(sub.slug),
            children: sub.children?.map((child) => ({
              label: child.name,
              href: `${ROUTES.searchResults}?q=${encodeURIComponent(child.name)}&category=${encodeURIComponent(baseline.slug)}`,
            })),
          });
        }
      }
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
}
