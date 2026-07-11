import type { Prisma } from "@prisma/client";
import type { Brand } from "@/types/brand";
import type { CatalogProduct } from "@/types/catalog";
import type { Category } from "@/types/category";
import type { Order } from "@/types/order";
import type { Review } from "@/types/review";

export function toIsoString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value) return value;
  if (value instanceof Date) return value.toISOString();
  return fallback || new Date().toISOString();
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export function asJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return {};
  return value as Prisma.InputJsonValue;
}

export function productToPrisma(
  product: CatalogProduct
): Prisma.ProductUncheckedCreateInput {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory ?? "",
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercentage: product.discountPercentage ?? 0,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    stock: product.stock ?? 0,
    stockQuantity: product.stock ?? 0,
    reservedStock: product.reservedStock ?? null,
    lowStockThreshold: product.lowStockThreshold ?? null,
    sku: product.sku,
    status: product.status ?? "active",
    featured: product.featured ?? false,
    trending: product.trending ?? false,
    newArrival: product.newArrival ?? false,
    description: product.description ?? "",
    image: product.image ?? "",
    imageColor: product.imageColor ?? "",
    brandSlug: product.brandSlug,
    categorySlug: product.categorySlug,
    availability: product.availability ?? "in-stock",
    condition: product.condition ?? "new",
    gstRate: product.gstRate ?? null,
    images: asJsonValue(product.images ?? []),
    specifications: asJsonValue(product.specifications ?? {}),
    detail: product.detail ? asJsonValue(product.detail) : undefined,
    createdAt: toIsoString(product.createdAt),
    updatedAt: toIsoString(product.updatedAt),
  };
}

export function prismaToProduct(row: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  stock: number;
  reservedStock: number | null;
  lowStockThreshold: number | null;
  sku: string;
  status: string;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  description: string;
  image: string;
  imageColor: string;
  brandSlug: string;
  categorySlug: string;
  availability: string;
  condition: string;
  gstRate: number | null;
  images: unknown;
  specifications: unknown;
  detail: unknown;
  createdAt: string;
  updatedAt: string;
}): CatalogProduct {
  const specifications =
    row.specifications && typeof row.specifications === "object"
      ? (row.specifications as Record<string, string>)
      : {};

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    originalPrice: row.originalPrice,
    discountPercentage: row.discountPercentage,
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    reservedStock: row.reservedStock ?? undefined,
    lowStockThreshold: row.lowStockThreshold ?? undefined,
    sku: row.sku,
    status: row.status as CatalogProduct["status"],
    featured: row.featured,
    trending: row.trending,
    newArrival: row.newArrival,
    images: asStringArray(row.images),
    description: row.description,
    specifications,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    brandSlug: row.brandSlug,
    categorySlug: row.categorySlug,
    availability: row.availability as CatalogProduct["availability"],
    condition: row.condition as CatalogProduct["condition"],
    imageColor: row.imageColor,
    image: row.image,
    gstRate: (row.gstRate ?? undefined) as CatalogProduct["gstRate"],
    detail: row.detail as CatalogProduct["detail"],
  };
}

export function categoryToPrisma(
  category: Category
): Prisma.CategoryUncheckedCreateInput {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    imageUrl: category.imageUrl ?? null,
    isFeatured: category.isFeatured ?? false,
    sortOrder: category.sortOrder ?? 0,
    productCount: category.productCount ?? 0,
  };
}

export function prismaToCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
  };
}

export function brandToPrisma(brand: Brand): Prisma.BrandUncheckedCreateInput {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
  };
}

export function prismaToBrand(row: {
  id: string;
  name: string;
  slug: string;
}): Brand {
  return { id: row.id, name: row.name, slug: row.slug };
}

export function orderToPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
  return {
    id: order.id,
    userId: order.userId ?? null,
    email: order.email,
    trackingToken: order.trackingToken ?? null,
    customerName: order.customerName ?? null,
    customerPhone: order.customerPhone ?? null,
    isGuestOrder: order.isGuestOrder ?? false,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    couponCode: order.couponCode ?? null,
    couponDiscount: order.couponDiscount ?? 0,
    shippingCharge: order.shippingCharge ?? 0,
    shippingMethod: order.shippingMethod ?? null,
    platformFee: order.platformFee ?? 0,
    totalGst: order.totalGst ?? 0,
    cgst: order.cgst ?? 0,
    sgst: order.sgst ?? 0,
    igst: order.igst ?? 0,
    total: order.total,
    items: asJsonValue(order.items),
    shippingAddress: asJsonValue(order.shippingAddress),
    invoice: order.invoice ? asJsonValue(order.invoice) : undefined,
    razorpayOrderId: order.razorpayOrderId ?? null,
    razorpayPaymentId: order.razorpayPaymentId ?? null,
    razorpaySignature: order.razorpaySignature ?? null,
    razorpayRefundId: order.razorpayRefundId ?? null,
    inventoryStatus: order.inventoryStatus ?? null,
    couponUsageApplied: order.couponUsageApplied ?? false,
    paymentCompletedAt: order.paymentCompletedAt ?? null,
    paymentSource: order.paymentSource ?? null,
    paymentFailureReason: order.paymentFailureReason ?? null,
    refundedAt: order.refundedAt ?? null,
    createdAt: toIsoString(order.createdAt),
    updatedAt: toIsoString(order.updatedAt),
  };
}

