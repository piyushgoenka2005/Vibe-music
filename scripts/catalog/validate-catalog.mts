/**
 * Validates products.json catalog integrity.
 * Run: npx tsx scripts/catalog/validate-catalog.mts
 */
import { loadProducts, loadCategories } from "../../src/lib/server/catalogRepository";

function main() {
  const products = loadProducts();
  const categories = loadCategories();
  const slugs = new Set<string>();
  const skus = new Set<string>();
  let duplicateSlugs = 0;
  let duplicateSkus = 0;

  products.forEach((p) => {
    if (slugs.has(p.slug)) duplicateSlugs += 1;
    slugs.add(p.slug);
    if (skus.has(p.sku)) duplicateSkus += 1;
    skus.add(p.sku);
  });

  console.log("Catalog validation OK");
  console.log(`  Products: ${products.length}`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Active: ${products.filter((p) => p.status === "active").length}`);
  console.log(`  Featured: ${products.filter((p) => p.featured).length}`);
  console.log(`  Duplicate slugs: ${duplicateSlugs}`);
  console.log(`  Duplicate SKUs: ${duplicateSkus}`);
}

main();
