"use client";

import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, Utensils, Users,
  Calendar, UserCog, BarChart3, Receipt, Settings, Bell, Search,
  ChevronRight, Sparkles, Star, Users as UsersIcon, UserPlus
} from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { CustomerList } from "./CustomerList";
import { AddCustomerDrawer } from "./AddCustomerDrawer";
import { LoyaltySettingsCard } from "./LoyaltySettingsCard";
import type { CustomerListRow, PriorityCustomerRow } from "@/lib/queries/customers";
import type { LoyaltySettings } from "@/lib/queries/customers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CustomersShellProps = {
  customers: (CustomerListRow | PriorityCustomerRow)[];
  loyaltySettings: LoyaltySettings | null;
  canManage: boolean;
  isOwner: boolean;
};

// ---------------------------------------------------------------------------
// Sidebar nav config
// ---------------------------------------------------------------------------
const SIDEBAR_ITEMS = [
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

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function CustomersShell({ customers, loyaltySettings, canManage, isOwner }: CustomersShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const priority = searchParams.get("priority") === "1";

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points ?? 0), 0);

  const stats = [
    { label: "Total customers",  value: customers.length,                                         bg: "#f5f5f5",              text: "text-neutral-800" },
    { label: "Priority",         value: customers.filter((c) => c.is_priority).length,            bg: "rgba(250,255,127,0.45)", text: "text-neutral-800" },
    { label: "Loyalty points",   value: totalPoints.toLocaleString(),                              bg: "rgba(12,151,98,0.10)", text: "text-[var(--accent-green)]" },
    { label: "Active this month", value: "—",                                                      bg: "#f5f5f5",              text: "text-neutral-800" },
  ];

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
          <Users className="h-3.5 w-3.5 text-neutral-500" />
          <span>Customers</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="hidden md:flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 w-72 cursor-text">
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <input
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => updateParams({ search: search || null })}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ search: search || null }); }}
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-neutral-400"
            />
            <span className="text-[10px] rounded-md bg-white px-1.5 py-0.5 text-neutral-400 font-mono">⌘K</span>
          </label>
          <button type="button" className="relative h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4 text-neutral-700" />
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
                className={`h-9 w-9 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all duration-150 ${
                  isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                title={item.label}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5">

          {/* Page header */}
          <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Rio Bakers Hut</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-neutral-800 font-medium">Customers</span>
              </div>
              <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Customers</h1>
            </div>
            {canManage && <AddCustomerDrawer />}
          </section>

          {/* Summary stats */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[20px] p-4" style={{ background: s.bg }}>
                <div className={`text-3xl font-light ${s.text}`}>{s.value}</div>
                <div className="mt-1 text-xs text-neutral-600 font-medium">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {[
              { value: "all",      label: "All customers", icon: UsersIcon },
              { value: "priority", label: "Priority",      icon: Star },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => updateParams({ priority: tab.value === "priority" ? "1" : null })}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  (tab.value === "priority") === priority
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile search */}
          <div className="flex md:hidden items-center gap-2 rounded-full bg-neutral-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => updateParams({ search: search || null })}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ search: search || null }); }}
              placeholder="Search by name or phone…"
              className="bg-transparent outline-none flex-1 text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Customer list — CustomerDetailDrawer + all logic preserved */}
          <section className="overflow-hidden rounded-[24px] border border-black/5">
            <CustomerList customers={customers} />
          </section>

          {/* Loyalty settings — owner only */}
          {isOwner && loyaltySettings !== null && loyaltySettings !== undefined && (
            <div className="rounded-[24px] border border-black/5 p-5">
              <div className="flex items-center gap-2 text-sm font-medium mb-4">
                <Star className="h-4 w-4" /> Loyalty settings
              </div>
              <LoyaltySettingsCard initial={loyaltySettings} />
            </div>
          )}

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}
