"use client";

import type { LucideIcon } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatSharePercent, type BreakdownRow } from "@/lib/reports";
import { useTranslation } from "react-i18next";

type BreakdownSectionProps = {
  icon: LucideIcon;
  title: string;
  rows: BreakdownRow[];
  totalRevenue: number;
};

const columns = (totalRevenue: number): DataTableColumn<BreakdownRow>[] => [
  { key: "label", header: "Label", render: (row) => row.label },
  { key: "orders", header: "Orders", align: "right", render: (row) => String(row.orderCount) },
  { key: "revenue", header: "Revenue", align: "right", render: (row) => <MoneyText amount={row.revenue} /> },
  {
    key: "share",
    header: "Share",
    align: "right",
    render: (row) => formatSharePercent(row.revenue, totalRevenue),
  },
];

export function BreakdownSection({ icon, title, rows, totalRevenue }: BreakdownSectionProps) {
    const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div className="flex items-center gap-3">
        <IconChip icon={icon} />
        <span className="text-h3 text-ink">{title}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-body-sm text-ink-2">{t("No completed orders in this period.")}</p>
      ) : (
        <DataTable columns={columns(totalRevenue)} rows={rows} getRowKey={(row) => row.key} />
      )}
    </div>
  );
}
