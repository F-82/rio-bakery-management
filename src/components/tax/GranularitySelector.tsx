"use client";

import { TabPills } from "@/components/patterns/TabPills";
import { TAX_GRANULARITIES, getTaxGranularity, type TaxGranularity } from "@/lib/tax";
import { useUrlFilters } from "@/lib/hooks/use-url-filters";

const DEFAULT_GRANULARITY: TaxGranularity = "monthly";

/** Lives in the URL, same pattern as PeriodSelector (lib/finance.ts). */
export function GranularitySelector() {
  const { isPending, commit, searchParams } = useUrlFilters();
  const granularity = getTaxGranularity({ granularity: searchParams.get("granularity") ?? undefined });

  function handleChange(value: TaxGranularity) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_GRANULARITY) params.delete("granularity");
    else params.set("granularity", value);
    // A stale "2026-Q3" period value is meaningless once viewed monthly — reset it.
    params.delete("period");
    commit(params);
  }

  return (
    <TabPills
      tabs={TAX_GRANULARITIES}
      value={granularity}
      onChange={handleChange}
      label="Filing period"
      className={`transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}
    />
  );
}
