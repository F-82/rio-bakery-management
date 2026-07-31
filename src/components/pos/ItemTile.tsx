"use client";

import { formatLKR } from "@/lib/format";
import type { PosMenuItem } from "@/lib/queries/menu";
import { MainCategoryIcon } from "@/components/menu/MainCategoryIcon";

type ItemTileProps = {
  item: PosMenuItem;
  qtyInCart: number;
  onAdd: () => void;
};

/** Min 56px tall (DESIGN.md §Touch, a floor not a cap). Tapping adds to cart instantly — no round trip. */
export function ItemTile({ item, qtyInCart, onAdd }: ItemTileProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group rounded-tile bg-surface hover:bg-accent-tint focus-visible:ring-focus/20 relative flex min-h-28 min-w-0 flex-col justify-between gap-3 overflow-hidden p-3 text-left shadow-[0_1px_2px_rgba(10,11,13,0.04)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(10,11,13,0.08)] focus-visible:ring-2 active:translate-y-0 active:scale-[0.98]"
      aria-label={`${item.name}, ${formatLKR(item.price)}`}
    >
      <span className="flex w-full min-w-0 items-start justify-between gap-2">
        <span className="bg-surface-2 text-ink-2 group-hover:bg-surface flex min-h-8 min-w-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tabular-nums transition-colors">
          <MainCategoryIcon category={item.main_category} className="size-3.5 shrink-0" />
          <span>#{item.menu_number}</span>
        </span>
        {qtyInCart > 0 && (
          <span className="bg-ink text-on-black flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
            {qtyInCart}
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-end gap-1.5">
        {/* Three lines keep long size qualifiers visible without making every
            card a different height. */}
        <span className="text-body-sm text-ink line-clamp-3 font-medium">{item.name}</span>
        <span className="text-num text-ink-2">{formatLKR(item.price)}</span>
      </span>
    </button>
  );
}
