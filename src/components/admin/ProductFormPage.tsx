"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { slugify } from "@/lib/slug";
import { ROUTES } from "@/lib/routes";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import ProductBundleEditor, {
  createEmptyBundleState,
  type ProductBundleFormState,
} from "@/components/admin/ProductBundleEditor";
import ProductRelatedEditor, {
  createEmptyRelatedState,
  type ProductRelatedFormState,
} from "@/components/admin/ProductRelatedEditor";
import ProductVariantsEditor from "@/components/admin/ProductVariantsEditor";
import GuitarSpecsEditor, {
  extractGuitarSpecsFromRecord,
} from "@/components/admin/GuitarSpecsEditor";
import ProductDescriptionBulletsEditor from "@/components/admin/ProductDescriptionBulletsEditor";
import ProductInTheBoxEditor from "@/components/admin/ProductInTheBoxEditor";
import ProductSpecsEditor from "@/components/admin/ProductSpecsEditor";
import ProductVideosEditor from "@/components/admin/ProductVideosEditor";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import type { ProductSpec, ProductVariant, ProductVideo } from "@/types/product";

const EMPTY = {
  name: "",
  slug: "",
  brand: "",
  category: "",
  categorySlug: "",
  subcategory: "",
  price: 0,
  originalPrice: 0,
  sku: "",
  description: "",
  stockQuantity: 100,
  lowStockThreshold: 10,
  status: "active" as "active" | "draft" | "archived",
  availability: "in-stock" as "in-stock" | "out-of-stock" | "limited",
  condition: "new" as "new" | "used" | "open-box",
  gstRate: 18 as 5 | 12 | 18 | 28,
  featured: false,
  trending: false,
  newArrival: false,
  images: [] as string[],
  spin360Images: [] as string[],
  variants: [] as ProductVariant[],
  bundle: createEmptyBundleState(),
  related: createEmptyRelatedState(),
  guitarSpecs: {} as Record<string, string>,
  inTheBox: [] as string[],
  videos: [] as ProductVideo[],
  detailSpecs: [] as ProductSpec[],
};

type AdminProductFormState = typeof EMPTY;

function prepareVariantsForSave(
  variants: ProductVariant[],
  price: number,
  stockQuantity: number,
): ProductVariant[] {
  const sanitized = variants.map((variant) => ({
    ...variant,
    attributes: (variant.attributes ?? []).filter((attr) => attr.value.trim()),
    images: (variant.images ?? []).filter(Boolean),
  }));
  if (sanitized.length !== 1) return sanitized;
  const only = sanitized[0];
  if (!only) return sanitized;
  return [
    {
      ...only,
      price,
      stock: stockQuantity,
      isDefault: only.isDefault ?? true,
    },
  ];
}

function mapAdminProductToForm(product: Record<string, unknown>): AdminProductFormState {
  return {
    ...EMPTY,
    ...product,
    subcategory: (product.subcategory as string) ?? "",
    featured: (product.featured as boolean) ?? false,
    trending: (product.trending as boolean) ?? false,
    newArrival: (product.newArrival as boolean) ?? false,
    images: (product.images as string[]) ?? (product.image ? [product.image as string] : []),
    spin360Images: (product.spin360Images as string[]) ?? [],
    variants: (product.variants as ProductVariant[]) ?? [],
    bundle: createEmptyBundleState(),
    related: createEmptyRelatedState(),
    guitarSpecs: extractGuitarSpecsFromRecord(
      product.specifications as Record<string, string> | undefined,
    ),
    inTheBox: (product.inTheBox as string[]) ?? [],
    videos: (product.videos as ProductVideo[]) ?? [],
    detailSpecs: (product.detailSpecs as ProductSpec[]) ?? [],
  };
}

