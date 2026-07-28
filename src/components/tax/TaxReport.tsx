import { Landmark, PieChart, Receipt, TrendingUp, Wallet } from "lucide-react";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { StatCard } from "@/components/patterns/StatCard";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ExportActions } from "@/components/patterns/ExportActions";
import { GranularitySelector } from "@/components/tax/GranularitySelector";
import { PeriodPicker } from "@/components/tax/PeriodPicker";
import { CategoryBreakdownTable } from "@/components/tax/CategoryBreakdownTable";
import { DeductibleExpensesTable } from "@/components/tax/DeductibleExpensesTable";
import { formatDate, formatLKR } from "@/lib/format";
import {
  buildTaxCsv,
  buildTaxCategoryBreakdown,
  calculateNetTaxableIncome,
  summariseDeductibleExpenses,
  summariseGrossRevenue,
  summariseTaxableRevenue,
  type DateRange,
  type TaxCategoryLine,
  type TaxExpenseRow,
  type TaxGranularity,
  type TaxOrder,
} from "@/lib/tax";

type TaxReportProps = {
  granularity: TaxGranularity;
  range: DateRange;
  orders: TaxOrder[];
  categoryLines: TaxCategoryLine[];
  expenses: TaxExpenseRow[];
};

/**
 * ARCHITECTURE.md Invariant 7: gross revenue is the actual, unmodified sum
 * of completed order totals — no multiplier, adjustment factor, reduction
 * setting or "reported revenue" field exists anywhere below this line.
 */
export function TaxReport({ granularity, range, orders, categoryLines, expenses }: TaxReportProps) {
  const grossRevenue = summariseGrossRevenue(orders);
  const categoryBreakdown = buildTaxCategoryBreakdown(categoryLines);
  const taxableRevenue = summariseTaxableRevenue(categoryLines);
  const deductibleExpenses = summariseDeductibleExpenses(expenses.map((expense) => expense.amount));
  const netTaxableIncome = calculateNetTaxableIncome(taxableRevenue, deductibleExpenses);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Tax report"
        actions={
          <ExportActions
            getCsv={() =>
              buildTaxCsv({ range, grossRevenue, categoryBreakdown, taxableRevenue, deductibleExpenses, netTaxableIncome, expenses })
            }
            filename={`tax-report-${range.from}-to-${range.to}.csv`}
          />
        }
      />

      {/* Nav/Header are print:hidden (app-shell); this line is the report's own
          heading once those chrome elements disappear from the printed page. */}
      <div className="hidden print:block">
        <h1 className="text-h1 text-ink">Tax report</h1>
        <p className="text-body-sm text-ink-2">
          {formatDate(range.from, "date")} – {formatDate(range.to, "date")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GranularitySelector />
        <PeriodPicker granularity={granularity} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-micro text-ink-2">Gross revenue</span>
        {/* The one AccentPanel this screen gets (DESIGN.md §Structural language) */}
        <AccentPanel>
          <MoneyText amount={grossRevenue} size="num-lg" />
        </AccentPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Landmark} label="Taxable revenue" value={formatLKR(taxableRevenue)} />
        <StatCard icon={Wallet} label="Deductible expenses" value={formatLKR(deductibleExpenses)} />
        <StatCard icon={TrendingUp} label="Net taxable income" value={formatLKR(netTaxableIncome)} />
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <div className="flex items-center gap-3">
          <IconChip icon={PieChart} />
          <span className="text-h3 text-ink">Revenue by tax category</span>
        </div>
        <CategoryBreakdownTable rows={categoryBreakdown} grossRevenue={grossRevenue} />
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <div className="flex items-center gap-3">
          <IconChip icon={Receipt} />
          <span className="text-h3 text-ink">Deductible expenses</span>
        </div>
        <DeductibleExpensesTable expenses={expenses} />
      </div>
    </div>
  );
}
