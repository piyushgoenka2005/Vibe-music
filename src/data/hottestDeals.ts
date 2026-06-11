export interface HottestDealItem {
  id: string;
  href: string;
  brand: string;
  title: string;
  offer: string;
  priceUsd: number;
  imageSrc: string;
  imageAlt: string;
  slotPosition: number;
}

export interface HottestDealsContent {
  sectionId: string;
  sliderId: string;
  accentLabel: string;
  heading: string;
  ctaHref: string;
  ctaLabel: string;
  items: HottestDealItem[];
}

const PROMO =
  "promo_name=promotion_drum_month_2026&promo_position=takeover&promo_id=promotion_drum_month_2026&promo_creative=algolia_item";

function detailPath(slug: string): string {
  return `/store/detail/${slug}?${PROMO}`;
}

function img(path: string): string {
  return `/images/m/products/image/${path}?format=webp&optimize=high&width=300`;
}

export const HOTTEST_DEALS: HottestDealsContent = {
  sectionId: "sales-events",
  sliderId: "tile-block-slider-0",
  accentLabel: "DRUM MONTH",
  heading: "Hottest Deals",
  ctaHref:
    "/shop/drum-month?promo_creative=4_up_algolia_slider&promo_id=promotion_drum_month_2026&promo_name=promotion_drum_month_2026&promo_position=takeover&Sale=Drum+Month",
  ctaLabel: "Shop Drum Month Deals",
  items: [
    {
      id: "PFK322FCR",
      href: detailPath(
        "PFK322FCR--sjc-custom-drums-pathfinder-series-3-piece-shell-pack-vibemusic-exclusive-firecracker-red"
      ),
      brand: "SJC Custom Drums",
      title:
        "Pathfinder Series 3-piece Shell Pack - Firecracker Red, Vibe Music Exclusive",
      offer: "$100.00 Off While Supplies Last!",
      priceUsd: 699.99,
      imageSrc: img("69f436b960RrLDFsDIXgLPzCCH9oJSPbPcMdYfbS.jpg"),
      imageAlt:
        "Pathfinder Series 3-piece Shell Pack - Firecracker Red, Vibe Music Exclusive",
      slotPosition: 1,
    },
    {
      id: "15005XCN-PW",
      href: detailPath(
        "15005XCN-PW--sabian-hhx-complex-praise-and-worship-cymbal-set-10-14-16-18-21-inch"
      ),
      brand: "Sabian",
      title: "HHX Complex Praise and Worship Cymbal Set - 10/14/16/18/21-inch",
      offer: "In Cart Savings!",
      priceUsd: 1844.99,
      imageSrc: img("7d8ba85027zDAsZN17SQ7Yc6hCF3dGKwQzBr2NHe.jpg"),
      imageAlt: "HHX Complex Praise and Worship Cymbal Set - 10/14/16/18/21-inch",
      slotPosition: 2,
    },
    {
      id: "ETPEC2SCLR-R",
      href: detailPath(
        "ETPEC2SCLR-R--evans-ec2-clear-tom-pack-10-inch-12-inch-and-16-inch-heads"
      ),
      brand: "Evans",
      title: "EC2S Clear 3-piece Tom Pack - 10/12/16 inch",
      offer: "Special Pricing In Cart!",
      priceUsd: 62.99,
      imageSrc: img("6a29cdc6e653NWv2mMN2IAdpJxfo9MiePtgYNx2u.jpg"),
      imageAlt: "EC2S Clear 3-piece Tom Pack - 10/12/16 inch",
      slotPosition: 3,
    },
    {
      id: "PFK322PT",
      href: detailPath(
        "PFK322PT--sjc-custom-drums-pathfinder-series-3-piece-shell-pack-pacific-teal"
      ),
      brand: "SJC Custom Drums",
      title: "Pathfinder Series 3-piece Shell Pack - Pacific Teal",
      offer: "$100.00 Off While Supplies Last!",
      priceUsd: 699.99,
      imageSrc: img("0bfb7dd5ef4fM3bjyW2XctnSQC7ORSu1wrTO5vGW.jpg"),
      imageAlt: "Pathfinder Series 3-piece Shell Pack - Pacific Teal",
      slotPosition: 4,
    },
    {
      id: "KSCombo",
      href: detailPath(
        "KSCombo--audix-kscombo-kick-and-snare-combo-microphone-pack"
      ),
      brand: "Audix",
      title: "KS-COMBO Kick and Snare Combo Microphone Pack - Vibe Music Exclusive",
      offer: "$50.00 Off! ",
      priceUsd: 209.0,
      imageSrc: img("93f4ec03belwWbJX6HeMCCsZsxwVcbVqlzdksq0p.jpg"),
      imageAlt:
        "KS-COMBO Kick and Snare Combo Microphone Pack - Vibe Music Exclusive",
      slotPosition: 5,
    },
    {
      id: "HolyXplosion",
      href: detailPath(
        "HolyXplosion--sabian-holy-by-plosion-5-piece-cymbal-pack-vibemusic-exclusive"
      ),
      brand: "Sabian",
      title: "Holy X-Plosion 5-piece Cymbal Pack - Vibe Music Exclusive",
      offer: "Free 90-day Drumeo Subscription, a $90 Value!",
      priceUsd: 1399.99,
      imageSrc: img("b41f4728f7aBKVMZqC5YaL9C1UTXTnah2gnWXXIs.jpg"),
      imageAlt: "Holy X-Plosion 5-piece Cymbal Pack - Vibe Music Exclusive",
      slotPosition: 6,
    },
    {
      id: "AR628SFUJG",
      href: detailPath(
        "AR628SFUJG--mapex-armory-6-piece-studioease-fast-tom-shell-pack-ocean-sunset-vibemusic-exclusive"
      ),
      brand: "Mapex",
      title:
        "Armory Studioease Fast Tom 6-piece Shell Pack - Ocean Sunset, Vibe Music Exclusive",
      offer: "In Cart Savings!",
      priceUsd: 1149.0,
      imageSrc: img("58ce46e2b3XupsQH4ypwsRLZmUfF83D2KnOFz4r9.jpg"),
      imageAlt:
        "Armory Studioease Fast Tom 6-piece Shell Pack - Ocean Sunset, Vibe Music Exclusive",
      slotPosition: 7,
    },
    {
      id: "EAD50",
      href: detailPath("EAD50--yamaha-ead50-drum-microphone-system"),
      brand: "Yamaha",
      title: "EAD50 Electronic Acoustic Drum Microphone System",
      offer: "Free 90-Day Drumeo Access, a $90 Value!",
      priceUsd: 1599.99,
      imageSrc: img("3117168a14JTj6XIw4IjM9iBvwKf9gHSNrs6eISd.jpg"),
      imageAlt: "EAD50 Electronic Acoustic Drum Microphone System",
      slotPosition: 8,
    },
    {
      id: "TD516Set",
      href: detailPath("TD516Set--roland-v-drums-td516-electronic-drum-set"),
      brand: "Roland",
      title: "V-Drums TD516 Electronic Drum Set",
      offer: "Free Drum Rug and Throne, a $467.98 Value!",
      priceUsd: 3699.99,
      imageSrc: img("d5f3f1b2c78xULfk7NhSGimayfOdkytdcce8pzLL.png"),
      imageAlt: "V-Drums TD516 Electronic Drum Set",
      slotPosition: 9,
    },
    {
      id: "ETPEC2SCLR-F",
      href: detailPath(
        "ETPEC2SCLR-F--evans-ec2-clear-tom-pack-10-inch-12-inch-and-14-inch-heads"
      ),
      brand: "Evans",
      title: "EC2S Clear 3-piece Tom Pack - 10/12/14 inch",
      offer: "Special Pricing In Cart!",
      priceUsd: 60.99,
      imageSrc: img("2b058eeef1wuBYbGFLC6haPndeW1eaz42iaGYGHv.jpg"),
      imageAlt: "EC2S Clear 3-piece Tom Pack - 10/12/14 inch",
      slotPosition: 10,
    },
    {
      id: "CT1R444-GCB",
      href: detailPath(
        "CT1R444-GCB--gretsch-drums-catalina-club-rock-4-piece-shell-pack-with-snare-drum-gloss-crimson-burst"
      ),
      brand: "Gretsch Drums",
      title:
        "Catalina Club CT1-R444C 4-piece Shell Pack with Snare Drum - Gloss Crimson Burst",
      offer: "$200.00 Off While Supplies Last!",
      priceUsd: 899.0,
      imageSrc: img("a3ed954ac7CvdCoWkx1P018ThZZzEyueBd1bfwNH.jpg"),
      imageAlt:
        "Catalina Club CT1-R444C 4-piece Shell Pack with Snare Drum - Gloss Crimson Burst",
      slotPosition: 11,
    },
    {
      id: "DP7Plus",
      href: detailPath("DP7Plus--audix-dp7-plus-bundle"),
      brand: "Audix",
      title: "DP7 Plus 8-piece Drum Microphone Package - Vibe Music Exclusive",
      offer: "$180.00 Off! ",
      priceUsd: 1049.0,
      imageSrc: img("71b5cdb57bPlS2RnbdV8zcC1T9nMF6tbXCvPj3a0.jpg"),
      imageAlt: "DP7 Plus 8-piece Drum Microphone Package - Vibe Music Exclusive",
      slotPosition: 12,
    },
    {
      id: "RBH565AW-4PFG",
      href: detailPath(
        "RBH565AW-4PFG--promark-select-balance-rebound-hickory-drumsticks-0.565-inch-acorn-tip-firegrain-bonus-4-pack"
      ),
      brand: "Promark",
      title:
        "Select Balance Rebound Hickory Drumsticks - 0.565-inch - Acorn Tip - FireGrain Bonus 4-pack",
      offer: "Special Pricing In Cart!",
      priceUsd: 50.99,
      imageSrc: img("1d69d00e14uSYM8Bd0AxIb3AtF0ZZOK9pKtJC5Et.jpg"),
      imageAlt:
        "Select Balance Rebound Hickory Drumsticks - 0.565-inch - Acorn Tip - FireGrain Bonus 4-pack",
      slotPosition: 13,
    },
    {
      id: "TD316Set",
      href: detailPath("TD316Set--roland-v-drums-td316-electronic-drum-set"),
      brand: "Roland",
      title: "V-Drums TD316 Electronic Drum Set",
      offer: "Free Drum Rug and Throne, a $467.98 Value!",
      priceUsd: 1999.99,
      imageSrc: img("e2a4a54e3bS3MOeQEG3awuSQxjAzbcs5KUqzQ2k1.png"),
      imageAlt: "V-Drums TD316 Electronic Drum Set",
      slotPosition: 14,
    },
    {
      id: "VPackArena",
      href: detailPath(
        "VPackArena--se-electronics-v-pack-arena-drum-microphone-package"
      ),
      brand: "sE Electronics",
      title: "V Pack Arena Drum Microphone Package",
      offer: "$240.00 Off!",
      priceUsd: 959.0,
      imageSrc: img("e16e626024URZjYqVjeOqGG9y6umyahXtIGIn036.jpg"),
      imageAlt: "V Pack Arena Drum Microphone Package",
      slotPosition: 15,
    },
    {
      id: "25005XC-PWB",
      href: detailPath("25005XC-PWB--sabian-aax-praise-and-worship-cymbal-pack"),
      brand: "Sabian",
      title: "AAX Praise and Worship 5-piece Cymbal Pack",
      offer: "In Cart Savings!",
      priceUsd: 1124.99,
      imageSrc: img("7156198b0f7dj9QC8vAX1QKy7GIx1JIuQquoi1kf.jpg"),
      imageAlt: "AAX Praise and Worship 5-piece Cymbal Pack",
      slotPosition: 16,
    },
    {
      id: "VPackArenaBlk",
      href: detailPath(
        "VPackArenaBlk--se-electronics-v-pack-arena-drum-microphone-package-black-vibemusic-exclusive"
      ),
      brand: "sE Electronics",
      title: "V Pack Arena Drum Microphone Pack - Black, Vibe Music Exclusive",
      offer: "$240.00 Off!",
      priceUsd: 959.0,
      imageSrc: img("48cd2db6332S3HWO4LvJ7f8EYqG2UKUkajza9HVr.jpg"),
      imageAlt: "V Pack Arena Drum Microphone Pack - Black, Vibe Music Exclusive",
      slotPosition: 17,
    },
    {
      id: "DTX6K5-M",
      href: detailPath("DTX6K5-M--yamaha-dtx6k5-m-electronic-drum-set"),
      brand: "Yamaha",
      title: "DTX6K5-M Electronic Drum Set",
      offer: "Free 90-Day Drumeo Access, a $90 Value!",
      priceUsd: 1699.99,
      imageSrc: img("dedeb79b0eWuWuppxR5s7jaiXZTO6qCT1KkpUAuW.jpg"),
      imageAlt: "DTX6K5-M Electronic Drum Set",
      slotPosition: 18,
    },
    {
      id: "AR628S-OZ",
      href: detailPath(
        "AR628S-OZ--mapex-armory-studioease-6-piece-shell-pack-black-onyx-burst"
      ),
      brand: "Mapex",
      title: "Armory Studioease 6-piece Shell Pack - Black Onyx Burst",
      offer: "In Cart Savings!",
      priceUsd: 1249.0,
      imageSrc: img("945709f1deXY7AzOz02yYRwMocZKPSz9n912MMkF.png"),
      imageAlt: "Armory Studioease 6-piece Shell Pack - Black Onyx Burst",
      slotPosition: 19,
    },
    {
      id: "TX5AW-4P",
      href: detailPath(
        "TX5AW-4P--promark-hickory-drumsticks-5a-wood-tip-4-pack"
      ),
      brand: "Promark",
      title: "Classic Forward Drumsticks - 5A, 4-pack",
      offer: "Special Pricing In Cart!",
      priceUsd: 50.99,
      imageSrc: img("c76d2cc0bdUKP4XhGpEJxE0V42inYteb03BQuRv2.jpg"),
      imageAlt: "Classic Forward Drumsticks - 5A, 4-pack",
      slotPosition: 20,
    },
  ],
};
