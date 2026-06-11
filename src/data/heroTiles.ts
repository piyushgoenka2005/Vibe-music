export interface HeroTilePictureSource {
  srcSet: string;
  sizes: string;
  media: string;
  width: number;
  height: number;
}

export interface HeroTileItem {
  id: string;
  sizeClass: "hero--large" | "hero--small";
  href: string;
  hpSlot: number;
  sources: [HeroTilePictureSource, HeroTilePictureSource];
  imgSrc: string;
  imgAlt: string;
  imgWidth: number;
  imgHeight: number;
}

export interface HeroTilesContent {
  sectionId: string;
  items: HeroTileItem[];
}

const SIZES_WIDE =
  "(min-width: 1440px) 910px, (min-width: 681px) calc((100vw - 60px) * 0.65942), calc(100vw - 32px)";
const SIZES_NARROW =
  "(min-width: 681px) calc((100vw - 42px) * 0.5), calc(100vw - 32px)";

function heroSrcset(imagePath: string, include320 = false): string {
  const base = `/images/m/${imagePath}?format=jpg&optimize=high&auto=webp`;
  const widths = include320
    ? [1900, 1425, 950, 825, 750, 625, 475, 320]
    : [1900, 1425, 950, 825, 750, 625, 475];

  return widths
    .map((width) => {
      const quality = width >= 1425 ? 40 : 70;
      return `${base}&quality=${quality}&width=${width} ${width}w`;
    })
    .join(", ");
}

function wideSource(
  imagePath: string,
  media: string,
  include320 = false
): HeroTilePictureSource {
  return {
    srcSet: heroSrcset(imagePath, include320),
    sizes: SIZES_WIDE,
    media,
    width: 1820,
    height: 820,
  };
}

function narrowSource(
  imagePath: string,
  media: string,
  include320 = false
): HeroTilePictureSource {
  return {
    srcSet: heroSrcset(imagePath, include320),
    sizes: SIZES_NARROW,
    media,
    width: 940,
    height: 820,
  };
}

export const HERO_TILES: HeroTilesContent = {
  sectionId: "hero-tiles",
  items: [
    {
      id: "pedal-sale",
      sizeClass: "hero--large",
      href: "/dealzone?Sale=Pedal+Sale&promo_name=PedalSale_2026&promo_id=PedalSale_2026&promo_creative=Tile&promo_position=home_page",
      hpSlot: 1,
      sources: [
        wideSource(
          "promotions/2026/0514-PedalSale/0514-PedalSale-HPBanner-Slot1-1820x820.jpg",
          "(min-width: 503px) and (max-width: 680px), (min-width: 1001px)"
        ),
        narrowSource(
          "promotions/2026/0514-PedalSale/0514-PedalSale-HPBanner-Slot2-940x820.jpg",
          "(max-width: 502px), (min-width: 681px) and (max-width: 1000px)"
        ),
      ],
      imgSrc:
        "/images/m/promotions/2026/0514-PedalSale/0514-PedalSale-HPBanner-Slot1-1820x820.jpg?width=1820&format=jpg",
      imgAlt: "Pedal Sale: Save Up to 35%",
      imgWidth: 1820,
      imgHeight: 820,
    },
    {
      id: "tama-starclassic",
      sizeClass: "hero--small",
      href: "/store/detail/MBS52RZSBSN--tama-starclassic-performer-mbs52rzs-5-piece-shell-pack-burnt-sienna-burst?promo_name=tama_starclassic_performer_2026&promo_id=tama_starclassic_performer_2026&promo_creative=Tile&promo_position=home_page",
      hpSlot: 2,
      sources: [
        wideSource(
          "product_launch/2026/0603-Tama-Starclassic_Performer/0603-Tama-Starclassic_Performer_MBS52RZS-T2-HPBanner-Slot1-1820x820.jpg",
          "(min-width: 503px) and (max-width: 680px)",
          true
        ),
        narrowSource(
          "product_launch/2026/0603-Tama-Starclassic_Performer/0603-Tama-Starclassic_Performer_MBS52RZS-T2-HPBanner-Slot2-940x820.jpg",
          "(max-width: 502px), (min-width: 681px)",
          true
        ),
      ],
      imgSrc:
        "/images/m/product_launch/2026/0603-Tama-Starclassic_Performer/0603-Tama-Starclassic_Performer_MBS52RZS-T2-HPBanner-Slot1-1820x820.jpg?width=940&format=jpg",
      imgAlt: "New TAMA Starclassic Performer",
      imgWidth: 940,
      imgHeight: 820,
    },
  ],
};
