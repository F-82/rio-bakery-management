"use client";

import { formatLKR } from "@/lib/format";
import type { PosMenuItem } from "@/lib/queries/menu";

type ItemTileProps = {
  item: PosMenuItem;
  qtyInCart: number;
  onAdd: () => void;
};

/** 56px tall (DESIGN.md §Touch). Tapping adds to cart instantly — no round trip. */
export function ItemTile({ item, qtyInCart, onAdd }: ItemTileProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative flex h-14 flex-col justify-center gap-0.5 rounded-tile bg-surface px-3 text-left active:scale-[0.98]"
    >
      <span className="truncate text-body-sm text-ink">{item.name}</span>
      <span className="text-num text-ink-2">{formatLKR(item.price)}</span>
      {qtyInCart > 0 && (
        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-on-black">
          {qtyInCart}
        </span>
      )}
    </button>
  );
}
