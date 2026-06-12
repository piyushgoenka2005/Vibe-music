/**
 * One-time: merge category JSON files into products.json (single source of truth).
 * Run: npx tsx scripts/consolidate-catalog.mts
 */
import fs from "fs";
import path from "path";

const CATALOG = path.join(process.cwd(), "src", "data", "catalog");
const CATEGORIES_DIR = path.join(CATALOG, "categories");

interface LegacyProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  tags?: string[];
  brandSlug: string;
  categorySlug: string;
  availability: "in-stock" | "out-of-stock" | "limited";
  condition: "new" | "used" | "open-box";
  imageColor: string;
  image: string;
  gstRate?: 5 | 12 | 18 | 28;
  detail?: unknown;
}

const now = new Date().toISOString();

function migrate(p: LegacyProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory ?? "",
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercentage: p.discountPercentage,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    sku: p.sku,
    status: "active" as const,
    featured: p.isFeatured ?? false,
    trending: p.isTrending ?? false,
    newArrival: p.isNewArrival ?? false,
    images: p.images,
    description: p.description,
    specifications: p.specifications,
    createdAt: now,
    updatedAt: now,
    brandSlug: p.brandSlug,
    categorySlug: p.categorySlug,
    availability: p.availability,
    condition: p.condition,
    imageColor: p.imageColor,
    image: p.image,
    gstRate: p.gstRate,
    detail: p.detail,
  };
}

function main() {
  const files = fs.readdirSync(CATEGORIES_DIR).filter((f) => f.endsWith(".json"));
  const byId = new Map<string, ReturnType<typeof migrate>>();

  for (const file of files) {
    const items = JSON.parse(
      fs.readFileSync(path.join(CATEGORIES_DIR, file), "utf8")
    ) as LegacyProduct[];
    for (const item of items) {
      byId.set(item.id, migrate(item));
    }
  }

  const products = Array.from(byId.values());
  fs.writeFileSync(
    path.join(CATALOG, "products.json"),
    JSON.stringify(products, null, 2) + "\n"
  );

  const categories = JSON.parse(
    fs.readFileSync(path.join(CATALOG, "categories.json"), "utf8")
  ) as Array<{ id: string; name: string; slug: string; description?: string }>;

  const slimCategories = categories.map(({ id, name, slug, description }) => ({
    id,
    name,
    slug,
    description,
  }));

  fs.writeFileSync(
    path.join(CATALOG, "categories.json"),
    JSON.stringify(slimCategories, null, 2) + "\n"
  );

  console.log(`Consolidated ${products.length} products into products.json`);
  console.log(`Updated categories.json (${slimCategories.length} categories)`);
}

main();
