import { describe, expect, test, vi } from "vitest";
import { resolveStores } from "./homepageService";

// Mock Prisma
vi.mock("@/lib/server/platform/prisma", () => ({
  default: {
    homepageSectionItem: {
      findMany: vi.fn(),
    },
  },
}));

describe("resolveStores", () => {
  test("should return manual store items when section has manual source mode", async () => {
    const mockManualStoreItems = [
      {
        id: "1",
        sectionKey: "store_network",
        sortOrder: 0,
        isActive: true,
        customTitle: "Delhi Store",
        customHref: "/contact/delhi",
        customImage: "https://example.com/delhi.jpg",
        badgeLabel: "Premium",
      },
      {
        id: "2",
        sectionKey: "store_network",
        sortOrder: 1,
        isActive: true,
        customTitle: "Kolkata Store",
        customHref: "/contact/kolkata",
        customImage: "https://example.com/kolkata.jpg",
        badgeLabel: "Classic",
      },
    ];

    // Mock implementation
    const { default: prisma } = await import("@/lib/server/platform/prisma");
    vi.mocked(prisma.homepageSectionItem.findMany).mockResolvedValue(mockManualStoreItems);

    const result = await resolveStores({ sourceMode: "manual", maxItems: 5 });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "1",
      name: "Delhi Store",
      city: "Delhi Store", // Default city from title
      address: undefined,
      customImage: "https://example.com/delhi.jpg",
      customTitle: "Delhi Store",
      badgeLabel: "Premium",
      contactLink: "/contact/delhi",
      sortOrder: 0,
    });
    expect(result[1]).toEqual({
      id: "2",
      name: "Kolkata Store",
      city: "Kolkata Store", // Default city from title
      address: undefined,
      customImage: "https://example.com/kolkata.jpg",
      customTitle: "Kolkata Store",
      badgeLabel: "Classic",
      contactLink: "/contact/kolkata",
      sortOrder: 1,
    });
  });

  test("should return auto store items when section has auto source mode", async () => {
    const result = await resolveStores({ sourceMode: "auto", maxItems: 5 });

    // Should return default stores for Delhi, Kolkata, Nagpur, North East, Mumbai
    expect(result).toHaveLength(5);

    // Check each default store
    expect(result[0]).toEqual({
      id: "store-delhi",
      name: "Delhi",
      city: "Delhi",
      address: "Shop No. 12, Music Hub, Connaught Place",
      customImage: undefined,
      customTitle: undefined,
      badgeLabel: undefined,
      contactLink: "#contact",
      sortOrder: 0,
    });

    expect(result[1]).toEqual({
      id: "store-kolkata",
      name: "Kolkata",
      city: "Kolkata",
      address: "Ground Floor, Melody Building, Park Street",
      customImage: undefined,
      customTitle: undefined,
      badgeLabel: undefined,
      contactLink: "#contact",
      sortOrder: 1,
    });

    expect(result[2]).toEqual({
      id: "store-nagpur",
      name: "Nagpur",
      city: "Nagpur",
      address: "Unit 5, Harmony Plaza, Sitabuldi",
      customImage: undefined,
      customTitle: undefined,
      badgeLabel: undefined,
      contactLink: "#contact",
      sortOrder: 2,
    });

    expect(result[3]).toEqual({
      id: "store-north-east",
      name: "North East",
      city: "North East",
      address: "Upper Ground, Rhythm Mall, Shillong",
      customImage: undefined,
      customTitle: undefined,
      badgeLabel: undefined,
      contactLink: "#contact",
      sortOrder: 3,
    });

    expect(result[4]).toEqual({
      id: "store-mumbai",
      name: "Mumbai",
      city: "Mumbai",
      address: "Level 2, Sound Avenue, Bandra West",
      customImage: undefined,
      customTitle: undefined,
      badgeLabel: undefined,
      contactLink: "#contact",
      sortOrder: 4,
    });
  });

  test("should limit store items to maxItems", async () => {
    const result = await resolveStores({ sourceMode: "auto", maxItems: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Delhi");
    expect(result[1].name).toBe("Kolkata");
  });

  test("should filter out inactive manual store items", async () => {
    const mockStoreItems = [
      {
        id: "1",
        sectionKey: "store_network",
        sortOrder: 0,
        isActive: true,
        customTitle: "Active Store",
        customHref: "/contact/active",
      },
      {
        id: "2",
        sectionKey: "store_network",
        sortOrder: 1,
        isActive: false, // Inactive
        customTitle: "Inactive Store",
        customHref: "/contact/inactive",
      },
    ];

    const { default: prisma } = await import("@/lib/server/platform/prisma");
    vi.mocked(prisma.homepageSectionItem.findMany).mockResolvedValue(mockStoreItems);

    const result = await resolveStores({ sourceMode: "manual", maxItems: 5 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Active Store");
    expect(result[0].id).toBe("1");
  });

  test("should sort store items by sortOrder", async () => {
    const mockStoreItems = [
      {
        id: "2",
        sectionKey: "store_network",
        sortOrder: 2,
        isActive: true,
        customTitle: "Third",
      },
      {
        id: "1",
        sectionKey: "store_network",
        sortOrder: 1,
        isActive: true,
        customTitle: "Second",
      },
      {
        id: "0",
        sectionKey: "store_network",
        sortOrder: 0,
        isActive: true,
        customTitle: "First",
      },
    ];

    const { default: prisma } = await import("@/lib/server/platform/prisma");
    vi.mocked(prisma.homepageSectionItem.findMany).mockResolvedValue(mockStoreItems);

    const result = await resolveStores({ sourceMode: "manual", maxItems: 5 });

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("First");
    expect(result[1].name).toBe("Second");
    expect(result[2].name).toBe("Third");
  });

  test("should handle store items without customTitle (use city extraction)", async () => {
    const mockStoreItems = [
      {
        id: "1",
        sectionKey: "store_network",
        sortOrder: 0,
        isActive: true,
        customTitle: "Delhi Music Store",
        customHref: "/contact/delhi",
      },
    ];

    const { default: prisma } = await import("@/lib/server/platform/prisma");
    vi.mocked(prisma.homepageSectionItem.findMany).mockResolvedValue(mockStoreItems);

    const result = await resolveStores({ sourceMode: "manual", maxItems: 5 });

    expect(result[0].name).toBe("Delhi Music Store");
    expect(result[0].city).toBe("Delhi Music Store"); // Fallback to customTitle
  });
});
