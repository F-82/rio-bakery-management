import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatDate } from "@/lib/format";
import type { TaxExpenseRow } from "@/lib/tax";
import { Wallet } from "lucide-react";

const COLUMNS: DataTableColumn<TaxExpenseRow>[] = [
  { key: "date", header: "Date", render: (row) => formatDate(row.date, "date") },
  { key: "category", header: "Category", render: (row) => row.category },
  { key: "amount", header: "Amount", align: "right", render: (row) => <MoneyText amount={row.amount} /> },
  { key: "note", header: "Note", render: (row) => row.note ?? "—" },
];

/** Itemised, not summarised — STEPS.md §16: "Itemised deductible expenses where is_tax_deductible". */
export function DeductibleExpensesTable({ expenses }: { expenses: TaxExpenseRow[] }) {
  if (expenses.length === 0) {
    return <EmptyState icon={Wallet} message="No deductible expenses recorded for this period." />;
  }

  return <DataTable columns={COLUMNS} rows={expenses} getRowKey={(row) => row.id} />;
}
