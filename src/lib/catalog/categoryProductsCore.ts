import type { Product } from "@/types/product";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";
import { normalizeCategoryFilters } from "@/lib/filterUrl";
import { formatSubcategoryLabel } from "@/lib/product/productBreadcrumb";
import { slugify } from "@/lib/slug";
import { specValueSlug } from "@/lib/catalog/listingFilterSpecs";

export const CATEGORY_PAGE_SIZE = 12;

/** Category facet slug for guitar/studio amplifiers (split from parent category counts). */
export const AMPLIFIER_FACET_SLUG = "amplifier";

/** Known irregular or specific subcategory normalizations (maps singular/split variants to canonical plurals). */
const CANONICAL_SUBCATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  guitar: { slug: "acoustic-guitars", name: "Acoustic Guitars" },
  guitars: { slug: "acoustic-guitars", name: "Acoustic Guitars" },
  "acoustic-guitar": { slug: "acoustic-guitars", name: "Acoustic Guitars" },
  "acoustic-guitars": { slug: "acoustic-guitars", name: "Acoustic Guitars" },
  "electric-guitar": { slug: "electric-guitars", name: "Electric Guitars" },
  "electric-guitars": { slug: "electric-guitars", name: "Electric Guitars" },
  "electro-acoustic-guitar": { slug: "electro-acoustic-guitars", name: "Electro-Acoustic Guitars" },
  "electro-acoustic-guitars": {
    slug: "electro-acoustic-guitars",
    name: "Electro-Acoustic Guitars",
  },
  "semi-acoustic-guitar": { slug: "semi-acoustic-guitars", name: "Semi-Acoustic Guitars" },
  "semi-acoustic-guitars": { slug: "semi-acoustic-guitars", name: "Semi-Acoustic Guitars" },
  "cutaway-semi-acoustic-guitar": {
    slug: "cutaway-semi-acoustic-guitars",
    name: "Cutaway Semi-Acoustic Guitars",
  },
  "cutaway-semi-acoustic-guitars": {
    slug: "cutaway-semi-acoustic-guitars",
    name: "Cutaway Semi-Acoustic Guitars",
  },
  "dreadnought-cutaway-semi-acoustic-guitar": {
    slug: "dreadnought-cutaway-semi-acoustic-guitars",
    name: "Dreadnought Cutaway Semi-Acoustic Guitars",
  },
  "dreadnought-cutaway-semi-acoustic-guitars": {
    slug: "dreadnought-cutaway-semi-acoustic-guitars",
    name: "Dreadnought Cutaway Semi-Acoustic Guitars",
  },
  "grand-auditorium-acoustic-guitar": {
    slug: "grand-auditorium-acoustic-guitars",
    name: "Grand Auditorium Acoustic Guitars",
  },
  "grand-auditorium-acoustic-guitars": {
    slug: "grand-auditorium-acoustic-guitars",
    name: "Grand Auditorium Acoustic Guitars",
  },
  "superstrat-electric-guitar": {
    slug: "superstrat-electric-guitars",
    name: "SuperStrat Electric Guitars",
  },
  "superstrat-electric-guitars": {
    slug: "superstrat-electric-guitars",
    name: "SuperStrat Electric Guitars",
  },
  "hss-superstrat-electric-guitar": {
    slug: "hss-superstrat-electric-guitars",
    name: "HSS SuperStrat Electric Guitars",
  },
  "hss-superstrat-electric-guitars": {
    slug: "hss-superstrat-electric-guitars",
    name: "HSS SuperStrat Electric Guitars",
  },
  cymbal: { slug: "cymbals", name: "Cymbals" },
  cymbals: { slug: "cymbals", name: "Cymbals" },
  "crash-cymbal": { slug: "crash-cymbals", name: "Crash Cymbals" },
  "crash-cymbals": { slug: "crash-cymbals", name: "Crash Cymbals" },
  "splash-cymbal": { slug: "splash-cymbals", name: "Splash Cymbals" },
  "splash-cymbals": { slug: "splash-cymbals", name: "Splash Cymbals" },
  "effect-cymbal": { slug: "effect-cymbals", name: "Effect Cymbals" },
  "effect-cymbals": { slug: "effect-cymbals", name: "Effect Cymbals" },
  "music-stand": { slug: "music-stands", name: "Music Stands" },
  "music-stands": { slug: "music-stands", name: "Music Stands" },
  "keyboard-stand": { slug: "keyboard-stands", name: "Keyboard Stands" },
  "keyboard-stands": { slug: "keyboard-stands", name: "Keyboard Stands" },
  "microphone-stand": { slug: "microphone-stands", name: "Microphone Stands" },
  "microphone-stands": { slug: "microphone-stands", name: "Microphone Stands" },
  "guitar-amplifier": { slug: "guitar-amplifiers", name: "Guitar Amplifiers" },
  "guitar-amplifiers": { slug: "guitar-amplifiers", name: "Guitar Amplifiers" },
  "portable-keyboard": { slug: "portable-keyboards", name: "Portable Keyboards" },
  "portable-keyboards": { slug: "portable-keyboards", name: "Portable Keyboards" },
  "arranger-keyboard": { slug: "arranger-keyboards", name: "Arranger Keyboards" },
  "arranger-keyboards": { slug: "arranger-keyboards", name: "Arranger Keyboards" },
  "stage-keyboard": { slug: "stage-keyboards", name: "Stage Keyboards" },
  "stage-keyboards": { slug: "stage-keyboards", name: "Stage Keyboards" },
  "digital-piano": { slug: "digital-pianos", name: "Digital Pianos" },
  "digital-pianos": { slug: "digital-pianos", name: "Digital Pianos" },
  "drum-throne": { slug: "drum-thrones", name: "Drum Thrones" },
  "drum-thrones": { slug: "drum-thrones", name: "Drum Thrones" },
  "drum-rack": { slug: "drum-racks", name: "Drum Racks" },
  "drum-racks": { slug: "drum-racks", name: "Drum Racks" },
  "drum-rack-clamp": { slug: "drum-rack-clamps", name: "Drum Rack Clamps" },
  "drum-rack-clamps": { slug: "drum-rack-clamps", name: "Drum Rack Clamps" },
  "bass-drum-pedal": { slug: "bass-drum-pedals", name: "Bass Drum Pedals" },
  "bass-drum-pedals": { slug: "bass-drum-pedals", name: "Bass Drum Pedals" },
  "double-bass-drum-pedal": { slug: "double-bass-drum-pedals", name: "Double Bass Drum Pedals" },
  "double-bass-drum-pedals": { slug: "double-bass-drum-pedals", name: "Double Bass Drum Pedals" },
  "electronic-drum-kit": { slug: "electronic-drum-kits", name: "Electronic Drum Kits" },
  "electronic-drum-kits": { slug: "electronic-drum-kits", name: "Electronic Drum Kits" },
  "electronic-percussion-pad": {
    slug: "electronic-percussion-pads",
    name: "Electronic Percussion Pads",
  },
  "electronic-percussion-pads": {
    slug: "electronic-percussion-pads",
    name: "Electronic Percussion Pads",
  },
  "tom-mounts-holder": { slug: "tom-mounts-holders", name: "Tom Mounts & Holders" },
  "tom-mounts-holders": { slug: "tom-mounts-holders", name: "Tom Mounts & Holders" },
  "boom-cymbal-stand": { slug: "boom-cymbal-stands", name: "Boom Cymbal Stands" },
  "boom-cymbal-stands": { slug: "boom-cymbal-stands", name: "Boom Cymbal Stands" },
  "hi-hat-stand": { slug: "hi-hat-stands", name: "Hi-Hat Stands" },
  "hi-hat-stands": { slug: "hi-hat-stands", name: "Hi-Hat Stands" },
  "instrument-cable": { slug: "instrument-cables", name: "Instrument Cables" },
  "instrument-cables": { slug: "instrument-cables", name: "Instrument Cables" },
  "guitar-instrument-cable": { slug: "instrument-cables", name: "Instrument Cables" },
  "guitar-instrument-cables": { slug: "instrument-cables", name: "Instrument Cables" },
  "guitar-and-instrument-cables": { slug: "instrument-cables", name: "Instrument Cables" },
  "guitar-cable": { slug: "instrument-cables", name: "Instrument Cables" },
  "guitar-cables": { slug: "instrument-cables", name: "Instrument Cables" },
  "xlr-cable": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "xlr-cables": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "xlr-mic-cable": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "xlr-mic-cables": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "microphone-cable": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "microphone-cables": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "xlr-microphone-audio-cables": { slug: "xlr-cables", name: "XLR & Mic Cables" },
  "patch-cable": { slug: "patch-cables", name: "Patch Cables" },
  "patch-cables": { slug: "patch-cables", name: "Patch Cables" },
  "audio-interface": { slug: "audio-interfaces", name: "Audio Interfaces" },
  "audio-interfaces": { slug: "audio-interfaces", name: "Audio Interfaces" },
  "audio-interfaces-recording-mixers": { slug: "audio-interfaces", name: "Audio Interfaces" },
  "studio-monitor": { slug: "studio-monitors", name: "Studio Monitors" },
  "studio-monitors": { slug: "studio-monitors", name: "Studio Monitors" },
  "studio-desk": { slug: "studio-furniture", name: "Studio Furniture" },
  "studio-furniture": { slug: "studio-furniture", name: "Studio Furniture" },
  "midi-controller": { slug: "midi-controllers", name: "MIDI Controllers" },
  "midi-controllers": { slug: "midi-controllers", name: "MIDI Controllers" },
  "acoustic-drum-kit": { slug: "acoustic-drum-kits", name: "Acoustic Drum Kits" },
  "acoustic-drum-kits": { slug: "acoustic-drum-kits", name: "Acoustic Drum Kits" },
  "acoustic-kit": { slug: "acoustic-drum-kits", name: "Acoustic Drum Kits" },
  "acoustic-kits": { slug: "acoustic-drum-kits", name: "Acoustic Drum Kits" },
  synthesizer: { slug: "synthesizers", name: "Synthesizers" },
  synthesizers: { slug: "synthesizers", name: "Synthesizers" },
  "performance-synthesizer": { slug: "synthesizers", name: "Synthesizers" },
  "performance-synthesizers": { slug: "synthesizers", name: "Synthesizers" },
  "audio-mixer": { slug: "audio-mixers", name: "Audio Mixers" },
  "audio-mixers": { slug: "audio-mixers", name: "Audio Mixers" },
};

