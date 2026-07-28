import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatSharePercent } from "@/lib/reports";
import type { TaxCategoryBreakdownRow } from "@/lib/tax";

type CategoryBreakdownTableProps = {
  rows: TaxCategoryBreakdownRow[];
  grossRevenue: number;
};

const columns = (grossRevenue: number): DataTableColumn<TaxCategoryBreakdownRow>[] => [
  { key: "label", header: "Category", render: (row) => row.label },
  { key: "revenue", header: "Revenue", align: "right", render: (row) => <MoneyText amount={row.revenue} /> },
  {
    key: "share",
    header: "Share",
    align: "right",
    render: (row) => formatSharePercent(row.revenue, grossRevenue),
  },
];

/** Always 3 rows (standard/zero-rated/exempt), zero-filled — never fewer, so a category with no sales this period still shows as zero. */
export function CategoryBreakdownTable({ rows, grossRevenue }: CategoryBreakdownTableProps) {
  return <DataTable columns={columns(grossRevenue)} rows={rows} getRowKey={(row) => row.category} />;
}
