import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/layout/Reveal";
import { resolveLinkHref } from "@/lib/routes";

const BANNER_SRC = "/images/win%20this%20rig.jpeg";
const BANNER_WIDTH = 1500;
const BANNER_HEIGHT = 200;

export default function HomepagePromoBanner() {
  return (
    <Reveal
      as="section"
      className="homepage-promo-banner"
      aria-label="Win this Rig giveaway"
    >
      <div className="homepage-promo-banner__inner">
        <Link href={resolveLinkHref("/giveaway")} className="homepage-promo-banner__link">
          <Image
            src={BANNER_SRC}
            alt="Win this Rig — Enter for a chance to win $5K+ from Gibson and MESA/Boogie. Enter now, thru June 21."
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            sizes="(max-width: 1320px) 100vw, 1320px"
            priority
            loading="eager"
            className="homepage-promo-banner__image"
          />
        </Link>
      </div>
    </Reveal>
  );
}
