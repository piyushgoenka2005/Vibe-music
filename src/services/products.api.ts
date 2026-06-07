import type { Product } from "@/types/product";

interface ProductsResponse {
  products: Product[];
  error?: string;
}

export async function fetchProducts(params?: {
  q?: string;
  category?: string;
  brand?: string;
  sort?: string;
  condition?: Product["condition"];
  limit?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();

  if (params?.q) searchParams.set("q", params.q);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.brand) searchParams.set("brand", params.brand);
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.condition) searchParams.set("condition", params.condition);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const response = await fetch(`/api/products${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ProductsResponse | null;
    throw new Error(body?.error ?? "Unable to load products");
  }

  const data = (await response.json()) as ProductsResponse;
  return data.products ?? [];
}
