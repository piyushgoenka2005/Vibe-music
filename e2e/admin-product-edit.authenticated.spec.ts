import { test, expect } from "./fixtures";
import { isE2EAdminReady } from "./helpers/admin-ready";
import { e2eMutationHeaders } from "./helpers/e2e-origin";

const adminReady = isE2EAdminReady();
const mutationHeaders = e2eMutationHeaders();

test.describe("Admin product edit roundtrip", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  let productId: string | undefined;

  test.afterAll(async ({ request }) => {
    if (!productId) return;
    await request.delete(`/api/admin/products/${productId}`, {
      headers: mutationHeaders,
    });
  });

  test("create, edit price/images/description, and reload persisted data", async ({ request }) => {
    test.setTimeout(120_000);

    const slug = `e2e-edit-${Date.now()}`;
    const createRes = await request.post("/api/admin/products", {
      headers: mutationHeaders,
      data: {
        name: "E2E Editable Product",
        slug,
        brand: "E2E Brand",
        category: "Guitars",
        categorySlug: "guitars",
        price: 15000,
        originalPrice: 18000,
        sku: `E2E${String(Date.now()).slice(-8)}`,
        stockQuantity: 8,
        status: "active",
        description: "Initial description line",
        images: ["https://cdn.example/e2e-a.jpg", "https://cdn.example/e2e-b.jpg"],
        spin360Images: [],
        variants: [
          {
            label: "Standard",
            sku: `E2E${String(Date.now()).slice(-8)}`,
            price: 15000,
            stock: 8,
            attributes: [],
            isDefault: true,
          },
        ],
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as { product?: { id?: string } };
    productId = created.product?.id;
    expect(productId).toBeTruthy();

    const updateRes = await request.put(`/api/admin/products/${productId}`, {
      headers: mutationHeaders,
      data: {
        price: 16500,
        stockQuantity: 3,
        description: "Updated description after edit",
        images: ["https://cdn.example/e2e-a.jpg"],
        spin360Images: ["https://cdn.example/spin-1.jpg", "https://cdn.example/spin-2.jpg"],
        inTheBox: ["Processor", "Power adapter"],
        detailSpecs: [{ label: "Weight", value: "2.1 kg" }],
      },
    });
    expect(updateRes.ok()).toBeTruthy();

    const getRes = await request.get(`/api/admin/products/${productId}`);
    expect(getRes.ok()).toBeTruthy();
    const loaded = (await getRes.json()) as {
      product?: {
        price?: number;
        stockQuantity?: number;
        description?: string;
        images?: string[];
        spin360Images?: string[];
        inTheBox?: string[];
        detailSpecs?: Array<{ label: string; value: string }>;
      };
    };

    expect(loaded.product?.price).toBe(16500);
    expect(loaded.product?.stockQuantity).toBe(3);
    expect(loaded.product?.description).toContain("Updated description");
    expect(loaded.product?.images).toEqual(["https://cdn.example/e2e-a.jpg"]);
    expect(loaded.product?.spin360Images).toHaveLength(2);
    expect(loaded.product?.inTheBox).toEqual(["Processor", "Power adapter"]);
    expect(loaded.product?.detailSpecs?.[0]?.label).toBe("Weight");
  });
});