export function canonicalSubcategorySlug(raw: string): string {
  let s = slugify((raw ?? "").trim().toLowerCase());
  if (!s) return "";

  // Strip common department prefixes if attached (e.g. "guitars-acoustic-guitars" -> "acoustic-guitars")
  const prefixes = [
    "guitars-",
    "cables-",
    "accessories-",
    "drums-percussion-",
    "keyboards-synthesizers-",
    "keyboards-pianos-",
    "microphones-wireless-",
    "studio-recording-",
    "live-sound-lighting-",
    "amplifiers-effects-",
    "dj-equipment-",
  ];
  for (const p of prefixes) {
    if (s.startsWith(p) && s.length > p.length) {
      s = s.slice(p.length);
      break;
    }
  }

  const mapped = CANONICAL_SUBCATEGORY_MAP[s];
  if (mapped) return mapped.slug;

  if (s.endsWith("ies")) return s;
  if (s.endsWith("y") && !/[aeiou]y$/.test(s)) {
    return s.slice(0, -1) + "ies";
  }
  if (s.endsWith("ss")) return s;
  if (!s.endsWith("s")) {
    if (s.endsWith("ch") || s.endsWith("sh") || s.endsWith("x") || s.endsWith("z")) {
      return s + "es";
    }
    return s + "s";
  }
  return s;
}

