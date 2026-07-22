"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  StatusBadge,
  LoadingState,
  EmptyState,
  StatCard,
  formatDate,
} from "@/components/admin/AdminUi";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import { buildMediaTransformUrl, MEDIA_PRESETS } from "@/lib/media-url";
import type { Review } from "@/types/review";
import type { AdminReviewStats, ReviewSortOption } from "@/types/review";

function buildReviewsQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return `/api/admin/reviews${qs ? `?${qs}` : ""}`;
}

function ReviewsContent() {
  const queryClient = useQueryClient();
  const pagination = useAdminCursorPagination();
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [hasImagesFilter, setHasImagesFilter] = useState(false);
  const [sort, setSort] = useState<ReviewSortOption>("newest");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const closeReviewDrawer = useCallback(() => setSelectedReview(null), []);
  const reviewDrawerRef = useDialogA11y(
    selectedReview !== null,
    closeReviewDrawer
  );

  const queryParams = useMemo(
    () => ({
      status: statusFilter || undefined,
      rating: ratingFilter || undefined,
      verified: verifiedFilter ? "true" : undefined,
      hasImages: hasImagesFilter ? "true" : undefined,
      sort,
      cursor: pagination.cursor,
      limit: "20",
    }),
    [statusFilter, ratingFilter, verifiedFilter, hasImagesFilter, sort, pagination.cursor]
  );

  const { data: statsData } = useQuery({
    queryKey: ["admin-review-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reviews/stats");
      if (!res.ok) throw new Error("Failed to load review stats");
      return res.json() as Promise<{ stats: AdminReviewStats }>;
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-reviews", queryParams],
    queryFn: async () => {
      const res = await fetch(buildReviewsQuery(queryParams));
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json() as Promise<{
        reviews: Review[];
        hasMore: boolean;
        nextCursor?: string;
      }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminReply: reply,
      rejectionReason: reason,
    }: {
      id: string;
      status: Review["status"];
      adminReply?: string;
      rejectionReason?: string;
    }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminReply: reply, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error("Failed to update review");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-review-stats"] });
      setSelectedReview(null);
      setAdminReply("");
      setRejectionReason("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-review-stats"] });
      setSelectedReview(null);
    },
  });

  function resetFilters() {
    setStatusFilter("");
    setRatingFilter("");
    setVerifiedFilter(false);
    setHasImagesFilter(false);
    setSort("newest");
    pagination.reset();
  }

  if (isLoading) return <LoadingState />;

  const reviews = data?.reviews ?? [];
  const stats = statsData?.stats;

  return (
    <>
      {stats ? (
        <div className="admin-stat-grid">
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Approved Today" value={stats.approvedToday} />
        </div>
      ) : null}

      <div className="admin-toolbar">
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(event) => {
            pagination.reset();
            setStatusFilter(event.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={ratingFilter}
          onChange={(event) => {
            pagination.reset();
            setRatingFilter(event.target.value);
          }}
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={String(value)}>
              {value} stars
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={sort}
          onChange={(event) => {
            pagination.reset();
            setSort(event.target.value as ReviewSortOption);
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
          <option value="helpful">Most helpful</option>
        </select>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={verifiedFilter}
            onChange={(event) => {
              pagination.reset();
              setVerifiedFilter(event.target.checked);
            }}
          />
          Verified only
        </label>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={hasImagesFilter}
            onChange={(event) => {
              pagination.reset();
              setHasImagesFilter(event.target.checked);
            }}
          />
          With images
        </label>

        <button type="button" className="admin-btn admin-btn--ghost" onClick={resetFilters}>
          Reset
        </button>
      </div>

      <div className="admin-panel">
        {reviews.length === 0 ? (
          <EmptyState message="No reviews found." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Author</th>
                  <th>Rating</th>
                  <th>Title</th>
                  <th>Flags</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>{review.productName || review.productId}</td>
                    <td>{review.author}</td>
                    <td>{review.rating}★</td>
                    <td>{review.title}</td>
                    <td>
                      {review.verifiedPurchase ? <span className="admin-badge admin-badge--success">Verified</span> : null}
                      {review.hasImages ? <span className="admin-badge admin-badge--info">Photos</span> : null}
                      {review.helpfulCount > 0 ? (
                        <span className="admin-badge admin-badge--muted">{review.helpfulCount} helpful</span>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge status={review.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => {
                          setSelectedReview(review);
                          setAdminReply(review.adminReply ?? "");
                          setRejectionReason(review.rejectionReason ?? "");
                        }}
                      >
                        View
                      </button>
                      {review.status !== "approved" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() =>
                            updateMutation.mutate({ id: review.id, status: "approved" })
                          }
                        >
                          Approve
                        </button>
                      ) : null}
                      {review.status !== "rejected" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() =>
                            updateMutation.mutate({ id: review.id, status: "rejected" })
                          }
                        >
                          Reject
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => deleteMutation.mutate(review.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          disabled={!pagination.canGoPrev || isFetching}
          onClick={pagination.goPrev}
        >
          Previous
        </button>
        <span>Page {pagination.pageIndex + 1}</span>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          disabled={!data?.hasMore || isFetching}
          onClick={() => pagination.goNext(data?.nextCursor)}
        >
          Next
        </button>
      </div>

      {selectedReview ? (
        <div
          className="admin-drawer-backdrop"
          onClick={closeReviewDrawer}
        >
          <div
            ref={reviewDrawerRef as RefObject<HTMLDivElement>}
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-review-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-drawer__header">
              <h2 id="admin-review-drawer-title">{selectedReview.title}</h2>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={closeReviewDrawer}
              >
                Close
              </button>
            </div>

            <p className="admin-drawer__meta">
              {selectedReview.author} · {selectedReview.rating}★ · {formatDate(selectedReview.createdAt)}
            </p>
            <p>{selectedReview.body}</p>

            {selectedReview.images.length > 0 ? (
              <div className="admin-review-images">
                {selectedReview.images.map((url, index) => (
                  <Image
                    key={`${url}-${index}`}
                    src={buildMediaTransformUrl(url, MEDIA_PRESETS.reviewGallery)}
                    alt={`Review image ${index + 1}`}
                    width={120}
                    height={120}
                    className="admin-review-images__thumb"
                  />
                ))}
              </div>
            ) : null}

            <label className="admin-field">
              <span>Admin reply</span>
              <textarea
                value={adminReply}
                rows={3}
                onChange={(event) => setAdminReply(event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Rejection reason (internal)</span>
              <input
                type="text"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </label>

            <div className="admin-drawer__actions">
              <button
                type="button"
                className="admin-btn"
                onClick={() =>
                  updateMutation.mutate({
                    id: selectedReview.id,
                    status: "approved",
                    adminReply,
                    rejectionReason,
                  })
                }
              >
                Approve with reply
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() =>
                  updateMutation.mutate({
                    id: selectedReview.id,
                    status: "rejected",
                    adminReply,
                    rejectionReason,
                  })
                }
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Reviews">
          <ReviewsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
