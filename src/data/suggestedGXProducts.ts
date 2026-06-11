export interface SuggestedGXProductItem {
  id: string;
  href: string;
  brand: string;
  title: string;
  priceUsd: number;
  listedPriceUsd: number;
  imageSrc: string;
  imageAlt: string;
  customerSinceYear: number;
  slotPosition: number;
  shippingLabel: string;
}

export interface SuggestedGXProductsContent {
  sectionId: string;
  heading: string;
  subtextHtml: string;
  gearExchangeHref: string;
  overlayImageSrc: string;
  overlayImageAlt: string;
  items: SuggestedGXProductItem[];
}

function detailPath(key: string, slug: string): string {
  return `/store/detail/${key}--${slug}`;
}

function img(path: string): string {
  return `/images/m/products/image/${path}?format=webp&optimize=high&width=300`;
}

/** Homepage Gear Exchange carousel (`#suggested-gx-products`). */
export const SUGGESTED_GX_PRODUCTS: SuggestedGXProductsContent = {
  sectionId: "suggested-gx-products",
  heading: "Gear Exchange Picks",
  subtextHtml:
    "Certified pre-owned and open-box deals from trusted sellers.",
  gearExchangeHref: "/used",
  overlayImageSrc:
    "/images/m/home/0817-gx-new-homepagetile.jpg?format=webp",
  overlayImageAlt: "",
  items: [
    {
      id: "AmPro2Strat",
      href: detailPath(
        "AmPro2Strat",
        "fender-american-professional-ii-strat-used"
      ),
      brand: "Fender",
      title: "American Professional II Strat - Used",
      priceUsd: 1299.0,
      listedPriceUsd: 1699.0,
      imageSrc: img("b26fe96b93ir7YHzi8IW3B2sVDCy1V9ynJFdMPr2.jpg"),
      imageAlt: "Fender American Professional II Strat - Used",
      customerSinceYear: 2018,
      slotPosition: 1,
      shippingLabel: "Free Shipping",
    },
    {
      id: "J45OB",
      href: detailPath("J45OB", "gibson-j-45-standard-open-box"),
      brand: "Gibson",
      title: "J-45 Standard - Open Box",
      priceUsd: 2699.0,
      listedPriceUsd: 2999.0,
      imageSrc: img("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt: "Gibson J-45 Standard - Open Box",
      customerSinceYear: 2020,
      slotPosition: 2,
      shippingLabel: "Free Shipping",
    },
    {
      id: "HD600U",
      href: detailPath(
        "HD600U",
        "sennheiser-hd-600-open-back-audiophile-headphones-used"
      ),
      brand: "Sennheiser",
      title: "HD 600 Open-back Headphones - Used",
      priceUsd: 349.0,
      listedPriceUsd: 429.95,
      imageSrc: img("0bfb7dd5ef4fM3bjyW2XctnSQC7ORSu1wrTO5vGW.jpg"),
      imageAlt: "Sennheiser HD 600 Open-back Headphones - Used",
      customerSinceYear: 2017,
      slotPosition: 3,
      shippingLabel: "Free Shipping",
    },
    {
      id: "Katana50U",
      href: detailPath("Katana50U", "boss-katana-50-mkii-combo-used"),
      brand: "Boss",
      title: "Katana 50 MkII Combo - Used",
      priceUsd: 219.0,
      listedPriceUsd: 299.99,
      imageSrc: img("93f4ec03belwWbJX6HeMCCsZsxwVcbVqlzdksq0p.jpg"),
      imageAlt: "Boss Katana 50 MkII Combo - Used",
      customerSinceYear: 2019,
      slotPosition: 4,
      shippingLabel: "Free Shipping",
    },
    {
      id: "SM58U",
      href: detailPath("SM58U", "shure-sm58-dynamic-vocal-microphone-used"),
      brand: "Shure",
      title: "SM58 Dynamic Vocal Microphone - Used",
      priceUsd: 79.0,
      listedPriceUsd: 99.0,
      imageSrc: img("d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"),
      imageAlt: "Shure SM58 Dynamic Vocal Microphone - Used",
      customerSinceYear: 2016,
      slotPosition: 5,
      shippingLabel: "Free Shipping",
    },
    {
      id: "ScarSoloOB",
      href: detailPath(
        "ScarSoloOB",
        "focusrite-scarlett-solo-4th-gen-open-box"
      ),
      brand: "Focusrite",
      title: "Scarlett Solo 4th Gen - Open Box",
      priceUsd: 109.0,
      listedPriceUsd: 129.99,
      imageSrc: img("052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg"),
      imageAlt: "Focusrite Scarlett Solo 4th Gen - Open Box",
      customerSinceYear: 2021,
      slotPosition: 6,
      shippingLabel: "Free Shipping",
    },
  ],
};
