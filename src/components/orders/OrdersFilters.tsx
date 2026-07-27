"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ActiveCounter } from "@/lib/queries/counters";

type OrdersFiltersProps = {
  counters: ActiveCounter[];
  sources: string[];
};

const TABS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

/**
 * Filters live in the URL (shareable, and a plain server refetch on change —
 * no extra client fetch path needed). Search by order number only: phone
 * and customer name need the customers table, which doesn't exist until
 * step 12 (same deferral as the POS screen's customer lookup).
 */
export function OrdersFilters({ counters, sources }: OrdersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab") ?? "active";
  const status = searchParams.get("status") ?? "";
  const counterId = searchParams.get("counter") ?? "";
  const source = searchParams.get("source") ?? "";
  const paymentMethod = searchParams.get("payment") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
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
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => updateParams({ tab: t.value === "active" ? null : t.value, status: null })}
            className={cn(
              "flex h-11 items-center rounded-full px-4 text-label",
              tab === t.value ? "bg-ink text-accent-ink" : "bg-surface text-ink-2",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tab === "active" && (
          <select
            value={status}
            onChange={(event) => updateParams({ status: event.target.value || null })}
            className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
            aria-label="Status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        )}

        <select
          value={counterId}
          onChange={(event) => updateParams({ counter: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="Counter"
        >
          <option value="">All counters</option>
          {counters.map((counter) => (
            <option key={counter.id} value={counter.id}>
              {counter.name}
            </option>
          ))}
        </select>

        <select
          value={source}
          onChange={(event) => updateParams({ source: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="Source"
        >
          <option value="">All sources</option>
          {sources.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={(event) => updateParams({ payment: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="Payment method"
        >
          <option value="">All payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => updateParams({ from: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => updateParams({ to: event.target.value || null })}
          className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
          aria-label="To date"
        />
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onBlur={() => updateParams({ search: search || null })}
        onKeyDown={(event) => {
          if (event.key === "Enter") updateParams({ search: search || null });
        }}
        placeholder="Search by order number"
        className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink placeholder:text-ink-3"
      />
    </div>
  );
}
