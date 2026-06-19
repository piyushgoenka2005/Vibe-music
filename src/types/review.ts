export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewSortOption =
  | "newest"
  | "oldest"
  | "highest"
  | "lowest"
  | "helpful";

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  userEmail?: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  hasImages: boolean;
  verifiedPurchase: boolean;
  orderId?: string;
  status: ReviewStatus;
  adminReply?: string;
  rejectionReason?: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PublicReview = Omit<
  Review,
  "userId" | "userEmail" | "rejectionReason" | "orderId"
> & {
  hasVoted?: boolean;
};

export interface ProductReviewStats {
  productId: string;
  totalReviews: number;
  averageRating: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  verifiedCount: number;
  withImagesCount: number;
  lastReviewAt: string | null;
  updatedAt: string;
}

export interface ReviewListParams {
  productId: string;
  sort?: ReviewSortOption;
  rating?: number;
  verified?: boolean;
  hasImages?: boolean;
  cursor?: string;
  limit?: number;
  viewerUserId?: string;
}

export interface ReviewListResponse {
  reviews: PublicReview[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface CreateReviewInput {
  rating: number;
  title: string;
  body: string;
  images?: string[];
}

export interface ReviewEligibility {
  canReview: boolean;
  hasExistingReview: boolean;
  verifiedPurchase: boolean;
  reason?: string;
}

export interface AdminReviewListParams {
  status?: ReviewStatus;
  productId?: string;
  rating?: number;
  verified?: boolean;
  hasImages?: boolean;
  sort?: ReviewSortOption;
  cursor?: string;
  limit?: number;
}

export interface AdminReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  approvedToday: number;
}
