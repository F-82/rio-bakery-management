"use client";

import { UtensilsCrossed } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { ExportActions } from "@/components/patterns/ExportActions";
import { buildItemsSoldCsv, formatSharePercent } from "@/lib/reports";
import { totalItemsSold, type ItemsSoldRow } from "@/lib/items-sold";
import { useTranslation } from "react-i18next";

type ItemsSoldBreakdownProps = {
  rows: ItemsSoldRow[];
  filename: string;
};

const columns = (totalQty: number): DataTableColumn<ItemsSoldRow>[] => [
  { key: "item", header: "Item", render: (row) => row.name },
  { key: "qty", header: "Sold", align: "right", render: (row) => String(row.qty) },
  {
    key: "revenue",
    header: "Revenue",
    align: "right",
    render: (row) => <MoneyText amount={row.revenue} />,
  },
  {
    key: "share",
    header: "Share",
    align: "right",
    render: (row) => formatSharePercent(row.qty, totalQty),
  },
];

/**
 * "How many of what plate were sold" for the sales period — completed orders
 * only, so the quantities reconcile with the revenue cards above. Share is a
 * fraction of total plates sold, not revenue, so a cheap high-volume item
 * reads as the mover it is.
 */
export function ItemsSoldBreakdown({ rows, filename }: ItemsSoldBreakdownProps) {
  const { t } = useTranslation();
  const totalQty = totalItemsSold(rows);

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip icon={UtensilsCrossed} />
          <span className="text-h3 text-ink">{t("By item")}</span>
        </div>
        {rows.length > 0 && (
          <ExportActions getCsv={() => buildItemsSoldCsv(rows)} filename={filename} />
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-body-sm text-ink-2">{t("No completed orders in this period.")}</p>
      ) : (
        <DataTable columns={columns(totalQty)} rows={rows} getRowKey={(row) => row.name} />
      )}
    </div>
  );
}
