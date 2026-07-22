export interface ContentPage {
  slug: string;
  title: string;
  eyebrow: string;
  sections: Array<{ heading?: string; paragraphs: string[] }>;
}

export const CONTENT_PAGES: Record<string, ContentPage> = {
  shipping: {
    slug: "shipping",
    title: "Shipping & Delivery",
    eyebrow: "Customer Service",
    sections: [
      {
        paragraphs: [
          "Vibe Music ships across India through trusted courier partners. Orders are packed securely and dispatched from our Maharashtra warehouse within 1–2 business days after payment confirmation.",
        ],
      },
      {
        heading: "Delivery timelines",
        paragraphs: [
          "Standard delivery: 5–7 business days to most pin codes across India.",
          "Metro cities often arrive faster depending on courier capacity and stock location.",
        ],
      },
      {
        heading: "Free shipping",
        paragraphs: [
          "Shipping is free on every order. Delivery timelines still vary by pin code — you can estimate ETA on the product page.",
        ],
      },
      {
        heading: "Tracking",
        paragraphs: [
          "You will receive a tracking link by email once your order ships. You can also track any order from the Track Order page using your order ID and tracking token from your confirmation email.",
        ],
      },
    ],
  },
  returns: {
    slug: "returns",
    title: "Returns & Exchanges",
    eyebrow: "Customer Service",
    sections: [
      {
        paragraphs: [
          "We want you to love your gear. If something is not right, contact us within 7 days of delivery and we will help with a return or exchange where applicable.",
        ],
      },
      {
        heading: "Eligible items",
        paragraphs: [
          "Items must be unused, in original packaging, and include all accessories and documentation. Custom or special-order products may not be returnable.",
        ],
      },
      {
        heading: "How to start a return",
        paragraphs: [
          "Email orders@vibemusic.in with your order ID, product name, and reason for return. Our team will share pickup or drop-off instructions and a return authorization.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Approved refunds are processed to the original payment method within 5–10 business days after we receive and inspect the returned item.",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    eyebrow: "Legal",
    sections: [
      {
        paragraphs: [
          "By using vibemusic.in you agree to these terms. Please read them carefully before placing an order.",
        ],
      },
      {
        heading: "Orders & pricing",
        paragraphs: [
          "All prices are listed in Indian Rupees (INR) and include applicable GST unless stated otherwise. We reserve the right to correct pricing errors and cancel orders affected by such errors.",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Online payments are processed securely through Razorpay (UPI, cards, and net banking). Cash on delivery is not offered.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "Vibe Music is not liable for indirect or consequential damages arising from use of the site or products beyond the value of the order, to the extent permitted by law.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    sections: [
      {
        paragraphs: [
          "We respect your privacy and handle personal data in line with applicable Indian law and industry best practices.",
        ],
      },
      {
        heading: "Data we collect",
        paragraphs: [
          "We collect information you provide when creating an account, placing an order, subscribing to our newsletter, or contacting support — including name, email, phone, and delivery address.",
        ],
      },
      {
        heading: "How we use data",
        paragraphs: [
          "Your data is used to fulfil orders, provide customer support, send transactional messages, improve our store, and — with your consent — share offers and product updates.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You may update account details in your profile, unsubscribe from marketing emails via the link in any message, or contact us to request deletion of account data subject to legal retention requirements.",
        ],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    eyebrow: "Legal",
    sections: [
      {
        paragraphs: [
          "Vibe Music uses cookies and similar technologies to keep you signed in, remember cart contents, and understand how the site is used. You can change analytics preferences anytime via the consent banner.",
        ],
      },
      {
        heading: "Essential cookies",
        paragraphs: [
          "Required for authentication, checkout security, cart persistence, and fraud prevention. These cannot be disabled while using the store.",
        ],
      },
      {
        heading: "Analytics (optional)",
        paragraphs: [
          "With your consent we enable Google Analytics 4 to measure storefront performance and shopping funnels (page views, add-to-cart, checkout, purchase). Advertising cookies and ad personalization are disabled by default.",
          "You can Accept or Decline analytics on first visit. Declining keeps essential cookies only; we still fulfil orders normally.",
        ],
      },
      {
        heading: "Performance metrics",
        paragraphs: [
          "We collect anonymized Core Web Vitals to improve page speed. No personally identifiable information is sold to third parties.",
        ],
      },
      {
        heading: "More information",
        paragraphs: [
          "See our Privacy Policy for how personal data is handled, or email support@vibemusic.in with cookie-related requests.",
        ],
      },
    ],
  },
  careers: {
    slug: "careers",
    title: "Careers at Vibe Music",
    eyebrow: "Company",
    sections: [
      {
        paragraphs: [
          "Vibe Music is building India's most trusted destination for pro audio, instruments, and studio gear. We are always interested in hearing from people who love music and great customer experiences.",
        ],
      },
      {
        heading: "Open roles",
        paragraphs: [
          "We do not have public listings at the moment. Send your résumé and a short note about what you would like to work on to careers@vibemusic.in.",
        ],
      },
      {
        heading: "What we value",
        paragraphs: [
          "Product knowledge, clear communication, and a bias toward helping musicians and creators get the gear they need — fast.",
        ],
      },
    ],
  },
};

export const CONTENT_PAGE_SLUGS = Object.keys(CONTENT_PAGES);

export function getContentPage(slug: string): ContentPage | undefined {
  return CONTENT_PAGES[slug];
}