export function canonicalSubcategoryLabel(raw: string): string {
  const s = slugify((raw ?? "").trim().toLowerCase());
  const mapped = CANONICAL_SUBCATEGORY_MAP[s];
  if (mapped) return mapped.name;

  const label = formatSubcategoryLabel(raw);
  if (!label) return "";

  const singularEndings = [
    "Guitar",
    "Cymbal",
    "Stand",
    "Cable",
    "Microphone",
    "Speaker",
    "Monitor",
    "Headphone",
    "Recorder",
    "Synthesizer",
    "Piano",
    "Pedal",
    "Mixer",
    "Clamp",
    "Throne",
    "Pad",
    "Kit",
  ];
  for (const ending of singularEndings) {
    if (label.endsWith(` ${ending}`)) {
      return label + "s";
    }
    if (label === ending) {
      return label + "s";
    }
  }

  return label;
}

export function isAmplifierProduct(product: Pick<Product, "subcategory" | "name">): boolean {
  const subcategory = product.subcategory?.trim() ?? "";
  if (/amplifier/i.test(subcategory)) return true;
  return /\bamplifier\b/i.test(product.name);
}

export interface FacetOption {
  slug: string;
  name: string;
  count: number;
}

export interface SpecFacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
}

function sortProducts(products: Product[], sort: CategoryFilters["sort"]): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating-desc":
      return copy.sort((a, b) => b.rating - a.rating);
    default:
      return copy;
  }
}

