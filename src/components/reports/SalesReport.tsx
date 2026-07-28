import { CircleHelp, Landmark, Receipt, Split, Store, Wallet } from "lucide-react";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { StatCard } from "@/components/patterns/StatCard";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { ExportActions } from "@/components/reports/ExportActions";
import { BreakdownSection } from "@/components/reports/BreakdownSection";
import { DetailTable } from "@/components/reports/DetailTable";
import { formatDate } from "@/lib/format";
import {
  buildCounterBreakdown,
  buildPaymentBreakdown,
  buildSourceBreakdown,
  summariseSales,
  type ReportOrder,
} from "@/lib/reports";
import type { DateRange } from "@/lib/finance";

type SalesReportProps = {
  orders: ReportOrder[];
  range: DateRange;
};

/**
 * "Report type selector" (STEPS.md §15) isn't built as a real selector —
 * Sales is the only report type ARCHITECTURE.md defines (Tax has its own
 * nav item and lands in step 16). Same call as the Platform Earnings and
 * booking-revenue stubs: no UI for a type that doesn't exist yet.
 */
export function SalesReport({ orders, range }: SalesReportProps) {
  const summary = summariseSales(orders);
  const counterBreakdown = buildCounterBreakdown(orders);
  const sourceBreakdown = buildSourceBreakdown(orders);
  const paymentBreakdown = buildPaymentBreakdown(orders);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Sales report"
        actions={<ExportActions orders={orders} filename={`sales-report-${range.from}-to-${range.to}.csv`} />}
      />

      {/* Nav/Header are print:hidden (app-shell); this line is the report's own
          heading once those chrome elements disappear from the printed page. */}
      <div className="hidden print:block">
        <h1 className="text-h1 text-ink">Sales report</h1>
        <p className="text-body-sm text-ink-2">
          {formatDate(range.from, "date")} – {formatDate(range.to, "date")}
        </p>
      </div>

      <PeriodSelector />

      <div className="flex flex-col gap-2">
        <span className="text-micro text-ink-2">Revenue</span>
        {/* The one AccentPanel this screen gets (DESIGN.md §Structural language) */}
        <AccentPanel>
          <MoneyText amount={summary.revenue} size="num-lg" />
        </AccentPanel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Receipt} label="Orders" value={String(summary.totalOrders)} />
        <StatCard icon={Wallet} label="Completed" value={String(summary.completedOrders)} />
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-6">
        <IconChip icon={CircleHelp} />
        <span className="text-micro text-ink-2">Commission &amp; net revenue</span>
        <p className="text-body text-ink-2">
          Platform commission isn&apos;t defined yet (client blocker #6) — no rate exists anywhere in the schema to
          derive these from. Confirming scope with the client before either card shows a number.
        </p>
      </div>

      <BreakdownSection icon={Store} title="By counter" rows={counterBreakdown} totalRevenue={summary.revenue} />
      <BreakdownSection icon={Split} title="By source" rows={sourceBreakdown} totalRevenue={summary.revenue} />
      <BreakdownSection icon={Landmark} title="By payment" rows={paymentBreakdown} totalRevenue={summary.revenue} />

      <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
        <span className="text-micro text-ink-2">Detail</span>
        <DetailTable orders={orders} />
      </div>
    </div>
  );
}
