import Link from "next/link";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <section
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "64px 16px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 48, margin: "0 0 8px" }}>404</h1>
          <p style={{ fontSize: 20, marginBottom: 8 }}>Page not found</p>
          <p style={{ color: "#807f7e", marginBottom: 24 }}>
            We couldn&apos;t find that page on {BRAND.name}.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ROUTES.home} className="sw-btn sw-btn-blue">
              Go home
            </Link>
            <Link href={ROUTES.search} className="sw-btn">
              Search gear
            </Link>
          </div>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
