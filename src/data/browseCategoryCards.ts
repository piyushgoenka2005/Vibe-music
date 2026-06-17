import { categoryPath, ROUTES } from "@/lib/routes";

const CME_CDN = "https://www.chicagomusicexchange.com/cdn/shop/files";

export interface BrowseCategoryCard {
  id: string;
  title: string;
  href: string;
  image: string;
  srcSet: string;
  width: number;
  height: number;
}

function cmeImage(
  fileStem: string,
  version: string,
  width: number,
  height: number
): Pick<BrowseCategoryCard, "image" | "srcSet" | "width" | "height"> {
  const image = `${CME_CDN}/${fileStem}_800x.jpg?v=${version}`;
  const srcSet = [
    `${CME_CDN}/${fileStem}_300x.jpg?v=${version} 300w`,
    `${CME_CDN}/${fileStem}_768x.jpg?v=${version} 768w`,
    `${image} 800w`,
  ].join(", ");

  return { image, srcSet, width, height };
}

/** CME-style browse category cards — imagery from reference layout. */
export const BROWSE_CATEGORY_CARDS: BrowseCategoryCard[] = [
  {
    id: "electric-guitars",
    title: "Electric Guitars",
    href: categoryPath("guitars"),
    ...cmeImage("07.21.22-Gift_of_Music-Fender_Group-11", "1714497237", 1200, 801),
  },
  {
    id: "vintage-used",
    title: "Vintage & Used",
    href: `${ROUTES.searchResults}?q=vintage`,
    ...cmeImage(
      "03.2_4.20_-_Vintage_Guitar_Group-2_c18c0982-991b-4306-bdf1-2ecfb37a8411",
      "1714497704",
      1600,
      1280
    ),
  },
  {
    id: "acoustic-guitars",
    title: "Acoustic Guitars",
    href: `${ROUTES.searchResults}?q=acoustic`,
    ...cmeImage("11.01.22-_CME_Collection-Acoustic_Group-12", "1714409828", 1080, 719),
  },
  {
    id: "amplifiers",
    title: "Amplifiers",
    href: `${ROUTES.searchResults}?q=amplifiers`,
    ...cmeImage(
      "10.20.21_-_Arlington_Collection_2021_-_Fender-Marshall_Amplifiers-6",
      "1754926486",
      1512,
      1080
    ),
  },
  {
    id: "bass-guitars",
    title: "Bass Guitars",
    href: categoryPath("bass"),
    ...cmeImage("05.23.23_-_Vintage_Fender_Bass_Group_-_1", "1714499433", 1080, 1080),
  },
  {
    id: "effects-pedals",
    title: "Effects & Pedals",
    href: `${ROUTES.searchResults}?q=effects`,
    ...cmeImage(
      "02.23.21_-_Vintage_Pedal_Group_-_Klon_Centaur-Ibanez_TS9-TS-808_-_U3055590001-U3185752701-U3101464404-U3185752704-5",
      "1754926869",
      1280,
      1600
    ),
  },
  {
    id: "exclusive-gear",
    title: "CME Exclusive Gear",
    href: `${ROUTES.searchResults}?q=exclusive`,
    image: `${CME_CDN}/06.29.21_-_Earthquaker_Devices_CME_Exclusive_Group_-_EQDAVALV2USACME3-EQDAVALV2USACME2-EQDDATAV1USACME-EQDAFTEV3USACME2-EQDRAINV2USACME-EQDHOOFV2USACME-EQDDISPV3USACME3-EQDACAPV2USACM_800x.jpg?v=1714499082`,
    srcSet: [
      `${CME_CDN}/06.29.21_-_Earthquaker_Devices_CME_Exclusive_Group_-_EQDAVALV2USACME3-EQDAVALV2USACME2-EQDDATAV1USACME-EQDAFTEV3USACME2-EQDRAINV2USACME-EQDHOOFV2USACME-EQDDISPV3USACME3-EQDACAPV2USACM_300x.jpg?v=1714499082 300w`,
      `${CME_CDN}/06.29.21_-_Earthquaker_Devices_CME_Exclusive_Group_-_EQDAVALV2USACME3-EQDAVALV2USACME2-EQDDATAV1USACME-EQDAFTEV3USACME2-EQDRAINV2USACME-EQDHOOFV2USACME-EQDDISPV3USACME3-EQDACAPV2USACM_768x.jpg?v=1714499082 768w`,
      `${CME_CDN}/06.29.21_-_Earthquaker_Devices_CME_Exclusive_Group_-_EQDAVALV2USACME3-EQDAVALV2USACME2-EQDDATAV1USACME-EQDAFTEV3USACME2-EQDRAINV2USACME-EQDHOOFV2USACME-EQDDISPV3USACME3-EQDACAPV2USACM_800x.jpg?v=1714499082 800w`,
    ].join(", "),
    width: 1280,
    height: 1600,
  },
  {
    id: "the-vault",
    title: "The Vault",
    href: `${ROUTES.searchResults}?q=vault`,
    ...cmeImage("CME-The-Vault-Web-121_1", "1732728714", 2800, 2013),
  },
];

export const BROWSE_CATEGORY_CARDS_CTA = ROUTES.search;
