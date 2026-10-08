import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  isPostgresConfigured: vi.fn(() => false),
  prisma: {},
}));

import { getNotificationPreferences } from "@/lib/server/notificationRepository";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notification";

describe("notificationRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default preferences when Postgres is unavailable", async () => {
    const prefs = await getNotificationPreferences("user_missing");
    expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });
});
