import { POPULAR_CATEGORIES } from "@/lib/constants";
import type {
  SearchBrand,
  SearchCategory,
  SearchProduct,
} from "@/types/search";

const RAW_PRODUCTS: Array<{
  brand: string;
  name: string;
  category: string;
  price: number;
}> = [
  {
    brand: "Fender",
    name: "Player Stratocaster Electric Guitar - Polar White",
    category: "Guitars",
    price: 849.99,
  },
  {
    brand: "Gibson",
    name: "Les Paul Standard '50s Electric Guitar - Heritage Cherry Sunburst",
    category: "Guitars",
    price: 2799.0,
  },
  {
    brand: "Martin",
    name: "D-28 Acoustic Guitar - Natural",
    category: "Guitars",
    price: 3199.0,
  },
  {
    brand: "Taylor",
    name: "214ce Deluxe Grand Auditorium Acoustic-Electric Guitar",
    category: "Guitars",
    price: 1299.0,
  },
  {
    brand: "SJC Custom Drums",
    name: "Pathfinder Series 3-piece Shell Pack - Firecracker Red",
    category: "Drums & Percussion",
    price: 599.0,
  },
  {
    brand: "Sabian",
    name: "HHX Complex Praise and Worship Cymbal Set",
    category: "Drums & Percussion",
    price: 899.99,
  },
  {
    brand: "Evans",
    name: "EC2S Clear 3-piece Tom Pack - 10/12/16 inch",
    category: "Drums & Percussion",
    price: 54.99,
  },
  {
    brand: "Roland",
    name: "V-Drums TD516 Electronic Drum Set",
    category: "Drums & Percussion",
    price: 2499.0,
  },
  {
    brand: "Yamaha",
    name: "DTX6K5-M Electronic Drum Set",
    category: "Drums & Percussion",
    price: 1499.99,
  },
  {
    brand: "Shure",
    name: "SM58 Dynamic Vocal Microphone",
    category: "Microphones & Wireless",
    price: 99.0,
  },
  {
    brand: "Audio-Technica",
    name: "AT2020 Cardioid Condenser Microphone",
    category: "Microphones & Wireless",
    price: 149.0,
  },
  {
    brand: "Neumann",
    name: "U 87 Ai Large-diaphragm Condenser Microphone",
    category: "Microphones & Wireless",
    price: 3599.0,
  },
  {
    brand: "Universal Audio",
    name: "Apollo Twin X DUO Heritage Edition Thunderbolt Audio Interface",
    category: "Studio & Recording",
    price: 999.0,
  },
  {
    brand: "Focusrite",
    name: "Scarlett Solo 4th Gen USB Audio Interface",
    category: "Studio & Recording",
    price: 129.99,
  },
  {
    brand: "PreSonus",
    name: "Studio One 7 Professional DAW Software",
    category: "Software & Plug-ins",
    price: 399.95,
  },
  {
    brand: "Native Instruments",
    name: "Komplete 15 Standard Software Bundle",
    category: "Software & Plug-ins",
    price: 599.0,
  },
  {
    brand: "Korg",
    name: "Minilogue XD Polyphonic Analog Synthesizer",
    category: "Keyboards & Synthesizers",
    price: 649.99,
  },
  {
    brand: "Nord",
    name: "Stage 4 88-key Performance Keyboard",
    category: "Keyboards & Synthesizers",
    price: 4999.0,
  },
  {
    brand: "QSC",
    name: "K12.2 12-inch 2,000W Powered Speaker",
    category: "Live Sound & Lighting",
    price: 899.99,
  },
  {
    brand: "JBL",
    name: "EON ONE Compact Portable PA System",
    category: "Live Sound & Lighting",
    price: 399.99,
  },
  {
    brand: "Pioneer DJ",
    name: "DDJ-FLX4 2-deck DJ Controller",
    category: "DJ Equipment",
    price: 329.0,
  },
  {
    brand: "Sennheiser",
    name: "HD 600 Open-back Audiophile Headphones",
    category: "Headphones",
    price: 429.95,
  },
  {
    brand: "Beyerdynamic",
    name: "DT 770 Pro Closed-back Studio Headphones - 80 ohm",
    category: "Headphones",
    price: 159.0,
  },
  {
    brand: "Boss",
    name: "Katana 50 MkII Guitar Combo Amplifier",
    category: "Guitar Amps",
    price: 299.99,
  },
  {
    brand: "Marshall",
    name: "DSL40CR 40-watt Tube Guitar Combo Amp",
    category: "Guitar Amps",
    price: 899.99,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const SEARCH_PRODUCTS: SearchProduct[] = RAW_PRODUCTS.map(
  (product, index) => ({
    id: `product-${index + 1}`,
    brand: product.brand,
    name: product.name,
    slug: slugify(`${product.brand}-${product.name}`),
    category: product.category,
    price: product.price,
    image: "",
  })
);

export const SEARCH_CATEGORIES: SearchCategory[] = POPULAR_CATEGORIES.map(
  (name, index) => ({
    id: `category-${index + 1}`,
    name,
    slug: slugify(name),
  })
);

export const SEARCH_BRANDS: SearchBrand[] = Array.from(
  new Set(RAW_PRODUCTS.map((p) => p.brand))
)
  .sort()
  .map((name, index) => ({
    id: `brand-${index + 1}`,
    name,
    slug: slugify(name),
  }));

export const RECOMMENDED_PRODUCTS = SEARCH_PRODUCTS.slice(0, 8);
