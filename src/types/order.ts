import type { GSTRate, GSTInvoiceData } from "@/lib/gstCalculator";
import type { ShippingMethod } from "@/lib/shipping/shippingMethods";

import type { OrderInventoryStatus } from "@/types/inventory";

export type OrderStatus =
  "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "cod_pending" | "refunded";

export type PaymentMethod = "razorpay" | "cod";

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  /** Unit price excluding GST. */
  price: number;
  gstRate: GSTRate;
  taxableAmount?: number;
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface Order {
  id: string;
  userId?: string;
  email: string;
  /** Secret token for guest order tracking and reservation release. */
  trackingToken?: string;
  /** Customer display name (shipping name or guest name). */
  customerName?: string;
  /** Customer phone for guest orders and notifications. */
  customerPhone?: string;
  isGuestOrder?: boolean;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  couponCode?: string | null;
  couponDiscount: number;
  shippingCharge: number;
  shippingMethod?: ShippingMethod;
  platformFee: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  invoice?: GSTInvoiceData;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpayRefundId?: string | null;
  inventoryStatus?: OrderInventoryStatus;
  couponUsageApplied?: boolean;
  paymentCompletedAt?: string;
  paymentSource?: "client_verify" | "webhook";
  paymentFailureReason?: string | null;
  refundedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Client/API request line — prices are never accepted from the browser. */
export interface CreateOrderRequestItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  /** Optional display hint for errors before catalog lookup. */
  name?: string;
  quantity: number;
}

/** Checkout POST body from the storefront (no client totals). */
export interface CreateOrderRequest {
  items: CreateOrderRequestItem[];
  email: string;
  customerName?: string;
  customerPhone?: string;
  couponCode?: string | null;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  buyerState?: string;
  shippingMethod?: ShippingMethod;
}

export interface ResolvedOrderItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: GSTRate;
}

/** Server-side order creation input after catalog repricing. */
export interface CreateOrderPayload {
  items: ResolvedOrderItem[];
  email: string;
  customerName?: string;
  customerPhone?: string;
  couponCode?: string | null;
  couponDiscount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  buyerState: string;
  shippingMethod?: ShippingMethod;
}

export interface CreateRazorpayOrderResponse {
  orderId: string;
  trackingToken?: string;
  demoMode?: boolean;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}

export interface ResumePaymentResponse {
  orderId: string;
  email: string;
  demoMode: boolean;
  razorpay?: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
  shipping?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface DemoPaymentResponse {
  success: boolean;
  orderId: string;
  redirectUrl: string;
  order?: Order;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
  paymentStatus: PaymentStatus;
  order?: Order;
}
