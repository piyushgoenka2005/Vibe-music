import { describe, expect, it } from "vitest";
import { isAdminMutationRequest } from "./adminLiveSync";

describe("isAdminMutationRequest", () => {
  it.each([
    ["/api/admin/products/p1", "PUT"],
    ["/api/admin/categories", "POST"],
    ["/api/admin/coupons/c1", "PATCH"],
    ["/api/admin/banners/b1", "DELETE"],
    ["http://localhost:3000/api/admin/settings", "put"],
  ])("treats %s %s as an admin write", (url, method) => {
    expect(isAdminMutationRequest(url, { method })).toBe(true);
  });

  it("reads the method from a Request object", () => {
    const request = new Request("http://localhost/api/admin/brands", { method: "POST" });
    expect(isAdminMutationRequest(request)).toBe(true);
  });

  it.each([
    ["/api/admin/products", undefined],
    ["/api/admin/login", "POST"],
    ["/api/admin/logout", "POST"],
    ["/api/cart", "POST"],
    ["/api/administrator/x", "POST"],
  ])("ignores %s %s", (url, method) => {
    expect(isAdminMutationRequest(url, method ? { method } : undefined)).toBe(false);
  });
});
