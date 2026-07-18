import { productPath } from "@/lib/routes";

export interface HeroMarqueeProduct {
  id: string;
  name: string;
  price: string;
  revenue: string;
  growth: string;
  image: string;
  imageAlt: string;
  /** Direct product URL override */
  href?: string;
  /** Catalog slug — resolved to /product/[slug] */
  slug?: string;
}

/**
 * Every Find Your Product / hero marquee card maps to a real catalog PDP.
 * Never fall through to search results — clicks must open that product only.
 */
const HERO_MARQUEE_SLUGS: Record<string, string> = {
  // Track 1
  "t1-1": "adeon-acm18-acm18",
  "t1-2": "adeon-ad12-dsp-ad12-dsp",
  "t1-3": "adeon-adeon-aedan-pro1-adeon-aedan-pro1",
  "t1-4": "nord-stage-4-88-key-performance-keyboard",
  "t1-5": "hertz-hza-4060-hza-4060",
  "t1-6": "avus-avus-dazyan-18-avus-dazyan-18",
  "t1-7": "adeon-adm01-adm-01",
  "t1-8": "adeon-adeon-hdm-50-hdm-50",
  "t1-9": "hertz-dg40-dg40",
  // Track 2
  "t2-1": "roland-roland-ex-10-roland-ex-10",
  "t2-2": "nord-stage-4-88-key-performance-keyboard",
  "t2-3": "trinity-trinity-pa-75x-trinity-pa-75x",
  "t2-4": "hertz-dg-20-dg-20",
  "t2-5": "adeon-admic-admic",
  "t2-6": "adeon-adeon-hdm-50-hdm-50",
  "t2-7": "adeon-ad15dsp-ad15dsp",
  "t2-8": "avus-avus-zapcrash-16-avus-zapcrash-16",
  "t2-9": "roland-roland-ex-20-roland-ex-20",
  // Track 3
  "t3-1": "adeon-adeon-ax-mcs-adeon-ax-mcs-2022",
  "t3-2": "adeon-adeon-ams-122f-adeon-ams-122f",
  "t3-3": "adeon-acon-acon",
  "t3-4": "adeon-adeon-aedan-pro1-adeon-aedan-pro1",
  "t3-5": "adeon-acm24-acm-24",
  "t3-6": "hertz-dg40-dg40",
  "t3-7": "trinity-trinity-pa-75x-trinity-pa-75x",
  "t3-8": "hertz-hzauk-2-ukulele-hzauk-2-ukulele",
  "t3-9": "adeon-adeon-ax-ns-13-adeon-ax-ns-13",
  // Track 4
  "t4-1": "adeon-admic-admic",
  "t4-2": "adeon-ad15dsp-ad15dsp",
  "t4-3": "hertz-hza-6000-hza-6000",
  "t4-4": "nord-stage-4-88-key-performance-keyboard",
  "t4-5": "adeon-ams84f-ams84f",
  "t4-6": "roland-roland-ex-30-roland-ex-30",
  "t4-7": "adeon-acm18-acm18",
  "t4-8": "avus-avus-hathor-16-avus-hathor-16",
  "t4-9": "adeon-adeon-ax-mcs-adeon-ax-mcs-2022",
  // Track 5
  "t5-1": "adeon-acon-acon",
  "t5-2": "adeon-acm24-acm-24",
  "t5-3": "adeon-adeon-hdm-50-hdm-50",
  "t5-4": "hertz-hza3900eq-hza3900eq",
  "t5-5": "trinity-trinity-pa-75x-trinity-pa-75x",
  "t5-6": "adeon-adeon-ax-kb-41xl-adeon-ax-kb-41xl",
  "t5-7": "hertz-hza4503-hza4503",
  "t5-8": "hertz-dg-20-dg-20",
  "t5-9": "adeon-adeon-ams-122f-adeon-ams-122f",
};

