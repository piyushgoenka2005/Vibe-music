import Link from "next/link";
import { STOREFRONT_PROGRAMS } from "@/data/storefrontPrograms";
import "@/styles/programs-strip.css";

export default function ProgramsHubGrid() {
  return (
    <div className="programs-strip__grid programs-hub__grid" role="list">
      {STOREFRONT_PROGRAMS.map((program) => (
        <Link key={program.id} href={program.href} className="programs-strip__card" role="listitem">
          <h2 className="programs-strip__card-title">{program.title}</h2>
          <p className="programs-strip__card-copy">{program.description}</p>
          <span className="programs-strip__card-cta">{program.cta}</span>
        </Link>
      ))}
    </div>
  );
}
