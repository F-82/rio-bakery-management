import { getExpenseAmountsForPeriod, getExpenseCategories, getExpenses, getOrdersForPeriod } from "@/lib/queries/finance";
import { getCurrentProfile } from "@/lib/queries/profile";
import { buildRevenueByDay, getPeriodRange, summariseFinance, getFinanceTab, type FinancePeriod } from "@/lib/finance";
import { FinanceShell } from "@/components/finance/FinanceShell";

type FinancePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const tab = getFinanceTab({ tab: firstValue(params.tab) });
  const period = (firstValue(params.period) as FinancePeriod) || "month";
  const profile = await getCurrentProfile();
  const isManager = profile?.role === "manager";
  const canAddExpense = profile?.role === "owner" || isManager;

  let summary, revenueByDay, expenses, expenseCategories;

  if (isManager || tab === "overview") {
    const range = getPeriodRange(period);
    const [orders, expenseAmounts, managerCategories] = await Promise.all([
      getOrdersForPeriod(range.from, range.to),
      isManager ? Promise.resolve([]) : getExpenseAmountsForPeriod(range.from, range.to),
      isManager ? getExpenseCategories() : Promise.resolve(undefined),
    ]);
    summary = summariseFinance(orders, expenseAmounts);
    revenueByDay = buildRevenueByDay(orders, range);
    expenseCategories = managerCategories;
  } else if (tab === "expenses") {
    [expenses, expenseCategories] = await Promise.all([getExpenses(), getExpenseCategories()]);
  }

  return (
    <FinanceShell
      tab={isManager ? "overview" : tab}
      period={period}
      summary={summary}
      revenueByDay={revenueByDay}
      expenses={expenses}
      expenseCategories={expenseCategories}
      businessId={profile?.business_id ?? ""}
      canAddExpense={canAddExpense}
      managerView={isManager}
    />
  );
}