/** Always resolve to a single product PDP — never a search/results list. */
export function heroMarqueeProductHref(product: HeroMarqueeProduct): string {
  if (product.href?.startsWith("/product/")) return product.href;

  const slug = product.slug ?? HERO_MARQUEE_SLUGS[product.id];
  if (slug) return productPath(slug);

  // Safety net: still a product page, never search results.
  return productPath("adeon-acm18-acm18");
}

/** Pre-generated 96px WebP thumbs — avoid multi‑MB masters for 44px cards. */
const THUMB = "/images/m/products/thumbs";
const IMG = (filename: string) => {
  const base = filename.replace(/\.(png|jpe?g|webp)$/i, "");
  return `${THUMB}/${base}.webp`;
};
const CAT = (name: string) => `${THUMB}/${name}.webp`;

/** Product rows for horizontal marquee tracks */
export const HERO_MARQUEE_TRACKS: HeroMarqueeProduct[][] = [
  [
    {
      id: "t1-1",
      name: "Apollo Twin Interface",
      price: "₹79,999",
      revenue: "₹3,84,920",
      growth: "18.4%",
      image: CAT("Arrow-small"),
      imageAlt: "Universal Audio Apollo Twin audio interface",
    },
    {
      id: "t1-2",
      name: "Studio Monitor Pair",
      price: "₹19,999",
      revenue: "₹72,614",
      growth: "6.8%",
      image: CAT("k12_2"),
      imageAlt: "QSC live sound speaker",
    },
    {
      id: "t1-3",
      name: "Condenser Mic Kit",
      price: "₹26,999",
      revenue: "₹1,12,947",
      growth: "7.2%",
      image: IMG("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
      imageAlt: "Studio condenser microphone",
    },
    {
      id: "t1-4",
      name: "MIDI Controller 61",
      price: "₹34,999",
      revenue: "₹1,28,450",
      growth: "11.6%",
      image: CAT("Matriarch"),
      imageAlt: "Synthesizer keyboard controller",
    },
    {
      id: "t1-5",
      name: "Electric Guitar Pro",
      price: "₹39,999",
      revenue: "₹3,01,540",
      growth: "15.7%",
      image: CAT("Electric-Orange-Guitar"),
      imageAlt: "Electric guitar",
    },
    {
      id: "t1-6",
      name: "Drum Shell Pack",
      price: "₹18,999",
      revenue: "₹1,34,882",
      growth: "17.2%",
      image: CAT("LM402"),
      imageAlt: "Premium snare drum",
    },
    {
      id: "t1-7",
      name: "Audio Interface 2x2",
      price: "₹21,999",
      revenue: "₹68,741",
      growth: "4.7%",
      image: IMG("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Compact audio interface",
    },
    {
      id: "t1-8",
      name: "In-Ear Monitors",
      price: "₹12,999",
      revenue: "₹58,917",
      growth: "3.9%",
      image: IMG("00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png"),
      imageAlt: "In-ear monitor headphones",
    },
    {
      id: "t1-9",
      name: "Guitar Pedalboard",
      price: "₹24,999",
      revenue: "₹43,817",
      growth: "11.5%",
      image: IMG("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "Guitar effects pedal",
    },
  ],
  [
    {
      id: "t2-1",
      name: "DJ Controller Pro",
      price: "₹27,999",
      revenue: "₹24,700",
      growth: "4.6%",
      image: CAT("ATLP120XUSBSV"),
      imageAlt: "DJ turntable controller",
    },
    {
      id: "t2-2",
      name: "Stage Piano 88",
      price: "₹32,999",
      revenue: "₹4,21,766",
      growth: "24.6%",
      image: CAT("Matriarch"),
      imageAlt: "Stage piano keyboard",
    },
    {
      id: "t2-3",
      name: "LED Par Light",
      price: "₹29,999",
      revenue: "₹1,87,290",
      growth: "13.2%",
      image: IMG("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "Stage lighting fixture",
    },
    {
      id: "t2-4",
      name: "Bass Combo Amp",
      price: "₹16,999",
      revenue: "₹12,732",
      growth: "9.4%",
      image: IMG("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "Bass guitar amplifier",
    },
    {
      id: "t2-5",
      name: "Wireless Mic System",
      price: "₹29,999",
      revenue: "₹74,632",
      growth: "2.1%",
      image: IMG("bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg"),
      imageAlt: "Wireless microphone system",
    },
    {
      id: "t2-6",
      name: "Studio Headphones",
      price: "₹24,999",
      revenue: "₹38,176",
      growth: "4.1%",
      image: IMG("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
      imageAlt: "Professional studio headphones",
    },
    {
      id: "t2-7",
      name: "PA Speaker 12\"",
      price: "₹34,999",
      revenue: "₹2,01,012",
      growth: "22.7%",
      image: CAT("k12_2"),
      imageAlt: "PA loudspeaker",
    },
    {
      id: "t2-8",
      name: "Drum Cymbal Set",
      price: "₹17,999",
      revenue: "₹83,219",
      growth: "6.1%",
      image: IMG("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "Cymbal pack",
    },
    {
      id: "t2-9",
      name: "Pro Tools Studio",
      price: "₹14,999",
      revenue: "₹19,472",
      growth: "9.3%",
      image: CAT("ptstudioann"),
      imageAlt: "DAW software box",
    },
  ],
  [
    {
      id: "t3-1",
      name: "Vocal Booth Shield",
      price: "₹22,999",
      revenue: "₹1,64,872",
      growth: "12.4%",
      image: IMG("00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png"),
      imageAlt: "Vocal isolation shield",
    },
    {
      id: "t3-2",
      name: "Cable Tester Pro",
      price: "₹12,999",
      revenue: "₹1,17,904",
      growth: "12.1%",
      image: IMG("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "Audio cable tester",
    },
    {
      id: "t3-3",
      name: "Mixer Control Surface",
      price: "₹24,999",
      revenue: "₹1,53,770",
      growth: "9.8%",
      image: IMG("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Mixer control surface",
    },
    {
      id: "t3-4",
      name: "Dynamic Mic SM58",
      price: "₹29,999",
      revenue: "₹42,432",
      growth: "13.7%",
      image: IMG("bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg"),
      imageAlt: "Dynamic vocal microphone",
    },
    {
      id: "t3-5",
      name: "Portable Recorder",
      price: "₹34,999",
      revenue: "₹81,273",
      growth: "11.2%",
      image: IMG("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "Field audio recorder",
    },
    {
      id: "t3-6",
      name: "Loop Station Pedal",
      price: "₹21,999",
      revenue: "₹19,918",
      growth: "4.7%",
      image: CAT("LM402"),
      imageAlt: "Guitar loop pedal",
    },
    {
      id: "t3-7",
      name: "RGB Stage Light",
      price: "₹27,999",
      revenue: "₹24,178",
      growth: "11.3%",
      image: IMG("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
      imageAlt: "RGB stage lighting",
    },
    {
      id: "t3-8",
      name: "Ukulele Starter Pack",
      price: "₹9,999",
      revenue: "₹11,179",
      growth: "4.6%",
      image: IMG("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "Ukulele beginner bundle",
    },
    {
      id: "t3-9",
      name: "Monitor Stand Pair",
      price: "₹24,999",
      revenue: "₹43,817",
      growth: "11.5%",
      image: CAT("ptstudioann"),
      imageAlt: "Studio monitor stands",
    },
  ],
  [
    {
      id: "t4-1",
      name: "Ribbon Microphone",
      price: "₹31,999",
      revenue: "₹96,420",
      growth: "8.9%",
      image: IMG("bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg"),
      imageAlt: "Ribbon studio microphone",
    },
    {
      id: "t4-2",
      name: "Subwoofer 18\"",
      price: "₹42,999",
      revenue: "₹2,14,880",
      growth: "19.1%",
      image: CAT("k12_2"),
      imageAlt: "Powered subwoofer",
    },
    {
      id: "t4-3",
      name: "Acoustic Guitar",
      price: "₹18,999",
      revenue: "₹67,310",
      growth: "5.4%",
      image: CAT("Electric-Orange-Guitar"),
      imageAlt: "Acoustic guitar",
    },
    {
      id: "t4-4",
      name: "Synthesizer Module",
      price: "₹49,999",
      revenue: "₹1,78,640",
      growth: "14.2%",
      image: CAT("Matriarch"),
      imageAlt: "Modular synthesizer",
    },
    {
      id: "t4-5",
      name: "DI Box Active",
      price: "₹8,999",
      revenue: "₹31,220",
      growth: "3.2%",
      image: IMG("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "Active direct box",
    },
    {
      id: "t4-6",
      name: "Turntable Bundle",
      price: "₹36,999",
      revenue: "₹1,09,774",
      growth: "10.8%",
      image: CAT("ATLP120XUSBSV"),
      imageAlt: "DJ turntable bundle",
    },
    {
      id: "t4-7",
      name: "Monitor Controller",
      price: "₹28,999",
      revenue: "₹54,901",
      growth: "6.7%",
      image: IMG("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Studio monitor controller",
    },
    {
      id: "t4-8",
      name: "Hihat Cymbal Pair",
      price: "₹11,999",
      revenue: "₹47,662",
      growth: "4.9%",
      image: CAT("LM402"),
      imageAlt: "Hi-hat cymbals",
    },
    {
      id: "t4-9",
      name: "Podcast Mic Arm",
      price: "₹6,999",
      revenue: "₹22,418",
      growth: "7.1%",
      image: IMG("00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png"),
      imageAlt: "Broadcast mic boom arm",
    },
  ],
  [
    {
      id: "t5-1",
      name: "Tube Preamp",
      price: "₹54,999",
      revenue: "₹2,48,120",
      growth: "21.3%",
      image: CAT("Arrow-small"),
      imageAlt: "Vacuum tube preamp",
    },
    {
      id: "t5-2",
      name: "Digital Mixer 16ch",
      price: "₹89,999",
      revenue: "₹4,02,880",
      growth: "16.9%",
      image: IMG("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Digital mixing console",
    },
    {
      id: "t5-3",
      name: "Stage In-Ear Pack",
      price: "₹44,999",
      revenue: "₹1,31,540",
      growth: "12.6%",
      image: IMG("00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png"),
      imageAlt: "Wireless in-ear monitor system",
    },
    {
      id: "t5-4",
      name: "Electric Violin",
      price: "₹22,999",
      revenue: "₹78,904",
      growth: "8.1%",
      image: IMG("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "Electric violin",
    },
    {
      id: "t5-5",
      name: "Fog Machine Pro",
      price: "₹15,999",
      revenue: "₹61,772",
      growth: "9.5%",
      image: IMG("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "Stage fog machine",
    },
    {
      id: "t5-6",
      name: "Keyboard Stand X",
      price: "₹7,999",
      revenue: "₹28,640",
      growth: "4.2%",
      image: CAT("ptstudioann"),
      imageAlt: "Heavy-duty keyboard stand",
    },
    {
      id: "t5-7",
      name: "Bass Guitar 5-String",
      price: "₹38,999",
      revenue: "₹1,56,220",
      growth: "13.4%",
      image: CAT("Electric-Orange-Guitar"),
      imageAlt: "Five-string bass guitar",
    },
    {
      id: "t5-8",
      name: "Reverb Pedal",
      price: "₹13,999",
      revenue: "₹44,118",
      growth: "5.8%",
      image: IMG("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "Studio reverb pedal",
    },
    {
      id: "t5-9",
      name: "XLR Cable Pack",
      price: "₹4,999",
      revenue: "₹18,902",
      growth: "2.7%",
      image: IMG("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "Professional XLR cable set",
    },
  ],
];

export const HERO_MARQUEE_ITEMS_PER_COLUMN = 6;

export function trimMarqueeTrack(
  track: HeroMarqueeProduct[]
): HeroMarqueeProduct[] {
  return track.slice(0, HERO_MARQUEE_ITEMS_PER_COLUMN);
}

/** Alias for Find Your Product scanner section */
export const FIND_YOUR_PRODUCT_TRACKS = HERO_MARQUEE_TRACKS;