export function prismaToOrder(row: {
  id: string;
  userId: string | null;
  email: string;
  trackingToken: string | null;
  customerName: string | null;
  customerPhone: string | null;
  isGuestOrder: boolean;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  shippingMethod: string | null;
  platformFee: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: unknown;
  shippingAddress: unknown;
  invoice: unknown;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  razorpayRefundId: string | null;
  inventoryStatus: string | null;
  couponUsageApplied: boolean;
  paymentCompletedAt: string | null;
  paymentSource: string | null;
  paymentFailureReason: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): Order {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    email: row.email,
    trackingToken: row.trackingToken ?? undefined,
    customerName: row.customerName ?? undefined,
    customerPhone: row.customerPhone ?? undefined,
    isGuestOrder: row.isGuestOrder,
    status: row.status as Order["status"],
    paymentStatus: row.paymentStatus as Order["paymentStatus"],
    paymentMethod: row.paymentMethod as Order["paymentMethod"],
    subtotal: row.subtotal,
    couponCode: row.couponCode,
    couponDiscount: row.couponDiscount,
    shippingCharge: row.shippingCharge,
    shippingMethod: (row.shippingMethod ?? undefined) as Order["shippingMethod"],
    platformFee: row.platformFee,
    totalGst: row.totalGst,
    cgst: row.cgst,
    sgst: row.sgst,
    igst: row.igst,
    total: row.total,
    items: (row.items as Order["items"]) ?? [],
    shippingAddress: row.shippingAddress as Order["shippingAddress"],
    invoice: (row.invoice as Order["invoice"]) ?? undefined,
    razorpayOrderId: row.razorpayOrderId ?? undefined,
    razorpayPaymentId: row.razorpayPaymentId ?? undefined,
    razorpaySignature: row.razorpaySignature ?? undefined,
    razorpayRefundId: row.razorpayRefundId,
    inventoryStatus: (row.inventoryStatus ?? undefined) as Order["inventoryStatus"],
    couponUsageApplied: row.couponUsageApplied,
    paymentCompletedAt: row.paymentCompletedAt ?? undefined,
    paymentSource: (row.paymentSource ?? undefined) as Order["paymentSource"],
    paymentFailureReason: row.paymentFailureReason,
    refundedAt: row.refundedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function reviewToPrisma(review: Review): Prisma.ReviewUncheckedCreateInput {
  return {
    id: review.id,
    productId: review.productId,
    productName: review.productName,
    productSlug: review.productSlug,
    userId: review.userId,
    userEmail: review.userEmail ?? null,
    author: review.author,
    rating: review.rating,
    title: review.title,
    body: review.body,
    images: asJsonValue(review.images),
    hasImages: review.hasImages,
    verifiedPurchase: review.verifiedPurchase,
    orderId: review.orderId ?? null,
    status: review.status,
    adminReply: review.adminReply ?? null,
    rejectionReason: review.rejectionReason ?? null,
    helpfulCount: review.helpfulCount,
    createdAt: toIsoString(review.createdAt),
    updatedAt: toIsoString(review.updatedAt),
  };
}

export function prismaToReview(row: {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  userEmail: string | null;
  author: string;
  rating: number;
  title: string;
  body: string;
  images: unknown;
  hasImages: boolean;
  verifiedPurchase: boolean;
  orderId: string | null;
  status: string;
  adminReply: string | null;
  rejectionReason: string | null;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}): Review {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    userId: row.userId,
    userEmail: row.userEmail ?? undefined,
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    images: asStringArray(row.images),
    hasImages: row.hasImages,
    verifiedPurchase: row.verifiedPurchase,
    orderId: row.orderId ?? undefined,
    status: row.status as Review["status"],
    adminReply: row.adminReply ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    helpfulCount: row.helpfulCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