export default function ProductFormPage({
  productId,
  readOnly = false,
}: {
  productId?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
  const [loaded, setLoaded] = useState(!productId);

  useEffect(() => {
    fetch("/api/catalog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => undefined);

    fetch("/api/admin/brands")
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((d) => setBrands(Array.isArray(d.brands) ? d.brands : []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const activeCategory = form.category || form.categorySlug;
    let active = true;

    if (!activeCategory) {
      Promise.resolve().then(() => {
        if (active) setSubcategoryOptions([]);
      });
      return () => {
        active = false;
      };
    }

    fetch(`/api/admin/taxonomy/subcategories?category=${encodeURIComponent(activeCategory)}`)
      .then((r) => (r.ok ? r.json() : { subcategories: [] }))
      .then((d) => {
        if (!active || !Array.isArray(d.subcategories)) return;
        setSubcategoryOptions(d.subcategories);
        if (form.subcategory && !d.subcategories.includes(form.subcategory)) {
          setIsCustomSubcategory(true);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [form.category, form.categorySlug, form.subcategory]);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setForm(mapAdminProductToForm(d.product));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    fetch(`/api/admin/products/${productId}/bundle`)
      .then((r) => r.json())
      .then((d) => {
        if (d.bundle) {
          setForm((prev) => ({
            ...prev,
            bundle: {
              relatedProductIds: d.bundle.relatedProductIds ?? [],
              discountPercent: d.bundle.discountPercent ?? 8,
              isActive: d.bundle.isActive !== false,
            },
          }));
        }
      })
      .catch(() => undefined);

    fetch(`/api/admin/products/${productId}/related`)
      .then((r) => r.json())
      .then((d) => {
        if (d.related) {
          setForm((prev) => ({
            ...prev,
            related: {
              relatedProductIds: d.related.relatedProductIds ?? [],
              isActive: d.related.isActive !== false,
            },
          }));
        }
      })
      .catch(() => undefined);
  }, [productId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.slug || `${form.brand}-${form.name}`);
      const selectedCategory = categories.find(
        (c) => c.slug === form.categorySlug || c.name === form.category,
      );
      const categoryName = selectedCategory?.name ?? form.category;
      const categorySlug = selectedCategory?.slug ?? form.categorySlug ?? slugify(form.category);
      const guitarSpecs = isGuitarProduct(categorySlug, categoryName)
        ? Object.fromEntries(Object.entries(form.guitarSpecs).filter(([, value]) => value.trim()))
        : {};
      const { bundle: _bundle, related: _related, guitarSpecs: _guitarSpecs, ...formFields } = form;
      const payload = {
        ...formFields,
        subcategory: form.subcategory.trim(),
        slug,
        category: categoryName,
        categorySlug,
        brandSlug: slugify(form.brand),
        stockQuantity: form.stockQuantity,
        image: form.images[0] ?? "",
        images: form.images,
        spin360Images: form.spin360Images,
        variants: prepareVariantsForSave(form.variants, form.price, form.stockQuantity),
        guitarSpecs,
        inTheBox: form.inTheBox.map((item) => item.trim()).filter(Boolean),
        videos: form.videos.filter((v) => v.title.trim() && v.embedUrl.trim()),
        detailSpecs: form.detailSpecs.filter((s) => s.label.trim() && s.value.trim()),
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
      const saved = await res.json();
      const savedId = productId ?? saved.product?.id;
      let bundlePayload: {
        bundle?: { relatedProductIds?: string[]; discountPercent?: number; isActive?: boolean };
      } = {};
      let relatedPayload: { related?: { relatedProductIds?: string[]; isActive?: boolean } } = {};

      if (savedId) {
        const bundleRes = await fetch(`/api/admin/products/${savedId}/bundle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            relatedProductIds: form.bundle.relatedProductIds,
            discountPercent: form.bundle.discountPercent,
            isActive: form.bundle.isActive,
            productName: form.name,
            productSlug: slug,
          }),
        });
        if (!bundleRes.ok) {
          const bundleData = await bundleRes.json();
          throw new Error(bundleData.error ?? "Bundle save failed");
        }
        bundlePayload = await bundleRes.json();

        const relatedRes = await fetch(`/api/admin/products/${savedId}/related`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            relatedProductIds: form.related.relatedProductIds,
            isActive: form.related.isActive,
            productName: form.name,
            productSlug: slug,
          }),
        });
        if (!relatedRes.ok) {
          const relatedData = await relatedRes.json();
          throw new Error(relatedData.error ?? "Related products save failed");
        }
        relatedPayload = await relatedRes.json();
      }
      return { ...saved, ...bundlePayload, ...relatedPayload };
    },
    onSuccess: async (saved) => {
      // Drop cached list so the products page always refetches after create/edit.
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      queryClient.removeQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-homepage-product-count"],
        refetchType: "active",
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-categories"],
        refetchType: "active",
      });
      setError(null);
      setSaveSuccess(productId ? "Product updated successfully." : "Product created successfully.");
      if (productId && saved?.product) {
        setForm({
          ...mapAdminProductToForm(saved.product),
          bundle: saved.bundle
            ? {
                relatedProductIds: saved.bundle.relatedProductIds ?? [],
                discountPercent: saved.bundle.discountPercent ?? 8,
                isActive: saved.bundle.isActive !== false,
              }
            : createEmptyBundleState(),
          related: saved.related
            ? {
                relatedProductIds: saved.related.relatedProductIds ?? [],
                isActive: saved.related.isActive !== false,
              }
            : createEmptyRelatedState(),
        });
        setDescriptionEditorKey((key) => key + 1);
        router.refresh();
        return;
      }
      if (saved?.product?.id) {
        router.push(`${ROUTES.adminProducts}/${saved.product.id}`);
        router.refresh();
        return;
      }
      router.push(ROUTES.adminProducts);
      router.refresh();
    },
    onError: (err) => {
      setSaveSuccess(null);
      setError(err instanceof Error ? err.message : "Save failed");
    },
  });

  if (!loaded) return <div className="admin-loading">Loading product…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        <fieldset
          disabled={readOnly}
          className="admin-form-grid"
          style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className="admin-form-group">
            <label htmlFor="product-form-name">Name *</label>
            <input
              id="product-form-name"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-slug">Slug</label>
            <input
              id="product-form-slug"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-brand">Brand *</label>
            <input
              id="product-form-brand"
              className="admin-input"
              style={{ width: "100%" }}
              list="product-brand-options"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
              placeholder="Select or type a brand"
            />
            <datalist id="product-brand-options">
              {brands.map((brand) => (
                <option key={brand.id} value={brand.name} />
              ))}
            </datalist>
            <p className="admin-form-hint" style={{ marginTop: "0.35rem" }}>
              Brands from{" "}
              <a href={ROUTES.adminBrands} className="admin-link">
                Brands admin
              </a>{" "}
              appear here — you can still type a new name.
            </p>
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-sku">SKU</label>
            <input
              id="product-form-sku"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-category">Category *</label>
            <select
              id="product-form-category"
              className="admin-select"
              value={form.categorySlug}
              onChange={(e) => {
                const category = categories.find((c) => c.slug === e.target.value);
                setForm({
                  ...form,
                  categorySlug: e.target.value,
                  category: category?.name ?? form.category,
                  subcategory: "",
                });
                setIsCustomSubcategory(false);
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.25rem",
              }}
            >
              <label htmlFor="product-form-subcategory" style={{ margin: 0 }}>
                Subcategory
              </label>
              {subcategoryOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomSubcategory(!isCustomSubcategory)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--admin-primary, #6366f1)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {isCustomSubcategory ? "Choose from list" : "Enter custom"}
                </button>
              )}
            </div>
            {!isCustomSubcategory && subcategoryOptions.length > 0 ? (
              <select
                id="product-form-subcategory"
                className="admin-select"
                value={form.subcategory ?? ""}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="product-form-subcategory"
                className="admin-input"
                style={{ width: "100%" }}
                value={form.subcategory ?? ""}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                placeholder={
                  form.category
                    ? "e.g. Electric Guitars, Bass Guitars..."
                    : "Select a category first or enter subcategory"
                }
              />
            )}
          </div>
          <div className="admin-form-grid--pricing" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="product-form-mrp">MRP (INR)</label>
              <input
                id="product-form-mrp"
                className="admin-input"
                style={{ width: "100%" }}
                type="number"
                min={0}
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                placeholder="Original list price"
              />
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="product-form-price">Selling Price (INR) *</label>
              <input
                id="product-form-price"
                className="admin-input"
                style={{ width: "100%" }}
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <p
            style={{
              gridColumn: "1 / -1",
              margin: "-0.25rem 0 0",
              fontSize: "0.8125rem",
              color: "var(--admin-muted)",
            }}
          >
            When MRP is higher than selling price, the storefront shows MRP struck through with the
            selling price.
          </p>
          <div className="admin-form-group">
            <label htmlFor="product-form-stock">Stock Quantity</label>
            <input
              id="product-form-stock"
              className="admin-input"
              style={{ width: "100%" }}
              type="number"
              min={0}
              value={form.stockQuantity}
              onChange={(e) => {
                const stockQuantity = Number(e.target.value);
                const availability =
                  stockQuantity <= 0
                    ? "out-of-stock"
                    : stockQuantity <= form.lowStockThreshold
                      ? "limited"
                      : "in-stock";
                setForm({ ...form, stockQuantity, availability });
              }}
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-low-stock">Low Stock Threshold</label>
            <input
              id="product-form-low-stock"
              className="admin-input"
              style={{ width: "100%" }}
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => {
                const lowStockThreshold = Number(e.target.value);
                const availability =
                  form.stockQuantity <= 0
                    ? "out-of-stock"
                    : form.stockQuantity <= lowStockThreshold
                      ? "limited"
                      : form.availability === "out-of-stock" || form.availability === "limited"
                        ? "in-stock"
                        : form.availability;
                setForm({ ...form, lowStockThreshold, availability });
              }}
            />
            <p className="admin-form-hint" style={{ marginTop: "0.35rem" }}>
              Dashboard and inventory alerts fire when stock is at or below this number.
            </p>
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-availability">Availability</label>
            <select
              id="product-form-availability"
              className="admin-select"
              value={form.availability}
              onChange={(e) =>
                setForm({
                  ...form,
                  availability: e.target.value as typeof form.availability,
                })
              }
            >
              <option value="in-stock">In stock</option>
              <option value="limited">Limited</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-status">Status</label>
            <select
              id="product-form-status"
              className="admin-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-condition">Condition</label>
            <select
              id="product-form-condition"
              className="admin-select"
              value={form.condition}
              onChange={(e) =>
                setForm({
                  ...form,
                  condition: e.target.value as typeof form.condition,
                })
              }
            >
              <option value="new">New</option>
              <option value="used">Used / pre-owned</option>
              <option value="open-box">Open box</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label htmlFor="product-form-gst">GST Rate (%)</label>
            <select
              id="product-form-gst"
              className="admin-select"
              value={form.gstRate}
              onChange={(e) =>
                setForm({ ...form, gstRate: Number(e.target.value) as typeof form.gstRate })
              }
            >
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>
          <div className="admin-form-grid--pricing">
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />{" "}
                Featured
              </label>
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.trending}
                  onChange={(e) => setForm({ ...form, trending: e.target.checked })}
                />{" "}
                Trending
              </label>
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.newArrival}
                  onChange={(e) => setForm({ ...form, newArrival: e.target.checked })}
                />{" "}
                New Arrival
              </label>
            </div>
          </div>
          <ProductImageUpload
            categorySlug={form.categorySlug}
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
          <div className="admin-form-grid--full">
            <h3 className="admin-section-title" style={{ marginBottom: "0.5rem" }}>
              360° view frames
            </h3>
            <p
              style={{ color: "var(--admin-muted)", marginBottom: "0.75rem", fontSize: "0.875rem" }}
            >
              Upload an ordered sequence of product frames (minimum 2). Leave empty to hide the 360°
              viewer on the PDP.
            </p>
            <ProductImageUpload
              categorySlug={form.categorySlug}
              images={form.spin360Images}
              onChange={(spin360Images) => setForm({ ...form, spin360Images })}
            />
          </div>
          <div className="admin-form-grid--full">
            <ProductVariantsEditor
              parentSku={form.sku || "VM-00000"}
              basePrice={form.price || 0}
              variants={form.variants}
              productImages={form.images}
              onChange={(variants) => setForm({ ...form, variants })}
            />
          </div>
          {productId || form.name ? (
            <div className="admin-form-grid--full">
              <ProductRelatedEditor
                productId={productId}
                currentProductName={form.name}
                related={form.related}
                onChange={(related: ProductRelatedFormState) => setForm({ ...form, related })}
              />
              <ProductBundleEditor
                productId={productId}
                currentProductName={form.name}
                currentProductSlug={form.slug || slugify(`${form.brand}-${form.name}`)}
                bundle={form.bundle}
                onChange={(bundle: ProductBundleFormState) => setForm({ ...form, bundle })}
              />
            </div>
          ) : null}
          <ProductDescriptionBulletsEditor
            key={`${productId ?? "new"}-${descriptionEditorKey}`}
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
          />
          <ProductInTheBoxEditor
            items={form.inTheBox}
            onChange={(inTheBox) => setForm({ ...form, inTheBox })}
          />
          <ProductSpecsEditor
            specs={form.detailSpecs}
            onChange={(detailSpecs) => setForm({ ...form, detailSpecs })}
          />
          <ProductVideosEditor
            videos={form.videos}
            onChange={(videos) => setForm({ ...form, videos })}
          />
          {isGuitarProduct(form.categorySlug, form.category) ? (
            <GuitarSpecsEditor
              specs={form.guitarSpecs}
              onChange={(guitarSpecs) => setForm({ ...form, guitarSpecs })}
            />
          ) : null}
        </fieldset>
        {saveSuccess ? (
          <p className="admin-form-success" role="status">
            {saveSuccess}
          </p>
        ) : null}
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          {!readOnly ? (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : productId ? "Update Product" : "Create Product"}
            </button>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => router.push(ROUTES.adminProducts)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
