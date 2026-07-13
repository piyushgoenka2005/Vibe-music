import { Suspense } from "react";
import ContactPageContent from "@/components/contact/ContactPageContent";
import "@/styles/contact-page.css";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with Vibe Music for orders, product advice, and support.",
};

export default function ContactPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={<div className="storefront-page__inner contact-page">Loading…</div>}>
        <ContactPageContent />
      </Suspense>
    </main>
  );
}
