import { afterEach, describe, expect, it, vi } from "vitest";
import { adminFetchJson, adminMutateJson, readAdminApiError } from "@/lib/admin/adminFetch";

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
});
