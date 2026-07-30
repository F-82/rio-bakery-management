import { TaxReport } from "@/components/tax/TaxReport";
import { getDeductibleExpenses, getTaxCategoryLines, getTaxOrders } from "@/lib/queries/tax";
import { currentTaxPeriodValue, getTaxGranularity, getTaxPeriodRange } from "@/lib/tax";

type TaxPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TaxPage({ searchParams }: TaxPageProps) {
  const params = await searchParams;
  const granularity = getTaxGranularity({ granularity: firstValue(params.granularity) });
  const period = firstValue(params.period) || currentTaxPeriodValue(granularity);
  const range = getTaxPeriodRange(granularity, period);

  const [orders, categoryLines, expenses] = await Promise.all([
    getTaxOrders(range.from, range.to),
    getTaxCategoryLines(range.from, range.to),
    getDeductibleExpenses(range.from, range.to),
  ]);

  return <TaxReport granularity={granularity} range={range} orders={orders} categoryLines={categoryLines} expenses={expenses} />;
}
