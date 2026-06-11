export interface PopularCategoryItem {
  slot: number;
  href: string;
  title: string;
  imageSrc: string;
  imageSrcSet: string;
  badge?: "New";
}

const SIZES = "(max-width:768px) 101px, (max-width:1000px) 10vw, 101px";

function webpSrcSet(path: string): string {
  return [202, 151, 101]
    .map(
      (w) =>
        `${path}?format=jpg&optimize=high&auto=webp&quality=70&width=${w} ${w}w`
    )
    .join(", ");
}

function imgSrc(path: string): string {
  return `${path}?width=200&height=200&fit=bounds&format=webp`;
}

const CAT = "/images/m/home/cats";

export const POPULAR_CATEGORY_ITEMS: PopularCategoryItem[] = [
  {
    slot: 0,
    href: "/shop/guitars/",
    title: "Guitars",
    imageSrc: imgSrc(`${CAT}/LPR59VOWCSNH.png`),
    imageSrcSet: `${CAT}/LPR59VOWCSNH.png?width=202&height=350&quality=75&optimize=high&fit=bounds&format=jpg&optimize=high&auto=webp&quality=70 202w, ${CAT}/LPR59VOWCSNH.png?width=151&height=350&quality=75&optimize=high&fit=bounds&format=jpg&optimize=high&auto=webp&quality=70 151w, ${CAT}/LPR59VOWCSNH.png?width=101&height=350&quality=75&optimize=high&fit=bounds&format=jpg&optimize=high&auto=webp&quality=70 101w`,
  },
  {
    slot: 1,
    href: "/shop/studio-recording/",
    title: "Studio & Recording",
    imageSrc: imgSrc(`${CAT}/Arrow-small.png`),
    imageSrcSet: webpSrcSet(`${CAT}/Arrow-small.png`),
  },
  {
    slot: 2,
    href: "/shop/drums-percussion/",
    title: "Drums & Percussion",
    imageSrc: imgSrc(`${CAT}/LM402.png`),
    imageSrcSet: webpSrcSet(`${CAT}/LM402.png`),
  },
  {
    slot: 3,
    href: "/shop/bass/",
    title: "Bass",
    imageSrc: imgSrc(`${CAT}/PBassAPR3SB.png`),
    imageSrcSet: webpSrcSet(`${CAT}/PBassAPR3SB.png`),
  },
  {
    slot: 4,
    href: "/shop/keyboards-synthesizers/",
    title: "Keyboards & Synth",
    imageSrc: imgSrc(`${CAT}/Matriarch.png`),
    imageSrcSet: webpSrcSet(`${CAT}/Matriarch.png`),
  },
  {
    slot: 5,
    href: "/shop/live-sound/",
    title: "Live Sound & Lights",
    imageSrc: imgSrc(`${CAT}/k12_2.png`),
    imageSrcSet: webpSrcSet(`${CAT}/k12_2.png`),
  },
  {
    slot: 6,
    href: "/shop/software-plugins/",
    title: "Software & Plug-ins",
    imageSrc: imgSrc(`${CAT}/ptstudioann.jpg`),
    imageSrcSet: webpSrcSet(`${CAT}/ptstudioann.jpg`),
  },
  {
    slot: 7,
    href: "/shop/dj-equipment/",
    title: "DJ Equipment",
    imageSrc: imgSrc(`${CAT}/ATLP120XUSBSV.png`),
    imageSrcSet: webpSrcSet(`${CAT}/ATLP120XUSBSV.png`),
  },
  {
    slot: 8,
    href: "/shop/studio-recording/microphones/",
    title: "Microphones & Wireless",
    imageSrc: imgSrc(`${CAT}/SM58-cat.png`),
    imageSrcSet: webpSrcSet(`${CAT}/SM58-cat.png`),
  },
  {
    slot: 9,
    href: "/shop/band-and-orchestra/",
    title: "Band & Orchestra",
    imageSrc: imgSrc(`${CAT}/KingSlvFlTr.png`),
    imageSrcSet: webpSrcSet(`${CAT}/KingSlvFlTr.png`),
    badge: "New",
  },
  {
    slot: 10,
    href: "/shop/home-audio-and-electronics/",
    title: "Home Audio & Electronics",
    imageSrc: imgSrc(`${CAT}/TourOneM2Bk.png`),
    imageSrcSet: webpSrcSet(`${CAT}/TourOneM2Bk.png`),
    badge: "New",
  },
  {
    slot: 11,
    href: "/shop/commercial-audio-installed-sound/",
    title: "Commercial Audio & Install",
    imageSrc: imgSrc(`${CAT}/Control28.png`),
    imageSrcSet: webpSrcSet(`${CAT}/Control28.png`),
  },
  {
    slot: 12,
    href: "/shop/accessories/",
    title: "Cables, Cases, Stands & More",
    imageSrc: imgSrc(`${CAT}/M4WP006.png`),
    imageSrcSet: webpSrcSet(`${CAT}/M4WP006.png`),
  },
  {
    slot: 13,
    href: "/shop/video-equipment/",
    title: "Video & Cameras",
    imageSrc: imgSrc(`${CAT}/EOSR82450Kit.png`),
    imageSrcSet: webpSrcSet(`${CAT}/EOSR82450Kit.png`),
    badge: "New",
  },
];

export const POPULAR_CATEGORY_IMAGE_SIZES = SIZES;
