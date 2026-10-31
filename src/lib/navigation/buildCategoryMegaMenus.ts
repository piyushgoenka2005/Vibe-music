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
    return HEADER_MEGA_MENUS;
  }

  const mainCategories = categories.filter((c) => !c.parentId);
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

  // Iterate over baseline menus to preserve curated order and imagery, enriching with DB subcategories
  for (const baseline of HEADER_MEGA_MENUS) {
    const dbMain = mainCategories.find(
      (c) =>
        c.slug === baseline.slug ||
        c.id === baseline.slug ||
        c.name.toLowerCase() === baseline.name.toLowerCase(),
    );

    if (!dbMain) {
      result.push(baseline);
      continue;
    }

    const dbSubs = subCategoriesByParent.get(dbMain.id) ?? [];
    if (dbSubs.length === 0) {
      result.push({
        ...baseline,
        name: dbMain.name || baseline.name,
      });
      continue;
    }

    // Sort DB subcategories by sortOrder then name
    const sortedDbSubs = [...dbSubs].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );

    // Deep clone baseline columns so we can enrich them
    const columns: MegaMenuColumn[] = baseline.columns.map((col) => ({
      heading: col.heading,
      links: [...col.links],
    }));

    // Track which DB subcategories matched existing links in the columns
    const matchedSubIds = new Set<string>();

    for (const col of columns) {
      col.links = col.links.map((link) => {
        // Check if this link corresponds to a subcategory in DB
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

    // Any DB subcategories that didn't match existing static links get added
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
      columns,
    });
  }

  // Also include any newly created main categories in DB that are not in baseline
  for (const mainCat of mainCategories) {
    if (baselineBySlug.has(mainCat.slug)) continue;
    const subs = subCategoriesByParent.get(mainCat.id) ?? [];
    if (subs.length === 0) continue;

    const sortedSubs = [...subs].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );

    // Group into columns of max 5 links
    const chunkSize = 5;
    const customColumns: MegaMenuColumn[] = [];
    for (let i = 0; i < sortedSubs.length; i += chunkSize) {
      const chunk = sortedSubs.slice(i, i + chunkSize);
      customColumns.push({
        heading: i === 0 ? "Categories" : "More",
        links: chunk.map((s) => ({
          label: s.name,
          href: categoryPath(s.slug),
        })),
      });
    }

    result.push({
      slug: mainCat.slug,
      name: mainCat.name,
      href: categoryPath(mainCat.slug),
      columns: customColumns,
      featured: [
        {
          title: mainCat.name,
          href: categoryPath(mainCat.slug),
          image: mainCat.imageUrl || "/images/m/home/cats/thumbs/Arrow-small.webp",
        },
      ],
    });
  }

  return result;
}
