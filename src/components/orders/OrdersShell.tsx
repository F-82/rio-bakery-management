"use client";

import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, Utensils, Users,
  Calendar, UserCog, BarChart3, Receipt, Settings, Bell, Search,
  ChevronRight, Sparkles, Plus, Clock, Archive
} from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { OrdersList } from "./OrdersList";
import type { OrderListRow, OrdersFilter } from "@/lib/queries/orders";
import type { ActiveCounter } from "@/lib/queries/counters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrdersShellProps = {
  initialOrders: OrderListRow[];
  filter: OrdersFilter;
  counters: ActiveCounter[];
  sources: string[];
  canVoid: boolean;
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
// Primitive helpers
// ---------------------------------------------------------------------------

function Chip({ children, tone = "neutral" }: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "black" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    green:   "bg-[rgba(12,151,98,0.10)] text-[var(--accent-green)]",
    yellow:  "bg-[rgba(250,255,127,0.55)] text-neutral-800",
    black:   "bg-black text-white",
    red:     "bg-[rgba(239,68,68,0.08)] text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_CHIP: Record<string, { tone: "green" | "neutral" | "red"; label: string }> = {
  open:      { tone: "yellow" as any, label: "Open" },
  completed: { tone: "green",         label: "Completed" },
  voided:    { tone: "red",           label: "Voided" },
};

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function OrdersShell({ initialOrders, filter, counters, sources, canVoid }: OrdersShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local search state (applied on blur / Enter like existing OrdersFilters)
  const [search, setSearch] = useState(filter.search ?? "");
  // Note: OrdersList manages its own drawer state and realtime subscription

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const tab = filter.tab ?? "active";

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
          <ShoppingBag className="h-3.5 w-3.5 text-neutral-500" />
          <span>Orders</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="hidden md:flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 w-72 cursor-text">
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <input
              placeholder="Search by order number…"
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
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ background: "var(--accent-green)" }} />
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
                <span className="text-neutral-800 font-medium">Orders</span>
              </div>
              <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Orders</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> New order
              </Link>
            </div>
          </section>

          {/* Tab pills — Active / Archived */}
          <div className="flex items-center gap-2">
            {[
              { id: "active", label: "Active", icon: Clock },
              { id: "archived", label: "Archived", icon: Archive },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => updateParams({ tab: t.id === "active" ? null : t.id, status: null })}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  tab === t.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {tab === "active" && (
              <select
                value={filter.status ?? ""}
                onChange={(e) => updateParams({ status: e.target.value || null })}
                className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
                aria-label="Status"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="completed">Completed</option>
              </select>
            )}
            <select
              value={filter.counterId ?? ""}
              onChange={(e) => updateParams({ counter: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="Counter"
            >
              <option value="">All counters</option>
              {counters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filter.source ?? ""}
              onChange={(e) => updateParams({ source: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="Source"
            >
              <option value="">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filter.paymentMethod ?? ""}
              onChange={(e) => updateParams({ payment: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="Payment method"
            >
              <option value="">All payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
            <input
              type="date"
              value={filter.dateFrom ?? ""}
              onChange={(e) => updateParams({ from: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="From date"
            />
            <input
              type="date"
              value={filter.dateTo ?? ""}
              onChange={(e) => updateParams({ to: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="To date"
            />
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
              placeholder="Search by order number…"
              className="bg-transparent outline-none flex-1 text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Orders list — preserves Supabase realtime subscription + drawer state */}
          <section className="overflow-hidden rounded-[24px] border border-black/5">
            <OrdersList
              initialOrders={initialOrders}
              filter={filter}
              counters={counters}
              canVoid={canVoid}
            />
          </section>

          <div className="h-4" />
        </main>
      </div>


    </div>
  );
}
