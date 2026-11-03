import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  deleteCategory,
  archiveCategory,
  updateCategory,
} from "@/lib/server/catalog/categoryRepository";
import {
  ensureDefaultNavigationMenus,
  getNavigationMenuByHandle,
  createNavigationMenuItem,
  deleteNavigationMenuItem,
} from "@/lib/server/navigation/navigationRepository";
import { createTaxonomyNode, deleteTaxonomyNode } from "@/lib/server/taxonomy/taxonomyRepository";
import { createSectionItem, deleteSectionItem } from "@/lib/server/homepage/homepageRepository";
import { ensureMissingHomepageSections } from "@/lib/server/prisma/contentRepository";

describe("Admin Panel Functional Separation & Deletion Safeguards", () => {
  let timestamp: number;
  let testCategorySlug: string;
  let testCategoryId: string;
  let testProductId: string | null = null;
  let testNavMenuId: string;
  let testNavItemId: string | null = null;
  let testTaxonomyId: string | null = null;
  let testHomepageItemId: string | null = null;

  beforeEach(async () => {
    await ensureMissingHomepageSections();
    timestamp = Date.now();
    testCategorySlug = `test-cat-sep-${timestamp}-${Math.floor(Math.random() * 10000)}`;
    testCategoryId = randomUUID();

    // 1. Create a test storefront category
    const _cat = await prisma.category.create({
      data: {
        id: testCategoryId,
        slug: testCategorySlug,
        name: `Test Category ${timestamp}`,
        description: "Test description",
        isActive: true,
        isArchived: false,
      },
    });

    // 2. Ensure navigation menus exist and create a navigation item pointing to this category
    await ensureDefaultNavigationMenus();
    const mainMenu = await getNavigationMenuByHandle("main_nav");
    testNavMenuId = mainMenu!.id;

    const navItem = await createNavigationMenuItem({
      menuId: testNavMenuId,
      label: `Nav for ${testCategorySlug}`,
      url: `/category/${testCategorySlug}`,
      categoryId: testCategoryId,
      sortOrder: 999,
      itemType: "custom",
    });
    testNavItemId = navItem.id;

    // 3. Create a master taxonomy node
    const taxonomyNode = await createTaxonomyNode({
      category: `Taxonomy Category ${timestamp}`,
      subcategory: `Subcategory ${timestamp}`,
      productType: "Electric",
      seoSlug: `seo-${testCategorySlug}`,
      googleProductCategory: "Musical Instruments > Guitars",
      menuLevel1: "Guitars",
      menuLevel2: "Electric",
      menuLevel3: "Solid Body",
      isArchived: false,
    });
    testTaxonomyId = taxonomyNode.id;

    // 4. Create a homepage section item referencing this category
    const hpItem = await createSectionItem({
      sectionKey: "browse_by_categories",
      categorySlug: testCategorySlug,
      customTitle: "Browse Test Category",
      sortOrder: 999,
    });
    testHomepageItemId = hpItem.id;
  });

  afterEach(async () => {
    // Cleanup any lingering records
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testNavItemId) {
      await prisma.navigationMenuItem.deleteMany({ where: { id: testNavItemId } });
    }
    if (testHomepageItemId) {
      await prisma.homepageSectionItem.deleteMany({ where: { id: testHomepageItemId } });
    }
    if (testTaxonomyId) {
      await prisma.catalogTaxonomy.deleteMany({ where: { id: testTaxonomyId } });
    }
    if (testCategoryId) {
      await prisma.category.deleteMany({ where: { id: testCategoryId } });
    }
  });

  it("Rule 1: Safeguard blocks category deletion when products are assigned", async () => {
    // Assign a product to the category
    testProductId = randomUUID();
    await prisma.product.create({
      data: {
        id: testProductId,
        slug: `test-prod-${timestamp}-${Math.floor(Math.random() * 10000)}`,
        name: `Test Product ${timestamp}`,
        sku: `SKU-${timestamp}-${Math.floor(Math.random() * 10000)}`,
        brand: "Yamaha",
        brandSlug: "yamaha",
        price: 9999,
        originalPrice: 9999,
        category: testCategorySlug,
        categorySlug: testCategorySlug,
        stock: 5,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // Attempting to delete the category should fail with clear warning
    await expect(deleteCategory(testCategoryId)).rejects.toThrow(
      /Cannot delete category.*product.*assigned/i,
    );

    // Verify category was not deleted
    const catInDb = await prisma.category.findUnique({ where: { id: testCategoryId } });
    expect(catInDb).not.toBeNull();
  });

  it("Rule 2: Archive & Deactivate category work independently without deleting anything", async () => {
    // Toggle active status
    const deactivated = await updateCategory(testCategoryId, { isActive: false });
    expect(deactivated.isActive).toBe(false);

    // Archive category
    const archived = await archiveCategory(testCategoryId, true);
    expect(archived.isArchived).toBe(true);

    // Verify navigation menu item is still intact and not modified
    const navItem = await prisma.navigationMenuItem.findUnique({ where: { id: testNavItemId! } });
    expect(navItem).not.toBeNull();
    expect(navItem?.label).toBe(`Nav for ${testCategorySlug}`);

    // Verify master taxonomy is still intact
    const taxonomyNode = await prisma.catalogTaxonomy.findUnique({
      where: { id: testTaxonomyId! },
    });
    expect(taxonomyNode).not.toBeNull();

    // Verify homepage section item is still intact
    const hpItem = await prisma.homepageSectionItem.findUnique({
      where: { id: testHomepageItemId! },
    });
    expect(hpItem).not.toBeNull();
  });

  it("Rule 3: Deleting a category does NOT delete navigation items, homepage items, or taxonomy", async () => {
    // Perform safe deletion of category (0 products assigned)
    await deleteCategory(testCategoryId);

    // Category should be deleted
    const catInDb = await prisma.category.findUnique({ where: { id: testCategoryId } });
    expect(catInDb).toBeNull();

    // CRITICAL: Navigation Menu Item must STILL exist
    const navItem = await prisma.navigationMenuItem.findUnique({ where: { id: testNavItemId! } });
    expect(navItem).not.toBeNull();
    expect(navItem?.url).toBe(`/category/${testCategorySlug}`);

    // CRITICAL: Homepage section item must STILL exist
    const hpItem = await prisma.homepageSectionItem.findUnique({
      where: { id: testHomepageItemId! },
    });
    expect(hpItem).not.toBeNull();
    expect(hpItem?.categorySlug).toBe(testCategorySlug);

    // CRITICAL: Master taxonomy must STILL exist
    const taxonomyNode = await prisma.catalogTaxonomy.findUnique({
      where: { id: testTaxonomyId! },
    });
    expect(taxonomyNode).not.toBeNull();
  });

  it("Rule 4: Deleting a navigation menu item does NOT delete category or taxonomy", async () => {
    // Delete the navigation item
    await deleteNavigationMenuItem(testNavItemId!);

    // Navigation item should be gone
    const navItem = await prisma.navigationMenuItem.findUnique({ where: { id: testNavItemId! } });
    expect(navItem).toBeNull();

    // Category must STILL exist
    const catInDb = await prisma.category.findUnique({ where: { id: testCategoryId } });
    expect(catInDb).not.toBeNull();
    expect(catInDb?.slug).toBe(testCategorySlug);

    // Master taxonomy must STILL exist
    const taxonomyNode = await prisma.catalogTaxonomy.findUnique({
      where: { id: testTaxonomyId! },
    });
    expect(taxonomyNode).not.toBeNull();
  });

  it("Rule 5: Deleting a master taxonomy node does NOT delete category, navigation item, or homepage item", async () => {
    // Delete taxonomy node
    await deleteTaxonomyNode(testTaxonomyId!);

    // Taxonomy node is deleted
    const taxonomyNode = await prisma.catalogTaxonomy.findUnique({
      where: { id: testTaxonomyId! },
    });
    expect(taxonomyNode).toBeNull();

    // Category must STILL exist
    const catInDb = await prisma.category.findUnique({ where: { id: testCategoryId } });
    expect(catInDb).not.toBeNull();

    // Navigation item must STILL exist
    const navItem = await prisma.navigationMenuItem.findUnique({ where: { id: testNavItemId! } });
    expect(navItem).not.toBeNull();

    // Homepage section item must STILL exist
    const hpItem = await prisma.homepageSectionItem.findUnique({
      where: { id: testHomepageItemId! },
    });
    expect(hpItem).not.toBeNull();
  });

  it("Rule 6: Deleting a homepage section item does NOT delete category, navigation item, or taxonomy", async () => {
    // Delete homepage section item
    await deleteSectionItem(testHomepageItemId!);

    // Homepage item is deleted
    const hpItem = await prisma.homepageSectionItem.findUnique({
      where: { id: testHomepageItemId! },
    });
    expect(hpItem).toBeNull();

    // Category must STILL exist
    const catInDb = await prisma.category.findUnique({ where: { id: testCategoryId } });
    expect(catInDb).not.toBeNull();

    // Navigation item must STILL exist
    const navItem = await prisma.navigationMenuItem.findUnique({ where: { id: testNavItemId! } });
    expect(navItem).not.toBeNull();

    // Master taxonomy must STILL exist
    const taxonomyNode = await prisma.catalogTaxonomy.findUnique({
      where: { id: testTaxonomyId! },
    });
    expect(taxonomyNode).not.toBeNull();
  });
});
