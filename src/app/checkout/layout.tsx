import Script from "next/script";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://checkout.razorpay.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.razorpay.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      <link rel="dns-prefetch" href="https://api.razorpay.com" />
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
