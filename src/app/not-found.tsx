import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="storefront-page storefront-page--subtle error-page">
      <div className="error-page__inner">
        <p className="storefront-page__eyebrow">404</p>
        <h1 className="error-page__title">This page hit a wrong note</h1>
        <p className="error-page__lead">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Head back home or search our catalog.
        </p>
        <div className="error-page__actions">
          <div className="error-page__btn-chain">
            <Link
              href={ROUTES.home}
              className="error-page__btn error-page__btn--primary error-page__btn--chain"
            >
              Back to home
            </Link>
            <span className="error-page__btn-bridge" aria-hidden />
            <Link
              href={ROUTES.search}
              className="error-page__btn error-page__btn--secondary error-page__btn--chain"
            >
              Search products
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
