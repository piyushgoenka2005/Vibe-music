import Link from "next/link";
import { STOREFRONT_PROGRAM_PRIMARY_LINKS } from "@/data/storefrontPrograms";
import { ROUTES } from "@/lib/routes";
import "@/styles/programs-strip.css";

export default function ProgramsStripSection() {
  return (
    <section className="programs-strip" aria-labelledby="programs-strip-title">
      <div className="programs-strip__inner">
        <div className="programs-strip__header">
          <h2 id="programs-strip-title" className="programs-strip__title">
            More ways to play
          </h2>
          <Link href={ROUTES.programs} className="programs-strip__hub-link">
            View all programs
          </Link>
        </div>

        <div className="programs-strip__grid" role="list">
          {STOREFRONT_PROGRAM_PRIMARY_LINKS.map((program) => (
            <Link
              key={program.id}
              href={program.href}
              className="programs-strip__card"
              role="listitem"
            >
              <h3 className="programs-strip__card-title">{program.title}</h3>
              <p className="programs-strip__card-copy">{program.description}</p>
              <span className="programs-strip__card-cta">{program.cta}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
