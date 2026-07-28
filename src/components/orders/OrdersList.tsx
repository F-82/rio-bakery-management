"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { MoneyText } from "@/components/patterns/MoneyText";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { OrderListRow, OrdersFilter } from "@/lib/queries/orders";
import type { ActiveCounter } from "@/lib/queries/counters";
import type { Database } from "@/types/database";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

type OrdersListProps = {
  initialOrders: OrderListRow[];
  filter: OrdersFilter;
  counters: ActiveCounter[];
  canVoid: boolean;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  open: "secondary",
  completed: "default",
  voided: "destructive",
};

type RealtimeOrderRow = {
  id: string;
  order_number: string;
  status: Database["public"]["Enums"]["order_status"];
  source: string;
  payment_method: string | null;
  total: number;
  created_at: string;
  counter_id: string | null;
};

function matchesFilter(row: RealtimeOrderRow, filter: OrdersFilter): boolean {
  if (filter.tab === "active") {
    if (row.status !== "open" && row.status !== "completed") return false;
    if (filter.status && row.status !== filter.status) return false;
  } else if (row.status !== "voided") {
    return false;
  }
  if (filter.counterId && row.counter_id !== filter.counterId) return false;
  if (filter.source && row.source !== filter.source) return false;
  if (filter.paymentMethod && row.payment_method !== filter.paymentMethod) return false;
  if (filter.dateFrom && row.created_at < `${filter.dateFrom}T00:00:00`) return false;
  if (filter.dateTo && row.created_at > `${filter.dateTo}T23:59:59`) return false;
  if (filter.search && !row.order_number.includes(filter.search)) return false;
  return true;
}

/**
 * Server-fetched initial list, then patched live via Realtime — both tills
 * see each other's orders without a refresh. Realtime authorizes every event
 * against the subscriber's own RLS, so staff only ever receive events for
 * rows they could already SELECT (see 20260727053426_orders_realtime.sql).
 */
export function OrdersList({ initialOrders, filter, counters, canVoid }: OrdersListProps) {
  // `initialOrders` only ever changes when the parent remounts this
  // component with a new `key` (see page.tsx) after a filter change, so a
  // plain useState initializer is enough — no sync-on-prop-change effect.
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as RealtimeOrderRow;
          if (!matchesFilter(row, filter)) return;
          const counter = counters.find((c) => c.id === row.counter_id) ?? null;
          setOrders((current) => [{ ...row, counter }, ...current]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as RealtimeOrderRow;
          setOrders((current) => {
            if (!matchesFilter(row, filter)) {
              return current.filter((order) => order.id !== row.id);
            }
            const counter = counters.find((c) => c.id === row.counter_id) ?? null;
            const updated: OrderListRow = { ...row, counter };
            const exists = current.some((order) => order.id === row.id);
            return exists
              ? current.map((order) => (order.id === row.id ? updated : order))
              : [updated, ...current];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, counters]);

  const columns: DataTableColumn<OrderListRow>[] = [
    {
      key: "order_number",
      header: "Order",
      // The order number at display size — the one signature moment,
      // identical treatment on the confirm screen, receipt and KOT.
      render: (row) => <span className="text-display text-ink">{row.order_number}</span>,
    },
    {
      key: "counter",
      header: "Counter",
      render: (row) => (row.counter ? <CounterBadge kind={row.counter.kind} /> : "—"),
    },
    { key: "source", header: "Source", render: (row) => row.source },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>{row.status}</Badge>,
    },
    { key: "payment_method", header: "Payment", render: (row) => row.payment_method ?? "—" },
    { key: "created_at", header: "Time", render: (row) => formatDate(row.created_at, "datetime") },
    {
      key: "total",
      header: "Total",
      render: (row) => <MoneyText amount={row.total} />,
      align: "right",
    },
  ];

  return (
    <div className="p-4">
      {orders.length === 0 ? (
        <EmptyState icon={Inbox} message="No orders match these filters." />
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedOrderId(row.id)}
        />
      )}

      <OrderDetailDrawer orderId={selectedOrderId} canVoid={canVoid} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
}
