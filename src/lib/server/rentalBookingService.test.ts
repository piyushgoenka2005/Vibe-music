import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/rentalRepository", () => ({
  getRentalProductById: vi.fn(),
  getRentalProductBySlug: vi.fn(),
  listRentalLocksForProduct: vi.fn().mockResolvedValue([]),
  listRentalBlocksForProduct: vi.fn().mockResolvedValue([]),
}));

import { quoteRentalItem } from "@/lib/server/rentalBookingService";
import { getRentalProductById } from "@/lib/server/rentalRepository";

describe("quoteRentalItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when rental product is missing", async () => {
    vi.mocked(getRentalProductById).mockResolvedValue(null);

    await expect(
      quoteRentalItem({
        productId: "missing",
        durationType: "daily",
        startAt: "2026-10-01T10:00:00.000Z",
        endAt: "2026-10-03T10:00:00.000Z",
        fulfillment: "pickup",
      }),
    ).rejects.toThrow(/not found/i);
  });
});
