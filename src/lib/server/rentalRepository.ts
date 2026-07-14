import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue, asStringArray, toIsoString } from "@/lib/server/prisma/mappers";
import type {
  RentalAvailabilityBlock,
  RentalBooking,
  RentalBookingItem,
  RentalCategory,
  RentalInventoryLock,
  RentalInventoryUnit,
  RentalPolicy,
  RentalProduct,
} from "@/types/rental";

function mapCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}): RentalCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    status: row.status,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    productCount: row._count?.products,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapProduct(row: {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  catalogProductId: string | null;
  description: string;
  image: string;
  images: unknown;
  specifications: unknown;
  status: string;
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
  category?: { slug: string; name: string };
}): RentalProduct {
  const specs =
    row.specifications && typeof row.specifications === "object"
      ? (row.specifications as Record<string, string>)
      : {};
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.categoryId,
    categorySlug: row.category?.slug,
    categoryName: row.category?.name,
    catalogProductId: row.catalogProductId,
    description: row.description,
    image: row.image,
    images: asStringArray(row.images),
    specifications: specs,
    status: row.status as RentalProduct["status"],
    totalUnits: row.totalUnits,
    availableUnits: row.availableUnits,
    reservedUnits: row.reservedUnits,
    minDurationHours: row.minDurationHours,
    maxDurationDays: row.maxDurationDays,
    depositAmount: row.depositAmount,
    hourlyRate: row.hourlyRate,
    dailyRate: row.dailyRate,
    weeklyRate: row.weeklyRate,
    monthlyRate: row.monthlyRate,
    pickupAvailable: row.pickupAvailable,
    deliveryAvailable: row.deliveryAvailable,
    deliveryFee: row.deliveryFee,
    pickupFee: row.pickupFee,
    lateFeePerDay: row.lateFeePerDay,
    damagePolicy: row.damagePolicy,
    termsText: row.termsText,
    agreementText: row.agreementText,
    featured: row.featured,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBookingItem(row: {
  id: string;
  bookingId: string;
  productId: string;
  productName: string;
  productSlug: string;
  unitId: string | null;
  quantity: number;
  durationType: string;
  durationUnits: number;
  unitRate: number;
  lineSubtotal: number;
  depositAmount: number;
}): RentalBookingItem {
  return {
    id: row.id,
    bookingId: row.bookingId,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    unitId: row.unitId,
    quantity: row.quantity,
    durationType: row.durationType as RentalBookingItem["durationType"],
    durationUnits: row.durationUnits,
    unitRate: row.unitRate,
    lineSubtotal: row.lineSubtotal,
    depositAmount: row.depositAmount,
  };
}

function mapBooking(row: {
  id: string;
  bookingNumber: string;
  userId: string | null;
  email: string;
  customerName: string;
  customerPhone: string;
  isGuest: boolean;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  durationType: string;
  startAt: string;
  endAt: string;
  fulfillment: string;
  address: unknown;
  subtotal: number;
  depositAmount: number;
  deliveryFee: number;
  pickupFee: number;
  totalGst: number;
  total: number;
  lateFees: number;
  damageCharges: number;
  refundAmount: number;
  agreementAcceptedAt: string | null;
  termsAcceptedAt: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  trackingToken: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  returnedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: Array<Parameters<typeof mapBookingItem>[0]>;
}): RentalBooking {
  const address =
    row.address && typeof row.address === "object"
      ? (row.address as RentalBooking["address"])
      : null;
  return {
    id: row.id,
    bookingNumber: row.bookingNumber,
    userId: row.userId,
    email: row.email,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    isGuest: row.isGuest,
    status: row.status as RentalBooking["status"],
    paymentStatus: row.paymentStatus as RentalBooking["paymentStatus"],
    paymentMethod: row.paymentMethod,
    durationType: row.durationType as RentalBooking["durationType"],
    startAt: row.startAt,
    endAt: row.endAt,
    fulfillment: row.fulfillment as RentalBooking["fulfillment"],
    address,
    subtotal: row.subtotal,
    depositAmount: row.depositAmount,
    deliveryFee: row.deliveryFee,
    pickupFee: row.pickupFee,
    totalGst: row.totalGst,
    total: row.total,
    lateFees: row.lateFees,
    damageCharges: row.damageCharges,
    refundAmount: row.refundAmount,
    agreementAcceptedAt: row.agreementAcceptedAt,
    termsAcceptedAt: row.termsAcceptedAt,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    trackingToken: row.trackingToken,
    cancelledAt: row.cancelledAt,
    cancellationReason: row.cancellationReason,
    returnedAt: row.returnedAt,
    notes: row.notes,
    items: (row.items ?? []).map(mapBookingItem),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listRentalCategories(options?: {
  includeDraft?: boolean;
}): Promise<RentalCategory[]> {
  const rows = await prisma.rentalCategory.findMany({
    where: options?.includeDraft ? undefined : { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return rows.map(mapCategory);
}

export async function getRentalCategoryBySlug(
  slug: string
): Promise<RentalCategory | null> {
  const row = await prisma.rentalCategory.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  return row ? mapCategory(row) : null;
}

export async function listRentalProducts(filters?: {
  categorySlug?: string;
  featured?: boolean;
  status?: string | null;
  search?: string;
}): Promise<RentalProduct[]> {
  const where: Record<string, unknown> = {};
  if (filters?.status !== null && filters?.status !== undefined) {
    where.status = filters.status;
  } else if (filters?.status === undefined) {
    where.status = "active";
  }
  if (filters?.featured) where.featured = true;
  if (filters?.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters?.search?.trim()) {
    where.OR = [
      { name: { contains: filters.search.trim(), mode: "insensitive" } },
      { description: { contains: filters.search.trim(), mode: "insensitive" } },
    ];
  }
  const rows = await prisma.rentalProduct.findMany({
    where,
    include: { category: { select: { slug: true, name: true } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
  return rows.map(mapProduct);
}

export async function getRentalProductBySlug(
  slug: string
): Promise<RentalProduct | null> {
  const row = await prisma.rentalProduct.findUnique({
    where: { slug },
    include: { category: { select: { slug: true, name: true } } },
  });
  return row ? mapProduct(row) : null;
}

export async function getRentalProductById(
  id: string
): Promise<RentalProduct | null> {
  const row = await prisma.rentalProduct.findUnique({
    where: { id },
    include: { category: { select: { slug: true, name: true } } },
  });
  return row ? mapProduct(row) : null;
}

export async function listRentalLocksForProduct(
  productId: string
): Promise<RentalInventoryLock[]> {
  const rows = await prisma.rentalInventoryLock.findMany({
    where: { productId },
  });
  return rows.map((row) => ({
    id: row.id,
    unitId: row.unitId,
    productId: row.productId,
    bookingId: row.bookingId,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status as RentalInventoryLock["status"],
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }));
}

export async function listRentalBlocksForProduct(
  productId: string
): Promise<RentalAvailabilityBlock[]> {
  const rows = await prisma.rentalAvailabilityBlock.findMany({
    where: { productId },
    orderBy: { startAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    unitId: row.unitId,
    startAt: row.startAt,
    endAt: row.endAt,
    reason: row.reason,
    createdAt: row.createdAt,
  }));
}

export async function getRentalPolicy(): Promise<RentalPolicy> {
  const row = await prisma.rentalPolicy.findUnique({ where: { id: "default" } });
  if (row) {
    return {
      id: row.id,
      title: row.title,
      termsHtml: row.termsHtml,
      agreementHtml: row.agreementHtml,
      cancellationPolicy: row.cancellationPolicy,
      lateFeePolicy: row.lateFeePolicy,
      damagePolicy: row.damagePolicy,
      updatedAt: row.updatedAt,
    };
  }
  const now = new Date().toISOString();
  const created = await prisma.rentalPolicy.create({
    data: {
      id: "default",
      title: "Rental Terms",
      termsHtml: "<p>Standard rental terms apply.</p>",
      agreementHtml: "<p>I agree to the rental agreement and deposit terms.</p>",
      cancellationPolicy: "Free cancellation up to 24 hours before pickup.",
      lateFeePolicy: "Late returns incur daily late fees as listed on each product.",
      damagePolicy: "Damage beyond normal wear is charged at repair/replacement cost.",
      updatedAt: now,
    },
  });
  return {
    id: created.id,
    title: created.title,
    termsHtml: created.termsHtml,
    agreementHtml: created.agreementHtml,
    cancellationPolicy: created.cancellationPolicy,
    lateFeePolicy: created.lateFeePolicy,
    damagePolicy: created.damagePolicy,
    updatedAt: created.updatedAt,
  };
}

export async function getRentalBookingById(id: string): Promise<RentalBooking | null> {
  const row = await prisma.rentalBooking.findUnique({
    where: { id },
    include: { items: true },
  });
  return row ? mapBooking(row) : null;
}

export async function getRentalBookingByNumber(
  bookingNumber: string
): Promise<RentalBooking | null> {
  const row = await prisma.rentalBooking.findUnique({
    where: { bookingNumber },
    include: { items: true },
  });
  return row ? mapBooking(row) : null;
}

export async function listRentalBookingsForUser(userId: string): Promise<RentalBooking[]> {
  const rows = await prisma.rentalBooking.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapBooking);
}

export async function listAllRentalBookings(options?: {
  status?: string;
  limit?: number;
}): Promise<RentalBooking[]> {
  const rows = await prisma.rentalBooking.findMany({
    where: options?.status ? { status: options.status } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
  return rows.map(mapBooking);
}

export async function allocateNextRentalBookingNumber(): Promise<string> {
  const year = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    }).format(new Date())
  );
  const key = `rental_booking_${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1000 },
    update: { value: { increment: 1 } },
  });
  const sequence = counter.value;
  return `RNT-${String(sequence).padStart(6, "0")}-${year}`;
}

export async function createRentalBookingRecord(
  booking: Omit<RentalBooking, "items"> & { items: Omit<RentalBookingItem, "id" | "bookingId">[] }
): Promise<RentalBooking> {
  const bookingId = booking.id || randomUUID();
  const now = new Date().toISOString();
  await prisma.rentalBooking.create({
    data: {
      id: bookingId,
      bookingNumber: booking.bookingNumber,
      userId: booking.userId ?? null,
      email: booking.email.trim().toLowerCase(),
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      isGuest: booking.isGuest,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod ?? null,
      durationType: booking.durationType,
      startAt: booking.startAt,
      endAt: booking.endAt,
      fulfillment: booking.fulfillment,
      address: booking.address ? asJsonValue(booking.address) : undefined,
      subtotal: booking.subtotal,
      depositAmount: booking.depositAmount,
      deliveryFee: booking.deliveryFee,
      pickupFee: booking.pickupFee,
      totalGst: booking.totalGst,
      total: booking.total,
      lateFees: booking.lateFees,
      damageCharges: booking.damageCharges,
      refundAmount: booking.refundAmount,
      agreementAcceptedAt: booking.agreementAcceptedAt ?? null,
      termsAcceptedAt: booking.termsAcceptedAt ?? null,
      razorpayOrderId: booking.razorpayOrderId ?? null,
      razorpayPaymentId: booking.razorpayPaymentId ?? null,
      trackingToken: booking.trackingToken ?? null,
      cancelledAt: booking.cancelledAt ?? null,
      cancellationReason: booking.cancellationReason ?? null,
      returnedAt: booking.returnedAt ?? null,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt || now,
      updatedAt: booking.updatedAt || now,
      items: {
        create: booking.items.map((item) => ({
          id: randomUUID(),
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          unitId: item.unitId ?? null,
          quantity: item.quantity,
          durationType: item.durationType,
          durationUnits: item.durationUnits,
          unitRate: item.unitRate,
          lineSubtotal: item.lineSubtotal,
          depositAmount: item.depositAmount,
        })),
      },
      events: {
        create: {
          id: randomUUID(),
          status: booking.status,
          note: "Booking created",
          createdAt: now,
        },
      },
    },
  });
  const saved = await getRentalBookingById(bookingId);
  if (!saved) throw new Error("Failed to create rental booking");
  return saved;
}

export async function updateRentalBookingFields(
  id: string,
  patch: Partial<RentalBooking>
): Promise<RentalBooking> {
  const now = new Date().toISOString();
  await prisma.rentalBooking.update({
    where: { id },
    data: {
      status: patch.status,
      paymentStatus: patch.paymentStatus,
      paymentMethod: patch.paymentMethod,
      razorpayOrderId: patch.razorpayOrderId,
      razorpayPaymentId: patch.razorpayPaymentId,
      lateFees: patch.lateFees,
      damageCharges: patch.damageCharges,
      refundAmount: patch.refundAmount,
      cancelledAt: patch.cancelledAt,
      cancellationReason: patch.cancellationReason,
      returnedAt: patch.returnedAt,
      notes: patch.notes,
      updatedAt: now,
    },
  });
  const saved = await getRentalBookingById(id);
  if (!saved) throw new Error("Rental booking not found");
  return saved;
}

export async function createInventoryLocks(
  locks: Array<Omit<RentalInventoryLock, "id" | "createdAt">>
): Promise<void> {
  const now = new Date().toISOString();
  await prisma.rentalInventoryLock.createMany({
    data: locks.map((lock) => ({
      id: randomUUID(),
      unitId: lock.unitId ?? null,
      productId: lock.productId,
      bookingId: lock.bookingId,
      startAt: lock.startAt,
      endAt: lock.endAt,
      status: lock.status,
      expiresAt: lock.expiresAt ?? null,
      createdAt: now,
    })),
  });
}

export async function releaseInventoryLocksForBooking(bookingId: string): Promise<void> {
  await prisma.rentalInventoryLock.updateMany({
    where: { bookingId, status: { not: "released" } },
    data: { status: "released" },
  });
}

export async function confirmInventoryLocksForBooking(bookingId: string): Promise<void> {
  await prisma.rentalInventoryLock.updateMany({
    where: { bookingId, status: "held" },
    data: { status: "confirmed", expiresAt: null },
  });
}

export async function appendRentalStatusEvent(input: {
  bookingId: string;
  status: string;
  note?: string;
  createdBy?: string;
}): Promise<void> {
  await prisma.rentalStatusEvent.create({
    data: {
      id: randomUUID(),
      bookingId: input.bookingId,
      status: input.status,
      note: input.note ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function addRentalCharge(input: {
  bookingId: string;
  type: string;
  amount: number;
  description?: string;
  createdBy?: string;
}): Promise<void> {
  await prisma.rentalCharge.create({
    data: {
      id: randomUUID(),
      bookingId: input.bookingId,
      type: input.type,
      amount: input.amount,
      description: input.description ?? "",
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
    },
  });
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────

export async function upsertRentalCategory(
  input: Omit<RentalCategory, "productCount">
): Promise<RentalCategory> {
  const now = new Date().toISOString();
  const row = await prisma.rentalCategory.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      status: input.status,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      createdAt: input.createdAt || now,
      updatedAt: now,
    },
    update: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      status: input.status,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      updatedAt: now,
    },
    include: { _count: { select: { products: true } } },
  });
  return mapCategory(row);
}

export async function deleteRentalCategory(id: string): Promise<void> {
  await prisma.rentalCategory.delete({ where: { id } });
}

export async function upsertRentalProduct(
  input: RentalProduct
): Promise<RentalProduct> {
  const now = new Date().toISOString();
  const row = await prisma.rentalProduct.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      slug: input.slug,
      name: input.name,
      categoryId: input.categoryId,
      catalogProductId: input.catalogProductId ?? null,
      description: input.description,
      image: input.image,
      images: asJsonValue(input.images),
      specifications: asJsonValue(input.specifications),
      status: input.status,
      totalUnits: input.totalUnits,
      availableUnits: input.availableUnits,
      reservedUnits: input.reservedUnits,
      minDurationHours: input.minDurationHours,
      maxDurationDays: input.maxDurationDays,
      depositAmount: input.depositAmount,
      hourlyRate: input.hourlyRate,
      dailyRate: input.dailyRate,
      weeklyRate: input.weeklyRate,
      monthlyRate: input.monthlyRate,
      pickupAvailable: input.pickupAvailable,
      deliveryAvailable: input.deliveryAvailable,
      deliveryFee: input.deliveryFee,
      pickupFee: input.pickupFee,
      lateFeePerDay: input.lateFeePerDay,
      damagePolicy: input.damagePolicy,
      termsText: input.termsText,
      agreementText: input.agreementText,
      featured: input.featured,
      createdAt: input.createdAt || now,
      updatedAt: now,
    },
    update: {
      slug: input.slug,
      name: input.name,
      categoryId: input.categoryId,
      catalogProductId: input.catalogProductId ?? null,
      description: input.description,
      image: input.image,
      images: asJsonValue(input.images),
      specifications: asJsonValue(input.specifications),
      status: input.status,
      totalUnits: input.totalUnits,
      availableUnits: input.availableUnits,
      reservedUnits: input.reservedUnits,
      minDurationHours: input.minDurationHours,
      maxDurationDays: input.maxDurationDays,
      depositAmount: input.depositAmount,
      hourlyRate: input.hourlyRate,
      dailyRate: input.dailyRate,
      weeklyRate: input.weeklyRate,
      monthlyRate: input.monthlyRate,
      pickupAvailable: input.pickupAvailable,
      deliveryAvailable: input.deliveryAvailable,
      deliveryFee: input.deliveryFee,
      pickupFee: input.pickupFee,
      lateFeePerDay: input.lateFeePerDay,
      damagePolicy: input.damagePolicy,
      termsText: input.termsText,
      agreementText: input.agreementText,
      featured: input.featured,
      updatedAt: now,
    },
    include: { category: { select: { slug: true, name: true } } },
  });
  return mapProduct(row);
}

export async function deleteRentalProduct(id: string): Promise<void> {
  await prisma.rentalProduct.delete({ where: { id } });
}

export async function listRentalUnits(productId: string): Promise<RentalInventoryUnit[]> {
  const rows = await prisma.rentalInventoryUnit.findMany({
    where: { productId },
    orderBy: { label: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    serialNumber: row.serialNumber,
    label: row.label,
    status: row.status as RentalInventoryUnit["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function upsertRentalUnit(input: RentalInventoryUnit): Promise<RentalInventoryUnit> {
  const now = new Date().toISOString();
  const row = await prisma.rentalInventoryUnit.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      productId: input.productId,
      serialNumber: input.serialNumber ?? null,
      label: input.label,
      status: input.status,
      createdAt: input.createdAt || now,
      updatedAt: now,
    },
    update: {
      serialNumber: input.serialNumber ?? null,
      label: input.label,
      status: input.status,
      updatedAt: now,
    },
  });
  return {
    id: row.id,
    productId: row.productId,
    serialNumber: row.serialNumber,
    label: row.label,
    status: row.status as RentalInventoryUnit["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function upsertRentalPolicy(input: RentalPolicy): Promise<RentalPolicy> {
  const now = new Date().toISOString();
  const row = await prisma.rentalPolicy.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      title: input.title,
      termsHtml: input.termsHtml,
      agreementHtml: input.agreementHtml,
      cancellationPolicy: input.cancellationPolicy,
      lateFeePolicy: input.lateFeePolicy,
      damagePolicy: input.damagePolicy,
      updatedAt: now,
    },
    update: {
      title: input.title,
      termsHtml: input.termsHtml,
      agreementHtml: input.agreementHtml,
      cancellationPolicy: input.cancellationPolicy,
      lateFeePolicy: input.lateFeePolicy,
      damagePolicy: input.damagePolicy,
      updatedAt: now,
    },
  });
  return {
    id: row.id,
    title: row.title,
    termsHtml: row.termsHtml,
    agreementHtml: row.agreementHtml,
    cancellationPolicy: row.cancellationPolicy,
    lateFeePolicy: row.lateFeePolicy,
    damagePolicy: row.damagePolicy,
    updatedAt: row.updatedAt,
  };
}

export async function getRentalAnalyticsSummary(): Promise<{
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  totalDeposits: number;
  lateFeesCollected: number;
  damageChargesCollected: number;
  bookingsByStatus: Record<string, number>;
}> {
  const bookings = await prisma.rentalBooking.findMany({
    select: {
      status: true,
      total: true,
      depositAmount: true,
      lateFees: true,
      damageCharges: true,
      paymentStatus: true,
    },
  });
  const bookingsByStatus: Record<string, number> = {};
  let totalRevenue = 0;
  let totalDeposits = 0;
  let lateFeesCollected = 0;
  let damageChargesCollected = 0;
  let activeBookings = 0;

  for (const booking of bookings) {
    bookingsByStatus[booking.status] = (bookingsByStatus[booking.status] ?? 0) + 1;
    if (booking.paymentStatus === "paid" || booking.paymentStatus === "partial_refund") {
      totalRevenue += booking.total;
      totalDeposits += booking.depositAmount;
    }
    lateFeesCollected += booking.lateFees;
    damageChargesCollected += booking.damageCharges;
    if (["confirmed", "active", "late"].includes(booking.status)) {
      activeBookings += 1;
    }
  }

  return {
    totalBookings: bookings.length,
    activeBookings,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    lateFeesCollected: Math.round(lateFeesCollected * 100) / 100,
    damageChargesCollected: Math.round(damageChargesCollected * 100) / 100,
    bookingsByStatus,
  };
}

export function rentalNowIso(): string {
  return toIsoString(new Date());
}
