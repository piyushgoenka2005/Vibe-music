import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { MARKETING_EDITORIAL_IMAGE } from "@/lib/categoryImages";
import Reveal from "@/components/layout/Reveal";

export default function EditorialSplit() {
  return (
    <Reveal as="section" className="editorial-split">
      <div className="editorial-split__inner">
        <div className="editorial-split__copy">
          <p className="editorial-split__eyebrow premium-section-eyebrow">Gear advisors, not a warehouse</p>
          <h2 className="editorial-split__title">
            Pro gear. Honest advice. Delivered across India.
          </h2>
          <p className="editorial-split__text">
            Whether you&apos;re building your first home studio or upgrading a worship
            rig, our team helps you choose gear that fits your budget and your goals.
          </p>
          <div className="editorial-split__actions">
            <Link href={ROUTES.search} className="premium-btn premium-btn--primary">
              Explore studio gear
            </Link>
            <Link href={ROUTES.blog} className="premium-btn premium-btn--ghost">
              Read buying guides
            </Link>
          </div>
        </div>
        <div className="editorial-split__visual" aria-hidden>
          <div className="editorial-split__orb" />
          <img
            src={MARKETING_EDITORIAL_IMAGE}
            alt=""
            className="editorial-split__image"
            loading="lazy"
          />
        </div>
      </div>
    </Reveal>
  );
}
