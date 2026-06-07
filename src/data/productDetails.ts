import { PRODUCTS } from "@/data/products";
import type {
  ProductDetail,
  ProductImage,
  ProductQA,
  ProductReview,
  ProductSpec,
  ProductVariant,
  ProductVideo,
} from "@/types/product";

function buildImages(baseColor: string, name: string): ProductImage[] {
  const shades = [
    baseColor,
    adjustBrightness(baseColor, 20),
    adjustBrightness(baseColor, -15),
    adjustBrightness(baseColor, 35),
  ];
  return shades.map((color, i) => ({
    id: `img-${i}`,
    alt: `${name} view ${i + 1}`,
    color,
  }));
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function defaultSpecs(brand: string, category: string): ProductSpec[] {
  return [
    { label: "Manufacturer", value: brand },
    { label: "Category", value: category },
    { label: "Warranty", value: "Manufacturer warranty included" },
    { label: "Country of Origin", value: "Varies by model" },
  ];
}

function defaultReviews(productName: string): ProductReview[] {
  return [
    {
      id: "rev-1",
      author: "Verified Buyer",
      rating: 5,
      title: "Excellent quality",
      body: `${productName} exceeded my expectations. Great build quality and fast shipping from Vibe Music.`,
      date: "2025-11-12",
    },
    {
      id: "rev-2",
      author: "Studio Pro",
      rating: 4,
      title: "Solid choice",
      body: "Works exactly as described. Sales engineer was very helpful picking the right model.",
      date: "2025-10-03",
    },
    {
      id: "rev-3",
      author: "Gigging Musician",
      rating: 5,
      title: "Would buy again",
      body: "Reliable gear that performs night after night. Highly recommend.",
      date: "2025-09-18",
    },
  ];
}

function defaultQA(): ProductQA[] {
  return [
    {
      id: "qa-1",
      question: "Does this include a manufacturer warranty?",
      answer:
        "Yes, all new items include the full manufacturer warranty. Our sales engineers can confirm specific terms.",
      author: "Vibe Music Gear Advisor",
      date: "2025-08-01",
    },
    {
      id: "qa-2",
      question: "What is the return policy?",
      answer:
        "Most items can be returned within 30 days. See our return policy page for complete details.",
      author: "Vibe Music Support",
      date: "2025-07-15",
    },
  ];
}

function defaultVariants(
  product: (typeof PRODUCTS)[0],
  sku: string
): ProductVariant[] {
  return [
    {
      id: "var-default",
      label: "Standard",
      sku,
      price: product.price,
      availability: product.availability,
    },
  ];
}

function enrichProduct(product: (typeof PRODUCTS)[0], index: number): ProductDetail {
  const sku = `VM-${String(index + 1).padStart(5, "0")}`;
  const onSale = index % 3 === 0;
  const msrp = onSale ? Math.round(product.price * 1.15 * 100) / 100 : null;
  const salePrice = onSale ? product.price : null;

  const sameCategory = PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  );
  const sameBrand = PRODUCTS.filter(
    (p) => p.brandSlug === product.brandSlug && p.id !== product.id
  );

  const fbt = sameCategory.slice(0, 2).map((p) => p.id);
  const similar = sameCategory.slice(0, 4).map((p) => p.id);
  const related = [...sameBrand.slice(0, 2), ...sameCategory.slice(2, 4)].map(
    (p) => p.id
  );

  const videos: ProductVideo[] =
    index % 2 === 0
      ? [
          {
            id: "vid-1",
            title: `${product.brand} ${product.name} — Product Overview`,
            thumbnailColor: "#1a1a1a",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          },
        ]
      : [];

  return {
    ...product,
    sku,
    msrp,
    salePrice,
    description: `The ${product.brand} ${product.name} delivers professional-grade performance for ${product.category.toLowerCase()} applications. Expertly set up and inspected by Vibe Music's technical team before shipping. Contact your Gear Advisor for bundle pricing and financing options.`,
    specs: [
      ...defaultSpecs(product.brand, product.category),
      { label: "Condition", value: product.condition },
      { label: "Model", value: product.name },
      { label: "SKU", value: sku },
    ],
    inTheBox: [
      product.name,
      "Manufacturer documentation",
      "Warranty card",
      product.category === "Guitars" ? "Gig bag (where applicable)" : "Standard accessories",
    ],
    images: buildImages(product.imageColor, product.name),
    videos,
    variants:
      product.category === "Guitars"
        ? [
            ...defaultVariants(product, sku),
            {
              id: "var-lefty",
              label: "Left-handed",
              sku: `${sku}-LH`,
              price: product.price + 50,
              availability: "limited",
            },
            {
              id: "var-bundle",
              label: "Essentials Bundle",
              sku: `${sku}-BDL`,
              price: product.price + 129.99,
              availability: "in-stock",
            },
          ]
        : defaultVariants(product, sku),
    reviews: defaultReviews(product.name),
    qa: defaultQA(),
    frequentlyBoughtTogether: fbt,
    similarProductIds: similar,
    relatedProductIds: related.filter((id, i, arr) => arr.indexOf(id) === i),
  };
}

const DETAIL_MAP = new Map<string, ProductDetail>(
  PRODUCTS.map((p, i) => [p.slug, enrichProduct(p, i)])
);

export function getProductDetailBySlug(slug: string): ProductDetail | undefined {
  return DETAIL_MAP.get(slug);
}

export function getProductSummaries(ids: string[]) {
  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof PRODUCTS)[0] => Boolean(p));
}

export function getAllProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}
