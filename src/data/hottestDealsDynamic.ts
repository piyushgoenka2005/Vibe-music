export interface HottestDealsDynamicItem {
  id: string;
  href: string;
  brand: string;
  title: string;
  priceUsd: number;
  wasPriceUsd: number;
  badgeLabel: string;
  imageSrc: string;
  imageAlt: string;
  reviewCount: number;
  slotPosition: number;
}

export interface HottestDealsDynamicContent {
  sectionId: string;
  heading: string;
  ctaHref: string;
  ctaLabel: string;
  minRequired: number;
  items: HottestDealsDynamicItem[];
}

function detailPath(key: string, slug: string): string {
  return `/store/detail/${key}--${slug}`;
}

function img(path: string): string {
  return `https://media.vibemusic.in/m/products/image/${path}?format=webp&optimize=high&width=300`;
}

const RAW_ITEMS: HottestDealsDynamicItem[] = [
  {
    id: "SM58",
    href: detailPath("SM58", "shure-sm58-cardioid-dynamic-vocal-microphone"),
    brand: "Shure",
    title: "SM58 Cardioid Dynamic Vocal Microphone",
    priceUsd: 89.0,
    wasPriceUsd: 99.0,
    badgeLabel: "Save $10",
    imageSrc: img("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
    imageAlt: "SM58 Cardioid Dynamic Vocal Microphone",
    reviewCount: 2341,
    slotPosition: 1,
  },
  {
    id: "DT770Pro80",
    href: detailPath(
      "DT770Pro80",
      "beyerdynamic-dt-770-pro-studio-headphones-80-ohm"
    ),
    brand: "Beyerdynamic",
    title: "DT 770 Pro Studio Headphones - 80 ohm",
    priceUsd: 139.0,
    wasPriceUsd: 159.0,
    badgeLabel: "Deal",
    imageSrc: img("052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg"),
    imageAlt: "DT 770 Pro Studio Headphones - 80 ohm",
    reviewCount: 2103,
    slotPosition: 2,
  },
  {
    id: "AT2020",
    href: detailPath(
      "AT2020",
      "audio-technica-at2020-cardioid-condenser-microphone"
    ),
    brand: "Audio-Technica",
    title: "AT2020 Cardioid Condenser Microphone",
    priceUsd: 129.0,
    wasPriceUsd: 149.0,
    badgeLabel: "In Cart Savings",
    imageSrc: img("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
    imageAlt: "AT2020 Cardioid Condenser Microphone",
    reviewCount: 1876,
    slotPosition: 3,
  },
  {
    id: "HD600",
    href: detailPath("HD600", "sennheiser-hd-600-audiophile-headphones"),
    brand: "Sennheiser",
    title: "HD 600 Audiophile Headphones",
    priceUsd: 399.95,
    wasPriceUsd: 429.95,
    badgeLabel: "Hot Deal",
    imageSrc: img("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
    imageAlt: "HD 600 Audiophile Headphones",
    reviewCount: 1567,
    slotPosition: 4,
  },
  {
    id: "ScarSolo4G",
    href: detailPath(
      "ScarSolo4G",
      "focusrite-scarlett-solo-4th-gen-usb-audio-interface"
    ),
    brand: "Focusrite",
    title: "Scarlett Solo 4th Gen USB Audio Interface",
    priceUsd: 119.99,
    wasPriceUsd: 129.99,
    badgeLabel: "Special Pricing",
    imageSrc: img("6c9d9ecdf8KxbYZ66Y2FbzDnGWRM90iaN4Xlc84X.jpg"),
    imageAlt: "Scarlett Solo 4th Gen USB Audio Interface",
    reviewCount: 1234,
    slotPosition: 5,
  },
  {
    id: "FG830",
    href: detailPath("FG830", "yamaha-fg830-acoustic-guitar-natural"),
    brand: "Yamaha",
    title: "FG830 Acoustic Guitar - Natural",
    priceUsd: 299.99,
    wasPriceUsd: 339.99,
    badgeLabel: "Save $40",
    imageSrc: img("00bd892379Sq23f6EBR8T8HvBcYs9YAESicgOubo.png"),
    imageAlt: "FG830 Acoustic Guitar - Natural",
    reviewCount: 892,
    slotPosition: 6,
  },
  {
    id: "DDJFLX4",
    href: detailPath(
      "DDJFLX4",
      "pioneer-dj-ddj-flx4-2-deck-dj-controller"
    ),
    brand: "Pioneer DJ",
    title: "DDJ-FLX4 2-deck DJ Controller",
    priceUsd: 299.0,
    wasPriceUsd: 329.0,
    badgeLabel: "Deal",
    imageSrc: img("2f51071997sqxE3R3gW9W0nTbFJsJVxfRgVdqWBU.jpg"),
    imageAlt: "DDJ-FLX4 2-deck DJ Controller",
    reviewCount: 891,
    slotPosition: 7,
  },
  {
    id: "PlayerStratPW",
    href: detailPath(
      "PlayerStratPW",
      "fender-player-stratocaster-electric-guitar-polar-white"
    ),
    brand: "Fender",
    title: "Player Stratocaster Electric Guitar - Polar White",
    priceUsd: 799.99,
    wasPriceUsd: 849.99,
    badgeLabel: "Limited Time",
    imageSrc: img("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
    imageAlt: "Player Stratocaster Electric Guitar - Polar White",
    reviewCount: 412,
    slotPosition: 8,
  },
  {
    id: "K12.2",
    href: detailPath("K12.2", "qsc-k12.2-2000w-12-inch-powered-speaker"),
    brand: "QSC",
    title: "K12.2 12-inch Powered Speaker",
    priceUsd: 849.99,
    wasPriceUsd: 899.99,
    badgeLabel: "Save $50",
    imageSrc: img("6c9d9ecdf8KxbYZ66Y2FbzDnGWRM90iaN4Xlc84X.jpg"),
    imageAlt: "K12.2 12-inch Powered Speaker",
    reviewCount: 345,
    slotPosition: 9,
  },
  {
    id: "Katana50MkII",
    href: detailPath(
      "Katana50MkII",
      "boss-katana-50-mkii-guitar-combo-amplifier"
    ),
    brand: "Boss",
    title: "Katana 50 MkII Guitar Combo Amp",
    priceUsd: 269.99,
    wasPriceUsd: 299.99,
    badgeLabel: "Hot Deal",
    imageSrc: img("bfc31b3826CWeDbC6X6IuFyWAjODXQOkmAEnHPW7.jpg"),
    imageAlt: "Katana 50 MkII Guitar Combo Amp",
    reviewCount: 678,
    slotPosition: 10,
  },
];

/** Homepage deal carousel (`#hottest-deals` in main-tail). */
export const HOTTEST_DEALS_DYNAMIC: HottestDealsDynamicContent = {
  sectionId: "hottest-deals",
  heading: "More Hottest Deals",
  ctaHref: "/dealzone/",
  ctaLabel: "Shop All Hottest Deals",
  minRequired: 3,
  items: [...RAW_ITEMS].sort((a, b) => b.reviewCount - a.reviewCount),
};
