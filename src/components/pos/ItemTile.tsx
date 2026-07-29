"use client";

import { formatLKR } from "@/lib/format";
import type { PosMenuItem } from "@/lib/queries/menu";

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
      className="relative flex min-h-14 flex-col justify-center gap-0.5 rounded-tile bg-surface px-3 py-2 text-left active:scale-[0.98]"
    >
      {/* line-clamp-2, not truncate — the (Half)/(Full) qualifier at the end of
          a long name is exactly the part staff can't afford to have clipped. */}
      <span className="line-clamp-2 text-body-sm text-ink">{item.name}</span>
      <span className="text-num text-ink-2">{formatLKR(item.price)}</span>
      {qtyInCart > 0 && (
        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-on-black">
          {qtyInCart}
        </span>
      )}
    </button>
  );
}
