"use client";

import { TabPills } from "@/components/patterns/TabPills";
import { FINANCE_PERIODS, type FinancePeriod } from "@/lib/finance";
import { useUrlFilters } from "@/lib/hooks/use-url-filters";

const DEFAULT_PERIOD: FinancePeriod = "month";

/** Lives in the URL — a plain server refetch on change, non-blocking via a transition. */
export function PeriodSelector() {
  const { isPending, commit, searchParams } = useUrlFilters();
  const period = (searchParams.get("period") as FinancePeriod) || DEFAULT_PERIOD;

  function handleChange(value: FinancePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_PERIOD) params.delete("period");
    else params.set("period", value);
    commit(params);
  }

  return (
    <TabPills
      tabs={FINANCE_PERIODS}
      value={period}
      onChange={handleChange}
      label="Period"
      className={`transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}
    />
  );
}
