import type { PosMenuItem } from "@/lib/queries/menu";
import { ItemTile } from "./ItemTile";

type ItemTileGridProps = {
  items: PosMenuItem[];
  cartQtyFor: (menuItemId: string) => number;
  onAdd: (item: PosMenuItem) => void;
};

export function ItemTileGrid({ items, cartQtyFor, onAdd }: ItemTileGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ItemTile key={item.id} item={item} qtyInCart={cartQtyFor(item.id)} onAdd={() => onAdd(item)} />
      ))}
    </div>
  );
}
