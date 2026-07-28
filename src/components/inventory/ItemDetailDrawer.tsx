"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LowStockBadge } from "@/components/patterns/LowStockBadge";
import { formatDate, formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchStockMovements, type StockMovementRow } from "@/lib/inventory-detail";
import { updateInventoryItem } from "@/lib/actions/inventory";
import type { InventoryCategory, InventoryListRow } from "@/lib/queries/inventory";
import { ItemForm } from "./ItemForm";
import { StockEntryForm } from "./StockEntryForm";
import { useTranslation } from "react-i18next";

type ItemDetailDrawerProps = {
  item: InventoryListRow | null;
  categories: InventoryCategory[];
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function ItemDetailDrawer({ item, categories, canManage, onClose, onSaved }: ItemDetailDrawerProps) {
    const { t } = useTranslation();
  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("Item detail")}</SheetTitle>
        </SheetHeader>
        {/* Keyed by item id so switching items remounts fresh state instead
            of a reset effect for qty/history. */}
        {item && (
          <ItemDetailContent
            key={item.id}
            item={item}
            categories={categories}
            canManage={canManage}
            onSaved={onSaved}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

const REASON_LABELS: Record<string, string> = {
  purchase: "Purchase",
  wastage: "Wastage",
  manual_adjustment: "Adjustment",
  stocktake: "Stocktake",
  order_deduction: "Order",
  order_void: "Order void",
};

function ItemDetailContent({
  item,
  categories,
  canManage,
  onSaved,
  onClose,
}: {
  item: InventoryListRow;
  categories: InventoryCategory[];
  canManage: boolean;
  onSaved: () => void;
  onClose: () => void;
}) {
    const { t } = useTranslation();
  const [qtyOnHand, setQtyOnHand] = useState(item.qty_on_hand);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(canManage);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    const supabase = createClient();
    fetchStockMovements(supabase, item.id).then((rows) => {
      if (!cancelled) {
        setMovements(rows);
        setLoadingHistory(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, canManage]);

  async function handleRecorded(result: { delta: number; qtyOnHand: number }) {
    setQtyOnHand(result.qtyOnHand);
    const supabase = createClient();
    setMovements(await fetchStockMovements(supabase, item.id));
    onSaved();
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <div>
        <p className="text-micro text-ink-2">{item.category?.name ?? "Uncategorised"}</p>
        <p className="text-h1 text-ink">{item.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-num-lg text-ink">{formatQty(qtyOnHand, item.base_unit)}</span>
          <LowStockBadge qty={qtyOnHand} threshold={item.low_stock_threshold} unit={item.base_unit} />
        </div>
      </div>

      {canManage && (
        <div className="flex flex-col gap-2">
          <h3 className="text-h3 text-ink">{t("Record stock movement")}</h3>
          <StockEntryForm
            inventoryItemId={item.id}
            unit={item.base_unit}
            currentQty={qtyOnHand}
            onRecorded={handleRecorded}
          />
        </div>
      )}

      {canManage && (
        <div className="flex flex-col gap-2">
          <h3 className="text-h3 text-ink">{t("Movement history")}</h3>
          {loadingHistory ? (
            <p className="text-body-sm text-ink-2">{t("Loading…")}</p>
          ) : movements.length === 0 ? (
            <p className="text-body-sm text-ink-2">{t("No movements yet.")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 rounded-tile bg-surface p-3"
                >
                  <div>
                    <p className="text-body-sm text-ink">
                      {REASON_LABELS[movement.reason] ?? movement.reason}
                      {movement.orderNumber ? ` — #${movement.orderNumber}` : ""}
                    </p>
                    {movement.note && <p className="text-micro text-ink-2">{movement.note}</p>}
                    <p className="text-micro text-ink-2">{formatDate(movement.createdAt, "datetime")}</p>
                  </div>
                  <span className={cn("text-num", movement.delta < 0 ? "text-alert" : "text-pos")}>
                    {movement.delta > 0 ? "+" : ""}
                    {formatQty(movement.delta, item.base_unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canManage && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <h3 className="text-h3 text-ink">{t("Edit item")}</h3>
          <ItemForm
            initial={item}
            categories={categories}
            onSubmit={(input) => updateInventoryItem(item.id, input)}
            onSuccess={() => {
              onSaved();
              onClose();
            }}
            submitLabel="Save changes"
          />
        </div>
      )}
    </div>
  );
}
