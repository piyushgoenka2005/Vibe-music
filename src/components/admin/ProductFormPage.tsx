"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { slugify } from "@/lib/slug";
import { ROUTES } from "@/lib/routes";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import type { Category } from "@/types/category";

const EMPTY = {
  name: "",
  slug: "",
  brand: "",
  category: "",
  categorySlug: "",
  price: 0,
  sku: "",
  description: "",
  stockQuantity: 100,
  lowStockThreshold: 10,
  status: "active" as const,
  availability: "in-stock" as const,
  condition: "new" as const,
  gstRate: 18 as const,
  featured: false,
  trending: false,
  newArrival: false,
  images: [] as string[],
};

export default function ProductFormPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!productId);

  useEffect(() => {
    fetch("/api/catalog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setForm({
            ...EMPTY,
            ...d.product,
            featured: d.product.featured ?? false,
            trending: d.product.trending ?? false,
            newArrival: d.product.newArrival ?? false,
            images: d.product.images ?? (d.product.image ? [d.product.image] : []),
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [productId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || slugify(`${form.brand}-${form.name}`);
      const selectedCategory = categories.find(
        (c) => c.slug === form.categorySlug || c.name === form.category
      );
      const payload = {
        ...form,
        slug,
        category: selectedCategory?.name ?? form.category,
        categorySlug: selectedCategory?.slug ?? form.categorySlug ?? slugify(form.category),
        brandSlug: slugify(form.brand),
        image: form.images[0] ?? "",
        images: form.images,
      };
      const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = productId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => router.push(ROUTES.adminProducts),
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  if (!loaded) return <div className="admin-loading">Loading product…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>Name *</label>
            <input className="admin-input" style={{ width: "100%" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-form-group">
            <label>Slug</label>
            <input className="admin-input" style={{ width: "100%" }} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Brand *</label>
            <input className="admin-input" style={{ width: "100%" }} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
          </div>
          <div className="admin-form-group">
            <label>SKU</label>
            <input className="admin-input" style={{ width: "100%" }} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Category *</label>
            <select
              className="admin-select"
              value={form.categorySlug}
              onChange={(e) => {
                const category = categories.find((c) => c.slug === e.target.value);
                setForm({
                  ...form,
                  categorySlug: e.target.value,
                  category: category?.name ?? form.category,
                });
              }}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label>Price (INR) *</label>
            <input className="admin-input" style={{ width: "100%" }} type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          </div>
          <div className="admin-form-group">
            <label>Stock Quantity</label>
            <input className="admin-input" style={{ width: "100%" }} type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
          </div>
          <div className="admin-form-group">
            <label>Status</label>
            <select className="admin-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>GST Rate (%)</label>
            <select className="admin-select" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) as typeof form.gstRate })}>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
            </label>
          </div>
          <div className="admin-form-group">
            <label>
              <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} /> Trending
            </label>
          </div>
          <div className="admin-form-group">
            <label>
              <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} /> New Arrival
            </label>
          </div>
          <ProductImageUpload
            categorySlug={form.categorySlug}
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
          <div className="admin-form-group admin-form-grid--full">
            <label>Description</label>
            <textarea className="admin-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button type="button" className="admin-btn admin-btn--primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Saving…" : productId ? "Update Product" : "Create Product"}
          </button>
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => router.push(ROUTES.adminProducts)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
