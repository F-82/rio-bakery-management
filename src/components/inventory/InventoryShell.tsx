"use client";

import { useState } from "react";
import {
  Search, ChevronRight, Plus, AlertTriangle,
} from "lucide-react";
import { useUrlFilters } from "@/lib/hooks/use-url-filters";
import { InventoryList } from "./InventoryList";
import { AddItemDrawer } from "./AddItemDrawer";
import type { InventoryListRow, InventoryCategory, InventoryFilter } from "@/lib/queries/inventory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InventoryShellProps = {
  items: InventoryListRow[];
  categories: InventoryCategory[];
  canManage: boolean;
  lowStockCount: number;
};

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function InventoryShell({ items, categories, canManage, lowStockCount }: InventoryShellProps) {
  const { isPending, updateParams, searchParams } = useUrlFilters();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const lowStockOnly = searchParams.get("lowStock") === "1";
  const categoryId = searchParams.get("category") ?? "";

  const stats = [
    { label: "Total items",  value: items.length,                                           bg: "#f5f5f5",                   text: "text-neutral-800" },
    { label: "Low stock",    value: lowStockCount,                                           bg: "rgba(250,255,127,0.45)",    text: "text-neutral-800" },
    { label: "Categories",   value: categories.length,                                       bg: "#f5f5f5",                   text: "text-neutral-800" },
    { label: "Active",       value: items.filter((i) => i.active).length,                   bg: "rgba(12,151,98,0.10)",      text: "text-[var(--accent-green)]" },
  ];

  return (
    <>
          {/* Page header */}
          <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Rio Bakers Hut</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-neutral-800 font-medium">Inventory</span>
              </div>
              <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Inventory</h1>
            </div>
            {canManage && (
              <AddItemDrawer categories={categories} />
            )}
          </section>

          {/* Low-stock accent panel (one per screen — lovable design §Structural language) */}
          {lowStockCount > 0 && (
            <div
              className="rounded-[20px] p-4 flex items-center justify-between gap-3"
              style={{ background: "rgba(250,255,127,0.45)" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--accent-yellow)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {lowStockCount} item{lowStockCount === 1 ? "" : "s"} need restocking
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">Stock levels are below minimum thresholds</div>
                </div>
              </div>
              <button
                onClick={() => updateParams({ lowStock: lowStockOnly ? null : "1" })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                  lowStockOnly ? "bg-black text-white" : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {lowStockOnly ? "Show all" : "View low stock"}
              </button>
            </div>
          )}

          {/* Summary stats */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[20px] p-4" style={{ background: s.bg }}>
                <div className={`text-3xl font-light ${s.text}`}>{s.value}</div>
                <div className="mt-1 text-xs text-neutral-600 font-medium">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateParams({ lowStock: lowStockOnly ? null : "1" })}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                lowStockOnly ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Low stock only
            </button>
            <select
              value={categoryId}
              onChange={(e) => updateParams({ category: e.target.value || null })}
              className="h-9 rounded-full bg-neutral-100 px-3.5 text-sm text-neutral-700 outline-none hover:bg-neutral-200 transition-colors"
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Search — was desktop-topbar + mobile-only content, now one row
              for every width now that (owner)/layout.tsx owns the topbar */}
          <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => updateParams({ search: search || null })}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ search: search || null }); }}
              placeholder="Search by item name…"
              className="bg-transparent outline-none flex-1 text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Inventory list — ItemDetailDrawer + all logic preserved */}
          <section
            aria-busy={isPending}
            className={`overflow-hidden rounded-[24px] border border-black/5 transition-opacity ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <InventoryList
              items={items}
              categories={categories}
              canManage={canManage}
            />
          </section>

          <div className="h-4" />
    </>
  );
}
