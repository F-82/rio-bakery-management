import type { ReactNode } from "react";
import { getTranslation } from "@/lib/i18n-server";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import { getFinanceTab } from "@/lib/finance";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { ExpensesLedger } from "@/components/finance/ExpensesLedger";
import { PlatformEarningsTab } from "@/components/finance/PlatformEarningsTab";
import { getExpenseAmountsForPeriod, getExpenseCategories, getExpenses, getOrdersForPeriod } from "@/lib/queries/finance";
import { getCurrentProfile } from "@/lib/queries/profile";
import { buildRevenueByDay, getPeriodRange, summariseFinance, type FinancePeriod } from "@/lib/finance";

type FinancePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const tab = getFinanceTab({ tab: firstValue(params.tab) });
  const profile = await getCurrentProfile();
  // Mirrors expenses_write RLS (ARCHITECTURE.md §RLS) — owner only, manager reads.
  const canAddExpense = profile?.role === "owner";

  let panel: ReactNode = null;

  if (tab === "overview") {
    const period = (firstValue(params.period) as FinancePeriod) || "month";
    const range = getPeriodRange(period);
    const [orders, expenseAmounts] = await Promise.all([
      getOrdersForPeriod(range.from, range.to),
      getExpenseAmountsForPeriod(range.from, range.to),
    ]);
    const summary = summariseFinance(orders, expenseAmounts);
    const revenueByDay = buildRevenueByDay(orders, range);
    panel = <FinanceOverview summary={summary} revenueByDay={revenueByDay} />;
  } else if (tab === "expenses") {
    const [expenses, categories] = await Promise.all([getExpenses(), getExpenseCategories()]);
    panel = (
      <ExpensesLedger
        expenses={expenses}
        categories={categories}
        businessId={profile?.business_id ?? ""}
        canAdd={canAddExpense}
      />
    );
  } else {
    panel = <PlatformEarningsTab />;
  }

  return (
    <div className="flex flex-col">
      <FinanceTabs />
      {panel}
    </div>
  );
}
