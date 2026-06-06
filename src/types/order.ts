import type { CartItem } from "@/store/cartStore";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  slug?: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string | null;
  email: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentProvider: "razorpay" | "demo";
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  userId: string | null;
  email: string;
  items: CartItem[];
  shipping: ShippingAddress;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
}

export interface OrderTrackingResult {
  order: Order;
  found: true;
}
