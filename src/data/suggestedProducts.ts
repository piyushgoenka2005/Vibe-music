export interface SuggestedProductItem {
  id: string;
  href: string;
  brand: string;
  title: string;
  priceUsd: number;
  imageSrc: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  slotPosition: number;
}

export interface SuggestedProductsContent {
  sectionId: string;
  heading: string;
  items: SuggestedProductItem[];
}

function detailPath(key: string, slug: string): string {
  return `/store/detail/${key}--${slug}`;
}

function img(path: string): string {
  return `https://media.vibemusic.in/m/products/image/${path}?format=webp&optimize=high&width=300`;
}

export const SUGGESTED_PRODUCTS: SuggestedProductsContent = {
  sectionId: "suggested-products",
  heading: "Suggested For You",
  items: [
    {
      id: "SM58",
      href: detailPath("SM58", "shure-sm58-cardioid-dynamic-vocal-microphone"),
      brand: "Shure",
      title: "SM58 Cardioid Dynamic Vocal Microphone",
      priceUsd: 99.0,
      imageSrc: img("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
      imageAlt: "SM58 Cardioid Dynamic Vocal Microphone",
      rating: 4.9,
      reviewCount: 2341,
      slotPosition: 1,
    },
    {
      id: "PlayerStratPW",
      href: detailPath(
        "PlayerStratPW",
        "fender-player-stratocaster-electric-guitar-polar-white"
      ),
      brand: "Fender",
      title: "Player Stratocaster Electric Guitar - Polar White",
      priceUsd: 849.99,
      imageSrc: img("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Player Stratocaster Electric Guitar - Polar White",
      rating: 4.8,
      reviewCount: 412,
      slotPosition: 2,
    },
    {
      id: "ScarSolo4G",
      href: detailPath(
        "ScarSolo4G",
        "focusrite-scarlett-solo-4th-gen-usb-audio-interface"
      ),
      brand: "Focusrite",
      title: "Scarlett Solo 4th Gen USB Audio Interface",
      priceUsd: 129.99,
      imageSrc: img("052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg"),
      imageAlt: "Scarlett Solo 4th Gen USB Audio Interface",
      rating: 4.6,
      reviewCount: 1234,
      slotPosition: 3,
    },
    {
      id: "FG830",
      href: detailPath("FG830", "yamaha-fg830-acoustic-guitar-natural"),
      brand: "Yamaha",
      title: "FG830 Acoustic Guitar - Natural",
      priceUsd: 339.99,
      imageSrc: img("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "FG830 Acoustic Guitar - Natural",
      rating: 4.6,
      reviewCount: 892,
      slotPosition: 4,
    },
    {
      id: "TD516",
      href: detailPath(
        "TD516",
        "roland-v-drums-td516-electronic-drum-set"
      ),
      brand: "Roland",
      title: "V-Drums TD516 Electronic Drum Set",
      priceUsd: 2499.0,
      imageSrc: img("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "V-Drums TD516 Electronic Drum Set",
      rating: 4.9,
      reviewCount: 134,
      slotPosition: 5,
    },
    {
      id: "DDJFLX4",
      href: detailPath(
        "DDJFLX4",
        "pioneer-dj-ddj-flx4-2-deck-dj-controller"
      ),
      brand: "Pioneer DJ",
      title: "DDJ-FLX4 2-deck DJ Controller",
      priceUsd: 329.0,
      imageSrc: img("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "DDJ-FLX4 2-deck DJ Controller",
      rating: 4.7,
      reviewCount: 891,
      slotPosition: 6,
    },
    {
      id: "HD600",
      href: detailPath(
        "HD600",
        "sennheiser-hd-600-open-back-audiophile-headphones"
      ),
      brand: "Sennheiser",
      title: "HD 600 Open-back Audiophile Headphones",
      priceUsd: 429.95,
      imageSrc: img("0bfb7dd5ef4fM3bjyW2XctnSQC7ORSu1wrTO5vGW.jpg"),
      imageAlt: "HD 600 Open-back Audiophile Headphones",
      rating: 4.9,
      reviewCount: 1567,
      slotPosition: 7,
    },
    {
      id: "Katana50MkII",
      href: detailPath(
        "Katana50MkII",
        "boss-katana-50-mkii-guitar-combo-amplifier"
      ),
      brand: "Boss",
      title: "Katana 50 MkII Guitar Combo Amplifier",
      priceUsd: 299.99,
      imageSrc: img("93f4ec03belwWbJX6HeMCCsZsxwVcbVqlzdksq0p.jpg"),
      imageAlt: "Katana 50 MkII Guitar Combo Amplifier",
      rating: 4.8,
      reviewCount: 678,
      slotPosition: 8,
    },
  ],
};
