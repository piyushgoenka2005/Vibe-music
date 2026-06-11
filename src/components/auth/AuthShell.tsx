"use client";

import Link from "next/link";
import { LOGO_PATH } from "@/lib/mediaAssets";

interface AuthShellProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <section className="auth-shell w-full">
      <div className="auth-shell__card">
        <div className="auth-shell__accent" aria-hidden />
        <header className="auth-shell__header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_PATH}
            alt="Vibe Music"
            className="auth-shell__logo"
            height={36}
            width={160}
          />
          <h1 className="auth-shell__title">{title}</h1>
          {description ? (
            <p className="auth-shell__description">{description}</p>
          ) : null}
        </header>
        <div className="auth-shell__body">{children}</div>
        {footer ? <footer className="auth-footer-note">{footer}</footer> : null}
      </div>
      <ul className="auth-trust" aria-label="Account benefits">
        <li>Secure sign-in</li>
        <li>Wishlist sync</li>
        <li>Order tracking</li>
      </ul>
    </section>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="auth-link">
      {children}
    </Link>
  );
}
