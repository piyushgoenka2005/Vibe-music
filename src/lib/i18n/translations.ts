export type SupportedLocale = "en-IN" | "hi-IN";

export interface TranslationDictionary {
  // Modal / drawer
  "currencyLocale.title": string;
  "currencyLocale.selectCurrency": string;
  "currencyLocale.selectLanguage": string;
  "currencyLocale.rateDisclaimer": string;
  "currencyLocale.regionAndLanguage": string;
  "currencyLocale.currency": string;
  "currencyLocale.language": string;

  // Header & Navigation
  "nav.searchPlaceholder": string;
  "nav.search": string;
  "nav.categories": string;
  "nav.brands": string;
  "nav.rentals": string;
  "nav.cart": string;
  "nav.wishlist": string;
  "nav.account": string;
  "nav.signIn": string;
  "nav.freeDelivery": string;

  // Product cards & listings
  "product.addToCart": string;
  "product.chooseOptions": string;
  "product.outOfStock": string;
  "product.inStock": string;
  "product.limitedStock": string;
  "product.preOwned": string;
  "product.openBox": string;
  "product.new": string;
  "product.comingSoon": string;
  "product.off": string;

  // Product detail page
  "pdp.buyNow": string;
  "pdp.addToCart": string;
  "pdp.mrp": string;
  "pdp.taxInclusive": string;
  "pdp.offers": string;
  "pdp.freeDelivery": string;
  "pdp.inStock": string;
  "pdp.onlyFewLeft": string;
  "pdp.unavailable": string;
  "pdp.saveToWishlist": string;
  "pdp.inWishlist": string;
  "pdp.quantity": string;
  "pdp.overview": string;
  "pdp.specs": string;
  "pdp.reviews": string;
  "pdp.frequentlyBoughtTogether": string;
  "pdp.savings": string;

  // Cart
  "cart.title": string;
  "cart.shoppingCart": string;
  "cart.subtotal": string;
  "cart.orderTotal": string;
  "cart.checkout": string;
  "cart.continueShopping": string;
  "cart.empty": string;
  "cart.freeGift": string;
  "cart.includedWithOrder": string;
  "cart.saving": string;
  "cart.productSavings": string;
  "cart.coupon": string;
  "cart.shipping": string;
  "cart.taxesIncluded": string;
  "cart.moveToWishlist": string;
  "cart.remove": string;

  // Checkout
  "checkout.orderSummary": string;
  "checkout.items": string;
  "checkout.item": string;
  "checkout.subtotal": string;
  "checkout.discount": string;
  "checkout.shipping": string;
  "checkout.free": string;
  "checkout.platformFee": string;
  "checkout.total": string;
  "checkout.priceBreakdown": string;
  "checkout.promoCode": string;
  "checkout.enterPromo": string;
  "checkout.apply": string;
  "checkout.remove": string;
  "checkout.promoHint": string;
  "checkout.currencyNotice": string;
  "checkout.billingNotice": string;
}

