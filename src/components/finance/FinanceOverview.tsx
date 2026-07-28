"use client";

import { CalendarDays, Receipt, TrendingUp, Wallet } from "lucide-react";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { StatCard } from "@/components/patterns/StatCard";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatLKR } from "@/lib/format";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { RevenueByDayChart } from "@/components/finance/RevenueByDayChart";
import type { FinanceSummary, RevenueByDay } from "@/lib/finance";
import { useTranslation } from "react-i18next";

type FinanceOverviewProps = {
  summary: FinanceSummary;
  revenueByDay: RevenueByDay[];
};

/**
 * "Booking revenue" (STEPS.md §14) can't be computed yet: the bookings
 * table doesn't exist (client blocker #5 gates step 17), and even
 * ARCHITECTURE.md's Bookings schema has no revenue/amount column to sum —
 * this is a scope gap, not a missing table. Blocker #6 also flags Platform
 * Earnings as unscoped, which is the same reasoning behind that tab's own
 * stub. Same call as step 13's dashboard: a plain non-fetching tile beats
 * fabricating a number this screen's own done-when can't verify against
 * anything real.
 */
export function FinanceOverview({ summary, revenueByDay }: FinanceOverviewProps) {
    const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PeriodSelector />

      <div className="flex flex-col gap-2">
        <span className="text-micro text-ink-2">{t("Total income")}</span>
        {/* The one AccentPanel this screen gets (DESIGN.md §Structural language) */}
        <AccentPanel>
          <MoneyText amount={summary.totalIncome} size="num-lg" />
        </AccentPanel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Receipt} label={t("Total orders")} value={String(summary.totalOrders)} />
        <StatCard icon={Wallet} label={t("Total expenses")} value={formatLKR(summary.totalExpenses)} />
      </div>

      <div className="flex flex-col gap-2 rounded-card bg-surface p-6">
        <IconChip icon={CalendarDays} />
        <span className="text-micro text-ink-2">{t("Booking revenue")}</span>
        <p className="text-body text-ink-2">{t("Bookings tracking lands in step 17.")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-6">
        <IconChip icon={TrendingUp} />
        <span className="text-micro text-ink-2">{t("Net profit")}</span>
        <MoneyText amount={summary.netProfit} size="num-lg" />
        <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-ink-2">{t("Income")}</span>
            <MoneyText amount={summary.totalIncome} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label text-ink-2">{t("Expenses")}</span>
            <MoneyText amount={summary.totalExpenses} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <span className="text-micro text-ink-2">{t("Revenue by day")}</span>
        <RevenueByDayChart data={revenueByDay} />
      </div>
    </div>
  );
}
