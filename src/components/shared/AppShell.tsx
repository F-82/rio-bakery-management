"use client";

import Image from "next/image";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, Utensils, Users,
  Calendar, UserCog, BarChart3, Receipt, Settings, Bell,
  ChevronRight, Sparkles,
} from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";

// ---------------------------------------------------------------------------
// Sidebar nav config (shared)
// ---------------------------------------------------------------------------
export const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard"  },
  { icon: ShoppingBag,     label: "Orders",     href: "/orders"     },
  { icon: Package,         label: "Inventory",  href: "/inventory"  },
  { icon: Wallet,          label: "Finance",    href: "/finance"    },
  { icon: Utensils,        label: "Menu",       href: "/menu"       },
  { icon: Users,           label: "Customers",  href: "/customers"  },
  { icon: Calendar,        label: "Bookings",   href: "/bookings"   },
  { icon: UserCog,         label: "Employees",  href: "/employees"  },
  { icon: BarChart3,       label: "Reports",    href: "/reports"    },
  { icon: Receipt,         label: "Tax",        href: "/tax"        },
  { icon: Settings,        label: "Settings",   href: "/settings"   },
];

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
  /** Bell dot — fetched once in the layout rather than recomputed per page. */
  lowStockCount?: number;
};

export function AppShell({ children, lowStockCount = 0 }: AppShellProps) {
  const pathname = usePathname();
  const activeItem = SIDEBAR_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const pageLabel = activeItem?.label ?? "Rio Bakers Hut";
  const PageIcon = activeItem?.icon ?? LayoutDashboard;
  const isFullBleed = FULL_BLEED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white" style={{ fontFamily: "var(--font-outfit, var(--font-sans))" }}>

      {/* ── Top tab bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-black/5 flex-shrink-0">
        <Link href="/dashboard" className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity bg-neutral-100">
          <Image
            src="/brand/logo.webp"
            alt="Rio Bakers Hut"
            width={28}
            height={28}
            className="object-cover"
          />
        </Link>
        <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium">
          <PageIcon className="h-3.5 w-3.5 text-neutral-500" />
          <span>{pageLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="relative h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4 text-neutral-700" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
            )}
          </button>
          <SignOutButton />
        </div>
      </div>

      {/* ── Shell body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-black/5 p-3 gap-0.5 flex-shrink-0 overflow-y-auto">
          <div className="mb-2 px-3 pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Rio Bakers Hut</div>
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive ? "bg-black text-white font-medium" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
          <div className="mt-auto pt-3">
            <div className="rounded-[20px] p-4" style={{ background: "var(--accent-yellow)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Need help?</span>
              </div>
              <p className="mt-1.5 text-xs text-black/70 leading-snug">Head to our support section for guides and tutorials.</p>
              <Link href="/settings" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">
                Get support <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile icon rail */}
        <aside className="flex md:hidden flex-col w-14 py-3 px-1.5 shrink-0 border-r border-black/5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.label} href={item.href}
                className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all duration-150 relative ${
                  isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
                {item.href === "/inventory" && lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent-yellow)] flex items-center justify-center text-[9px] text-black font-medium">
                    {lowStockCount > 9 ? "9+" : lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Main content slot */}
        <main className={isFullBleed ? "flex flex-1 flex-col overflow-hidden" : "flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5"}>
          {children}
        </main>
      </div>
    </div>
  );
}
