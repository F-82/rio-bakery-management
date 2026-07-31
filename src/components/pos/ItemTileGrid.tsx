"use client";

import { SearchX } from "lucide-react";
import type { PosMenuItem } from "@/lib/queries/menu";
import { ItemTile } from "./ItemTile";
import { EmptyState } from "@/components/patterns/EmptyState";
import { useTranslation } from "react-i18next";

type ItemTileGridProps = {
  items: PosMenuItem[];
  cartQtyFor: (menuItemId: string) => number;
  onAdd: (item: PosMenuItem) => void;
};

export function ItemTileGrid({ items, cartQtyFor, onAdd }: ItemTileGridProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        message={t("No items match. Try a different search or category.")}
      />
    );
  }

  return (
    <div className="pos-menu-grid">
      {items.map((item) => (
        <ItemTile
          key={item.id}
          item={item}
          qtyInCart={cartQtyFor(item.id)}
          onAdd={() => onAdd(item)}
        />
      ))}
    </div>
  );
}
