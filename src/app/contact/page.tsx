import { Suspense } from "react";
import ContactPageContent from "@/components/contact/ContactPageContent";
import "@/styles/contact-page.css";

export const revalidate = 300;

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with Vibe Music for orders, product advice, and support.",
};

export default function ContactPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense
        fallback={
          <div className="storefront-page__inner contact-page">
            <div className="contact-page__submit">Send message</div>
          </div>
        }
      >
        <ContactPageContent />
      </Suspense>
    </main>
  );
}
