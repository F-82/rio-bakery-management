import { SalesReport } from "@/components/reports/SalesReport";
import { getItemsSoldForReport, getOrdersForReport } from "@/lib/queries/reports";
import { getPeriodRange, type FinancePeriod } from "@/lib/finance";

type ReportsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const period = (firstValue(params.period) as FinancePeriod) || "month";
  const range = getPeriodRange(period);
  const [orders, itemsSold] = await Promise.all([
    getOrdersForReport(range.from, range.to),
    getItemsSoldForReport(range.from, range.to),
  ]);

  return <SalesReport orders={orders} itemsSold={itemsSold} range={range} />;
}
