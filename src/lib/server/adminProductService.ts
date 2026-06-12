import {
  bulkActivateProducts,
  bulkArchiveProducts,
  bulkDeleteProducts,
  bulkUpdateCategory,
  bulkUpdateStock,
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  toProduct,
  updateProduct,
} from "@/services/catalogService";
import { getProductImage } from "@/data/productImages";
import { slugify } from "@/lib/slug";
import type { AdminProduct } from "@/types/admin";
import type { CatalogProduct } from "@/types/catalog";

function toAdminProduct(catalog: CatalogProduct): AdminProduct {
  const product = toProduct(catalog);
  return {
    ...product,
    sku: catalog.sku,
    status: catalog.status,
    salePrice:
      catalog.originalPrice > catalog.price ? catalog.price : null,
    stockQuantity: catalog.stock,
    lowStockThreshold: 10,
    description: catalog.description,
    featured: catalog.featured,
    trending: catalog.trending,
    newArrival: catalog.newArrival,
    createdAt: catalog.createdAt,
    updatedAt: catalog.updatedAt,
  };
}

export async function listAdminProducts(options: {
  search?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ products: AdminProduct[]; total: number }> {
  let products = (await getAllProducts(true)).map(toAdminProduct);

  if (options.search) {
    const q = options.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
    );
  }

  if (options.status) {
    products = products.filter((p) => p.status === options.status);
  }

  if (options.category) {
    products = products.filter(
      (p) =>
        p.categorySlug === options.category || p.category === options.category
    );
  }

  products.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  const total = products.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 20;
  products = products.slice(offset, offset + limit);

  return { products, total };
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const product = await getProductById(id);
  return product ? toAdminProduct(product) : null;
}

export async function createAdminProduct(
  input: Omit<AdminProduct, "id" | "createdAt" | "updatedAt"> & {
    images?: string[];
  }
): Promise<AdminProduct> {
  const created = await createProduct({
    name: input.name,
    brand: input.brand,
    brandSlug: input.brandSlug,
    category: input.category,
    categorySlug: input.categorySlug,
    price: input.price,
    originalPrice: input.salePrice ? input.price : input.price,
    stock: input.stockQuantity ?? 100,
    sku: input.sku,
    status: input.status ?? "active",
    description: input.description,
    slug: input.slug,
    rating: input.rating,
    reviewCount: input.reviewCount,
    availability: input.availability,
    condition: input.condition,
    imageColor: input.imageColor,
    image: input.image || getProductImage(input.slug, input.category),
    images: input.images,
    gstRate: input.gstRate,
    featured: input.featured,
    trending: input.trending,
    newArrival: input.newArrival,
  });
  return toAdminProduct(created);
}

export async function updateAdminProduct(
  id: string,
  patch: Partial<AdminProduct> & { images?: string[] }
): Promise<AdminProduct> {
  const updated = await updateProduct(id, {
    name: patch.name,
    brand: patch.brand,
    brandSlug: patch.brandSlug,
    category: patch.category,
    categorySlug: patch.categorySlug,
    price: patch.price,
    originalPrice: patch.salePrice ?? patch.price,
    stock: patch.stockQuantity,
    sku: patch.sku,
    status: patch.status,
    description: patch.description,
    slug: patch.slug,
    rating: patch.rating,
    reviewCount: patch.reviewCount,
    availability: patch.availability,
    condition: patch.condition,
    imageColor: patch.imageColor,
    image: patch.image,
    images: patch.images,
    gstRate: patch.gstRate,
    featured: patch.featured,
    trending: patch.trending,
    newArrival: patch.newArrival,
  });
  return toAdminProduct(updated);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await deleteProduct(id);
}

export async function duplicateAdminProduct(id: string): Promise<AdminProduct> {
  const original = await getProductById(id);
  if (!original) throw new Error("Product not found");

  const suffix = Date.now().toString(36);
  return createAdminProduct({
    ...toAdminProduct(original),
    slug: `${original.slug}-copy-${suffix}`,
    name: `${original.name} (Copy)`,
    sku: `${original.sku}-${suffix}`.slice(0, 20),
    status: "draft",
    images: original.images,
  });
}

export async function bulkUpdateProductStatus(
  ids: string[],
  status: NonNullable<AdminProduct["status"]>
): Promise<number> {
  if (status === "active") return (await bulkActivateProducts(ids)).updated;
  if (status === "archived") return (await bulkArchiveProducts(ids)).updated;
  for (const id of ids) await updateProduct(id, { status });
  return ids.length;
}

export async function bulkDeleteAdminProducts(ids: string[]): Promise<number> {
  return (await bulkDeleteProducts(ids)).deleted;
}

export async function bulkUpdateAdminStock(
  updates: Array<{ id: string; stockQuantity: number }>
): Promise<number> {
  return (
    await bulkUpdateStock(
      updates.map((u) => ({ id: u.id, stock: u.stockQuantity }))
    )
  ).updated;
}

export async function bulkUpdateAdminCategory(
  updates: Array<{ id: string; category: string; categorySlug: string }>
): Promise<number> {
  return (await bulkUpdateCategory(updates)).updated;
}
