"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight, TrendingUp, ArrowUpRight, ArrowDownRight,
  PieChart, ReceiptText, Building2, Receipt, Wallet,
} from "lucide-react";
import { RevenueByDayChart } from "./RevenueByDayChart";
import { ExpensesLedger } from "./ExpensesLedger";
import { PlatformEarningsTab } from "./PlatformEarningsTab";
import type { FinanceSummary, RevenueByDay, FinancePeriod } from "@/lib/finance";
import { FINANCE_PERIODS, DEFAULT_TAB } from "@/lib/finance";
import type { ExpenseRow } from "@/lib/queries/finance";
import { AddExpenseDrawer } from "./AddExpenseDrawer";
import { useTranslation } from "react-i18next";

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
  managerView: boolean;
};

const TABS = [
  { value: "overview",  label: "Overview",          icon: PieChart },
  { value: "expenses",  label: "Expenses",          icon: ReceiptText },
  { value: "platform",  label: "Platform earnings", icon: Building2 },
] as const;

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function FinanceShell({
  tab, period, summary, revenueByDay, expenses, expenseCategories, businessId, canAddExpense, managerView,
}: FinanceShellProps) {
  const { t } = useTranslation();
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
    <>
          {/* Page header */}
          <section>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Rio Bakers Hut</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-800 font-medium">Finance</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                {managerView ? t("Revenue") : "Finance"}
              </h1>
              {managerView && (
                <AddExpenseDrawer
                  businessId={businessId}
                  categories={expenseCategories ?? []}
                />
              )}
            </div>
          </section>

          {/* Finance tabs */}
          {!managerView && <div className="flex items-center gap-2">
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
          </div>}

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
                <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-1.5">
                  <span className="text-xs text-neutral-500">LKR</span>
                  <span className="text-5xl font-light tracking-tight text-[var(--accent-green)]">
                    {summary.totalIncome.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Stat pills */}
              <section className={`grid gap-4 ${managerView ? "grid-cols-1" : "grid-cols-2"}`}>
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
                {!managerView && <div className="rounded-[20px] p-4" style={{ background: "rgba(239,68,68,0.08)" }}>
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
                </div>}
              </section>

              {/* Net profit card */}
              {!managerView && <div className="rounded-[24px] bg-white border border-black/5 p-5">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <TrendingUp className="h-4 w-4" />
                  Net profit
                </div>
                <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-1.5">
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
              </div>}

              {/* Revenue by day chart */}
              {revenueByDay.length > 0 && (
                <div className="rounded-[24px] bg-white border border-black/5 p-5">
                  <div className="text-sm text-neutral-500 mb-4">Revenue by day</div>
                  <RevenueByDayChart data={revenueByDay} />
                </div>
              )}
            </>
          )}

          {!managerView && tab === "expenses" && expenses && expenseCategories && (
            <ExpensesLedger
              expenses={expenses}
              categories={expenseCategories}
              businessId={businessId}
              canAdd={canAddExpense}
            />
          )}

          {!managerView && tab === "platform" && <PlatformEarningsTab />}

          <div className="h-4" />
    </>
  );
}
