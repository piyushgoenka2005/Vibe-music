import { describe, expect, it } from "vitest";
import {
  adminNotificationMarkSchema,
  adminProductBulkSchema,
} from "@/lib/validations/admin";

describe("admin bulk / notification schemas", () => {
  it("accepts valid bulk stock update", () => {
    const parsed = adminProductBulkSchema.safeParse({
      action: "update_stock",
      ids: ["a", "b"],
      stock: 4,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects update_stock without stock", () => {
    const parsed = adminProductBulkSchema.safeParse({
      action: "update_stock",
      ids: ["a"],
    });
    expect(parsed.success).toBe(false);
  });

  it("requires notification id or markAllRead", () => {
    expect(adminNotificationMarkSchema.safeParse({}).success).toBe(false);
    expect(
      adminNotificationMarkSchema.safeParse({ markAllRead: true }).success
    ).toBe(true);
    expect(
      adminNotificationMarkSchema.safeParse({ id: "n1" }).success
    ).toBe(true);
  });
});
