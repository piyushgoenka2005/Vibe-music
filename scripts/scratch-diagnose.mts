import { getProductAttributes } from "@/lib/server/catalog/attributesRepository";
import { listBrands } from "@/lib/server/catalog/brandRepository";
import { getTaxonomies } from "@/lib/server/taxonomy/taxonomyRepository";

async function main() {
  console.log("Starting diagnosis...");
  try {
    const attrs = await getProductAttributes();
    console.log("Attributes count:", attrs.length);
  } catch (e: any) {
    console.error("Attributes error:", e?.message || e);
  }

  try {
    const brands = await listBrands();
    console.log("Brands count:", brands.length);
  } catch (e: any) {
    console.error("Brands error:", e?.message || e);
  }

  try {
    const tax = await getTaxonomies();
    console.log("Taxonomy count:", tax.items.length);
  } catch (e: any) {
    console.error("Taxonomy error:", e?.message || e);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
