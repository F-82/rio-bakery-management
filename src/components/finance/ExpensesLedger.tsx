"use client";

import { Wallet } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { MoneyText } from "@/components/patterns/MoneyText";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/patterns/PageHeader";
import { AddExpenseDrawer } from "./AddExpenseDrawer";
import { formatDate } from "@/lib/format";
import type { ExpenseRow } from "@/lib/queries/finance";
import { useTranslation } from "react-i18next";

type ExpensesLedgerProps = {
  expenses: ExpenseRow[];
  categories: string[];
  businessId: string;
  /** Owner only (expenses_write RLS) — manager can read the ledger but not add to it. */
  canAdd: boolean;
};

const COLUMNS: DataTableColumn<ExpenseRow>[] = [
  { key: "date", header: "Date", render: (row) => formatDate(row.date, "date") },
  { key: "category", header: "Category", render: (row) => row.category },
  { key: "amount", header: "Amount", align: "right", render: (row) => <MoneyText amount={row.amount} /> },
  { key: "note", header: "Note", render: (row) => row.note ?? "—" },
  {
    key: "deductible",
    header: "Tax deductible",
    render: (row) => <Badge variant={row.isTaxDeductible ? "default" : "secondary"}>{row.isTaxDeductible ? "Yes" : "No"}</Badge>,
  },
  {
    key: "receipt",
    header: "Receipt",
    render: (row) =>
      row.receiptUrl ? (
        <a href={row.receiptUrl} target="_blank" rel="noreferrer" className="text-body-sm text-accent underline">
          {t("View")}</a>
      ) : (
        "—"
      ),
  },
];

export function ExpensesLedger({ expenses, categories, businessId, canAdd }: ExpensesLedgerProps) {
    const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <PageHeader
        title={t("Expenses")}
        actions={canAdd ? <AddExpenseDrawer businessId={businessId} categories={categories} /> : undefined}
      />
      {expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          message={canAdd ? "No expenses recorded yet. Add the first one." : "No expenses recorded yet."}
        />
      ) : (
        <DataTable columns={COLUMNS} rows={expenses} getRowKey={(row) => row.id} />
      )}
    </div>
  );
}
