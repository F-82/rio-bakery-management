"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TabPills } from "@/components/patterns/TabPills";
import { useTranslation } from "react-i18next";

const TABS = [
  { value: "all", label: "All" },
  { value: "priority", label: "Priority" },
] as const;

/** Filters live in the URL — same reasoning as OrdersFilters/InventoryFilters: a plain server refetch on change. */
export function CustomerFilters() {
    const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const priority = searchParams.get("priority") === "1";
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3">
      <TabPills
        tabs={TABS}
        value={priority ? "priority" : "all"}
        onChange={(value) => updateParams({ priority: value === "priority" ? "1" : null })}
        label={t("Customer list")}
      />
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onBlur={() => updateParams({ search: search || null })}
        onKeyDown={(event) => {
          if (event.key === "Enter") updateParams({ search: search || null });
        }}
        placeholder={t("Search by name or phone")}
        className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink placeholder:text-ink-3"
      />
    </div>
  );
}
