import { describe, expect, it } from "vitest";
import {
  canAccessAdminPath,
  getRequiredPermissionForAdminPath,
} from "@/lib/auth/admin-route-permissions";
import type { Permission } from "@/types/admin";

describe("admin-route-permissions", () => {
  it("resolves longest prefix for nested admin routes", () => {
    expect(getRequiredPermissionForAdminPath("/admin/rentals/products")).toBe(
      "rentals:read"
    );
    expect(getRequiredPermissionForAdminPath("/admin/giveaway/campaigns")).toBe(
      "giveaways:read"
    );
    expect(getRequiredPermissionForAdminPath("/admin/products/new")).toBe(
      "products:read"
    );
    expect(getRequiredPermissionForAdminPath("/admin/cms")).toBe("settings:write");
  });

  it("treats admin login as public", () => {
    expect(getRequiredPermissionForAdminPath("/admin/login")).toBeNull();
    expect(canAccessAdminPath([], "/admin/login")).toBe(true);
  });

  it("enforces required permissions", () => {
    const support: Permission[] = ["dashboard:read", "orders:read"];
    expect(canAccessAdminPath(support, "/admin/orders")).toBe(true);
    expect(canAccessAdminPath(support, "/admin/products")).toBe(false);
    expect(canAccessAdminPath(support, "/admin/users")).toBe(false);
  });
});
