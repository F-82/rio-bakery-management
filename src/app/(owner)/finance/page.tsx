import { getExpenseAmountsForPeriod, getExpenseCategories, getExpenses, getOrdersForPeriod } from "@/lib/queries/finance";
import { getCurrentProfile } from "@/lib/queries/profile";
import { buildRevenueByDay, getPeriodRange, summariseFinance, getFinanceTab, type FinancePeriod } from "@/lib/finance";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { colomboToday } from "@/lib/dashboard";

type FinancePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validPastDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > colomboToday()) return undefined;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value ? value : undefined;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const tab = getFinanceTab({ tab: firstValue(params.tab) });
  const period = (firstValue(params.period) as FinancePeriod) || "month";
  const selectedDate = validPastDate(firstValue(params.date));
  const profile = await getCurrentProfile();
  const isManager = profile?.role === "manager";
  const canAddExpense = profile?.role === "owner" || isManager;

  let summary, revenueByDay, expenses, expenseCategories;

  if (isManager || tab === "overview") {
    const range = selectedDate ? { from: selectedDate, to: selectedDate } : getPeriodRange(period);
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
      selectedDate={selectedDate}
      maxDate={colomboToday()}
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
