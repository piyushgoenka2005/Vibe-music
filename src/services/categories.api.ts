import type { Category } from "@/types/category";

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/catalog/categories", { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load categories");
  const data = (await res.json()) as { categories: Category[] };
  return data.categories ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await fetchCategories();
  return categories.find((c) => c.slug === slug);
}
