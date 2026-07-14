import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/layout/Reveal";
import { ROUTES } from "@/lib/routes";

/** Space-free path — avoids Next image optimizer encoding quirks. */
const BANNER_SRC = "/images/win-this-rig.jpeg";
const BANNER_WIDTH = 1500;
const BANNER_HEIGHT = 200;

export default function HomepagePromoBanner() {
  return (
    <Reveal
      as="section"
      className="homepage-promo-banner"
      aria-label="Promotions — see if a giveaway is active"
      immediate
    >
      <div className="homepage-promo-banner__inner">
        <Link href={ROUTES.giveaway} className="homepage-promo-banner__link">
          <Image
            src={BANNER_SRC}
            alt="Vibe Music promotions — check current giveaway status and browse deals. No contest entry is open unless listed on the giveaways page."
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            sizes="(max-width: 1320px) 100vw, 1320px"
            loading="lazy"
            className="homepage-promo-banner__image"
          />
        </Link>
      </div>
    </Reveal>
  );
}
