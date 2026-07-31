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
      className="rounded-tile bg-surface relative flex min-h-14 flex-col justify-center gap-0.5 px-3 py-2 text-left active:scale-[0.98]"
    >
      {/* line-clamp-2, not truncate — the (Half)/(Full) qualifier at the end of
          a long name is exactly the part staff can't afford to have clipped. */}
      <span className="text-body-sm text-ink flex items-start gap-1.5">
        <MainCategoryIcon category={item.main_category} className="mt-0.5" />
        <span className="line-clamp-2">{item.name}</span>
      </span>
      <span className="text-num text-ink-2">{formatLKR(item.price)}</span>
      {qtyInCart > 0 && (
        <span className="bg-ink text-on-black absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full text-[11px]">
          {qtyInCart}
        </span>
      )}
    </button>
  );
}
