import type { Metadata } from "next";
import Link from "next/link";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("Privacy Policy"),
  description: `How ${BRAND.name} collects, uses, and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <article
          style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px", lineHeight: 1.6 }}
        >
          <h1 style={{ marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: "#807f7e", marginBottom: 24 }}>
            Last updated: June 6, 2026
          </p>
          <p>
            {BRAND.name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy.
            This policy explains what information we collect when you shop with us and how we use it.
          </p>
          <h2 style={{ marginTop: 24 }}>Information we collect</h2>
          <ul>
            <li>Account details such as name, email, and phone number</li>
            <li>Order and shipping information</li>
            <li>Device and usage data through cookies and analytics</li>
          </ul>
          <h2 style={{ marginTop: 24 }}>How we use information</h2>
          <p>
            We use your information to process orders, provide customer support, improve our
            store, and send marketing communications when you opt in.
          </p>
          <h2 style={{ marginTop: 24 }}>Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> or call{" "}
            <a href={`tel:${BRAND.phone}`}>{BRAND.phoneDisplay}</a>.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link href={ROUTES.terms}>Terms of Service</Link>
            {" · "}
            <Link href={ROUTES.help + "/returns"}>Returns</Link>
          </p>
        </article>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
