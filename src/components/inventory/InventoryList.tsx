"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { LowStockBadge } from "@/components/patterns/LowStockBadge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/patterns/EmptyState";
import { formatQty } from "@/lib/format";
import { Package } from "lucide-react";
import type { InventoryCategory, InventoryListRow } from "@/lib/queries/inventory";
import { ItemDetailDrawer } from "./ItemDetailDrawer";

type InventoryListProps = {
  items: InventoryListRow[];
  categories: InventoryCategory[];
  canManage: boolean;
};

const STOCK_TYPE_LABELS: Record<string, string> = {
  ingredient: "Ingredient",
  finished_good: "Finished good",
  merchandise: "Merchandise",
};

export function InventoryList({ items, categories, canManage }: InventoryListProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<InventoryListRow | null>(null);

  function handleSaved() {
    router.refresh();
  }

  const columns: DataTableColumn<InventoryListRow>[] = [
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "category", header: "Category", render: (row) => row.category?.name ?? "—" },
    {
      key: "stock_type",
      header: "Type",
      render: (row) => STOCK_TYPE_LABELS[row.stock_type] ?? row.stock_type,
    },
    {
      key: "qty_on_hand",
      header: "On hand",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <span className={row.qty_on_hand < 0 ? "text-alert" : "text-ink"}>
            {formatQty(row.qty_on_hand, row.base_unit)}
          </span>
          <LowStockBadge qty={row.qty_on_hand} threshold={row.low_stock_threshold} />
        </div>
      ),
      align: "right",
    },
    {
      key: "active",
      header: "Status",
      render: (row) => (
        <Badge variant={row.active ? "secondary" : "outline"}>{row.active ? "Active" : "Inactive"}</Badge>
      ),
    },
  ];

  return (
    <div className="p-4">
      {items.length === 0 ? (
        <EmptyState icon={Package} message="No inventory items match these filters." />
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(row) => row.id}
          onRowClick={canManage ? (row) => setSelectedItem(row) : undefined}
        />
      )}

      {canManage && (
        <ItemDetailDrawer
          item={selectedItem}
          categories={categories}
          canManage={canManage}
          onClose={() => setSelectedItem(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
