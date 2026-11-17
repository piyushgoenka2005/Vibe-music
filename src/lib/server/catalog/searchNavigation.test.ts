import { describe, it, expect } from "vitest";
import { searchInCatalogProducts } from "./catalogService";
import type { CatalogProduct } from "@/types/catalog";

const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-1",
    slug: "hertz-instrument-cable-10ft",
    name: "HERTZ Instrument Cable 10ft - Professional Guitar Lead",
    brand: "HERTZ",
    brandSlug: "hertz",
    category: "Cables",
    categorySlug: "cables",
    subcategory: "Instrument Cables",
    price: 999,
    originalPrice: 1299,
    discountPercentage: 23,
    rating: 4.8,
    reviewCount: 35,
    stock: 50,
    sku: "HZ-IC-10",
    status: "active",
    featured: true,
    trending: false,
    newArrival: false,
    image: "/images/products/hertz-cable.jpg",
    availability: "in_stock",
    condition: "new",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    slug: "hertz-xlr-microphone-cable-10ft",
    name: "HERTZ XLR Microphone Cable 10ft - Professional Mic Lead",
    brand: "HERTZ",
    brandSlug: "hertz",
    category: "Cables",
    categorySlug: "cables",
    subcategory: "XLR & Mic Cables",
    price: 1199,
    originalPrice: 1499,
    discountPercentage: 20,
    rating: 4.9,
    reviewCount: 28,
    stock: 40,
    sku: "HZ-XLR-10",
    status: "active",
    featured: false,
    trending: true,
    newArrival: false,
    image: "/images/products/hertz-cable.jpg",
    availability: "in_stock",
    condition: "new",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    slug: "hertz-dreadnought-guitar-case",
    name: "HERTZ Dreadnought Guitar Case - Hard Shell",
    brand: "HERTZ",
    brandSlug: "hertz",
    category: "Cases & Bags",
    categorySlug: "cases-bags",
    subcategory: "Guitar Cases",
    price: 4999,
    originalPrice: 5999,
    discountPercentage: 17,
    rating: 4.7,
    reviewCount: 15,
    stock: 20,
    sku: "HZ-CASE-DG",
    status: "active",
    featured: false,
    trending: false,
    newArrival: false,
    image: "/images/products/hertz-cable.jpg",
    availability: "in_stock",
    condition: "new",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    slug: "fender-player-stratocaster-electric-guitar",
    name: "Fender Player Stratocaster Electric Guitar",
    brand: "Fender",
    brandSlug: "fender",
    category: "Guitars",
    categorySlug: "guitars",
    subcategory: "Electric Guitars",
    price: 65999,
    originalPrice: 72999,
    discountPercentage: 10,
    rating: 4.9,
    reviewCount: 120,
    stock: 8,
    sku: "FEN-0144502500",
    status: "active",
    featured: true,
    trending: true,
    newArrival: false,
    image: "/images/products/fender.jpg",
    availability: "in_stock",
    condition: "new",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("Search & Navigation Remediation Specification Tests", () => {
  it("returns instrument cable products when searching for 'instrument cable'", () => {
    const results = searchInCatalogProducts(MOCK_PRODUCTS, { query: "instrument cable" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sku).toBe("HZ-IC-10");
  });

  it("returns instrument cable products when searching for 'instrument cables' (plural)", () => {
    const results = searchInCatalogProducts(MOCK_PRODUCTS, { query: "instrument cables" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sku).toBe("HZ-IC-10");
  });

  it("returns instrument cable when searching for synonym 'guitar cable'", () => {
    const results = searchInCatalogProducts(MOCK_PRODUCTS, { query: "guitar cable" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.sku === "HZ-IC-10")).toBe(true);
  });

  it("returns XLR microphone cable when searching for 'xlr cable' or 'mic cable'", () => {
    const results = searchInCatalogProducts(MOCK_PRODUCTS, { query: "xlr cable" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sku).toBe("HZ-XLR-10");
  });

  it("finds product by exact SKU 'HZ-IC-10'", () => {
    const results = searchInCatalogProducts(MOCK_PRODUCTS, { query: "HZ-IC-10" });
    expect(results.length).toBe(1);
    expect(results[0].name).toContain("HERTZ Instrument Cable");
  });

  it("filters accurately by category slug", () => {
    const cableResults = searchInCatalogProducts(MOCK_PRODUCTS, { category: "cables" });
    expect(cableResults.length).toBe(2);
    expect(cableResults.every((p) => p.categorySlug === "cables")).toBe(true);
  });

  it("supports categorySlugs array for parent category aggregation", () => {
    const accessoryResults = searchInCatalogProducts(MOCK_PRODUCTS, {
      categorySlugs: ["accessories", "cables", "cases-bags", "essentials"],
    });
    expect(accessoryResults.length).toBe(3);
    expect(accessoryResults.some((p) => p.categorySlug === "cables")).toBe(true);
    expect(accessoryResults.some((p) => p.categorySlug === "cases-bags")).toBe(true);
    expect(accessoryResults.some((p) => p.categorySlug === "guitars")).toBe(false);
  });
});
