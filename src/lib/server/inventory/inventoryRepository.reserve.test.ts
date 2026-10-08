import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const productUpdate = vi.fn();
const orderFindUnique = vi.fn();
const orderUpdate = vi.fn();
const productFindMany = vi.fn();
const inventoryLogCreate = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        $queryRaw: queryRaw,
        product: {
          findMany: productFindMany,
          update: productUpdate,
        },
        order: {
          findUnique: orderFindUnique,
          update: orderUpdate,
        },
        inventoryLog: {
          create: inventoryLogCreate,
        },
      };
      await fn(tx);
    }),
  },
}));

vi.mock("@/lib/server/storeCatalogRepository", () => ({
  invalidateCatalogCache: vi.fn(),
}));

import { reserveStockForOrder } from "@/lib/server/inventoryRepository";

const productRow = {
  id: "prod_1",
  name: "Last Unit Guitar",
  sku: "GUITAR-1",
  stock: 1,
  stockQuantity: 1,
  reservedStock: 0,
  lowStockThreshold: 2,
  status: "active",
  availability: "in-stock",
  detail: null,
};

describe("reserveStockForOrder (L-24)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([]);
    productFindMany.mockResolvedValue([productRow]);
    orderFindUnique.mockResolvedValue({ id: "ord_1", inventoryStatus: "none" });
    productUpdate.mockResolvedValue({});
    orderUpdate.mockResolvedValue({});
    inventoryLogCreate.mockResolvedValue({});
  });

  it("acquires row locks before reserving stock", async () => {
    await reserveStockForOrder("ord_1", [
      { productId: "prod_1", quantity: 1, name: "Last Unit Guitar" },
    ]);

    expect(queryRaw).toHaveBeenCalled();
    const sql = String(queryRaw.mock.calls[0]?.[0] ?? "");
    expect(sql).toContain("FOR UPDATE");
  });

  it("rejects reservation when available stock is insufficient", async () => {
    productFindMany.mockResolvedValue([{ ...productRow, stock: 1, reservedStock: 1 }]);

    await expect(
      reserveStockForOrder("ord_2", [
        { productId: "prod_1", quantity: 1, name: "Last Unit Guitar" },
      ]),
    ).rejects.toThrow(/Insufficient stock/);

    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("simulates concurrent last-unit checkout — second reservation fails after first reserves", async () => {
    let reserved = 0;
    productFindMany.mockImplementation(async () => [
      {
        ...productRow,
        reservedStock: reserved,
      },
    ]);
    productUpdate.mockImplementation(async ({ data }: { data: { reservedStock: number } }) => {
      reserved = data.reservedStock;
      return {};
    });

    await reserveStockForOrder("ord_a", [
      { productId: "prod_1", quantity: 1, name: "Last Unit Guitar" },
    ]);

    await expect(
      reserveStockForOrder("ord_b", [
        { productId: "prod_1", quantity: 1, name: "Last Unit Guitar" },
      ]),
    ).rejects.toThrow(/Insufficient stock/);

    expect(reserved).toBe(1);
  });
});
