"use client";

import { useState } from "react";
import Image from "next/image";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  Utensils,
  Users,
  Calendar,
  UserCog,
  BarChart3,
  Receipt,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  CookingPot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { getHomeHref } from "@/lib/nav";
import type { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

// ---------------------------------------------------------------------------
// Sidebar nav config (shared)
// ---------------------------------------------------------------------------
export const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Orders", href: "/orders" },
  { icon: CookingPot, label: "Kitchen", href: "/kitchen" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Wallet, label: "Finance", href: "/finance" },
  { icon: Utensils, label: "Menu", href: "/menu" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Calendar, label: "Bookings", href: "/bookings" },
  { icon: UserCog, label: "Employees", href: "/employees" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Receipt, label: "Tax", href: "/tax" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

// STEPS.md §07: "staff get Orders / Menu / Inventory." Counter logins
// (bakery, hot plate) are `staff` role — everything else is finance/owner
// territory and is already redirected server-side (src/proxy.ts); this just
// keeps the sidebar from advertising links staff would bounce off of.
const STAFF_HREFS = new Set(["/orders", "/menu", "/inventory"]);

// The one route that wants full-bleed content instead of the padded/stacked
// default — DESIGN.md's POS section: "dense on purpose... drop the whitespace".
const FULL_BLEED_PREFIXES = ["/orders/new"];

// ---------------------------------------------------------------------------
// AppShell — persistent warm-minimal shell (topbar + sidebar), mounted once
// by (owner)/layout.tsx rather than per-page. Navigating between screens now
// only swaps `children`; the chrome around it never unmounts, so a tap
// switches instantly instead of tearing down and rebuilding the whole page.
// ---------------------------------------------------------------------------

type AppShellProps = {
  children: React.ReactNode;
  counterKind: "bakery" | "hot_plate" | null;
  /** Bell dot — fetched once in the layout rather than recomputed per page. */
  lowStockCount?: number;
  role: UserRole;
};

export function AppShell({ children, counterKind, lowStockCount = 0, role }: AppShellProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navItems = SIDEBAR_ITEMS.filter((item) => {
    if (role === "staff") {
      return (
        STAFF_HREFS.has(item.href) || (item.href === "/kitchen" && counterKind === "hot_plate")
      );
    }
    if (role === "manager") return item.href !== "/dashboard";
    return true;
  }).map((item) =>
    role === "manager" && item.href === "/finance" ? { ...item, label: "Revenue" } : item,
  );
  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const pageLabel = activeItem?.label ?? "Rio Bakers Hut";
  const PageIcon = activeItem?.icon ?? LayoutDashboard;
  const isFullBleed = FULL_BLEED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-white print:h-auto print:overflow-visible"
      style={{ fontFamily: "var(--font-outfit, var(--font-sans))" }}
    >
      {/* ── Top tab bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-black/5 px-4 pt-3 pb-2 print:hidden">
        <Link
          href={getHomeHref(role)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/logo.webp"
            alt="Rio Bakers Hut"
            width={28}
            height={28}
            className="object-cover"
          />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
          aria-controls="desktop-sidebar mobile-sidebar"
          aria-expanded={!sidebarCollapsed}
          aria-label={t(sidebarCollapsed ? "Show sidebar" : "Hide sidebar")}
          title={t(sidebarCollapsed ? "Show sidebar" : "Hide sidebar")}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
        <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium">
          <PageIcon className="h-3.5 w-3.5 text-neutral-500" />
          <span>{pageLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-neutral-700" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
            )}
          </button>
          <SignOutButton />
        </div>
      </div>

      {/* ── Shell body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Desktop sidebar */}
        <aside
          id="desktop-sidebar"
          className={`hidden shrink-0 overflow-hidden border-r transition-[width,border-color] duration-300 ease-in-out md:block print:hidden ${
            sidebarCollapsed ? "w-0 border-transparent" : "w-56 border-black/5"
          }`}
          aria-hidden={sidebarCollapsed}
          inert={sidebarCollapsed}
        >
          <div className="flex h-full w-56 flex-col gap-0.5 overflow-y-auto p-3">
            <div className="mb-2 px-3 pt-1">
              <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                {t("Rio Bakers Hut")}
              </div>
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-black font-medium text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {item.href === "/inventory" && lowStockCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-yellow)] px-1.5 text-[10px] font-medium text-black">
                      {lowStockCount > 9 ? "9+" : lowStockCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {role !== "staff" && (
              <div className="mt-auto pt-3">
                <div className="rounded-[20px] p-4" style={{ background: "var(--accent-yellow)" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-semibold">{t("Need help?")}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-black/70">
                    {t("Head to our support section for guides and tutorials.")}
                  </p>
                  <Link
                    href="/settings"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                  >
                    {t("Get support")} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile icon rail */}
        <aside
          id="mobile-sidebar"
          className={`shrink-0 overflow-hidden border-r transition-[width,border-color] duration-300 ease-in-out md:hidden print:hidden ${
            sidebarCollapsed ? "w-0 border-transparent" : "w-14 border-black/5"
          }`}
          aria-hidden={sidebarCollapsed}
          inert={sidebarCollapsed}
        >
          <div className="flex h-full w-14 flex-col overflow-y-auto px-1.5 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                  {item.href === "/inventory" && lowStockCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-yellow)] text-[9px] font-medium text-black">
                      {lowStockCount > 9 ? "9+" : lowStockCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content slot */}
        <main
          className={`${isFullBleed ? "flex flex-1 flex-col overflow-hidden" : "flex-1 space-y-4 overflow-y-auto p-4 md:space-y-5 md:p-5"} print:h-auto print:flex-none print:overflow-visible`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
