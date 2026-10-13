import localFont from "next/font/local";

/**
 * Inter tuned to approximate Helvetica Neue: neutral grotesk, light headings,
 * medium UI labels. Self-hosted (latin variable subset from Google Fonts v20) so
 * production builds never depend on fonts.googleapis.com being reachable.
 *
 * The file is registered only at 400 and 500, matching the faces Google Fonts
 * declared for `wght@400;500`. Exposing the full 100–900 range changes how every
 * 300/600/700 rule in the stylesheets renders.
 */
export const primaryFont = localFont({
  src: [
    { path: "./fonts/inter-latin-var.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-var.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});
