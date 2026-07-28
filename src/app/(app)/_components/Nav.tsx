"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getPrimaryNavItems, MORE_SHEET_ITEMS } from "@/lib/nav";
import { MoreSheet } from "./MoreSheet";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { useTranslation } from "react-i18next";

type NavProps = {
  // A role string, not the precomputed item list — the list embeds lucide
  // icon component references, which can't cross the server/client boundary
  // as a prop (only rendered elements can). Computed here instead.
  role: Database["public"]["Enums"]["user_role"];
  /** href -> count, e.g. { "/inventory": lowStockCount }. Renders nothing when a count is 0/undefined. */
  badgeCounts?: Partial<Record<string, number>>;
};

function isHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Single mounted component for every breakpoint — see the `.app-nav` CSS in
 * globals.css for the bottom-pill/left-rail switch. Never swapped by a JS
 * breakpoint check, so it can't remount (and lose state) on rotation.
 */
export function Nav({ role, badgeCounts }: NavProps) {
    const { t } = useTranslation();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = getPrimaryNavItems(role);

  const isMoreActive = MORE_SHEET_ITEMS.some((item) => isHrefActive(pathname, item.href));

  return (
    <>
      <nav className="app-nav print:hidden" aria-label="Primary">
        {items.map((item) => {
          if (item.kind === "more") {
            return (
              <button
                key="more"
                type="button"
                className="app-nav__item"
                data-active={isMoreActive}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(true)}
              >
                {/* Active icon --ink on an --accent-tint rounded square (DESIGN.md §Responsive rail spec) */}
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-tile",
                    isMoreActive && "bg-accent-tint",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span className="app-nav__label text-micro">{item.label}</span>
              </button>
            );
          }

          const isActive = isHrefActive(pathname, item.href);
          const badgeCount = badgeCounts?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="app-nav__item"
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "relative inline-flex size-9 items-center justify-center rounded-tile",
                  isActive && "bg-accent-tint",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {/* Filled dot with a numeral, --warn — DESIGN.md §Navigation badges. */}
                {!!badgeCount && (
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-warn text-[10px] text-ink"
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              <span className="app-nav__label text-micro">
                {item.label}
                {!!badgeCount && (
                  <span className="sr-only">, {badgeCount} {t("low stock")}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