type FilterExclusion = "brands" | "subcategories" | "categories" | "specs";

function productMatchesSpecs(product: Product, specs: Record<string, string[]>): boolean {
  const filterSpecs = product.filterSpecs;
  if (!filterSpecs) return Object.keys(specs).length === 0;

  return Object.entries(specs).every(([label, valueSlugs]) => {
    if (!valueSlugs.length) return true;
    const productValue = filterSpecs[label];
    if (!productValue) return false;
    return valueSlugs.includes(specValueSlug(productValue));
  });
}

function applyFilters(
  products: Product[],
  filters: CategoryFilters,
  exclude?: FilterExclusion,
): Product[] {
  let result = products;

  if (exclude !== "brands" && filters.brands.length > 0) {
    const activeBrands = new Set(filters.brands.map((brand) => brand.toLowerCase()));
    result = result.filter((product) => activeBrands.has(product.brandSlug.toLowerCase()));
  }

  if (exclude !== "categories" && filters.categories.length > 0) {
    const activeCategories = new Set(filters.categories.map((slug) => slug.toLowerCase()));
    result = result.filter((product) =>
      Array.from(activeCategories).some((slug) => {
        if (slug === AMPLIFIER_FACET_SLUG) return isAmplifierProduct(product);
        return product.categorySlug.toLowerCase() === slug && !isAmplifierProduct(product);
      }),
    );
  }

  if (exclude !== "subcategories" && filters.subcategories.length > 0) {
    const activeSubcategories = new Set(
      filters.subcategories
        .flatMap((slug) => [slug.toLowerCase(), canonicalSubcategorySlug(slug)])
        .filter(Boolean),
    );
    const activeSubList = Array.from(activeSubcategories);
    result = result.filter((product) => {
      const raw = product.subcategory ?? "";
      if (!raw) return false;
      const rawSlug = slugify(raw);
      const canonSlug = canonicalSubcategorySlug(raw);
      if (
        (rawSlug && activeSubcategories.has(rawSlug)) ||
        (canonSlug && activeSubcategories.has(canonSlug))
      ) {
        return true;
      }
      return activeSubList.some((active) => {
        const stem = active.replace(/s$/, "");
        return rawSlug.includes(active) || rawSlug.includes(stem) || active.includes(rawSlug);
      });
    });
  }

  if (exclude !== "specs" && Object.keys(filters.specs).length > 0) {
    result = result.filter((product) => productMatchesSpecs(product, filters.specs));
  }

  if (filters.minPrice !== null) {
    result = result.filter((product) => product.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== null) {
    result = result.filter((product) => product.price <= filters.maxPrice!);
  }

  if (filters.rating !== null) {
    result = result.filter((product) => product.rating >= filters.rating!);
  }

  if (filters.availability !== "all") {
    result = result.filter((product) => product.availability === filters.availability);
  }

  if (filters.conditions.length > 0) {
    result = result.filter((product) => filters.conditions.includes(product.condition));
  }

  return result;
}

function buildBrandFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    const existing = counts.get(product.brandSlug);
    if (existing) existing.count += 1;
    else counts.set(product.brandSlug, { name: product.brand, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCategoryFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    if (isAmplifierProduct(product)) {
      const existing = counts.get(AMPLIFIER_FACET_SLUG);
      if (existing) existing.count += 1;
      else counts.set(AMPLIFIER_FACET_SLUG, { name: "Amplifier", count: 1 });
      return;
    }

    const existing = counts.get(product.categorySlug);
    if (existing) existing.count += 1;
    else counts.set(product.categorySlug, { name: product.category, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSubcategoryFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    const raw = product.subcategory?.trim();
    if (!raw) return;
    const slug = canonicalSubcategorySlug(raw);
    const label = canonicalSubcategoryLabel(raw);
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
      if (label.endsWith("s") && !existing.name.endsWith("s")) {
        existing.name = label;
      }
    } else {
      counts.set(slug, { name: label, count: 1 });
    }
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSpecificationFacets(products: Product[]): SpecFacetGroup[] {
  const groups = new Map<string, Map<string, { name: string; count: number }>>();

  products.forEach((product) => {
    const specs = product.filterSpecs;
    if (!specs) return;
    for (const [label, value] of Object.entries(specs)) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const valueSlug = specValueSlug(trimmed);
      if (!groups.has(label)) groups.set(label, new Map());
      const bucket = groups.get(label)!;
      const existing = bucket.get(valueSlug);
      if (existing) existing.count += 1;
      else bucket.set(valueSlug, { name: trimmed, count: 1 });
    }
  });

  return Array.from(groups.entries())
    .map(([label, valueCounts]) => ({
      key: slugify(label),
      label,
      options: Array.from(valueCounts.entries())
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.options.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getFilteredListingProducts(
  products: Product[],
  filtersInput: CategoryFilters,
): Product[] {
  const filters = normalizeCategoryFilters(filtersInput);
  return sortProducts(applyFilters(products, filters), filters.sort);
}

export function buildCategoryProductsResult(
  categoryProducts: Product[],
  filtersInput: CategoryFilters,
): CategoryProductsResult {
  const filters = normalizeCategoryFilters(filtersInput);
  const filtered = applyFilters(categoryProducts, filters);
  const sorted = sortProducts(filtered, filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * CATEGORY_PAGE_SIZE;
  const products = sorted.slice(start, start + CATEGORY_PAGE_SIZE);

  const prices = categoryProducts.map((product) => product.price).filter((price) => price > 0);

  const brandPool = applyFilters(categoryProducts, filters, "brands");
  const categoryPool = applyFilters(categoryProducts, filters, "categories");
  const subcategoryPool = applyFilters(categoryProducts, filters, "subcategories");
  const specPool = applyFilters(categoryProducts, filters, "specs");

  return {
    products,
    total,
    page,
    pageSize: CATEGORY_PAGE_SIZE,
    totalPages,
    facets: {
      brands: buildBrandFacets(brandPool),
      categories: buildCategoryFacets(categoryPool),
      subcategories: buildSubcategoryFacets(subcategoryPool),
      specs: buildSpecificationFacets(specPool),
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    },
  };
}
