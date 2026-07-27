"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { InventoryCategory } from "@/lib/queries/inventory";

type InventoryFiltersProps = {
  categories: InventoryCategory[];
};

/** Filters live in the URL — shareable, and a plain server refetch on change (same reasoning as OrdersFilters). */
export function InventoryFilters({ categories }: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lowStock = searchParams.get("lowStock") === "1";
  const categoryId = searchParams.get("category") ?? "";
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
      <div className="flex flex-wrap gap-2">
        <label className="flex h-11 items-center gap-2 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(event) => updateParams({ lowStock: event.target.checked ? "1" : null })}
          />
          Low stock only
        </label>

        <select
          value={categoryId}
          onChange={(event) => updateParams({ category: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onBlur={() => updateParams({ search: search || null })}
        onKeyDown={(event) => {
          if (event.key === "Enter") updateParams({ search: search || null });
        }}
        placeholder="Search by item name"
        className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink placeholder:text-ink-3"
      />
    </div>
  );
}
