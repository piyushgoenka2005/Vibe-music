import type { GSTRate, GSTInvoiceData } from "@/lib/gstCalculator";

import type { OrderInventoryStatus } from "@/types/inventory";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cod_pending"
  | "refunded";

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

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    variantId?: string;
    variantSku?: string;
    variantLabel?: string;
    name: string;
    quantity: number;
    price: number;
    gstRate: GSTRate;
  }>;
  email: string;
  customerName?: string;
  customerPhone?: string;
  couponCode?: string | null;
  couponDiscount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  buyerState: string;
}

export interface CreateRazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
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
}
