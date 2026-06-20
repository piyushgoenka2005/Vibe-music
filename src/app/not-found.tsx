import Link from "next/link";
import { ROUTES } from "@/lib/routes";

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
          <Link href={ROUTES.home} className="error-page__btn error-page__btn--primary">
            Back to home
          </Link>
          <Link href={ROUTES.search} className="error-page__btn error-page__btn--secondary">
            Search products
          </Link>
        </div>
      </div>
    </main>
  );
}
