import { LANDING_STATS } from "@/data/landingStatus";
import StatusChip from "@/components/home/StatusChip";
import Reveal from "@/components/layout/Reveal";

export default function HomepageStats() {
  return (
    <Reveal as="section" className="homepage-stats" aria-label="Store highlights" immediate>
      <div className="homepage-stats__inner">
        {LANDING_STATS.map((stat, index) => (
          <Reveal key={stat.label} className="homepage-stats__item" delay={index * 70}>
            <StatusChip
              label={stat.status}
              tone={stat.tone}
              showDot={stat.tone === "live"}
              className="homepage-stats__chip"
            />
            <span className="homepage-stats__value">{stat.value}</span>
            <span className="homepage-stats__label">{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
