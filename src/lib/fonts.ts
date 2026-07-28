import localFont from "next/font/local";
import { Noto_Sans_Sinhala, Outfit } from "next/font/google";

/**
 * Primary typeface — Outfit (rowner warm-minimal design system, design-v2.md §4).
 * Weights 300/400/500/600 loaded: 300=font-light (hero figures), 400=body,
 * 500=font-medium (labels, buttons, nav), 600=font-semibold (micro-labels).
 */
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

/**
 * General Sans — kept for backward compatibility during the gradual transition.
 * New screens should use Outfit via --font-sans. This will be removed once all
 * pages adopt the rowner design language.
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
  weight: ["300", "400", "500", "600"],
  variable: "--font-noto-sinhala",
  display: "swap",
});
