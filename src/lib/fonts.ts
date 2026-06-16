import { Inter } from "next/font/google";

/**
 * Inter tuned to approximate Helvetica Neue: neutral grotesk, light headings,
 * medium UI labels. Bundled via next/font (Helvetica Neue cannot be self-hosted).
 */
export const primaryFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500"],
  adjustFontFallback: true,
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});
