"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search, ChevronRight, Star, Users as UsersIcon, UserPlus
} from "lucide-react";
import { CustomerList } from "./CustomerList";
import { AddCustomerDrawer } from "./AddCustomerDrawer";
import { LoyaltySettingsCard } from "./LoyaltySettingsCard";
import type { CustomerListRow, PriorityCustomerRow } from "@/lib/queries/customers";
import type { LoyaltySettings } from "@/lib/queries/customers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CustomersShellProps = {
  customers: (CustomerListRow | PriorityCustomerRow)[];
  loyaltySettings: LoyaltySettings | null;
  canManage: boolean;
  isOwner: boolean;
};

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function CustomersShell({ customers, loyaltySettings, canManage, isOwner }: CustomersShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const priority = searchParams.get("priority") === "1";

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points ?? 0), 0);

  const stats = [
    { label: "Total customers",  value: customers.length,                                         bg: "#f5f5f5",              text: "text-neutral-800" },
    { label: "Priority",         value: customers.filter((c) => c.is_priority).length,            bg: "rgba(250,255,127,0.45)", text: "text-neutral-800" },
    { label: "Loyalty points",   value: totalPoints.toLocaleString(),                              bg: "rgba(12,151,98,0.10)", text: "text-[var(--accent-green)]" },
    { label: "Active this month", value: "—",                                                      bg: "#f5f5f5",              text: "text-neutral-800" },
  ];

  return (
    <>

          {/* Page header */}
          <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Rio Bakers Hut</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-neutral-800 font-medium">Customers</span>
              </div>
              <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Customers</h1>
            </div>
            {canManage && <AddCustomerDrawer />}
          </section>

          {/* Summary stats */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[20px] p-4" style={{ background: s.bg }}>
                <div className={`text-3xl font-light ${s.text}`}>{s.value}</div>
                <div className="mt-1 text-xs text-neutral-600 font-medium">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {[
              { value: "all",      label: "All customers", icon: UsersIcon },
              { value: "priority", label: "Priority",      icon: Star },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => updateParams({ priority: tab.value === "priority" ? "1" : null })}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  (tab.value === "priority") === priority
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
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
              placeholder="Search by name or phone…"
              className="bg-transparent outline-none flex-1 text-sm text-neutral-700 placeholder:text-neutral-400"
            />
          </div>

          {/* Customer list — CustomerDetailDrawer + all logic preserved */}
          <section className="overflow-hidden rounded-[24px] border border-black/5">
            <CustomerList customers={customers} />
          </section>

          {/* Loyalty settings — owner only */}
          {isOwner && loyaltySettings !== null && loyaltySettings !== undefined && (
            <div className="rounded-[24px] border border-black/5 p-5">
              <div className="flex items-center gap-2 text-sm font-medium mb-4">
                <Star className="h-4 w-4" /> Loyalty settings
              </div>
              <LoyaltySettingsCard initial={loyaltySettings} />
            </div>
          )}

          <div className="h-4" />
    </>
  );
}
