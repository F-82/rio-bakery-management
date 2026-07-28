"use client";

import { useTranslation } from "react-i18next";

type LogoProps = {
  /** Edge length in px. The mark is always square. */
  size?: number;
  className?: string;
  logoUrl?: string | null;
};

/**
 * Renders the business logo if provided, or the placeholder mark otherwise.
 */
export function Logo({ size = 32, className, logoUrl }: LogoProps) {
    const { t } = useTranslation();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        width={size}
        height={size}
        alt={t("Rio Bakers Hut")}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Rio Bakers Hut"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="var(--color-ink)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="var(--font-general-sans), sans-serif"
        fontWeight={500}
        fontSize="18"
        fill="var(--color-on-black)"
      >
        {t("R")}</text>
    </svg>
  );
}
