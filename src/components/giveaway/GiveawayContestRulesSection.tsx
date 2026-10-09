import Link from "next/link";
import { GIVEAWAY_CONTEST_RULES_SUMMARY } from "@/data/giveawayContestRules";
import { ROUTES } from "@/lib/routes";

export default function GiveawayContestRulesSection() {
  const { title, paragraphs, policyLinks } = GIVEAWAY_CONTEST_RULES_SUMMARY;

  return (
    <section className="giveaway-rules" aria-labelledby="giveaway-rules-title">
      <h2 id="giveaway-rules-title" className="giveaway-rules__title">
        {title}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="giveaway-rules__paragraph">
          {paragraph}
        </p>
      ))}
      <p className="giveaway-rules__links">
        {policyLinks.map((link) => (
          <Link key={link.slug} href={ROUTES.page(link.slug)}>
            {link.label}
          </Link>
        ))}
      </p>
    </section>
  );
}
