import Link from "next/link";
import { BRAND } from "@/lib/brand";
import Reveal from "@/components/layout/Reveal";

const HEADLINE_ID = "outletStoryHeadline";
const SUPPORTING_COPY_ID = "outletStorySupportingCopy";
const OUTLET_DEALS_HREF = "/outlet-deals";

export default function OutletStorySection() {
  return (
    <Reveal as="section" className="outlet-story" id="outlet-story">
      <div aria-hidden className="outlet-story__ambient-fog" />

      <div className="outlet-story__inner">
        <h2 className="outlet-story__headline" id={HEADLINE_ID}>
          <span>Welcome to a new era of {BRAND.name}.</span>
        </h2>

        <div className="outlet-story__copy-shell">
          <div
            className="outlet-story__copy outlet-story__supporting-copy is-visible"
            id={SUPPORTING_COPY_ID}
          >
            <p>
              We&apos;ve updated our inventory with some truly unbelievable deals on
              the gear you know and love. We work directly with our brand partners to
              source everything from sleeper hits, to overstocked items, to year-end
              closeouts, so you can enjoy clearance-level pricing, 24/7.
            </p>
            <p>
              Most of these quantities will be highly limited, with low likelihood of
              restocking, so come back often and don&apos;t blink when you see something
              with your name on it.{" "}
              <Link className="outlet-story__link" href={OUTLET_DEALS_HREF}>
                Shop the Outlet
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
