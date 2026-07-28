"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TabPills } from "@/components/patterns/TabPills";
import { FINANCE_PERIODS, type FinancePeriod } from "@/lib/finance";

const DEFAULT_PERIOD: FinancePeriod = "month";

/** Lives in the URL, same pattern as OrdersFilters — a plain server refetch on change. */
export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as FinancePeriod) || DEFAULT_PERIOD;

  function handleChange(value: FinancePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_PERIOD) params.delete("period");
    else params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return <TabPills tabs={FINANCE_PERIODS} value={period} onChange={handleChange} label="Period" />;
}
