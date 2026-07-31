"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronRight, Plus, Clock, Archive } from "lucide-react";
import { OrdersList } from "./OrdersList";
import type { OrderListRow, OrdersFilter } from "@/lib/queries/orders";
import type { ActiveCounter } from "@/lib/queries/counters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrdersShellProps = {
  initialOrders: OrderListRow[];
  filter: OrdersFilter;
  counters: ActiveCounter[];
  sources: string[];
  canVoid: boolean;
  counterId: string | null;
};

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "black" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-[rgba(12,151,98,0.10)] text-[var(--accent-green)]",
    yellow: "bg-[rgba(250,255,127,0.55)] text-neutral-800",
    black: "bg-black text-white",
    red: "bg-[rgba(239,68,68,0.08)] text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_CHIP: Record<string, { tone: "green" | "neutral" | "red"; label: string }> = {
  open: { tone: "yellow" as any, label: "Open" },
  completed: { tone: "green", label: "Completed" },
  voided: { tone: "red", label: "Voided" },
};

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function OrdersShell({
  initialOrders,
  filter,
  counters,
  sources,
  canVoid,
  counterId,
}: OrdersShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local search state (applied on blur / Enter like existing OrdersFilters)
  const [search, setSearch] = useState(filter.search ?? "");
  // Note: OrdersList manages its own drawer state and realtime subscription

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const tab = filter.tab ?? "active";

  return (
    <>
      {/* Page header */}
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Rio Bakers Hut</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-neutral-800">Orders</span>
          </div>
          <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New order
          </Link>
        </div>
      </section>

      {/* Tab pills — Active / Archived */}
      <div className="flex items-center gap-2">
        {[
          { id: "active", label: "Active", icon: Clock },
          { id: "archived", label: "Archived", icon: Archive },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => updateParams({ tab: t.id === "active" ? null : t.id, status: null })}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t.id
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {tab === "active" && (
          <select
            value={filter.status ?? ""}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
            aria-label="Status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        )}
        <select
          value={filter.counterId ?? ""}
          onChange={(e) => updateParams({ counter: e.target.value || null })}
          className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
          aria-label="Counter"
        >
          <option value="">All counters</option>
          {counters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filter.source ?? ""}
          onChange={(e) => updateParams({ source: e.target.value || null })}
          className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
          aria-label="Source"
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filter.paymentMethod ?? ""}
          onChange={(e) => updateParams({ payment: e.target.value || null })}
          className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
          aria-label="Payment method"
        >
          <option value="">All payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
        <input
          type="date"
          value={filter.dateFrom ?? ""}
          onChange={(e) => updateParams({ from: e.target.value || null })}
          className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
          aria-label="From date"
        />
        <input
          type="date"
          value={filter.dateTo ?? ""}
          onChange={(e) => updateParams({ to: e.target.value || null })}
          className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 transition-colors outline-none hover:bg-neutral-200"
          aria-label="To date"
        />
      </div>

      {/* Mobile search */}
      <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2 md:hidden">
        <Search className="h-3.5 w-3.5 flex-shrink-0 text-neutral-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => updateParams({ search: search || null })}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ search: search || null });
          }}
          placeholder="Search by order number…"
          className="flex-1 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
        />
      </div>

      {/* Orders list — preserves Supabase realtime subscription + drawer state */}
      <section className="overflow-hidden rounded-[24px] border border-black/5">
        <OrdersList
          initialOrders={initialOrders}
          filter={filter}
          counters={counters}
          canVoid={canVoid}
          counterId={counterId}
        />
      </section>

      <div className="h-4" />
    </>
  );
}
