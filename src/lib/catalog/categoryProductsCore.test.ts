import { describe, it, expect } from "vitest";
import {
  canonicalSubcategorySlug,
  canonicalSubcategoryLabel,
  buildCategoryProductsResult,
} from "./categoryProductsCore";
import type { Product } from "@/types/product";
import { DEFAULT_FILTERS } from "@/types/filters";

describe("canonicalSubcategorySlug and canonicalSubcategoryLabel", () => {
  it("normalizes singular and plural subcategories to canonical plural slugs and labels", () => {
    expect(canonicalSubcategorySlug("Acoustic Guitar")).toBe("acoustic-guitars");
    expect(canonicalSubcategorySlug("Acoustic Guitars")).toBe("acoustic-guitars");
    expect(canonicalSubcategoryLabel("Acoustic Guitar")).toBe("Acoustic Guitars");
    expect(canonicalSubcategoryLabel("Acoustic Guitars")).toBe("Acoustic Guitars");

    expect(canonicalSubcategorySlug("Cymbal")).toBe("cymbals");
    expect(canonicalSubcategorySlug("Cymbals")).toBe("cymbals");
    expect(canonicalSubcategoryLabel("Cymbal")).toBe("Cymbals");
    expect(canonicalSubcategoryLabel("Cymbals")).toBe("Cymbals");

    expect(canonicalSubcategorySlug("Music Stand")).toBe("music-stands");
    expect(canonicalSubcategorySlug("Music Stands")).toBe("music-stands");
    expect(canonicalSubcategoryLabel("Music Stand")).toBe("Music Stands");

    expect(canonicalSubcategorySlug("Keyboard Stand")).toBe("keyboard-stands");
    expect(canonicalSubcategorySlug("Keyboard Stands")).toBe("keyboard-stands");

    expect(canonicalSubcategorySlug("Guitar & Instrument Cables")).toBe("instrument-cables");
    expect(canonicalSubcategorySlug("XLR Microphone & Audio Cables")).toBe("xlr-cables");
    expect(canonicalSubcategorySlug("Audio Interfaces & Recording Mixers")).toBe(
      "audio-interfaces",
    );
    expect(canonicalSubcategorySlug("Performance Synthesizers")).toBe("synthesizers");
    expect(canonicalSubcategorySlug("MIDI Keyboards & Controllers")).toBe("midi-controllers");
    expect(canonicalSubcategorySlug("61-Key USB MIDI Keyboard Controller")).toBe(
      "midi-controllers",
    );
    expect(canonicalSubcategorySlug("32-Key Compact USB MIDI Keyboard Controller")).toBe(
      "midi-controllers",
    );
    expect(canonicalSubcategoryLabel("MIDI Keyboards & Controllers")).toBe("MIDI Controllers");
    expect(canonicalSubcategorySlug("5-Inch Powered Studio Monitor")).toBe("studio-monitors");
    expect(canonicalSubcategorySlug("Dynamic Vocal Microphones")).toBe("microphones");
  });

  it("strips department prefixes from child slugs", () => {
    expect(canonicalSubcategorySlug("guitars-acoustic-guitars")).toBe("acoustic-guitars");
    expect(canonicalSubcategorySlug("accessories-music-stands")).toBe("music-stands");
    expect(canonicalSubcategorySlug("cables-xlr-cables")).toBe("xlr-cables");
  });

  it("merges fragmented singular and plural subcategories into unified facets", () => {
    const mockProducts: Product[] = [
      {
        id: "p1",
        slug: "guitar-1",
        name: "Guitar 1",
        brand: "Hertz",
        brandSlug: "hertz",
        category: "Guitars",
        categorySlug: "guitars",
        subcategory: "Acoustic Guitar",
        price: 5000,
        originalPrice: 6000,
        discountPercentage: 17,
        rating: 4.5,
        reviewCount: 10,
        stock: 5,
        status: "active",
        featured: false,
        image: "/img/1.png",
        imageColor: "#000",
        availability: "in-stock",
        condition: "new",
        features: [],
      },
      {
        id: "p2",
        slug: "guitar-2",
        name: "Guitar 2",
        brand: "Hertz",
        brandSlug: "hertz",
        category: "Guitars",
        categorySlug: "guitars",
        subcategory: "Acoustic Guitars",
        price: 7000,
        originalPrice: 8000,
        discountPercentage: 12,
        rating: 4.8,
        reviewCount: 5,
        stock: 3,
        status: "active",
        featured: false,
        image: "/img/2.png",
        imageColor: "#000",
        availability: "in-stock",
        condition: "new",
        features: [],
      },
      {
        id: "p3",
        slug: "guitar-3",
        name: "Guitar 3",
        brand: "Hertz",
        brandSlug: "hertz",
        category: "Guitars",
        categorySlug: "guitars",
        subcategory: "Guitar",
        price: 4000,
        originalPrice: 5000,
        discountPercentage: 20,
        rating: 4.2,
        reviewCount: 8,
        stock: 4,
        status: "active",
        featured: false,
        image: "/img/3.png",
        imageColor: "#000",
        availability: "in-stock",
        condition: "new",
        features: [],
      },
    ];

    const result = buildCategoryProductsResult(mockProducts, DEFAULT_FILTERS);

    // Should merge all 3 products into single canonical "Acoustic Guitars (3)" facet
    expect(result.facets.subcategories).toHaveLength(1);
    expect(result.facets.subcategories[0]).toEqual({
      slug: "acoustic-guitars",
      name: "Acoustic Guitars",
      count: 3,
    });

    // Selecting either singular or plural matches all 3 products
    const filteredResult = buildCategoryProductsResult(mockProducts, {
      ...DEFAULT_FILTERS,
      subcategories: ["acoustic-guitars"],
    });
    expect(filteredResult.total).toBe(3);
    expect(filteredResult.products).toHaveLength(3);
  });
});
