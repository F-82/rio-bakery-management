"use client";

import { useTranslation } from "react-i18next";

type LogoProps = {
  /** Edge length in px. The mark is always square. */
  size?: number;
  className?: string;
  logoUrl?: string | null;
};

/**
 * Renders the uploaded business logo (`businesses.logo_url`, set via
 * Settings) if there is one, otherwise the real supplied artwork bundled
 * with the app at `public/brand/logo.webp` — the same file the login screen
 * and topbar already use. Not a placeholder: the client's actual logo, kept
 * as a static asset until an owner uploads a custom one through Settings.
 */
export function Logo({ size = 32, className, logoUrl }: LogoProps) {
    const { t } = useTranslation();
  return (
    <img
      src={logoUrl || "/brand/logo.webp"}
      width={size}
      height={size}
      alt={t("Rio Bakers Hut")}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
