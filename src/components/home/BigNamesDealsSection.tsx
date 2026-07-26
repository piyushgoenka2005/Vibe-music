import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/layout/Reveal";
import BigNamesDealsShowcase from "@/components/home/BigNamesDealsShowcase";
import {
  getBigNamesDealsPublicData,
} from "@/lib/server/homepageService";
import type { PublicBigNamesDealsData } from "@/types/homepage";

const HEADLINE_ID = "bigNamesDealsHeadline";

export function BigNamesDealsView({ data }: { data: PublicBigNamesDealsData }) {
  if (!data.isActive || data.items.length === 0) {
    return null;
  }

  const subtitleLines = data.subtitle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="big-names-deals" aria-labelledby={HEADLINE_ID}>
      <div className="big-names-deals__inner">
        <header className="big-names-deals__header">
          <Reveal immediate>
            <p className="big-names-deals__eyebrow">
              <span className="big-names-deals__eyebrow-line" aria-hidden />
              {data.eyebrow}
              <span className="big-names-deals__eyebrow-line" aria-hidden />
            </p>
          </Reveal>

          <Reveal immediate delay={40}>
            <h2
              className="big-names-deals__headline typo-series"
              id={HEADLINE_ID}
            >
              {data.headline}
            </h2>
          </Reveal>

          {subtitleLines.length > 0 ? (
            <Reveal immediate delay={80}>
              <p className="big-names-deals__subtitle">
                {subtitleLines.map((line) => (
                  <span key={line} className="big-names-deals__subtitle-line">
                    {line}
                  </span>
                ))}
              </p>
            </Reveal>
          ) : null}
        </header>

        <BigNamesDealsShowcase items={data.items} />

        <Reveal immediate>
          <div className="big-names-deals__cta-wrap">
            <Link className="big-names-deals__cta" href={data.ctaLink}>
              {data.ctaText}
              <span className="big-names-deals__cta-arrow" aria-hidden>
                <ArrowUpRight size={23} strokeWidth={2.75} />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default async function BigNamesDealsSection() {
  const data = await getBigNamesDealsPublicData();
  return <BigNamesDealsView data={data} />;
}
