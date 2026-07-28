"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Receipt, CheckCircle2, Clock, XCircle, Package, CalendarDays, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reprintJob } from "@/lib/actions/print";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { StatCard } from "@/components/patterns/StatCard";
import { IconChip } from "@/components/patterns/IconChip";
import { MoneyText } from "@/components/patterns/MoneyText";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import { Button } from "@/components/ui/button";
import {
  colomboToday,
  countLowStock,
  getUnresolvedPrintFailures,
  sumCompletedRevenue,
  summariseOrders,
  type DashboardOrder,
  type DashboardPrintJob,
  type StockLevel,
} from "@/lib/dashboard";

type DashboardClientProps = {
  initialOrders: DashboardOrder[];
  initialPrintJobs: DashboardPrintJob[];
  initialStockLevels: StockLevel[];
  expensesToday: number;
};

const PRINT_TARGET_LABELS: Record<string, string> = {
  customer_receipt: "Customer receipt",
  kitchen_ticket: "Kitchen ticket",
};

/**
 * Server-fetched initial rows, then patched live via Realtime (same model as
 * OrdersList, step 09) so the owner never has to refresh to see a new sale,
 * a resolved print failure, or a stock level cross the low-stock threshold.
 * Every figure is derived from these three maps by the shared pure functions
 * in lib/dashboard.ts — the same code runs on first render and after every
 * patch, so the two can't drift apart.
 */
export function DashboardClient({
  initialOrders,
  initialPrintJobs,
  initialStockLevels,
  expensesToday,
}: DashboardClientProps) {
  const [orders, setOrders] = useState(() => new Map(initialOrders.map((order) => [order.id, order])));
  const [printJobs, setPrintJobs] = useState(() => new Map(initialPrintJobs.map((job) => [job.id, job])));
  const [stockLevels, setStockLevels] = useState(
    () => new Map(initialStockLevels.map((level) => [level.id, level])),
  );

  // Lets the print_jobs INSERT handler check order membership without
  // nesting a setOrders call inside another setState updater.
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    const supabase = createClient();
    const today = colomboToday();

    const channel = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as {
          id: string;
          status: DashboardOrder["status"];
          total: number;
          order_number: string;
          order_day: string;
        };
        if (row.order_day !== today) return;
        setOrders((current) => {
          const next = new Map(current);
          next.set(row.id, { id: row.id, status: row.status, total: row.total, orderNumber: row.order_number, orderDay: row.order_day });
          return next;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as {
          id: string;
          status: DashboardOrder["status"];
          total: number;
          order_number: string;
          order_day: string;
        };
        setOrders((current) => {
          if (!current.has(row.id) && row.order_day !== today) return current;
          const next = new Map(current);
          next.set(row.id, { id: row.id, status: row.status, total: row.total, orderNumber: row.order_number, orderDay: row.order_day });
          return next;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "print_jobs" }, (payload) => {
        const row = payload.new as {
          id: string;
          order_id: string;
          target: DashboardPrintJob["target"];
          status: DashboardPrintJob["status"];
          last_error: string | null;
          created_at: string;
        };
        if (!ordersRef.current.has(row.order_id)) return;
        setPrintJobs((current) => {
          const next = new Map(current);
          next.set(row.id, {
            id: row.id,
            orderId: row.order_id,
            target: row.target,
            status: row.status,
            lastError: row.last_error,
            createdAt: row.created_at,
          });
          return next;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "print_jobs" }, (payload) => {
        const row = payload.new as {
          id: string;
          order_id: string;
          target: DashboardPrintJob["target"];
          status: DashboardPrintJob["status"];
          last_error: string | null;
          created_at: string;
        };
        setPrintJobs((current) => {
          if (!current.has(row.id)) return current;
          const next = new Map(current);
          next.set(row.id, {
            id: row.id,
            orderId: row.order_id,
            target: row.target,
            status: row.status,
            lastError: row.last_error,
            createdAt: row.created_at,
          });
          return next;
        });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        (payload) => {
          const row = payload.new as { id: string; qty_on_hand: number; low_stock_threshold: number };
          setStockLevels((current) => {
            const next = new Map(current);
            next.set(row.id, { id: row.id, qtyOnHand: row.qty_on_hand, lowStockThreshold: row.low_stock_threshold });
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const orderList = useMemo(() => [...orders.values()], [orders]);
  const ordersSummary = useMemo(() => summariseOrders(orderList), [orderList]);
  const income = useMemo(() => sumCompletedRevenue(orderList), [orderList]);
  const netProfit = useMemo(() => income.minus(expensesToday), [income, expensesToday]);
  const orderNumbers = useMemo(() => new Map(orderList.map((order) => [order.id, order.orderNumber])), [orderList]);
  const unresolvedFailures = useMemo(
    () => getUnresolvedPrintFailures([...printJobs.values()], orderNumbers),
    [printJobs, orderNumbers],
  );
  const lowStockCount = useMemo(() => countLowStock([...stockLevels.values()]), [stockLevels]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <span className="text-micro text-ink-2">Today&apos;s sales</span>
        {/* The one AccentPanel this screen gets (DESIGN.md §Structural language) */}
        <AccentPanel>
          <MoneyText amount={income} size="num-lg" />
        </AccentPanel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Receipt} label="Total orders" value={String(ordersSummary.total)} />
        <StatCard icon={CheckCircle2} label="Completed" value={String(ordersSummary.completed)} />
        <StatCard icon={Clock} label="Pending" value={String(ordersSummary.pending)} />
        <StatCard icon={XCircle} label="Cancelled" value={String(ordersSummary.cancelled)} />
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-6">
        <IconChip icon={TrendingUp} />
        <span className="text-micro text-ink-2">Net profit today (estimated)</span>
        <MoneyText amount={netProfit} size="num-lg" />
        <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-ink-2">Income</span>
            <MoneyText amount={income} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label text-ink-2">Expenses</span>
            <MoneyText amount={expensesToday} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-card bg-surface p-6">
          <IconChip icon={Package} />
          <span className="text-micro text-ink-2">Low stock</span>
          <div className="flex items-center justify-between gap-3">
            <span className="text-num-lg text-ink">
              {lowStockCount === 0 ? "All stocked up" : `${lowStockCount} item${lowStockCount === 1 ? "" : "s"}`}
            </span>
            {lowStockCount > 0 && (
              <Button asChild variant="outline">
                <Link href="/inventory?lowStock=1">View</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-card bg-surface p-6">
          <IconChip icon={CalendarDays} />
          <span className="text-micro text-ink-2">Today&apos;s bookings</span>
          <p className="text-body text-ink-2">Bookings tracking lands in step 17.</p>
        </div>
      </div>

      {unresolvedFailures.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-micro text-ink-2">Failed prints</span>
          <div className="flex flex-col gap-2">
            {unresolvedFailures.map((failure) => (
              <div
                key={failure.id}
                className="flex flex-col gap-2 rounded-card bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-h3 text-ink">{failure.orderNumber}</span>
                  <span className="text-label text-ink-2">
                    {PRINT_TARGET_LABELS[failure.target] ?? failure.target}
                  </span>
                </div>
                <PrintStatus status="failed" onReprint={() => reprintJob(failure.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