export type TranslationKey = keyof TranslationDictionary;

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  "en-IN": {
    "currencyLocale.title": "Currency & Language",
    "currencyLocale.selectCurrency": "Select Currency",
    "currencyLocale.selectLanguage": "Select Language",
    "currencyLocale.rateDisclaimer": "Prices will be converted according to active exchange rates.",
    "currencyLocale.regionAndLanguage": "Region & Language",
    "currencyLocale.currency": "Currency",
    "currencyLocale.language": "Language",

    "nav.searchPlaceholder": "Search gear, guitars, keys...",
    "nav.search": "Search",
    "nav.categories": "Categories",
    "nav.brands": "Brands",
    "nav.rentals": "Rentals",
    "nav.cart": "Cart",
    "nav.wishlist": "Wishlist",
    "nav.account": "Account",
    "nav.signIn": "Sign In",
    "nav.freeDelivery": "Free Delivery Across India",

    "product.addToCart": "Add to cart",
    "product.chooseOptions": "Choose options",
    "product.outOfStock": "Out of stock",
    "product.inStock": "In Stock",
    "product.limitedStock": "Limited",
    "product.preOwned": "Pre-owned",
    "product.openBox": "Open box",
    "product.new": "New",
    "product.comingSoon": "Coming Soon",
    "product.off": "off",

    "pdp.buyNow": "Buy Now",
    "pdp.addToCart": "Add to Cart",
    "pdp.mrp": "M.R.P.:",
    "pdp.taxInclusive": "Inclusive of all taxes",
    "pdp.offers": "Offers",
    "pdp.freeDelivery": "Free Delivery",
    "pdp.inStock": "In stock",
    "pdp.onlyFewLeft": "Only a few left",
    "pdp.unavailable": "Currently unavailable",
    "pdp.saveToWishlist": "Save to wishlist",
    "pdp.inWishlist": "In wishlist",
    "pdp.quantity": "Quantity",
    "pdp.overview": "Overview",
    "pdp.specs": "Specifications",
    "pdp.reviews": "Reviews",
    "pdp.frequentlyBoughtTogether": "Frequently Bought Together",
    "pdp.savings": "Savings",

    "cart.title": "Your Cart",
    "cart.shoppingCart": "Shopping Cart",
    "cart.subtotal": "Subtotal",
    "cart.orderTotal": "Order total",
    "cart.checkout": "Proceed to Checkout",
    "cart.continueShopping": "Continue Shopping",
    "cart.empty": "Your cart is empty",
    "cart.freeGift": "Free Gift",
    "cart.includedWithOrder": "Included with your order",
    "cart.saving": "Saving",
    "cart.productSavings": "Product savings",
    "cart.coupon": "Coupon",
    "cart.shipping": "shipping",
    "cart.taxesIncluded": "Taxes included",
    "cart.moveToWishlist": "Move to Wishlist",
    "cart.remove": "Remove",

    "checkout.orderSummary": "Order Summary",
    "checkout.items": "items",
    "checkout.item": "item",
    "checkout.subtotal": "Subtotal",
    "checkout.discount": "Discount",
    "checkout.shipping": "Shipping",
    "checkout.free": "FREE",
    "checkout.platformFee": "Platform Fee",
    "checkout.total": "Total",
    "checkout.priceBreakdown": "Price breakdown",
    "checkout.promoCode": "Promo code",
    "checkout.enterPromo": "Enter promo code",
    "checkout.apply": "Apply",
    "checkout.remove": "Remove",
    "checkout.promoHint": "Select an offer above or enter a promo code manually.",
    "checkout.currencyNotice": "Prices converted according to active exchange rates.",
    "checkout.billingNotice":
      "Payment will be processed in INR via Razorpay as required by Indian banking regulations.",
  },
  "hi-IN": {
    "currencyLocale.title": "मुद्रा और भाषा",
    "currencyLocale.selectCurrency": "मुद्रा चुनें",
    "currencyLocale.selectLanguage": "भाषा चुनें",
    "currencyLocale.rateDisclaimer": "सक्रिय विनिमय दरों के अनुसार कीमतों को बदला जाएगा।",
    "currencyLocale.regionAndLanguage": "क्षेत्र और भाषा",
    "currencyLocale.currency": "मुद्रा",
    "currencyLocale.language": "भाषा",

    "nav.searchPlaceholder": "गिटार, कीबोर्ड, ऑडियो खोजें...",
    "nav.search": "खोजें",
    "nav.categories": "श्रेणियाँ",
    "nav.brands": "ब्रांड्स",
    "nav.rentals": "किराया",
    "nav.cart": "कार्ट",
    "nav.wishlist": "विशलिस्ट",
    "nav.account": "खाता",
    "nav.signIn": "साइन इन",
    "nav.freeDelivery": "पूरे भारत में मुफ़्त डिलीवरी",

    "product.addToCart": "कार्ट में जोड़ें",
    "product.chooseOptions": "विकल्प चुनें",
    "product.outOfStock": "स्टॉक में नहीं",
    "product.inStock": "उपलब्ध है",
    "product.limitedStock": "सीमित स्टॉक",
    "product.preOwned": "पहले से प्रयुक्त",
    "product.openBox": "ओपन बॉक्स",
    "product.new": "नया",
    "product.comingSoon": "जल्द आ रहा है",
    "product.off": "छूट",

    "pdp.buyNow": "अभी खरीदें",
    "pdp.addToCart": "कार्ट में जोड़ें",
    "pdp.mrp": "अधिकतम खुदरा मूल्य:",
    "pdp.taxInclusive": "सभी कर सहित",
    "pdp.offers": "ऑफ़र",
    "pdp.freeDelivery": "मुफ़्त डिलीवरी",
    "pdp.inStock": "उपलब्ध है",
    "pdp.onlyFewLeft": "कुछ ही बचे हैं",
    "pdp.unavailable": "फिलहाल अनुपलब्ध",
    "pdp.saveToWishlist": "विशलिस्ट में जोड़ें",
    "pdp.inWishlist": "विशलिस्ट में मौजूद",
    "pdp.quantity": "मात्रा",
    "pdp.overview": "विवरण",
    "pdp.specs": "विशेषताएं",
    "pdp.reviews": "समीक्षाएं",
    "pdp.frequentlyBoughtTogether": "अक्सर साथ में खरीदे जाने वाले",
    "pdp.savings": "बचत",

    "cart.title": "आपकी कार्ट",
    "cart.shoppingCart": "शॉपिंग कार्ट",
    "cart.subtotal": "उप-योग",
    "cart.orderTotal": "कुल योग",
    "cart.checkout": "चेकआउट करें",
    "cart.continueShopping": "खरीदारी जारी रखें",
    "cart.empty": "आपकी कार्ट खाली है",
    "cart.freeGift": "मुफ़्त उपहार",
    "cart.includedWithOrder": "आपके ऑर्डर के साथ शामिल",
    "cart.saving": "बचत",
    "cart.productSavings": "उत्पाद बचत",
    "cart.coupon": "कूपन",
    "cart.shipping": "शिपिंग",
    "cart.taxesIncluded": "कर सहित",
    "cart.moveToWishlist": "विशलिस्ट में ले जाएं",
    "cart.remove": "हटाएं",

    "checkout.orderSummary": "ऑर्डर सारांश",
    "checkout.items": "आइटम",
    "checkout.item": "आइटम",
    "checkout.subtotal": "उप-योग",
    "checkout.discount": "छूट",
    "checkout.shipping": "शिपिंग",
    "checkout.free": "मुफ़्त",
    "checkout.platformFee": "प्लेटफ़ॉर्म शुल्क",
    "checkout.total": "कुल योग",
    "checkout.priceBreakdown": "मूल्य विवरण",
    "checkout.promoCode": "प्रोमो कोड",
    "checkout.enterPromo": "प्रोमो कोड दर्ज करें",
    "checkout.apply": "लागू करें",
    "checkout.remove": "हटाएं",
    "checkout.promoHint": "ऊपर दिए गए ऑफ़र चुनें या मैन्युअल रूप से प्रोमो कोड दर्ज करें।",
    "checkout.currencyNotice": "सक्रिय विनिमय दरों के अनुसार कीमतें बदली गई हैं।",
    "checkout.billingNotice":
      "भारतीय बैंकिंग नियमों के अनुसार भुगतान रेज़रपे के माध्यम से भारतीय रुपये (₹) में प्रोसेस किया जाएगा।",
  },
};

export function getTranslation(locale: string, key: TranslationKey, fallback?: string): string {
  const normalizedLocale: SupportedLocale = locale === "hi-IN" ? "hi-IN" : "en-IN";
  const dict = TRANSLATIONS[normalizedLocale] ?? TRANSLATIONS["en-IN"];
  const val = dict[key];
  if (val) return val;
  const enVal = TRANSLATIONS["en-IN"][key];
  if (enVal) return enVal;
  return fallback ?? key;
}
