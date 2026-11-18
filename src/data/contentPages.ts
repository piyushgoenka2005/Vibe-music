import { BRAND } from "@/lib/brand";
import {
  DISPATCH_COPY,
  GRIEVANCE_OFFICER_EMAIL,
  GRIEVANCE_OFFICER_NAME,
  SUPPORT_HOURS_DETAIL,
} from "@/lib/brand/businessIdentity";
import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";

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
          `Vibe Music ships across India through trusted courier partners from ${BRAND.address}. ${DISPATCH_COPY}`,
          SUPPORT_HOURS_DETAIL,
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
        paragraphs: [SHIPPING_POLICY.shippingPage],
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
          `At Vibe Music, we stand behind every instrument, cable, mixer, and audio processor we deliver. We want you to feel completely confident in your purchase. If you receive gear that is defective, damaged during transit, or significantly different from its product description, our dedicated team will assist you with a hassle-free return or replacement.`,
          `All return and exchange requests must be submitted within 7 calendar days from the date of confirmed delivery by our courier partners.`,
        ],
      },
      {
        heading: "Eligible conditions for returns",
        paragraphs: [
          "To qualify for a standard return or replacement, the item must be in its original, unplayed/unused condition with zero signs of wear, scratches, or cosmetic damage.",
          "The product must be packed in all original manufacturer packaging, including internal foam cushions, plastic wraps, power cords, adapters, printed manuals, warranty cards, and any complimentary accessories or bundled items.",
          "Products with protective films (such as guitar pickguards, mixer display screens, or microphone grilles) must have those films intact and unpeeled.",
        ],
      },
      {
        heading: "Non-returnable and excluded items",
        paragraphs: [
          "Due to strict hygiene, copyright, and safety standards, certain categories cannot be returned once opened: in-ear monitors (IEMs), earbuds, open packages of instrument strings, drumheads, harmonicas, and reeds.",
          "Software licenses, digital activation keys, and products registered with third-party manufacturer platforms cannot be returned or refunded.",
          "B-Stock, clearance, or custom-configured orders are final sale and non-returnable unless they arrive damaged or non-functional contrary to their graded condition.",
        ],
      },
      {
        heading: "Damaged in transit or Dead on Arrival (DOA)",
        paragraphs: [
          "If your package arrives with visible carton damage or tampering, please make a note on the courier delivery receipt and photograph/video the exterior before opening.",
          `If an item is found non-functional upon unboxing (Dead on Arrival), notify us at ${BRAND.email} within 48 hours of delivery with photos or video demonstrating the issue. We will arrange an expedited courier pickup and issue an immediate replacement or full refund upon inspection.`,
        ],
      },
      {
        heading: "How to initiate a return",
        paragraphs: [
          `Email our support team at ${BRAND.email} with your order number, clear photographs/video of the issue, and the reason for the request.`,
          "Our gear advisors will review your request within 24–48 business hours and issue an authorized Return Merchandise Authorization (RMA) along with reverse shipping instructions.",
          "Please do not send items back without an approved RMA number, as unauthorized parcels cannot be tracked or accepted at our logistics warehouse.",
        ],
      },
      {
        heading: "Inspection and refund timelines",
        paragraphs: [
          "Once your returned instrument arrives at our Kolkata facility, our certified technicians inspect the unit within 48 business hours to verify serial numbers, functionality, and packaging completeness.",
          "Upon approval, refunds are initiated immediately to the original method of payment (UPI, credit/debit card, or net banking) via our payment gateway (Razorpay). Depending on your bank's processing cycle, funds typically reflect in your account within 5–7 business days.",
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
          `Welcome to vibemusic.in. These Terms & Conditions govern your access to and use of our storefront, digital services, and the purchase of any musical gear and audio products from Vibe Music.`,
          `By browsing, registering an account, or placing an order on vibemusic.in, you agree to be bound by these terms, our Privacy Policy, and our Returns & Shipping Policies. If you do not agree with any part of these terms, please refrain from using our services.`,
        ],
      },
      {
        heading: "Registered business",
        paragraphs: [
          `${BRAND.legalName} is the legal owner and operator of the digital storefront vibemusic.in, having its registered office at ${BRAND.address}.`,
          BRAND.gstin
            ? `GSTIN: ${BRAND.gstin}.`
            : "Tax identification and GST credentials are registered under West Bengal jurisdiction and reflected on all commercial tax invoices.",
          `All communication regarding governance, dispute resolution, or consumer protection should be directed to ${BRAND.email}.`,
        ],
      },
      {
        heading: "Orders, pricing and typographical error clause",
        paragraphs: [
          "All prices are quoted in Indian National Rupees (INR) and are inclusive of Goods and Services Tax (GST) applicable under Indian law, unless expressly indicated otherwise.",
          "Mis-pricing and cancellation clause: While we take meticulous care to ensure all product specifications, availability, and prices displayed on the store are accurate, errors may occasionally occur. In the event an item is mistakenly listed at an incorrect price or with erroneous specifications due to typographical, system, database, or supplier error, Vibe Music explicitly reserves the right to decline, hold, or cancel any orders placed for that item, whether or not the order has been confirmed and payment has been captured.",
          "If your payment has already been captured for an order subsequently cancelled due to a pricing discrepancy, Vibe Music will promptly issue a full 100% refund to the original payment source.",
        ],
      },
      {
        heading: "Payment processing and security",
        paragraphs: [
          "Payment processing on vibemusic.in is conducted through Razorpay Software Private Limited, a PCI-DSS Level 1 compliant payment aggregator.",
          "We support UPI (Google Pay, PhonePe, Paytm, BHIM), major Credit and Debit Cards (Visa, MasterCard, RuPay), Net Banking across all scheduled Indian commercial banks, and eligible digital wallets. Cash on Delivery (COD) is not accepted.",
          "Vibe Music never stores your credit card numbers, CVVs, or net banking passwords on our servers. All transaction traffic is encrypted using 256-bit TLS/SSL certificates.",
        ],
      },
      {
        heading: "Shipping, delivery and transit risk",
        paragraphs: [
          "Instruments and audio equipment are securely packed with shock-resistant multi-layer cushioning and dispatched through reputed courier partners within 1–2 business days of order confirmation.",
          "Title and risk of loss pass to the customer upon delivery by the carrier to the destination address specified in the order. In the rare event of transit loss or catastrophic package damage, Vibe Music will assist in lodging courier claims and expediting replacement gear.",
        ],
      },
      {
        heading: "Manufacturer warranties and genuine gear guarantee",
        paragraphs: [
          "Every product sold as 'New' on vibemusic.in is 100% authentic, brand-new, and sourced through official distribution channels.",
          "New products carry the official standard manufacturer warranty valid across authorized service centers in India. Vibe Music provides purchase invoices required for all warranty registrations.",
        ],
      },
      {
        heading: "Promotions, giveaways, and program rules",
        paragraphs: [
          "Participation in promotional campaigns, giveaways, contests, or gear-exchange programs is governed by individual campaign rules published alongside the respective service. Vibe Music reserves the right to disqualify fraudulent, automated, or abusive entries.",
        ],
      },
      {
        heading: "Limitation of liability and governing law",
        paragraphs: [
          "In no event shall Vibe Music, its directors, officers, or affiliates be liable for indirect, incidental, punitive, or consequential damages resulting from the use or inability to use the products sold, beyond the purchase amount actually paid for the specific product in dispute.",
          "These Terms are governed by and construed in accordance with the laws of the Republic of India. Any legal action, dispute, or proceeding arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Kolkata, West Bengal, India.",
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
          `At Vibe Music, operated by ${BRAND.legalName} (${BRAND.address}), we are committed to respecting your privacy, safeguarding your personal data, and maintaining the highest standards of data governance.`,
          `This Privacy Policy explains how we collect, process, store, and protect your information when you visit vibemusic.in, purchase gear, or interact with our support teams, in full compliance with the Digital Personal Data Protection Act (DPDPA), 2023, Information Technology Act, 2000, and related Indian data protection regulations.`,
        ],
      },
      {
        heading: "Data fiduciary and personal data collected",
        paragraphs: [
          `${BRAND.legalName} serves as the Data Fiduciary regarding the personal information collected on this website.`,
          "We collect personal information that you voluntarily provide when creating an account, browsing products, completing a checkout, subscribing to notifications, or requesting customer support. This includes:",
          "1. Identity and contact details: Full name, phone number, email address, billing address, and shipping address.",
          "2. Transactional and order records: Details of products purchased, order values, invoices, order tokens, delivery instructions, and return/warranty history.",
          "3. Technical and usage identifiers: IP address, device fingerprints, browser characteristics, operating system, and interaction telemetry necessary for fraud prevention and performance optimization.",
        ],
      },
      {
        heading: "Lawful grounds and purpose of data processing",
        paragraphs: [
          "We process your personal data solely for legitimate, lawful purposes including:",
          "• Order fulfillment, logistics handover, door delivery, and delivery status communications (SMS and email).",
          "• Secure payment authorization and fraud prevention through our compliant payment aggregator (Razorpay).",
          "• Customer support, gear advisory, technical inquiries, warranty support, and return processing.",
          "• Compliance with mandatory statutory requirements, including Goods and Services Tax (GST) invoicing and corporate audit record-keeping under Indian law.",
          "• With your explicit consent, sending promotional newsletters, gear announcements, and product drop alerts. You may withdraw marketing consent at any time via the unsubscribe link in our emails.",
        ],
      },
      {
        heading: "Third-party disclosures and data processors",
        paragraphs: [
          "We do not sell, rent, or trade your personal information to third parties or data brokers. Data is shared strictly on a need-to-know basis with trusted service providers bound by contractual non-disclosure and security covenants:",
          "• Payment Gateway: Razorpay Software Private Limited processes transaction details over encrypted channels for payment authorization.",
          "• Logistics Partners: Reputed couriers (e.g. Shiprocket, Delhivery, Blue Dart) receive destination addresses and contact phone numbers for parcel delivery.",
          "• Transactional Messaging: Cloud infrastructure providers for sending order confirmation emails and authentication tokens.",
        ],
      },
      {
        heading: "Data retention and security measures",
        paragraphs: [
          "We enforce comprehensive physical, electronic, and managerial safeguards to protect your personal data from unauthorized access, disclosure, alteration, or destruction. All data transmission is secured using industry-standard TLS/SSL encryption.",
          "Personal data is retained only as long as necessary to fulfill the purposes for which it was gathered, or as mandated by applicable statutory retention periods (such as mandatory 7-year accounting and tax record retention under Indian Companies and GST laws).",
        ],
      },
      {
        heading: "Your rights under Indian data protection law",
        paragraphs: [
          "Under the Digital Personal Data Protection Act, 2023, you have rights to:",
          "1. Request confirmation and summaries of personal data processed by Vibe Music.",
          "2. Request correction, completion, or updating of inaccurate or outdated information.",
          "3. Request erasure of personal data that is no longer required for its original purpose or statutory obligation.",
          "4. Withdraw consent for non-essential processing (such as marketing emails) at any time.",
          `To exercise any of these rights, please contact our Data Grievance Team at ${BRAND.email}.`,
        ],
      },
      {
        heading: "Protection of minors",
        paragraphs: [
          "vibemusic.in is intended for adult musicians, sound engineers, and enthusiasts. We do not knowingly collect personal data from individuals under the age of 18 without verifiable parental or guardian consent.",
        ],
      },
      {
        heading: "Grievance redressal mechanism and officer",
        paragraphs: [
          "In compliance with the Consumer Protection (E-Commerce) Rules, 2020 and the Digital Personal Data Protection Act, 2023, our designated Grievance Officer is responsible for addressing consumer queries, data concerns, and complaints.",
          `Grievance Officer: ${GRIEVANCE_OFFICER_NAME}`,
          `Registered Address: ${BRAND.address}`,
          `Email: ${GRIEVANCE_OFFICER_EMAIL}`,
          "Statutory Resolution Timeline: Every grievance will be acknowledged within 48 hours of receipt and resolved within 30 days.",
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
          `See our Privacy Policy for how personal data is handled, or email ${BRAND.email} with cookie-related requests.`,
        ],
      },
    ],
  },
  authenticity: {
    slug: "authenticity",
    title: "100% Genuine Guarantee & Authorized Distribution",
    eyebrow: "Customer Service",
    sections: [
      {
        paragraphs: [
          `At Vibe Music, operated by ${BRAND.legalName} (${BRAND.address}), we guarantee that every single musical instrument, studio recording gear, amplifier, synthesizer, drum kit, microphone, cable, and accessory displayed and sold across our storefront is 100% genuine, brand-new, and sourced through official manufacturer channels.`,
          `We maintain an uncompromising zero-tolerance policy against grey-market imports, counterfeit products, parallel unauthorized distribution, and refurbished goods passed off as new. When you invest in your sound through Vibe Music, you receive authentic equipment backed by full legal protection and manufacturer warranties.`,
        ],
      },
      {
        heading: "Direct Manufacturer & Authorized Distribution Partnerships",
        paragraphs: [
          `Vibe Music works hand-in-hand with verified Indian national distributors and original equipment manufacturers. Our official catalog features authorized gear from premier musical brands, including Hertz, Roland, Adeon, Gibraltar, Avus, M-Audio, Zoom, Boss, Nord, Trinity, and more.`,
          "Every item leaves our logistics warehouse in original, tamper-evident factory packaging complete with all manufacturer seals, user documentation, warranty registrations, and factory-bundled accessories intact.",
        ],
      },
      {
        heading: "Serial Number Tracking & GST-Compliant Invoicing",
        paragraphs: [
          `Every serialized product dispatched by Vibe Music is scanned and recorded in our fulfillment management system. The specific serial numbers are printed directly onto your official tax invoice issued by ${BRAND.legalName}.`,
          BRAND.gstin
            ? `Your purchase is validated with our canonical Goods and Services Tax Identification Number (GSTIN: ${BRAND.gstin}), establishing an unbroken chain of custody and providing the statutory proof of purchase required for official manufacturer support.`
            : "Your purchase is validated with our registered Goods and Services Tax credentials, providing statutory proof of purchase required for official manufacturer support.",
        ],
      },
      {
        heading: "Full Manufacturer Warranty Protection Across India",
        paragraphs: [
          "Because Vibe Music is an authorized retail partner, your purchase carries the complete, uncompromised official manufacturer warranty valid at authorized service centers throughout India.",
          "Unlike unauthorized online marketplace sellers whose goods may be rejected by brand service centers due to illegitimate sourcing, Vibe Music purchases are recognized and serviced without exception. If you ever require warranty assistance, our support team will help you locate the nearest service facility or coordinate service on your behalf.",
        ],
      },
      {
        heading: "Multi-Point Quality Control & Secure Logistics",
        paragraphs: [
          `Before courier handover at our Kolkata central distribution hub, all packages undergo comprehensive physical inspection to verify carton integrity, structural seals, and weight calibration.`,
          "Instruments and sensitive audio electronics are encased in heavy-duty multi-layer bubble wrap, edge protectors, and corrugated outer cartons engineered to absorb transport vibration and shield your gear across transit.",
        ],
      },
      {
        heading: "100% Authenticity Money-Back Guarantee",
        paragraphs: [
          "We stake our reputation on the authenticity of our equipment. In the improbable event that any product purchased from vibemusic.in is verified to be non-genuine or unauthorized, we will immediately issue a complete 100% refund, including all shipping fees, and arrange complimentary reverse logistics pickup.",
          `For questions regarding product authenticity, brand authorizations, or warranty registration, please reach out directly to our customer care team at ${BRAND.email} or call ${BRAND.phoneDisplay}. Inquiries may also be escalated to our statutory Grievance Officer (${GRIEVANCE_OFFICER_NAME}, ${GRIEVANCE_OFFICER_EMAIL}).`,
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
