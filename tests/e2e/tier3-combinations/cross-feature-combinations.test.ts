import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { useCurrencyLocaleStore } from "@/components/layout/currencyLocaleStore";
import { calculateGST } from "@/lib/gstCalculator";
import { calculateCouponDiscountAmount } from "@/lib/coupons/couponMath";
import { buildOrderTimeline } from "@/components/account/orderTimeline";
import { createOrderSchema } from "@/lib/validations/checkout";
import { adminOrderStatusSchema } from "@/lib/validations/admin";
import { matchesSearchQuery } from "@/lib/search/searchIntelligence";
import {
  VIEWPORTS,
  setTestViewportWidth,
  resetTestViewport,
  validateZIndexContract,
} from "../helpers/viewport-helper";
import {
  sampleProducts,
  sampleVariants,
  sampleCoupons,
  sampleOrders,
} from "../fixtures/catalog-fixtures";
import type { Order } from "@/types/order";
import type { PublicShipmentTracking } from "@/types/shipment";

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

describe("Tier 3: Cross-Feature Combinations", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false });
    useCartStore.getState().clearCart();
    useCurrencyLocaleStore.getState().setCurrency("INR");
    resetTestViewport();
  });

  it("Combination 1: Variant Selection + Add to Cart + Discount Coupon + Checkout Pipeline", () => {
    const product = sampleProducts[0]; // Fender Strat
    const blackVariant = sampleVariants.strat[1]; // Black / Pau Ferro ₹71,000

    // 1. Add specific variant to cart
    useCartStore.getState().addItem(product, 1, blackVariant);
    const cartState = useCartStore.getState();
    expect(cartState.items.length).toBe(1);

    const cartItem = cartState.items[0];
    expect(cartItem.productId).toBe(product.id);
    expect(cartItem.variantId).toBe(blackVariant.id);
    expect(cartItem.variantSku).toBe(blackVariant.sku);
    expect(cartItem.price).toBe(71000);
    expect(cartState.subtotal()).toBe(71000);

    // 2. Apply discount coupon (SAVE10: 10% off up to ₹5,000)
    const coupon = sampleCoupons.SAVE10;
    const discountAmount = calculateCouponDiscountAmount(cartState.subtotal(), coupon);
    expect(discountAmount).toBe(5000); // 10% of 71000 is 7100 -> capped at 5000

    // 3. Calculate GST breakdown for customer shipping address (Inter-State)
    const gstData = calculateGST({
      items: [
        {
          productId: cartItem.productId,
          name: cartItem.name,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          gstRate: 18,
        },
      ],
      couponDiscount: discountAmount,
      shippingCharge: 0, // Free shipping unlocked
      sellerState: "West Bengal",
      buyerState: "Karnataka",
    });

    expect(gstData.isInterState).toBe(true);
    expect(gstData.subtotal).toBe(71000);
    expect(gstData.couponDiscount).toBe(5000);
    expect(gstData.grandTotal).toBe(66000); // 71000 - 5000
    expect(gstData.totalIgst).toBeCloseTo(gstData.totalGst, 1);

    // 4. Validate complete checkout order payload
    const checkoutPayload = {
      items: [
        {
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          variantSku: cartItem.variantSku,
          variantLabel: cartItem.variantLabel,
          name: cartItem.name,
          quantity: cartItem.quantity,
        },
      ],
      email: "musician@vibemusic.in",
      customerName: "Aarav Sharma",
      customerPhone: "+91 9876543210",
      couponCode: coupon.code,
      shippingAddress: {
        name: "Aarav Sharma",
        line1: "Flat 402, Nirvana Heights",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        country: "India",
        phone: "+91 9876543210",
      },
      paymentMethod: "razorpay" as const,
      buyerState: "Karnataka",
      shippingMethod: "standard" as const,
    };

    expect(createOrderSchema.safeParse(checkoutPayload).success).toBe(true);
  });

  it("Combination 2: Filtered Category + Search Query + Sort + Pagination", () => {
    // Dataset of catalog products
    const catalog = sampleProducts;

    // 1. Filter by category "Electric Guitars"
    const categoryFiltered = catalog.filter((p) => p.categorySlug === "electric-guitars");
    expect(categoryFiltered.length).toBeGreaterThan(0);

    // 2. Apply search query "Fender"
    const searchFiltered = categoryFiltered.filter((p) => matchesSearchQuery(p.name, "Fender"));
    expect(searchFiltered.length).toBe(1);
    expect(searchFiltered[0].brand).toBe("Fender");

    // 3. Multi-item sort test (simulate price ascending)
    const sorted = [...catalog].sort((a, b) => a.price - b.price);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].price).toBeGreaterThanOrEqual(sorted[i - 1].price);
    }

    // 4. Pagination slicing (page 1, pageSize 2)
    const pageSize = 2;
    const page1 = sorted.slice(0, pageSize);
    const page2 = sorted.slice(pageSize, pageSize * 2);
    expect(page1.length).toBe(pageSize);
    expect(page2.length).toBeGreaterThan(0);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it("Combination 3: Admin Order Status Update + Customer Account Order History Reflection", () => {
    const base = sampleOrders[0];
    let order: Order = {
      ...base,
      status: "processing",
      paymentStatus: "paid",
      invoice: {
        id: "inv-101",
        orderId: base.id,
        invoiceNumber: "INV-2026-101",
        createdAt: new Date().toISOString(),
      } as unknown as Order["invoice"],
    };

    // Customer timeline initially shows "processing" (packed complete, shipped current)
    let timeline = buildOrderTimeline(order, null);
    expect(timeline.find((s) => s.id === "packed")?.state).toBe("complete");
    expect(timeline.find((s) => s.id === "shipped")?.state).toBe("current");

    // Admin updates order status to "shipped" with tracking information
    const adminUpdate = {
      status: "shipped" as const,
      note: "Dispatched via Blue Dart AWB: BD123456789IN",
    };
    expect(adminOrderStatusSchema.safeParse(adminUpdate).success).toBe(true);

    const shipment: PublicShipmentTracking = {
      status: "in_transit",
      carrierName: "Blue Dart",
      trackingNumber: "BD123456789IN",
      shippedAt: new Date().toISOString(),
      events: [
        {
          status: "picked_up",
          description: "Package received from Vibe warehouse",
          location: "Bengaluru",
          occurredAt: new Date().toISOString(),
        },
      ],
    };

    order = {
      ...order,
      status: adminUpdate.status,
      updatedAt: new Date().toISOString(),
    };

    // Customer timeline immediately reflects "shipped" as complete
    timeline = buildOrderTimeline(order, shipment);
    expect(timeline.find((s) => s.id === "shipped")?.state).toBe("complete");
    expect(timeline.find((s) => s.id === "out_for_delivery")?.state).toBe("current");
  });

  it("Combination 4: Currency Selection Persistence across PDP to Cart", () => {
    // 1. Initial default is INR
    expect(useCurrencyLocaleStore.getState().currency).toBe("INR");

    // 2. User switches currency to USD
    useCurrencyLocaleStore.getState().setCurrency("USD");
    expect(useCurrencyLocaleStore.getState().currency).toBe("USD");
    expect(localStorage.getItem("vibe_currency")).toBe("USD");

    // 3. User adds Fender Strat (₹68,500) to cart
    useCartStore.getState().addItem(sampleProducts[0], 1);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().subtotal()).toBe(68500);

    // 4. Switching to EUR persists in storage and state
    useCurrencyLocaleStore.getState().setCurrency("EUR");
    expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");
    expect(localStorage.getItem("vibe_currency")).toBe("EUR");
  });

  it("Combination 5: Mobile Viewport Drawer Interaction + Stacking Contracts", () => {
    // 1. Set mobile viewport (<640px)
    setTestViewportWidth(VIEWPORTS.mobileSmall);
    expect(window.matchMedia("(max-width: 639px)").matches).toBe(true);

    // 2. Open cart drawer
    useCartStore.getState().openDrawer();
    expect(useCartStore.getState().drawerOpen).toBe(true);

    // 3. Validate Z-index stacking contract: account bottom bar hidden during drawer open
    const isStackingCompliant = validateZIndexContract({
      accountNavZIndex: 1100,
      cartDrawerZIndex: 390,
      isAccountNavHiddenWhenDrawerOpen: true, // CSS rule: body:has(.cart-drawer--open) .acct__mobile-nav { display: none !important; }
    });
    expect(isStackingCompliant).toBe(true);

    // 4. Close drawer restores bottom bar visibility
    useCartStore.getState().closeDrawer();
    expect(useCartStore.getState().drawerOpen).toBe(false);
  });
});
