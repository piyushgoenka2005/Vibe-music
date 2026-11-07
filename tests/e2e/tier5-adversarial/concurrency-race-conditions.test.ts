import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { sampleProducts, sampleVariants } from "../fixtures/catalog-fixtures";
import * as couponService from "@/services/coupon.service";

vi.mock("@/store/toastStore", () => ({
  useToastStore: {
    getState: () => ({
      show: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/analytics/events", () => ({
  trackAddToCart: vi.fn(),
  trackRemoveFromCart: vi.fn(),
}));

describe("Tier 5 Adversarial: Concurrency & Race Conditions in Cart & Order State", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false, isApplyingCoupon: false });
    useCartStore.getState().clearCart();
    vi.restoreAllMocks();
  });

  describe("Concurrent Add-to-Cart Operations & Stock Clamping", () => {
    it("enforces strict variant stock limit under 25 concurrent add-to-cart dispatches", async () => {
      const product = sampleProducts[0]; // Fender Strat
      const blackVariant = sampleVariants.strat[1]; // Stock: 5
      expect(blackVariant.stock).toBe(5);

      // Simulate 25 rapid concurrent "Add to Cart" button clicks
      const operations = Array.from({ length: 25 }, () =>
        Promise.resolve().then(() => {
          useCartStore.getState().addItem(product, 1, blackVariant);
        }),
      );

      await Promise.all(operations);

      const items = useCartStore.getState().items;
      expect(items.length).toBe(1);
      // Final quantity must never exceed available variant stock (5)
      expect(items[0].quantity).toBe(5);
      expect(useCartStore.getState().itemCount()).toBe(5);
      expect(useCartStore.getState().subtotal()).toBe(5 * blackVariant.price);
    });

    it("maintains cart integrity and line uniqueness under concurrent multi-product additions", async () => {
      const products = sampleProducts.slice(0, 3);

      // Concurrent additions of multiple distinct products
      const tasks: Promise<void>[] = [];
      for (let i = 0; i < 30; i++) {
        const prod = products[i % products.length];
        tasks.push(
          Promise.resolve().then(() => {
            useCartStore.getState().addItem(prod, 1);
          }),
        );
      }

      await Promise.all(tasks);

      const items = useCartStore.getState().items;
      // Should have at most 3 distinct product lines
      expect(items.length).toBeLessThanOrEqual(3);

      // Total quantity must equal total attempted (each product has stock >= 10)
      const totalQuantity = useCartStore.getState().itemCount();
      expect(totalQuantity).toBe(30);

      // Subtotal must equal sum of item price * quantity
      const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(useCartStore.getState().subtotal()).toBe(calculatedSubtotal);
      expect(useCartStore.getState().subtotal()).toBeGreaterThan(0);
    });
  });

  describe("Asynchronous Coupon Race Conditions", () => {
    it("handles concurrent conflicting coupon applications deterministically without discount duplication", async () => {
      const product = sampleProducts[0]; // ₹68,500
      useCartStore.getState().addItem(product, 1);

      // Mock validateCouponCode to simulate async network latency
      const validateSpy = vi
        .spyOn(couponService, "validateCouponCode")
        .mockImplementation(async (code: string) => {
          await new Promise((resolve) => setTimeout(resolve, code === "SAVE10" ? 20 : 5));
          if (code === "SAVE10") {
            return {
              valid: true,
              coupon: {
                id: "c-10",
                code: "SAVE10",
                type: "percentage",
                value: 10,
                maxDiscountAmount: 5000,
                minOrderAmount: 1000,
                label: "10% Off",
                isActive: true,
                usedCount: 0,
              },
            };
          }
          if (code === "FLAT500") {
            return {
              valid: true,
              coupon: {
                id: "c-500",
                code: "FLAT500",
                type: "fixed_cart",
                value: 500,
                minOrderAmount: 1000,
                label: "₹500 Flat Off",
                isActive: true,
                usedCount: 0,
              },
            };
          }
          return { valid: false, error: "Invalid code" };
        });

      // Dispatch two competing coupon calls simultaneously
      const applySave10 = useCartStore.getState().applyCoupon("SAVE10");
      const applyFlat500 = useCartStore.getState().applyCoupon("FLAT500");

      await Promise.all([applySave10, applyFlat500]);

      const state = useCartStore.getState();
      // Exactly ONE coupon must be active (either SAVE10 or FLAT500)
      expect(["SAVE10", "FLAT500"]).toContain(state.couponCode);
      expect(state.appliedCoupon).not.toBeNull();

      // Discount must NOT stack (must be either 5000 or 500, never 5500)
      const discount = state.discount();
      expect([5000, 500]).toContain(discount);
      expect(discount).not.toBe(5500);

      // Total must be subtotal minus that single discount
      expect(state.total()).toBe(state.subtotal() - discount);
      validateSpy.mockRestore();
    });

    it("survives clearCart triggered while coupon validation is pending in-flight", async () => {
      const product = sampleProducts[0];
      useCartStore.getState().addItem(product, 1);

      // Delayed coupon validation
      vi.spyOn(couponService, "validateCouponCode").mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          valid: true,
          coupon: {
            id: "c-delayed",
            code: "DELAYED",
            type: "fixed_cart",
            value: 1000,
            minOrderAmount: 1000,
            label: "Delayed 1000",
            isActive: true,
            usedCount: 0,
          },
        };
      });

      const applyPromise = useCartStore.getState().applyCoupon("DELAYED");

      // While in flight, customer clears cart
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items.length).toBe(0);

      await applyPromise;

      // Because cart was cleared, total must be 0 and no negative balance
      const state = useCartStore.getState();
      expect(state.subtotal()).toBe(0);
      expect(state.total()).toBe(0);
      expect(state.itemCount()).toBe(0);
    });
  });

  describe("Interleaved Quantity Updates & Invariant Preservation", () => {
    it("preserves non-negative invariants under rapid interleaved updates and removals", () => {
      const product = sampleProducts[0];
      useCartStore.getState().addItem(product, 5);
      const lineId = useCartStore.getState().items[0].lineId;

      // Rapidly interleave updateQuantity calls with arbitrary values
      const mutations = [10, 0, 3, 99, 150, -5, 1, 0, 4];
      for (const targetQty of mutations) {
        useCartStore.setState({ isUpdating: false });
        useCartStore.getState().updateQuantity(lineId, targetQty);

        const currentItems = useCartStore.getState().items;
        for (const item of currentItems) {
          expect(item.quantity).toBeGreaterThanOrEqual(1);
          expect(item.quantity).toBeLessThanOrEqual(99);
          expect(Number.isInteger(item.quantity)).toBe(true);
        }

        expect(useCartStore.getState().subtotal()).toBeGreaterThanOrEqual(0);
        expect(useCartStore.getState().total()).toBeGreaterThanOrEqual(0);
        expect(useCartStore.getState().itemCount()).toBeGreaterThanOrEqual(0);
      }
    });

    it("guarantees pricing state invariants across rapid batch catalog price sync", () => {
      const product1 = sampleProducts[0];
      const product2 = sampleProducts[1];
      useCartStore.getState().addItem(product1, 2);
      useCartStore.getState().addItem(product2, 1);

      // Concurrent catalog price updates (e.g. price drops or increases from flash sale)
      const updates = [
        { productId: product1.id, price: 65000 },
        { productId: product2.id, price: 38000 },
      ];

      useCartStore.getState().applyCatalogPrices(updates);

      const items = useCartStore.getState().items;
      const p1Item = items.find((i) => i.productId === product1.id);
      const p2Item = items.find((i) => i.productId === product2.id);

      expect(p1Item?.price).toBe(65000);
      expect(p2Item?.price).toBe(38000);
      expect(useCartStore.getState().subtotal()).toBe(65000 * 2 + 38000 * 1);
      expect(useCartStore.getState().total()).toBe(65000 * 2 + 38000 * 1);
    });
  });

  describe("Simulated High-Concurrency Inventory Reservation", () => {
    it("simulates atomic inventory depletion where concurrent attempts cannot oversell stock", async () => {
      let availableStock = 3;
      const lock = { isLocked: false };

      // Simulated atomic reservation mimicking SELECT ... FOR UPDATE transaction
      const tryReserveStock = async (orderId: string, quantity: number): Promise<boolean> => {
        // Spin-wait lock acquisition
        while (lock.isLocked) {
          await new Promise((resolve) => setTimeout(resolve, 2));
        }
        lock.isLocked = true;
        try {
          if (availableStock >= quantity) {
            availableStock -= quantity;
            return true;
          }
          return false;
        } finally {
          lock.isLocked = false;
        }
      };

      // 15 concurrent customers attempting to reserve 1 unit each when only 3 are in stock
      const customerAttempts = Array.from({ length: 15 }, (_, i) =>
        tryReserveStock(`order-${i}`, 1),
      );

      const results = await Promise.all(customerAttempts);
      const successes = results.filter((res) => res === true).length;
      const failures = results.filter((res) => res === false).length;

      // Exactly 3 succeed, 12 fail
      expect(successes).toBe(3);
      expect(failures).toBe(12);
      expect(availableStock).toBe(0);
    });
  });
});
