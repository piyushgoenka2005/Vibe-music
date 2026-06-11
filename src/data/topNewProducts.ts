export interface TopNewProductImage {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
}

export interface TopNewProductItem {
  id: string;
  rank: number;
  href: string;
  brand: string;
  title: string;
  priceUsd: number;
  preorder: boolean;
  preorderLabel: string;
  image: TopNewProductImage;
  hpSlot: number;
}

export interface TopNewProductsContent {
  sectionId: string;
  heading: string;
  ctaHref: string;
  ctaLabel: string;
  items: TopNewProductItem[];
}

const PICTURE_SIZES = "(max-width:992px) 90px, 120px";

function itemImage(
  fileName: string,
  hash: string,
  hmac: string,
  alt: string
): TopNewProductImage {
  const base = `https://media.vibemusic.in/api/i/q-85__b-original__w-{w}__h-{w}__bg-ffffff__ha-${hash}__hmac-${hmac}__f-jpg__optimize-high__auto-webp__quality-70/images/items/350/${fileName}`;
  const widths = [360, 270, 180, 120, 90] as const;
  const srcSet = widths
    .map((w) => `${base.replace("{w}", String(w))} ${w}w`)
    .join(", ");
  const src = `https://media.vibemusic.in/api/i/q-85__b-original__w-300__h-300__bg-ffffff__ha-${hash}__hmac-${hmac}/images/items/350/${fileName}`;

  return {
    src,
    srcSet,
    sizes: PICTURE_SIZES,
    alt,
    width: 300,
    height: 300,
  };
}

export const TOP_NEW_PRODUCTS: TopNewProductsContent = {
  sectionId: "top-new-products",
  heading: "Top New Musical Instruments & Gear",
  ctaHref: "/nowshipping",
  ctaLabel: "See All Top New Gear",
  items: [
    {
      id: "JN80",
      rank: 1,
      href: "/store/detail/JN80--behringer-jn-80-analog-synthesizer",
      brand: "Behringer",
      title: "JN-80 Analog Synthesizer",
      priceUsd: 669.0,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "JN80.jpg",
        "ce923d13ba031eff",
        "b7d6e0740208b89e37389dfc471aef8bce29a0a6",
        "JN-80 Analog Synthesizer"
      ),
      hpSlot: 0,
    },
    {
      id: "SEESHBBarPK",
      rank: 2,
      href: "/store/detail/SEESHBBarPK--prs-se-ed-sheeran-hollowbody-i-piezo-baritone-electric-guitar-kaleidoscope",
      brand: "PRS",
      title:
        "SE Ed Sheeran Hollowbody I Piezo Baritone Electric Guitar - Kaleidoscope",
      priceUsd: 1499.0,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "SEESHBBarPK.jpg",
        "c5a43f2f6cc67eb2",
        "8c7a394aa71a33c19ca1d76658db24139d437674",
        "SE Ed Sheeran Hollowbody I Piezo Baritone Electric Guitar - Kaleidoscope"
      ),
      hpSlot: 1,
    },
    {
      id: "ISAC8X",
      rank: 3,
      href: "/store/detail/ISAC8X--focusrite-isa-c8x-usb-c-audio-interface",
      brand: "Focusrite",
      title: "ISA C8X USB-C Audio Interface",
      priceUsd: 2299.99,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "ISAC8X.jpg",
        "369c4026dd8a4d27",
        "2b207c05b8b35d85655a18cc7761d1c7d7d2a78c",
        "ISA C8X USB-C Audio Interface"
      ),
      hpSlot: 2,
    },
    {
      id: "TeleU275LG",
      rank: 4,
      href: "/store/detail/TeleU275LG--fender-75th-anniversary-american-ultra-ii-telecaster-electric-guitar-liquid-gold",
      brand: "Fender",
      title:
        "75th Anniversary American Ultra II Telecaster Electric Guitar - Liquid Gold",
      priceUsd: 2999.99,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "TeleU275LG.jpg",
        "001a4143919fdd93",
        "55d50b48ffa022262b2d10ec155a06fbebe695d9",
        "75th Anniversary American Ultra II Telecaster Electric Guitar - Liquid Gold"
      ),
      hpSlot: 3,
    },
    {
      id: "QCMini",
      rank: 5,
      href: "/store/detail/QCMini--neural-dsp-quad-cortex-mini-modeling-and-effects-processor-vibemusic-exclusive",
      brand: "Neural DSP",
      title:
        "Quad Cortex Mini Modeling and Effects Processor, Vibe Music Exclusive",
      priceUsd: 1399.0,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "QCMini.jpg",
        "3bf85b7160c1ef99",
        "fe952421fac55dca36a64f2749e786e98f0fa426",
        "Quad Cortex Mini Modeling and Effects Processor, Vibe Music Exclusive"
      ),
      hpSlot: 4,
    },
    {
      id: "MPCSample",
      rank: 6,
      href: "/store/detail/MPCSample--akai-professional-mpc-sample-portable-groovebox",
      brand: "Akai Professional",
      title: "MPC Sample Portable Groovebox",
      priceUsd: 399.0,
      preorder: true,
      preorderLabel: "Available for Pre-Order!",
      image: itemImage(
        "MPCSample.jpg",
        "19c03a90a9a38cc1",
        "0a99fe05d3989dbcb7bdf743f01091687859994b",
        "MPC Sample Portable Groovebox"
      ),
      hpSlot: 5,
    },
  ],
};
