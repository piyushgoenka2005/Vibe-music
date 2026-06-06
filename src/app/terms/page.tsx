import type { Metadata } from "next";
import Link from "next/link";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("Terms of Service"),
  description: `${BRAND.name} terms of service for purchases, accounts, and website use.`,
};

export default function TermsPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <article
          style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px", lineHeight: 1.6 }}
        >
          <h1 style={{ marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: "#807f7e", marginBottom: 24 }}>
            Last updated: June 6, 2026
          </p>
          <p>
            By using {BRAND.name}, you agree to these terms. Please read them carefully before
            placing an order.
          </p>
          <h2 style={{ marginTop: 24 }}>Orders and pricing</h2>
          <p>
            All prices are listed in USD unless otherwise noted. We reserve the right to correct
            pricing errors and cancel orders affected by such errors.
          </p>
          <h2 style={{ marginTop: 24 }}>Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activity under your account.
          </p>
          <h2 style={{ marginTop: 24 }}>Returns</h2>
          <p>
            Most items may be returned within 30 days. See our{" "}
            <Link href={ROUTES.help + "/returns"}>Returns Policy</Link> for details.
          </p>
          <h2 style={{ marginTop: 24 }}>Contact</h2>
          <p>
            Email <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> or call{" "}
            <a href={`tel:${BRAND.phone}`}>{BRAND.phoneDisplay}</a>.
          </p>
        </article>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
