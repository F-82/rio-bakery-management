"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import { formatLKR } from "@/lib/format";
import { totalItemsSold, type ItemsSoldRow } from "@/lib/items-sold";

type ItemsSoldPanelProps = {
  rows: ItemsSoldRow[];
  /** Dims while the parent list refetches, matching the list's aria-busy treatment. */
  busy?: boolean;
};

/**
 * "How many of what plate were sold" across the currently filtered orders —
 * client request. Collapsed to the headline count by default so it never
 * crowds the order list; expand to see the per-item breakdown. Numbers track
 * the filters above (date, counter, source, payment), computed server-side.
 */
export function ItemsSoldPanel({ rows, busy }: ItemsSoldPanelProps) {
  const [open, setOpen] = useState(false);
  const total = totalItemsSold(rows);

  return (
    <section
      className={`overflow-hidden rounded-[24px] border border-black/5 bg-white transition-opacity ${
        busy ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
            <UtensilsCrossed className="h-4 w-4 text-neutral-700" />
          </span>
          <span>
            <span className="block text-sm font-medium text-neutral-900">Items sold</span>
            <span className="block text-xs text-neutral-500">
              {total} {total === 1 ? "plate" : "plates"} across {rows.length}{" "}
              {rows.length === 1 ? "item" : "items"}
            </span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-neutral-500" />
        )}
      </button>

      {open &&
        (rows.length === 0 ? (
          <p className="border-t border-black/5 px-5 py-4 text-sm text-neutral-500">
            No items sold for this filter yet.
          </p>
        ) : (
          <ul className="border-t border-black/5">
            {rows.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3 text-sm last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="w-8 shrink-0 text-right font-medium tabular-nums text-neutral-900">
                    {row.qty}
                  </span>
                  <span className="truncate text-neutral-700">{row.name}</span>
                </span>
                <span className="shrink-0 text-neutral-500 tabular-nums">
                  {formatLKR(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
