"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TabPills } from "@/components/patterns/TabPills";
import { useTranslation } from "react-i18next";
import { FinanceTab, DEFAULT_TAB, getFinanceTab } from "@/lib/finance";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "expenses", label: "Expenses" },
  { value: "platform", label: "Platform earnings" },
] as const;

export function FinanceTabs() {
    const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = getFinanceTab({ tab: searchParams.get("tab") ?? undefined });

  function handleChange(value: FinanceTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_TAB) params.delete("tab");
    else params.set("tab", value);
    // Switching tabs drops the period selector — it only applies to Overview.
    params.delete("period");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="border-b border-line px-4 py-3 sm:px-6">
      <TabPills tabs={TABS} value={tab} onChange={handleChange} label={t("Finance section")} />
    </div>
  );
}
