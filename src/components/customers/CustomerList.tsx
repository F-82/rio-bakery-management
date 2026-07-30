"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PriorityStar } from "@/components/patterns/PriorityStar";
import { formatDate } from "@/lib/format";
import type { CustomerListRow, PriorityCustomerRow } from "@/lib/queries/customers";
import { CustomerDetailDrawer } from "./CustomerDetailDrawer";

type Row = CustomerListRow | PriorityCustomerRow;

type CustomerListProps = {
  customers: Row[];
};

function starVariant(row: Row): "manual" | "derived" | "none" {
  if (row.is_priority) return "manual";
  if ("is_top_spender" in row && row.is_top_spender) return "derived";
  return "none";
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-2">
          <PriorityStar variant={starVariant(row)} />
          <div className="flex flex-col">
            <span className="text-body-sm text-ink">{row.name ?? "Unnamed"}</span>
            <span className="text-micro text-ink-2">{row.phone_e164}</span>
            {"priority_note" in row && row.priority_note && (
              <span className="text-micro italic text-ink-2">{row.priority_note}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "total_spend",
      header: "Total spend",
      render: (row) => <MoneyText amount={row.total_spend} />,
      align: "right",
    },
    {
      key: "loyalty_points",
      header: "Points",
      render: (row) => <span className="text-num text-ink">{row.loyalty_points}</span>,
      align: "right",
    },
    {
      key: "order_count",
      header: "Orders",
      render: (row) => <span className="text-num text-ink">{row.order_count}</span>,
      align: "right",
    },
    {
      key: "last_order_at",
      header: "Last order",
      render: (row) => (row.last_order_at ? formatDate(row.last_order_at, "date") : "—"),
    },
  ];

  return (
    <div className="p-4">
      {customers.length === 0 ? (
        <EmptyState icon={Users} message="No customers match these filters yet." />
      ) : (
        <DataTable
          columns={columns}
          rows={customers}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
        />
      )}

      <CustomerDetailDrawer
        customerId={selectedId}
        onClose={() => setSelectedId(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
