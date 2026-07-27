"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getPrimaryNavItems, MORE_SHEET_ITEMS } from "@/lib/nav";
import { MoreSheet } from "./MoreSheet";
import type { Database } from "@/types/database";

type NavProps = {
  // A role string, not the precomputed item list — the list embeds lucide
  // icon component references, which can't cross the server/client boundary
  // as a prop (only rendered elements can). Computed here instead.
  role: Database["public"]["Enums"]["user_role"];
};

function isHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Single mounted component for every breakpoint — see the `.app-nav` CSS in
 * globals.css for the bottom-pill/left-rail switch. Never swapped by a JS
 * breakpoint check, so it can't remount (and lose state) on rotation.
 */
export function Nav({ role }: NavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = getPrimaryNavItems(role);

  const isMoreActive = MORE_SHEET_ITEMS.some((item) => isHrefActive(pathname, item.href));

  return (
    <>
      <nav className="app-nav" aria-label="Primary">
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
                <item.icon className="size-5" aria-hidden />
                <span className="app-nav__label text-micro">{item.label}</span>
              </button>
            );
          }

          const isActive = isHrefActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="app-nav__item"
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="size-5" aria-hidden />
              <span className="app-nav__label text-micro">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
