import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { MoneyText } from "@/components/patterns/MoneyText";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ReportOrder } from "@/lib/reports";
import { FileText } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  open: "secondary",
  completed: "default",
  voided: "destructive",
};

const COLUMNS: DataTableColumn<ReportOrder>[] = [
  { key: "order", header: "Order #", render: (row) => row.orderNumber },
  { key: "date", header: "Date", render: (row) => formatDate(row.createdAt, "datetime") },
  { key: "counter", header: "Counter", render: (row) => (row.counterKind ? <CounterBadge kind={row.counterKind} /> : "—") },
  { key: "source", header: "Source", render: (row) => row.source },
  { key: "payment", header: "Payment", render: (row) => row.paymentMethod ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>{row.status}</Badge>,
  },
  { key: "total", header: "Total", align: "right", render: (row) => <MoneyText amount={row.total} /> },
];

export function DetailTable({ orders }: { orders: ReportOrder[] }) {
  if (orders.length === 0) {
    return <EmptyState icon={FileText} message="No orders in this period yet." />;
  }

  return <DataTable columns={COLUMNS} rows={orders} getRowKey={(row) => row.id} />;
}
