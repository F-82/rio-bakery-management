"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChefHat, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markOrderPrepared } from "@/lib/actions/kitchen";
import { formatDate, formatQty } from "@/lib/format";
import type { KitchenOrder } from "@/lib/queries/kitchen";
import { useTranslation } from "react-i18next";

export function KitchenQueue({ initialOrders }: { initialOrders: KitchenOrder[] }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-queue")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          const row = payload.new as {
            id: string;
            prep_status: KitchenOrder["prepStatus"];
            prepared_at: string | null;
          };
          setOrders((current) =>
            current.map((order) => {
              if (order.id !== row.id) return order;
              return { ...order, prepStatus: row.prep_status, preparedAt: row.prepared_at };
            }),
          );
          if (row.prep_status === "pending") {
            const { data } = await supabase
              .from("orders")
              .select(
                "id, order_number, created_at, prep_status, prepared_at, counters(name), order_items!inner(id, name_snapshot, qty, notes, requires_kitchen_prep)",
              )
              .eq("id", row.id)
              .eq("order_items.requires_kitchen_prep", true)
              .single();
            if (data) {
              setOrders((current) =>
                current.some((order) => order.id === data.id)
                  ? current
                  : [
                      ...current,
                      {
                        id: data.id,
                        orderNumber: data.order_number,
                        createdAt: data.created_at,
                        prepStatus: data.prep_status as "pending" | "prepared",
                        preparedAt: data.prepared_at,
                        counter: data.counters,
                        items: data.order_items.map((item) => ({
                          id: item.id,
                          name: item.name_snapshot,
                          qty: item.qty,
                          notes: item.notes,
                        })),
                      },
                    ],
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingOrders = orders.filter((order) => order.prepStatus === "pending");
  const preparedOrders = orders.filter((order) => order.prepStatus === "prepared");

  function prepare(orderId: string) {
    setError(null);
    startTransition(async () => {
      const result = await markOrderPrepared(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, prepStatus: "prepared", preparedAt: new Date().toISOString() }
            : order,
        ),
      );
    });
  }

  return (
    <>
      <section>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{t("Rio Bakers Hut")}</span>
          <span>/</span>
          <span className="font-medium text-neutral-800">{t("Kitchen")}</span>
        </div>
        <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">
          {t("Hot plate queue")}
        </h1>
      </section>

      {error && <p className="rounded-tile bg-alert-bg text-alert-strong p-3 text-sm">{error}</p>}

      <QueueSection
        emptyMessage={t("No food is waiting to be prepared.")}
        icon={Clock}
        orders={pendingOrders}
        onPrepare={prepare}
        pending={isPending}
        title={`${t("Pending")} · ${pendingOrders.length}`}
      />

      <QueueSection
        emptyMessage={t("Prepared orders will appear here.")}
        icon={Check}
        orders={preparedOrders}
        pending={false}
        title={`${t("Prepared")} · ${preparedOrders.length}`}
      />
    </>
  );
}

function QueueSection({
  emptyMessage,
  icon: Icon,
  orders,
  onPrepare,
  pending,
  title,
}: {
  emptyMessage: string;
  icon: typeof Clock;
  orders: KitchenOrder[];
  onPrepare?: (orderId: string) => void;
  pending: boolean;
  title: string;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-medium">{title}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center text-sm text-neutral-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[24px] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-3xl font-light tracking-tight">#{order.orderNumber}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {order.counter?.name ?? t("Counter")} · {formatDate(order.createdAt, "time")}
                  </div>
                </div>
                <ChefHat className="h-5 w-5 text-neutral-400" />
              </div>
              <ul className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <span>
                      {item.name}
                      {item.notes && (
                        <span className="block text-xs text-neutral-500">{item.notes}</span>
                      )}
                    </span>
                    <span className="tabular-nums">× {formatQty(item.qty)}</span>
                  </li>
                ))}
              </ul>
              {onPrepare && (
                <button
                  className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
                  disabled={pending}
                  onClick={() => onPrepare(order.id)}
                >
                  <Check className="h-4 w-4" />
                  {t("Mark prepared")}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
