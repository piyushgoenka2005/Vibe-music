import { slugify } from "@/lib/slug";
import type { Product, ProductAvailability, ProductCondition } from "@/types/product";

interface RawProduct {
  brand: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  availability: ProductAvailability;
  condition: ProductCondition;
  imageColor: string;
}

const RAW: RawProduct[] = [
  { brand: "Fender", name: "Player Stratocaster - Polar White", category: "Guitars", price: 849.99, rating: 4.8, reviewCount: 412, availability: "in-stock", condition: "new", imageColor: "#e8e8e8" },
  { brand: "Fender", name: "Player Telecaster - Butterscotch Blonde", category: "Guitars", price: 799.99, rating: 4.7, reviewCount: 289, availability: "in-stock", condition: "new", imageColor: "#d4a76a" },
  { brand: "Fender", name: "Vintera II '60s Stratocaster - Surf Green", category: "Guitars", price: 1099.99, rating: 4.9, reviewCount: 156, availability: "limited", condition: "new", imageColor: "#5a8a7a" },
  { brand: "Gibson", name: "Les Paul Standard '50s - Heritage Cherry", category: "Guitars", price: 2799.0, rating: 4.9, reviewCount: 198, availability: "in-stock", condition: "new", imageColor: "#8b2332" },
  { brand: "Gibson", name: "SG Standard - Walnut", category: "Guitars", price: 1799.0, rating: 4.6, reviewCount: 87, availability: "in-stock", condition: "new", imageColor: "#5c3d2e" },
  { brand: "Martin", name: "D-28 Acoustic Guitar - Natural", category: "Guitars", price: 3199.0, rating: 5.0, reviewCount: 64, availability: "in-stock", condition: "new", imageColor: "#c9a66b" },
  { brand: "Taylor", name: "214ce Deluxe Grand Auditorium", category: "Guitars", price: 1299.0, rating: 4.8, reviewCount: 231, availability: "in-stock", condition: "new", imageColor: "#b8956a" },
  { brand: "Taylor", name: "314ce V-Class Acoustic-Electric", category: "Guitars", price: 2199.0, rating: 4.9, reviewCount: 112, availability: "limited", condition: "new", imageColor: "#a07850" },
  { brand: "Epiphone", name: "Les Paul Studio - Smokehouse Burst", category: "Guitars", price: 449.0, rating: 4.5, reviewCount: 534, availability: "in-stock", condition: "new", imageColor: "#3d2817" },
  { brand: "Epiphone", name: "J-45 Studio Acoustic - Vintage Sunburst", category: "Guitars", price: 349.0, rating: 4.4, reviewCount: 178, availability: "in-stock", condition: "new", imageColor: "#6b4423" },
  { brand: "Ibanez", name: "RG550 Genesis Collection - Desert Yellow", category: "Guitars", price: 999.99, rating: 4.7, reviewCount: 203, availability: "in-stock", condition: "new", imageColor: "#c4a035" },
  { brand: "Ibanez", name: "Artcore AS73 Semi-hollow - Tobacco Brown", category: "Guitars", price: 449.99, rating: 4.6, reviewCount: 145, availability: "in-stock", condition: "new", imageColor: "#4a3020" },
  { brand: "PRS", name: "SE Custom 24 - Charcoal Burst", category: "Guitars", price: 899.0, rating: 4.8, reviewCount: 267, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "PRS", name: "SE Hollowbody II Piezo - McCarty Sunburst", category: "Guitars", price: 1099.0, rating: 4.7, reviewCount: 89, availability: "out-of-stock", condition: "new", imageColor: "#6b3a1f" },
  { brand: "Fender", name: "American Professional II Strat - Used", category: "Guitars", price: 1299.0, rating: 4.5, reviewCount: 12, availability: "in-stock", condition: "used", imageColor: "#3b6ea5" },
  { brand: "Gibson", name: "J-45 Standard - Open Box", category: "Guitars", price: 2699.0, rating: 4.8, reviewCount: 3, availability: "limited", condition: "open-box", imageColor: "#8b6914" },
  { brand: "Yamaha", name: "FG830 Acoustic Guitar - Natural", category: "Guitars", price: 339.99, rating: 4.6, reviewCount: 892, availability: "in-stock", condition: "new", imageColor: "#c4a574" },
  { brand: "Gretsch", name: "G2622 Streamliner - Village Amber", category: "Guitars", price: 549.99, rating: 4.5, reviewCount: 167, availability: "in-stock", condition: "new", imageColor: "#b8860b" },
  { brand: "SJC Custom Drums", name: "Pathfinder 3-piece Shell Pack - Firecracker Red", category: "Drums & Percussion", price: 599.0, rating: 4.7, reviewCount: 45, availability: "in-stock", condition: "new", imageColor: "#c41e3a" },
  { brand: "Sabian", name: "HHX Complex Cymbal Set - 10/14/16/18/21", category: "Drums & Percussion", price: 899.99, rating: 4.8, reviewCount: 78, availability: "in-stock", condition: "new", imageColor: "#b8860b" },
  { brand: "Roland", name: "V-Drums TD516 Electronic Drum Set", category: "Drums & Percussion", price: 2499.0, rating: 4.9, reviewCount: 134, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Yamaha", name: "DTX6K5-M Electronic Drum Set", category: "Drums & Percussion", price: 1499.99, rating: 4.6, reviewCount: 201, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "Evans", name: "EC2S Clear Tom Pack - 10/12/16", category: "Drums & Percussion", price: 54.99, rating: 4.5, reviewCount: 567, availability: "in-stock", condition: "new", imageColor: "#d4c4a8" },
  { brand: "Shure", name: "SM58 Dynamic Vocal Microphone", category: "Microphones & Wireless", price: 99.0, rating: 4.9, reviewCount: 2341, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "Audio-Technica", name: "AT2020 Cardioid Condenser Microphone", category: "Microphones & Wireless", price: 149.0, rating: 4.7, reviewCount: 1876, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Neumann", name: "U 87 Ai Condenser Microphone", category: "Microphones & Wireless", price: 3599.0, rating: 5.0, reviewCount: 89, availability: "limited", condition: "new", imageColor: "#c0c0c0" },
  { brand: "Universal Audio", name: "Apollo Twin X DUO Heritage Edition", category: "Studio & Recording", price: 999.0, rating: 4.8, reviewCount: 456, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Focusrite", name: "Scarlett Solo 4th Gen USB Interface", category: "Studio & Recording", price: 129.99, rating: 4.6, reviewCount: 1234, availability: "in-stock", condition: "new", imageColor: "#c41e3a" },
  { brand: "PreSonus", name: "Studio One 7 Professional DAW", category: "Software & Plug-ins", price: 399.95, rating: 4.5, reviewCount: 312, availability: "in-stock", condition: "new", imageColor: "#0072ba" },
  { brand: "Native Instruments", name: "Komplete 15 Standard Bundle", category: "Software & Plug-ins", price: 599.0, rating: 4.7, reviewCount: 198, availability: "in-stock", condition: "new", imageColor: "#2e2e2d" },
  { brand: "Korg", name: "Minilogue XD Analog Synthesizer", category: "Keyboards & Synthesizers", price: 649.99, rating: 4.8, reviewCount: 423, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Nord", name: "Stage 4 88-key Performance Keyboard", category: "Keyboards & Synthesizers", price: 4999.0, rating: 4.9, reviewCount: 67, availability: "in-stock", condition: "new", imageColor: "#c41e3a" },
  { brand: "QSC", name: "K12.2 12-inch Powered Speaker", category: "Live Sound & Lighting", price: 899.99, rating: 4.8, reviewCount: 345, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "JBL", name: "EON ONE Compact Portable PA", category: "Live Sound & Lighting", price: 399.99, rating: 4.5, reviewCount: 278, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Pioneer DJ", name: "DDJ-FLX4 2-deck DJ Controller", category: "DJ Equipment", price: 329.0, rating: 4.7, reviewCount: 891, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "Sennheiser", name: "HD 600 Audiophile Headphones", category: "Home Audio & Electronics", price: 429.95, rating: 4.9, reviewCount: 1567, availability: "in-stock", condition: "new", imageColor: "#c0c0c0" },
  { brand: "Beyerdynamic", name: "DT 770 Pro Studio Headphones - 80 ohm", category: "Home Audio & Electronics", price: 159.0, rating: 4.7, reviewCount: 2103, availability: "in-stock", condition: "new", imageColor: "#2e2e2e" },
  { brand: "Boss", name: "Katana 50 MkII Guitar Combo Amp", category: "Guitars", price: 299.99, rating: 4.8, reviewCount: 678, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
  { brand: "Marshall", name: "DSL40CR 40-watt Tube Combo Amp", category: "Guitars", price: 899.99, rating: 4.6, reviewCount: 234, availability: "in-stock", condition: "new", imageColor: "#1a1a1a" },
];

export const PRODUCTS: Product[] = RAW.map((item, index) => ({
  id: `prod-${index + 1}`,
  slug: slugify(`${item.brand}-${item.name}`),
  name: item.name,
  brand: item.brand,
  brandSlug: slugify(item.brand),
  category: item.category,
  categorySlug: slugify(item.category),
  price: item.price,
  rating: item.rating,
  reviewCount: item.reviewCount,
  availability: item.availability,
  condition: item.condition,
  imageColor: item.imageColor,
}));
