import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export interface ProgramLandingAction {
  href: string;
  label: string;
  primary?: boolean;
}

export interface ProgramLandingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  statusNote: string;
  highlights: string[];
  actions: ProgramLandingAction[];
}

export default function ProgramLandingPage({
  eyebrow,
  title,
  subtitle,
  statusNote,
  highlights,
  actions,
}: ProgramLandingProps) {
  return (
    <div className="storefront-page__inner program-landing">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">{eyebrow}</p>
        <h1 className="storefront-page__title">{title}</h1>
        <p className="storefront-page__subtitle">{subtitle}</p>
      </header>

      <p className="program-landing__status" role="status">
        {statusNote}
      </p>

      <ul className="program-landing__list">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="program-landing__actions">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className={
              action.primary
                ? "program-landing__btn program-landing__btn--primary"
                : "program-landing__btn"
            }
          >
            {action.label}
          </Link>
        ))}
      </div>

      <p className="program-landing__footer">
        Prefer talking to a human?{" "}
        <Link href={ROUTES.contact}>Contact Vibe Music</Link>
      </p>
    </div>
  );
}
