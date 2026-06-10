import Link from "next/link";
import { WELCOME_WIDGETS } from "@/data/welcomeWidgets";
import { resolveLinkHref } from "@/lib/routes";
import WelcomeWidget from "./WelcomeWidget";

export default function WelcomeSection() {
  return (
    <section id="personalization-widgets" className="personalization-widgets">
      <h2 className="personalization-widgets__greeting">Welcome!</h2>
      <div className="personalization-widgets__wrap">
        <div className="personalization-widgets__nav nav--left isPaged">
          <button type="button" aria-label="Scroll Previous">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <g fill="none" strokeLinecap="round" strokeWidth="2">
                <g>
                  <circle cx="20" cy="20" r="20" stroke="none" />
                  <circle cx="20" cy="20" r="19" fill="none" />
                </g>
                <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
              </g>
            </svg>
          </button>
        </div>
        <div className="personalization-widgets__inner scrollbar-minimal isPaged">
          {WELCOME_WIDGETS.map((widget) => (
            <WelcomeWidget key={widget.headline} widget={widget} />
          ))}
        </div>
        <div className="personalization-widgets__nav nav--right isPaged">
          <button type="button" aria-label="Scroll Next">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <g fill="none" strokeLinecap="round" strokeWidth="2">
                <g transform="rotate(180 20 20)">
                  <circle cx="20" cy="20" r="20" stroke="none" />
                  <circle cx="20" cy="20" r="19" fill="none" />
                </g>
                <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
              </g>
            </svg>
          </button>
        </div>
      </div>
      <Link
        href={resolveLinkHref("/auth/signin?return=/")}
        className="homepage-btn__section-cta-outline blue"
      >
        Login to Personalize
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          xmlSpace="preserve"
          viewBox="0 0 10.5 9"
        >
          <path d="M10.45 4.22a.62.62 0 0 0-.17-.25L6.53.22C6.46.14 6.37.1 6.28.05S6.1 0 6 0s-.19.02-.28.05-.18.1-.25.17a.72.72 0 0 0-.22.53.7.7 0 0 0 .22.53l2.46 2.47H.75a.75.75 0 0 0-.7.46.75.75 0 0 0 0 .58.73.73 0 0 0 .7.46h7.18L5.47 7.72l-.1.11-.07.14-.04.14-.01.14.01.14.04.14.07.14c.02.04.06.08.1.1A.69.69 0 0 0 6 9c.1.01.19 0 .28-.04s.18-.1.25-.17l3.75-3.75a.72.72 0 0 0 .22-.53.8.8 0 0 0-.05-.28z" />
        </svg>
      </Link>
    </section>
  );
}
