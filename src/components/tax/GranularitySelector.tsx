"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TabPills } from "@/components/patterns/TabPills";
import { TAX_GRANULARITIES, type TaxGranularity } from "@/lib/tax";

const DEFAULT_GRANULARITY: TaxGranularity = "monthly";

export function getTaxGranularity(searchParams: { granularity?: string }): TaxGranularity {
  const granularity = searchParams.granularity;
  return granularity === "quarterly" || granularity === "annual" ? granularity : DEFAULT_GRANULARITY;
}

/** Lives in the URL, same pattern as PeriodSelector (lib/finance.ts). */
export function GranularitySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const granularity = getTaxGranularity({ granularity: searchParams.get("granularity") ?? undefined });

  function handleChange(value: TaxGranularity) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_GRANULARITY) params.delete("granularity");
    else params.set("granularity", value);
    // A stale "2026-Q3" period value is meaningless once viewed monthly — reset it.
    params.delete("period");
    router.push(`${pathname}?${params.toString()}`);
  }

  return <TabPills tabs={TAX_GRANULARITIES} value={granularity} onChange={handleChange} label="Filing period" />;
}
