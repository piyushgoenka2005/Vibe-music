import { getAdminFirestore } from "@/lib/firebase/admin";
import { getProductImage } from "@/data/productImages";
import type { Product } from "@/types/product";
import type { DocumentData } from "firebase-admin/firestore";

const COLLECTION = "products";

function normalizeProduct(id: string, data: DocumentData): Product | null {
  if (!data.slug || !data.name || !data.brand) {
    return null;
  }

  const slug = String(data.slug);
  const category = String(data.category ?? "");

  return {
    id,
    slug,
    name: String(data.name),
    brand: String(data.brand),
    brandSlug: String(data.brandSlug ?? data.slug),
    category,
    categorySlug: String(data.categorySlug ?? ""),
    price: Number(data.price ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    availability: data.availability ?? "in-stock",
    condition: data.condition ?? "new",
    imageColor: String(data.imageColor ?? "#e8e8e8"),
    image: String(data.image ?? getProductImage(slug, category)),
  };
}

export async function listProducts(): Promise<Product[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).get();

  return snap.docs
    .map((doc) => normalizeProduct(doc.id, doc.data()))
    .filter((product): product is Product => product !== null);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return normalizeProduct(doc.id, doc.data());
}

function matchesQuery(product: Product, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [product.name, product.brand, product.category].some((value) =>
    value.toLowerCase().includes(normalized)
  );
}

export interface ProductSearchOptions {
  query?: string;
  category?: string;
  brand?: string;
  sort?: string;
  condition?: Product["condition"];
  limit?: number;
}

export async function searchProducts(
  options: ProductSearchOptions = {}
): Promise<Product[]> {
  let products = await listProducts();

  if (options.query) {
    products = products.filter((product) => matchesQuery(product, options.query!));
  }

  if (options.category) {
    const category = options.category.toLowerCase();
    products = products.filter(
      (product) =>
        product.categorySlug === category ||
        product.category.toLowerCase().replace(/\s+/g, "-") === category
    );
  }

  if (options.brand) {
    const brand = options.brand.toLowerCase();
    products = products.filter(
      (product) =>
        product.brandSlug === brand ||
        product.brand.toLowerCase().replace(/\s+/g, "-") === brand
    );
  }

  if (options.condition) {
    products = products.filter((product) => product.condition === options.condition);
  }

  if (options.sort === "price-asc") {
    products = [...products].sort((a, b) => a.price - b.price);
  } else if (options.sort === "price-desc") {
    products = [...products].sort((a, b) => b.price - a.price);
  } else if (options.sort === "rating-desc") {
    products = [...products].sort((a, b) => b.rating - a.rating);
  } else if (options.sort === "reviews-desc") {
    products = [...products].sort((a, b) => b.reviewCount - a.reviewCount);
  }

  if (options.limit && options.limit > 0) {
    products = products.slice(0, options.limit);
  }

  return products;
}
