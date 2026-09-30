import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => {
  class MockAdminAuthError extends Error {
    status: 401 | 403;
    constructor(message: string, status: 401 | 403 = 403) {
      super(message);
      this.name = "AdminAuthError";
      this.status = status;
    }
  }

  return {
    AdminAuthError: MockAdminAuthError,
    requireAdmin: vi.fn(),
    adminErrorResponse: (error: unknown) => {
      const status =
        error instanceof MockAdminAuthError
          ? error.status
          : error &&
              typeof error === "object" &&
              "status" in error &&
              typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : 500;
      const message = error instanceof Error ? error.message : "Admin error";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
});

vi.mock("@/lib/server/cdnImageOptimize", () => ({
  uploadOptimizedImageToCdn: vi.fn(async () => ({
    url: "http://localhost:3000/cdn-local/products/guitars/demo/uuid-w960.webp",
    masterUrl: "http://localhost:3000/cdn-local/products/guitars/demo/uuid.webp",
    derivatives: {},
  })),
}));

import { POST } from "./route";
import { requireAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";

const adminUser = {
  uid: "admin-1",
  email: "admin@test.com",
  displayName: "Admin",
  role: "super_admin" as const,
  permissions: ["products:write"],
};

function makePngBuffer(): Buffer {
  return Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001",
    "hex",
  );
}

function makeUploadRequest(
  options: {
    files?: File[];
    categorySlug?: string;
    productSlug?: string;
  } = {},
): Request {
  const form = new FormData();
  form.set("categorySlug", options.categorySlug ?? "guitars");
  if (options.productSlug) form.set("productSlug", options.productSlug);
  for (const file of options.files ?? []) {
    form.append("files", file);
  }
  return new Request("http://localhost/api/admin/upload/images", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/admin/upload/images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);
  });

  it("requires admin authentication", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Authentication required", 401));

    const res = await POST(
      makeUploadRequest({
        files: [new File([makePngBuffer()], "photo.png", { type: "image/png" })],
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects empty uploads", async () => {
    const res = await POST(makeUploadRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/no images/i);
  });

  it("uploads validated images to the product CDN folder", async () => {
    const res = await POST(
      makeUploadRequest({
        categorySlug: "guitars",
        productSlug: "fender-strat",
        files: [new File([makePngBuffer()], "photo.png", { type: "image/png" })],
      }),
    );

    expect(res.status).toBe(200);
    expect(uploadOptimizedImageToCdn).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ folder: "products/guitars/fender-strat" }),
    );
    const body = (await res.json()) as { urls?: string[] };
    expect(body.urls).toHaveLength(1);
  });

  it("rejects non-image content", async () => {
    const res = await POST(
      makeUploadRequest({
        files: [new File([Buffer.from("not-an-image")], "bad.txt", { type: "text/plain" })],
      }),
    );
    expect(res.status).toBe(400);
  });
});
