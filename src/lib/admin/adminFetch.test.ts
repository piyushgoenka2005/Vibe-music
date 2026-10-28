import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminFetchJson,
  adminMutateJson,
  readAdminApiError,
  safeReadApiResponse,
} from "@/lib/admin/adminFetch";

describe("adminFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("readAdminApiError surfaces API error field", async () => {
    const res = new Response(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
    });
    await expect(readAdminApiError(res)).resolves.toBe("Insufficient permissions");
  });

  it("adminFetchJson parses JSON bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    await expect(adminFetchJson<{ ok: boolean }>("/api/admin/test")).resolves.toEqual({
      ok: true,
    });
  });

  it("adminMutateJson throws with API message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "Validation failed" }), { status: 400 }),
        ),
    );
    await expect(adminMutateJson("/api/admin/test", { method: "POST" })).rejects.toThrow(
      "Validation failed",
    );
  });

  it("safeReadApiResponse handles HTML 502 Bad Gateway gracefully without throwing SyntaxError", async () => {
    const html502 =
      "<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center></body></html>";
    const res = new Response(html502, {
      status: 502,
      headers: { "Content-Type": "text/html" },
    });
    const parsed = await safeReadApiResponse(res);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("restarting");
  });

  it("safeReadApiResponse handles HTML 413 Request Entity Too Large gracefully", async () => {
    const html413 =
      "<html><head><title>413 Request Entity Too Large</title></head><body><h1>413 Request Entity Too Large</h1></body></html>";
    const res = new Response(html413, {
      status: 413,
      headers: { "Content-Type": "text/html" },
    });
    const parsed = await safeReadApiResponse(res);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("too large");
  });

  it("safeReadApiResponse safely parses valid JSON", async () => {
    const res = new Response(JSON.stringify({ url: "https://cdn.example.com/image.webp" }), {
      status: 200,
    });
    const parsed = await safeReadApiResponse<{ url: string }>(res);
    expect(parsed.ok).toBe(true);
    expect(parsed.data?.url).toBe("https://cdn.example.com/image.webp");
  });
});
