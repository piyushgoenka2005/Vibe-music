import localFont from "next/font/local";

/**
 * Inter tuned to approximate Helvetica Neue: neutral grotesk, light headings,
 * medium UI labels. Self-hosted (latin variable subset from Google Fonts v20) so
 * production builds never depend on fonts.googleapis.com being reachable.
 */
export const primaryFont = localFont({
  src: "./fonts/inter-latin-var.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});
