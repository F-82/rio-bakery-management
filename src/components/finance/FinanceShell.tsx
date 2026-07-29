"use client";

import Image from "next/image";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, Utensils, Users,
  Calendar, UserCog, BarChart3, Receipt, Settings, Bell,
  ChevronRight, Sparkles, LogOut, TrendingUp, ArrowUpRight, ArrowDownRight,
  PieChart, ReceiptText, Building2
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { RevenueByDayChart } from "./RevenueByDayChart";
import { ExpensesLedger } from "./ExpensesLedger";
import { PlatformEarningsTab } from "./PlatformEarningsTab";
import type { FinanceSummary, RevenueByDay, FinancePeriod } from "@/lib/finance";
import { FINANCE_PERIODS, getFinanceTab, DEFAULT_TAB } from "@/lib/finance";
import type { ExpenseRow } from "@/lib/queries/finance";
import { formatLKR } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FinanceTab = "overview" | "expenses" | "platform";

type FinanceShellProps = {
  tab: FinanceTab;
  period: FinancePeriod;
  summary?: FinanceSummary;
  revenueByDay?: RevenueByDay[];
  expenses?: ExpenseRow[];
  expenseCategories?: string[];
  businessId: string;
  canAddExpense: boolean;
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

const TABS = [
  { value: "overview",  label: "Overview",          icon: PieChart },
  { value: "expenses",  label: "Expenses",          icon: ReceiptText },
  { value: "platform",  label: "Platform earnings", icon: Building2 },
] as const;

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function FinanceShell({
  tab, period, summary, revenueByDay, expenses, expenseCategories, businessId, canAddExpense,
}: FinanceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_TAB) params.delete("tab");
    else params.set("tab", value);
    params.delete("period");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updatePeriod(value: FinancePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "month") params.delete("period");
    else params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

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
          <Wallet className="h-3.5 w-3.5 text-neutral-500" />
          <span>Finance</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="relative h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4 text-neutral-700" />
          </button>
          <button type="button" onClick={() => signOut()} className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors" title="Sign out">
            <LogOut className="h-3.5 w-3.5 text-neutral-600" />
          </button>
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
          <section>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Rio Bakers Hut</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-800 font-medium">Finance</span>
            </div>
            <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Finance</h1>
          </section>

          {/* Finance tabs */}
          <div className="flex items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => updateTab(t.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.value ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "overview" && summary && revenueByDay && (
            <>
              {/* Period selector */}
              <div className="flex items-center gap-2">
                {FINANCE_PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => updatePeriod(p.value)}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      period === p.value ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Hero income panel */}
              <div
                className="rounded-[20px] p-5"
                style={{ background: "rgba(12,151,98,0.10)" }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total income</div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-xs text-neutral-500">LKR</span>
                  <span className="text-5xl font-light tracking-tight text-[var(--accent-green)]">
                    {summary.totalIncome.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Stat pills */}
              <section className="grid grid-cols-2 gap-4">
                <div className="rounded-[20px] p-4" style={{ background: "#f5f5f5" }}>
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500">Total</span>
                  </div>
                  <div className="mt-4 text-3xl font-light">{summary.totalOrders}</div>
                  <div className="mt-1 text-xs text-neutral-600">Total orders</div>
                </div>
                <div className="rounded-[20px] p-4" style={{ background: "rgba(239,68,68,0.08)" }}>
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                      <Wallet className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500">Spend</span>
                  </div>
                  <div className="mt-4 text-3xl font-light text-red-600">
                    {summary.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">Total expenses</div>
                </div>
              </section>

              {/* Net profit card */}
              <div className="rounded-[24px] bg-white border border-black/5 p-5">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <TrendingUp className="h-4 w-4" />
                  Net profit
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-xs text-neutral-500">LKR</span>
                  <span className={`text-4xl font-light tracking-tight ${summary.netProfit >= 0 ? "text-[var(--accent-green)]" : "text-red-600"}`}>
                    {summary.netProfit.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {summary.netProfit >= 0
                    ? <ArrowUpRight className="h-5 w-5 text-[var(--accent-green)]" />
                    : <ArrowDownRight className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Income</span>
                    <span className="font-medium text-[var(--accent-green)]">LKR {summary.totalIncome.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Expenses</span>
                    <span className="font-medium text-red-600">LKR {summary.totalExpenses.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Revenue by day chart */}
              {revenueByDay.length > 0 && (
                <div className="rounded-[24px] bg-white border border-black/5 p-5">
                  <div className="text-sm text-neutral-500 mb-4">Revenue by day</div>
                  <RevenueByDayChart data={revenueByDay} />
                </div>
              )}
            </>
          )}

          {tab === "expenses" && expenses && expenseCategories && (
            <ExpensesLedger
              expenses={expenses}
              categories={expenseCategories}
              businessId={businessId}
              canAdd={canAddExpense}
            />
          )}

          {tab === "platform" && <PlatformEarningsTab />}

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}
