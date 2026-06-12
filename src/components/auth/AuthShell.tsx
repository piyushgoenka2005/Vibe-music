"use client";

import Link from "next/link";
import { LOGO_PATH } from "@/lib/mediaAssets";

interface AuthShellProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  trustItems?: string[] | false;
  children: React.ReactNode;
}

const DEFAULT_TRUST = ["Secure sign-in", "Wishlist sync", "Order tracking"];

export default function AuthShell({
  title,
  description,
  footer,
  trustItems = DEFAULT_TRUST,
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
      {trustItems ? (
        <ul className="auth-trust" aria-label="Account benefits">
          {trustItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
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
