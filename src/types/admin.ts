export type AdminRole =
  | "super_admin"
  | "admin"
  | "inventory_manager"
  | "customer_support";

export type Permission =
  | "dashboard:read"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "categories:read"
  | "categories:write"
  | "categories:delete"
  | "orders:read"
  | "orders:write"
  | "orders:refund"
  | "customers:read"
  | "customers:write"
  | "coupons:read"
  | "coupons:write"
  | "coupons:delete"
  | "reviews:read"
  | "reviews:write"
  | "inventory:read"
  | "inventory:write"
  | "analytics:read"
  | "settings:read"
  | "settings:write"
  | "banners:read"
  | "banners:write"
  | "banners:delete"
  | "homepage:read"
  | "homepage:write"
  | "blog:read"
  | "blog:write"
  | "blog:delete"
  | "admins:read"
  | "admins:write"
  | "audit:read"
  | "rentals:read"
  | "rentals:write"
  | "rentals:delete"
  | "giveaways:read"
  | "giveaways:write"
  | "giveaways:delete"
  | "compare:read";

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AdminSession {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: Permission[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  revenueChangePercent: number;
  ordersChangePercent: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

import type { Product, ProductSpec, ProductVideo, ProductVariant } from "@/types/product";

export interface AdminProduct extends Product {
  sku?: string;
  status?: "active" | "draft" | "archived";
  /** Stored MRP — may equal selling price when not on sale. */
  originalPrice?: number;
  salePrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  description?: string;
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  images?: string[];
  /** Ordered frame URLs for PDP 360° view. */
  spin360Images?: string[];
  /** Package contents shown on the PDP In The Box tab. */
  inTheBox?: string[];
  /** Product videos shown on the PDP Videos tab / gallery. */
  videos?: ProductVideo[];
  /** Spec rows shown on the PDP Specs tab (beyond guitarSpecs map). */
  detailSpecs?: ProductSpec[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  label: string;
  type: "percentage" | "flat";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  productId: string;
  productName: string;
  sku?: string;
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  lowStockThreshold: number;
  lastAdjustedAt?: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  delta: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  gstNumber: string;
  defaultGstRate: 5 | 12 | 18 | 28;
  sellerState: string;
  freeShippingThreshold: number;
  standardShippingCharge: number;
  razorpayEnabled: boolean;
  updatedAt: string;
}

export interface AnalyticsReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  ordersByStatus: Record<string, number>;
  revenueByMonth: RevenueDataPoint[];
}
