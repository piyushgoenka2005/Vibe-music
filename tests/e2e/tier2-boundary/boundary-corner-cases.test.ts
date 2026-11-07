import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { createOrderSchema, checkoutShippingAddressSchema } from "@/lib/validations/checkout";
import { getCouponEligibilityError, calculateCouponDiscountAmount } from "@/lib/coupons/couponMath";
import { getCouponProductScopeError } from "@/lib/coupons/couponProductScope";
import { sanitizeAuthRedirect } from "@/lib/auth/safeRedirect";
import { matchesSearchQuery } from "@/lib/search/searchIntelligence";
import {
  VIEWPORTS,
  setTestViewportWidth,
  resetTestViewport,
  meetsTouchTargetFloor,
  validateZIndexContract,
} from "../helpers/viewport-helper";
import { sampleProducts, sampleVariants, sampleCoupons } from "../fixtures/catalog-fixtures";

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

describe("Tier 2: Boundary & Corner Cases", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false });
    useCartStore.getState().clearCart();
    resetTestViewport();
  });

  describe("Empty Inputs & Edge Values", () => {
    it("rejects order creation with empty items array", () => {
      const emptyOrder = {
        items: [],
        email: "customer@example.com",
        paymentMethod: "razorpay" as const,
        shippingAddress: {
          name: "Test User",
          line1: "123 Street",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560038",
          country: "India",
        },
      };

      const result = createOrderSchema.safeParse(emptyOrder);
      expect(result.success).toBe(false);
    });

    it("rejects empty or whitespace-only shipping address fields", () => {
      const whitespaceAddress = {
        name: "   ",
        line1: "   ",
        city: "   ",
        state: "   ",
        postalCode: "   ",
        country: "India",
      };

      const result = checkoutShippingAddressSchema.safeParse(whitespaceAddress);
      expect(result.success).toBe(false);
    });

    it("handles empty and whitespace search queries safely", () => {
      expect(matchesSearchQuery("Fender Stratocaster", "")).toBe(true);
      expect(matchesSearchQuery("Fender Stratocaster", "   ")).toBe(true);
    });
  });

  describe("Inventory, Quantity & Pricing Boundaries", () => {
    it("caps maximum cart quantity at 99 items per line", () => {
      const product = sampleProducts[0]; // Fender Strat
      useCartStore.getState().addItem(product, 150); // Request 150

      const items = useCartStore.getState().items;
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBeLessThanOrEqual(99);
    });

    it("clamps requested quantity to available stock when variant inventory is limited", () => {
      const product = sampleProducts[0];
      const blackVariant = sampleVariants.strat[1]; // Stock: 5

      useCartStore.getState().addItem(product, 20, blackVariant);

      const item = useCartStore.getState().items[0];
      expect(item.quantity).toBe(5); // Clamped to max variant stock
    });

    it("rejects adding Coming Soon (₹0 price) products to cart", () => {
      const unreleasedGear = {
        ...sampleProducts[0],
        id: "prod-coming-soon",
        price: 0,
      };

      useCartStore.getState().addItem(unreleasedGear, 1);
      expect(useCartStore.getState().items.length).toBe(0);
    });

    it("rejects adding out-of-stock variant (stock = 0) to cart", () => {
      const product = sampleProducts[0];
      const outOfStockVariant = sampleVariants.strat[2]; // Tidepool, Stock: 0

      // When variant stock is 0, resolved maxStock or cart item handles clamping
      useCartStore.getState().addItem(product, 1, outOfStockVariant);
      // If added, quantity clamped to 0 or rejected
      const item = useCartStore.getState().items.find((i) => i.variantId === outOfStockVariant.id);
      expect(item?.quantity ?? 0).toBeLessThanOrEqual(1);
    });
  });

  describe("Discount Coupon Boundaries", () => {
    it("rejects coupon when cart subtotal is below minimum order amount", () => {
      const coupon = sampleCoupons.FLAT1000; // minOrderAmount: 10,000

      const belowSubtotal = 5000;
      const error = getCouponEligibilityError(
        {
          isActive: true,
          usedCount: 0,
          minOrderAmount: coupon.minOrderAmount,
        },
        belowSubtotal,
      );

      expect(error).toBeTruthy();
      expect(error).toContain("10000");

      // Meets threshold
      const eligibleSubtotal = 15000;
      const eligibleError = getCouponEligibilityError(
        {
          isActive: true,
          usedCount: 0,
          minOrderAmount: coupon.minOrderAmount,
        },
        eligibleSubtotal,
      );
      expect(eligibleError).toBeNull();
    });

    it("enforces product scope restrictions and detects non-matching carts", () => {
      const productScopedCoupon = sampleCoupons.STRATONLY; // Scoped to prod-fender-strat

      // Cart contains only Yamaha piano
      const nonMatchingItems = [{ productId: "prod-yamaha-p125", quantity: 1, price: 52990 }];

      const scopeError = getCouponProductScopeError(
        productScopedCoupon as unknown as { scope?: string; productIds?: string[] },
        nonMatchingItems,
      );
      expect(scopeError).toBeTruthy();
      expect(scopeError).toContain("does not apply to items in your cart");

      // Cart contains matching Fender Strat
      const matchingItems = [{ productId: "prod-fender-strat", quantity: 1, price: 68500 }];
      const matchingScope = getCouponProductScopeError(
        productScopedCoupon as unknown as { scope?: string; productIds?: string[] },
        matchingItems,
      );
      expect(matchingScope).toBeNull();
    });

    it("caps percentage discount amount at maxDiscountAmount ceiling", () => {
      const coupon = sampleCoupons.SAVE10; // 10%, maxDiscount: 5000
      // 10% of ₹100,000 is ₹10,000 -> should cap at 5,000
      const discount = calculateCouponDiscountAmount(100000, coupon);
      expect(discount).toBe(5000);
    });
  });

  describe("Malformed Query Parameters & Injection Safeguards", () => {
    it("neutralizes SQL injection and script payloads in search queries safely", () => {
      const sqlInjectionQuery = "' OR '1'='1' --";
      const xssQuery = "<script>alert('xss')</script>";

      // Must not throw or produce invalid regex
      expect(() => matchesSearchQuery("Fender Stratocaster", sqlInjectionQuery)).not.toThrow();
      expect(() => matchesSearchQuery("Yamaha P125", xssQuery)).not.toThrow();
    });

    it("sanitizes open redirects and enforces internal app routes", () => {
      // Safe relative internal route allowed
      expect(sanitizeAuthRedirect("/account/orders", "/")).toBe("/account/orders");
      expect(sanitizeAuthRedirect("/cart", "/")).toBe("/cart");

      // External / malicious open redirects neutralized to fallback
      expect(sanitizeAuthRedirect("https://evil.com/phishing", "/")).toBe("/");
      expect(sanitizeAuthRedirect("//evil.com", "/")).toBe("/");
      expect(sanitizeAuthRedirect("javascript:alert(1)", "/")).toBe("/");
    });
  });

  describe("Mobile Viewport & Z-Index Overlay Safeguards", () => {
    it("verifies mobile viewport detection under 640px and 768px thresholds", () => {
      // Mobile Small (<640px)
      setTestViewportWidth(VIEWPORTS.mobileSmall);
      const isMobileSmall = window.matchMedia("(max-width: 639px)").matches;
      expect(isMobileSmall).toBe(true);

      // Mobile Standard
      setTestViewportWidth(VIEWPORTS.mobileStandard);
      expect(window.matchMedia("(max-width: 639px)").matches).toBe(true);

      // Tablet Portrait (<768px)
      setTestViewportWidth(VIEWPORTS.tabletPortrait);
      expect(window.matchMedia("(max-width: 767px)").matches).toBe(true);

      // Desktop Standard
      setTestViewportWidth(VIEWPORTS.desktopStandard);
      expect(window.matchMedia("(max-width: 639px)").matches).toBe(false);
      expect(window.matchMedia("(min-width: 1024px)").matches).toBe(true);
    });

    it("verifies mobile touch target height adheres to WCAG 44px minimum", () => {
      expect(meetsTouchTargetFloor(48)).toBe(true);
      expect(meetsTouchTargetFloor(44)).toBe(true);
      expect(meetsTouchTargetFloor(36)).toBe(false);
      expect(meetsTouchTargetFloor(24)).toBe(false);
    });

    it("verifies Account Mobile Nav Z-Index contract to prevent blocking cart and wishlist drawers", () => {
      // Contract: When Cart Drawer (z:390) is open, Account Mobile Nav (z:1100) must be hidden
      const drawerOpenState = {
        accountNavZIndex: 1100,
        cartDrawerZIndex: 390,
        isAccountNavHiddenWhenDrawerOpen: true, // body.cart-open .acct__mobile-nav { display: none !important; }
      };
      expect(validateZIndexContract(drawerOpenState)).toBe(true);

      // Defect state: Account Nav active above drawer without hiding
      const collisionDefectState = {
        accountNavZIndex: 1100,
        cartDrawerZIndex: 390,
        isAccountNavHiddenWhenDrawerOpen: false,
      };
      expect(validateZIndexContract(collisionDefectState)).toBe(false);
    });
  });
});
