import "server-only";

import { randomUUID } from "crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { isPrismaUnavailableError } from "@/lib/db/prisma-errors";
import { asJsonValue, asStringArray, toIsoString } from "./mappers";
import { clampPageLimit, pageFromRows } from "./pagination";
import type { StoreSettings } from "@/types/admin";
import type { Coupon, CouponRedemption } from "@/types/admin";
import type { CreateBannerInput, HomepageBanner, UpdateBannerInput } from "@/types/banner";
import type {
  BlogAnalyticsSummary,
  BlogComment,
  BlogCommentStatus,
  BlogPost,
  CreateBlogPostInput,
} from "@/types/blog";
import type { ProductReviewStats } from "@/types/review";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  type CreateHomepageSectionInput,
  type HomepageSection,
  type HomepageSectionItem,
  type HomepageSectionKey,
  type UpdateHomepageSectionInput,
  type UpdateHomepageSectionItemInput,
} from "@/types/homepage";

function assertPostgresForWrite(): void {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for content writes");
  }
}

function mapBanner(row: {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    image: row.image,
    mobileImage: row.mobileImage ?? undefined,
    ctaText: row.ctaText,
    ctaLink: row.ctaLink,
    startDate: row.startDate,
    endDate: row.endDate,
    priority: row.priority,
    status: row.status as "active" | "inactive",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseCouponProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
}

function mapCoupon(row: {
  id: string;
  code: string;
  label: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount?: number | null;
  maxUses: number | null;
  maxUsesPerUser?: number | null;
  usedCount: number;
  isActive: boolean;
  kind?: string | null;
  referralOwnerUserId?: string | null;
  referralOwnerEmail?: string | null;
  parentCouponId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  scope?: string | null;
  productIds?: unknown;
  pdpHeadline?: string | null;
  pdpOfferLine?: string | null;
  pdpMaxDiscountLine?: string | null;
  pdpTermsLine?: string | null;
  pdpDisclaimer?: string | null;
  pdpFooter?: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}): Coupon {
  const productIds = parseCouponProductIds(row.productIds);
  const scope = row.scope === "products" && productIds.length > 0 ? "products" : "store";

  return {
    id: row.id,
    code: row.code,
    label: row.label,
    type: row.type as Coupon["type"],
    value: row.value,
    minOrderAmount: row.minOrderAmount ?? undefined,
    maxDiscountAmount: row.maxDiscountAmount ?? undefined,
    maxUses: row.maxUses ?? undefined,
    maxUsesPerUser: row.maxUsesPerUser ?? undefined,
    usedCount: row.usedCount,
    isActive: row.isActive,
    kind: row.kind === "referral" ? "referral" : "standard",
    referralOwnerUserId: row.referralOwnerUserId ?? undefined,
    referralOwnerEmail: row.referralOwnerEmail ?? undefined,
    parentCouponId: row.parentCouponId ?? undefined,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    utmContent: row.utmContent ?? undefined,
    scope,
    productIds: scope === "products" ? productIds : [],
    pdpHeadline: row.pdpHeadline ?? undefined,
    pdpOfferLine: row.pdpOfferLine ?? undefined,
    pdpMaxDiscountLine: row.pdpMaxDiscountLine ?? undefined,
    pdpTermsLine: row.pdpTermsLine ?? undefined,
    pdpDisclaimer: row.pdpDisclaimer ?? undefined,
    pdpFooter: row.pdpFooter ?? undefined,
    startsAt: row.startsAt ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCouponRedemption(row: {
  id: string;
  couponId: string;
  couponCode: string;
  userId: string | null;
  customerEmail: string | null;
  orderId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  createdAt: string;
}): CouponRedemption {
  return {
    id: row.id,
    couponId: row.couponId,
    couponCode: row.couponCode,
    userId: row.userId ?? undefined,
    customerEmail: row.customerEmail ?? undefined,
    orderId: row.orderId ?? undefined,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    utmContent: row.utmContent ?? undefined,
    createdAt: row.createdAt,
  };
}

export async function listAllBanners() {
  if (!isPostgresConfigured()) return [];
  try {
    const rows = await prisma.banner.findMany({ orderBy: { priority: "asc" } });
    return rows.map(mapBanner);
  } catch (error) {
    if (isPrismaUnavailableError(error)) return [];
    throw error;
  }
}

export async function getBannerById(id: string) {
  if (!isPostgresConfigured()) return null;
  try {
    const row = await prisma.banner.findUnique({ where: { id } });
    return row ? mapBanner(row) : null;
  } catch (error) {
    if (isPrismaUnavailableError(error)) return null;
    throw error;
  }
}

function mapBlogContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") return JSON.stringify(content);
  return "";
}

function mapBlogPostRow(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  contentFormat: string;
  coverImage: string;
  tags: unknown;
  categorySlug?: string;
  categoryLabel?: string;
  featured?: boolean;
  authorBio?: string;
  authorAvatar?: string;
  viewCount?: number;
  seoTitle: string;
  seoDescription: string;
  status: string;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: mapBlogContent(row.content),
    contentFormat: "tiptap_json",
    coverImage: row.coverImage,
    tags: asStringArray(row.tags),
    categorySlug: row.categorySlug ?? "",
    categoryLabel: row.categoryLabel ?? "",
    featured: Boolean(row.featured),
    authorBio: row.authorBio ?? "",
    authorAvatar: row.authorAvatar ?? "",
    viewCount: row.viewCount ?? 0,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    status: row.status as BlogPost["status"],
    authorId: row.authorId,
    authorName: row.authorName,
    publishedAt: row.publishedAt ?? null,
    scheduledAt: row.scheduledAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBlogCommentRow(row: {
  id: string;
  postId: string;
  authorName: string;
  email: string;
  body: string;
  status: string;
  createdAt: string;
}): BlogComment {
  return {
    id: row.id,
    postId: row.postId,
    authorName: row.authorName,
    email: row.email,
    body: row.body,
    status: row.status as BlogComment["status"],
    createdAt: row.createdAt,
  };
}

export async function listAllBlogPosts() {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(mapBlogPostRow);
}

export async function getBlogPostById(id: string) {
  const posts = await listAllBlogPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function getBlogPostBySlug(slug: string) {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  if (!row) return null;
  return mapBlogPostRow(row);
}

export async function listHomepageSections() {
  if (!isPostgresConfigured()) return [];
  return prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function listHomepageSectionItems(sectionKey?: string) {
  if (!isPostgresConfigured()) return [];
  return prisma.homepageSectionItem.findMany({
    where: sectionKey ? { sectionKey } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function listCoupons(): Promise<Coupon[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapCoupon);
}

export interface CouponPageOptions {
  limit?: number;
  /** ISO timestamp of the last row on the previous page (keyset cursor). */
  afterCreatedAt?: string;
}

/** SQL-level keyset pagination — never materializes the whole coupons table. */
export async function listCouponPage(
  options: CouponPageOptions = {},
): Promise<{ coupons: Coupon[]; hasMore: boolean; nextCursor?: string }> {
  if (!isPostgresConfigured()) return { coupons: [], hasMore: false };
  const limit = clampPageLimit(options.limit);

  const rows = await prisma.coupon.findMany({
    where: options.afterCreatedAt ? { createdAt: { lt: options.afterCreatedAt } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const page = pageFromRows(rows, limit, (row) => row.createdAt);
  return {
    coupons: page.items.map(mapCoupon),
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export async function countCoupons(): Promise<number> {
  if (!isPostgresConfigured()) return 0;
  return prisma.coupon.count();
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase() },
  });
  return row ? mapCoupon(row) : null;
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.coupon.findUnique({ where: { id } });
  return row ? mapCoupon(row) : null;
}

export async function getReferralCouponForUser(userId: string): Promise<Coupon | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.coupon.findFirst({
    where: { kind: "referral", referralOwnerUserId: userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapCoupon(row) : null;
}

export async function countCouponRedemptionsForUser(
  couponId: string,
  options: { userId?: string | null; customerEmail?: string | null },
): Promise<number> {
  if (!isPostgresConfigured()) return 0;

  const userId = options.userId?.trim();
  const email = options.customerEmail?.trim().toLowerCase();

  if (!userId && !email) return 0;

  const orFilters: Array<{ userId: string } | { customerEmail: string }> = [];
  if (userId) orFilters.push({ userId });
  if (email) orFilters.push({ customerEmail: email });

  return prisma.couponRedemption.count({
    where: {
      couponId,
      OR: orFilters,
    },
  });
}

export async function getStoreSettings(): Promise<StoreSettings | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  if (!row) return null;
  return {
    storeName: row.storeName,
    storeEmail: row.storeEmail,
    storePhone: row.storePhone,
    storeAddress: row.storeAddress,
    gstNumber: row.gstNumber,
    defaultGstRate: row.defaultGstRate as StoreSettings["defaultGstRate"],
    sellerState: row.sellerState,
    freeShippingThreshold: row.freeShippingThreshold,
    standardShippingCharge: row.standardShippingCharge,
    razorpayEnabled: row.razorpayEnabled,
    updatedAt: toIsoString(row.updatedAt),
  };
}

export async function getProductReviewStats(productId: string) {
  if (!isPostgresConfigured()) return null;
  try {
    const row = await prisma.productReviewStats.findUnique({
      where: { productId },
    });
    if (!row) return null;
    return {
      productId: row.productId,
      totalReviews: row.totalReviews,
      averageRating: row.averageRating,
      distribution: row.distribution as Record<string, number>,
      verifiedCount: row.verifiedCount,
      withImagesCount: row.withImagesCount,
      lastReviewAt: row.lastReviewAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[reviews] getProductReviewStats failed", error);
    return null;
  }
}

function now(): string {
  return new Date().toISOString();
}

function bannerDate(value: string | null | undefined): string {
  return value ?? "";
}

export async function createBanner(input: CreateBannerInput): Promise<HomepageBanner> {
  const id = randomUUID();
  const timestamp = now();
  const banners = await listAllBanners();
  const priority =
    input.priority !== undefined
      ? input.priority
      : banners.length === 0
        ? 0
        : Math.max(...banners.map((b) => b.priority)) + 1;

  const banner: HomepageBanner = {
    id,
    title: input.title?.trim() || "",
    subtitle: input.subtitle?.trim() || undefined,
    image: input.image.trim(),
    mobileImage: input.mobileImage?.trim() || undefined,
    ctaText: input.ctaText?.trim() || "",
    ctaLink: input.ctaLink?.trim() || "/search",
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    priority,
    status: input.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await prisma.banner.create({
    data: {
      id: banner.id,
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? null,
      image: banner.image,
      mobileImage: banner.mobileImage ?? null,
      ctaText: banner.ctaText ?? "",
      ctaLink: banner.ctaLink ?? "/search",
      startDate: bannerDate(banner.startDate),
      endDate: bannerDate(banner.endDate),
      priority: banner.priority,
      status: banner.status,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    },
  });

  return banner;
}

export async function updateBannerRecord(
  id: string,
  input: UpdateBannerInput,
): Promise<HomepageBanner> {
  const existing = await getBannerById(id);
  if (!existing) throw new Error("Banner not found");

  const timestamp = now();
  const updated: HomepageBanner = {
    ...existing,
    title: input.title !== undefined ? input.title.trim() : (existing.title ?? ""),
    subtitle: input.subtitle !== undefined ? input.subtitle.trim() || undefined : existing.subtitle,
    image: input.image !== undefined ? input.image.trim() : existing.image,
    mobileImage:
      input.mobileImage !== undefined
        ? input.mobileImage.trim() || undefined
        : existing.mobileImage,
    ctaText: input.ctaText !== undefined ? input.ctaText.trim() : (existing.ctaText ?? ""),
    ctaLink:
      input.ctaLink !== undefined
        ? input.ctaLink.trim() || "/search"
        : (existing.ctaLink ?? "/search"),
    startDate: input.startDate !== undefined ? input.startDate : existing.startDate,
    endDate: input.endDate !== undefined ? input.endDate : existing.endDate,
    priority: input.priority !== undefined ? input.priority : existing.priority,
    status: input.status !== undefined ? input.status : existing.status,
    updatedAt: timestamp,
  };

  await prisma.banner.update({
    where: { id },
    data: {
      title: updated.title ?? "",
      subtitle: updated.subtitle ?? null,
      image: updated.image,
      mobileImage: updated.mobileImage ?? null,
      ctaText: updated.ctaText ?? "",
      ctaLink: updated.ctaLink ?? "/search",
      startDate: bannerDate(updated.startDate),
      endDate: bannerDate(updated.endDate),
      priority: updated.priority,
      status: updated.status,
      updatedAt: updated.updatedAt,
    },
  });

  return updated;
}

export async function deleteBannerRecord(id: string): Promise<void> {
  await prisma.banner.delete({ where: { id } });
}

export async function reorderBannerRecords(orderedIds: string[]): Promise<HomepageBanner[]> {
  const timestamp = now();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.banner.update({
        where: { id },
        data: { priority: index, updatedAt: timestamp },
      }),
    ),
  );
  return listAllBanners();
}

export async function blogSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const row = await prisma.blogPost.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return Boolean(row);
}

export async function createBlogPostRecord(
  input: CreateBlogPostInput & {
    id: string;
    slug: string;
    publishedAt: string | null;
    scheduledAt: string | null;
    createdAt: string;
    updatedAt: string;
  },
): Promise<BlogPost> {
  await prisma.blogPost.create({
    data: {
      id: input.id,
      slug: input.slug,
      title: input.title.trim(),
      excerpt: input.excerpt?.trim() ?? "",
      content: asJsonValue(input.content),
      contentFormat: "tiptap_json",
      coverImage: input.coverImage?.trim() ?? "",
      tags: asJsonValue(input.tags ?? []),
      categorySlug: input.categorySlug?.trim() ?? "",
      categoryLabel: input.categoryLabel?.trim() ?? "",
      featured: Boolean(input.featured),
      authorBio: input.authorBio?.trim() ?? "",
      authorAvatar: input.authorAvatar?.trim() ?? "",
      viewCount: 0,
      seoTitle: input.seoTitle?.trim() ?? "",
      seoDescription: input.seoDescription?.trim() ?? "",
      status: input.status,
      authorId: input.authorId,
      authorName: input.authorName,
      publishedAt: input.publishedAt,
      scheduledAt: input.scheduledAt,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    },
  });
  return (await getBlogPostById(input.id)) as BlogPost;
}

export async function updateBlogPostRecord(
  id: string,
  patch: Partial<BlogPost>,
): Promise<BlogPost> {
  await prisma.blogPost.update({
    where: { id },
    data: {
      ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.excerpt !== undefined ? { excerpt: patch.excerpt } : {}),
      ...(patch.content !== undefined ? { content: asJsonValue(patch.content) } : {}),
      ...(patch.coverImage !== undefined ? { coverImage: patch.coverImage } : {}),
      ...(patch.tags !== undefined ? { tags: asJsonValue(patch.tags) } : {}),
      ...(patch.categorySlug !== undefined ? { categorySlug: patch.categorySlug } : {}),
      ...(patch.categoryLabel !== undefined ? { categoryLabel: patch.categoryLabel } : {}),
      ...(patch.featured !== undefined ? { featured: patch.featured } : {}),
      ...(patch.authorBio !== undefined ? { authorBio: patch.authorBio } : {}),
      ...(patch.authorAvatar !== undefined ? { authorAvatar: patch.authorAvatar } : {}),
      ...(patch.viewCount !== undefined ? { viewCount: patch.viewCount } : {}),
      ...(patch.seoTitle !== undefined ? { seoTitle: patch.seoTitle } : {}),
      ...(patch.seoDescription !== undefined ? { seoDescription: patch.seoDescription } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.publishedAt !== undefined ? { publishedAt: patch.publishedAt } : {}),
      ...(patch.scheduledAt !== undefined ? { scheduledAt: patch.scheduledAt } : {}),
      updatedAt: patch.updatedAt ?? now(),
    },
  });
  const updated = await getBlogPostById(id);
  if (!updated) throw new Error("Blog post not found after update");
  return updated as BlogPost;
}

export async function deleteBlogPostRecord(id: string): Promise<void> {
  await prisma.blogPost.delete({ where: { id } });
}

export async function incrementBlogPostViewCount(postId: string): Promise<void> {
  assertPostgresForWrite();
  await prisma.blogPost.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function createBlogPostEvent(input: {
  id: string;
  postId: string | null;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}): Promise<void> {
  assertPostgresForWrite();
  await prisma.blogPostEvent.create({
    data: {
      id: input.id,
      postId: input.postId,
      type: input.type,
      metadata: asJsonValue(input.metadata),
      createdAt: input.createdAt,
    },
  });
}

export async function createBlogCommentRecord(input: {
  id: string;
  postId: string;
  authorName: string;
  email: string;
  body: string;
  status: BlogCommentStatus;
  createdAt: string;
}): Promise<BlogComment> {
  assertPostgresForWrite();
  await prisma.blogComment.create({ data: input });
  return mapBlogCommentRow(input);
}

export async function listBlogCommentsByPost(
  postId: string,
  status: BlogCommentStatus,
): Promise<BlogComment[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.blogComment.findMany({
    where: { postId, status },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapBlogCommentRow);
}

export async function listAllBlogComments(status?: BlogCommentStatus): Promise<BlogComment[]> {
  const page = await listAllBlogCommentsPage({ status, limit: 100 });
  return page.comments;
}

export async function listAllBlogCommentsPage(
  options: {
    status?: BlogCommentStatus;
    limit?: number;
    afterCreatedAt?: string;
  } = {},
): Promise<{
  comments: BlogComment[];
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}> {
  if (!isPostgresConfigured()) {
    return { comments: [], hasMore: false, total: 0 };
  }
  const limit = clampPageLimit(options.limit);
  const where = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.afterCreatedAt ? { createdAt: { lt: options.afterCreatedAt } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    prisma.blogComment.count({
      where: options.status ? { status: options.status } : undefined,
    }),
  ]);

  const page = pageFromRows(rows, limit, (row) => row.createdAt);
  return {
    comments: page.items.map(mapBlogCommentRow),
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
    total,
  };
}

export async function updateBlogCommentStatus(
  id: string,
  status: BlogCommentStatus,
): Promise<BlogComment> {
  assertPostgresForWrite();
  const row = await prisma.blogComment.update({
    where: { id },
    data: { status },
  });
  return mapBlogCommentRow(row);
}

export async function getBlogAnalyticsSummary(): Promise<BlogAnalyticsSummary> {
  if (!isPostgresConfigured()) {
    return {
      totalViews: 0,
      totalShares: 0,
      totalComments: 0,
      pendingComments: 0,
      topPosts: [],
      recentEvents: [],
    };
  }

  const [posts, comments, events] = await Promise.all([
    prisma.blogPost.findMany({
      select: { id: true, title: true, slug: true, viewCount: true },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.blogComment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.blogPostEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { type: true, postId: true, createdAt: true },
    }),
  ]);

  const commentCounts = Object.fromEntries(comments.map((row) => [row.status, row._count._all]));

  const viewEvents = await prisma.blogPostEvent.count({ where: { type: "view" } });
  const shareEvents = await prisma.blogPostEvent.count({ where: { type: "share" } });

  return {
    totalViews: viewEvents,
    totalShares: shareEvents,
    totalComments:
      (commentCounts.approved ?? 0) + (commentCounts.pending ?? 0) + (commentCounts.rejected ?? 0),
    pendingComments: commentCounts.pending ?? 0,
    topPosts: posts.map((post) => ({
      postId: post.id,
      title: post.title,
      slug: post.slug,
      views: post.viewCount,
    })),
    recentEvents: events.map((event) => ({
      type: event.type,
      postId: event.postId,
      createdAt: event.createdAt,
    })),
  };
}

export async function createCouponRecord(coupon: Coupon): Promise<Coupon> {
  await prisma.coupon.create({
    data: {
      id: coupon.id,
      code: coupon.code.toUpperCase(),
      label: coupon.label,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount ?? null,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      maxUses: coupon.maxUses ?? null,
      maxUsesPerUser: coupon.maxUsesPerUser ?? null,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
      kind: coupon.kind ?? "standard",
      referralOwnerUserId: coupon.referralOwnerUserId ?? null,
      referralOwnerEmail: coupon.referralOwnerEmail ?? null,
      parentCouponId: coupon.parentCouponId ?? null,
      utmSource: coupon.utmSource ?? null,
      utmMedium: coupon.utmMedium ?? null,
      utmCampaign: coupon.utmCampaign ?? null,
      utmContent: coupon.utmContent ?? null,
      scope: coupon.scope === "products" && coupon.productIds.length > 0 ? "products" : "store",
      productIds: coupon.scope === "products" ? coupon.productIds : [],
      pdpHeadline: coupon.pdpHeadline ?? null,
      pdpOfferLine: coupon.pdpOfferLine ?? null,
      pdpMaxDiscountLine: coupon.pdpMaxDiscountLine ?? null,
      pdpTermsLine: coupon.pdpTermsLine ?? null,
      pdpDisclaimer: coupon.pdpDisclaimer ?? null,
      pdpFooter: coupon.pdpFooter ?? null,
      startsAt: coupon.startsAt ?? null,
      expiresAt: coupon.expiresAt ?? null,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    },
  });
  return coupon;
}

export async function updateCouponRecord(id: string, patch: Partial<Coupon>): Promise<Coupon> {
  const timestamp = now();
  const rest = { ...patch };
  delete rest.id;
  delete rest.createdAt;
  if (rest.code) rest.code = rest.code.toUpperCase();

  await prisma.coupon.update({
    where: { id },
    data: {
      ...(rest.code !== undefined ? { code: rest.code } : {}),
      ...(rest.label !== undefined ? { label: rest.label } : {}),
      ...(rest.type !== undefined ? { type: rest.type } : {}),
      ...(rest.value !== undefined ? { value: rest.value } : {}),
      ...(rest.minOrderAmount !== undefined ? { minOrderAmount: rest.minOrderAmount ?? null } : {}),
      ...(rest.maxDiscountAmount !== undefined
        ? { maxDiscountAmount: rest.maxDiscountAmount ?? null }
        : {}),
      ...(rest.maxUses !== undefined ? { maxUses: rest.maxUses ?? null } : {}),
      ...(rest.maxUsesPerUser !== undefined ? { maxUsesPerUser: rest.maxUsesPerUser ?? null } : {}),
      ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
      ...(rest.kind !== undefined ? { kind: rest.kind } : {}),
      ...(rest.referralOwnerUserId !== undefined
        ? { referralOwnerUserId: rest.referralOwnerUserId ?? null }
        : {}),
      ...(rest.referralOwnerEmail !== undefined
        ? { referralOwnerEmail: rest.referralOwnerEmail ?? null }
        : {}),
      ...(rest.parentCouponId !== undefined ? { parentCouponId: rest.parentCouponId ?? null } : {}),
      ...(rest.utmSource !== undefined ? { utmSource: rest.utmSource ?? null } : {}),
      ...(rest.utmMedium !== undefined ? { utmMedium: rest.utmMedium ?? null } : {}),
      ...(rest.utmCampaign !== undefined ? { utmCampaign: rest.utmCampaign ?? null } : {}),
      ...(rest.utmContent !== undefined ? { utmContent: rest.utmContent ?? null } : {}),
      ...(rest.pdpHeadline !== undefined ? { pdpHeadline: rest.pdpHeadline ?? null } : {}),
      ...(rest.pdpOfferLine !== undefined ? { pdpOfferLine: rest.pdpOfferLine ?? null } : {}),
      ...(rest.pdpMaxDiscountLine !== undefined
        ? { pdpMaxDiscountLine: rest.pdpMaxDiscountLine ?? null }
        : {}),
      ...(rest.pdpTermsLine !== undefined ? { pdpTermsLine: rest.pdpTermsLine ?? null } : {}),
      ...(rest.pdpDisclaimer !== undefined ? { pdpDisclaimer: rest.pdpDisclaimer ?? null } : {}),
      ...(rest.pdpFooter !== undefined ? { pdpFooter: rest.pdpFooter ?? null } : {}),
      ...(rest.scope !== undefined || rest.productIds !== undefined
        ? {
            scope:
              (rest.scope ?? "store") === "products" && (rest.productIds?.length ?? 0) > 0
                ? "products"
                : "store",
            productIds:
              (rest.scope ?? "store") === "products" && (rest.productIds?.length ?? 0) > 0
                ? (rest.productIds ?? [])
                : [],
          }
        : {}),
      ...(rest.startsAt !== undefined ? { startsAt: rest.startsAt ?? null } : {}),
      ...(rest.expiresAt !== undefined ? { expiresAt: rest.expiresAt ?? null } : {}),
      updatedAt: timestamp,
    },
  });

  const row = await prisma.coupon.findUnique({ where: { id } });
  if (!row) throw new Error("Coupon not found after update");
  return mapCoupon(row);
}

export async function deleteCouponRecord(id: string): Promise<void> {
  await prisma.coupon.delete({ where: { id } });
}

export async function incrementCouponUsageRecord(code: string): Promise<boolean> {
  const normalized = code.toUpperCase();
  const result = await prisma.coupon.updateMany({
    where: {
      code: normalized,
      OR: [{ maxUses: null }, { usedCount: { lt: prisma.coupon.fields.maxUses } }],
    },
    data: {
      usedCount: { increment: 1 },
      updatedAt: now(),
    },
  });
  return result.count > 0;
}

export async function createCouponRedemptionRecord(
  redemption: CouponRedemption,
): Promise<CouponRedemption> {
  await prisma.couponRedemption.create({
    data: {
      id: redemption.id,
      couponId: redemption.couponId,
      couponCode: redemption.couponCode.toUpperCase(),
      userId: redemption.userId ?? null,
      customerEmail: redemption.customerEmail?.toLowerCase() ?? null,
      orderId: redemption.orderId ?? null,
      utmSource: redemption.utmSource ?? null,
      utmMedium: redemption.utmMedium ?? null,
      utmCampaign: redemption.utmCampaign ?? null,
      utmContent: redemption.utmContent ?? null,
      createdAt: redemption.createdAt,
    },
  });
  return redemption;
}

export async function upsertStoreSettingsRecord(settings: StoreSettings): Promise<StoreSettings> {
  await prisma.storeSettings.upsert({
    where: { id: "store" },
    create: {
      id: "store",
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      gstNumber: settings.gstNumber,
      defaultGstRate: settings.defaultGstRate,
      sellerState: settings.sellerState,
      freeShippingThreshold: settings.freeShippingThreshold,
      standardShippingCharge: settings.standardShippingCharge,
      razorpayEnabled: settings.razorpayEnabled,
      updatedAt: settings.updatedAt,
    },
    update: {
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      gstNumber: settings.gstNumber,
      defaultGstRate: settings.defaultGstRate,
      sellerState: settings.sellerState,
      freeShippingThreshold: settings.freeShippingThreshold,
      standardShippingCharge: settings.standardShippingCharge,
      razorpayEnabled: settings.razorpayEnabled,
      updatedAt: settings.updatedAt,
    },
  });
  return settings;
}

export async function upsertProductReviewStatsRecord(stats: ProductReviewStats): Promise<void> {
  await prisma.productReviewStats.upsert({
    where: { productId: stats.productId },
    create: {
      productId: stats.productId,
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating,
      distribution: asJsonValue(stats.distribution),
      verifiedCount: stats.verifiedCount,
      withImagesCount: stats.withImagesCount,
      lastReviewAt: stats.lastReviewAt,
      updatedAt: stats.updatedAt,
    },
    update: {
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating,
      distribution: asJsonValue(stats.distribution),
      verifiedCount: stats.verifiedCount,
      withImagesCount: stats.withImagesCount,
      lastReviewAt: stats.lastReviewAt,
      updatedAt: stats.updatedAt,
    },
  });
}

export async function updateProductReviewAggregates(
  productId: string,
  rating: number,
  reviewCount: number,
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating,
      reviewCount,
      updatedAt: now(),
    },
  });
}

function mapHomepageSection(row: {
  id: string;
  sectionKey: string;
  title: string;
  subtitle: string | null;
  accentLabel: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  sortOrder: number;
  sourceMode: string;
  maxItems: number;
  layout: string;
  createdAt: string;
  updatedAt: string;
}): HomepageSection {
  return {
    id: row.id,
    sectionKey: row.sectionKey as HomepageSectionKey,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    accentLabel: row.accentLabel ?? undefined,
    ctaText: row.ctaText ?? undefined,
    ctaLink: row.ctaLink ?? undefined,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    sourceMode: row.sourceMode === "manual" ? "manual" : "auto",
    maxItems: row.maxItems,
    layout: row.layout as HomepageSection["layout"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapHomepageSectionItem(row: {
  id: string;
  sectionKey: string;
  sortOrder: number;
  isActive: boolean;
  productId: string | null;
  categorySlug: string | null;
  brandId: string | null;
  customImage: string | null;
  customTitle: string | null;
  customHref: string | null;
  badgeLabel: string | null;
  offerText: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}): HomepageSectionItem {
  return {
    id: row.id,
    sectionKey: row.sectionKey as HomepageSectionKey,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    productId: row.productId ?? undefined,
    categorySlug: row.categorySlug ?? undefined,
    brandId: row.brandId ?? undefined,
    customImage: row.customImage ?? undefined,
    customTitle: row.customTitle ?? undefined,
    customHref: row.customHref ?? undefined,
    badgeLabel: row.badgeLabel ?? undefined,
    offerText: row.offerText ?? undefined,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Seed curated CMS rows when a section exists but has zero items (idempotent). */
export async function seedHomepageCuratedItemsIfEmpty(): Promise<void> {
  if (!isPostgresConfigured()) return;
  const timestamp = now();

  async function empty(sectionKey: HomepageSectionKey): Promise<boolean> {
    const count = await prisma.homepageSectionItem.count({ where: { sectionKey } });
    return count === 0;
  }

  if (await empty("featured_stories")) {
    const { HOMEPAGE_APLUS_BANNERS } = await import("@/data/homepageAplusSections");
    await prisma.homepageSectionItem.createMany({
      data: HOMEPAGE_APLUS_BANNERS.map((banner, index) => ({
        id: banner.id,
        sectionKey: "featured_stories",
        sortOrder: index,
        isActive: true,
        customImage: banner.imageSrc,
        customTitle: banner.imageAlt,
        customHref: banner.href ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      skipDuplicates: true,
    });
  }

  if (await empty("featured_categories")) {
    const { POPULAR_CATEGORY_ITEMS } = await import("@/data/popularCategories");
    await prisma.homepageSectionItem.createMany({
      data: POPULAR_CATEGORY_ITEMS.map((item, index) => {
        const slug = item.href.split("/").filter(Boolean).pop() ?? `category-${item.slot}`;
        return {
          id: `popular-cat-${item.slot}`,
          sectionKey: "featured_categories" as const,
          sortOrder: index,
          isActive: true,
          categorySlug: slug,
          customTitle: item.title,
          customImage: item.imageSrc,
          customHref: item.href,
          badgeLabel: item.badge ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      }),
      skipDuplicates: true,
    });
  }

  if (await empty("browse_by_categories")) {
    const { BROWSE_CATEGORY_CARDS } = await import("@/data/browseCategoryCards");
    await prisma.homepageSectionItem.createMany({
      data: BROWSE_CATEGORY_CARDS.map((card, index) => ({
        id: `browse-cat-${card.id}`,
        sectionKey: "browse_by_categories",
        sortOrder: index,
        isActive: true,
        categorySlug: card.id,
        customTitle: card.title,
        customImage: card.image,
        customHref: card.href,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      skipDuplicates: true,
    });
  }

  if (await empty("gear_stories")) {
    const { DEFAULT_GEAR_STORY_ITEMS } = await import("@/lib/gearStoriesConfig");
    await prisma.homepageSectionItem.createMany({
      data: DEFAULT_GEAR_STORY_ITEMS.map((item, index) => ({
        id: item.id,
        sectionKey: "gear_stories",
        sortOrder: index,
        isActive: true,
        productId: item.productId,
        customTitle: item.customTitle,
        customImage: item.customImage,
        customHref: item.customHref,
        badgeLabel: item.badgeLabel,
        offerText: item.offerText,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      skipDuplicates: true,
    });
  }

  if (await empty("social_rail")) {
    const { DEFAULT_SOCIAL_RAIL_ITEMS } = await import("@/lib/socialRail");
    await prisma.homepageSectionItem.createMany({
      data: DEFAULT_SOCIAL_RAIL_ITEMS.map((item, index) => ({
        id: item.id,
        sectionKey: "social_rail",
        sortOrder: index,
        isActive: true,
        customTitle: item.platform,
        customHref: item.href,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      skipDuplicates: true,
    });
  }

  if (await empty("category_bento")) {
    const { CATEGORY_BENTO_ITEMS } = await import("@/data/categoryBento");
    const { packCategoryOfferText } = await import("@/lib/homepage/categoryOfferText");
    const { categoryPath } = await import("@/lib/routes");
    await prisma.homepageSectionItem.createMany({
      data: CATEGORY_BENTO_ITEMS.map((item, index) => ({
        id: `bento-cat-${item.slug}`,
        sectionKey: "category_bento",
        sortOrder: index,
        isActive: true,
        categorySlug: item.slug,
        customTitle: item.title,
        customImage: item.image,
        customHref: categoryPath(item.slug),
        badgeLabel: item.badge ?? null,
        offerText: packCategoryOfferText(item.desc, item.brands) ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      skipDuplicates: true,
    });
  }

  if (await empty("brand_strip")) {
    const { TOP_BRAND_STRIP_SLUGS } = await import("@/data/topBrandStrip");
    const { getBrandLogoUrl } = await import("@/lib/brandLogos");
    let brands = await prisma.brand.findMany({
      where: { slug: { in: [...TOP_BRAND_STRIP_SLUGS] } },
      select: { id: true, slug: true, name: true },
    });
    if (brands.length === 0) {
      brands = await prisma.brand.findMany({
        take: 16,
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true },
      });
    }
    const bySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    const preferred = TOP_BRAND_STRIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (brand): brand is NonNullable<typeof brand> => Boolean(brand),
    );
    const ordered = preferred.length > 0 ? preferred : brands;
    const rows = ordered.map((brand, index) => {
      const logoUrl = getBrandLogoUrl(brand.slug);
      return {
        id: `brand-strip-${brand.slug}`,
        sectionKey: "brand_strip" as const,
        sortOrder: index,
        isActive: true,
        brandId: brand.id,
        customTitle: brand.name,
        customImage: logoUrl || null,
        customHref: `/brands/${brand.slug}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });
    if (rows.length > 0) {
      await prisma.homepageSectionItem.createMany({
        data: rows,
        skipDuplicates: true,
      });
      await prisma.homepageSection.updateMany({
        where: { sectionKey: "brand_strip" },
        data: { sourceMode: "manual", updatedAt: timestamp },
      });
    }
  }
}

export async function ensureDefaultHomepageSections(): Promise<void> {
  if (!isPostgresConfigured()) return;
  const count = await prisma.homepageSection.count();
  if (count > 0) return;
  const timestamp = now();
  await prisma.$transaction(
    DEFAULT_HOMEPAGE_SECTIONS.map((section) =>
      prisma.homepageSection.create({
        data: {
          id: section.sectionKey,
          sectionKey: section.sectionKey,
          title: section.title,
          subtitle: section.subtitle ?? null,
          accentLabel: section.accentLabel ?? null,
          ctaText: section.ctaText ?? null,
          ctaLink: section.ctaLink ?? null,
          isActive: section.isActive,
          sortOrder: section.sortOrder,
          sourceMode: section.sourceMode,
          maxItems: section.maxItems,
          layout: section.layout,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      }),
    ),
  );
  await seedHomepageCuratedItemsIfEmpty();
}

export async function ensureMissingHomepageSections(): Promise<void> {
  if (!isPostgresConfigured()) return;

  // Public reads must not re-probe/seed on every cold cache miss.
  // Once the process has confirmed defaults exist, skip further ensure work.
  const g = globalThis as typeof globalThis & {
    __vibeHomepageSectionsEnsured?: boolean;
    __vibeHomepageSectionsEnsurePromise?: Promise<void>;
  };
  if (g.__vibeHomepageSectionsEnsured) return;
  if (g.__vibeHomepageSectionsEnsurePromise) {
    await g.__vibeHomepageSectionsEnsurePromise;
    return;
  }

  g.__vibeHomepageSectionsEnsurePromise = (async () => {
    await ensureDefaultHomepageSections();
    const timestamp = now();
    await prisma.homepageSection.updateMany({
      where: { ctaLink: "/categories" },
      data: { ctaLink: "/category", updatedAt: timestamp },
    });
    const existing = await prisma.homepageSection.findMany({
      select: { sectionKey: true },
    });
    const keys = new Set(existing.map((row) => row.sectionKey));
    const missing = DEFAULT_HOMEPAGE_SECTIONS.filter((section) => !keys.has(section.sectionKey));

    if (missing.length > 0) {
      const timestamp = now();
      await prisma.$transaction(
        missing.map((section) =>
          prisma.homepageSection.create({
            data: {
              id: section.sectionKey,
              sectionKey: section.sectionKey,
              title: section.title,
              subtitle: section.subtitle ?? null,
              accentLabel: section.accentLabel ?? null,
              ctaText: section.ctaText ?? null,
              ctaLink: section.ctaLink ?? null,
              isActive: section.isActive,
              sortOrder: section.sortOrder,
              sourceMode: section.sourceMode,
              maxItems: section.maxItems,
              layout: section.layout,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          }),
        ),
      );
    }

    // Always backfill curated defaults for sections that exist but have zero items
    // (e.g. fresh DB that created section rows without item seeds).
    await seedHomepageCuratedItemsIfEmpty();
    g.__vibeHomepageSectionsEnsured = true;
  })();

  try {
    await g.__vibeHomepageSectionsEnsurePromise;
  } finally {
    g.__vibeHomepageSectionsEnsurePromise = undefined;
  }
}

/** Allow admin writes / migrations to re-run ensure if section keys are added later. */
export function resetHomepageSectionsEnsureGate(): void {
  const g = globalThis as typeof globalThis & {
    __vibeHomepageSectionsEnsured?: boolean;
    __vibeHomepageSectionsEnsurePromise?: Promise<void>;
  };
  g.__vibeHomepageSectionsEnsured = false;
  g.__vibeHomepageSectionsEnsurePromise = undefined;
}

export async function listHomepageSectionsMapped(): Promise<HomepageSection[]> {
  if (!isPostgresConfigured()) {
    const timestamp = new Date(0).toISOString();
    return DEFAULT_HOMEPAGE_SECTIONS.map((section) => ({
      id: section.sectionKey,
      ...section,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
  }
  await ensureMissingHomepageSections();
  const rows = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(mapHomepageSection);
}

export async function listHomepageSectionItemsMapped(
  sectionKey?: HomepageSectionKey,
): Promise<HomepageSectionItem[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.homepageSectionItem.findMany({
    where: sectionKey ? { sectionKey } : undefined,
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapHomepageSectionItem);
}

export async function getHomepageSectionItemById(id: string): Promise<HomepageSectionItem | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.homepageSectionItem.findUnique({ where: { id } });
  return row ? mapHomepageSectionItem(row) : null;
}

export async function updateHomepageSectionRecord(
  sectionKey: HomepageSectionKey,
  patch: UpdateHomepageSectionInput,
): Promise<HomepageSection> {
  const existing = await prisma.homepageSection.findUnique({
    where: { sectionKey },
  });
  if (!existing) throw new Error("Homepage section not found");

  const timestamp = now();
  const row = await prisma.homepageSection.update({
    where: { sectionKey },
    data: {
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle.trim() || null } : {}),
      ...(patch.accentLabel !== undefined ? { accentLabel: patch.accentLabel.trim() || null } : {}),
      ...(patch.ctaText !== undefined ? { ctaText: patch.ctaText.trim() || null } : {}),
      ...(patch.ctaLink !== undefined ? { ctaLink: patch.ctaLink.trim() || null } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      ...(patch.sourceMode !== undefined ? { sourceMode: patch.sourceMode } : {}),
      ...(patch.maxItems !== undefined ? { maxItems: patch.maxItems } : {}),
      ...(patch.layout !== undefined ? { layout: patch.layout } : {}),
      updatedAt: timestamp,
    },
  });
  return mapHomepageSection(row);
}

export async function createHomepageSectionItemRecord(
  item: HomepageSectionItem,
): Promise<HomepageSectionItem> {
  await prisma.homepageSectionItem.create({
    data: {
      id: item.id,
      sectionKey: item.sectionKey,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      productId: item.productId ?? null,
      categorySlug: item.categorySlug ?? null,
      brandId: item.brandId ?? null,
      customImage: item.customImage ?? null,
      customTitle: item.customTitle ?? null,
      customHref: item.customHref ?? null,
      badgeLabel: item.badgeLabel ?? null,
      offerText: item.offerText ?? null,
      startDate: item.startDate,
      endDate: item.endDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
  });
  return item;
}

export async function updateHomepageSectionItemRecord(
  id: string,
  patch: UpdateHomepageSectionItemInput,
): Promise<HomepageSectionItem> {
  const timestamp = now();
  const row = await prisma.homepageSectionItem.update({
    where: { id },
    data: {
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.productId !== undefined ? { productId: patch.productId || null } : {}),
      ...(patch.categorySlug !== undefined ? { categorySlug: patch.categorySlug || null } : {}),
      ...(patch.brandId !== undefined ? { brandId: patch.brandId || null } : {}),
      ...(patch.customImage !== undefined ? { customImage: patch.customImage || null } : {}),
      ...(patch.customTitle !== undefined ? { customTitle: patch.customTitle || null } : {}),
      ...(patch.customHref !== undefined ? { customHref: patch.customHref || null } : {}),
      ...(patch.badgeLabel !== undefined ? { badgeLabel: patch.badgeLabel || null } : {}),
      ...(patch.offerText !== undefined ? { offerText: patch.offerText || null } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate } : {}),
      updatedAt: timestamp,
    },
  });
  return mapHomepageSectionItem(row);
}

export async function deleteHomepageSectionItemRecord(id: string): Promise<void> {
  await prisma.homepageSectionItem.delete({ where: { id } });
}

export async function reorderHomepageSectionItems(orderedIds: string[]): Promise<void> {
  const timestamp = now();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.homepageSectionItem.update({
        where: { id },
        data: { sortOrder: index, updatedAt: timestamp },
      }),
    ),
  );
}

export async function upsertHomepageSectionRecord(
  input: CreateHomepageSectionInput,
): Promise<HomepageSection> {
  const timestamp = now();
  const existing = await prisma.homepageSection.findUnique({
    where: { sectionKey: input.sectionKey },
  });
  const row = await prisma.homepageSection.upsert({
    where: { sectionKey: input.sectionKey },
    create: {
      id: input.sectionKey,
      sectionKey: input.sectionKey,
      title: input.title,
      subtitle: input.subtitle ?? null,
      accentLabel: input.accentLabel ?? null,
      ctaText: input.ctaText ?? null,
      ctaLink: input.ctaLink ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      sourceMode: input.sourceMode,
      maxItems: input.maxItems,
      layout: input.layout,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    update: {
      title: input.title,
      subtitle: input.subtitle ?? null,
      accentLabel: input.accentLabel ?? null,
      ctaText: input.ctaText ?? null,
      ctaLink: input.ctaLink ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      sourceMode: input.sourceMode,
      maxItems: input.maxItems,
      layout: input.layout,
      updatedAt: timestamp,
    },
  });
  void existing;
  return mapHomepageSection(row);
}
