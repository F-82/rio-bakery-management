import localFont from "next/font/local";

/**
 * The only typeface (DESIGN.md §Type — Ranade removed). Medium (500) stands
 * in for every role that used to run Regular/Light; only Medium and Semibold
 * (600) are the weights we have local files for. Every text-* utility in
 * globals.css maps to one of these two.
 */
export const generalSans = localFont({
  src: [
    { path: "../fonts/general-sans/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});
