import { Suspense } from "react";
import ContactPageContent from "@/components/contact/ContactPageContent";
import { resolvePublicLegal } from "@/lib/brand/resolvePublicLegal";
import "@/styles/contact-page.css";

export const revalidate = 300;

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with Vibe Music for orders, product advice, and support.",
};

export default async function ContactPage() {
  const legal = await resolvePublicLegal();

  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense
        fallback={
          <div className="storefront-page__inner contact-page">
            <div className="contact-page__submit">Send message</div>
          </div>
        }
      >
        <ContactPageContent legal={legal} />
      </Suspense>
    </main>
  );
}
