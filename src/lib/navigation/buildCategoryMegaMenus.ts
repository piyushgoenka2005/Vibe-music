import { HEADER_MEGA_MENUS, type MegaMenuItem, type MegaMenuColumn } from "@/data/headerMegaMenu";
import { categoryPath } from "@/lib/routes";
import type { Category } from "@/types/category";

/**
 * Builds dynamic header mega-menus enriched with live database categories and subcategories.
 * When database categories exist, their subcategories are dynamically wired into the navigation columns,
 * guaranteeing that any additions, renames, or deletions made in /admin/categories appear immediately in the header.
 */
export function buildCategoryMegaMenus(categories: Category[]): MegaMenuItem[] {
  if (!categories || categories.length === 0) {
    return [];
  }

  const mainCategories = categories.filter((c) => !c.parentId);
  if (mainCategories.length === 0) {
    return [];
  }

  const subCategoriesByParent = new Map<string, Category[]>();

  for (const cat of categories) {
    if (cat.parentId) {
      const existing = subCategoriesByParent.get(cat.parentId) ?? [];
      existing.push(cat);
      subCategoriesByParent.set(cat.parentId, existing);
    }
  }

  // Create a map of baseline menus by slug for quick lookup
  const baselineBySlug = new Map<string, MegaMenuItem>(
    HEADER_MEGA_MENUS.map((menu) => [menu.slug, menu]),
  );

  const result: MegaMenuItem[] = [];

  // Iterate over DB main categories so that deleted categories are completely excluded from the header.
  // Order follows DB sortOrder, then baseline position if available.
  const sortedMainCategories = [...mainCategories].sort((a, b) => {
    const aOrder = a.sortOrder ?? 0;
    const bOrder = b.sortOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aBaseIdx = HEADER_MEGA_MENUS.findIndex((m) => m.slug === a.slug);
    const bBaseIdx = HEADER_MEGA_MENUS.findIndex((m) => m.slug === b.slug);
    if (aBaseIdx !== -1 && bBaseIdx !== -1) return aBaseIdx - bBaseIdx;
    if (aBaseIdx !== -1) return -1;
    if (bBaseIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const dbMain of sortedMainCategories) {
    const baseline = HEADER_MEGA_MENUS.find(
      (m) =>
        m.slug === dbMain.slug ||
        m.slug === dbMain.id ||
        m.name.toLowerCase() === dbMain.name.toLowerCase(),
    );

    const dbSubs = subCategoriesByParent.get(dbMain.id) ?? [];
    const sortedDbSubs = [...dbSubs].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );

    if (!baseline) {
      // Custom category in DB not in baseline: chunk subcategories into columns
      const chunkSize = 5;
      const customColumns: MegaMenuColumn[] = [];
      if (sortedDbSubs.length > 0) {
        for (let i = 0; i < sortedDbSubs.length; i += chunkSize) {
          const chunk = sortedDbSubs.slice(i, i + chunkSize);
          customColumns.push({
            heading: i === 0 ? "Categories" : "More",
            links: chunk.map((s) => ({
              label: s.name,
              href: categoryPath(s.slug),
            })),
          });
        }
      } else {
        customColumns.push({
          heading: dbMain.name,
          links: [{ label: `Shop all ${dbMain.name}`, href: categoryPath(dbMain.slug) }],
        });
      }

      result.push({
        slug: dbMain.slug,
        name: dbMain.name,
        href: categoryPath(dbMain.slug),
        columns: customColumns,
        featured: [
          {
            title: dbMain.name,
            href: categoryPath(dbMain.slug),
            image: dbMain.imageUrl || "/images/m/home/cats/thumbs/Arrow-small.webp",
          },
        ],
      });
      continue;
    }

    // Baseline exists for this DB category
    if (sortedDbSubs.length === 0) {
      result.push({
        ...baseline,
        name: dbMain.name || baseline.name,
        href: categoryPath(dbMain.slug),
      });
      continue;
    }

    // Deep clone baseline columns so we can enrich them
    const columns: MegaMenuColumn[] = baseline.columns.map((col) => ({
      heading: col.heading,
      links: [...col.links],
    }));

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
          });
        }
      }
    }

    result.push({
      ...baseline,
      name: dbMain.name || baseline.name,
      href: categoryPath(dbMain.slug),
      columns,
    });
  }

  return result;
}
