import localFont from "next/font/local";
import { Noto_Sans_Sinhala } from "next/font/google";

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

export const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  weight: ["500", "600"], // Match General Sans weights
  variable: "--font-noto-sinhala",
  display: "swap",
});
