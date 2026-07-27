import localFont from "next/font/local";

/**
 * Display/body face. Light (300) has a 20px floor per DESIGN.md — below that
 * it disappears on a bright counter screen. Only the `display`, `h1` and
 * `num-lg` type-scale utilities in globals.css use the Light weight; every
 * other utility here uses Regular. Don't reach for `font-light` directly.
 */
export const ranade = localFont({
  src: [
    { path: "../fonts/ranade/Ranade-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/ranade/Ranade-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-ranade",
  display: "swap",
});

/** Headers, buttons, labels, table headers, micro-labels. */
export const generalSans = localFont({
  src: [
    { path: "../fonts/general-sans/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});
