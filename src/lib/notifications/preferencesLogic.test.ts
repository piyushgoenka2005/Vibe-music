import { describe, expect, it } from "vitest";
import { isNotificationAllowed } from "@/lib/notifications/preferencesLogic";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notification";

describe("isNotificationAllowed", () => {
  it("allows order updates when enabled", () => {
    expect(
      isNotificationAllowed("order_update", {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        orderUpdates: true,
      })
    ).toBe(true);
  });

  it("blocks promotions when disabled", () => {
    expect(
      isNotificationAllowed("promotion", {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        promotions: false,
      })
    ).toBe(false);
  });

  it("always allows support replies", () => {
    expect(
      isNotificationAllowed("support_reply", {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        orderUpdates: false,
        promotions: false,
        productAlerts: false,
        newsletter: false,
      })
    ).toBe(true);
  });
});
