export type RentalDurationType = "hourly" | "daily" | "weekly" | "monthly";

export type RentalProductStatus = "active" | "draft" | "archived";

export type RentalBookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "returned"
  | "completed"
  | "cancelled"
  | "late";

export type RentalPaymentStatus =
  | "pending"
  | "paid"
  | "cod_pending"
  | "failed"
  | "refunded"
  | "partial_refund";

export type RentalFulfillment = "pickup" | "delivery";

export type RentalInventoryUnitStatus =
  | "available"
  | "rented"
  | "maintenance"
  | "retired";

export type RentalLockStatus = "held" | "confirmed" | "released";

export interface RentalInventoryLock {
  id: string;
  unitId?: string | null;
  productId: string;
  bookingId: string;
  startAt: string;
  endAt: string;
  status: RentalLockStatus;
  expiresAt?: string | null;
  createdAt: string;
}

export type RentalChargeType =
  | "late_fee"
  | "damage"
  | "delivery"
  | "pickup"
  | "refund"
  | "adjustment";

export interface RentalCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  sortOrder: number;
  status: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RentalProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  catalogProductId?: string | null;
  description: string;
  image: string;
  images: string[];
  specifications: Record<string, string>;
  status: RentalProductStatus;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  minDurationHours: number;
  maxDurationDays: number;
  depositAmount: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number;
  pickupFee: number;
  lateFeePerDay: number;
  damagePolicy: string;
  termsText: string;
  agreementText: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalInventoryUnit {
  id: string;
  productId: string;
  serialNumber?: string | null;
  label: string;
  status: RentalInventoryUnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RentalAvailabilityBlock {
  id: string;
  productId: string;
  unitId?: string | null;
  startAt: string;
  endAt: string;
  reason: string;
  createdAt: string;
}

export interface RentalBookingItem {
  id: string;
  bookingId: string;
  productId: string;
  productName: string;
  productSlug: string;
  unitId?: string | null;
  quantity: number;
  durationType: RentalDurationType;
  durationUnits: number;
  unitRate: number;
  lineSubtotal: number;
  depositAmount: number;
}

export interface RentalAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface RentalBooking {
  id: string;
  bookingNumber: string;
  userId?: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  isGuest: boolean;
  status: RentalBookingStatus;
  paymentStatus: RentalPaymentStatus;
  paymentMethod?: string | null;
  durationType: RentalDurationType;
  startAt: string;
  endAt: string;
  fulfillment: RentalFulfillment;
  address?: RentalAddress | null;
  subtotal: number;
  depositAmount: number;
  deliveryFee: number;
  pickupFee: number;
  totalGst: number;
  total: number;
  lateFees: number;
  damageCharges: number;
  refundAmount: number;
  agreementAcceptedAt?: string | null;
  termsAcceptedAt?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  trackingToken?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  returnedAt?: string | null;
  notes?: string | null;
  items: RentalBookingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RentalPolicy {
  id: string;
  title: string;
  termsHtml: string;
  agreementHtml: string;
  cancellationPolicy: string;
  lateFeePolicy: string;
  damagePolicy: string;
  updatedAt: string;
}

export interface RentalQuoteInput {
  productId?: string;
  productSlug?: string;
  quantity?: number;
  durationType: RentalDurationType;
  startAt: string;
  endAt: string;
  fulfillment: RentalFulfillment;
}

export interface RentalQuoteResult {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  durationType: RentalDurationType;
  durationUnits: number;
  startAt: string;
  endAt: string;
  fulfillment: RentalFulfillment;
  unitRate: number;
  lineSubtotal: number;
  depositAmount: number;
  deliveryFee: number;
  pickupFee: number;
  subtotal: number;
  totalGst: number;
  total: number;
  available: boolean;
  availableUnits: number;
}

export interface CreateRentalBookingPayload {
  items: RentalQuoteInput[];
  email: string;
  customerName: string;
  customerPhone: string;
  fulfillment: RentalFulfillment;
  address?: RentalAddress;
  paymentMethod: "razorpay" | "cod";
  buyerState?: string;
  termsAccepted: boolean;
  agreementAccepted: boolean;
  notes?: string;
}

export interface RentalAvailabilityDay {
  date: string;
  availableUnits: number;
  isBlocked: boolean;
}

export interface RentalAnalyticsSummary {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  totalDeposits: number;
  lateFeesCollected: number;
  damageChargesCollected: number;
  bookingsByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
  topProducts: Array<{ productId: string; name: string; bookings: number; revenue: number }>;
}
