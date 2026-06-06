"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { ROUTES } from "@/lib/routes";
import type { Product } from "@/types/product";

export default function AdminProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/products");
      const data = (await response.json()) as { products?: Product[] };
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function seedCatalog() {
    setMessage(null);
    const response = await fetch("/api/catalog/seed", { method: "POST" });
    const data = (await response.json()) as { seeded?: number; error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Seed failed");
      return;
    }
    setMessage(`Seeded ${data.seeded ?? 0} products to Firestore.`);
    await loadProducts();
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  return (
    <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Products</h1>
      <AdminNav active={ROUTES.adminProducts} />
      <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
        <button type="button" className="sw-btn sw-btn-blue" onClick={seedCatalog}>
          Seed catalog to Firestore
        </button>
        <button type="button" className="sw-btn" onClick={() => void loadProducts()}>
          Refresh
        </button>
      </div>
      {message ? <p style={{ color: "#0072ba" }}>{message}</p> : null}
      {loading ? (
        <p style={{ color: "#807f7e" }}>Loading products...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Name</th>
              <th align="left">Brand</th>
              <th align="left">Price</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: "8px 0" }}>{product.name}</td>
                <td>{product.brand}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="sw-btn"
                    onClick={() => void deleteProduct(product.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
