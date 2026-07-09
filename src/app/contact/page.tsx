import ContactPageContent from "@/components/contact/ContactPageContent";
import "@/styles/contact-page.css";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with Vibe Music for orders, product advice, and support.",
};

export default function ContactPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ContactPageContent />
    </main>
  );
}
