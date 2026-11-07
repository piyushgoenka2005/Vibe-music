import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "node:crypto";
import { useCartStore } from "@/store/cartStore";
import { buildCartMilestoneState } from "@/lib/cart/cartMilestones";
import { calculateGST } from "@/lib/gstCalculator";
import { calculateCouponDiscountAmount } from "@/lib/coupons/couponMath";
import { calculateRentalLine, calculateRentalTotals } from "@/lib/rental/pricingEngine";
import { countAvailableUnits } from "@/lib/rental/availabilityEngine";
import { createOrderSchema, verifyPaymentSchema } from "@/lib/validations/checkout";
import { adminProductSchema } from "@/lib/validations/admin";
import { adminRentalStatusSchema } from "@/lib/validations/admin-rental";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/signature";
import { matchesSearchQuery } from "@/lib/search/searchIntelligence";
import { isPurchasablePrice } from "@/utils/currency";
import {
  sampleProducts,
  sampleVariants,
  sampleCoupons,
  sampleRentalProducts,
} from "../fixtures/catalog-fixtures";

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

describe("Tier 4: Real-World Application Scenarios", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false });
    useCartStore.getState().clearCart();
  });

  it("Scenario 1: Complete End-to-End Purchasing Journey", () => {
    // Step 1: Customer lands on store and searches for "Stratocaster"
    const searchQuery = "Stratocaster";
    const matchingProducts = sampleProducts.filter((product) =>
      matchesSearchQuery(product.name, searchQuery),
    );
    expect(matchingProducts.length).toBeGreaterThan(0);
    const selectedProduct = matchingProducts[0];
    expect(selectedProduct.slug).toBe("fender-player-stratocaster");

    // Step 2: Customer views PDP and selects variant (3-Color Sunburst / Maple)
    const variants = sampleVariants.strat;
    const selectedVariant = variants.find((v) => v.isDefault) ?? variants[0];
    expect(selectedVariant.sku).toBe("FEN-0144502500");
    expect(selectedVariant.price).toBe(68500);

    // Step 3: Customer adds variant to cart
    useCartStore.getState().addItem(selectedProduct, 1, selectedVariant);
    const cart = useCartStore.getState();
    expect(cart.items.length).toBe(1);
    expect(cart.subtotal()).toBe(68500);

    // Step 4: Cart verifies free shipping rewards unlocked
    const promoConfig = {
      freeShippingThreshold: 5000,
      freeGiftThreshold: 0,
      giftProductId: null,
      giftProduct: null,
    };
    const milestoneState = buildCartMilestoneState(cart.subtotal(), promoConfig);
    expect(milestoneState.milestones[0].unlocked).toBe(true);

    // Step 5: Customer applies coupon "SAVE10" (10% off, max 5,000)
    const coupon = sampleCoupons.SAVE10;
    const discount = calculateCouponDiscountAmount(cart.subtotal(), coupon);
    expect(discount).toBe(5000);

    // Step 6: Customer calculates GST invoice breakdown
    const gstData = calculateGST({
      items: [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: 1,
          unitPrice: selectedVariant.price,
          gstRate: 18,
        },
      ],
      couponDiscount: discount,
      shippingCharge: 0,
      sellerState: "West Bengal",
      buyerState: "Delhi",
    });
    expect(gstData.isInterState).toBe(true);
    expect(gstData.grandTotal).toBe(63500); // 68500 - 5000

    // Step 7: Customer places order
    const orderPayload = {
      items: [
        {
          productId: selectedProduct.id,
          variantId: selectedVariant.id,
          variantSku: selectedVariant.sku,
          variantLabel: selectedVariant.label,
          name: selectedProduct.name,
          quantity: 1,
        },
      ],
      email: "delhi.musician@example.com",
      customerName: "Kabir Mehra",
      customerPhone: "+91 9811122233",
      couponCode: coupon.code,
      shippingAddress: {
        name: "Kabir Mehra",
        line1: "15 Connaught Place",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
        phone: "+91 9811122233",
      },
      paymentMethod: "razorpay" as const,
      buyerState: "Delhi",
      shippingMethod: "standard" as const,
    };
    expect(createOrderSchema.safeParse(orderPayload).success).toBe(true);

    // Step 8: Razorpay payment gateway authorizes transaction and verifies cryptographic signatures
    const razorpayOrderId = "order_RzpLive1001";
    const razorpayPaymentId = "pay_RzpLive2002";
    const razorpaySecret = "rzp_secret_production_key_445566";
    const validSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        validSignature,
        razorpaySecret,
      ),
    ).toBe(true);

    // Step 9: Razorpay webhook confirms payment capture
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            amount: 6350000,
            status: "captured",
          },
        },
      },
    });
    const webhookSecret = "whsec_webhook_secret_prod_7788";
    const webhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    expect(verifyRazorpayWebhookSignature(webhookPayload, webhookSig, webhookSecret)).toBe(true);

    // Step 10: Verify payment verification schema
    expect(
      verifyPaymentSchema.safeParse({
        orderId: "ord-new-1001",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: validSignature,
      }).success,
    ).toBe(true);
  });

  it("Scenario 2: Complete Rental Booking Lifecycle", () => {
    const rentalGear = sampleRentalProducts[0]; // Yamaha P-125 Digital Piano

    // Step 1: Customer selects 7-day rental dates
    const startDate = "2026-12-10T10:00:00Z";
    const endDate = "2026-12-17T10:00:00Z";

    // Step 2: System checks unit availability against existing locks
    const availabilityCtx = {
      product: { ...rentalGear, totalUnits: 2 },
      locks: [],
      blocks: [],
      now: "2026-12-01T00:00:00Z",
    };
    const availableUnits = countAvailableUnits(availabilityCtx, startDate, endDate);
    expect(availableUnits).toBe(2);

    // Step 3: Compute rental line and grand total quote
    const rentalLine = calculateRentalLine({
      product: rentalGear,
      quantity: 1,
      durationType: "weekly",
      startAt: startDate,
      endAt: endDate,
      fulfillment: "delivery",
    });

    expect(rentalLine.unitRate).toBe(5000);
    expect(rentalLine.lineSubtotal).toBe(5000);
    expect(rentalLine.depositAmount).toBe(10000);
    expect(rentalLine.deliveryFee).toBe(600);

    const totals = calculateRentalTotals({
      lines: [rentalLine],
      gstRate: 18,
    });
    expect(totals.subtotal).toBe(5000);
    expect(totals.depositAmount).toBe(10000);
    expect(totals.total).toBeGreaterThan(15000);

    // Step 4: Admin reviews and approves rental booking
    const adminApproval = {
      status: "confirmed" as const,
      note: "Rental booking approved, Yamaha P-125 assigned serial #YAM-P125-9988",
    };
    expect(adminRentalStatusSchema.safeParse(adminApproval).success).toBe(true);

    // Step 5: Gear active in customer possession -> returned in good condition -> deposit refund
    const completionUpdate = {
      status: "completed" as const,
      note: "Gear returned with zero damage; full ₹10,000 security deposit refund released to customer card",
    };
    expect(adminRentalStatusSchema.safeParse(completionUpdate).success).toBe(true);
  });

  it("Scenario 3: Complete Admin Catalog Onboarding Lifecycle", () => {
    // Step 1: Admin configures new high-end stage piano product with variants and HSN tax
    const newStagePiano = {
      id: "prod-nord-stage-4",
      slug: "nord-stage-4-88-stage-keyboard",
      name: "Nord Stage 4 88-Key Flagship Stage Keyboard",
      brand: "Nord",
      brandSlug: "nord",
      category: "Keyboards & Pianos",
      categorySlug: "keyboards",
      subcategory: "Stage Keyboards",
      price: 435000,
      originalPrice: 460000,
      sku: "NRD-STAGE4-88",
      gstRate: 18,
      stockQuantity: 4,
      availability: "in-stock" as const,
      condition: "new" as const,
      status: "active" as const,
      description:
        "Nord Stage 4 features a brand-new panel design with dedicated LED faders for each layer.",
      featured: true,
      variants: [
        {
          id: "var-nord-stage-4-red",
          sku: "NRD-STAGE4-88-RED",
          label: "Nord Signature Red / 88 Triple Sensor Keybed",
          price: 435000,
          stock: 4,
          isDefault: true,
          attributes: [
            { type: "color", name: "Color", value: "Nord Red" },
            { type: "size", name: "Keys", value: "88 Weighted" },
          ],
        },
      ],
    };

    // Step 2: Validate product schema passes all business constraints
    const validationResult = adminProductSchema.safeParse(newStagePiano);
    expect(validationResult.success).toBe(true);

    // Step 3: Product pricing is valid and purchasable
    expect(isPurchasablePrice(newStagePiano.price)).toBe(true);

    // Step 4: Product is instantly searchable by name, brand, or category keywords
    expect(matchesSearchQuery(newStagePiano.name, "Nord Stage 4")).toBe(true);
    expect(matchesSearchQuery(newStagePiano.name, "Keyboard")).toBe(true);
    expect(matchesSearchQuery(newStagePiano.name, "Nord")).toBe(true);

    // Step 5: Storefront customer can add newly onboarded product to cart
    useCartStore
      .getState()
      .addItem(
        newStagePiano as unknown as (typeof sampleProducts)[0],
        1,
        newStagePiano.variants[0] as unknown as (typeof sampleVariants.strat)[0],
      );

    const cart = useCartStore.getState();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].sku || cart.items[0].variantSku).toBe("NRD-STAGE4-88-RED");
    expect(cart.subtotal()).toBe(435000);
  });
});
