import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/layout/Reveal";
import BigNamesDealsShowcase from "@/components/home/BigNamesDealsShowcase";
import { BIG_NAMES_DEALS, BIG_NAMES_DEALS_CTA } from "@/data/bigNamesDeals";

const HEADLINE_ID = "bigNamesDealsHeadline";

export default function BigNamesDealsSection() {
  return (
    <section className="big-names-deals" aria-labelledby={HEADLINE_ID}>
      <div className="big-names-deals__inner">
        <header className="big-names-deals__header">
          <Reveal>
            <p className="big-names-deals__eyebrow">
              <span className="big-names-deals__eyebrow-line" aria-hidden />
              Shop top brands
              <span className="big-names-deals__eyebrow-line" aria-hidden />
            </p>
          </Reveal>

          <Reveal delay={40}>
            <h2
              className="big-names-deals__headline typo-series"
              id={HEADLINE_ID}
            >
              <span className="big-names-deals__headline-line">Big names.</span>
              <span className="big-names-deals__headline-line">Serious savings.</span>
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p className="big-names-deals__subtitle">
              Find all the top brands you already love, at prices that simply
              can&apos;t be beat
            </p>
          </Reveal>
        </header>

        <BigNamesDealsShowcase items={BIG_NAMES_DEALS} />

        <Reveal delay={120}>
          <div className="big-names-deals__cta-wrap">
            <Link className="big-names-deals__cta" href={BIG_NAMES_DEALS_CTA}>
              Shop All Deals
              <span className="big-names-deals__cta-arrow" aria-hidden>
                <ArrowUpRight size={20} strokeWidth={2.75} />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
